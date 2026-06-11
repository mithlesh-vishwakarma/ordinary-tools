import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.youtube import router as youtube_router
from app.api.instagram import router as instagram_router
from app.core.cleanup import cleanup_old_files
import asyncio

app = FastAPI(
    title="OrdinaryTools API",
    description="Unified API for YouTube and Instagram downloads",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background task for cleanup
async def scheduled_cleanup():
    download_dir = os.path.join(os.path.dirname(__file__), "downloads")
    while True:
        cleanup_old_files(download_dir)
        await asyncio.sleep(600)  # Clean every 10 minutes

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduled_cleanup())

app.include_router(youtube_router, prefix="/api")
app.include_router(instagram_router, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ordinary-tools-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
