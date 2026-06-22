"""Generate sample blueprint images for testing diff detection.
Run: python3 generate_test_drawings.py
Outputs two PNGs: test_floorplan_v1.png and test_floorplan_v2.png
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 800, 600
OUT = os.path.join(os.path.dirname(__file__), "test_drawings")
os.makedirs(OUT, exist_ok=True)

def draw_blueprint(draw: ImageDraw, variant: int):
    """Draw a simple floor plan with walls, doors, and windows."""
    blue = (30, 60, 140)
    light_blue = (200, 215, 240)
    white = (255, 255, 255)

    # Background
    draw.rectangle([0, 0, W, H], fill=light_blue)

    # Outer walls
    draw.rectangle([50, 50, 750, 550], outline=blue, width=4)

    # Room divider (vertical wall)
    draw.line([(400, 50), (400, 350)], fill=blue, width=4)

    # Door opening in divider (variant 0: left side, variant 1: right side)
    if variant == 0:
        draw.rectangle([395, 180, 405, 220], fill=light_blue)  # door gap
    else:
        draw.rectangle([395, 260, 405, 300], fill=light_blue)  # door moved

    # Window on right wall
    draw.rectangle([700, 200, 750, 260], outline=blue, width=3)

    # Furniture: table
    draw.rectangle([500, 400, 620, 460], outline=blue, width=2)

    # Chair (variant 0: round, variant 1: square)
    cx, cy = 560, 480
    if variant == 0:
        draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], outline=blue, width=2)
    else:
        draw.rectangle([cx - 15, cy - 15, cx + 15, cy + 15], outline=blue, width=2)

    # Label
    draw.text((60, 560), f"Floor Plan — Rev {variant + 1}", fill=blue)
    draw.text((60, 580), "Scale: 1/8\" = 1'-0\"", fill=blue)


# Generate version 1
img1 = Image.new("RGB", (W, H))
d1 = ImageDraw.Draw(img1)
draw_blueprint(d1, variant=0)
img1.save(os.path.join(OUT, "test_floorplan_v1.png"))
print("Created test_floorplan_v1.png")

# Generate version 2 (with changes)
img2 = Image.new("RGB", (W, H))
d2 = ImageDraw.Draw(img2)
draw_blueprint(d2, variant=1)
img2.save(os.path.join(OUT, "test_floorplan_v2.png"))
print("Created test_floorplan_v2.png")

print(f"\nDone! Files saved to: {OUT}")
print("1. Upload v1 → click Upload Drawing")
print("2. Upload v2 → click Upload Drawing again (same drawing name)")
print("3. Go to Diffs tab → Click 'Compare' on the drawing")
print("4. Select Rev 0 (prev) and Rev 1 (curr) → Click Compare")
