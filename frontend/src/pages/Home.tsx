import Header from "../components/Header";
import { YouTubeIcon, InstagramIcon } from "../components/Icons";
import Disclaimer from "../components/Disclaimer";

interface Props {
  onSelect: (tool: 'youtube' | 'instagram') => void;
}

export default function Home({ onSelect }: Props) {
  return (
    <div className="animate-fade-in-up">
      <Header />

      <div className="container">
        <div className="header__hero">
          <h1 className="header__title">All-in-One Media Toolkit</h1>
          <p className="header__subtitle">
            The ultimate media toolkit for YouTube and Instagram.
          </p>
          <Disclaimer />
        </div>
        <div className="tool-grid">
          <div className="tool-card glass-card" onClick={() => onSelect('youtube')}>
            <div className="tool-card__icon youtube">
              <YouTubeIcon />
            </div>
            <h2 className="tool-card__title">YouTube Toolkit</h2>
            <p className="tool-card__desc">
              Download any YouTube video, shorts, or audio in multiple formats and qualities up to 4K.
            </p>
            <div className="tool-card__badge">Popular</div>
          </div>

          <div className="tool-card glass-card" onClick={() => onSelect('instagram')}>
            <div className="tool-card__icon instagram">
              <InstagramIcon />
            </div>
            <h2 className="tool-card__title">Instagram Toolkit</h2>
            <p className="tool-card__desc">
              Save Reels, Posts, and Videos instantly from Instagram. Fast, secure, and easy to use.
            </p>
            <div className="tool-card__badge">New</div>
          </div>
        </div>
      </div>

      <style>{`
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          padding: 2rem 0;
        }

        .tool-card {
          padding: 2.5rem;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .tool-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .tool-card__icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3.5rem;
          margin-bottom: 1rem;
          transition: transform 0.3s var(--ease-out);
        }

        .tool-card__icon svg {
          width: 100%;
          height: 100%;
        }

        .tool-card:hover .tool-card__icon {
          transform: scale(1.1) rotate(5deg);
        }

        .tool-card__title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tool-card__desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .tool-card__badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.25rem 0.75rem;
          background: var(--bg-glass);
          border: 1px solid var(--bg-glass-border);
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-cyan);
        }

        .tool-card__icon.youtube {
          color: #FF0000;
          filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.4));
        }

        .tool-card__icon.instagram {
          color: #E1306C;
          filter: drop-shadow(0 0 20px rgba(225, 48, 108, 0.4));
        }
      `}</style>
    </div>
  );
}
