from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Event, Photo, ActivityLog
from app.schemas.schemas import SystemStatsOut, ActivityLogOut

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/stats", response_model=SystemStatsOut)
def get_admin_stats(db: Session = Depends(get_db)):
    total_events = db.query(Event).count()
    total_photos = db.query(Photo).count()
    total_downloads = db.query(ActivityLog).filter(ActivityLog.action.contains("Download")).count()
    
    return SystemStatsOut(
        totalEvents=total_events,
        totalPhotos=total_photos,
        totalDownloads=total_downloads
    )

@router.get("/logs", response_model=List[ActivityLogOut])
def get_activity_logs(db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(100).all()
    output = []
    for l in logs:
        output.append(ActivityLogOut(
            id=l.id,
            timestamp=l.timestamp.isoformat(),
            eventCode=l.event_code,
            action=l.action,
            details=l.details or ""
        ))
    return output
