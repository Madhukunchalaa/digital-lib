from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    code: str
    label: str

# Photo Schemas
class PhotoBase(BaseModel):
    id: str
    category: str
    title: str
    original_url: str
    web_url: str
    thumbnail_url: str

class PhotoCreate(BaseModel):
    category: str = "candid"
    title: str

class PhotoOut(BaseModel):
    id: str
    url: str
    category: str
    title: str
    faces: List[str] = []

    class Config:
        from_attributes = True

# Event Schemas
class EventBase(BaseModel):
    code: str
    title: str
    couple: str
    date: str

class EventCreate(EventBase):
    password: str

class EventUpdate(BaseModel):
    title: Optional[str] = None
    couple: Optional[str] = None
    date: Optional[str] = None
    password: Optional[str] = None

class EventOut(EventBase):
    id: int
    password: str
    photos: List[PhotoOut] = []

    class Config:
        from_attributes = True

# Face Search Schemas
class FaceMatchOut(BaseModel):
    id: str
    url: str
    title: str
    category: str
    confidence: float

class FaceSearchResponse(BaseModel):
    matches_count: int
    confidence: float
    matched_photos: List[FaceMatchOut]

# Audit Log Schemas
class ActivityLogOut(BaseModel):
    id: int
    timestamp: str
    eventCode: str
    action: str
    details: str

class SystemStatsOut(BaseModel):
    totalEvents: int
    totalPhotos: int
    totalDownloads: int
