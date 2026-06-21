"""
PDF parsing service using pdfplumber and pdf2image.
"""

import io
import hashlib
from typing import List, Optional
from PIL import Image
import pdfplumber
from pdf2image import convert_from_bytes


def parse_pdf(file_bytes: bytes) -> dict:
    """Extract text and metadata from PDF bytes."""
    result = {
        "pages": [],
        "metadata": {},
        "page_count": 0,
        "hash": hashlib.sha256(file_bytes).hexdigest(),
    }

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        result["page_count"] = len(pdf.pages)
        result["metadata"] = pdf.metadata or {}

        for i, page in enumerate(pdf.pages):
            page_data = {
                "page_number": i + 1,
                "width": page.width,
                "height": page.height,
                "text": page.extract_text() or "",
                "tables": page.extract_tables() or [],
            }
            result["pages"].append(page_data)

    return result


def convert_pdf_to_images(file_bytes: bytes, dpi: int = 200) -> List[Image.Image]:
    """Convert PDF pages to PIL Images."""
    return convert_from_bytes(file_bytes, dpi=dpi)


def extract_sheet_name(filename: str) -> str:
    """Extract sheet name from filename like 'A-101_Rev4.pdf'."""
    import re
    match = re.match(r'^([A-Z]-\d+)', filename)
    return match.group(1) if match else filename.replace('.pdf', '')


def extract_revision(filename: str) -> str:
    """Extract revision number from filename like 'A-101_Rev4.pdf'."""
    import re
    match = re.search(r'[Rr]ev[\s._-]*(\d+|[\w]+)', filename)
    return f"Rev {match.group(1)}" if match else "Rev 1"
