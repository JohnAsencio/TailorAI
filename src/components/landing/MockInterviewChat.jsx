import { useState, useEffect } from 'react';
import './MockInterviewChat.css';

export default function MockInterviewChat({ jobTitle, companyName }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const demoMessages = [
    {
      role: 'interviewer',
      content: "Tell me about a time you led a cross-functional team to deliver a project on time."
    },
    {
      role: 'candidate',
      content: "In my previous role, I led a team of 8 engineers across 3 departments to deliver a major product launch..."
    },
    {
      role: 'interviewer',
      content: "That's a great example! Can you walk me through the specific challenges you faced?"
    },
    {
      role: 'candidate',
      content: "The main challenge was aligning different team priorities. I established daily stand-ups and created a unified project roadmap..."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = (prev + 1) % demoMessages.length;
        // If next message is from interviewer, AI is speaking
        setAiSpeaking(demoMessages[nextIndex].role === 'interviewer');
        return nextIndex;
      });
    }, 3000); // Change message every 3 seconds

    // Set initial AI speaking state
    setAiSpeaking(demoMessages[0].role === 'interviewer');

    return () => clearInterval(interval);
  }, []);

  const visibleMessages = demoMessages.slice(0, currentMessageIndex + 1);

  return (
    <div className="mock-interview-demo">
      <div className="mock-demo-header">
        <div className="mock-demo-header-content">
          <div className="mock-demo-title">AI Interview Simulator</div>
          <div className={`mock-demo-ai-indicator ${aiSpeaking ? 'speaking' : ''}`}>
            <div className="ai-circle-outer"></div>
            <div className="ai-circle-inner"></div>
          </div>
        </div>
      </div>
      <div className="mock-demo-content">
        {visibleMessages.map((msg, idx) => (
          <div key={idx} className={`mock-demo-message ${msg.role}`}>
            <div className="mock-demo-message-avatar">
              {msg.role === 'interviewer' ? (
                <div className="mock-demo-ai-avatar">
                  <div className="ai-avatar-circle"></div>
                </div>
              ) : (
                <div className="mock-demo-user-avatar">
                  <span className="material-icons">account_circle</span>
                </div>
              )}
            </div>
            <div className="mock-demo-message-bubble">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

