from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class YouTubeRequest(BaseModel):
    url: str
    format_type: str = "video"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/test")
def test():
    return {"test": "ok"}

@app.post("/youtube/info")
def youtube_info(request: YouTubeRequest):
    return {
        "title": "Test Video",
        "channel": "Test Channel",
        "thumbnail": "https://via.placeholder.com/320x180",
        "duration": "10:30"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
