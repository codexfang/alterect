from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_token, get_current_user
from app.models import User, Project, Drawing, Change, AlertSubscription, Notification
from app.schemas import (
    LoginRequest, SignupRequest, AuthResponse, UserResponse,
    ProjectCreate, ProjectResponse,
    DrawingResponse, ChangeResponse, DiffResponse, TimelineEntry,
    SubscribeRequest, AlertSubscriptionResponse, NotificationResponse,
    QueryRequest, QueryResponse,
)
from app.services.diff_engine import generate_diff_mock
from app.services.ml_predict import calculate_risk_score
from app.services.pdf_parser import parse_pdf, extract_sheet_name, extract_revision

router = APIRouter()


# === Auth ===
@router.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id)
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id)
    return AuthResponse(token=token, user=UserResponse.model_validate(user))


@router.get("/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


# === Projects ===
@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    req: ProjectCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(name=req.name, owner_id=user_id)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.owner_id == user_id))
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


# === Drawings ===
@router.post("/drawings/upload", response_model=DrawingResponse)
async def upload_drawing(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    revision: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    sheet_name = extract_sheet_name(file.filename or "drawing.pdf")
    rev = revision or extract_revision(file.filename or "drawing.pdf")

    # Parse PDF metadata
    pdf_data = parse_pdf(file_bytes)

    # Store file URL (mock — in production, upload to S3)
    file_url = f"drawings/{project_id}/{sheet_name}_{rev}.pdf"

    drawing = Drawing(
        project_id=project_id,
        sheet_name=sheet_name,
        revision=rev,
        file_url=file_url,
        file_hash=pdf_data["hash"],
        page_count=pdf_data["page_count"],
        uploaded_by=user_id,
    )
    db.add(drawing)
    await db.commit()
    await db.refresh(drawing)

    return DrawingResponse.model_validate(drawing)


@router.get("/drawings", response_model=List[DrawingResponse])
async def list_drawings(
    project_id: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Drawing)
    if project_id:
        query = query.where(Drawing.project_id == project_id)
    result = await db.execute(query)
    drawings = result.scalars().all()
    return [DrawingResponse.model_validate(d) for d in drawings]


@router.post("/drawings/diff", response_model=dict)
async def diff_drawings(
    drawing_id_1: str,
    drawing_id_2: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    d1 = await db.execute(select(Drawing).where(Drawing.id == drawing_id_1))
    d2 = await db.execute(select(Drawing).where(Drawing.id == drawing_id_2))
    drawing_1 = d1.scalar_one_or_none()
    drawing_2 = d2.scalar_one_or_none()
    if not drawing_1 or not drawing_2:
        raise HTTPException(status_code=404, detail="Drawing not found")

    diff = generate_diff_mock(drawing_id_1, drawing_id_2, drawing_2.sheet_name)

    # Save changes to DB
    saved_changes = []
    for chg in diff["changes"]:
        change = Change(
            drawing_id=drawing_id_2,
            previous_revision=drawing_1.revision,
            change_type=chg["change_type"],
            coordinates=chg.get("coordinates"),
            trade=chg["trade"],
            severity=chg["severity"],
            description=chg.get("description"),
            confidence=chg.get("confidence", 0.0),
        )
        db.add(change)
        await db.flush()
        chg["id"] = change.id
        chg["drawing_id"] = change.drawing_id
        saved_changes.append(ChangeResponse.model_validate(change))

    # Calculate risk score
    risk = calculate_risk_score(diff["changes"])

    await db.commit()

    return {
        "sheet_id": diff["sheet_id"],
        "changes": [c.model_dump() for c in saved_changes],
        "summary": diff["summary"],
        "risk": risk,
    }


@router.get("/drawings/{drawing_id}", response_model=DrawingResponse)
async def get_drawing(drawing_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Drawing).where(Drawing.id == drawing_id))
    drawing = result.scalar_one_or_none()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    return DrawingResponse.model_validate(drawing)


@router.get("/drawings/{drawing_id}/timeline", response_model=List[TimelineEntry])
async def get_timeline(drawing_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Drawing).where(Drawing.id == drawing_id).order_by(Drawing.created_at)
    )
    drawings = result.scalars().all()
    entries = []
    for d in drawings:
        chg_count = await db.execute(
            select(Change).where(Change.drawing_id == d.id)
        )
        entries.append(TimelineEntry(
            id=d.id,
            revision=d.revision,
            created_at=d.created_at,
            change_count=len(chg_count.scalars().all()),
            uploaded_by=d.uploaded_by,
        ))
    return entries


