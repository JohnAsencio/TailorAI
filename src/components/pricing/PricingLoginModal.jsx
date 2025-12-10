import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import './PricingLoginModal.css';

export default function PricingLoginModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Debug: Log when modal renders
  useEffect(() => {
    console.log('PricingLoginModal rendered');
  }, []);

  // Watch for user login and call onSuccess
  useEffect(() => {
    if (user) {
      onSuccess();
    }
  }, [user, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!supabase) {
        setError('Supabase is not configured');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
        } else {
          // Success - onAuthStateChange will update user, then useEffect will call onSuccess
          setEmail('');
          setPassword('');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
        } else {
          // Success - onAuthStateChange will update user, then useEffect will call onSuccess
          setEmail('');
          setPassword('');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError('Supabase is not configured');
      return;
    }

    setError('');
    try {
      // Always redirect back to pricing page after Google auth
      const redirectUrl = `${window.location.origin}/pricing?google_auth=true`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message);
      }
      // User will be redirected to Google, then back to pricing page
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="pricing-login-overlay" onClick={onClose}>
      <div className="pricing-login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-login-close" onClick={onClose}>×</button>
        
        <h2 className="pricing-login-title">
          {isSignUp ? 'Create Account' : 'Sign In'} to Continue
        </h2>
        <p className="pricing-login-subtitle">
          Sign in or create an account to purchase a plan
        </p>

        {error && <p className="pricing-login-error">{error}</p>}

        <form className="pricing-login-form" onSubmit={handleSubmit}>
          <div className="pricing-login-field">
            <label htmlFor="pricing-email">Email</label>
            <input
              id="pricing-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="pricing-login-field">
            <label htmlFor="pricing-password">Password</label>
            <input
              id="pricing-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="pricing-login-submit"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="pricing-login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="pricing-login-google"
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

        <p className="pricing-login-switch">
          {isSignUp ? (
            <>Already have an account? <button type="button" onClick={() => setIsSignUp(false)}>Sign In</button></>
          ) : (
            <>Don't have an account? <button type="button" onClick={() => setIsSignUp(true)}>Sign Up</button></>
          )}
        </p>
      </div>
    </div>
  );
}

