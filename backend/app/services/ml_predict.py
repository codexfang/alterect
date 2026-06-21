"""
ML prediction service for change impact and risk scoring.

MVP: Rules-based scoring. In production: trained model.
"""

from typing import List


def calculate_risk_score(changes: List[dict]) -> dict:
    """
    Calculate risk score (0-100) and cost impact based on detected changes.
    """
    if not changes:
        return {"risk_score": 0, "cost_impact": "$0", "conflicts": [], "suggested_action": "No changes detected."}

    trade_counts = {}
    severity_scores = {"low": 10, "medium": 30, "high": 60}
    trade_conflicts = {
        ("electrical", "plumbing"): "65% conflict probability — Electrical near plumbing",
        ("structural", "plumbing"): "45% conflict probability — Structural change near plumbing",
        ("electrical", "hvac"): "30% conflict probability — Electrical near HVAC",
    }

    total_score = 0
    conflict_found = False
    conflicts = []
    trades_detected = set()

    for change in changes:
        trade = change.get("trade", "other")
        severity = change.get("severity", "low")
        trades_detected.add(trade)
        total_score += severity_scores.get(severity, 10)

        if trade in ["electrical", "plumbing", "structural", "hvac"]:
            trade_counts[trade] = trade_counts.get(trade, 0) + 1

    # Check for conflicts
    for (t1, t2), msg in trade_conflicts.items():
        if t1 in trades_detected and t2 in trades_detected:
            conflicts.append(msg)
            conflict_found = True

    # Normalize score
    risk_score = min(total_score, 100)

    # Cost estimate (rough MVP calculation)
    base_cost = risk_score * 1200
    if conflict_found:
        base_cost *= 1.4

    if risk_score < 30:
        suggested = "Low risk — Monitor changes during next review."
    elif risk_score < 60:
        suggested = "Medium risk — Review with project manager before proceeding."
    else:
        suggested = "High risk — Review with foreman before next Thursday. Schedule coordination meeting."

    return {
        "risk_score": risk_score,
        "cost_impact": f"${base_cost:,.0f}",
        "conflicts": conflicts,
        "trade_breakdown": trade_counts,
        "suggested_action": suggested,
    }
