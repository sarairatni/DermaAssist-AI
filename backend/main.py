from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.database import Base, engine
from app.api import auth, patients, consultations, images, ai, advice, checkins

# Créer les tables de la base de données
Base.metadata.create_all(bind=engine)

# Initialiser l'application FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="API for DermAssist AI - Dermatology assistant for doctors and patients",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware pour la gestion des erreurs globales
@app.middleware("http")
async def error_handler_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Enregistrer les routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(consultations.router)
app.include_router(images.router)
app.include_router(ai.router)
app.include_router(advice.router)
app.include_router(checkins.router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Vérifier que le serveur est en bonne santé."""
    return {
        "status": "ok",
        "version": settings.API_VERSION
    }

# Root endpoint
@app.get("/")
async def root():
    """Endpoint racine."""
    return {
        "title": settings.API_TITLE,
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
