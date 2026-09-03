from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Criar app AQUI - top level
app = FastAPI(
    title="Conversor Universal API",
    description="API para download de conteúdo de YouTube e Instagram",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://joseminelli.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importar rotas DEPOIS de criar app
try:
    from routes.youtube import router as youtube_router
    from routes.instagram import router as instagram_router
    
    app.include_router(youtube_router, prefix="/api/youtube", tags=["youtube"])
    app.include_router(instagram_router, prefix="/api/instagram", tags=["instagram"])
except Exception as e:
    print(f"Erro ao carregar rotas: {e}")

@app.get("/")
async def root():
    return {"message": "Conversor API", "version": "1.0.0"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
