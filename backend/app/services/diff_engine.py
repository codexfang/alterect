"""
Diff engine service.

MVP: Uses GPT-4o-mini to compare two PDF images and generate structured diffs.
In production: ViT + CLIP embeddings + OpenCV template matching.
"""

import json
import base64
import io
from typing import List, Optional
from PIL import Image
from app.core.config import settings


def image_to_base64(image: Image.Image) -> str:
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()


def generate_diff_mock(
    old_drawing_id: str,
    new_drawing_id: str,
    sheet_name: str,
) -> dict:
    """Generate mock diff for MVP demo purposes."""
    return {
        "sheet_id": sheet_name,
        "changes": [
            {
                "id": "chg-1",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "wall_moved",
                "coordinates": {"x": 120, "y": 340, "width": 60, "height": 4},
                "trade": "structural",
                "severity": "high",
                "description": "Interior wall shifted 18 inches east",
                "confidence": 0.92,
            },
            {
                "id": "chg-2",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "outlet_added",
                "coordinates": {"x": 450, "y": 200},
                "trade": "electrical",
                "severity": "medium",
                "description": "New duplex outlet on south wall",
                "confidence": 0.88,
            },
            {
                "id": "chg-3",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "note_modified",
                "coordinates": {"x": 300, "y": 500, "width": 80, "height": 20},
                "trade": "other",
                "severity": "low",
                "description": "Ceiling height note changed from 10'-0\" to 9'-6\"",
                "confidence": 0.95,
            },
            {
                "id": "chg-4",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "door_relocated",
                "coordinates": {"x": 520, "y": 380, "width": 30, "height": 70},
                "trade": "structural",
                "severity": "medium",
                "description": "Double door moved 24 inches west",
                "confidence": 0.85,
            },
            {
                "id": "chg-5",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "conduit_added",
                "coordinates": {"x": 200, "y": 450, "width": 40, "height": 4},
                "trade": "electrical",
                "severity": "low",
                "description": "New conduit run along east corridor",
                "confidence": 0.78,
            },
            {
                "id": "chg-6",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "plumbing_riser",
                "coordinates": {"x": 380, "y": 300, "width": 8, "height": 8},
                "trade": "plumbing",
                "severity": "high",
                "description": "Plumbing riser shifted 6 inches north",
                "confidence": 0.9,
            },
            {
                "id": "chg-7",
                "drawing_id": new_drawing_id,
                "previous_revision": "Rev 3",
                "change_type": "hvac_duct",
                "coordinates": {"x": 280, "y": 250, "width": 60, "height": 10},
                "trade": "hvac",
                "severity": "medium",
                "description": "HVAC duct size increased to 24\"x12\"",
                "confidence": 0.82,
            },
        ],
        "summary": "7 changes detected: 2 electrical, 3 structural, 1 plumbing, 1 HVAC",
    }


async def generate_diff_with_ai(
    old_image: Image.Image,
    new_image: Image.Image,
    sheet_name: str,
) -> dict:
    """
    Use GPT-4o-mini to compare two drawing images and return structured diffs.
    """
    if not settings.OPENAI_API_KEY:
        return generate_diff_mock("old", "new", sheet_name)

    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    old_b64 = image_to_base64(old_image)
    new_b64 = image_to_base64(new_image)

    prompt = """You are an expert construction drawing analyst. Compare these two blueprint PDF pages (previous vs current revision).

Identify ALL changes between the two drawings. For each change, provide:
- change_type: one of [wall_moved, wall_added, wall_removed, outlet_added, outlet_removed, outlet_moved, door_added, door_removed, door_relocated, window_added, window_removed, window_moved, note_added, note_modified, note_removed, dimension_changed, conduit_added, conduit_removed, plumbing_added, plumbing_riser, hvac_duct, fixture_added, fixture_removed, other]
- coordinates: approximate x, y position on the page (and width/height if applicable)
- trade: one of [electrical, plumbing, structural, hvac, other]
- severity: one of [low, medium, high]
- description: clear description of what changed

Return a JSON object with:
{
  "changes": [...],
  "summary": "X changes detected: Y electrical, Z structural..."
}"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{old_b64}"}},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{new_b64}"}},
                ],
            }
        ],
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    return result