@router.get("/drawings/{drawing_id}/changes", response_model=List[ChangeResponse])
async def get_changes(
    drawing_id: str,
    since_revision: Optional[str] = None,
    trade_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Change).where(Change.drawing_id == drawing_id)
    if since_revision:
        query = query.where(Change.previous_revision == since_revision)
    if trade_filter:
        trades = [t.strip() for t in trade_filter.split(",")]
        query = query.where(Change.trade.in_(trades))
    result = await db.execute(query)
    changes = result.scalars().all()
    return [ChangeResponse.model_validate(c) for c in changes]


# === Alerts ===
@router.post("/alerts/subscribe", response_model=AlertSubscriptionResponse)
async def subscribe(
    req: SubscribeRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = AlertSubscription(
        project_id=req.project_id,
        user_id=user_id,
        trade=req.trade,
        webhook_url=req.webhook_url,
        email=req.email,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return AlertSubscriptionResponse.model_validate(sub)


@router.get("/projects/{project_id}/alerts", response_model=List[NotificationResponse])
async def get_alerts(
    project_id: str,
    trade_filter: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Notification)
        .join(Change, Notification.change_id == Change.id)
        .join(Drawing, Change.drawing_id == Drawing.id)
        .where(Drawing.project_id == project_id, Notification.user_id == user_id)
    )
    if trade_filter:
        trades = [t.strip() for t in trade_filter.split(",")]
        query = query.where(Change.trade.in_(trades))
    query = query.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    notifications = result.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.put("/alerts/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == alert_id, Notification.user_id == user_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Alert not found")
    notification.is_read = True
    await db.commit()
    return {"status": "ok"}


@router.put("/projects/{project_id}/alerts/read-all")
async def mark_all_read(
    project_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Notification)
        .join(Change, Notification.change_id == Change.id)
        .join(Drawing, Change.drawing_id == Drawing.id)
        .where(Drawing.project_id == project_id, Notification.user_id == user_id, Notification.is_read == False)
    )
    result = await db.execute(query)
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()
    return {"status": "ok", "marked": len(notifications)}


# === Natural Language Query ===
@router.post("/query/natural", response_model=QueryResponse)
async def natural_query(
    req: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process natural language query about drawing changes."""
    from app.core.config import settings

    query_lower = req.query.lower()

    # Determine trade filter from query
    trade_map = {
        "electrical": "electrical",
        "electric": "electrical",
        "plumbing": "plumbing",
        "plumber": "plumbing",
        "structural": "structural",
        "structure": "structural",
        "hvac": "hvac",
        "mechanical": "hvac",
    }

    detected_trade = None
    for keyword, trade in trade_map.items():
        if keyword in query_lower:
            detected_trade = trade
            break

    location = None
    for loc in ["floor 1", "floor 2", "floor 3", "south", "north", "east", "west", "stairwell", "lobby"]:
        if loc in query_lower:
            location = loc
            break

    # Fetch recent changes
    changes_result = await db.execute(
        select(Change).order_by(Change.created_at.desc()).limit(20)
    )
    changes = changes_result.scalars().all()

    filtered_changes = changes
    if detected_trade:
        filtered_changes = [c for c in changes if c.trade == detected_trade]

    if not settings.OPENAI_API_KEY:
        # Mock response
        trade_str = detected_trade or "all"
        loc_str = f" on {location}" if location else ""
        return QueryResponse(
            answer=f"I found {len(filtered_changes)} {trade_str} changes{loc_str}.",
            relevant_changes=[ChangeResponse.model_validate(c) for c in filtered_changes[:5]],
            explanation=f"Showing {min(len(filtered_changes), 5)} of {len(filtered_changes)} relevant changes.",
        )

    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    changes_text = "\n".join([
        f"- {c.change_type} ({c.severity} severity, {c.trade}): {c.description}"
        for c in filtered_changes[:10]
    ])

    prompt = f"""You are an AI assistant for a construction drawing version control system. Answer the user's question based on the available changes.

User query: "{req.query}"

Available changes:
{changes_text}

Provide a concise, helpful response. Include specific change details when relevant. If the query mentions a location not in the data, note that clearly."""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    return QueryResponse(
        answer=response.choices[0].message.content,
        relevant_changes=[ChangeResponse.model_validate(c) for c in filtered_changes[:5]],
        explanation=f"Retrieved {len(filtered_changes)} relevant changes from database.",
    )


# === Webhooks ===
@router.post("/webhooks/procore")
async def procore_webhook(payload: dict):
    """Receive drawing updates from Procore."""
    # Process Procore webhook payload
    # Extract drawing file URL, project info, etc.
    # Queue Celery task for ingestion
    return {"status": "received", "event": payload.get("event_type", "unknown")}
