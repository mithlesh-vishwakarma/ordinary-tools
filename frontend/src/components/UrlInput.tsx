import { useState, useRef } from "react";

interface Props {
  onFetch: (url: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function UrlInput({ onFetch, isLoading, placeholder = "Paste link here..." }: Props) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onFetch(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
    } catch {
      // Clipboard API not available
    }
  };

  const handleClear = () => {
    setUrl("");
    inputRef.current?.focus();
  };

  return (
    <section className="url-section" id="url-input-section">
      <div className="container">
        <form className="url-form" onSubmit={handleSubmit}>
          <div className="url-input-wrapper">
            <span className="url-input__icon" aria-hidden="true">🔗</span>
            <input
              ref={inputRef}
              id="media-url-input"
              type="url"
              className="url-input"
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-label="Media URL"
            />
            {url && (
              <button
                type="button"
                className="url-input__clear"
                onClick={handleClear}
                aria-label="Clear URL"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={handlePaste}
            title="Paste from clipboard"
            aria-label="Paste URL from clipboard"
          >
            📋 Paste
          </button>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isLoading || !url.trim()}
            id="fetch-info-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner" /> Fetching…
              </>
            ) : (
              <>🔍 Fetch Info</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
