import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createCheckoutSession } from '../../services/paymentService';
import { notifySubscriptionUpdated } from '../../hooks/useSubscription';
import { isPreLaunchSpecialActive } from '../../config/pricing';
import WaitlistForm from '../landing/WaitlistForm';
import Footer from '../common/Footer';
import './PricingPage.css';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showBetaTester, setShowBetaTester] = useState(false);

  // Check for success/cancel messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Payment successful! Your account has been upgraded.' });
      notifySubscriptionUpdated();
      window.history.replaceState({}, '', '/pricing');
    } else if (params.get('canceled') === 'true') {
      setMessage({ type: 'info', text: 'Payment was canceled. You can try again anytime.' });
      window.history.replaceState({}, '', '/pricing');
    } else if (params.get('google_auth') === 'true') {
      // User returned from Google auth - clean up URL
      window.history.replaceState({}, '', '/pricing');
    }
  }, []);


  const handlePayment = async (planId) => {
    // Require login before checkout - redirect to login page
    if (!user) {
      window.location.href = `/pricing/login?plan=${planId}`;
      return;
    }

    setLoading(planId);
    setMessage(null);

    try {
      const result = await createCheckoutSession(planId, user.id, user.email || '');
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to start checkout. Please try again.' });
        setLoading(null);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setMessage({ type: 'error', text: 'Failed to start checkout. Please try again.' });
      setLoading(null);
    }
  };


  const handleFreeStart = () => {
    if (!user) {
      window.location.href = '/signin';
    } else {
      window.location.href = '/tailor';
    }
  };
  return (
    <div className="pricing-page">
      <div className="pricing-container">
        {message && (
          <div className={`pricing-message pricing-message-${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="pricing-header">
          <h1 className="pricing-title">Choose Your Plan</h1>
          <p className="pricing-subtitle">
            Select the perfect plan for your job search journey. All plans include ATS optimization and professional PDF downloads.
          </p>
        </div>

        <div className="pricing-grid-monthly">
          {/* Free Tier */}
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Free</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$0</span>
                <span className="price-period">forever</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>1 tailored resume</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Basic ATS check</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>PDF download</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Standard processing</span>
                </li>
              </ul>
              <button 
                className="pricing-button pricing-button-free"
                onClick={handleFreeStart}
              >
                Get Started Free
              </button>
            </div>
          </div>

          {/* Unlimited Tier */}
          <div className="pricing-card">
            {isPreLaunchSpecialActive('unlimited') && (
              <div className="pricing-badge pricing-badge-special">Pre-Launch Special</div>
            )}
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Unlimited</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$2.99</span>
                <span className="price-period">/month</span>
                <span className="price-original">$15.99</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited</strong> tailored resumes</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited</strong> ATS checks</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Advanced ATS scoring</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Save up to 10 resumes</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Priority AI processing</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Additional context input</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Professional PDF downloads</span>
                </li>
                <li className="pricing-feature pricing-feature-disabled">
                  <span className="feature-icon">✗</span>
                  <span>Mock interviews</span>
                </li>
              </ul>
              <button 
                className="pricing-button pricing-button-primary"
                onClick={() => handlePayment('unlimited')}
                disabled={loading === 'unlimited'}
              >
                {loading === 'unlimited' ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Pro</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$12.99</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited</strong> tailored resumes</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited</strong> ATS checks</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Advanced ATS scoring</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Save up to 15 resumes</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Priority AI processing</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Additional context input</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Professional PDF downloads</span>
                </li>
                <li className="pricing-feature pricing-feature-highlight">
                  <span className="feature-icon">✓</span>
                  <span><strong>5 mock interviews</strong> per month</span>
                </li>
              </ul>
              <button 
                className="pricing-button pricing-button-primary"
                onClick={() => setShowWaitlist(true)}
              >
                Sign Up for Waitlist
              </button>
            </div>
          </div>

        </div>

        {/* Lifetime Deals - Side by Side */}
        <div className="pricing-lifetime-section">
          {/* Pre-Launch Special */}
          <div className="pricing-card pricing-card-lifetime">
            {isPreLaunchSpecialActive('lifetime') && (
              <div className="pricing-badge pricing-badge-special">Pre-Launch Special</div>
            )}
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Lifetime</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$22.99</span>
                <span className="price-period">one-time</span>
                <span className="price-original">$49.99</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>500 credits</strong> included</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>All Unlimited features</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>No monthly fees</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Buy more credits anytime</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Credits never expire</span>
                </li>
                <li className="pricing-feature pricing-feature-highlight">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited Mock interviews</strong></span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Future features included</span>
                </li>
              </ul>
              <button 
                className="pricing-button pricing-button-lifetime"
                onClick={() => handlePayment('lifetime')}
                disabled={loading === 'lifetime'}
              >
                {loading === 'lifetime' ? 'Loading...' : 'Get Lifetime Access'}
              </button>
            </div>
          </div>

          {/* Regular Lifetime Deal */}
          <div className="pricing-card pricing-card-lifetime">
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Lifetime</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$49.99</span>
                <span className="price-period">one-time</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span><strong>500 credits</strong> included</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>All Unlimited features</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>No monthly fees</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Buy more credits anytime</span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Credits never expire</span>
                </li>
                <li className="pricing-feature pricing-feature-highlight">
                  <span className="feature-icon">✓</span>
                  <span><strong>Unlimited Mock interviews</strong></span>
                </li>
                <li className="pricing-feature">
                  <span className="feature-icon">✓</span>
                  <span>Future features included</span>
                </li>
              </ul>
              <button 
                className="pricing-button pricing-button-lifetime"
                onClick={() => setShowWaitlist(true)}
              >
                Sign Up for Waitlist
              </button>
            </div>
          </div>
        </div>

        {/* Waitlist Modal/Form */}
        {showWaitlist && (
          <div className="waitlist-overlay" onClick={() => setShowWaitlist(false)}>
            <div className="waitlist-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="waitlist-close"
                onClick={() => setShowWaitlist(false)}
              >
                ×
              </button>
              <WaitlistForm onSuccess={() => setShowWaitlist(false)} />
            </div>
          </div>
        )}

        {/* Value Proposition Section */}
        <div className="pricing-value-proposition">
          <div className="value-proposition-content">
            <h2 className="value-proposition-title">
              Invest in Your Career, Not Just a Tool
            </h2>
            <p className="value-proposition-text">
              The cost of a premium plan is a fraction of what you'll earn from landing your dream job. 
              Our AI-powered tools help you stand out in a competitive market and secure opportunities 
              that can transform your career—and your income.
            </p>
            <div className="value-proposition-stats">
              <div className="value-stat">
                <div className="value-stat-number">6-Figure</div>
                <div className="value-stat-label">Potential Salary Increase</div>
              </div>
              <div className="value-stat">
                <div className="value-stat-number">10x</div>
                <div className="value-stat-label">ROI on Investment</div>
              </div>
              <div className="value-stat">
                <div className="value-stat-number">Lifetime</div>
                <div className="value-stat-label">Career Benefits</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pricing-faq">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">How does the credit system work?</h3>
              <p className="faq-answer">
                The Lifetime plan uses a credit-based system. Each tailored resume costs 1 credit. You start with 500 credits, and can purchase additional credit packs as needed. Credits never expire.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Can I switch plans later?</h3>
              <p className="faq-answer">
                Yes! You can upgrade or downgrade your plan at any time. If you switch from Unlimited to Lifetime, we'll prorate your remaining subscription.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">What happens if I run out of credits?</h3>
              <p className="faq-answer">
                You can purchase additional credit packs at any time. We'll notify you when you're running low, and you can buy more credits directly from your account.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Do credits expire?</h3>
              <p className="faq-answer">
                No! Credits in your Lifetime account never expire. Use them whenever you need them, at your own pace.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">How do mock interviews work?</h3>
              <p className="faq-answer">
                Mock interview credits and resume credits are the same. Credit value for mock interviews is yet to be announced. Pro plan includes 5 mock interviews per month (resets monthly), while Lifetime includes 20 mock interviews total. Additional mock interviews can be purchased as needed.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">What's the difference between Unlimited and Pro?</h3>
              <p className="faq-answer">
                Unlimited includes all resume features but no mock interviews. Pro includes everything in Unlimited plus 5 mock interviews per month, perfect for those actively interviewing.
              </p>
            </div>
          </div>
        </div>

        {/* Beta Tester Signup Section */}
        <div className="pricing-beta-section">
          <div className="beta-tester-card">
            <h2 className="beta-tester-title">Become a Beta Tester</h2>
            <p className="beta-tester-description">
              Get early access to new features, provide feedback, and help shape the future of Tailor AI. Beta testers receive special perks and priority support.
            </p>
            {!showBetaTester ? (
              <button 
                className="beta-tester-button"
                onClick={() => setShowBetaTester(true)}
              >
                Sign Up as Beta Tester
              </button>
            ) : (
              <WaitlistForm onSuccess={() => setShowBetaTester(false)} />
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}

