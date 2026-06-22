import logging
from typing import List, Optional
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts-proxy", tags=["alerts-proxy"])

_SUPABASE_REST_URL: str | None = None
_SUPABASE_KEY: str | None = None

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    _SUPABASE_REST_URL = f"{settings.SUPABASE_URL}/rest/v1"
    _SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY.strip()


def _headers():
    return {
        "apikey": _SUPABASE_KEY,
        "Authorization": f"Bearer {_SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


_DISCIPLINE_TRADE_MAP = {
    "architectural": "architectural",
    "structural": "structural",
    "electrical": "electrical",
    "mechanical": "hvac",
    "plumbing": "plumbing",
    "civil": "civil",
    "other": "other",
}


def _discipline_to_trade(discipline: str) -> str:
    return _DISCIPLINE_TRADE_MAP.get(discipline.lower(), "other")


def _compute_severity(change_percentage: float, change_count: int) -> str:
    if change_percentage > 10 or change_count > 20:
        return "high"
    if change_percentage > 3 or change_count > 5:
        return "medium"
    return "low"


# ─── Request / Response models ───


class AlertGenerateRequest(BaseModel):
    user_id: str
    drawing_id: str
    sheet_name: str
    project_id: str
    project_name: str
    discipline: str
    from_revision_number: int
    to_revision_number: int
    change_count: int
    change_percentage: float


class AlertResponse(BaseModel):
    id: str
    title: str
    description: str
    trade: str
    sheet_name: str
    severity: str
    read: bool
    created_at: str


# ─── Endpoints ───


@router.post("/generate")
async def generate_alerts(req: AlertGenerateRequest):
    """Generate alert records from a diff result. Creates one alert per trade
    affected and optionally attempts a Slack delivery."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    trade = _discipline_to_trade(req.discipline)
    severity = _compute_severity(req.change_percentage, req.change_count)

    revision_str = f"Rev {req.from_revision_number} → Rev {req.to_revision_number}"
    title = f"{req.change_count} change{'s' if req.change_count != 1 else ''} detected on {req.sheet_name}"
    description = (
        f"{req.change_count} change{'s' if req.change_count != 1 else ''} ({req.change_percentage}% of drawing) "
        f"detected between Rev {req.from_revision_number} and Rev {req.to_revision_number} "
        f"affecting {trade} scope."
    )

    headers = _headers()
    alert_payload = {
        "user_id": req.user_id,
        "project_id": req.project_id,
        "drawing_id": req.drawing_id,
        "title": title,
        "description": description,
        "trade": trade,
        "sheet_name": req.sheet_name,
        "project_name": req.project_name,
        "revision": revision_str,
        "severity": severity,
        "change_count": req.change_count,
        "change_percentage": req.change_percentage,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    created = []
    async with httpx.AsyncClient() as client:
        # Create the alert in Supabase
        resp = await client.post(
            f"{_SUPABASE_REST_URL}/alerts",
            headers={**headers, "Prefer": "return=representation"},
            json=alert_payload,
        )
        if resp.status_code not in (200, 201):
            logger.warning(f"Failed to create alert: {resp.text}")
            raise HTTPException(status_code=500, detail=f"Failed to create alert: {resp.text}")
        created = resp.json()

        # Attempt Slack delivery
        try:
            await _send_slack_notification(client, req.user_id, title, description, severity, trade, req.sheet_name)
        except Exception as e:
            logger.warning(f"Slack notification failed (non-fatal): {e}")

    return {"status": "created", "alerts": created}


@router.get("/list")
async def list_alerts(user_id: str = Query(...)):
    """List all alerts for a user, newest first."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/alerts",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc",
                "limit": "100",
            },
        )
        if resp.status_code != 200:
            return []
        return resp.json()


