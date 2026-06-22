import logging
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/drawings-proxy", tags=["drawings-proxy"])

_SUPABASE_REST_URL: str | None = None
_SUPABASE_KEY: str | None = None
_SUPABASE_STORAGE_URL: str | None = None

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    _SUPABASE_REST_URL = f"{settings.SUPABASE_URL}/rest/v1"
    _SUPABASE_STORAGE_URL = f"{settings.SUPABASE_URL}/storage/v1"
    _SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY.strip()


def _headers():
    return {
        "apikey": _SUPABASE_KEY,
        "Authorization": f"Bearer {_SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


_DISCIPLINE_KEYWORDS = {
    "architectural": ["arch", "archi", "plan", "elevation", "section", "floorplan", "floor_plan", "a-"],
    "structural": ["struc", "struct", "column", "beam", "foundation", "framing", "s-"],
    "electrical": ["elec", "electric", "power", "lighting", "conduit", "panel", "e-"],
    "mechanical": ["mech", "hvac", "duct", "exhaust", "supply", "m-"],
    "plumbing": ["plumb", "pipe", "drain", "water", "sewer", "gas", "p-"],
    "civil": ["civil", "site", "grading", "road", "utility", "c-"],
}


def auto_detect_discipline(filename: str) -> str:
    """Detect discipline from filename based on common prefixes and keywords."""
    name = filename.lower().replace("_", " ").replace("-", " ").replace(".", " ")
    for discipline, keywords in _DISCIPLINE_KEYWORDS.items():
        for kw in keywords:
            if kw in name:
                return discipline
    return ""


@router.post("/upload")
async def upload_drawing(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    discipline: str = Form(""),
):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()
    file_bytes = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    file_path = f"{user_id}/{uuid.uuid4()}.{ext}"
    sheet_name = file.filename.replace(f".{ext}", "") if file.filename else "Untitled"

    async with httpx.AsyncClient() as client:
        # 1. Upload file to Supabase Storage
        storage_resp = await client.post(
            f"{_SUPABASE_STORAGE_URL}/object/drawings/{file_path}",
            headers={**_headers(), "Content-Type": "application/octet-stream"},
            content=file_bytes,
        )
        if storage_resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=500,
                detail=f"Storage upload failed (status {storage_resp.status_code}): {storage_resp.text}",
            )

        file_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/drawings/{file_path}"

        # 2. Check if user already has a drawing (single-drawing model)
        existing_drawings = []
        try:
            all_resp = await client.get(
                f"{_SUPABASE_REST_URL}/drawings",
                headers=headers,
                params={"user_id": f"eq.{user_id}", "select": "*", "limit": "1"},
            )
            if all_resp.status_code == 200:
                existing_drawings = all_resp.json()
        except Exception:
            pass

        if existing_drawings:
            # New revision for same drawing — every upload increments the rev
            drawing = existing_drawings[0]
            drawing_id = drawing["id"]

            rev_resp = await client.get(
                f"{_SUPABASE_REST_URL}/revisions",
                headers=headers,
                params={"drawing_id": f"eq.{drawing_id}", "select": "revision_number", "order": "revision_number.desc", "limit": "1"},
            )
            existing_revs = rev_resp.json() if rev_resp.status_code == 200 else []
            next_rev = (existing_revs[0]["revision_number"] + 1) if existing_revs else 1

            revision_resp = await client.post(
                f"{_SUPABASE_REST_URL}/revisions",
                headers={**headers, "Prefer": "return=representation"},
                json={
                    "drawing_id": drawing_id,
                    "revision_number": next_rev,
                    "file_url": file_url,
                    "uploaded_by": user_id,
                    "notes": f"Revision {next_rev}",
                },
            )
            if revision_resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=500,
                    detail=f"Revision creation failed (status {revision_resp.status_code}): {revision_resp.text}",
                )

            revision = revision_resp.json()[0]

            patch_data = {"file_url": file_url, "current_revision": next_rev, "sheet_name": sheet_name}
            if not drawing.get("discipline"):
                detected = auto_detect_discipline(file.filename or sheet_name)
                if detected:
                    patch_data["discipline"] = detected
            await client.patch(
                f"{_SUPABASE_REST_URL}/drawings",
                headers=headers,
                params={"id": f"eq.{drawing_id}"},
                json=patch_data,
            )

            return {
                "drawing": {**drawing, "current_revision": next_rev, "file_url": file_url, "sheet_name": sheet_name},
                "revision": revision,
                "file_url": file_url,
                "is_new_revision": True,
            }

        # 3. Get or create default project
        project_resp = await client.get(
            f"{_SUPABASE_REST_URL}/projects",
            headers=headers,
            params={"user_id": f"eq.{user_id}", "select": "*", "limit": "1"},
        )
        projects = project_resp.json() if project_resp.status_code == 200 else []

        if projects:
            project_id = projects[0]["id"]
        else:
            create_resp = await client.post(
                f"{_SUPABASE_REST_URL}/projects",
                headers={**headers, "Prefer": "return=representation"},
                json={"user_id": user_id, "name": "My Project"},
            )
            if create_resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=500,
                    detail=f"Project creation failed (status {create_resp.status_code}): {create_resp.text}",
                )
            project_id = create_resp.json()[0]["id"]

        # 4. Auto-detect discipline if not set
        final_discipline = discipline or auto_detect_discipline(file.filename or sheet_name)

        drawing_body = {
            "project_id": project_id,
            "user_id": user_id,
            "sheet_name": sheet_name,
            "file_url": file_url,
            "current_revision": 1,
        }
        if final_discipline:
            drawing_body["discipline"] = final_discipline
        drawing_resp = await client.post(
            f"{_SUPABASE_REST_URL}/drawings",
            headers={**headers, "Prefer": "return=representation"},
            json=drawing_body,
        )
        if drawing_resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=500,
                detail=f"Drawing creation failed (status {drawing_resp.status_code}): {drawing_resp.text}",
            )

        drawing = drawing_resp.json()[0]
        drawing_id = drawing["id"]

        # 5. Create initial revision (revision 1)
        revision_resp = await client.post(
            f"{_SUPABASE_REST_URL}/revisions",
            headers={**headers, "Prefer": "return=representation"},
            json={
                "drawing_id": drawing_id,
                "revision_number": 1,
                "file_url": file_url,
                "uploaded_by": user_id,
                "notes": "Initial upload",
            },
        )
        if revision_resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=500,
                detail=f"Revision creation failed (status {revision_resp.status_code}): {revision_resp.text}",
            )

        revision = revision_resp.json()[0]

        return {
            "drawing": drawing,
            "revision": revision,
            "file_url": file_url,
            "is_new_revision": False,
        }


