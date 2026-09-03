from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

app = FastAPI(title="Conversor API", version="1.0.0")

class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            )
        
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

app.add_middleware(CORSMiddleware)

@app.get("/")
async def root():
    return {"message": "API ok"}

@app.post("/youtube/info")
async def youtube_info(url: str = None):
    return {"url": url, "message": "ok"}

@app.get("/test")
async def test():
    return {"test": "ok"}
