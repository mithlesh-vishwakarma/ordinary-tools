import yt_dlp
import os
import uuid
import asyncio
import glob

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "downloads")
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
    ydl_opts = {"quiet": True, "no_warnings": True}
    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(None, _extract_info, url, ydl_opts)
    
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
    
    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": info.get("thumbnail", ""),
        "duration": duration,
        "duration_string": _format_duration(duration),
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
    
    format_str = (
        f"{format_id}+bestaudio[ext=m4a]/{format_id}/best"
        if format_id != "best"
        else "bestvideo+bestaudio/best"
    )

    ydl_opts = {
        "format": format_str,
        "outtmpl": output_template,
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [{"key": "FFmpegVideoConvertor", "preferedformat": "mp4"}],
    }

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _download, url, ydl_opts)
    
    pattern = os.path.join(DOWNLOAD_DIR, f"{file_id}_*")
    files = glob.glob(pattern)
    if not files: return None, None
    
    filepath = files[0]
    filename = os.path.basename(filepath).replace(f"{file_id}_", "", 1)
    return filepath, filename
