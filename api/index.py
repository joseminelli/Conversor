import sys
sys.path.insert(0, '/var/task')

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import os
    from dotenv import load_dotenv
    from routes.youtube import router as youtube_router
    from routes.instagram import router as instagram_router

    load_dotenv()

    app = FastAPI(title="Conversor Universal API", version="1.0.0")

    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://joseminelli.github.io",
        "https://localhost"
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(youtube_router, prefix="/api/youtube", tags=["youtube"])
    app.include_router(instagram_router, prefix="/api/instagram", tags=["instagram"])

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "service": "Conversor Universal API"}

    @app.get("/")
    async def root():
        return {
            "message": "Conversor Universal API",
            "version": "1.0.0",
            "endpoints": {
                "youtube": "/api/youtube/info",
                "instagram": "/api/instagram/info",
                "health": "/api/health"
            }
        }

except Exception as e:
    print(f"Error loading app: {str(e)}")
    import traceback
    traceback.print_exc()
    raise
