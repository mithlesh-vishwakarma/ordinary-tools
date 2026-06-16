import yt_dlp
import re
import os
import uuid
import asyncio
import glob
import logging
import shutil
import subprocess
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("ordinary-tools-api.instagram")

# Resolve ffmpeg version at startup
FFMPEG_VERSION = "unknown"
try:
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        res = subprocess.run([ffmpeg_path, "-version"], capture_output=True, text=True, check=True)
        FFMPEG_VERSION = res.stdout.splitlines()[0]
except Exception:
    pass

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "/tmp/downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def get_shortcode(url: str) -> Optional[str]:
    pattern = r'/(?:p|reels|reel|tv)/([^/?#&]+)'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def _classify_format(vcodec: str, acodec: str) -> str:
    has_video = vcodec and vcodec != "none"
    has_audio = acodec and acodec != "none"
    if has_video and has_audio:
        return "Combined"
    elif has_video:
        return "Video Only"
    elif has_audio:
        return "Audio Only"
    return "N/A"

def _format_duration(seconds: int) -> str:
    h, remainder = divmod(seconds, 3600)
    m, s = divmod(remainder, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

def _extract_info(url: str, opts: dict):
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)

def _download(url: str, opts: dict):
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

async def get_instagram_info(url: str):
    logger.info(f"Fetching media info for Instagram URL: {url}")
    shortcode = get_shortcode(url)
    if not shortcode:
        logger.warning(f"Invalid Instagram URL provided: {url}")
        raise ValueError("Invalid Instagram URL")
    
    ydl_opts = {
        "quiet": True,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android"]
            }
        }
    }
    
    cookie_path = "/tmp/cookies/youtube_cookies.txt"
    cookies_enabled = os.path.exists(cookie_path)
    cookies_status = "enabled" if cookies_enabled else "disabled"
    
    logger.info(f"yt-dlp version: {yt_dlp.version.__version__} | ffmpeg version: {FFMPEG_VERSION} | YouTube cookies: {cookies_status}")

    if cookies_enabled:
        ydl_opts["cookiefile"] = cookie_path
        logger.info(f"Using cookies file: {cookie_path}")
    else:
        logger.info("No cookies file found. Fetching Instagram info without cookies.")

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _extract_info, url, ydl_opts)
    except Exception as e:
        logger.error(
            f"Failed to extract info for Instagram URL: {url} | Error: {str(e)} | Cookies enabled: {cookies_enabled}",
            exc_info=True
        )
        raise ValueError("YouTube extraction failed")
    
    raw_formats = info.get("formats", [])
    formats = []
    for f in raw_formats:
        vcodec = f.get("vcodec") or "none"
        acodec = f.get("acodec") or "none"
        ftype = _classify_format(vcodec, acodec)
        if ftype == "N/A": continue
        formats.append({
            "format_id": str(f.get("format_id", "")),
            "ext": f.get("ext", ""),
            "resolution": f.get("resolution") or f.get("format_note") or "Original",
            "type": ftype,
            "vcodec": vcodec[:20],
            "acodec": acodec[:20],
            "filesize": f.get("filesize") or f.get("filesize_approx"),
            "note": f.get("format_note", ""),
        })
        
    if not formats:
        formats.append({
            "format_id": "best",
            "ext": "mp4",
            "resolution": "Original",
            "type": "Combined",
            "vcodec": "N/A",
            "acodec": "N/A",
            "filesize": None,
            "note": "Highest quality available"
        })
        
    duration = int(info.get("duration") or 0)
    duration_str = _format_duration(duration) if duration > 0 else "Static"
    
    upload_date_raw = info.get("upload_date")
    if upload_date_raw and len(upload_date_raw) == 8:
        upload_date = f"{upload_date_raw[:4]}-{upload_date_raw[4:6]}-{upload_date_raw[6:]}"
    else:
        upload_date = upload_date_raw
        
    width = info.get("width") or 0
    height = info.get("height") or 0
    
    logger.info(f"Successfully retrieved Instagram info: {info.get('title') or shortcode}")
    return {
        "title": info.get("title") or f"Instagram Post by {info.get('channel') or info.get('uploader') or 'User'}",
        "thumbnail": info.get("thumbnail") or "",
        "duration": duration,
        "duration_string": duration_str,
        "channel": info.get("channel") or info.get("uploader") or "Unknown",
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "comment_count": info.get("comment_count"),
        "repost_count": info.get("repost_count"),
        "is_vertical": height > width or True,
        "upload_date": upload_date,
        "formats": formats,
    }

async def download_instagram(url: str, format_id: Optional[str] = None):
    logger.info(f"Instagram download requested: URL={url}, format={format_id}")
    shortcode = get_shortcode(url)
    if not shortcode:
        logger.warning(f"Invalid Instagram URL provided: {url}")
        raise ValueError("Invalid Instagram URL")
        
    file_id = uuid.uuid4().hex[:12]
    output_template = os.path.join(DOWNLOAD_DIR, f"{file_id}_%(title)s.%(ext)s")
    
    if format_id and format_id not in ("best", "original"):
        format_str = f"{format_id}+bestaudio[ext=m4a]/{format_id}/best"
    else:
        format_str = "bestvideo+bestaudio/best"
        
    ydl_opts = {
        "format": format_str,
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android"]
            }
        }
    }
    
    cookie_path = "/tmp/cookies/youtube_cookies.txt"
    cookies_enabled = os.path.exists(cookie_path)
    cookies_status = "enabled" if cookies_enabled else "disabled"
    
    logger.info(f"yt-dlp version: {yt_dlp.version.__version__} | ffmpeg version: {FFMPEG_VERSION} | YouTube cookies: {cookies_status}")

    if cookies_enabled:
        ydl_opts["cookiefile"] = cookie_path
        logger.info(f"Using cookies file for Instagram download: {cookie_path}")
    else:
        logger.info("No cookies file found. Downloading Instagram media without cookies.")
    
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _download, url, ydl_opts)
        
        pattern = os.path.join(DOWNLOAD_DIR, f"{file_id}_*")
        files = glob.glob(pattern)
        if not files:
            logger.error(f"No file found after Instagram download completion for URL: {url}")
            return None, None
            
        filepath = files[0]
        filename = os.path.basename(filepath).replace(f"{file_id}_", "", 1)
        logger.info(f"Instagram download completed: URL={url}, Saved={filename}")
        return filepath, filename
    except Exception as e:
        logger.error(
            f"Instagram download failed for URL: {url} | Error: {str(e)} | Cookies enabled: {cookies_enabled}",
            exc_info=True
        )
        raise ValueError("YouTube extraction failed")

