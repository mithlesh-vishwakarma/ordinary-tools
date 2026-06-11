import instaloader
import re
import os
import glob
import asyncio
from typing import Optional

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def get_shortcode(url: str) -> Optional[str]:
    pattern = r'/(?:p|reels|reel|tv)/([^/?#&]+)'
    match = re.search(pattern, url)
    return match.group(1) if match else None

def _fetch_insta_post(shortcode: str):
    L = instaloader.Instaloader(
        dirname_pattern=os.path.join(DOWNLOAD_DIR, '{target}'),
        filename_pattern='{shortcode}',
        download_video_thumbnails=False,
        save_metadata=False,
        post_metadata_txt_pattern=''
    )
    post = instaloader.Post.from_shortcode(L.context, shortcode)
    return post

def _download_insta_post(shortcode: str):
    L = instaloader.Instaloader(
        dirname_pattern=os.path.join(DOWNLOAD_DIR, '{target}'),
        filename_pattern='{shortcode}',
        download_video_thumbnails=False,
        save_metadata=False,
        post_metadata_txt_pattern=''
    )
    post = instaloader.Post.from_shortcode(L.context, shortcode)
    L.download_post(post, target=shortcode)
    
    # Find the downloaded file(s)
    target_dir = os.path.join(DOWNLOAD_DIR, shortcode)
    files = glob.glob(os.path.join(target_dir, "*"))
    # Filter for video or image
    media_files = [f for f in files if f.endswith(('.mp4', '.jpg', '.png', '.webp'))]
    return media_files[0] if media_files else None

async def get_instagram_info(url: str):
    shortcode = get_shortcode(url)
    if not shortcode:
        raise ValueError("Invalid Instagram URL")
    
    loop = asyncio.get_event_loop()
    post = await loop.run_in_executor(None, _fetch_insta_post, shortcode)
    
    return {
        "title": f"Instagram Post by {post.owner_username}",
        "thumbnail": post.url,
        "duration": post.video_duration if post.is_video else 0,
        "duration_string": f"{int(post.video_duration)}s" if post.is_video else "Static",
        "channel": post.owner_username,
        "view_count": post.video_view_count if post.is_video else None,
        "like_count": post.likes,
        "comment_count": post.comments,
        "repost_count": None,
        "is_vertical": True,
        "upload_date": post.date_utc.strftime("%Y-%m-%d"),
        "formats": [
            {
                "format_id": "original",
                "ext": "mp4" if post.is_video else "jpg",
                "resolution": "Original",
                "type": "Combined",
                "vcodec": "N/A",
                "acodec": "N/A",
                "filesize": None,
                "note": "Highest quality available"
            }
        ]
    }

async def download_instagram(url: str):
    shortcode = get_shortcode(url)
    if not shortcode:
        raise ValueError("Invalid Instagram URL")
    
    loop = asyncio.get_event_loop()
    filepath = await loop.run_in_executor(None, _download_insta_post, shortcode)
    
    if not filepath:
        return None, None
        
    filename = os.path.basename(filepath)
    return filepath, filename
