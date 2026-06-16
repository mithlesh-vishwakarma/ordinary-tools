import os
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

from dotenv import load_dotenv
load_dotenv()

from app.services.youtube_service import get_video_info, download_video

async def test_info(url):
    print("\n--- Testing Info Extraction ---")
    try:
        info = await get_video_info(url)
        print("SUCCESS! Keys returned:")
        for key, val in info.items():
            if key == "formats":
                print(f"  formats: count={len(val)}")
            else:
                # Ensure values can be printed safely on Windows console
                safe_val = str(val).encode('ascii', errors='replace').decode('ascii')
                print(f"  {key}: {safe_val}")
        return info
    except Exception as e:
        print(f"FAILED info extraction: {e}")
        import traceback
        traceback.print_exc()
        return None

async def test_download(url, format_id):
    print(f"\n--- Testing Download with format_id={format_id} ---")
    try:
        path, filename = await download_video(url, format_id)
        # Ensure path and filename can also be printed on Windows console without encoding errors
        safe_path = path.encode('ascii', errors='replace').decode('ascii')
        safe_filename = filename.encode('ascii', errors='replace').decode('ascii')
        print(f"SUCCESS! Path: {safe_path}, Filename: {safe_filename}")
        if path and os.path.exists(path):
            print(f"Verified: File size is {os.path.getsize(path)} bytes")
            # Clean up test download
            try:
                os.remove(path)
                print("Cleaned up downloaded file.")
            except Exception as clean_err:
                print(f"Failed to clean up: {clean_err}")
        else:
            print("WARNING: File does not exist at path!")
    except Exception as e:
        print(f"FAILED download: {e}")
        import traceback
        traceback.print_exc()

async def main():
    target_url = "https://youtu.be/xHbmzFJp-FE"
    
    # 1. Test info endpoint logic
    await test_info(target_url)
    
    # 2. Test download endpoint logic
    await test_download(target_url, "best")

if __name__ == "__main__":
    asyncio.run(main())
