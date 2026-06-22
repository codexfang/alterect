import secrets
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
import httpx

from app.core.config import settings
from app.models import OAuthState
from app.core.database import async_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/oauth", tags=["oauth"])

SUPABASE_REST_URL = f"{settings.SUPABASE_URL}/rest/v1" if settings.SUPABASE_URL else None
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or ""
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

OAUTH_PROVIDERS = {
    "dropbox": {
        "name": "Dropbox",
        "authorize_url": "https://www.dropbox.com/oauth2/authorize",
        "token_url": "https://api.dropbox.com/oauth2/token",
        "scopes": "files.metadata.read files.content.read",
        "client_id": settings.DROPBOX_CLIENT_ID,
        "client_secret": settings.DROPBOX_CLIENT_SECRET,
    },
    "slack": {
        "name": "Slack",
        "authorize_url": "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "scopes": "chat:write,incoming-webhook",
        "client_id": settings.SLACK_CLIENT_ID,
        "client_secret": settings.SLACK_CLIENT_SECRET,
    },
}


def generate_state() -> str:
    return secrets.token_urlsafe(32)


@router.get("/{provider}/login")
async def oauth_login(provider: str, uid: str = Query(..., description="Supabase user ID")):
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")

    config = OAUTH_PROVIDERS[provider]
    if not config["client_id"]:
        logger.warning(f"{provider} OAuth not configured — missing client_id")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/integrations?error={provider}_not_configured")

    state = generate_state()

    async with async_session() as db:
        db.add(OAuthState(state=state, provider=provider, user_id=uid))
        await db.commit()

    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/api/oauth/{provider}/callback"

    params = {
        "client_id": config["client_id"],
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": config["scopes"],
        "state": state,
    }

    if provider == "dropbox":
        params["token_access_type"] = "offline"

    auth_url = f"{config['authorize_url']}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    logger.info(f"Redirecting user {uid} to {provider} OAuth")
    return RedirectResponse(url=auth_url)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    if error:
        logger.warning(f"{provider} OAuth error: {error}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/integrations?error={error}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")

    config = OAUTH_PROVIDERS[provider]

    async with async_session() as db:
        result = await db.execute(
            select(OAuthState).where(OAuthState.state == state, OAuthState.provider == provider)
        )
        stored_state = result.scalar_one_or_none()
        if not stored_state:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/integrations?error=invalid_state")
        user_id = stored_state.user_id
        await db.delete(stored_state)
        await db.commit()

    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/api/oauth/{provider}/callback"

    token_data = {
        "code": code,
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    if provider == "dropbox":
        token_data["token_access_type"] = "offline"

    headers = {"Accept": "application/json"}

    try:
        async with httpx.AsyncClient() as client:
            if provider == "dropbox":
                auth_str = f"{config['client_id']}:{config['client_secret']}"
                import base64
                headers["Authorization"] = f"Basic {base64.b64encode(auth_str.encode()).decode()}"
                token_data.pop("client_id", None)
                token_data.pop("client_secret", None)

            token_resp = await client.post(config["token_url"], data=token_data, headers=headers)
            token_resp.raise_for_status()
            token_json = token_resp.json()

        access_token = token_json.get("access_token")
        refresh_token = token_json.get("refresh_token")

        # Store tokens in Supabase (persistent across restarts)
        try:
            async with httpx.AsyncClient() as client:
                existing_resp = await client.get(
                    f"{SUPABASE_REST_URL}/integrations",
                    headers=SUPABASE_HEADERS,
                    params={"user_id": f"eq.{user_id}", "provider": f"eq.{provider}", "select": "id"},
                )
                existing_data = existing_resp.json() if existing_resp.status_code == 200 else []
                now = datetime.now(timezone.utc).isoformat()

                if existing_data:
                    await client.patch(
                        f"{SUPABASE_REST_URL}/integrations?id=eq.{existing_data[0]['id']}",
                        headers=SUPABASE_HEADERS,
                        json={
                            "access_token": access_token,
                            "refresh_token": refresh_token,
                            "connected": True,
                            "updated_at": now,
                        },
                    )
                else:
                    await client.post(
                        f"{SUPABASE_REST_URL}/integrations",
                        headers={**SUPABASE_HEADERS, "Prefer": "return=minimal"},
                        json={
                            "user_id": user_id,
                            "provider": provider,
                            "access_token": access_token,
                            "refresh_token": refresh_token,
                            "connected": True,
                        },
                    )
        except Exception as e:
            logger.warning(f"Failed to store token in Supabase: {e}")

        logger.info(f"Connected {provider} for user {user_id}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/integrations?connected={provider}")

    except httpx.HTTPError as e:
        logger.error(f"Token exchange failed for {provider}: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/integrations?error=token_exchange_failed")


@router.get("/status")
async def oauth_status(uid: str = Query(..., description="Supabase user ID")):
    if not SUPABASE_REST_URL:
        return {"connected": []}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_REST_URL}/integrations",
                headers=SUPABASE_HEADERS,
                params={"user_id": f"eq.{uid}", "connected": "eq.true", "select": "provider"},
            )
            data = resp.json() if resp.status_code == 200 else []
            connected = [row["provider"] for row in data]
            return {"connected": connected}
    except Exception:
        return {"connected": []}


@router.post("/{provider}/disconnect")
async def oauth_disconnect(provider: str, uid: str = Query(...)):
    if provider not in OAUTH_PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider}")
    if not SUPABASE_REST_URL:
        return {"status": "disconnected", "provider": provider}
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{SUPABASE_REST_URL}/integrations",
                headers=SUPABASE_HEADERS,
                params={"user_id": f"eq.{uid}", "provider": f"eq.{provider}"},
                json={"connected": False, "updated_at": datetime.now(timezone.utc).isoformat()},
            )
    except Exception as e:
        logger.warning(f"Failed to disconnect in Supabase: {e}")
    return {"status": "disconnected", "provider": provider}
