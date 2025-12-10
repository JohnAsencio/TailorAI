import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './SubscriptionRequiredModal.css';

export default function SubscriptionRequiredModal({ onClose }) {
  const navigate = useNavigate();

  // Scroll to top of viewport when modal opens to ensure it's visible
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore scroll position when modal closes (optional)
      // window.scrollTo({ top: scrollY, behavior: 'smooth' });
      // Restore body scroll
      document.body.style.overflow = '';
    };
  }, []);

  const handleGoToPricing = () => {
    navigate('/pricing');
    onClose();
  };

  const handleClose = () => {
    onClose();
    // Optionally redirect to a safe page if user closes without subscribing
    // For now, just close the modal and let them stay on landing page
  };

  return (
    <div className="subscription-modal-overlay" onClick={handleClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <button className="subscription-modal-close" onClick={handleClose}>×</button>
        <div className="subscription-modal-content">
          <h2 className="subscription-modal-title">Subscription Required</h2>
          <p className="subscription-modal-message">
            You need to subscribe to a plan to access this feature. Please choose a plan to continue.
          </p>
          <div className="subscription-modal-actions">
            <button 
              className="subscription-modal-button-primary"
              onClick={handleGoToPricing}
            >
              View Pricing Plans
            </button>
            <button 
              className="subscription-modal-button-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

