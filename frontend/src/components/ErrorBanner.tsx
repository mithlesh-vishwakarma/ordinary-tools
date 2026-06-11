interface Props {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="error-banner" id="error-banner" role="alert">
      <div className="container">
        <div className="error-banner__card">
          <span className="error-banner__icon" aria-hidden="true">⚠️</span>
          <p className="error-banner__text">{message}</p>
          <button
            className="error-banner__close"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
