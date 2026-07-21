from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
from app.database import Base

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    couple = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    photos = relationship("Photo", back_populates="event", cascade="all, delete-orphan")
    logs = relationship("ActivityLog", back_populates="event", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"
    
    id = Column(String(100), primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    original_key = Column(String(500), nullable=False)
    web_key = Column(String(500), nullable=False)
    thumbnail_key = Column(String(500), nullable=False)
    category = Column(String(50), default="candid", nullable=False)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    event = relationship("Event", back_populates="photos")
    embeddings = relationship("FaceEmbedding", back_populates="photo", cascade="all, delete-orphan")

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(String(100), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    bbox = Column(JSON, nullable=True)  # [x1, y1, x2, y2]
    embedding = Column(Vector(512), nullable=False)  # ArcFace 512-D vector
    created_at = Column(DateTime, default=datetime.utcnow)
    
    photo = relationship("Photo", back_populates="embeddings")

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    event_code = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    event = relationship("Event", back_populates="logs")
