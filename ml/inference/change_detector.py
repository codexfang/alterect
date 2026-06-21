"""
Change detection inference script.

Uses OpenCV for image preprocessing and fallback logic.
In production, this uses ViT + CLIP embeddings.
"""

import io
from typing import List, Optional, Tuple
import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:
    cv2 = None


def preprocess_image(image: Image.Image, target_size: Tuple[int, int] = (1024, 768)) -> np.ndarray:
    """Preprocess drawing image for change detection."""
    img = np.array(image.convert("RGB"))
    img = cv2.resize(img, target_size)
    img = cv2.GaussianBlur(img, (5, 5), 0)
    return img


def detect_changes_opencv(old_img: np.ndarray, new_img: np.ndarray, threshold: float = 30.0) -> List[dict]:
    """
    Detect changes using OpenCV absolute difference.
    Returns bounding boxes of detected changes.
    """
    if cv2 is None:
        return []

    old_gray = cv2.cvtColor(old_img, cv2.COLOR_RGB2GRAY)
    new_gray = cv2.cvtColor(new_img, cv2.COLOR_RGB2GRAY)

    diff = cv2.absdiff(old_gray, new_gray)
    _, thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)

    kernel = np.ones((5, 5), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    changes = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        if area > 100:  # Filter noise
            changes.append({
                "coordinates": {"x": float(x), "y": float(y), "width": float(w), "height": float(h)},
                "area": int(area),
            })

    return changes


def extract_symbol_features(image: Image.Image) -> np.ndarray:
    """Extract features from drawing symbols for classification."""
    img = np.array(image.convert("RGB"))
    if cv2 is not None:
        img = cv2.resize(img, (224, 224))
        img = img.astype(np.float32) / 255.0
    return img.flatten()


def classify_trade(change_type: str) -> str:
    """Classify which trade a change type belongs to."""
    trade_map = {
        "outlet": "electrical",
        "conduit": "electrical",
        "panel": "electrical",
        "switch": "electrical",
        "pipe": "plumbing",
        "riser": "plumbing",
        "drain": "plumbing",
        "fixture": "plumbing",
        "wall": "structural",
        "door": "structural",
        "window": "structural",
        "beam": "structural",
        "column": "structural",
        "duct": "hvac",
        "vent": "hvac",
        "diffuser": "hvac",
    }

    for keyword, trade in trade_map.items():
        if keyword in change_type.lower():
            return trade
    return "other"
