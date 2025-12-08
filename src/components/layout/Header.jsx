import { Link, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import ProfileButton from './ProfileButton';
import './Header.css';

export default function Header({ user }) {
  const location = useLocation();

  return (
    <header className="app-header animate-fade-in">
      <div className="app-header-inner">
        <div className="app-header-title-group">
          <Link to="/" className="app-header-title-link">
            <h1 className="app-header-title">Tailor AI</h1>
          </Link>
        </div>
        {user && (
          <Navigation />
        )}
        {!user && location.pathname === "/" && (
          <Link to="/signin" className="header-signin-button">
            Sign In
          </Link>
        )}
        {user && (
          <ProfileButton />
        )}
      </div>
    </header>
  );
}

