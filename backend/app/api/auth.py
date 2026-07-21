from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Event, AdminUser, ActivityLog
from app.schemas.schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    password = req.password.strip()
    
    # 1. Photographer Admin login check
    if username == "admin" and password == "admin123":
        # Log activity
        log = ActivityLog(event_code="admin", action="Admin Login", details="Logged into photographer dashboard")
        db.add(log)
        db.commit()
        return TokenResponse(
            access_token="admin_jwt_token_madtech_2026",
            role="admin",
            code="admin",
            label="Photographer Admin"
        )
    
    # 2. Client Event Code login check
    event = db.query(Event).filter(Event.code == username, Event.password == password).first()
    if event:
        log = ActivityLog(event_id=event.id, event_code=event.code, action="Client Login", details=f"Logged in via code: {event.code}")
        db.add(log)
        db.commit()
        return TokenResponse(
            access_token=f"couple_jwt_token_{event.code}",
            role="couple",
            code=event.code,
            label=event.couple
        )
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid event code or password. Please try again."
    )
