import './Navigation.css';

export default function ProfileButton({ onClick }) {
  return (
    <div className="app-header-profile">
      <button
        type="button"
        className="profile-icon-button"
        onClick={onClick}
        title="View and edit your profile"
      >
        <span className="material-icons">account_circle</span>
      </button>
    </div>
  );
}

