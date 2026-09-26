import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  YouTubeIcon, 
  InstagramIcon, 
  PdfIcon, 
  VideoIcon, 
  MergeIcon, 
  RotateIcon, 
  KeyIcon, 
  ArrowRightIcon 
} from '../components/Icons';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page animate-fade-in-up">
      <Header />

      <div className="container">
        {/* Simple & Clean Hero */}
        <section className="landing-hero-simple">
          <h1 className="landing-hero__title">
            Simple Tools for <span className="gradient-text">Everyday Tasks</span>
          </h1>
          <p className="landing-hero__subtitle">
            Fast, free, and private web tools. No paywalls, no watermarks, no registration needed.
          </p>
        </section>

        {/* Big Cards - What We Provide */}
        <section className="big-tools-section">
          <div className="big-tools-grid">
            {/* Card 1: Video Downloader */}
            <div 
              className="big-tool-card glass-card"
              onClick={() => navigate('/tools/video-downloader')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/tools/video-downloader');
                }
              }}
            >
              <div className="big-tool-card__icon icon--video">
                <VideoIcon />
              </div>
              <h2 className="big-tool-card__title">Video Downloader</h2>
              <p className="big-tool-card__desc">
                Download videos, shorts, reels, and audio from YouTube and Instagram in original high quality.
              </p>

              <div className="big-tool-card__chips">
                <span className="big-chip">
                  <YouTubeIcon /> YouTube (4K & MP3)
                </span>
                <span className="big-chip">
                  <InstagramIcon /> Instagram Reels & Posts
                </span>
              </div>

              <div className="big-tool-card__action">
                <span className="btn btn--primary btn--large">
                  <span>Open Video Downloader</span>
                  <ArrowRightIcon />
                </span>
              </div>
            </div>

            {/* Card 2: PDF Editor */}
            <div 
              className="big-tool-card glass-card"
              onClick={() => navigate('/tools/pdf-editor')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/tools/pdf-editor');
                }
              }}
            >
              <div className="big-tool-card__icon icon--pdf">
                <PdfIcon />
              </div>
              <h2 className="big-tool-card__title">PDF Editor</h2>
              <p className="big-tool-card__desc">
                Merge multiple documents, extract pages, and rotate PDFs 100% in your browser with complete privacy.
              </p>

              <div className="big-tool-card__chips">
                <span className="big-chip">
                  <MergeIcon /> Merge & Split PDFs
                </span>
                <span className="big-chip">
                  <RotateIcon /> Rotate & Inspect Pages
                </span>
              </div>

              <div className="big-tool-card__action">
                <span className="btn btn--primary btn--large">
                  <span>Open PDF Editor</span>
                  <ArrowRightIcon />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access Bar for Other Tools */}
          <div className="more-tools-bar glass-card">
            <div className="more-tools-info">
              <span className="more-tools-title">Looking for more?</span>
              <span className="more-tools-sub">Explore Password Generator, Mocks, and more utilities.</span>
            </div>
            <div className="more-tools-actions">
              <button 
                onClick={() => navigate('/password-generator')} 
                className="btn btn--secondary btn--small"
              >
                <KeyIcon />
                <span>Password Generator</span>
              </button>
              <button 
                onClick={() => navigate('/tools')} 
                className="btn btn--primary btn--small"
              >
                <span>View All Tools</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
