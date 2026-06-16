FROM python:3.12-slim

# Install system dependencies (ffmpeg is required for yt-dlp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root group and user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Install Python requirements (coping requirements.txt first for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Setup and set permissions for downloads directory
RUN mkdir -p /tmp/downloads && \
    chown -R appuser:appuser /app /tmp/downloads

# Expose API port
EXPOSE 8000

# Run as non-root user
USER appuser

# Production-safe startup command
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

