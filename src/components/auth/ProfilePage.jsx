import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage({ user, handleSignOut, theme, toggleTheme }) {
  const navigate = useNavigate();

  // Redirect to landing page when user signs out
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  return (
    <section className="simple-section-card animate-fade-in">
      <h2 className="simple-section-title">Profile & Settings</h2>
      <div className="profile-info-section">
        <div className="profile-avatar-large">
          <span className="material-icons">account_circle</span>
        </div>
        <div className="profile-info">
          <h3 className="profile-email">{user.email}</h3>
          <p className="profile-meta">User ID: {user.id}</p>
        </div>
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

