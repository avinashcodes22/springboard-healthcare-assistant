from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import engine
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.health_content import router as health_content_router
from app.routes.users import router as users_router

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    description="Multilingual healthcare communication assistance platform.",
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)
app.include_router(health_content_router)


@app.get("/")
def root():
    return {
        "message": "Healthcare Assistant API is running",
        "documentation": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "healthcare-assistant-api",
    }


@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"status": "healthy", "database": "connected"}

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )
