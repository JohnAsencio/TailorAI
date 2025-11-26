import './ThemeToggle.css';

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <div className="theme-toggle-container">
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      >
        {theme === 'light' ? (
          <span className="material-icons">dark_mode</span>
        ) : (
          <span className="material-icons">light_mode</span>
        )}
      </button>
    </div>
  );
}

