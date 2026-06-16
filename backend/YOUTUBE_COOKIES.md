# YouTube Cookies Configuration & Troubleshooting Guide

This guide details how to configure, test, and troubleshoot YouTube cookies support for both local development (Windows) and Render deployments.

---

## 1. Local Windows Setup Instructions

To run the application locally on Windows with YouTube cookies enabled:

### A. Export Your Cookies from YouTube
1. Install a browser extension that exports cookies in the **Netscape** format:
   * **Chrome/Firefox:** [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/ccmddjjdcmgpleiocbgolhhildelbebd) or [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/hgclpkfgcbiiomjkcljoolehhclocgki).
2. Open [YouTube](https://www.youtube.com) and ensure you are logged in (ideally with a burner or dedicated account to protect your main session).
3. Click the extension icon and select to export cookies for `youtube.com`.
4. Open the downloaded file and copy the entire text content.

### B. Configure Environment Variable & Run
Open your terminal and run the commands matching your shell:

#### **PowerShell:**
```powershell
# Set the environment variable with your copied cookies contents
$env:YOUTUBE_COOKIES="<paste_copied_cookies_here>"

# Start the backend server
pnpm --filter backend dev
```

#### **Command Prompt (cmd):**
```cmd
# Set the environment variable
set YOUTUBE_COOKIES=<paste_copied_cookies_here>

# Start the backend server
pnpm --filter backend dev
```

---

## 2. Render Environment Variable Setup

To configure the application on Render:

1. Log in to the **Render Dashboard**.
2. Select your FastAPI Backend Web Service.
3. Click the **Environment** tab on the left sidebar.
4. Click **Add Environment Variable** and enter:
   * **Key:** `YOUTUBE_COOKIES`
   * **Value:** `<paste the raw contents of your exported cookies.txt file>`
5. Click **Save Changes**.
6. Render will automatically start a new deployment. You can monitor the startup logs to verify.

---

## 3. Testing Guide

### Step 1: Verify Active Status via Health API
Query the health check endpoint to check if cookies are loaded:

* **Local url:** `http://localhost:8000/api/health`
* **Render url:** `https://your-backend-url.onrender.com/api/health`

```bash
curl http://localhost:8000/api/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "service": "ordinary-tools-api",
  "youtube_cookies_enabled": true
}
```
*(If cookies are disabled or missing, `"youtube_cookies_enabled"` will be `false`.)*

### Step 2: Test YouTube Extraction
Perform a test extraction by querying the backend API.
```bash
curl -X POST http://localhost:8000/api/youtube/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```
Verify that the extraction completes successfully and returns the video info instead of throwing a bot protection error.

---

## 4. Troubleshooting Guide

### A. Checking Logs for Diagnostic Info
On startup, the backend outputs verification logs. Check the output logs for:
* **yt-dlp version**: Logs the version currently installed.
* **ffmpeg version**: Logs the verified location and version of ffmpeg on the system.
* **YouTube cookies status**: Check for `YouTube cookies: enabled` or `YouTube cookies: disabled`.

**Example Startup Logs:**
```text
2026-06-17 00:03:22 [INFO] ordinary-tools-api: Youtube cookies loaded successfully
2026-06-17 00:03:22 [INFO] ordinary-tools-api: YouTube cookies: enabled
2026-06-17 00:03:22 [INFO] ordinary-tools-api: yt-dlp dependency verified. Version: 2026.03.17
2026-06-17 00:03:22 [INFO] ordinary-tools-api: ffmpeg dependency verified. Location: ...
2026-06-17 00:03:22 [INFO] ordinary-tools-api: ffmpeg version: ffmpeg version 8.1 ...
```

### B. Common Issues & Solutions

#### 1. API returns `{"success": false, "error": "YouTube extraction failed"}`
* **Check Cookie Expiry:** Authentication cookies naturally expire. If you see this error, export fresh cookies from your browser and update the environment variable.
* **Validate Cookie Format:** The content of `YOUTUBE_COOKIES` must be a valid Netscape format file. Ensure the content begins with `# Netscape HTTP Cookie File` and contains tab-separated columns.
* **Confirm Env Var Setup:** Verify that `YOUTUBE_COOKIES` does not contain leading/trailing whitespaces, brackets, or quotes that might have been copied accidentally.

#### 2. The Health Endpoint shows `youtube_cookies_enabled: false`
* Verify that the environment variable name is exactly `YOUTUBE_COOKIES` (all uppercase).
* Restart/redeploy the app after applying the environment variable.
* Check for container file permission issues on `/tmp/cookies`. (The app has automated fallback logging if file operations fail.)
