import { useState } from 'react';
import WaitlistForm from './WaitlistForm';
import './LandingPage.css';

export default function LandingPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>AI-Powered Resume Optimization</span>
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
          <div className="hero-cta">
            {!showWaitlist ? (
              <button 
                className="cta-button primary"
                onClick={() => setShowWaitlist(true)}
              >
                Join the Waitlist
                <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
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
            <div className="mock-visual-card">
              <div className="mock-card-header">
                <div className="mock-card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mock-card-title">AI Interview Simulator</div>
              </div>
              <div className="mock-card-content">
                <div className="mock-chat-bubble interviewer">
                  <p>"Tell me about a time you led a cross-functional team to deliver a project on time."</p>
                </div>
                <div className="mock-chat-bubble candidate">
                  <p>"In my previous role, I led a team of 8 engineers across 3 departments to deliver a major product launch..."</p>
                </div>
                <div className="mock-feedback">
                  <span className="feedback-icon">✨</span>
                  <span>Great example! Consider adding specific metrics.</span>
                </div>
              </div>
            </div>
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

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Land More Interviews?</h2>
          <p className="cta-subtitle">
            Join thousands of job seekers who are already optimizing their resumes with AI
          </p>
          {!showWaitlist && (
            <button 
              className="cta-button secondary"
              onClick={() => {
                setShowWaitlist(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Join the Waitlist
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

