import './InputControls.css';

export default function InputControls({
  inputMode,
  setInputMode,
  isListening,
  volumeLevel = 0,
  onVoiceClick,
  textInput,
  setTextInput,
  onSubmit,
  disabled,
}) {
  return (
    <div className="input-controls">
      <div className="input-mode-toggle">
        <button
          className={`mode-button ${inputMode === 'voice' ? 'active' : ''}`}
          onClick={() => setInputMode('voice')}
          disabled={disabled}
        >
          <span className="material-icons">mic</span>
          Voice
        </button>
        <button
          className={`mode-button ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
          disabled={disabled}
        >
          <span className="material-icons">keyboard</span>
          Type
        </button>
      </div>

      {inputMode === 'voice' ? (
        <button
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={onVoiceClick}
          disabled={disabled}
        >
          <span className="material-icons">
            {isListening ? 'mic' : 'mic_none'}
          </span>
          {isListening ? 'Listening...' : 'Click to Speak'}
          <div className="voice-meter" aria-hidden="true">
            <div
              className="voice-meter-level"
              style={{ width: `${Math.min(100, Math.max(0, volumeLevel * 100))}%` }}
            />
          </div>
        </button>
      ) : (
        <form onSubmit={onSubmit} className="text-input-form">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your answer..."
            className="text-input"
            disabled={disabled}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={disabled || !textInput.trim()}
          >
            <span className="material-icons">send</span>
          </button>
        </form>
      )}
    </div>
  );
}

