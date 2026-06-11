import { Link, NavLink } from 'react-router-dom';

interface Props {
  tagline?: string;
}

export default function Header({ 
  tagline = "THE ULTIMATE MEDIA TOOLKIT"
}: Props) {
  return (
    <header className="header" id="header">
      <div className="container">
        <nav className="header__nav">
          <div className="header__left">
            <Link 
              to="/tools" 
              className="header__brand" 
              style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              <div className="header__logo-text">&lt; OrdinaryTools /&gt;</div>
              <div className="logo-subtitle">{tagline}</div>
            </Link>
          </div>

          <div className="header__center">
            <div className="header__menu">
              <NavLink to="/tools" className="header__menu-link">Tools</NavLink>
              <NavLink to="/mocks" className="header__menu-link">Mocks</NavLink>
              <NavLink to="/password-generator" className="header__menu-link">Password Generator</NavLink>
            </div>
          </div>

          <div className="header__right">
            <button className="btn btn--primary btn--small">
              LogIn / SignUp
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
