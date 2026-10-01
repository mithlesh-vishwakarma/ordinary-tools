import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ShieldCheckIcon, LockIcon, ZapIcon, ArrowRightIcon } from '../components/Icons';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page animate-fade-in-up">
      <Header />

      <div className="container">
        <section className="landing-welcome-section">
          {/* Welcome Badge */}
          <div className="welcome-pill">
            <span className="welcome-pill__dot"></span>
            <span>Welcome to OrdinaryTools</span>
          </div>

          {/* Main Welcome Title */}
          <h1 className="welcome-hero__title">
            Simple, Powerful Tools for <span className="gradient-text">Everyday Tasks</span>
          </h1>

          {/* Subtitle / Intro */}
          <p className="welcome-hero__subtitle">
            A fast, free, and privacy-first suite of utilities crafted to make your everyday work effortless. No paywalls, no tracking, and no registration required.
          </p>

          {/* Privacy & Browser Memory Assurance Card */}
          <div className="privacy-feature-card glass-card">
            <div className="privacy-feature-card__icon">
              <ShieldCheckIcon />
            </div>

            <div className="privacy-feature-card__content">
              <h2 className="privacy-feature-card__title">
                100% Client-Side & Private
              </h2>
              <p className="privacy-feature-card__desc">
                All your documents and files are completely safe inside your browser. All file processing runs locally in your device’s client memory (RAM) — your documents are never uploaded to any external server or stored in the cloud.
              </p>

              <div className="privacy-feature-card__points">
                <div className="privacy-point">
                  <div className="privacy-point__icon">
                    <LockIcon />
                  </div>
                  <div className="privacy-point__text">
                    <strong>Local Memory Only</strong>
                    <span>Processing takes place entirely within your browser session.</span>
                  </div>
                </div>

                <div className="privacy-point">
                  <div className="privacy-point__icon">
                    <ShieldCheckIcon />
                  </div>
                  <div className="privacy-point__text">
                    <strong>Zero Server Uploads</strong>
                    <span>Your documents never leave your computer or device.</span>
                  </div>
                </div>

                <div className="privacy-point">
                  <div className="privacy-point__icon">
                    <ZapIcon />
                  </div>
                  <div className="privacy-point__text">
                    <strong>Instant & Secure</strong>
                    <span>Zero latency transfers, completely private by design.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="welcome-cta">
            <button 
              onClick={() => navigate('/tools')} 
              className="btn btn--primary btn--large"
            >
              <span>Explore Tools</span>
              <ArrowRightIcon />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}


