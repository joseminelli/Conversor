from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from pydantic import BaseModel

app = FastAPI(title="Conversor API", version="1.0.0")

# Middleware CORS customizado
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Responder OPTIONS diretamente
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }
            )
        
        # Processar requisição normal
        response = await call_next(request)
        
        # Adicionar headers CORS em TODA resposta
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        
        return response

app.add_middleware(CORSMiddleware)

@app.get("/")
async def root():
    return {"message": "API working"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/test")
async def test():
    return {"test": "success"}

@app.post("/api/youtube/info")
async def youtube_info(url: str = None):
    """Get YouTube video info"""
    if not url:
        raise HTTPException(status_code=400, detail="URL é obrigatória")

    if not ("youtube.com" in url or "youtu.be" in url):
        raise HTTPException(status_code=400, detail="URL não é do YouTube")

    return {"message": "YouTube info endpoint", "url": url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
