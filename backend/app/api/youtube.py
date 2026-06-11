from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional, List
from app.services.youtube_service import get_video_info, download_video
from fastapi.responses import FileResponse

router = APIRouter(prefix="/youtube", tags=["youtube"])

class VideoUrlRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty")
        if "youtube.com" not in v and "youtu.be" not in v:
            raise ValueError("Please provide a valid YouTube URL")
        return v

class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = "best"

@router.post("/info")
async def video_info(req: VideoUrlRequest):
    try:
        return await get_video_info(req.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/download")
async def download(req: DownloadRequest):
    try:
        path, filename = await download_video(req.url, req.format_id)
        if not path:
            raise HTTPException(status_code=500, detail="Download failed")
        return FileResponse(
            path=path,
            filename=filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
