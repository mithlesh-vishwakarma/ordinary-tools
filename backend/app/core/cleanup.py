import os
import glob
import time
import logging

logger = logging.getLogger("ordinary-tools-api.cleanup")

def cleanup_old_files(directory: str, max_age_seconds: int = 600):
    """Remove files older than specified age."""
    now = time.time()
    for f in glob.glob(os.path.join(directory, "*")):
        # Skip hidden verification/test files we use on startup
        if os.path.basename(f).startswith("."):
            continue
        try:
            mtime = os.path.getmtime(f)
            age = now - mtime
            if age > max_age_seconds:
                if os.path.isfile(f):
                    os.remove(f)
                    logger.info(f"Cleaned up old temporary file: {f} (age: {int(age)}s)")
                elif os.path.isdir(f):
                    import shutil
                    shutil.rmtree(f)
                    logger.info(f"Cleaned up old temporary directory: {f} (age: {int(age)}s)")
        except OSError as e:
            logger.error(f"Error cleaning up path {f}: {e}")
