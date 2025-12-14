import { useEffect, useRef } from 'react';
import './TranscriptionPanel.css';

export default function TranscriptionPanel({ messages }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="transcription-panel">
      <div className="transcription-header">
        <h3>Conversation</h3>
      </div>
      <div className="transcription-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="transcription-empty">
            <p>The interview conversation will appear here.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`transcription-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}
            >
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'assistant' ? 'Interviewer' : 'You'}
                </span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

