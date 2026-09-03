from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import yt_dlp
import asyncio
from typing import Optional, List
import tempfile
import os
import glob

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
    Retornar informações de download para vídeo ou áudio do YouTube

    Retorna metadados que permitem ao cliente fazer o download
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL é obrigatória")

        # Configuração básica que funciona em quase todos os vídeos
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,  # Não baixar, apenas extrair info
        }

        # Selecionar formato baseado no tipo de download
        if request.format_type == "audio":
            ydl_opts['format'] = 'bestaudio'
        else:
            # Para vídeo, usar apenas 'best' que sempre funciona
            ydl_opts['format'] = 'best'

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)

            return {
                "success": True,
                "title": info.get('title'),
                "format_type": request.format_type,
                "quality": request.quality if request.format_type == "video" else "default",
                "duration": info.get('duration'),
                "uploader": info.get('uploader'),
                "message": "Informações de download obtidas com sucesso. Use a API de download para obter o arquivo."
            }

    except Exception as e:
        error_msg = str(e)
        # Retornar erro mais específico
        if "not available" in error_msg or "Requested format" in error_msg:
            raise HTTPException(status_code=400, detail="Formato não disponível para este vídeo. Tente outro vídeo.")
        raise HTTPException(status_code=500, detail=f"Erro ao processar: {error_msg}")

@router.post("/stream")
async def stream_download(request: DownloadRequest):
    """
    Fazer streaming direto do arquivo (download no navegador)
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL é obrigatória")

        # Primeiro, extrair os formatos disponíveis
        print(f"DEBUG: Tentando baixar {request.url}")

        ydl_opts_info = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'socket_timeout': 30,
        }

        print(f"DEBUG: Extraindo informações...")
        with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
            info = ydl.extract_info(request.url, download=False)
            formats = info.get('formats', [])
            print(f"DEBUG: Total de formatos encontrados: {len(formats)}")

        # Encontrar o melhor formato disponível
        # Preferir formatos com vídeo + áudio e boa qualidade

        # Filtrar formatos com vídeo e áudio, ordenar por altura (qualidade)
        video_audio_formats = [
            fmt for fmt in formats
            if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none'
        ]

        if video_audio_formats:
            # Ordenar por altura (maior = melhor qualidade) e depois por filesize
            video_audio_formats.sort(
                key=lambda x: (x.get('height') or 0, x.get('filesize') or 0),
                reverse=True
            )
            selected_format = video_audio_formats[0].get('format_id')
            print(f"DEBUG: Formato selecionado (vídeo+áudio, qualidade {video_audio_formats[0].get('height')}p): {selected_format}")
        else:
            # Se não encontrou vídeo+áudio combinado, usar apenas vídeo
            print(f"DEBUG: Nenhum formato com vídeo+áudio encontrado. Usando apenas vídeo...")

            video_formats = [fmt for fmt in formats if fmt.get('vcodec') != 'none']

            if video_formats:
                # Ordenar vídeos por qualidade
                video_formats.sort(key=lambda x: x.get('height') or 0, reverse=True)
                selected_format = video_formats[0].get('format_id')
                height = video_formats[0].get('height')
                print(f"DEBUG: Formato selecionado (vídeo, {height}p): {selected_format}")
            elif formats:
                # Usar o primeiro formato disponível
                selected_format = formats[0].get('format_id')
                print(f"DEBUG: Usando primeiro formato disponível: {selected_format}")

        if not selected_format:
            raise HTTPException(status_code=400, detail="Nenhum formato de vídeo disponível para este URL")

        # Agora fazer o download com o formato específico
        import time
        temp_dir = tempfile.gettempdir()
        timestamp = int(time.time())
        temp_file = os.path.join(temp_dir, f'video_{timestamp}.%(ext)s')

        ydl_opts_download = {
            'quiet': True,
            'no_warnings': True,
            'outtmpl': temp_file,
            'format': selected_format,
            'socket_timeout': 30,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }

        print(f"DEBUG: Iniciando download com formato: {selected_format}")

        with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
            print(f"DEBUG: Iniciando extração de info...")
            info = ydl.extract_info(request.url, download=True)
            print(f"DEBUG: Info obtida, título: {info.get('title')}")

            filename = ydl.prepare_filename(info)
            print(f"DEBUG: Nome do arquivo preparado: {filename}")

            # O filepath pode estar em subdiretorias, tentar encontrar o arquivo
            possible_paths = [
                os.path.join(temp_dir, filename),
                filename,
                os.path.basename(filename),
                os.path.join(temp_dir, os.path.basename(filename))
            ]

            filepath = None
            for path in possible_paths:
                print(f"DEBUG: Procurando em {path}...")
                if os.path.exists(path):
                    filepath = path
                    print(f"DEBUG: Encontrado em {path}")
                    break

            if not filepath:
                # Se ainda não encontrou, listar arquivos no temp dir e pegar o mais recente
                print(f"DEBUG: Arquivo não encontrado nas paths padrão, procurando em temp dir...")
                temp_files = glob.glob(os.path.join(temp_dir, 'video_*'))
                print(f"DEBUG: Arquivos encontrados: {temp_files}")
                if temp_files:
                    filepath = max(temp_files, key=os.path.getctime)
                    print(f"DEBUG: Usando arquivo mais recente: {filepath}")

            if filepath and os.path.exists(filepath):
                print(f"DEBUG: Retornando arquivo: {filepath}")
                return FileResponse(
                    filepath,
                    media_type='application/octet-stream',
                    filename=os.path.basename(filepath)
                )
            else:
                raise HTTPException(status_code=400, detail=f"Arquivo não encontrado. Procurou em: {possible_paths}")

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"DEBUG: Erro - {error_msg}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer streaming: {error_msg}")

@router.get("/formats")
async def get_formats(url: str = Query(...)) -> dict:
    """Listar todos os formatos disponíveis para um vídeo"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])

            # Filtrar formatos de vídeo com qualidade
            video_formats = []
            for fmt in formats:
                height = fmt.get('height')
                if height and fmt.get('vcodec') != 'none':
                    video_formats.append({
                        'format_id': fmt.get('format_id'),
                        'height': height,
                        'fps': fmt.get('fps'),
                        'vcodec': fmt.get('video_codec'),
                        'acodec': fmt.get('audio_codec'),
                        'filesize': fmt.get('filesize')
                    })

            # Filtrar formatos de áudio
            audio_formats = []
            for fmt in formats:
                if fmt.get('vcodec') == 'none' and fmt.get('acodec') != 'none':
                    audio_formats.append({
                        'format_id': fmt.get('format_id'),
                        'acodec': fmt.get('audio_codec'),
                        'abr': fmt.get('abr'),
                        'filesize': fmt.get('filesize')
                    })

            return {
                "title": info.get('title'),
                "video_formats": video_formats[:5],  # Top 5
                "audio_formats": audio_formats[:3],  # Top 3
                "total_formats": len(formats),
                "note": "Use 'best' para selecionar automaticamente o melhor formato"
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")
