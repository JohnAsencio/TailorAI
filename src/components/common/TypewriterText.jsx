import { useState, useEffect } from "react";
import './TypewriterText.css';

const messages = [
  "Get the interview",
  "Land your dream job",
  "Stand out to recruiters",
  "Pass ATS systems with ease",
  "Ace your next application",
  "Practice interviewing",
  "Stop writing generic resumes",
  "Take control"
];

export default function TypewriterText() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentMessage = messages[currentMessageIndex];
    
    if (!isDeleting && displayText === currentMessage) {
      // Finished typing, wait then start deleting
      setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      // Finished deleting, move to next message
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText((prev) => prev.slice(0, -1));
        setTypingSpeed(50); // Faster when deleting
      } else {
        setDisplayText((prev) => currentMessage.slice(0, prev.length + 1));
        setTypingSpeed(100); // Normal speed when typing
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentMessageIndex]);

  return (
    <div className="typewriter-container">
      <span className="typewriter-text">{displayText}</span>
      <span className="typewriter-cursor">|</span>
    </div>
  );
}

