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


def classify_region(prev_gray: np.ndarray, curr_gray: np.ndarray, x: int, y: int, w: int, h: int) -> ChangeType:
    """Classify a region as added, removed, or modified by checking which
    image has meaningful content (non-white / non-background) in the region."""
    roi_prev = prev_gray[y:y+h, x:x+w]
    roi_curr = curr_gray[y:y+h, x:x+w]

    _, prev_bin = cv2.threshold(roi_prev, 240, 255, cv2.THRESH_BINARY_INV)
    _, curr_bin = cv2.threshold(roi_curr, 240, 255, cv2.THRESH_BINARY_INV)

    prev_pixels = cv2.countNonZero(prev_bin)
    curr_pixels = cv2.countNonZero(curr_bin)
    total = w * h

    prev_ratio = prev_pixels / total
    curr_ratio = curr_pixels / total

    if prev_ratio < 0.05 and curr_ratio >= 0.05:
        return ChangeType.ADDED
    elif prev_ratio >= 0.05 and curr_ratio < 0.05:
        return ChangeType.REMOVED
    else:
        return ChangeType.MODIFIED


def compute_diff(prev: np.ndarray, curr: np.ndarray) -> DiffResponse:
    h, w = curr.shape[:2]

    if prev.shape != curr.shape:
        prev = cv2.resize(prev, (w, h))

    gray_prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    gray_curr = cv2.cvtColor(curr, cv2.COLOR_BGR2GRAY)

    # 1. Gaussian blur to reduce noise / anti-aliasing artifacts
    blurred_prev = cv2.GaussianBlur(gray_prev, (5, 5), 0)
    blurred_curr = cv2.GaussianBlur(gray_curr, (5, 5), 0)

    # 2. Absolute difference
    diff = cv2.absdiff(blurred_prev, blurred_curr)

    # 3. Otsu's threshold — adaptively picks the best cutoff
    _, thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

    # 4. Morphological close to fill small gaps inside changed regions
    close_kernel = np.ones((5, 5), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)

    # 5. Morphological open to remove isolated noise pixels
    open_kernel = np.ones((3, 3), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, open_kernel)

    # 6. Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 7. Classify and build regions
    regions: List[ChangeRegion] = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        if area > 200:
            change_type = classify_region(gray_prev, gray_curr, x, y, cw, ch)
            area_pct = round(area / (w * h) * 100, 3)
            regions.append(ChangeRegion(
                x=x, y=y, w=cw, h=ch,
                area=area,
                area_percentage=area_pct,
                change_type=change_type,
            ))

    total_pixels = w * h
    changed_pixels = int(cv2.countNonZero(thresh))
    change_percentage = round(changed_pixels / total_pixels * 100, 2) if total_pixels > 0 else 0

    # 8. Build coloured overlay with per-region labels
    overlay = curr.copy()
    for r in regions:
        if r.change_type == ChangeType.ADDED:
            color = (0, 200, 0)    # green
            label = "ADDED"
        elif r.change_type == ChangeType.REMOVED:
            color = (0, 0, 255)    # red
            label = "REMOVED"
        else:
            color = (0, 165, 255)  # orange
            label = "CHANGED"

        cv2.rectangle(overlay, (r.x, r.y), (r.x + r.w, r.y + r.h), color, 3)
        (tw, th_pt), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        # label background
        label_y = max(r.y - 6, th_pt + 4)
        cv2.rectangle(overlay, (r.x, label_y - th_pt - 2), (r.x + tw + 4, label_y + 2), color, -1)
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