@router.put("/read")
async def mark_alert_read(alert_id: str = Query(...), user_id: str = Query(...)):
    """Mark a single alert as read."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_SUPABASE_REST_URL}/alerts",
            headers=headers,
            params={"id": f"eq.{alert_id}", "user_id": f"eq.{user_id}"},
            json={"read": True},
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Failed to mark alert read: {resp.text}")
    return {"status": "ok"}


@router.put("/read-all")
async def mark_all_read(user_id: str = Query(...)):
    """Mark all alerts as read for a user."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{_SUPABASE_REST_URL}/alerts",
            headers=headers,
            params={"user_id": f"eq.{user_id}", "read": "eq.false"},
            json={"read": True},
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Failed to mark all read: {resp.text}")
    return {"status": "ok"}


@router.delete("/delete-all")
async def delete_all_alerts(user_id: str = Query(...)):
    """Delete all alerts for a user."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = _headers()
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{_SUPABASE_REST_URL}/alerts",
            headers=headers,
            params={"user_id": f"eq.{user_id}"},
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Failed to delete alerts: {resp.text}")
    return {"status": "deleted"}


@router.get("/unread-count")
async def unread_count(user_id: str = Query(...)):
    """Return the number of unread alerts."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/alerts",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "read": "eq.false",
                "select": "id",
                "limit": "1000",
            },
        )
        if resp.status_code != 200:
            return {"count": 0}
        return {"count": len(resp.json())}


# ─── Slack delivery ───


async def _send_slack_notification(
    client: httpx.AsyncClient,
    user_id: str,
    title: str,
    description: str,
    severity: str,
    trade: str,
    sheet_name: str,
):
    """Attempt to send a Slack notification for an alert. Non-fatal if Slack
    is not connected or if the call fails."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        return

    # Fetch the user's Slack access token from Supabase
    headers = _headers()
    slack_resp = await client.get(
        f"{_SUPABASE_REST_URL}/integrations",
        headers=headers,
        params={
            "user_id": f"eq.{user_id}",
            "provider": "eq.slack",
            "connected": "eq.true",
            "select": "access_token,settings",
            "limit": "1",
        },
    )
    if slack_resp.status_code != 200 or not slack_resp.json():
        logger.info("No connected Slack integration found — skipping notification")
        return

    integration = slack_resp.json()[0]
    access_token = integration.get("access_token")
    settings_data = integration.get("settings") or {}

    if not access_token:
        logger.info("No Slack access token found — skipping notification")
        return

    # Try webhook URL first (simplest)
    webhook_url = settings_data.get("incoming_webhook_url")
    if webhook_url:
        slack_payload = {
            "text": f"*{title}*\n{description}",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{'🔴' if severity == 'high' else '🟡' if severity == 'medium' else '🟢'} Alterect Alert — {sheet_name}*\n{description}",
                    },
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Trade:* {trade}"},
                        {"type": "mrkdwn", "text": f"*Severity:* {severity}"},
                    ],
                },
            ],
        }
        wb_resp = await client.post(webhook_url, json=slack_payload)
        logger.info(f"Slack webhook notification {'sent' if wb_resp.is_success else 'failed'}: {wb_resp.status_code}")
        return

    # Fallback: use chat.postMessage API
    slack_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Open a DM conversation with the bot user (send to #general-like channel)
    # We use the `chat.postMessage` with channel as the bot's user ID to DM
    msg_payload = {
        "channel": settings_data.get("slack_channel_id", ""),
        "text": f"*{title}*\n{description}",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{'🔴' if severity == 'high' else '🟡' if severity == 'medium' else '🟢'} Alterect Alert — {sheet_name}*\n{description}",
                },
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Trade:* {trade}"},
                    {"type": "mrkdwn", "text": f"*Severity:* {severity}"},
                ],
            },
        ],
    }

    if msg_payload["channel"]:
        api_resp = await client.post(
            "https://slack.com/api/chat.postMessage",
            headers=slack_headers,
            json=msg_payload,
        )
        result = api_resp.json()
        if result.get("ok"):
            logger.info("Slack API notification sent successfully")
        else:
            logger.warning(f"Slack API notification failed: {result.get('error')}")
