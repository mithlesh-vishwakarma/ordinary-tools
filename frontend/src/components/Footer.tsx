export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <p className="footer__text">
          Built with <span className="footer-heart" aria-label="love">❤️</span>, Powered by{" "}
          <a
            href="https://ordinarycoder.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Ordinary Coder
          </a>
        </p>
      </div>
    </footer>
  );
}
