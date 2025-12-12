import { Link } from 'react-router-dom';
import Footer from '../common/Footer';
import './ProductsPage.css';

export default function ProductsPage() {
  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <h1 className="products-title">Why Tailor AI Exists</h1>
          <p className="products-subtitle">
            A story from a CS grad student navigating the job market
          </p>
        </div>

        {/* Story Section */}
        <div className="about-story-section">
          <div className="about-story-content">
            <p className="about-story-text">
              The job market is challenging. Every job application today means competing against an automated Applicant Tracking System (ATS) before you even get to a human recruiter.
            </p>
            <p className="about-story-text">
              As a CS grad student, I got frustrated spending hours manually rewriting my resume for each job description, only to be rejected by an ATS for missing a single keyword. I also found myself spending double the amount of time practicing for interviews, when using platforms like Exponent where you take turns.
            </p>
            <p className="about-story-text">
              That's why I built Tailor AI. Remove the manual work and give job seekers the tools they need to land their dream job faster. No more hours tweaking resumes. No more practicing interviews alone. Just AI-powered tools that actually help you out.
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section-header">
          <h2 className="products-section-title">Our Solutions</h2>
          <p className="products-section-subtitle">
            Powerful AI tools designed to help you land your dream job
          </p>
        </div>

        <div className="products-grid">
          {/* Resume Tailor Card */}
          <Link to="/products/resume-tailor" className="product-card-link">
            <div className="product-card">
              <div className="product-card-badge">
                <span>Available Now</span>
              </div>
              <h2 className="product-card-title">Resume Tailor</h2>
              <p className="product-card-description">
                Transform your resume into a job-matching powerhouse with AI-powered optimization. Customize your resume for each job application in seconds.
              </p>
              <div className="product-card-features">
                <div className="product-card-feature">ATS Optimization</div>
                <div className="product-card-feature">Lightning Fast</div>
                <div className="product-card-feature">Match Scoring</div>
              </div>
              <div className="product-card-cta">
                Learn More →
              </div>
            </div>
          </Link>

          {/* Mock Interviews Card */}
          <Link to="/products/mock-interviews" className="product-card-link">
            <div className="product-card">
              <div className="product-card-badge product-badge-coming-soon">
                <span>Coming Soon</span>
              </div>
              <h2 className="product-card-title">AI Mock Interviews</h2>
              <p className="product-card-description">
                Prepare for your interviews with confidence. Practice with role-specific questions and receive instant feedback from our AI interviewer.
              </p>
              <div className="product-card-features">
                <div className="product-card-feature">Role-Specific Questions</div>
                <div className="product-card-feature">Interactive Conversations</div>
                <div className="product-card-feature">Instant Feedback</div>
              </div>
              <div className="product-card-cta">
                Learn More →
              </div>
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
