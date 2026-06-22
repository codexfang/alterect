import logging
from typing import List, Optional
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/risk", tags=["risk"])

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


_TRADE_RISK_WEIGHTS = {
    "structural": 25,
    "electrical": 20,
    "plumbing": 20,
    "hvac": 15,
    "architectural": 10,
    "civil": 5,
    "other": 5,
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


class RegionInfo(BaseModel):
    change_type: str
    area_percentage: float


class RiskScoreRequest(BaseModel):
    drawing_id: str
    user_id: str
    sheet_name: str
    project_id: str
    project_name: str
    discipline: str
    from_revision_number: int
    to_revision_number: int
    change_count: int
    change_percentage: float
    regions: List[RegionInfo]


class RiskFactor(BaseModel):
    name: str
    score: int
    weight: int
    detail: str


class RiskScoreResponse(BaseModel):
    score: int
    level: str
    color: str
    factors: List[RiskFactor]
    recommendation: str


def _compute_risk(req: RiskScoreRequest) -> RiskScoreResponse:
    factors: List[RiskFactor] = []
    total = 0

    # ── 1. Change extent (0-30) ──
    pct = req.change_percentage
    if pct > 20:
        extent_score = 30
        extent_detail = f"{pct}% of drawing — extensive changes"
    elif pct > 10:
        extent_score = 22
        extent_detail = f"{pct}% of drawing — significant changes"
    elif pct > 5:
        extent_score = 14
        extent_detail = f"{pct}% of drawing — moderate changes"
    elif pct > 2:
        extent_score = 6
        extent_detail = f"{pct}% of drawing — minor changes"
    else:
        extent_score = 1
        extent_detail = f"{pct}% of drawing — minimal changes"
    factors.append(RiskFactor(name="Change extent", score=extent_score, weight=30, detail=extent_detail))
    total += extent_score

    # ── 2. Change volume (0-20) ──
    cnt = req.change_count
    if cnt > 30:
        vol_score = 20
        vol_detail = f"{cnt} individual change regions — very high density"
    elif cnt > 15:
        vol_score = 15
        vol_detail = f"{cnt} individual change regions — high density"
    elif cnt > 8:
        vol_score = 10
        vol_detail = f"{cnt} individual change regions — moderate density"
    elif cnt > 3:
        vol_score = 5
        vol_detail = f"{cnt} individual change regions — low density"
    else:
        vol_score = 1
        vol_detail = f"{cnt} individual change regions — minimal"
    factors.append(RiskFactor(name="Change volume", score=vol_score, weight=20, detail=vol_detail))
    total += vol_score

    # ── 3. Trade impact (0-25) ──
    trade = _DISCIPLINE_TRADE_MAP.get(req.discipline.lower(), "other")
    trade_score = _TRADE_RISK_WEIGHTS.get(trade, 5)
    trade_detail = f"{trade.capitalize()} discipline — risk weight {trade_score}/25"
    factors.append(RiskFactor(name="Trade impact", score=trade_score, weight=25, detail=trade_detail))
    total += trade_score

    # ── 4. Change type distribution (0-15) ──
    if req.regions:
        added = sum(1 for r in req.regions if r.change_type == "added")
        removed = sum(1 for r in req.regions if r.change_type == "removed")
        modified = sum(1 for r in req.regions if r.change_type == "modified")
        n = len(req.regions)

        removal_ratio = removed / n if n else 0
        added_ratio = added / n if n else 0
        modified_ratio = modified / n if n else 0

        if removal_ratio > 0.4:
            type_score = 15
            type_detail = f"High removal ratio ({removed}/{n} regions) — structural deletions are high-risk"
        elif removal_ratio > 0.2:
            type_score = 10
            type_detail = f"Significant removals ({removed}/{n} regions)"
        elif modified_ratio > 0.6:
            type_score = 8
            type_detail = f"Mostly modifications ({modified}/{n} regions) — moderate risk"
        elif added_ratio > 0.6:
            type_score = 4
            type_detail = f"Mostly additions ({added}/{n} regions) — lower risk"
        else:
            type_score = 6
            type_detail = f"Mixed changes — {added} added, {removed} removed, {modified} modified"
    else:
        type_score = 0
        type_detail = "No regions to analyse"
    factors.append(RiskFactor(name="Change composition", score=type_score, weight=15, detail=type_detail))
    total += type_score

    # ── 5. Change concentration (0-10) ──
    if req.regions and req.change_percentage > 0:
        # Concentration = average region size / total area
        avg_region_pct = sum(r.area_percentage for r in req.regions) / len(req.regions)
        if avg_region_pct > 5:
            conc_score = 10
            conc_detail = f"Large average region size ({avg_region_pct:.2f}%) — concentrated, high-impact changes"
        elif avg_region_pct > 2:
            conc_score = 6
            conc_detail = f"Medium average region size ({avg_region_pct:.2f}%)"
        elif avg_region_pct > 0.5:
            conc_score = 3
            conc_detail = f"Small average region size ({avg_region_pct:.2f}%) — scattered changes"
        else:
            conc_score = 1
            conc_detail = f"Very small regions ({avg_region_pct:.2f}%) — minimal impact per region"
    else:
        conc_score = 0
        conc_detail = "No region data available"
    factors.append(RiskFactor(name="Change concentration", score=conc_score, weight=10, detail=conc_detail))
    total += conc_score

    # ── Normalize to 0-100 ──
    max_possible = 100
    score = min(round(total / max_possible * 100), 100)

    if score >= 65:
        level = "high"
        color = "#DC2626"
        recommendation = (
            "Immediate review required. High concentration of structural or trade-critical changes "
            "may cause conflicts. Coordinate with all affected trades before proceeding."
        )
    elif score >= 35:
        level = "medium"
        color = "#EA580C"
        recommendation = (
            "Moderate risk. Review changed regions with the relevant trade teams. "
            "Consider a coordination meeting if changes span multiple disciplines."
        )
    else:
        level = "low"
        color = "#16A34A"
        recommendation = (
            "Low risk. Minor or primarily additive changes detected. "
            "Standard revision review process applies."
        )

    return RiskScoreResponse(
        score=score,
        level=level,
        color=color,
        factors=factors,
        recommendation=recommendation,
    )


@router.post("/score", response_model=RiskScoreResponse)
async def score_drawing_risk(req: RiskScoreRequest):
    """Compute a risk score (0-100) from a diff result."""
    try:
        result = _compute_risk(req)

        # Persist to Supabase
        if _SUPABASE_REST_URL and _SUPABASE_KEY:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{_SUPABASE_REST_URL}/risk_scores",
                        headers={**_headers(), "Prefer": "return=minimal"},
                        json={
                            "drawing_id": req.drawing_id,
                            "user_id": req.user_id,
                            "project_id": req.project_id,
                            "sheet_name": req.sheet_name,
                            "from_revision_number": req.from_revision_number,
                            "to_revision_number": req.to_revision_number,
                            "change_count": req.change_count,
                            "change_percentage": req.change_percentage,
                            "score": result.score,
                            "level": result.level,
                            "factors": [f.model_dump() for f in result.factors],
                            "recommendation": result.recommendation,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
            except Exception as e:
                logger.warning(f"Failed to persist risk score: {e}")

        return result
    except Exception as e:
        logger.error(f"Risk scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scores")
async def list_risk_scores(
    user_id: str = Query(...),
    limit: int = Query(50),
):
    """List recent risk scores for a user."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/risk_scores",
            headers=_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc",
                "limit": str(limit),
            },
        )
        if resp.status_code != 200:
            return []
        return resp.json()


@router.get("/scores/{drawing_id}")
async def get_drawing_scores(
    drawing_id: str,
    user_id: str = Query(...),
):
    """Get risk scores for a specific drawing."""
    if not _SUPABASE_REST_URL or not _SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_REST_URL}/risk_scores",
            headers=_headers(),
            params={
                "drawing_id": f"eq.{drawing_id}",
                "user_id": f"eq.{user_id}",
                "select": "*",
                "order": "created_at.desc",
                "limit": "20",
            },
        )
        if resp.status_code != 200:
            return []
        return resp.json()
