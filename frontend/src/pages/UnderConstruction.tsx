import Header from "../components/Header";

interface Props {
  onBack: () => void;
}

export default function UnderConstruction({ onBack }: Props) {
  return (
    <div className="animate-fade-in-up">
      <Header tagline="FEATURE COMING SOON" />
      
      <div className="container" style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div className="glass-card" style={{ padding: '60px 40px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🚧</div>
          <h1 className="header__title" style={{ fontSize: '2.5rem' }}>Coming Soon</h1>
          <p className="header__subtitle" style={{ fontSize: '1.2rem', marginBottom: '32px' }}>
            The page is under progress. soon..!!
          </p>
          <button onClick={onBack} className="btn btn--primary">
            Back to Tools
          </button>
        </div>
      </div>
    </div>
  );
}
