import { NavLink } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  return (
    <nav className="app-nav-tabs">
      <NavLink
        to="/tailor"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        Tailor Resume
      </NavLink>
      <NavLink
        to="/resumes"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        My Resumes
      </NavLink>
      <NavLink
        to="/mockinterview"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        Mock Interviews
      </NavLink>
    </nav>
  );
}

