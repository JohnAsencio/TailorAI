import { Link, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import ProfileButton from './ProfileButton';
import ProductsDropdown from './ProductsDropdown';
import { useSubscription } from '../../hooks/useSubscription';
import './Header.css';

export default function Header({ user }) {
  const location = useLocation();
  const { hasSubscription, subscription } = useSubscription(user?.id ?? null);

  return (
    <header className="app-header animate-fade-in">
      <div className="app-header-inner">
        <div className="app-header-left">
          <div className="app-header-title-group">
            <Link to="/" className="app-header-title-link">
              <div className="app-header-brand">
                <img
                  className="app-header-logo"
                  src="/logo.png"
                  alt="Tailor AI"
                  loading="eager"
                />
                <h1 className="app-header-title">Tailor AI</h1>
              </div>
            </Link>
          </div>
          <nav className="landing-nav" aria-label="Primary">
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
          {user && user.id ? (
            <>
              {hasSubscription && (
                <span className="header-plan-badge" title={subscription?.plan_name}>
                  {subscription?.plan_id === 'lifetime' ? 'Lifetime' : subscription?.plan_id === 'pro' ? 'Pro' : subscription?.plan_id === 'basic' ? 'Basic' : subscription?.plan_name || 'Pro'}
                </span>
              )}
              <Navigation />
              <ProfileButton />
            </>
          ) : (
            <Link to="/signin" className="header-signin-button">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

