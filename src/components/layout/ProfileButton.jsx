import { Link } from 'react-router-dom';
import './Navigation.css';

export default function ProfileButton() {
  return (
    <div className="app-header-profile">
      <Link
        to="/profile"
        className="profile-icon-button"
        title="View and edit your profile"
      >
        <span className="material-icons">account_circle</span>
      </Link>
    </div>
  );
}

