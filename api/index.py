from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Conversor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
