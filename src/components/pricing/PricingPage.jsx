import Footer from '../common/Footer';
import './PricingPage.css';

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <div className="pricing-container">
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
              <button className="pricing-button pricing-button-free">
                Get Started Free
              </button>
            </div>
          </div>

          {/* Unlimited Tier */}
          <div className="pricing-card">
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Unlimited</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$8.99</span>
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
              <button className="pricing-button pricing-button-primary">
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Pro</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$23.99</span>
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
              <button className="pricing-button pricing-button-primary">
                Start Free Trial
              </button>
            </div>
          </div>

        </div>

        {/* Lifetime Deal - Separate Section */}
        <div className="pricing-lifetime-section">
          <div className="pricing-card pricing-card-lifetime">
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Lifetime</h2>
              <div className="pricing-card-price">
                <span className="price-amount">$149</span>
                <span className="price-period">one-time</span>
              </div>
            </div>
            <div className="pricing-card-body">
              <div className="credit-system-info">
                <p className="credit-info-text">
                  <strong>Credit-Based System:</strong> Since we use OpenAI for processing, this plan includes <strong>500 credits</strong> to get you started. Each tailored resume uses 1 credit. Mock interview credit usage will be announced soon.
                </p>
                <p className="credit-info-text">
                  Additional credits can be purchased as needed at competitive rates.
                </p>
              </div>
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
              <button className="pricing-button pricing-button-lifetime">
                Get Lifetime Access
              </button>
              <p className="credit-note">
                * 1 credit = 1 tailored resume. Additional credits can be purchased in packs.
              </p>
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
      </div>
      <Footer />
    </div>
  );
}

