interface Props {
  progress: number; // 0 to 100, or -1 for indeterminate
  label?: string;
}

export default function DownloadProgress({ progress, label }: Props) {
  const isIndeterminate = progress < 0;

  return (
    <section className="download-progress" id="download-progress-section">
      <div className="container">
        <div className="glass-card download-progress__card">
          {isIndeterminate ? (
            <div className="download-progress__indeterminate">
              <div className="download-progress__spinner" />
              <p className="download-progress__label">
                {label || "Preparing your download… This may take a moment."}
              </p>
            </div>
          ) : (
            <>
              <p className="download-progress__label">
                {label || "Downloading…"}
              </p>
              <div className="download-progress__bar-wrapper">
                <div
                  className="download-progress__bar"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="download-progress__percent">
                {Math.round(progress)}%
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
