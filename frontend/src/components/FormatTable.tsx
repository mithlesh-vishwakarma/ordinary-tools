import { useState, useMemo } from "react";
import type { FormatInfo } from "../types";

type FilterType = "all" | "Combined" | "Video Only" | "Audio Only";

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

export default function FormatTable({
  formats,
  onDownload,
  isDownloading,
  downloadingFormatId,
  thumbnail,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return formats;
    return formats.filter((f) => f.type === filter);
  }, [formats, filter]);

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Combined", value: "Combined" },
    { label: "Video", value: "Video Only" },
    { label: "Audio", value: "Audio Only" },
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
                <th>Codecs</th>
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
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {f.vcodec !== "none" ? f.vcodec : "—"} /{" "}
                    {f.acodec !== "none" ? f.acodec : "—"}
                  </td>
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
                  <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
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
