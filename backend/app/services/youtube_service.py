import yt_dlp
import os
import uuid
import asyncio
import glob
import logging
import shutil
import subprocess
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("ordinary-tools-api.youtube")

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

async def get_video_info(url: str):
    logger.info(f"Fetching video info for YouTube URL: {url}")
    
    cookie_path = "/tmp/cookies/youtube_cookies.txt"
    cookies_enabled = os.path.exists(cookie_path)
    cookies_status = "enabled" if cookies_enabled else "disabled"
    
    logger.info(f"yt-dlp version: {yt_dlp.version.__version__} | URL: {url} | Cookies: {cookies_status}")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }

    if cookies_enabled:
        ydl_opts["cookiefile"] = cookie_path

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _extract_info, url, ydl_opts)
    except Exception as e:
        logger.error(
            f"Failed to extract info for YouTube URL: {url} | Error: {str(e)} | Cookies enabled: {cookies_enabled}",
            exc_info=True
        )
        raise ValueError("YouTube extraction failed")
    
    raw_formats = info.get("formats", [])
    formats_count = len(raw_formats)
    logger.info(f"Available formats count: {formats_count}")

    formats = []
    for f in raw_formats:
        vcodec = f.get("vcodec") or "none"
        acodec = f.get("acodec") or "none"
        ftype = _classify_format(vcodec, acodec)
        if ftype == "N/A": continue
        formats.append({
            "format_id": str(f.get("format_id", "")),
            "ext": f.get("ext", ""),
            "resolution": f.get("resolution") or f.get("format_note", "N/A"),
            "type": ftype,
            "vcodec": vcodec[:20],
            "acodec": acodec[:20],
            "filesize": f.get("filesize") or f.get("filesize_approx"),
            "note": f.get("format_note", ""),
        })
    
    duration = info.get("duration") or 0
    width = info.get("width") or 0
    height = info.get("height") or 0
    
    logger.info(f"Successfully retrieved YouTube video info: {info.get('title', 'Unknown')}")
    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": info.get("thumbnail", ""),
        "duration": duration,
        "duration_string": _format_duration(duration),
        "uploader": info.get("uploader", "Unknown"),
        "channel": info.get("channel") or info.get("uploader", "Unknown"),
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "comment_count": info.get("comment_count"),
        "repost_count": info.get("repost_count"),
        "is_vertical": height > width,
        "upload_date": info.get("upload_date"),
        "formats": formats,
    }

async def download_video(url: str, format_id: str = "best"):
    file_id = uuid.uuid4().hex[:12]
    output_template = os.path.join(DOWNLOAD_DIR, f"{file_id}_%(title)s.%(ext)s")
    
    cookie_path = "/tmp/cookies/youtube_cookies.txt"
    cookies_enabled = os.path.exists(cookie_path)
    cookies_status = "enabled" if cookies_enabled else "disabled"
    
    logger.info(f"yt-dlp version: {yt_dlp.version.__version__} | URL: {url} | Cookies: {cookies_status}")

    # 1. Run format discovery using minimal options
    ydl_opts_info = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }
    if cookies_enabled:
        ydl_opts_info["cookiefile"] = cookie_path

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _extract_info, url, ydl_opts_info)
    except Exception as e:
        logger.error(
            f"Format discovery failed for URL: {url} | Error: {str(e)} | Cookies enabled: {cookies_enabled}",
            exc_info=True
        )
        raise ValueError("YouTube extraction failed")

    formats_list = info.get("formats", [])
    formats_count = len(formats_list)
    logger.info(f"Available formats count: {formats_count}")

    # Log available formats (format ids)
    logger.info("Available formats:")
    available_ids = []
    for f in formats_list:
        fid = f.get("format_id")
        if fid:
            fid_str = str(fid)
            available_ids.append(fid_str)
            logger.info(fid_str)

    # Log formats resolutions/notes for diagnostic convenience
    resolutions_log = "Formats resolutions/notes:\n" + "\n".join(
        f"{f.get('format_id')}: {f.get('resolution') or f.get('format_note', 'N/A')}"
        for f in formats_list
    )
    logger.info(resolutions_log)

    # Determine selected format ID for logging
    selected_fid = format_id
    if format_id == "best" and available_ids:
        selected_fid = available_ids[-1]
    logger.info(f"Selected:\n{selected_fid}")

    # 2. Candidate format sequences
    format_options = []
    if format_id != "best":
        format_options.append(f"{format_id}+bestaudio[ext=m4a]/{format_id}/best")
    format_options.append("bestvideo+bestaudio/best")
    format_options.append("best")
    format_options.append("worst")

    download_success = False
    last_error = None
    filepath, filename = None, None

    for chosen_format in format_options:
        logger.info(f"Attempting download with format option: {chosen_format}")
        
        ydl_opts = {
            "format": chosen_format,
            "outtmpl": output_template,
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [{"key": "FFmpegVideoConvertor", "preferedformat": "mp4"}],
            "nocheckcertificate": True,
            "geo_bypass": True,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android"]
                }
            }
        }
        if cookies_enabled:
            ydl_opts["cookiefile"] = cookie_path

        try:
            await loop.run_in_executor(None, _download, url, ydl_opts)
            
            pattern = os.path.join(DOWNLOAD_DIR, f"{file_id}_*")
            files = glob.glob(pattern)
            if files:
                filepath = files[0]
                filename = os.path.basename(filepath).replace(f"{file_id}_", "", 1)
                download_success = True
                logger.info(f"YouTube download succeeded with format option: {chosen_format}")
                break
            else:
                logger.warning(f"Download completed but no file was found matching pattern {pattern} for format {chosen_format}")
        except Exception as e:
            last_error = e
            error_msg = str(e)
            logger.warning(f"Download failed with format option '{chosen_format}': {error_msg}")
            if "Requested format is not available" in error_msg:
                logger.info("Selected format unavailable. Trying fallback format.")

    if not download_success:
        logger.error(
            f"YouTube download failed for URL: {url} | Last Error: {str(last_error)} | Cookies enabled: {cookies_enabled}",
            exc_info=True
        )
        if last_error and "Requested format is not available" in str(last_error):
            raise ValueError("Selected format unavailable. Trying fallback format.")
        raise ValueError("YouTube extraction failed")

    return filepath, filename
