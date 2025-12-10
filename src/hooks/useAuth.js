import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Initialize Supabase auth listener
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let ignore = false;

    const getUser = async () => {
      setAuthLoading(true);
      try {
        // Use getSession instead of getUser - it doesn't throw when no session exists
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!ignore) {
          if (error) {
            console.error("Error fetching session:", error);
            setUser(null);
            setAuthLoading(false);
            return;
          }
          
          // If we have a session, verify it's still valid by making a simple authenticated request
          if (session?.user) {
            // Try to access user metadata - if user was deleted, this will fail
            const { error: userError } = await supabase.auth.getUser();
            
            // If getUser fails, the user likely doesn't exist anymore
            if (userError) {
              console.log('Session invalid - user may have been deleted. Clearing session...');
              await supabase.auth.signOut();
              // Manually clear all Supabase auth storage
              if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.includes('supabase') || key.includes('sb-')) {
                    localStorage.removeItem(key);
                  }
                });
              }
              setUser(null);
              setAuthLoading(false);
              return;
            }
          }
          
          const fetchedUser = session?.user ?? null;
          setUser(fetchedUser);
          setAuthLoading(false);
        }
      } catch (err) {
        // Fallback: if getSession also fails, just set user to null
        if (!ignore) {
          console.error("Error fetching user:", err);
          setUser(null);
          setAuthLoading(false);
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Clear user immediately on sign out or when session is null
        setUser(null);
      } else {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // Link waitlist entry to user account if they were on waitlist
        // This handles Google sign-in, email sign-in, and other OAuth providers
        if (newUser && newUser.email && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          try {
            const { linkWaitlistToUser } = await import('../services/waitlistService');
            await linkWaitlistToUser(newUser.email, newUser.id);
          } catch (err) {
            // Don't fail auth if waitlist linking fails
            console.error('Error linking waitlist:', err);
          }
        }
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.");
      return;
    }
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        console.error("Sign-in error:", error);
        // Check for specific error codes
        if (error.message && (error.message.includes('404') || error.message.includes('NOT_FOUND'))) {
          setAuthError("Cannot connect to Supabase server. Please verify your VITE_SUPABASE_URL is correct in Vercel settings.");
        } else {
          setAuthError(error.message);
        }
      } else {
        // Success - onAuthStateChange will handle state update
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      if (err.message && (err.message.includes('404') || err.message.includes('NOT_FOUND'))) {
        setAuthError("Cannot connect to Supabase server. Please verify your VITE_SUPABASE_URL is correct in Vercel settings.");
      } else {
        setAuthError("Failed to sign in. Please try again.");
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.");
      return;
    }
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        console.error("Sign-up error:", error);
        // Check for specific error codes
        if (error.message.includes('404') || error.message.includes('NOT_FOUND')) {
          setAuthError("Cannot connect to Supabase. Please check your configuration. Error: " + error.message);
        } else {
          setAuthError(error.message);
        }
      } else {
        // Link waitlist entry to user account if they were on waitlist
        if (data?.user && authEmail) {
          try {
            const { linkWaitlistToUser } = await import('../services/waitlistService');
            await linkWaitlistToUser(authEmail, data.user.id);
          } catch (err) {
            // Don't fail signup if waitlist linking fails
            console.error('Error linking waitlist:', err);
          }
        }
        // Success - onAuthStateChange will handle state update
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      if (err.message && (err.message.includes('404') || err.message.includes('NOT_FOUND'))) {
        setAuthError("Cannot connect to Supabase server. Please verify your VITE_SUPABASE_URL is correct.");
      } else {
        setAuthError("Failed to sign up. Please try again.");
      }
    }
  };

  const handleSignOut = async () => {
    // Navigate to landing page first, before clearing user state
    // This prevents ProtectedRoute from redirecting to /signin
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    if (!supabase) {
      console.error("Cannot sign out: Supabase client is not initialized");
      // Force clear user state even if Supabase client is null
      setUser(null);
      clearAuthStorage();
      return;
    }
    
    try {
      // Try to sign out via Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        // If sign out fails (e.g., session already missing), still clear local state
        console.warn("Sign-out API error (may be expected if session expired):", error.message);
      }
      
      // Always clear local storage and user state, even if API call fails
      clearAuthStorage();
      setUser(null);
      setAuthError("");
      
    } catch (err) {
      // If sign out throws an error (like AuthSessionMissingError), 
      // still clear local state
      console.warn("Sign-out error (clearing local state anyway):", err.message || err);
      clearAuthStorage();
      setUser(null);
      setAuthError("");
    }
  };

  // Helper function to clear all auth-related storage
  const clearAuthStorage = () => {
    try {
      // Clear Supabase auth storage from localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear Supabase-related keys (Supabase stores auth data with various prefixes)
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.')) {
            localStorage.removeItem(key);
          }
        });
      }
      // Also clear sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    } catch (err) {
      console.warn("Error clearing auth storage:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.");
      return;
    }
    setAuthError("");
    try {
      // Get the full current URL with pathname for redirect
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setAuthError("Failed to sign in with Google. Please try again.");
    }
  };

  return {
    user,
    authLoading,
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

