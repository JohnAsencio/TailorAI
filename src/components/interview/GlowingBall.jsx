import './GlowingBall.css';

export default function GlowingBall({ isSpeaking, isListening, isPaused }) {
  return (
    <div className="glowing-ball-container">
      <div 
        className={`glowing-ball ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''} ${isPaused ? 'paused' : ''}`}
      >
        <div className="ball-inner"></div>
        <div className="ball-pulse"></div>
        {isSpeaking && !isPaused && <div className="ball-ripple"></div>}
      </div>
      <div className="ball-status">
        {isPaused ? 'Paused' : isSpeaking ? 'Interviewer speaking' : isListening ? 'Listening...' : 'Your turn'}
      </div>
    </div>
  );
}

