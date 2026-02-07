import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { fetchCreditStatus } from '../../services/creditService';
import { getSavedResumes } from '../../services/savedResumeService';
import { createCreditsCheckoutSession, createPortalSession } from '../../services/paymentService';
import { getPlan, CREDIT_COSTS } from '../../config/pricing';
import { notifyCreditsUpdated } from '../../hooks/useCreditStatus';
import './ProfilePage.css';

const CREDITS_PACKS = [1, 5, 10, 20];

export default function ProfilePage({ user, handleSignOut, theme, toggleTheme }) {
  const navigate = useNavigate();
  const [creditStatus, setCreditStatus] = useState({ planId: 'free', resumeCredits: 0, unlimited: false });
  const [savedCount, setSavedCount] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsSuccess, setCreditsSuccess] = useState(false);
  const [creditsError, setCreditsError] = useState(null);
  const [buyCreditsQuantity, setBuyCreditsQuantity] = useState(10);
  const [buyCreditsLoading, setBuyCreditsLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Redirect to landing page when user signs out
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Validate user session on mount - if user was deleted, force sign out
  useEffect(() => {
    if (user && supabase) {
      const validateUser = async () => {
        try {
          const { data: { user: currentUser }, error } = await supabase.auth.getUser();
          if (error || !currentUser) {
            console.warn('User session invalid, signing out');
            handleSignOut();
          }
        } catch (err) {
          if (err?.message?.includes('JWT') || err?.status === 401) {
            console.warn('User session invalid, signing out');
            handleSignOut();
          }
        }
      };
      validateUser();
    }
  }, [user, handleSignOut]);

  // Credits and saved count
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setCreditsLoading(true);
    Promise.all([
      fetchCreditStatus(user.id),
      getSavedResumes(user.id).then((r) => (r.success && Array.isArray(r.data) ? r.data.length : 0)),
    ]).then(([status, count]) => {
      if (!cancelled) {
        setCreditStatus(status);
        setSavedCount(count);
      }
    }).catch(() => {
      if (!cancelled) setCreditStatus({ planId: 'free', resumeCredits: 0, unlimited: false });
    }).finally(() => {
      if (!cancelled) setCreditsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Credits purchase success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('credits_success') === 'true') {
      setCreditsSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      notifyCreditsUpdated();
      if (user?.id) {
        fetchCreditStatus(user.id).then(setCreditStatus);
      }
    }
    if (params.get('credits_canceled') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user?.id]);

  const handleBuyCredits = async () => {
    if (!user?.id || !user?.email || buyCreditsLoading) return;
    const qty = Math.min(100, Math.max(1, parseInt(buyCreditsQuantity, 10) || 10));
    setBuyCreditsLoading(true);
    setCreditsError(null);
    try {
      const result = await createCreditsCheckoutSession(qty, user.id, user.email);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setCreditsError(result.error || 'Failed to start checkout.');
        setBuyCreditsLoading(false);
      }
    } catch (err) {
      setCreditsError(err.message || 'Something went wrong.');
      setBuyCreditsLoading(false);
    }
  };

  const plan = getPlan(creditStatus.planId);
  const saveLimit = plan?.saveLimit;
  const saveLimitLabel = saveLimit === null ? 'Unlimited' : saveLimit === 0 ? 'None' : `${savedCount ?? 0} of ${saveLimit}`;
  const hasPaidPlan = creditStatus.planId === 'basic' || creditStatus.planId === 'pro' || creditStatus.planId === 'lifetime';

  const handleManageSubscription = async () => {
    if (!user?.id || portalLoading) return;
    setPortalLoading(true);
    try {
      const result = await createPortalSession(user.id);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setCreditsError(result.error || 'Could not open billing portal.');
        setPortalLoading(false);
      }
    } catch (err) {
      setCreditsError(err.message || 'Something went wrong.');
      setPortalLoading(false);
    }
  };

  return (
    <section className="simple-section-card animate-fade-in">
      <h2 className="simple-section-title">Profile & Settings</h2>
      <div className="profile-info-section">
        <div className="profile-avatar-large">
          <span className="material-icons">account_circle</span>
        </div>
        <div className="profile-info">
          <h3 className="profile-email">{user?.email}</h3>
          <p className="profile-meta">User ID: {user?.id}</p>
        </div>
      </div>

      <div className="profile-settings-section">
        <h4 className="profile-settings-title">Plan & Credits</h4>
        {creditsLoading ? (
          <p className="simple-section-text">Loading...</p>
        ) : (
          <>
            <div className="profile-plan-credits-row">
              <span className="profile-plan-label">Current plan:</span>
              <span className="profile-plan-value">{plan?.name ?? 'Free'}</span>
            </div>
            <div className="profile-plan-credits-row">
              <span className="profile-plan-label">Credits:</span>
              <span className="profile-plan-value">
                {creditStatus.unlimited ? 'Unlimited' : `${creditStatus.resumeCredits} remaining`}
              </span>
            </div>
            <div className="profile-plan-credits-row">
              <span className="profile-plan-label">Saved resumes:</span>
              <span className="profile-plan-value">{saveLimitLabel}</span>
            </div>
            {creditsSuccess && (
              <div className="profile-message profile-message-success">Credits added successfully.</div>
            )}
            {creditsError && (
              <div className="profile-message profile-message-error">{creditsError}</div>
            )}
            <div className="profile-buy-credits">
              <p className="profile-buy-credits-desc">Buy extra credits (${CREDIT_COSTS.pricePerCreditDollars} per credit)</p>
              <div className="profile-buy-credits-controls">
                {CREDITS_PACKS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`profile-credits-pack-btn ${buyCreditsQuantity === n ? 'active' : ''}`}
                    onClick={() => setBuyCreditsQuantity(n)}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={buyCreditsQuantity}
                  onChange={(e) => setBuyCreditsQuantity(parseInt(e.target.value, 10) || 10)}
                  className="profile-credits-input"
                />
                <button
                  type="button"
                  className="auth-button primary profile-buy-credits-btn"
                  onClick={handleBuyCredits}
                  disabled={buyCreditsLoading}
                >
                  {buyCreditsLoading ? 'Redirecting…' : `Buy ${buyCreditsQuantity} credits`}
                </button>
              </div>
            </div>
            <p className="profile-plan-links">
              <Link to="/pricing" className="profile-plan-link">View plans</Link>
              {hasPaidPlan && (
                <>
                  <span className="profile-plan-links-sep"> · </span>
                  <button
                    type="button"
                    className="profile-plan-link-button"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Opening…' : 'Manage subscription'}
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
      
      <div className="profile-settings-section">
        <h4 className="profile-settings-title">Appearance</h4>
        <div className="profile-setting-item">
          <div className="profile-setting-info">
            <div className="profile-setting-label">Theme</div>
            <p className="profile-setting-description">
              Choose between light and dark mode. Default is dark mode.
            </p>
          </div>
          <div className="profile-theme-toggle-wrapper">
            <label className="profile-theme-toggle" htmlFor="theme-toggle">
              <input
                id="theme-toggle"
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                className="profile-theme-toggle-input"
              />
              <span className="profile-theme-toggle-slider"></span>
            </label>
            <span className="profile-theme-toggle-label">
              {theme === 'dark' ? (
                <>
                  <span className="material-icons">dark_mode</span>
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <span className="material-icons">light_mode</span>
                  <span>Light Mode</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      
      <div className="profile-settings-section">
        <h4 className="profile-settings-title">Account Settings</h4>
        <p className="simple-section-text">
          Future settings like default role preferences, notification options, and mock interview style will live here.
        </p>
      </div>

      <div className="auth-buttons" style={{ marginTop: "2rem" }}>
        <button
          type="button"
          className="auth-button secondary"
          onClick={handleSignOut}
        >
          <span className="material-icons">logout</span>
          Sign Out
        </button>
      </div>
    </section>
  );
}

