import { Link, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import ProfileButton from './ProfileButton';
import ProductsDropdown from './ProductsDropdown';
import { useCreditStatusFromContext } from '../../contexts/CreditStatusContext';
import './Header.css';

function planDisplayName(planId) {
  if (planId === 'lifetime') return 'Lifetime';
  if (planId === 'pro') return 'Pro';
  if (planId === 'basic') return 'Basic';
  return 'Free';
}

export default function Header({ user }) {
  const location = useLocation();
  const { planId, resumeCredits, unlimited, loading } = useCreditStatusFromContext();

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
              {!loading && (
                <span className="header-plan-badge" title={unlimited ? 'Unlimited credits' : `${resumeCredits} credits`}>
                  {planDisplayName(planId)}{unlimited ? '' : ` · ${resumeCredits}`}
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

