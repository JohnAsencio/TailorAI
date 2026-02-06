import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createCheckoutSession } from '../../services/paymentService';
import { notifySubscriptionUpdated } from '../../hooks/useSubscription';
import { PLANS, formatPrice, CREDIT_COSTS } from '../../config/pricing';
import WaitlistForm from '../landing/WaitlistForm';
import Footer from '../common/Footer';
import './PricingPage.css';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showBetaTester, setShowBetaTester] = useState(false);

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
      window.history.replaceState({}, '', '/pricing');
    }
  }, []);

  const handlePayment = async (planId) => {
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
    if (!user) window.location.href = '/signin';
    else window.location.href = '/tailor';
  };

  const tiers = [
    { key: 'free', plan: PLANS.free, cta: 'Get Started Free', onCta: handleFreeStart, featured: false },
    { key: 'basic', plan: PLANS.basic, cta: 'Get Basic', onCta: () => handlePayment('basic'), featured: false },
    { key: 'pro', plan: PLANS.pro, cta: 'Get Pro', onCta: () => handlePayment('pro'), featured: true },
    { key: 'lifetime', plan: PLANS.lifetime, cta: 'Get Lifetime Access', onCta: () => handlePayment('lifetime'), featured: false },
  ];

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
            Select the perfect plan for your job search. All plans include ATS optimization and professional PDF downloads.
          </p>
        </div>

        <div className="pricing-grid-four">
          {tiers.map(({ key, plan, cta, onCta, featured }) => (
            <div
              key={key}
              className={`pricing-card ${featured ? 'pricing-card-featured' : ''} ${key === 'lifetime' ? 'pricing-card-lifetime' : ''}`}
            >
              {featured && <div className="pricing-badge">Most Popular</div>}
              {key !== 'free' && plan.regularPriceCents > 0 && (
                <span className="pricing-launch-label">Launch price</span>
              )}
              <div className="pricing-card-header">
                <h2 className="pricing-card-title">{plan.name}</h2>
                <div className="pricing-card-price">
                  <span className="price-amount">{formatPrice(plan.priceCents)}</span>
                  <span className="price-period">{plan.period}</span>
                  {plan.regularPriceCents > 0 && (
                    <span className="price-original">{formatPrice(plan.regularPriceCents)}</span>
                  )}
                </div>
                <p className="pricing-card-credits">{plan.creditsLabel}</p>
                {plan.description && (
                  <p className="pricing-card-desc">{plan.description}</p>
                )}
              </div>
              <div className="pricing-card-body">
                <ul className="pricing-features">
                  {key === 'free' && (
                    <>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> 2 credits to try features</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Basic ATS check</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> PDF download</li>
                      <li className="pricing-feature pricing-feature-disabled"><span className="feature-icon">✗</span> Save not included</li>
                    </>
                  )}
                  {key === 'basic' && (
                    <>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> 10 credits/month</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Save up to 3 resumes</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> ATS + PDF + mock interviews</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> 1 resume = 1, 1 interview = 5 credits</li>
                    </>
                  )}
                  {key === 'pro' && (
                    <>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> 50 credits/month</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Save up to 15 resumes</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Priority AI processing</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Advanced ATS + mock interviews</li>
                    </>
                  )}
                  {key === 'lifetime' && (
                    <>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Unlimited credits</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Save unlimited resumes</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> Priority support + all features</li>
                      <li className="pricing-feature"><span className="feature-icon">✓</span> One-time payment, no monthly fees</li>
                    </>
                  )}
                </ul>
                <button
                  className={`pricing-button ${key === 'free' ? 'pricing-button-free' : key === 'lifetime' ? 'pricing-button-lifetime' : 'pricing-button-primary'}`}
                  onClick={onCta}
                  disabled={key !== 'free' && loading === key}
                >
                  {key !== 'free' && loading === key ? 'Loading...' : cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pricing-credits-info">
          <h2 className="pricing-credits-title">How credits work</h2>
          <ul className="pricing-credits-list">
            <li><strong>1 credit</strong> = 1 tailored resume</li>
            <li><strong>1 mock interview</strong> = 5 credits</li>
            <li>Need more? Extra credits are <strong>${CREDIT_COSTS.pricePerCreditDollars} per credit</strong> (purchase from your account).</li>
          </ul>
        </div>

        <div className="pricing-value-proposition">
          <div className="value-proposition-content">
            <h2 className="value-proposition-title">Invest in Your Career, Not Just a Tool</h2>
            <p className="value-proposition-text">
              The cost of a premium plan is a fraction of what you'll earn from landing your dream job.
              Our AI-powered tools help you stand out and secure opportunities that can transform your career.
            </p>
          </div>
        </div>

        <div className="pricing-faq">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">How does the credit system work?</h3>
              <p className="faq-answer">
                One credit = one tailored resume. One mock interview = 5 credits. Free tier includes 2 credits to try. Basic gives 10 credits/month, Pro gives 50. Lifetime includes unlimited credits. Need more? You can buy additional credits at $1 per credit.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Can I switch plans later?</h3>
              <p className="faq-answer">
                Yes. You can upgrade or downgrade your plan at any time. Your credits and access will update according to your new plan.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Do credits expire?</h3>
              <p className="faq-answer">
                Free and paid monthly plans reset or refill each billing period. Lifetime plan credits never expire. Any purchased add-on credits do not expire.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">What's the difference between Basic and Pro?</h3>
              <p className="faq-answer">
                Basic includes 10 credits per month (enough for resumes and a couple of mock interviews). Pro includes 50 credits per month and is best for active applicants who apply and interview frequently.
              </p>
            </div>
          </div>
        </div>

        <div className="pricing-beta-section">
          <div className="beta-tester-card">
            <h2 className="beta-tester-title">Become a Beta Tester</h2>
            <p className="beta-tester-description">
              Get early access to new features and help shape Tailor AI. Beta testers receive special perks and priority support.
            </p>
            {!showBetaTester ? (
              <button className="beta-tester-button" onClick={() => setShowBetaTester(true)}>
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
