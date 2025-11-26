import './ProfilePage.css';

export default function ProfilePage({ user, handleSignOut }) {
  return (
    <section className="simple-section-card animate-fade-in">
      <h2 className="simple-section-title">Profile & Settings</h2>
      <div className="profile-info-section">
        <div className="profile-avatar-large">
          <span className="material-icons">account_circle</span>
        </div>
        <div className="profile-info">
          <h3 className="profile-email">{user.email}</h3>
          <p className="profile-meta">User ID: {user.id}</p>
        </div>
      </div>
      
      <div className="profile-settings-section">
        <h4 className="profile-settings-title">Account Settings</h4>
        <p className="simple-section-text">
          Future settings like default role preferences, notification options, and mock interview style will live here.
        </p>
      </div>

      <div className="auth-buttons" style={{ marginTop: "2rem" }}>
        <button
          type="button"
          className="auth-button secondary"
          onClick={handleSignOut}
        >
          <span className="material-icons">logout</span>
          Sign Out
        </button>
      </div>
    </section>
  );
}

