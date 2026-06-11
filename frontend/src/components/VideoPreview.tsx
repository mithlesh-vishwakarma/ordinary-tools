import type { VideoInfo } from "../types";

interface Props {
  video: VideoInfo;
}

function formatNumber(count: number | null): string {
  if (count === null || count === undefined) return "0";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  // Check if it's YYYY-MM-DD or YYYYMMDD
  if (dateStr.includes("-")) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  if (dateStr.length !== 8) return "";
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VideoPreview({ video }: Props) {
  return (
    <section className="video-preview" id="video-preview-section">
      <div className="container">
        <div className="glass-card video-preview__card">
          <div className={`video-preview__thumbnail-wrapper ${video.is_vertical ? 'video-preview__thumbnail-wrapper--vertical' : ''}`}>
            <img
              className="video-preview__thumbnail"
              src={video.thumbnail}
              alt={video.title}
              loading="eager"
              referrerPolicy="no-referrer"
            />
            <span className="video-preview__duration-badge">
              {video.duration_string}
            </span>
          </div>
          <div className="video-preview__info">
            <h2 className="video-preview__title">{video.title}</h2>
            <p className="video-preview__channel">@{video.channel}</p>
            <div className="video-preview__meta">
              {video.view_count !== null ? (
                <span className="video-preview__meta-item">
                  <span className="video-preview__meta-icon">👁️</span>
                  {formatNumber(video.view_count)} views
                </span>
              ) : null}
              {video.like_count !== null ? (
                <span className="video-preview__meta-item">
                  <span className="video-preview__meta-icon">❤️</span>
                  {formatNumber(video.like_count)} likes
                </span>
              ) : null}
              {video.comment_count !== null ? (
                <span className="video-preview__meta-item">
                  <span className="video-preview__meta-icon">💬</span>
                  {formatNumber(video.comment_count)} comments
                </span>
              ) : null}
              {video.repost_count !== null ? (
                <span className="video-preview__meta-item">
                  <span className="video-preview__meta-icon">🔁</span>
                  {formatNumber(video.repost_count)} reposts
                </span>
              ) : null}
              {video.upload_date ? (
                <span className="video-preview__meta-item">
                  <span className="video-preview__meta-icon">📅</span>
                  {formatDate(video.upload_date)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
