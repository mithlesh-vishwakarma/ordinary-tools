export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <p className="footer__text">
          Built with React, TypeScript & FastAPI — Powered by{" "}
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noopener noreferrer"
          >
            yt-dlp
          </a>
        </p>
      </div>
    </footer>
  );
}
