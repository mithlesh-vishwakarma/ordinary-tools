import os
import glob
import time

def cleanup_old_files(directory: str, max_age_seconds: int = 600):
    """Remove files older than specified age."""
    now = time.time()
    for f in glob.glob(os.path.join(directory, "*")):
        # If it's a file
        if os.path.isfile(f) and now - os.path.getmtime(f) > max_age_seconds:
            try:
                os.remove(f)
            except OSError:
                pass
        # If it's a directory (Instagram downloads)
        elif os.path.isdir(f) and now - os.path.getmtime(f) > max_age_seconds:
            try:
                import shutil
                shutil.rmtree(f)
            except OSError:
                pass
