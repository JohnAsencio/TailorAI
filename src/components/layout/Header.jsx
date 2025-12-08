import { Link, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import ProfileButton from './ProfileButton';
import ProductsDropdown from './ProductsDropdown';
import './Header.css';

export default function Header({ user }) {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <header className="app-header animate-fade-in">
      <div className="app-header-inner">
        <div className="app-header-left">
          <div className="app-header-title-group">
            <Link to="/" className="app-header-title-link">
              <h1 className="app-header-title">Tailor AI</h1>
            </Link>
          </div>
          <nav className="landing-nav">
            <ProductsDropdown />
            <Link 
              to="/pricing" 
              className={`landing-nav-link ${location.pathname === "/pricing" ? "active" : ""}`}
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="app-header-right">
          {user && (
            <Navigation />
          )}
          {!user && (
            <Link to="/signin" className="header-signin-button">
              Sign In
            </Link>
          )}
          {user && (
            <ProfileButton />
          )}
        </div>
      </div>
    </header>
  );
}

