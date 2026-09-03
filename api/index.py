from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Importar rotas
from routes.youtube import router as youtube_router
from routes.instagram import router as instagram_router

load_dotenv()

app = FastAPI(
    title="Conversor Universal API",
    description="API para download de conteúdo de YouTube, Instagram e TikTok",
    version="1.0.0"
)

# CORS - permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, usar domínio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(youtube_router, prefix="/api/youtube", tags=["youtube"])
app.include_router(instagram_router, prefix="/api/instagram", tags=["instagram"])

@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "Conversor Universal API"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Conversor Universal API",
        "version": "1.0.0",
        "endpoints": {
            "youtube": "/api/youtube/info",
            "instagram": "/api/instagram/info",
            "health": "/api/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
