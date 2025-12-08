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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear user immediately on sign out
        setUser(null);
      } else {
        setUser(session?.user ?? null);
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
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        // Success - onAuthStateChange will handle state update
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      setAuthError("Failed to sign in. Please try again.");
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
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        // Success - onAuthStateChange will handle state update
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      setAuthError("Failed to sign up. Please try again.");
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      console.error("Cannot sign out: Supabase client is not initialized");
      setAuthError("Unable to sign out. Please refresh the page and try again.");
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign-out error:", error);
        setAuthError(error.message || "Failed to sign out. Please try again.");
      } else {
        // Clear any auth errors on successful sign out
        setAuthError("");
        // Clear local storage items related to auth if needed
        // The onAuthStateChange listener will handle updating the user state
      }
    } catch (err) {
      console.error("Sign-out error:", err);
      setAuthError("An unexpected error occurred while signing out. Please try again.");
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

