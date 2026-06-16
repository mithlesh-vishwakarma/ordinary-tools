# YouTube Cookies Configuration Guide

This guide details how to setup and test YouTube cookies support for Render deployments to resolve the `"Sign in to confirm you're not a bot"` error.

## 1. Required Render Environment Variable

Add the following environment variable to your Render service:

* **Key:** `YOUTUBE_COOKIES`
* **Value:** The raw file contents of your exported `cookies.txt` (Netscape format).

> [!WARNING]
> Do not commit any `cookies.txt` file directly to your Git repository. The cookies will be stored securely as an environment variable in Render, and written to a temporary container path (`/tmp/cookies/youtube_cookies.txt`) dynamically on startup.

---

## 2. Example Setup & Export Instructions

### Exporting YouTube Cookies

1. Install a browser extension to export cookies in **Netscape** format:
   * **Chrome/Firefox:** [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/ccmddjjdcmgpleiocbgolhhildelbebd) or [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/hgclpkfgcbiiomjkcljoolehhclocgki).
2. Go to [YouTube](https://www.youtube.com) and ensure you are logged in (ideally with a burner or dedicated account).
3. Open the extension and export/download the cookies for `youtube.com` as a text file (e.g., `youtube_cookies.txt`).
4. Open the downloaded file and copy all its contents.

---

## 3. Deployment Instructions on Render

1. Go to the **Render Dashboard**.
2. Select your FastAPI Backend service.
3. Click on the **Environment** tab on the left sidebar.
4. Click **Add Environment Variable**.
5. Set the Key as `YOUTUBE_COOKIES`.
6. Paste the copied contents of the cookie file as the Value.
7. Click **Save Changes**.
8. Render will automatically trigger a new deployment. If it doesn't, click **Manual Deploy** > **Clear build cache & deploy**.
9. In the deployment logs, look for the following log entry:
   `Youtube cookies loaded successfully`
   *(If the variable is missing, it will log: `No YouTube cookies configured`)*.

---

## 4. Testing & Verification Instructions

### Check Cookies Active State
Make a `GET` request to your backend's health check endpoint:

```bash
curl https://your-backend-url.onrender.com/api/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "service": "ordinary-tools-api",
  "youtube_cookies_enabled": true
}
```

If `youtube_cookies_enabled` is `true`, yt-dlp will automatically inject the cookies for all info extraction and download requests.
If it is `false`, verify that `YOUTUBE_COOKIES` is set correctly in your Render dashboard environment variables and that the application redeployed.
