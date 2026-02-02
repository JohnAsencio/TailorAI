import './InputControls.css';

export default function InputControls({
  inputMode,
  setInputMode,
  isListening,
  waveformHeights = Array(20).fill(0.1),
  onVoiceClick,
<<<<<<< HEAD
=======
  isSpeaking = false,
>>>>>>> 2de61af (Recovering uncommitted work after local .git deletion)
  textInput,
  setTextInput,
  onSubmit,
  disabled,
  countdown = null,
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
          className={`voice-button ${isListening ? 'listening' : ''} ${countdown !== null ? 'countdown' : ''}`}
          onClick={onVoiceClick}
<<<<<<< HEAD
          disabled={disabled}
          type="button"
        >
          <span className="material-icons">
            {isListening ? 'mic' : 'mic_none'}
          </span>
          {countdown !== null ? `${countdown}...` : isListening ? 'Listening...' : 'Click to Speak'}
=======
          disabled={disabled && !isSpeaking}
          type="button"
        >
          <span className="material-icons">
            {isSpeaking ? 'pan_tool' : isListening ? 'mic' : 'mic_none'}
          </span>
          {isSpeaking
            ? 'Interrupt'
            : countdown !== null
              ? `${countdown}...`
              : isListening
                ? 'Listening...'
                : 'Click to Speak'}
>>>>>>> 2de61af (Recovering uncommitted work after local .git deletion)
          {isListening && (
            <div className="voice-waveform" aria-hidden="true">
              {waveformHeights.map((height, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${Math.min(100, Math.max(20, height * 100))}%`,
                    animationDelay: `${i * 20}ms`
                  }}
                />
              ))}
            </div>
          )}
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

