import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingestion", tags=["ingestion"])

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


SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".dwg", ".dwf"}


# ─── Helpers ───


async def _get_dropbox_token(user_id: str, client: httpx.AsyncClient) -> str | None:
    """Get the Dropbox access token for a user from Supabase."""
    if not _SUPABASE_REST_URL:
        return None
    resp = await client.get(
        f"{_SUPABASE_REST_URL}/integrations",
        headers=_headers(),
        params={
            "user_id": f"eq.{user_id}",
            "provider": "eq.dropbox",
            "connected": "eq.true",
            "select": "access_token,settings",
            "limit": "1",
        },
    )
    if resp.status_code != 200 or not resp.json():
        return None
    return resp.json()[0].get("access_token")


async def _list_dropbox_files(
    token: str, client: httpx.AsyncClient,
    path: str = "", cursor: str | None = None,
) -> list[dict]:
    """List files in Dropbox root (or continue from cursor)."""
    all_entries: list[dict] = []

    if cursor:
        body = {"cursor": cursor}
        url = "https://api.dropboxapi.com/2/files/list_folder/continue"
    else:
        body = {
            "path": path or "",
            "recursive": True,
            "include_media_info": False,
            "include_deleted": False,
            "include_has_explicit_shared_members": False,
        }
        url = "https://api.dropboxapi.com/2/files/list_folder"

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    while True:
        resp = await client.post(url, headers=headers, json=body)
        if resp.status_code != 200:
            logger.warning(f"Dropbox list_folder failed: {resp.text}")
            break
        data = resp.json()
        all_entries.extend(data.get("entries", []))

        if data.get("has_more"):
            body = {"cursor": data["cursor"]}
            url = "https://api.dropboxapi.com/2/files/list_folder/continue"
        else:
            break

    return all_entries


