import './LoginPage.css';
import { supabase } from '../../supabaseClient';
import TypewriterText from '../common/TypewriterText';

export default function LoginPage({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  handleSignIn,
  handleSignUp,
  handleGoogleSignIn,
}) {
  return (
    <section className="auth-page-section animate-fade-in">
      <div className="auth-page-container">
        <h2 className="auth-page-title">Welcome to AI Resume Tailor</h2>
        <TypewriterText />
        <p className="auth-page-subtitle">Sign in or create an account to get started</p>
        
        {!supabase && (
          <div className="auth-config-warning">
            <p className="simple-section-text">
              Supabase is not configured yet. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file to enable sign-in.
            </p>
          </div>
        )}

        {supabase && (
          <>
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  className="auth-input"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              {authError && <p className="auth-error-text">{authError}</p>}
              <div className="auth-buttons">
                <button type="submit" className="auth-button primary">
                  Sign In
                </button>
                <button type="button" className="auth-button secondary" onClick={handleSignUp}>
                  Sign Up
                </button>
              </div>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="auth-button google-button"
              onClick={handleGoogleSignIn}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </section>
  );
}

