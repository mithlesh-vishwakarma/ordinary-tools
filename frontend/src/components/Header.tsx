import { Link, NavLink } from 'react-router-dom';

interface Props {
  tagline?: string;
}

export default function Header({ 
  tagline = "Powerful Tools for Everyday Work"
}: Props) {
  return (
    <header className="header" id="header">
      <div className="container">
        <nav className="header__nav">
          <div className="header__left">
            <Link 
              to="/" 
              className="header__brand" 
              title="OrdinaryTools - Home"
            >
              <div className="header__logo-wrapper">
                <img 
                  src="/logo.png" 
                  alt="OrdinaryTools Logo" 
                  className="header__logo-img" 
                />
              </div>
              <div className="header__brand-text">
                <div className="header__logo-title">
                  <span className="logo-bracket">&lt;&nbsp;</span>
                  <span className="logo-word-ordinary">Ordinary</span>
                  <span className="logo-word-tools">Tools</span>
                  <span className="logo-bracket">&nbsp;/&gt;</span>
                </div>
                <div className="logo-subtitle">{tagline}</div>
              </div>
            </Link>
          </div>

          <div className="header__center">
            <div className="header__menu">
              <NavLink to="/tools" className="header__menu-link">Tools</NavLink>
              <NavLink to="/mocks" className="header__menu-link">Mocks</NavLink>
            </div>
          </div>

          <div className="header__right">
            <Link to="/tools" className="btn btn--primary btn--small">
              Explore Tools
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
