import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.oauth import router as oauth_router
from app.api.diff import router as diff_router
from app.api.drawings_proxy import router as drawings_proxy_router
from app.api.alerts_proxy import router as alerts_proxy_router
from app.api.risk_proxy import router as risk_proxy_router
from app.api.ingestion_proxy import router as ingestion_proxy_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(oauth_router, prefix="/api")
app.include_router(diff_router, prefix="/api")
app.include_router(drawings_proxy_router, prefix="/api")
app.include_router(alerts_proxy_router, prefix="/api")
app.include_router(risk_proxy_router, prefix="/api")
app.include_router(ingestion_proxy_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": settings.APP_NAME, "version": settings.VERSION}
