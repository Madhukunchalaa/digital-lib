from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import init_db
from app.api import auth, events, photos, face_search, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PostgreSQL + pgvector extension and creating tables...")
    try:
        init_db()
    except Exception as e:
        logger.warning(f"Could not connect to live PostgreSQL: {e}. App starting in mock mode.")
    yield
    logger.info("Shutting down Shoot @ Sight FastAPI backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Enable CORS for React frontend & localhost development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(photos.router, prefix=settings.API_V1_STR)
app.include_router(face_search.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Shoot @ Sight Weddings Portal Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "architecture": "FastAPI + PostgreSQL pgvector + InsightFace SCRFD/ArcFace + Cloudflare R2 + Redis/Celery"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
