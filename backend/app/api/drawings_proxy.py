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


@router.post("/upload")
async def upload_drawing(
    file: UploadFile = File(...),
    user_id: str = Form(...),
):
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()
    file_bytes = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    file_path = f"{user_id}/{uuid.uuid4()}.{ext}"

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

        # 2. Get or create default project
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

        # 3. Create drawing record
        sheet_name = file.filename.replace(f".{ext}", "") if file.filename else "Untitled"
        drawing_resp = await client.post(
            f"{_SUPABASE_REST_URL}/drawings",
            headers={**headers, "Prefer": "return=representation"},
            json={
                "project_id": project_id,
                "user_id": user_id,
                "sheet_name": sheet_name,
                "file_url": file_url,
            },
        )
        if drawing_resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=500,
                detail=f"Drawing creation failed (status {drawing_resp.status_code}): {drawing_resp.text}",
            )

        drawing = drawing_resp.json()[0]
        drawing_id = drawing["id"]

        # 4. Create initial revision
        revision_resp = await client.post(
            f"{_SUPABASE_REST_URL}/revisions",
            headers={**headers, "Prefer": "return=representation"},
            json={
                "drawing_id": drawing_id,
                "revision_number": 0,
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
