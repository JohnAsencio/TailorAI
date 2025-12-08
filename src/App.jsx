import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useResume } from "./hooks/useResume";
import { initializePdfWorker } from "./utils/pdfUtils";
import { Header, LoginPage, ProfilePage, TailorPage, MockPage, LandingPage, MyResumesPage, PrivacyPolicy, PricingPage, ProductsPage, ResumeTailorPage, MockInterviewsPage } from "./components";
import ProtectedRoute from "./components/routing/ProtectedRoute";
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

  return (
    <BrowserRouter>
      <div className="app-container animate-fade-in">
        <Header user={user} />

        <main className="main-content-area animate-fade-in">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={
                !authLoading && !user ? (
                  <LandingPage />
                ) : !authLoading && user ? (
                  <Navigate to="/tailor" replace />
                ) : null
              } 
            />
            <Route 
              path="/signin" 
              element={
                !authLoading && !user ? (
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
                ) : !authLoading && user ? (
                  <Navigate to="/tailor" replace />
                ) : null
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
              path="/products" 
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

            {/* Protected routes */}
            <Route
              path="/tailor"
              element={
                <ProtectedRoute>
                  <TailorPage resumeState={resumeState} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumes"
              element={
                <ProtectedRoute>
                  <MyResumesPage user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mockinterview"
              element={
                <ProtectedRoute>
                  <MockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage user={user} handleSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;