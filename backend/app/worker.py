from celery import Celery
from app.config import settings
import logging

logger = logging.getLogger(__name__)

celery_app = Celery("shootatsight_tasks", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

@celery_app.task(name="process_uploaded_photo_task")
def process_uploaded_photo_task(photo_id: str, event_id: int, image_bytes_base64: str):
    """
    Celery background worker job:
    1. Runs Pillow 3-tier WebP compression
    2. Runs SCRFD face detection & ArcFace 512-D vector extraction
    3. Saves FaceEmbedding vectors in PostgreSQL pgvector
    """
    import base64
    from app.database import SessionLocal
    from app.models.models import FaceEmbedding
    from app.services.image_processor import process_three_tier_image
    from app.services.ai_engine import extract_faces_from_image
    
    logger.info(f" Celery task started for photo_id: {photo_id}")
    image_bytes = base64.b64decode(image_bytes_base64)
    
    # 1. 3-tier WebP Compression
    web_bytes, thumb_bytes = process_three_tier_image(image_bytes)
    
    # 2. InsightFace SCRFD + ArcFace face extraction
    faces = extract_faces_from_image(image_bytes)
    
    # 3. Store vectors in pgvector
    db = SessionLocal()
    try:
        for face in faces:
            embedding_record = FaceEmbedding(
                photo_id=photo_id,
                event_id=event_id,
                bbox=face["bbox"],
                embedding=face["embedding"]
            )
            db.add(embedding_record)
        db.commit()
        logger.info(f" Celery task completed: Extracted {len(faces)} faces for photo_id {photo_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error in Celery task for photo_id {photo_id}: {e}")
    finally:
        db.close()
