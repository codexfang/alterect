"""
Symbol classifier inference.
Maps detected symbols to construction element types.
"""

from typing import Dict, List, Optional

SYMBOL_CLASSES = {
    "outlet_duplex": {"type": "outlet_added", "trade": "electrical", "severity": "medium"},
    "outlet_quad": {"type": "outlet_added", "trade": "electrical", "severity": "medium"},
    "switch_single": {"type": "switch_added", "trade": "electrical", "severity": "low"},
    "switch_threeway": {"type": "switch_added", "trade": "electrical", "severity": "low"},
    "panel": {"type": "panel_added", "trade": "electrical", "severity": "high"},
    "conduit": {"type": "conduit_added", "trade": "electrical", "severity": "low"},
    "pipe_water": {"type": "pipe_added", "trade": "plumbing", "severity": "medium"},
    "pipe_waste": {"type": "pipe_added", "trade": "plumbing", "severity": "medium"},
    "riser": {"type": "plumbing_riser", "trade": "plumbing", "severity": "high"},
    "fixture_sink": {"type": "fixture_added", "trade": "plumbing", "severity": "medium"},
    "fixture_toilet": {"type": "fixture_added", "trade": "plumbing", "severity": "medium"},
    "wall_interior": {"type": "wall_added", "trade": "structural", "severity": "high"},
    "wall_exterior": {"type": "wall_added", "trade": "structural", "severity": "high"},
    "door_single": {"type": "door_added", "trade": "structural", "severity": "medium"},
    "door_double": {"type": "door_added", "trade": "structural", "severity": "medium"},
    "window": {"type": "window_added", "trade": "structural", "severity": "medium"},
    "beam": {"type": "beam_added", "trade": "structural", "severity": "high"},
    "column": {"type": "column_added", "trade": "structural", "severity": "high"},
    "duct": {"type": "hvac_duct", "trade": "hvac", "severity": "medium"},
    "diffuser": {"type": "diffuser_added", "trade": "hvac", "severity": "low"},
    "note": {"type": "note_added", "trade": "other", "severity": "low"},
}


def classify_symbol(symbol_class: str) -> Optional[Dict]:
    """Get change metadata for a detected symbol class."""
    return SYMBOL_CLASSES.get(symbol_class)


def get_all_classes() -> List[str]:
    return list(SYMBOL_CLASSES.keys())
