import { Link } from 'react-router-dom';
import MockInterviewChat from '../landing/MockInterviewChat';
import Footer from '../common/Footer';
import './ProductsPage.css';

export default function MockInterviewsPage() {
  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <div className="product-badge product-badge-coming-soon">
            <span className="product-badge-icon">🎤</span>
            <span>Coming Soon</span>
          </div>
          <h1 className="products-title">AI Mock Interviews</h1>
          <p className="products-subtitle">
            Prepare for your interviews with confidence using our AI-powered mock interview system. Practice with role-specific questions, receive instant feedback, and refine your answers until you're interview-ready.
          </p>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-info">
              {/* Interview Simulator Section */}
              <div className="product-simulator-section">
                <h3 className="product-simulator-title">Try the Interview Simulator</h3>
                <p className="product-simulator-description">
                  Experience what our AI mock interview system will be like. The simulator adapts to your responses and provides realistic interview scenarios.
                </p>
                <div className="product-simulator-demo">
                  <MockInterviewChat />
                </div>
              </div>

              {/* Additional Content - Not on Landing Page */}
              <div className="product-benefits">
                <h3 className="product-benefits-title">Why Practice with AI?</h3>
                <div className="product-benefits-grid">
                  <div className="product-benefit-item">
                    <h4>No Judgment Zone</h4>
                    <p>Practice in a safe, stress-free environment where you can make mistakes and learn without the pressure of a real interview. Build confidence at your own pace.</p>
                  </div>
                  <div className="product-benefit-item">
                    <h4>Adaptive Questioning</h4>
                    <p>Our AI asks follow-up questions based on your answers, just like a real interviewer. Experience the natural flow of conversation and learn to think on your feet.</p>
                  </div>
                  <div className="product-benefit-item">
                    <h4>Comprehensive Analysis</h4>
                    <p>Get detailed breakdowns of your performance including pacing, clarity, relevance, and areas for improvement. Track your progress over multiple sessions.</p>
                  </div>
                </div>
              </div>

              <div className="product-features">
                <h3 className="product-features-title">Key Features</h3>
                <div className="product-features-grid">
                  <div className="product-feature-item">
                    <div className="product-feature-icon">🎯</div>
                    <div className="product-feature-content">
                      <h4>Role-Specific Questions</h4>
                      <p>Practice with questions specifically tailored to the job description and role you're applying for. No generic questions - everything is customized to your target position.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">💬</div>
                    <div className="product-feature-content">
                      <h4>Interactive Conversations</h4>
                      <p>Engage in realistic back-and-forth dialogue with our AI interviewer. Experience natural conversation flow just like a real interview.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">📝</div>
                    <div className="product-feature-content">
                      <h4>Instant Feedback</h4>
                      <p>Get detailed feedback on your answers, delivery, and overall performance. Learn what works and what needs improvement.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">🔄</div>
                    <div className="product-feature-content">
                      <h4>Unlimited Practice</h4>
                      <p>Practice as many times as you need. Each session helps you build confidence and refine your interview skills.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">📊</div>
                    <div className="product-feature-content">
                      <h4>Performance Analytics</h4>
                      <p>Track your progress over time with detailed analytics. See how your interview skills improve with each practice session.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">🎓</div>
                    <div className="product-feature-content">
                      <h4>Learning Resources</h4>
                      <p>Access tips, best practices, and example answers to help you prepare. Learn from industry experts and successful candidates.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-how-it-works">
                <h3 className="product-how-title">How It Works</h3>
                <div className="product-steps">
                  <div className="product-step">
                    <div className="product-step-number">1</div>
                    <div className="product-step-content">
                      <h4>Select Your Role</h4>
                      <p>Choose the job title and company you're interviewing for. Our AI prepares questions specific to that role.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">2</div>
                    <div className="product-step-content">
                      <h4>Start the Interview</h4>
                      <p>Begin your mock interview session. The AI interviewer will ask questions based on the job requirements and your background.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">3</div>
                    <div className="product-step-content">
                      <h4>Answer & Practice</h4>
                      <p>Respond to questions naturally. The AI will ask follow-up questions and probe deeper, just like a real interviewer would.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">4</div>
                    <div className="product-step-content">
                      <h4>Get Feedback</h4>
                      <p>Receive comprehensive feedback on your performance, including strengths, areas for improvement, and actionable tips.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-cta">
                <button className="product-cta-button primary" disabled>
                  Coming Soon
                </button>
                <Link to="/pricing" className="product-cta-button secondary">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

