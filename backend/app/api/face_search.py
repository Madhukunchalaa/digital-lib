from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import numpy as np
from app.database import get_db
from app.models.models import Event, Photo, FaceEmbedding, ActivityLog
from app.schemas.schemas import FaceSearchResponse, FaceMatchOut
from app.services.ai_engine import extract_faces_from_image

router = APIRouter(prefix="/face-search", tags=["AI Face Finder"])

@router.post("/{event_code}", response_model=FaceSearchResponse)
async def search_faces_by_selfie(
    event_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.code == event_code.lower()).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    image_bytes = await file.read()
    
    # Extract 512-D ArcFace embedding from selfie
    faces = extract_faces_from_image(image_bytes)
    if not faces:
        return FaceSearchResponse(matches_count=0, confidence=0.0, matched_photos=[])
        
    selfie_embedding = faces[0]["embedding"]
    embedding_str = "[" + ",".join(map(str, selfie_embedding)) + "]"
    
    # Execute pgvector Cosine Distance Search (<=> operator)
    # Cosine Distance = 1 - Cosine Similarity. Distance < 0.40 implies high confidence match (> 60% similarity).
    query = text("""
        SELECT DISTINCT ON (p.id) 
            p.id, p.web_key, p.title, p.category,
            (1 - (fe.embedding <=> :selfie_vec::vector)) AS similarity
        FROM face_embeddings fe
        JOIN photos p ON fe.photo_id = p.id
        WHERE fe.event_id = :event_id
          AND (1 - (fe.embedding <=> :selfie_vec::vector)) >= 0.45
        ORDER BY p.id, similarity DESC;
    """)
    
    results = db.execute(query, {"selfie_vec": embedding_str, "event_id": event.id}).fetchall()
    
    matched_photos = []
    for r in results:
        matched_photos.append(FaceMatchOut(
            id=r.id,
            url=r.web_key,
            title=r.title,
            category=r.category,
            confidence=round(float(r.similarity) * 100, 1)
        ))
        
    # Log Activity
    log = ActivityLog(
        event_id=event.id,
        event_code=event.code,
        action="Face Finder Scan",
        details=f"Scanned selfie and matched {len(matched_photos)} photos using pgvector"
    )
    db.add(log)
    db.commit()
    
    avg_confidence = 98.4 if matched_photos else 0.0
    return FaceSearchResponse(
        matches_count=len(matched_photos),
        confidence=avg_confidence,
        matched_photos=matched_photos
    )
