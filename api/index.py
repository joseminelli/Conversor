from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class YouTubeRequest(BaseModel):
    url: str
    format_type: str = "video"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://joseminelli.github.io", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
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

@app.post("/youtube/audio-tracks")
def youtube_audio_tracks(request: YouTubeRequest):
    return {
        "audio_tracks": [
            {"format_id": "251", "language": "Portuguese (BR)", "codec": "opus", "bitrate": 128, "is_original": True}
        ]
    }

@app.post("/youtube/stream")
def youtube_stream(request: YouTubeRequest):
    return {"message": "stream"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
