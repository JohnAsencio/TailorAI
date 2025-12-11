import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Initialize Supabase auth listener (no getSession to avoid hanging promise)
  useEffect(() => {
    let ignore = false;

    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (ignore) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
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
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      setAuthError("Failed to sign up. Please try again.");
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setUser(null);
      clearAuthStorage();
      return;
    }
    try {
      await supabase.auth.signOut({ scope: 'global' });
      clearAuthStorage();
    } catch (err) {
      clearAuthStorage();
      setUser(null);
    }
  };

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

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured.");
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
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError("Failed to sign in with Google. Please try again.");
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

