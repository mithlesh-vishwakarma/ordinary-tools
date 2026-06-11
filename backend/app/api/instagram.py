from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from app.services.instagram_service import get_instagram_info, download_instagram
from fastapi.responses import FileResponse

router = APIRouter(prefix="/instagram", tags=["instagram"])

class InstaUrlRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty")
        if "instagram.com" not in v:
            raise ValueError("Please provide a valid Instagram URL")
        return v

class DownloadRequest(BaseModel):
    url: str

@router.post("/info")
async def insta_info(req: InstaUrlRequest):
    try:
        return await get_instagram_info(req.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/download")
async def download(req: DownloadRequest):
    try:
        path, filename = await download_instagram(req.url)
        if not path:
            raise HTTPException(status_code=500, detail="Download failed")
        return FileResponse(
            path=path,
            filename=filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
