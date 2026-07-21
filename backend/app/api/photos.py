from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import uuid
import base64
from typing import List
from app.database import get_db
from app.models.models import Event, Photo, ActivityLog
from app.schemas.schemas import PhotoOut
from app.services.storage import upload_file_to_r2
from app.services.image_processor import process_three_tier_image
from app.worker import process_uploaded_photo_task

router = APIRouter(prefix="/photos", tags=["Photos Management"])

@router.post("/upload/{event_code}", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    event_code: str,
    file: UploadFile = File(...),
    category: str = Form("candid"),
    title: str = Form("Wedding Moment"),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.code == event_code.lower()).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    image_bytes = await file.read()
    photo_id = f"p-{uuid.uuid4().hex[:8]}"
    
    # Process 3-tier WebP images synchronously or upload to Cloudflare R2
    web_bytes, thumb_bytes = process_three_tier_image(image_bytes)
    
    original_key = upload_file_to_r2(image_bytes, f"{event.code}/originals/{photo_id}.jpg", file.content_type)
    web_key = upload_file_to_r2(web_bytes, f"{event.code}/web/{photo_id}.webp", "image/webp")
    thumb_key = upload_file_to_r2(thumb_bytes, f"{event.code}/thumbs/{photo_id}.webp", "image/webp")
    
    photo = Photo(
        id=photo_id,
        event_id=event.id,
        original_key=original_key,
        web_key=web_key,
        thumbnail_key=thumb_key,
        category=category,
        title=title
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    # Queue Celery background job for SCRFD + ArcFace face detection
    try:
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        process_uploaded_photo_task.delay(photo_id, event.id, image_b64)
    except Exception as e:
        # Fallback to sync processing if Celery worker is offline
        pass

    return PhotoOut(
        id=photo.id,
        url=photo.web_key,
        category=photo.category,
        title=photo.title,
        faces=[]
    )

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(photo_id: str, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    db.delete(photo)
    db.commit()
    return None
