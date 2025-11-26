import './LoadingSpinner.css';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <svg className="spinner-svg" viewBox="0 0 50 50">
          <circle
            className="spinner-circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
        </svg>
      </div>
      <p className="loading-spinner-message">{message}</p>
    </div>
  );
}

