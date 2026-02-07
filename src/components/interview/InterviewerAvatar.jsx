import { useMemo } from 'react';
import './InterviewerAvatar.css';

/**
 * Free, lightweight "person" interviewer:
 * - Renders a simple face (no photo)
 * - Blinks / idles with CSS
 * - Mouth animates while speaking; if `energy` is provided (0..1), it reacts to real audio volume
 */
export default function InterviewerAvatar({
  isSpeaking,
  isThinking,
  isListening,
  isPaused,
  messages = [],
  energy = 0,
  name = 'Interviewer',
}) {
  const statusText = useMemo(() => {
    if (isPaused) return 'Paused';
    if (isSpeaking) return 'Speaking… (tap to interrupt)';
    if (isThinking) return 'Thinking...';
    if (isListening) return 'Listening…';
    if (!messages || messages.length === 0) return 'Starting interview...';
    return 'Your turn';
  }, [isPaused, isSpeaking, isThinking, isListening, messages]);

  const expression = useMemo(() => {
    if (isPaused) return 'neutral';
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'thinking';
    if (isListening) return 'listening';
    return 'idle';
  }, [isPaused, isSpeaking, isThinking, isListening]);

  // Mouth openness:
  // - If we have real audio energy, use it
  // - Otherwise use a small default while speaking so it doesn't look frozen
  const mouthOpen = useMemo(() => {
    if (!isSpeaking || isPaused) return 0;
    const e = Number.isFinite(energy) ? energy : 0;
    const clamped = Math.max(0, Math.min(1, e));
    return Math.max(0.25, clamped);
  }, [isSpeaking, isPaused, energy]);

  return (
    <div className="interviewer-avatar-container">
      <div
        className={[
          'interviewer-avatar',
          isSpeaking && !isPaused ? 'speaking' : '',
          isListening && !isPaused ? 'listening' : '',
          isPaused ? 'paused' : '',
        ].filter(Boolean).join(' ')}
        style={{
          // React requires CSS custom properties as strings
          '--mouth-open': String(mouthOpen),
        }}
        aria-label={name}
      >
        <div className="interviewer-avatar-face" aria-hidden="true">
          <div className={`interviewer-avatar-head ${expression}`}>
            <div className="interviewer-avatar-eyes">
              <div className="eye left">
              </div>
              <div className="eye right">
              </div>
            </div>
            <div className="interviewer-avatar-brows" />
            <div className="interviewer-avatar-mouth" />
          </div>
        </div>
      </div>

      <div className="interviewer-avatar-status">{statusText}</div>
    </div>
  );
}

