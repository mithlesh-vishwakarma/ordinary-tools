import type { VideoInfo } from "../types";

// Update to use process.env.NEXT_PUBLIC_API_URL per requirements.
// Vite will replace this token at build/run time.
const API = process.env.NEXT_PUBLIC_API_URL || "";
const API_BASE = `${API}/api`;

/**
 * Custom fetch wrapper that supports abort/timeout and handles network failures,
 * offline servers, and abort timeouts gracefully.
 */
async function fetchWithTimeout(
  resource: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000 } = options; // Default 30s timeout

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("The request timed out. Please check your network or try again.");
    }
    // Handle offline server / network failure
    throw new Error("Unable to connect to the backend server. Please verify the server is running and your internet connection is active.");
  }
}

export async function fetchMediaInfo(url: string, type: 'youtube' | 'instagram'): Promise<VideoInfo> {
  const endpoint = type === 'youtube' ? '/youtube/info' : '/instagram/info';
  
  let res;
  try {
    res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      timeout: 20000, // 20 seconds timeout for fetching info
    });
  } catch (err: any) {
    throw new Error(err.message || "Failed to contact the backend service.");
  }

  if (!res.ok) {
    let errDetail = "Failed to fetch media details";
    try {
      const err = await res.json();
      errDetail = err.error || err.detail || `HTTP Error ${res.status}`;
    } catch (e) {
      errDetail = `HTTP Error ${res.status}: Invalid response format from server.`;
    }
    throw new Error(errDetail);
  }

  try {
    return await res.json();
  } catch (e) {
    throw new Error("Invalid response received from the backend service.");
  }
}

export async function downloadMedia(
  url: string,
  type: 'youtube' | 'instagram',
  formatId?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const endpoint = type === 'youtube' ? '/youtube/download' : '/instagram/download';
  
  let res;
  try {
    res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format_id: formatId }),
      timeout: 600000, // 10 minutes timeout for downloads
    });
  } catch (err: any) {
    throw new Error(err.message || "Failed to contact the backend service during download.");
  }

  if (!res.ok) {
    let errDetail = "Download failed";
    try {
      const err = await res.json();
      errDetail = err.error || err.detail || `HTTP Error ${res.status}`;
    } catch (e) {
      errDetail = `Download failed with HTTP status ${res.status}`;
    }
    throw new Error(errDetail);
  }

  const disposition = res.headers.get("content-disposition");
  let filename = type === 'youtube' ? "video.mp4" : "instagram_media.mp4";
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    if (match) filename = decodeURIComponent(match[1].replace(/"/g, ""));
  }

  const contentLength = res.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!res.body || !onProgress || !total) {
    try {
      const blob = await res.blob();
      return { blob, filename };
    } catch (e) {
      throw new Error("Failed to read the download stream from server.");
    }
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total);
    } catch (e) {
      throw new Error("Network interruption during file download.");
    }
  }

  const blob = new Blob(chunks as unknown as BlobPart[]);
  return { blob, filename };
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

