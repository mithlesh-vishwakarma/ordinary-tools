import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Disclaimer from '../components/Disclaimer';
import { YouTubeIcon, InstagramIcon, ArrowRightIcon } from '../components/Icons';

export default function VideoDownloaderHub() {
  const navigate = useNavigate();

  return (
    <div className="video-downloader-hub animate-fade-in-up">
      <Header tagline="VIDEO & AUDIO DOWNLOADER" />

      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="hub-breadcrumbs">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/tools" className="breadcrumb-link">Tools</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Video Downloader</span>
        </div>

        <div className="header__hero">
          <div className="subtool-pill subtool-pill--purple">Video & Audio Tools</div>
          <h1 className="header__title">Video Downloader Suite</h1>
          <p className="header__subtitle">
            Download high-definition videos, audio, and reels from YouTube and Instagram in seconds.
          </p>
          <Disclaimer />
        </div>

        <div className="tool-grid">
          {/* YouTube Card */}
          <div 
            className="tool-card tool-card--youtube glass-card" 
            onClick={() => navigate('/youtube')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/youtube');
              }
            }}
          >
            <div className="tool-card__badge tool-card__badge--popular">Popular</div>
            <div className="tool-card__icon youtube">
              <YouTubeIcon />
            </div>
            <h2 className="tool-card__title">YouTube Toolkit</h2>
            <p className="tool-card__desc">
              Download YouTube videos, Shorts, and audio extracts in multiple formats and qualities up to 4K 60FPS.
            </p>
            <div className="tool-card__features">
              <span className="feature-tag">4K / 1080p Video</span>
              <span className="feature-tag">MP3 Audio 320kbps</span>
              <span className="feature-tag">Shorts Supported</span>
            </div>
            <div className="tool-card__action">
              <span className="btn btn--primary btn--full">
                <span>Launch YouTube Downloader</span>
                <ArrowRightIcon />
              </span>
            </div>
          </div>

          {/* Instagram Card */}
          <div 
            className="tool-card tool-card--instagram glass-card" 
            onClick={() => navigate('/instagram')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/instagram');
              }
            }}
          >
            <div className="tool-card__badge tool-card__badge--new">New</div>
            <div className="tool-card__icon instagram">
              <InstagramIcon />
            </div>
            <h2 className="tool-card__title">Instagram Toolkit</h2>
            <p className="tool-card__desc">
              Save Reels, Posts, and Videos instantly from Instagram. Fast, secure, and preserves original resolution.
            </p>
            <div className="tool-card__features">
              <span className="feature-tag">Reels & Clips</span>
              <span className="feature-tag">Original Quality</span>
              <span className="feature-tag">Fast Processing</span>
            </div>
            <div className="tool-card__action">
              <span className="btn btn--primary btn--full">
                <span>Launch Instagram Downloader</span>
                <ArrowRightIcon />
              </span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '48px', marginBottom: '20px' }}>
          <button onClick={() => navigate('/tools')} className="btn btn--secondary hub-back-btn">
            ← Back to All Tools
          </button>
        </div>
      </div>
    </div>
  );
}