@router.get("/list")
async def list_drawings(user_id: str = Query(...)):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "updated_at.desc.nullslast",
            },
        )
        if resp.status_code != 200:
            return []
        return resp.json()


@router.get("/all-revisions")
async def list_all_revisions(user_id: str = Query(...)):
    """Return all revisions across all user's drawings (for the timeline view)."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        drawings_resp = await client.get(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=_headers(),
            params={"user_id": f"eq.{user_id}", "select": "id"},
        )
        if drawings_resp.status_code != 200:
            return []
        drawing_ids = [d["id"] for d in drawings_resp.json()]
        if not drawing_ids:
            return []

        all_revisions = []
        for did in drawing_ids:
            rev_resp = await client.get(
                f"{_SUPABASE_REST_URL}/revisions",
                headers=_headers(),
                params={"drawing_id": f"eq.{did}", "select": "*", "order": "revision_number.desc"},
            )
            if rev_resp.status_code == 200:
                all_revisions.extend(rev_resp.json())

        all_revisions.sort(key=lambda r: r.get("revision_number", 0), reverse=True)
        return all_revisions


@router.get("/revisions")
async def list_revisions(drawing_id: str = Query(...)):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/revisions",
            headers=_headers(),
            params={
                "drawing_id": f"eq.{drawing_id}",
                "select": "*",
                "order": "revision_number.desc",
            },
        )
        if resp.status_code != 200:
            return []
        return resp.json()


@router.get("/drawing")
async def get_drawing(drawing_id: str = Query(...)):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=_headers(),
            params={"id": f"eq.{drawing_id}", "select": "*"},
        )
        if resp.status_code != 200 or not resp.json():
            raise HTTPException(status_code=404, detail="Drawing not found")
        return resp.json()[0]


def _extract_storage_path(file_url: str) -> str | None:
    if not file_url:
        return None
    prefix = "/public/drawings/"
    idx = file_url.find(prefix)
    if idx == -1:
        return None
    return file_url[idx + len(prefix):]


@router.delete("/delete")
async def delete_drawing(drawing_id: str = Query(...), user_id: str = Query(...)):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()

    async with httpx.AsyncClient() as client:
        # 1. Get the drawing
        draw_resp = await client.get(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=headers,
            params={"id": f"eq.{drawing_id}", "select": "*"},
        )
        if draw_resp.status_code != 200 or not draw_resp.json():
            raise HTTPException(status_code=404, detail="Drawing not found")
        drawing = draw_resp.json()[0]

        if drawing.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # 2. Get all revisions to collect storage paths
        rev_resp = await client.get(
            f"{_SUPABASE_REST_URL}/revisions",
            headers=headers,
            params={"drawing_id": f"eq.{drawing_id}", "select": "file_url"},
        )
        revision_urls = [r["file_url"] for r in (rev_resp.json() if rev_resp.status_code == 200 else [])]

        # 3. Collect all storage paths to delete
        paths = []
        for url in [drawing.get("file_url", "")] + revision_urls:
            path = _extract_storage_path(url)
            if path:
                paths.append(path)

        # 4. Delete storage objects
        if paths:
            unique_paths = list(set(paths))
            try:
                storage_headers = {**_headers(), "Content-Type": "application/json"}
                await client.post(
                    f"{_SUPABASE_STORAGE_URL}/object/drawings/delete",
                    headers=storage_headers,
                    json={"prefixes": unique_paths},
                )
            except Exception as e:
                logger.warning(f"Storage cleanup failed: {e}")

        # 5. Delete the drawing (cascades to revisions, changes, alerts)
        del_resp = await client.delete(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=headers,
            params={"id": f"eq.{drawing_id}"},
        )
        if del_resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Failed to delete drawing: {del_resp.text}")

        return {"status": "deleted", "drawing_id": drawing_id}


@router.get("/projects/default")
async def get_or_create_default_project(user_id: str = Query(...)):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/projects",
            headers=_headers(),
            params={"user_id": f"eq.{user_id}", "select": "*", "limit": "1"},
        )
        projects = resp.json() if resp.status_code == 200 else []
        if projects:
            return projects[0]

        create_resp = await client.post(
            f"{_SUPABASE_REST_URL}/projects",
            headers={**_headers(), "Prefer": "return=representation"},
            json={"user_id": user_id, "name": "My Project"},
        )
        if create_resp.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Failed to create project: {create_resp.text}")
        return create_resp.json()[0]
