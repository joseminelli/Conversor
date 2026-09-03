from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import yt_dlp
import asyncio
from typing import Optional, List

router = APIRouter()

class YouTubeInfo(BaseModel):
    title: str
    channel: str
    thumbnail: str
    duration: str
    url: str
    video_id: str

class DownloadRequest(BaseModel):
    url: str
    format_type: str = "video"  # video ou audio
    quality: str = "best"

async def get_video_info(url: str) -> YouTubeInfo:
    """Extrai informações do vídeo do YouTube"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            # Formatar duração
            duration_seconds = info.get('duration', 0)
            minutes = duration_seconds // 60
            seconds = duration_seconds % 60
            duration_str = f"{minutes}:{seconds:02d}"

            return YouTubeInfo(
                title=info.get('title', 'Sem título'),
                channel=info.get('uploader', 'Desconhecido'),
                thumbnail=info.get('thumbnail', ''),
                duration=duration_str,
                url=url,
                video_id=info.get('id', '')
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar URL: {str(e)}")

@router.post("/info")
async def get_info(request: DownloadRequest) -> YouTubeInfo:
    """Obter informações de um vídeo do YouTube"""
    if not request.url:
        raise HTTPException(status_code=400, detail="URL é obrigatória")

    # Validar URL
    if not ("youtube.com" in request.url or "youtu.be" in request.url):
        raise HTTPException(status_code=400, detail="URL não é do YouTube")

    return await get_video_info(request.url)

@router.post("/download")
async def download(request: DownloadRequest) -> dict:
    """
    Gerar link de download para vídeo ou áudio do YouTube

    Nota: Retorna informações para o frontend fazer download via client-side
    ou gera um link temporário para streaming
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL é obrigatória")

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }

        if request.format_type == "audio":
            ydl_opts.update({
                'format': 'bestaudio',
                'quiet': False,
                'no_warnings': False,
            })
        else:
            # Para vídeo - usar formatos mais simples e confiáveis
            quality_map = {
                'best': 'best[ext=mp4]',
                '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]',
                '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]',
                '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]',
                '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]'
            }
            ydl_opts['format'] = quality_map.get(request.quality, 'best[ext=mp4]')

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)

            # Para áudio, retornar diretamente o URL
            if request.format_type == "audio":
                formats = info.get('formats', [])
                audio_format = next((f for f in formats if f.get('acodec') != 'none' and f.get('vcodec') == 'none'), None)

                if not audio_format:
                    audio_format = formats[-1] if formats else None

                if not audio_format:
                    raise HTTPException(status_code=400, detail="Não foi possível obter formato de áudio")

                return {
                    "success": True,
                    "title": info.get('title'),
                    "format_type": "audio",
                    "url": audio_format.get('url'),
                    "ext": audio_format.get('ext', 'mp3'),
                    "size": audio_format.get('filesize'),
                    "message": "Use este URL para fazer download do arquivo"
                }

            # Para vídeo, retornar formato combinado
            return {
                "success": True,
                "title": info.get('title'),
                "format_type": "video",
                "quality": request.quality,
                "url": info.get('url'),
                "ext": info.get('ext', 'mp4'),
                "message": "Use este URL para fazer download do arquivo"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar: {str(e)}")

@router.get("/formats")
async def get_formats(url: str = Query(...)) -> dict:
    """Listar todos os formatos disponíveis para um vídeo"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])

            # Filtrar formatos únicos por qualidade
            unique_formats = {}
            for fmt in formats:
                height = fmt.get('height')
                if height and height not in unique_formats:
                    unique_formats[height] = {
                        'height': height,
                        'fps': fmt.get('fps', 'N/A'),
                        'codec': fmt.get('video_codec', 'N/A'),
                        'size': fmt.get('filesize')
                    }

            return {
                "title": info.get('title'),
                "formats": list(unique_formats.values()),
                "total": len(unique_formats)
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")
