import { useState, useMemo } from "react";
import type { FormatInfo } from "../types";

type FilterType = "Combined" | "Video Only" | "Audio Only";

interface Props {
  formats: FormatInfo[];
  onDownload: (formatId: string) => void;
  isDownloading: boolean;
  downloadingFormatId: string | null;
  thumbnail?: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1_073_741_824)
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getBadgeClass(type: string): string {
  switch (type) {
    case "Combined":
      return "badge badge--combined";
    case "Video Only":
      return "badge badge--video";
    case "Audio Only":
      return "badge badge--audio";
    default:
      return "badge";
  }
}

function parseResolutionHeight(resolution: string, note?: string): number {
  const str = `${resolution} ${note || ""}`;
  const dimMatch = str.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
  if (dimMatch) {
    const h = parseInt(dimMatch[2], 10);
    const w = parseInt(dimMatch[1], 10);
    return Math.min(w, h);
  }
  const pMatch = str.match(/(\d{3,4})p/i);
  if (pMatch) {
    return parseInt(pMatch[1], 10);
  }
  const numMatch = str.match(/\b(\d{3,4})\b/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }
  return 0;
}

export default function FormatTable({
  formats,
  onDownload,
  isDownloading,
  downloadingFormatId,
  thumbnail,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("Combined");

  const filtered = useMemo(() => {
    let list = formats.filter((f) => f.type === filter);
    if (list.length === 0) {
      list = formats;
    }

    return [...list].sort((a, b) => {
      if (filter === "Audio Only") {
        return (b.filesize || 0) - (a.filesize || 0);
      }

      const hA = parseResolutionHeight(a.resolution, a.note);
      const hB = parseResolutionHeight(b.resolution, b.note);
      if (hA !== hB) {
        return hB - hA; // Highest resolution first
      }

      return (b.filesize || 0) - (a.filesize || 0);
    });
  }, [formats, filter]);

  const filters: { label: string; value: FilterType }[] = [
    { label: "Video + Audio", value: "Combined" },
    { label: "Video Only", value: "Video Only" },
    { label: "Audio Only", value: "Audio Only" },
  ];

  return (
    <section className="format-section" id="format-table-section">
      <div className="container">
        <div className="format-section__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {thumbnail && (
              <img 
                src={thumbnail} 
                alt="Thumbnail" 
                referrerPolicy="no-referrer"
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '8px', 
                  objectFit: 'cover',
                  border: '1px solid var(--bg-glass-border)'
                }} 
              />
            )}
            <h3 className="format-section__title">
              Available Formats ({filtered.length})
            </h3>
          </div>
          <div className="format-section__filters">
            {filters.map((f) => (
              <button
                key={f.value}
                className={`filter-chip ${filter === f.value ? "filter-chip--active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card format-table-wrapper">
          <table className="format-table" id="format-table">
            <thead>
              <tr>
                <th>Quality</th>
                <th>Ext</th>
                <th>Type</th>
                <th>Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.format_id}>
                  <td>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {f.resolution}
                    </strong>
                    {f.note && f.note !== f.resolution && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {f.note}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge--ext">
                      {f.ext.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={getBadgeClass(f.type)}>{f.type}</span>
                  </td>
                  <td>{formatFileSize(f.filesize)}</td>
                  <td>
                    <button
                      className="btn btn--download btn--small"
                      onClick={() => onDownload(f.format_id)}
                      disabled={isDownloading}
                      id={`download-btn-${f.format_id}`}
                    >
                      {isDownloading && downloadingFormatId === f.format_id ? (
                        <span className="spinner" />
                      ) : (
                        "⬇ Download"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                    No formats match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
