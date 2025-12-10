import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import './PricingLoginPage.css';

export default function PricingLoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');

  // Get planId from query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    if (plan) {
      setPlanId(plan);
    }
  }, [location]);

  // If user is already logged in and has a plan, redirect to checkout
  useEffect(() => {
    if (user && planId && !redirecting) {
      // User is logged in, proceed to checkout immediately
      setRedirecting(true);
      setRedirectMessage('Redirecting to secure checkout...');
      handleCheckoutRedirect();
    }
  }, [user, planId]);

  const handleCheckoutRedirect = async () => {
    if (!user || !planId) return;
    
    try {
      setRedirecting(true);
      setRedirectMessage('Redirecting to secure checkout...');
      const { redirectToCheckout } = await import('../../services/paymentService');
      await redirectToCheckout(planId, user.id, user.email || '');
    } catch (error) {
      console.error('Checkout redirect error:', error);
      setError('Failed to start checkout. Please try again.');
      setRedirecting(false);
      setRedirectMessage('');
    }
  };

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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
        } else {
          // Supabase auto-signs in users after sign-up (unless email confirmation is required)
          if (data.user && data.session) {
            // User was created and auto-signed in - show success message and redirect immediately
            setEmail('');
            setPassword('');
            setRedirecting(true);
            setRedirectMessage('Account created! Redirecting to secure checkout...');
            // Small delay to ensure user state is updated, then proceed to checkout
            setTimeout(() => {
              if (planId) {
                handleCheckoutRedirect();
              } else {
                navigate('/pricing');
              }
            }, 300);
          } else if (data.user) {
            // User created but needs email confirmation
            setError('Please check your email to confirm your account. After confirmation, you can sign in to complete your purchase.');
            setLoading(false);
          } else {
            setError('Account creation failed. Please try again.');
            setLoading(false);
          }
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
          // Success - user is now signed in
          setEmail('');
          setPassword('');
          setRedirecting(true);
          setRedirectMessage('Signed in! Redirecting to secure checkout...');
          // Redirect immediately to checkout if planId exists
          if (planId) {
            // Small delay to ensure user state is updated
            setTimeout(() => {
              handleCheckoutRedirect();
            }, 300);
          } else {
            // No plan selected, go back to pricing
            navigate('/pricing');
          }
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
      // Redirect back to pricing login with planId preserved
      const redirectUrl = planId 
        ? `${window.location.origin}/pricing/login?plan=${planId}&google_auth=true`
        : `${window.location.origin}/pricing/login?google_auth=true`;
      
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
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  // Handle Google auth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('google_auth') === 'true' && user && planId && !redirecting) {
      // User returned from Google auth, proceed to checkout immediately
      setRedirecting(true);
      setRedirectMessage('Signed in! Redirecting to secure checkout...');
      handleCheckoutRedirect();
    }
  }, [location, user, planId]);

  // Show redirecting state instead of form
  if (redirecting) {
    return (
      <div className="pricing-login-page">
        <div className="pricing-login-container">
          <div className="pricing-login-card">
            <div className="pricing-login-redirecting">
              <div className="pricing-login-spinner">
                <svg className="spinner-svg" viewBox="0 0 50 50">
                  <circle
                    className="spinner-path"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="5"
                  />
                </svg>
              </div>
              <h2 className="pricing-login-redirect-title">{redirectMessage}</h2>
              <p className="pricing-login-redirect-subtitle">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-login-page">
      <div className="pricing-login-container">
        <div className="pricing-login-card">
          <h1 className="pricing-login-title">
            {isSignUp ? 'Create Account' : 'Sign In'} to Continue
          </h1>
          <p className="pricing-login-subtitle">
            {planId 
              ? `Sign in or create an account to purchase the ${planId} plan`
              : 'Sign in or create an account to purchase a plan'}
          </p>

          {error && <div className="pricing-login-error">{error}</div>}

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
                disabled={loading}
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
                disabled={loading}
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
            disabled={loading}
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

          <div className="pricing-login-back">
            <button type="button" onClick={() => navigate('/pricing')}>
              ← Back to Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

