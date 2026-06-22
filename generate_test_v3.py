"""Generate two detailed floor plans with large, obvious differences for testing.

Run: python3 generate_test_v3.py
Outputs to test_drawings/ (gitignored).
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 900
OUT = os.path.join(os.path.dirname(__file__), "test_drawings")
os.makedirs(OUT, exist_ok=True)


def draw_v1(draw: ImageDraw):
    """Version 1 — two-bedroom layout with corridor."""
    ink = (20, 50, 120)
    fill_bg = (225, 235, 248)
    fill_white = (255, 255, 255)
    gw = 5  # wall thickness

    draw.rectangle([0, 0, W, H], fill=fill_bg)

    # ── Outer shell ──
    draw.rectangle([60, 60, 1040, 840], outline=ink, width=gw)

    # ── Interior walls ──
    # Vertical corridor wall splitting left/right
    draw.line([(550, 60), (550, 600)], fill=ink, width=gw)

    # Horizontal wall — top-right bedroom
    draw.line([(550, 320), (1040, 320)], fill=ink, width=gw)

    # Bottom wall — lower-left living room divider
    draw.line([(60, 600), (300, 600)], fill=ink, width=gw)

    # ── Door gaps (drawn as white rectangles to simulate openings) ──
    # Entry door (bottom wall)
    draw.rectangle([250, 55, 320, 65], fill=fill_bg)

    # Door from corridor to top-right bedroom
    draw.rectangle([545, 200, 555, 280], fill=fill_bg)

    # Door from corridor to lower-right room
    draw.rectangle([545, 420, 555, 480], fill=fill_bg)

    # Door from living room to corridor
    draw.rectangle([420, 595, 490, 605], fill=fill_bg)

    # ── Windows ──
    w_ink = (60, 100, 180)
    # Large window on right wall (bedroom)
    draw.rectangle([900, 120, 1040, 200], outline=w_ink, width=3)
    # Window on left wall (living room)
    draw.rectangle([60, 650, 160, 730], outline=w_ink, width=3)
    # Window on top wall
    draw.rectangle([700, 55, 840, 65], outline=w_ink, width=2)

    # ── Furniture ──
    # Living room sofa
    draw.rectangle([120, 660, 300, 760], outline=ink, width=2)
    draw.rectangle([130, 670, 290, 750], outline=ink, width=1)
    # Coffee table
    draw.rectangle([180, 780, 280, 820], outline=ink, width=2)
    # TV unit
    draw.rectangle([320, 660, 380, 720], outline=ink, width=2)

    # Top-right bedroom: bed
    draw.rectangle([720, 380, 940, 560], outline=ink, width=3)
    draw.rectangle([740, 400, 920, 540], outline=ink, width=1)
    # Wardrobe
    draw.rectangle([620, 340, 680, 440], outline=ink, width=2)

    # Lower-right room: desk + chair
    draw.rectangle([700, 640, 860, 700], outline=ink, width=2)
    draw.ellipse([770, 720, 810, 760], outline=ink, width=2)

    # ── Staircase (v1 HAS staircase) ──
    # Staircase in corridor
    steps = [(565, 530), (565, 560), (565, 590)]
    for sx, sy in steps:
        draw.rectangle([sx, sy, sx + 40, sy + 22], outline=ink, width=1)

    # ── Labels ──
    draw.text((620, 340), "BEDROOM", fill=ink)
    draw.text((200, 660), "LIVING", fill=ink)
    # Title block
    draw.rectangle([60, 850, 1040, 890], outline=ink, width=1)
    draw.text((80, 858), "PROJECT: Sample Tower — FLOOR PLAN Rev 1", fill=ink)
    draw.text((700, 858), "SHEET: A-101", fill=ink)
    draw.text((80, 874), "SCALE: 1/4\" = 1'-0\"", fill=ink)

    # Grid marks
    for x in range(0, W, 100):
        draw.line([(x, 50), (x, 55)], fill=ink, width=1)
        draw.line([(x, 845), (x, 850)], fill=ink, width=1)
    for y in range(0, H, 100):
        draw.line([(50, y), (55, y)], fill=ink, width=1)
        draw.line([(1045, y), (1050, y)], fill=ink, width=1)


def draw_v2(draw: ImageDraw):
    """Version 2 — major layout changes: open-plan, removed wall, added room."""
    ink = (20, 50, 120)
    fill_bg = (225, 235, 248)
    gw = 5

    draw.rectangle([0, 0, W, H], fill=fill_bg)

    # ── Outer shell (slightly smaller footprint) ──
    draw.rectangle([60, 60, 1040, 840], outline=ink, width=gw)

    # ── REMOVED the corridor wall — now open plan ──
    # (The old vertical wall at x=550 is GONE)

    # ── NEW wall: horizontal divider through the middle ──
    draw.line([(60, 420), (1040, 420)], fill=ink, width=gw)

    # ── Short partition wall (new) ──
    draw.line([(550, 60), (550, 200)], fill=ink, width=gw)

    # ── Door gaps ──
    # Entry door moved to the right
    draw.rectangle([700, 55, 780, 65], fill=fill_bg)

    # Door in new middle wall (left side)
    draw.rectangle([280, 415, 340, 425], fill=fill_bg)

    # Door in new middle wall (right side)
    draw.rectangle([780, 415, 840, 425], fill=fill_bg)

    # ── Windows ──
    w_ink = (60, 100, 180)
    # Big window on right wall (now goes all the way)
    draw.rectangle([900, 120, 1040, 200], outline=w_ink, width=3)
    # Window on left wall
    draw.rectangle([60, 650, 160, 730], outline=w_ink, width=3)
    # NEW large window on bottom wall
    draw.rectangle([400, 835, 700, 845], outline=w_ink, width=2)
    # Top wall window (moved)
    draw.rectangle([600, 55, 680, 65], outline=w_ink, width=2)

    # ── Furniture (re-arranged) ──
    # Large open-plan kitchen island (NEW)
    draw.rectangle([400, 500, 600, 620], outline=ink, width=3)
    draw.rectangle([410, 510, 590, 610], outline=ink, width=1)

    # Sofa moved to new position
    draw.rectangle([700, 520, 900, 640], outline=ink, width=2)

    # Coffee table (bigger)
    draw.rectangle([740, 660, 860, 740], outline=ink, width=2)

    # Dining table (NEW)
    draw.rectangle([200, 500, 370, 600], outline=ink, width=2)
    draw.rectangle([210, 510, 360, 590], outline=ink, width=1)

    # Top room: desk (removed wardrobe, added desk)
    draw.rectangle([720, 100, 900, 180], outline=ink, width=2)
    # Chair
    draw.rectangle([780, 200, 820, 240], outline=ink, width=2)

    # ── NO staircase (removed) ──

    # ── Labels ──
    draw.text((600, 80), "HOME OFFICE", fill=ink)
    draw.text((220, 480), "DINING", fill=ink)
    draw.text((450, 520), "KITCHEN", fill=ink)
    draw.text((740, 540), "LOUNGE", fill=ink)

    # Title block
    draw.rectangle([60, 850, 1040, 890], outline=ink, width=1)
    draw.text((80, 858), "PROJECT: Sample Tower — FLOOR PLAN Rev 2", fill=ink)
    draw.text((700, 858), "SHEET: A-102", fill=ink)
    draw.text((80, 874), "SCALE: 1/4\" = 1'-0\"   *** OPEN-PLAN LAYOUT ***", fill=ink)

    # Grid marks
    for x in range(0, W, 100):
        draw.line([(x, 50), (x, 55)], fill=ink, width=1)
        draw.line([(x, 845), (x, 850)], fill=ink, width=1)
    for y in range(0, H, 100):
        draw.line([(50, y), (55, y)], fill=ink, width=1)
        draw.line([(1045, y), (1050, y)], fill=ink, width=1)


img1 = Image.new("RGB", (W, H), (255, 255, 255))
d1 = ImageDraw.Draw(img1)
draw_v1(d1)
img1.save(os.path.join(OUT, "test_floorplan_v3.png"))
print("Created test_floorplan_v3.png")

img2 = Image.new("RGB", (W, H), (255, 255, 255))
d2 = ImageDraw.Draw(img2)
draw_v2(d2)
img2.save(os.path.join(OUT, "test_floorplan_v4.png"))
print("Created test_floorplan_v4.png")

print(f"\nDone! Files in {OUT}")
print("Differences: removed corridor wall, new open-plan layout, removed staircase,")
print("added kitchen island + dining table, moved sofa, new window, etc.")
