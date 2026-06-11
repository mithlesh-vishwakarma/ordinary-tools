import type { VideoInfo } from "../types";

const API_BASE = "/api";

export async function fetchMediaInfo(url: string, type: 'youtube' | 'instagram'): Promise<VideoInfo> {
  const endpoint = type === 'youtube' ? '/youtube/info' : '/instagram/info';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function downloadMedia(
  url: string,
  type: 'youtube' | 'instagram',
  formatId?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const endpoint = type === 'youtube' ? '/youtube/download' : '/instagram/download';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format_id: formatId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
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
    const blob = await res.blob();
    return { blob, filename };
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(loaded, total);
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
