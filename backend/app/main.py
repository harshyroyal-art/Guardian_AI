"""
AutoGuardian AI - Main FastAPI Application
Universal AI-Powered Vehicle Safety and Driver Assistance System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as api_router

app = FastAPI(
    title="AutoGuardian AI Safety Intelligence API",
    description=(
        "Explainable Unified Safety Intelligence Engine and multi-modal ADAS assistant. "
        "Integrates genuine computer vision object detection, driver attention monitoring, "
        "sensor simulation (blind-spot, parking), vehicle diagnostics, and prioritized alerts."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS to allow local development on laptop + Android access over local Wi-Fi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local network devices (e.g. Android phone)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "AutoGuardian AI",
        "tagline": "Intelligent Safety for Every Generation of Vehicle",
        "status": "online",
        "api_docs": "/docs",
        "api_prefix": "/api",
    }


if __name__ == "__main__":
    import uvicorn
    # 0.0.0.0 allows access from Android devices on the same Wi-Fi network
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
