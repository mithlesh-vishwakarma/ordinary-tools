import os
import asyncio
import logging
import time
import shutil
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.youtube import router as youtube_router
from app.api.instagram import router as instagram_router
from app.core.cleanup import cleanup_old_files

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("ordinary-tools-api")

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "/tmp/downloads")

app = FastAPI(
    title=os.getenv("APP_NAME", "OrdinaryTools API"),
    description="Unified API for YouTube and Instagram downloads",
    version="2.1.0",
)

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "https://ordinary-tools.vercel.app")
allowed_origins = [
    frontend_url,
    "https://ordinary-tools.vercel.app",
    "https://www.ordinary-tools.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
additional_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if additional_origins_str:
    for origin in additional_origins_str.split(","):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    logger.info(f"Incoming request: {method} {path}")
    
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"Completed request: {method} {path} - Status: {response.status_code} - Duration: {process_time:.2f}ms"
        )
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(
            f"Failed request: {method} {path} - Error: {str(e)} - Duration: {process_time:.2f}ms"
        )
        raise

# Exception Handlers for Centralized Error Handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        loc = " -> ".join(str(l) for l in error.get("loc", []))
        msg = error.get("msg", "invalid value")
        errors.append(f"{loc}: {msg}")
    error_msg = "; ".join(errors)
    logger.warning(f"Validation error: {error_msg}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": f"Validation Error: {error_msg}"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Server Error: {str(exc)}"}
    )

# Root endpoint for Render health checks
@app.get("/")
@app.head("/")
async def root():
    return {
        "status": "ok",
        "message": "OrdinaryTools API is running"
    }

@app.get("/api/health")
async def health():
    cookies_enabled = os.path.exists("/tmp/cookies/youtube_cookies.txt")
    return {
        "status": "ok",
        "service": "ordinary-tools-api",
        "youtube_cookies_enabled": cookies_enabled
    }

# Background task for cleanup
async def scheduled_cleanup():
    while True:
        cleanup_old_files(DOWNLOAD_DIR)
        await asyncio.sleep(600)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing OrdinaryTools API services...")
    
    # Initialize YouTube cookies if configured
    try:
        cookies_dir = "/tmp/cookies"
        os.makedirs(cookies_dir, exist_ok=True)
        youtube_cookies = os.getenv("YOUTUBE_COOKIES")
        if youtube_cookies:
            cookies_file = os.path.join(cookies_dir, "youtube_cookies.txt")
            with open(cookies_file, "w", encoding="utf-8") as f:
                f.write(youtube_cookies)
            logger.info("Youtube cookies loaded successfully")
        else:
            logger.info("No YouTube cookies configured")
    except Exception as e:
        logger.error(f"Failed to initialize YouTube cookies: {e}", exc_info=True)

    # Verify download directory
    try:
        os.makedirs(DOWNLOAD_DIR, exist_ok=True)
        # Test write access
        test_file_path = os.path.join(DOWNLOAD_DIR, ".startup_write_test")
        with open(test_file_path, "w") as f:
            f.write("test")
        os.remove(test_file_path)
        logger.info(f"Download directory initialized and writable: {DOWNLOAD_DIR}")
    except Exception as e:
        logger.critical(f"Critical: Download directory '{DOWNLOAD_DIR}' is not writable: {e}")
        raise RuntimeError(f"Startup check failed: download directory not writable: {e}") from e

    # Verify yt-dlp dependency
    try:
        import yt_dlp
        logger.info(f"yt-dlp dependency verified. Version: {yt_dlp.version.__version__}")
    except ImportError as e:
        logger.critical("Critical: yt-dlp is not installed!")
        raise RuntimeError("Startup check failed: missing yt-dlp dependency") from e

    # Verify ffmpeg dependency
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        logger.critical("Critical: ffmpeg is not found in PATH! yt-dlp will fail to merge video and audio formats.")
        raise RuntimeError("Startup check failed: missing ffmpeg dependency")
    else:
        logger.info(f"ffmpeg dependency verified. Location: {ffmpeg_path}")

    # Log startup success
    logger.info("All startup checks passed successfully. Starting scheduled cleanup task...")
    asyncio.create_task(scheduled_cleanup())

app.include_router(youtube_router, prefix="/api")
app.include_router(instagram_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
    )