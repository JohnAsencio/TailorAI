import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Helper function to clear all auth-related storage
  const clearAuthStorage = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.')) {
            localStorage.removeItem(key);
          }
        });
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (err) {
      // Silently fail
    }
  };

  // Initialize Supabase auth listener (no getSession to avoid hanging promise)
  useEffect(() => {
    let ignore = false;

    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (ignore) return;
      
      // Handle sign out events (including when user is deleted)
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setAuthLoading(false);
        // Clear auth storage when signed out
        clearAuthStorage();
        return;
      }

      // Handle token refresh failures (user might have been deleted)
      if (event === 'TOKEN_REFRESHED' && !session?.user) {
        setUser(null);
        setAuthLoading(false);
        clearAuthStorage();
        return;
      }

      setUser(session?.user ?? null);
      setAuthLoading(false);

      // When a user signs in (including Google OAuth) or session is restored from URL (INITIAL_SESSION), ensure they have a profile
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        try {
          // Optionally verify user exists before creating profile (don't clear session on failure—OAuth callback can race)
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          if (authError || !authUser?.user) {
            console.warn('User session validation skipped (may be OAuth callback race); keeping session from event');
            // Do not clear user—we have a valid session from the event; clearing caused login to appear broken
          } else {
            // Check if user profile exists, if not create it (which sends welcome email)
            console.log('📞 Calling create-user-profile API for:', session.user.email);
            const profileResponse = await fetch('/api/create-user-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
              }),
            });

            if (!profileResponse.ok) {
              const errorText = await profileResponse.text();
              console.warn('⚠️ Failed to ensure user profile exists:', profileResponse.status, errorText);
            } else {
              const profileData = await profileResponse.json();
              console.log('✅ User profile created/updated:', profileData);
            }
          }
        } catch (err) {
          console.error('Error ensuring user profile:', err);
          // Don't block auth flow if profile check fails
        }
      }

      // Don't validate right after sign-in or when session is restored from URL (OAuth callback)
      // INITIAL_SESSION fires when page loads with tokens in URL; validating here could clear the user
      if (session?.user && event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') {
        try {
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          if (userError || !currentUser) {
            console.warn('User no longer exists, signing out');
            setUser(null);
            clearAuthStorage();
            try {
              await supabase.auth.signOut({ scope: 'global' });
            } catch (signOutErr) {
              clearAuthStorage();
            }
          }
        } catch (err) {
          if (err?.message?.includes('JWT') || err?.status === 401) {
            setUser(null);
            clearAuthStorage();
            try {
              await supabase.auth.signOut({ scope: 'global' });
            } catch (signOutErr) {
              clearAuthStorage();
            }
          }
        }
      }
    });

    // Immediately allow UI to render; onAuthStateChange will update user if any
    setAuthLoading(false);

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return;
    }
    
    if (!authEmail || !authPassword) {
      setAuthError("Please enter email and password.");
      return;
    }
    
    setAuthError("");
    setSignInLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      
      if (error) {
        setAuthError(error.message);
        setSignInLoading(false);
        return;
      }
      
      if (data?.user) {
        setUser(data.user);
        setAuthEmail("");
        setAuthPassword("");
        setSignInLoading(false);
        window.location.href = '/tailor';
        return;
      }
      
      setAuthError("Sign in failed. Please try again.");
      setSignInLoading(false);
    } catch (err) {
      setAuthError("Failed to sign in. Please try again.");
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return;
    }
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        // Create user profile with free tier credits
        if (data?.user) {
          try {
            const profileResponse = await fetch('/api/create-user-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                email: authEmail,
              }),
            });
            
            if (!profileResponse.ok) {
              console.error('Failed to create user profile, but signup succeeded');
            }
          } catch (profileErr) {
            console.error('Error creating user profile:', profileErr);
            // Don't block signup if profile creation fails
          }
        }
        
        setAuthEmail("");
        setAuthPassword("");
        setAuthError("Account created! Please check your email to verify your account.");
      }
    } catch (err) {
      setAuthError("Failed to sign up. Please try again.");
    }
  };

  const handleSignOut = async () => {
    // Always clear user state and storage, even if signOut fails
    setUser(null);
    clearAuthStorage();
    
    if (!supabase) {
      return;
    }
    
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Even if signOut fails (e.g., user was deleted), we've already cleared state
      console.warn('Sign out error (user may have been deleted):', err);
      // Force clear storage again to be sure
      clearAuthStorage();
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl.trim() === '' || supabaseUrl === 'undefined') {
        setAuthError("Supabase URL is not configured. Please check your VITE_SUPABASE_URL environment variable.");
      } else {
        setAuthError("Supabase is not properly configured. Please check your environment variables.");
      }
      return;
    }
    
    setAuthError("");
    try {
      // For local dev, redirect back to the signin page so onAuthStateChange can handle it
      const redirectUrl = `${window.location.origin}/signin`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        if (error.message && error.message.includes('URL')) {
          setAuthError("Please check your Supabase URL configuration. Make sure VITE_SUPABASE_URL is set correctly in your environment variables.");
        } else {
          setAuthError(error.message || "Failed to sign in with Google. Please try again.");
        }
      }
    } catch (err) {
      console.error('Google sign-in exception:', err);
      setAuthError("Failed to sign in with Google. Please check your Supabase configuration and try again.");
    }
  };

  return {
    user,
    authLoading,
    signInLoading,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handleGoogleSignIn,
  };
}

