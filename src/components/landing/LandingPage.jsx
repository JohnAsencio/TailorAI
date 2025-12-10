import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import WaitlistForm from './WaitlistForm';
import MockInterviewChat from './MockInterviewChat';
import SubscriptionRequiredModal from '../common/SubscriptionRequiredModal';
import Footer from '../common/Footer';
import './LandingPage.css';

export default function LandingPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if subscription is required (from ProtectedRoute redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('subscription_required') === 'true') {
      setShowSubscriptionModal(true);
      // Clean up URL
      const redirect = params.get('redirect');
      if (redirect) {
        // Store redirect for after subscription
        sessionStorage.setItem('postSubscriptionRedirect', redirect);
      }
      // Remove query params from URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>Pre-Launch: Join the Waitlist</span>
          </div>
          <h1 className="hero-title">
            Tailor Your Resume
            <span className="gradient-text"> Perfectly</span>
            <br />
            for Every Job Application
          </h1>
          <p className="hero-subtitle">
            Let AI customize your resume to match job descriptions, optimize for ATS systems, 
            and practice with AI mock interviews. Get interview-ready with professional results in seconds.
          </p>
          
          {/* Exclusive Offers Highlight */}
          <div className="hero-exclusives">
            <div className="exclusive-badge">
              <span className="exclusive-icon">🎯</span>
              <span>Pre-Launch Special: $99 Lifetime (Save $50)</span>
            </div>
            <div className="exclusive-badge">
              <span className="exclusive-icon">⭐</span>
              <span>Beta Tester Access: Shape the Product</span>
            </div>
          </div>

          <div className="hero-cta">
            {!showWaitlist ? (
              <>
                <button 
                  className="cta-button primary hero-waitlist-button"
                  onClick={() => setShowWaitlist(true)}
                >
                  Join the Waitlist
                  <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="hero-cta-note">
                  Free to join • Pre-launch specials via email • No spam, ever
                </p>
              </>
            ) : (
              <WaitlistForm onSuccess={() => setShowWaitlist(false)} />
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card">
            <div className="card-header">
              <div className="card-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className="card-content">
              <div className="demo-section">
                <div className="demo-label">Before</div>
                <div className="demo-text before">
                  <p>• Managed software projects</p>
                  <p>• Worked with teams</p>
                </div>
              </div>
              <div className="arrow-demo">→</div>
              <div className="demo-section">
                <div className="demo-label">After</div>
                <div className="demo-text after">
                  <p>• Led cross-functional teams of 8+ engineers to deliver 3 major products on time</p>
                  <p>• Implemented agile methodologies, reducing project delivery time by 30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Mock Interviews Highlight Section */}
      <section className="landing-mock-interviews">
        <div className="mock-interviews-container">
          <div className="mock-interviews-content">
            <div className="mock-interviews-badge">
              <span className="badge-icon">🎤</span>
              <span>Coming Soon</span>
            </div>
            <h2 className="mock-interviews-title">
              Practice with <span className="gradient-text">AI Mock Interviews</span>
            </h2>
            <p className="mock-interviews-description">
              After tailoring your resume, prepare for your interviews with AI-powered mock interviews. Practice with questions 
              specifically designed for the roles you're applying to, get instant feedback, and build confidence before the real thing.
            </p>
            <div className="mock-interviews-features">
              <div className="mock-feature-item">
                <div className="mock-feature-icon">🎯</div>
                <div className="mock-feature-text">
                  <h4>Role-Specific Questions</h4>
                  <p>Practice with questions tailored to each job description</p>
                </div>
              </div>
              <div className="mock-feature-item">
                <div className="mock-feature-icon">💬</div>
                <div className="mock-feature-text">
                  <h4>Interactive Conversations</h4>
                  <p>Engage in realistic back-and-forth dialogue with AI</p>
                </div>
              </div>
              <div className="mock-feature-item">
                <div className="mock-feature-icon">📝</div>
                <div className="mock-feature-text">
                  <h4>Instant Feedback</h4>
                  <p>Get detailed feedback on your answers and delivery</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mock-interviews-visual">
            <MockInterviewChat />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="features-container">
          <h2 className="features-title">Why Choose Tailor AI?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">ATS Optimized</h3>
              <p className="feature-description">
                Automatically matches keywords and phrases from job descriptions to ensure your resume passes applicant tracking systems.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Get a perfectly tailored resume in seconds. No more hours spent manually tweaking your resume for each application.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Privacy First</h3>
              <p className="feature-description">
                Your data is encrypted and secure. We never share your resume or personal information with third parties.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Match Scoring</h3>
              <p className="feature-description">
                See exactly how well your resume matches each job description with real-time compatibility scoring.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">PDF Ready</h3>
              <p className="feature-description">
                Download your tailored resume as a professional PDF, ready to submit to employers immediately.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Powered</h3>
              <p className="feature-description">
                Powered by advanced AI that understands context, industry terminology, and best resume practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive Pre-Launch Offers Section */}
      <section className="landing-exclusive-offers">
        <div className="exclusive-offers-container">
          <div className="exclusive-offers-header">
            <h2 className="exclusive-offers-title">🎁 Pre-Launch Specials</h2>
            <p className="exclusive-offers-subtitle">
              Join the waitlist to unlock these pre-launch deals
            </p>
          </div>
          
          <div className="exclusive-offers-grid">
            <div className="exclusive-offer-card">
              <div className="offer-badge">Pre-Launch Special</div>
              <h3 className="offer-title">Lifetime Plan Discount</h3>
              <p className="offer-price">
                <span className="offer-price-original">$149</span>
                <span className="offer-price-current">$99</span>
              </p>
              <p className="offer-description">
                Secure lifetime access at a special pre-launch price. Save $50 off the regular price.
              </p>
              <ul className="offer-features">
                <li>✓ 500 credits included</li>
                <li>✓ Unlimited mock interviews</li>
                <li>✓ All premium features</li>
                <li>✓ Never pay monthly fees</li>
              </ul>
            </div>

            <div className="exclusive-offer-card">
              <div className="offer-badge">Beta Tester Program</div>
              <h3 className="offer-title">Founders' Tier Access</h3>
              <p className="offer-price">
                <span className="offer-price-current">Free</span>
              </p>
              <p className="offer-description">
                Join our beta testing program. Get early access, influence product development, and receive special perks.
              </p>
              <ul className="offer-features">
                <li>✓ Early access to new features</li>
                <li>✓ Direct input on product roadmap</li>
                <li>✓ Priority support</li>
                <li>✓ Special beta tester badge</li>
              </ul>
            </div>

            <div className="exclusive-offer-card">
              <div className="offer-badge">Limited Time</div>
              <h3 className="offer-title">Monthly Plan Discount</h3>
              <p className="offer-price">
                <span className="offer-price-original">$8.99</span>
                <span className="offer-price-current">$6.99</span>
                <span className="offer-price-period">/month</span>
              </p>
              <p className="offer-description">
                Lock in the pre-launch price for Unlimited plan.
              </p>
              <ul className="offer-features">
                <li>✓ Unlimited resumes</li>
                <li>✓ Unlimited ATS checks</li>
                <li>✓ All premium features</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
          </div>

          <div className="exclusive-offers-cta">
            {!showWaitlist ? (
              <button 
                className="cta-button primary exclusive-cta-button"
                onClick={() => {
                  setShowWaitlist(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Join Waitlist to Unlock These Offers
                <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <WaitlistForm onSuccess={() => setShowWaitlist(false)} />
            )}
            <p className="exclusive-offers-note">
              🔒 Pre-launch specials available to waitlist members. Join now to receive your invitation via email.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Land More Interviews?</h2>
          <p className="cta-subtitle">
            Join thousands of job seekers who are already optimizing their resumes with AI
          </p>
          <Link to="/pricing" className="cta-button secondary">
            View Pricing
          </Link>
        </div>
      </section>

      <Footer />

      {/* Subscription Required Modal */}
      {showSubscriptionModal && (
        <SubscriptionRequiredModal 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      )}
    </div>
  );
}

