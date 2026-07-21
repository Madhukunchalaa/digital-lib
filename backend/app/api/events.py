from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Event, ActivityLog
from app.schemas.schemas import EventCreate, EventOut, EventUpdate

router = APIRouter(prefix="/events", tags=["Events Management"])

@router.get("/", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@router.get("/{code}", response_model=EventOut)
def get_event_by_code(code: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.code == code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    existing = db.query(Event).filter(Event.code == event_in.code.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Event code already exists")
    
    event = Event(
        code=event_in.code.lower(),
        password=event_in.password,
        title=event_in.title,
        couple=event_in.couple,
        date=event_in.date
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    log = ActivityLog(event_id=event.id, event_code=event.code, action="Create Event", details=f"Created event: {event.title}")
    db.add(log)
    db.commit()
    return event

@router.put("/{code}", response_model=EventOut)
def update_event(code: str, event_update: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.code == code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event_update.title: event.title = event_update.title
    if event_update.couple: event.couple = event_update.couple
    if event_update.date: event.date = event_update.date
    if event_update.password: event.password = event_update.password
    
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(code: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.code == code).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    log = ActivityLog(event_code=code, action="Delete Event", details=f"Deleted event: {event.title}")
    db.add(log)
    db.delete(event)
    db.commit()
    return None
