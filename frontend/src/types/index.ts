export interface FormatInfo {
  format_id: string;
  ext: string;
  resolution: string;
  type: "Combined" | "Video Only" | "Audio Only";
  vcodec: string;
  acodec: string;
  filesize: number | null;
  note: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  duration_string: string;
  channel: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  repost_count: number | null;
  is_vertical: boolean;
  upload_date: string | null;
  formats: FormatInfo[];
}

export type AppState = "idle" | "fetching" | "ready" | "downloading" | "error";
