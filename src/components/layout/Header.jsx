import Navigation from './Navigation';
import ProfileButton from './ProfileButton';
import './Header.css';

export default function Header({ user, activeView, setActiveView }) {
  return (
    <header className="app-header animate-fade-in">
      <div className="app-header-inner">
        <div className="app-header-title-group">
          <h1 className="app-header-title">AI Resume Tailor</h1>
        </div>
        {user && (
          <Navigation activeView={activeView} setActiveView={setActiveView} />
        )}
        {!user && activeView === "landing" && (
          <button 
            className="header-signin-button"
            onClick={() => setActiveView("login")}
          >
            Sign In
          </button>
        )}
        {user && (
          <ProfileButton onClick={() => setActiveView("profile")} />
        )}
      </div>
    </header>
  );
}

