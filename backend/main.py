from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

# Initialize FastAPI application
app = FastAPI(
    title="Taboo Store API",
    description="Backend API for the Taboo Store web game",
    version="1.0.0"
)

# CORS configuration for frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {
        "message": "Taboo Store API",
        "docs": "/docs",
        "health": "/api/health"
    }
