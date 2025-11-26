import { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useResume } from "./hooks/useResume";
import { initializePdfWorker } from "./utils/pdfUtils";
import { ThemeToggle, Header, LoginPage, ProfilePage, TailorPage, MockPage } from "./components";
import './App.css';

// Initialize PDF worker
initializePdfWorker();

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
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
  } = useAuth();

  // Resume state that persists across tab switches
  const resumeState = useResume();

  const [activeView, setActiveView] = useState("login");

  // Handle view changes based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (activeView === "login") {
          setActiveView("tailor");
        }
      } else {
        setActiveView("login");
      }
    }
  }, [user, authLoading, activeView]);

  return (
    <div className="app-container animate-fade-in">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <Header user={user} activeView={activeView} setActiveView={setActiveView} />

      <main className="main-content-area animate-fade-in">
        {!authLoading && !user && activeView === "login" && (
          <LoginPage
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            handleSignIn={handleSignIn}
            handleSignUp={handleSignUp}
            handleGoogleSignIn={handleGoogleSignIn}
          />
        )}

        {user && activeView === "tailor" && <TailorPage resumeState={resumeState} />}
        {user && activeView === "mock" && <MockPage />}
        {user && activeView === "profile" && (
          <ProfilePage user={user} handleSignOut={handleSignOut} />
        )}
      </main>
    </div>
  );
}

export default App;