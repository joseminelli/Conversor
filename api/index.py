from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(title="Conversor API", version="1.0.0")

# CORS ANTES de tudo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handler para OPTIONS
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    return Response(status_code=200)

@app.get("/")
async def root():
    return {"message": "API working"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Test endpoint
@app.get("/test")
async def test():
    return {"test": "success"}
