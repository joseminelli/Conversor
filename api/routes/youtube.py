from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import yt_dlp
import asyncio
from typing import Optional, List
import tempfile
import os
import glob

# Importar FFmpeg do imageio-ffmpeg
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except:
    FFMPEG_PATH = None

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
    audio_track_id: Optional[str] = None  # ID do áudio escolhido (para seleção de idioma)

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

        # YouTube frequentemente separa vídeo e áudio
        # Tentar combinar melhor vídeo + áudio, com fallbacks

        # Se é apenas áudio, não procurar vídeo
        if request.format_type == "audio":
            audio_formats = []
            for fmt in formats:
                if fmt.get('vcodec') == 'none' and fmt.get('acodec') != 'none':
                    audio_formats.append((fmt.get('abr') or 0, fmt.get('filesize') or 0, fmt.get('format_id')))

            # Se usuário especificou um áudio, usar esse
            if request.audio_track_id:
                audio_formats = [(0, 0, request.audio_track_id)]
            elif audio_formats:
                # Pegar o primeiro áudio (idioma original)
                audio_formats.sort(reverse=True)
                audio_formats = [audio_formats[0]]

            selected_format = audio_formats[0][2] if audio_formats else 'bestaudio'
            print(f"DEBUG: Modo ÁUDIO - usando formato: {selected_format}")
        else:
            # Para vídeo, procurar vídeo+áudio
            combined_formats = []
            video_formats = []
            audio_formats = []

            for fmt in formats:
                # Procurar formato que tenha ambos (melhor qualidade primeiro)
                if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                    combined_formats.append((fmt.get('height') or 0, fmt.get('filesize') or 0, fmt.get('format_id')))

                # Procurar melhor vídeo separado
                if fmt.get('vcodec') != 'none' and fmt.get('acodec') == 'none':
                    video_formats.append((fmt.get('height') or 0, fmt.get('filesize') or 0, fmt.get('format_id')))

                # Procurar melhor áudio separado
                if fmt.get('vcodec') == 'none' and fmt.get('acodec') != 'none':
                    audio_formats.append((fmt.get('abr') or 0, fmt.get('filesize') or 0, fmt.get('format_id')))

            # Ordenar por qualidade para vídeo
            combined_formats.sort(reverse=True)
            video_formats.sort(reverse=True)

            best_combined = combined_formats[0][2] if combined_formats else None
            # Filtrar vídeos pela qualidade escolhida
            best_video = None
            if request.quality != 'best':
                # Extrair altura da qualidade (ex: '720p' -> 720)
                try:
                    target_height = int(request.quality.replace('p', ''))
                    # Procurar vídeo com altura máxima <= target_height
                    filtered_videos = [v for v in video_formats if v[0] <= target_height]
                    if filtered_videos:
                        best_video = filtered_videos[0][2]  # Usar o primeiro (já ordenado decrescente)
                except:
                    best_video = video_formats[0][2] if video_formats else None
            else:
                best_video = video_formats[0][2] if video_formats else None

            best_audio = audio_formats[0][2] if audio_formats else None

            # Se usuário especificou um áudio, usar esse
            if request.audio_track_id:
                best_audio = request.audio_track_id
                print(f"DEBUG: Usando áudio especificado pelo usuário: {best_audio}")

            # Decidir qual formato usar para vídeo
            if best_combined:
                selected_format = best_combined
                print(f"DEBUG: Formato combinado encontrado: {selected_format}")
            elif best_video and best_audio:
                selected_format = f"{best_video}+{best_audio}"
                print(f"DEBUG: Combinando vídeo+áudio separados: {selected_format}")
            elif best_video:
                selected_format = best_video
                print(f"DEBUG: Apenas vídeo disponível: {selected_format}")
            elif formats:
                selected_format = formats[0].get('format_id')
                print(f"DEBUG: Usando primeiro formato: {selected_format}")
            else:
                raise HTTPException(status_code=400, detail="Nenhum formato disponível")

        if not selected_format:
            raise HTTPException(status_code=400, detail="Nenhum formato disponível")

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
            },
            'skip_unavailable_fragments': True,
            'abort_on_error': False,
        }

        # Adicionar caminho do FFmpeg se disponível
        if FFMPEG_PATH:
            print(f"DEBUG: Usando FFmpeg de: {FFMPEG_PATH}")
            ydl_opts_download['ffmpeg_location'] = FFMPEG_PATH
        else:
            print(f"DEBUG: FFmpeg não localizado, tentando com 'best' simples")

        print(f"DEBUG: Iniciando download com formato: {selected_format}")

        info = None
        try:
            with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
                print(f"DEBUG: Iniciando extração de info...")
                info = ydl.extract_info(request.url, download=True)
                print(f"DEBUG: Info obtida, título: {info.get('title')}")
        except Exception as e:
            # Se falhar com bestvideo+bestaudio, tentar com 'best' simples
            if "ffmpeg" in str(e).lower() or "merge" in str(e).lower():
                print(f"DEBUG: Erro com merge ({str(e)[:50]}...), tentando apenas 'best'...")
                ydl_opts_download['format'] = 'best'

                with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
                    print(f"DEBUG: Tentando novo download com 'best'...")
                    info = ydl.extract_info(request.url, download=True)
                    print(f"DEBUG: Info obtida, título: {info.get('title')}")
            else:
                raise

        # Agora procurar pelo arquivo (fora do bloco except!)
        if info:
            # Construir o nome do arquivo baseado no info do yt-dlp
            filename = f"{info.get('title', 'video')}.{info.get('ext', 'mp4')}"
            print(f"DEBUG: Nome do arquivo preparado: {filename}")
            print(f"DEBUG: Diretório temporário: {temp_dir}")
            print(f"DEBUG: Template usado: {temp_file}")

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
                    size = os.path.getsize(path)
                    filepath = path
                    print(f"DEBUG: Encontrado em {path} ({size} bytes)")
                    break

            if not filepath:
                # Se ainda não encontrou, listar arquivos no temp dir e pegar o mais recente
                print(f"DEBUG: Arquivo não encontrado nas paths padrão, procurando em temp dir...")
                temp_files = glob.glob(os.path.join(temp_dir, 'video_*'))
                print(f"DEBUG: Arquivos encontrados: {len(temp_files)}")
                for tf in temp_files[-5:]:  # Mostrar os últimos 5
                    size = os.path.getsize(tf) if os.path.exists(tf) else 0
                    print(f"  - {tf} ({size} bytes)")
                if temp_files:
                    filepath = max(temp_files, key=os.path.getctime)
                    size = os.path.getsize(filepath)
                    print(f"DEBUG: Usando arquivo mais recente: {filepath} ({size} bytes)")

            if filepath and os.path.exists(filepath):
                size = os.path.getsize(filepath)
                print(f"DEBUG: Retornando arquivo: {filepath} ({size} bytes)")
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

@router.post("/audio-tracks")
async def get_audio_tracks(request: DownloadRequest) -> dict:
    """Listar faixas de áudio disponíveis com idiomas"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(request.url, download=False)
            formats = info.get('formats', [])

            # Extrair áudios disponíveis
            audio_tracks = []
            for fmt in formats:
                if fmt.get('vcodec') == 'none' and fmt.get('acodec') != 'none':
                    language = fmt.get('language') or 'Desconhecido'
                    abr = fmt.get('abr') or 0
                    audio_tracks.append({
                        'format_id': fmt.get('format_id'),
                        'language': language,
                        'codec': fmt.get('acodec'),
                        'bitrate': abr
                    })

            return {
                "title": info.get('title'),
                "audio_tracks": audio_tracks,
                "total": len(audio_tracks)
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")

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
