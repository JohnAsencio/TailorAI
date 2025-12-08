import { Link } from 'react-router-dom';
import Footer from '../common/Footer';
import './ProductsPage.css';

export default function ProductsPage() {
  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <h1 className="products-title">Our Products</h1>
          <p className="products-subtitle">
            Powerful AI tools designed to help you land your dream job. From resume optimization to interview preparation, we've got you covered.
          </p>
        </div>

        <div className="products-grid">
          {/* Resume Tailor Card */}
          <Link to="/products/resume-tailor" className="product-card-link">
            <div className="product-card">
              <div className="product-card-badge">
                <span className="product-badge-icon">✨</span>
                <span>Available Now</span>
              </div>
              <h2 className="product-card-title">Resume Tailor</h2>
              <p className="product-card-description">
                Transform your resume into a job-matching powerhouse with AI-powered optimization. Customize your resume for each job application in seconds.
              </p>
              <div className="product-card-features">
                <div className="product-card-feature">🎯 ATS Optimization</div>
                <div className="product-card-feature">⚡ Lightning Fast</div>
                <div className="product-card-feature">📊 Match Scoring</div>
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
                <span className="product-badge-icon">🎤</span>
                <span>Coming Soon</span>
              </div>
              <h2 className="product-card-title">AI Mock Interviews</h2>
              <p className="product-card-description">
                Prepare for your interviews with confidence. Practice with role-specific questions and receive instant feedback from our AI interviewer.
              </p>
              <div className="product-card-features">
                <div className="product-card-feature">🎯 Role-Specific Questions</div>
                <div className="product-card-feature">💬 Interactive Conversations</div>
                <div className="product-card-feature">📝 Instant Feedback</div>
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
