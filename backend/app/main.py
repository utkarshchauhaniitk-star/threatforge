from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.services.detection_engine import initialize_default_rules
from app.schemas.common import HealthResponse

# API Routers
from app.api.events import router as events_router
from app.api.alerts import router as alerts_router
from app.api.investigations import router as investigations_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
from app.api.rules import router as rules_router
from app.api.demo import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and rules are seeded
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        initialize_default_rules(db)
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="ThreatForge: Security Monitoring & Threat Detection Platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log internal error without exposing sensitive internals
    if settings.ENVIRONMENT.lower() == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An internal server error occurred. Please contact the security administrator."},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal Server Error", "error_type": type(exc).__name__, "details": str(exc)},
    )


# Health check endpoint
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        database=db_status,
        environment=settings.ENVIRONMENT,
        version=settings.API_VERSION,
        timestamp=datetime.now(timezone.utc),
    )


# Register API Routers
app.include_router(events_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(investigations_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(rules_router, prefix="/api")
app.include_router(demo_router, prefix="/api")

# Mount React Frontend SPA (if built for unified single-service deployment)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = FRONTEND_DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