async def _download_dropbox_file(
    token: str, dropbox_path: str, client: httpx.AsyncClient,
) -> tuple[bytes, str] | None:
    """Download a file from Dropbox. Returns (bytes, filename)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Dropbox-API-Arg": f'{{"path":"{dropbox_path}"}}',
    }
    resp = await client.post(
        "https://content.dropboxapi.com/2/files/download",
        headers=headers,
    )
    if resp.status_code != 200:
        logger.warning(f"Dropbox download failed for {dropbox_path}: {resp.status_code}")
        return None
    # Extract filename from the Dropbox-API-Result header
    result = resp.headers.get("Dropbox-API-Result", "{}")
    import json
    try:
        meta = json.loads(result)
        filename = meta.get("name", dropbox_path.split("/")[-1])
    except Exception:
        filename = dropbox_path.split("/")[-1]
    return resp.content, filename


async def _upload_to_supabase(
    file_bytes: bytes, filename: str, user_id: str, project_id: str,
    client: httpx.AsyncClient,
) -> dict | None:
    """Upload file to Supabase Storage + create drawing + revision.
    Returns the upload result dict."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "pdf"
    file_path = f"{user_id}/{uuid.uuid4()}.{ext}"
    sheet_name = filename.replace(f".{ext}", "")

    # 1. Upload to Storage
    storage_resp = await client.post(
        f"{_SUPABASE_STORAGE_URL}/object/drawings/{file_path}",
        headers={**_headers(), "Content-Type": "application/octet-stream"},
        content=file_bytes,
    )
    if storage_resp.status_code not in (200, 201):
        logger.warning(f"Storage upload failed for {filename}: {storage_resp.text}")
        return None

    file_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/drawings/{file_path}"

    # 2. Find or create drawing for this project
    drawing_resp = await client.get(
        f"{_SUPABASE_REST_URL}/drawings",
        headers=_headers(),
        params={
            "project_id": f"eq.{project_id}",
            "user_id": f"eq.{user_id}",
            "select": "*",
            "limit": "1",
        },
    )
    existing_drawings = drawing_resp.json() if drawing_resp.status_code == 200 else []

    if existing_drawings:
        drawing = existing_drawings[0]
        drawing_id = drawing["id"]

        # Get next revision number
        rev_resp = await client.get(
            f"{_SUPABASE_REST_URL}/revisions",
            headers=_headers(),
            params={
                "drawing_id": f"eq.{drawing_id}",
                "select": "revision_number",
                "order": "revision_number.desc",
                "limit": "1",
            },
        )
        existing_revs = rev_resp.json() if rev_resp.status_code == 200 else []
        next_rev = (existing_revs[0]["revision_number"] + 1) if existing_revs else 1

        # Create revision
        rev_create = await client.post(
            f"{_SUPABASE_REST_URL}/revisions",
            headers={**_headers(), "Prefer": "return=representation"},
            json={
                "drawing_id": drawing_id,
                "revision_number": next_rev,
                "file_url": file_url,
                "uploaded_by": user_id,
                "notes": f"Auto-imported from Dropbox — Rev {next_rev}",
            },
        )
        if rev_create.status_code not in (200, 201):
            logger.warning(f"Revision creation failed: {rev_create.text}")
            return None

        # Update drawing
        await client.patch(
            f"{_SUPABASE_REST_URL}/drawings",
            headers=_headers(),
            params={"id": f"eq.{drawing_id}"},
            json={"file_url": file_url, "current_revision": next_rev, "sheet_name": sheet_name},
        )

        return {"filename": filename, "revision": next_rev, "status": "new_revision"}

    else:
        # Create new drawing (auto-detect discipline from filename)
        _DISCIPLINE_KEYWORDS = {
            "architectural": ["arch", "archi", "plan", "elevation", "section", "floorplan", "a-"],
            "structural": ["struc", "struct", "column", "beam", "foundation", "framing", "s-"],
            "electrical": ["elec", "electric", "power", "lighting", "conduit", "panel", "e-"],
            "mechanical": ["mech", "hvac", "duct", "exhaust", "supply", "m-"],
            "plumbing": ["plumb", "pipe", "drain", "water", "sewer", "gas", "p-"],
            "civil": ["civil", "site", "grading", "road", "utility", "c-"],
        }
        name_lower = filename.lower().replace("_", " ").replace("-", " ").replace(".", " ")
        discipline = ""
        for disc, kws in _DISCIPLINE_KEYWORDS.items():
            for kw in kws:
                if kw in name_lower:
                    discipline = disc
                    break
            if discipline:
                break

        drawing_body = {
            "project_id": project_id,
            "user_id": user_id,
            "sheet_name": sheet_name,
            "file_url": file_url,
            "current_revision": 1,
        }
        if discipline:
            drawing_body["discipline"] = discipline

        draw_create = await client.post(
            f"{_SUPABASE_REST_URL}/drawings",
            headers={**_headers(), "Prefer": "return=representation"},
            json=drawing_body,
        )
        if draw_create.status_code not in (200, 201):
            logger.warning(f"Drawing creation failed: {draw_create.text}")
            return None

        drawing = draw_create.json()[0]

        rev_create = await client.post(
            f"{_SUPABASE_REST_URL}/revisions",
            headers={**_headers(), "Prefer": "return=representation"},
            json={
                "drawing_id": drawing["id"],
                "revision_number": 1,
                "file_url": file_url,
                "uploaded_by": user_id,
                "notes": "Auto-imported from Dropbox — Initial upload",
            },
        )
        if rev_create.status_code not in (200, 201):
            logger.warning(f"Revision creation failed: {rev_create.text}")
            return None

        return {"filename": filename, "revision": 1, "status": "new_drawing"}


# ─── Endpoints ───


@router.get("/dropbox/webhook")
async def dropbox_webhook_verify(challenge: str = Query(...)):
    """Dropbox webhook verification (GET with ?challenge=...)."""
    return PlainTextResponse(challenge)


@router.post("/dropbox/webhook")
async def dropbox_webhook_notify(request: Request):
    """Receive Dropbox file change notifications and trigger sync."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    accounts = body.get("list_folder", {}).get("accounts", [])
    if not accounts:
        return {"status": "ok", "message": "No accounts to process"}

    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    results = []
    async with httpx.AsyncClient() as client:
        for account_id in accounts:
            # Find user with matching Dropbox account_id
            resp = await client.get(
                f"{_SUPABASE_REST_URL}/integrations",
                headers=_headers(),
                params={
                    "provider": "eq.dropbox",
                    "connected": "eq.true",
                    "settings->>dropbox_account_id": f"eq.{account_id}",
                    "select": "user_id,access_token",
                    "limit": "1",
                },
            )
            if resp.status_code != 200 or not resp.json():
                logger.info(f"No user found for Dropbox account {account_id}")
                continue

            integration = resp.json()[0]
            user_id = integration["user_id"]
            token = integration["access_token"]

            # Find the user's first project to upload into
            proj_resp = await client.get(
                f"{_SUPABASE_REST_URL}/projects",
                headers=_headers(),
                params={"user_id": f"eq.{user_id}", "select": "id", "limit": "1"},
            )
            projects = proj_resp.json() if proj_resp.status_code == 200 else []
            if not projects:
                # Create a default project
                create_resp = await client.post(
                    f"{_SUPABASE_REST_URL}/projects",
                    headers={**_headers(), "Prefer": "return=representation"},
                    json={"user_id": user_id, "name": "Dropbox Imports"},
                )
                if create_resp.status_code not in (200, 201):
                    continue
                project_id = create_resp.json()[0]["id"]
            else:
                project_id = projects[0]["id"]

            # List files and upload new ones
            files = await _list_dropbox_files(token, client)
            for entry in files:
                if entry.get(".tag") != "file":
                    continue
                name = entry.get("name", "")
                ext = f".{name.rsplit('.', 1)[-1].lower()}" if "." in name else ""
                if ext not in SUPPORTED_EXTENSIONS:
                    continue
                # Check if already imported (by name heuristic)
                # Download and upload
                dl = await _download_dropbox_file(token, entry["path_lower"], client)
                if dl:
                    file_bytes, fname = dl
                    result = await _upload_to_supabase(file_bytes, fname, user_id, project_id, client)
                    if result:
                        results.append(result)

    return {"status": "ok", "processed": len(results), "results": results}


@router.post("/dropbox/sync")
async def dropbox_manual_sync(user_id: str = Query(...)):
    """Manually trigger a Dropbox sync for a user."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        token = await _get_dropbox_token(user_id, client)
        if not token:
            raise HTTPException(status_code=400, detail="Dropbox not connected")

        # Get or create a project for imports
        proj_resp = await client.get(
            f"{_SUPABASE_REST_URL}/projects",
            headers=_headers(),
            params={"user_id": f"eq.{user_id}", "select": "id,name", "limit": "1"},
        )
        projects = proj_resp.json() if proj_resp.status_code == 200 else []
        if projects:
            project_id = projects[0]["id"]
        else:
            create_resp = await client.post(
                f"{_SUPABASE_REST_URL}/projects",
                headers={**_headers(), "Prefer": "return=representation"},
                json={"user_id": user_id, "name": "Dropbox Imports"},
            )
            if create_resp.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail="Failed to create project")
            project_id = create_resp.json()[0]["id"]

        # List all files in Dropbox root
        files = await _list_dropbox_files(token, client)
        supported = [
            f for f in files
            if f.get(".tag") == "file"
            and f".{f['name'].rsplit('.', 1)[-1].lower()}" in SUPPORTED_EXTENSIONS
        ]

        results = []
        for entry in supported:
            dl = await _download_dropbox_file(token, entry["path_lower"], client)
            if dl:
                file_bytes, fname = dl
                result = await _upload_to_supabase(file_bytes, fname, user_id, project_id, client)
                if result:
                    results.append(result)

    return {
        "status": "ok",
        "total_found": len(supported),
        "imported": len(results),
        "results": results,
    }
