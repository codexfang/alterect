import base64
import logging
from enum import Enum
from typing import List
from io import BytesIO

import httpx
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diff", tags=["diff"])


class DiffRequest(BaseModel):
    previous_url: str
    current_url: str


class ChangeType(str, Enum):
    ADDED = "added"
    REMOVED = "removed"
    MODIFIED = "modified"


class ChangeRegion(BaseModel):
    x: int
    y: int
    w: int
    h: int
    area: int
    area_percentage: float
    change_type: ChangeType


class DiffResponse(BaseModel):
    change_count: int
    change_percentage: float
    regions: List[ChangeRegion]
    overlay_url: str | None = None


def _is_pdf(url_or_name: str) -> bool:
    return url_or_name.lower().endswith(".pdf")


def _pix_to_cv2(pix) -> np.ndarray:
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    if pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
    elif pix.n == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    elif pix.n == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img


async def download_image(url: str) -> np.ndarray:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    data = resp.content
    buf = BytesIO(data)

    if _is_pdf(url):
        try:
            import fitz
            doc = fitz.open(stream=data, filetype="pdf")
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = _pix_to_cv2(pix)
            doc.close()
            return img
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode PDF from {url}: {e}")

    buf.seek(0)
    arr = np.frombuffer(buf.getvalue(), dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail=f"Could not decode image from {url}")
    return img


def compute_diff(prev: np.ndarray, curr: np.ndarray) -> DiffResponse:
    h, w = curr.shape[:2]

    if prev.shape != curr.shape:
        prev = cv2.resize(prev, (w, h))

    gray_prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    gray_curr = cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)

    blur_prev = cv2.GaussianBlur(gray_prev, (3, 3), 0)
    blur_curr = cv2.GaussianBlur(gray_curr, (3, 3), 0)

    # ─── Content mask extraction ───────────────────────────────────────
    # For line drawings (blueprints), "content" = dark ink pixels.
    # Threshold at 200 to separate drawn content from the white/light
    # background while still catching thin lines.
    _, prev_content = cv2.threshold(blur_prev, 200, 255, cv2.THRESH_BINARY_INV)
    _, curr_content = cv2.threshold(blur_curr, 200, 255, cv2.THRESH_BINARY_INV)

    # Dilate *very slightly* (1 px) so that anti-aliased edge pixels
    # don't produce phantom diffs ─ a drawn line at the same position
    # in both images will overlap after dilation.
    d_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    prev_mask = cv2.dilate(prev_content, d_k)
    curr_mask = cv2.dilate(curr_content, d_k)

    # ─── Structural diff ──────────────────────────────────────────────
    # Content in prev but NOT in curr  →  removed (e.g. a deleted wall)
    removed_mask = cv2.subtract(prev_mask, curr_mask)
    # Content in curr but NOT in prev  →  added   (e.g. a new wall)
    added_mask   = cv2.subtract(curr_mask, prev_mask)
    # Any structural change
    changed_mask = cv2.bitwise_or(removed_mask, added_mask)

    # ─── Region formation ─────────────────────────────────────────────
    # Connect nearby changed pixels into coherent bounding boxes
    close_k = np.ones((5, 5), np.uint8)
    region_mask = cv2.morphologyEx(changed_mask, cv2.MORPH_CLOSE, close_k)

    # Remove tiny specks
    open_k = np.ones((3, 3), np.uint8)
    region_mask = cv2.morphologyEx(region_mask, cv2.MORPH_OPEN, open_k)

    contours, _ = cv2.findContours(region_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # ─── Classify & build regions ─────────────────────────────────────
    MIN_AREA = 200
    regions: List[ChangeRegion] = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        if area < MIN_AREA:
            continue

        # Count added vs removed *content pixels* (not bounding-box area)
        # within this region.
        roi_added   = added_mask[y:y+ch, x:x+cw]
        roi_removed = removed_mask[y:y+ch, x:x+cw]
        n_added   = cv2.countNonZero(roi_added)
        n_removed = cv2.countNonZero(roi_removed)

        # — exclusively added content
        if n_added > 0 and n_removed == 0:
            ct = ChangeType.ADDED
        # — exclusively removed content
        elif n_removed > 0 and n_added == 0:
            ct = ChangeType.REMOVED
        # — strongly one-sided
        elif n_added > n_removed * 2:
            ct = ChangeType.ADDED
        elif n_removed > n_added * 2:
            ct = ChangeType.REMOVED
        # — roughly balanced = moved / reshaped
        else:
            ct = ChangeType.MODIFIED

        area_pct = round(area / (w * h) * 100, 3)
        regions.append(ChangeRegion(
            x=x, y=y, w=cw, h=ch,
            area=area,
            area_percentage=area_pct,
            change_type=ct,
        ))

    # ─── Stats ────────────────────────────────────────────────────────
    total_pixels = w * h
    changed_pixels = int(cv2.countNonZero(changed_mask))
    change_percentage = round(changed_pixels / total_pixels * 100, 2) if total_pixels > 0 else 0

    # ─── Overlay ──────────────────────────────────────────────────────
    overlay = curr.copy()
    for r in regions:
        if r.change_type == ChangeType.ADDED:
            color = (0, 200, 0)      # green
            label = "ADDED"
        elif r.change_type == ChangeType.REMOVED:
            color = (0, 0, 255)      # red
            label = "REMOVED"
        else:
            color = (0, 165, 255)    # orange
            label = "MODIFIED"

        cv2.rectangle(overlay, (r.x, r.y), (r.x + r.w, r.y + r.h), color, 3)
        (tw, th_pt), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        label_y = max(r.y - 6, th_pt + 4)
        cv2.rectangle(overlay, (r.x, label_y - th_pt - 2),
                      (r.x + tw + 4, label_y + 2), color, -1)
        cv2.putText(overlay, label, (r.x + 2, label_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    _, buf = cv2.imencode(".png", overlay)
    overlay_b64 = base64.b64encode(buf.tobytes()).decode()

    return DiffResponse(
        change_count=len(regions),
        change_percentage=change_percentage,
        regions=regions,
        overlay_url=f"data:image/png;base64,{overlay_b64}",
    )


@router.post("/compare", response_model=DiffResponse)
async def compare_drawings(req: DiffRequest):
    try:
        prev_img = await download_image(req.previous_url)
        curr_img = await download_image(req.current_url)
        result = compute_diff(prev_img, curr_img)
        logger.info(f"Diff complete: {result.change_count} changes, {result.change_percentage}% changed")
        return result
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to download image: {e}")
    except Exception as e:
        logger.error(f"Diff failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
