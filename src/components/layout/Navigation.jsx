import './Navigation.css';

export default function Navigation({ activeView, setActiveView }) {
  return (
    <nav className="app-nav-tabs">
      <button
        type="button"
        className={`nav-tab ${activeView === "tailor" ? "active" : ""}`}
        onClick={() => setActiveView("tailor")}
      >
        Resume Tailor
      </button>
      <button
        type="button"
        className={`nav-tab ${activeView === "mock" ? "active" : ""}`}
        onClick={() => setActiveView("mock")}
      >
        Mock Interviews
      </button>
    </nav>
  );
}

