"""
Celery tasks for background processing.
"""

import io
import logging
from typing import Optional

from app.workers.celery_app import celery_app
from app.services.pdf_parser import parse_pdf, convert_pdf_to_images
from app.services.diff_engine import generate_diff_mock

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def process_drawing_upload(self, file_bytes: bytes, drawing_id: str):
    """Process uploaded drawing: parse PDF, extract metadata."""
    try:
        pdf_data = parse_pdf(file_bytes)
        logger.info(f"Processed drawing {drawing_id}: {pdf_data['page_count']} pages")
        return {"status": "success", "drawing_id": drawing_id, "pages": pdf_data["page_count"]}
    except Exception as e:
        logger.error(f"Failed to process drawing {drawing_id}: {e}")
        raise self.retry(exc=e)


@celery_app.task(bind=True, max_retries=3)
def compute_diff_task(self, drawing_id_1: str, drawing_id_2: str, sheet_name: str):
    """Compute diff between two drawings in the background."""
    try:
        diff = generate_diff_mock(drawing_id_1, drawing_id_2, sheet_name)
        return diff
    except Exception as e:
        logger.error(f"Diff computation failed: {e}")
        raise self.retry(exc=e)


@celery_app.task
def send_alert_notification(change_id: str, trade: str, project_id: str):
    """Send alert notifications to subscribed users."""
    # In production: query subscriptions, send Slack/email
    logger.info(f"Alert sent for change {change_id} ({trade}) in project {project_id}")
    return {"status": "sent", "change_id": change_id, "trade": trade}
