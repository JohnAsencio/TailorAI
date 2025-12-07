import { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useResume } from "./hooks/useResume";
import { initializePdfWorker } from "./utils/pdfUtils";
import { Header, LoginPage, ProfilePage, TailorPage, MockPage, LandingPage, MyResumesPage } from "./components";
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

  const [activeView, setActiveView] = useState("landing");

  // Handle view changes based on auth state
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (activeView === "landing" || activeView === "login") {
          setActiveView("tailor");
        }
      } else {
        if (activeView !== "landing" && activeView !== "login") {
          setActiveView("landing");
        }
      }
    }
  }, [user, authLoading, activeView]);

  return (
    <div className="app-container animate-fade-in">
      <Header user={user} activeView={activeView} setActiveView={setActiveView} />

      <main className="main-content-area animate-fade-in">
        {!authLoading && !user && activeView === "landing" && (
          <LandingPage />
        )}

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
            onBackToLanding={() => setActiveView("landing")}
          />
        )}

        {user && activeView === "tailor" && <TailorPage resumeState={resumeState} user={user} />}
        {user && activeView === "resumes" && (
          <MyResumesPage 
            user={user} 
            onStartMockInterview={(resume) => {
              // Navigate to mock interview with resume data
              setActiveView("mock");
              // You can pass resume data through state or context if needed
            }} 
          />
        )}
        {user && activeView === "mock" && <MockPage />}
        {user && activeView === "profile" && (
          <ProfilePage user={user} handleSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
        )}
      </main>
    </div>
  );
}

export default App;