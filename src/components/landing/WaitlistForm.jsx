import { useState } from 'react';
import { joinWaitlist } from '../../services/waitlistService';
import './WaitlistForm.css';

export default function WaitlistForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await joinWaitlist(email);
      if (result.success) {
        setMessage('Successfully joined the waitlist! Check your email for exclusive pre-order offers and beta testing opportunities.');
        setEmail('');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 4000);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Waitlist error:', err);
      setError('Failed to join waitlist. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="waitlist-form-container">
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <div className="waitlist-input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="waitlist-input"
            disabled={loading}
            required
          />
          <button 
            type="submit" 
            className="waitlist-button"
            disabled={loading}
          >
            {loading ? (
              <span className="waitlist-spinner"></span>
            ) : (
              'Join Waitlist'
            )}
          </button>
        </div>
        {error && (
          <p className="waitlist-message error">{error}</p>
        )}
        {message && (
          <p className="waitlist-message success">{message}</p>
        )}
      </form>
    </div>
  );
}

