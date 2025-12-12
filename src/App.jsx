import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useResume } from "./hooks/useResume";
import { initializePdfWorker } from "./utils/pdfUtils";
import { Header, LoginPage, ProfilePage, TailorPage, MockPage, LandingPage, MyResumesPage, PrivacyPolicy, PricingPage, PricingLoginPage, ProductsPage, ResumeTailorPage, MockInterviewsPage } from "./components";
import { Analytics } from "@vercel/analytics/react"
import './App.css';

// Initialize PDF worker
initializePdfWorker();

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
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
  } = useAuth();

  // Resume state that persists across tab switches
  const resumeState = useResume();

  return (
    <BrowserRouter>
      <div className="app-container animate-fade-in">
        <Header user={user} />

        <main className="main-content-area animate-fade-in">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={<LandingPage />} 
            />
            <Route 
              path="/signin" 
              element={
                authLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : user && user.id ? (
                  <Navigate to="/tailor" replace />
                ) : (
                  <LoginPage
                    authEmail={authEmail}
                    setAuthEmail={setAuthEmail}
                    authPassword={authPassword}
                    setAuthPassword={setAuthPassword}
                    authError={authError}
                    signInLoading={signInLoading}
                    handleSignIn={handleSignIn}
                    handleSignUp={handleSignUp}
                    handleGoogleSignIn={handleGoogleSignIn}
                  />
                )
              } 
            />
            <Route 
              path="/privacy" 
              element={<PrivacyPolicy />} 
            />
            <Route 
              path="/pricing" 
              element={<PricingPage />} 
            />
            <Route 
              path="/pricing/login" 
              element={<PricingLoginPage />} 
            />
            <Route 
              path="/about" 
              element={<ProductsPage />} 
            />
            <Route 
              path="/products/resume-tailor" 
              element={<ResumeTailorPage />} 
            />
            <Route 
              path="/products/mock-interviews" 
              element={<MockInterviewsPage />} 
            />

            {/* Protected routes - require sign in */}
            <Route
              path="/tailor"
              element={
                authLoading ? null : (!user || !user.id) ? (
                  <Navigate to="/signin" replace />
                ) : (
                  <TailorPage resumeState={resumeState} user={user} />
                )
              }
            />
            <Route
              path="/resumes"
              element={
                authLoading ? null : (!user || !user.id) ? (
                  <Navigate to="/signin" replace />
                ) : (
                  <MyResumesPage user={user} />
                )
              }
            />
            <Route
              path="/mockinterview"
              element={
                authLoading ? null : (!user || !user.id) ? (
                  <Navigate to="/signin" replace />
                ) : (
                  <MockPage />
                )
              }
            />
            <Route
              path="/profile"
              element={
                authLoading ? null : (!user || !user.id) ? (
                  <Navigate to="/signin" replace />
                ) : (
                  <ProfilePage user={user} handleSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
                )
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {import.meta.env.PROD && <Analytics />}
    </BrowserRouter>
  );
}

export default App;