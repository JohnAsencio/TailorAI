import { Link } from 'react-router-dom';
import Footer from '../common/Footer';
import './ProductsPage.css';

export default function ResumeTailorPage() {
  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-header">
          <div className="product-badge">
            <span className="product-badge-icon">✨</span>
            <span>Available Now</span>
          </div>
          <h1 className="products-title">Resume Tailor</h1>
          <p className="products-subtitle">
            Transform your resume into a job-matching powerhouse with AI-powered optimization. Our advanced system analyzes job descriptions and customizes your resume to highlight the most relevant skills, experiences, and keywords.
          </p>
        </div>

        <section className="product-section">
          <div className="product-content">
            <div className="product-info">
              {/* Additional Content - Not on Landing Page */}
              <div className="product-benefits">
                <h3 className="product-benefits-title">Why Resume Tailor Works</h3>
                <div className="product-benefits-grid">
                  <div className="product-benefit-item">
                    <h4>Industry-Specific Optimization</h4>
                    <p>Our AI understands industry-specific terminology and best practices. Whether you're in tech, finance, healthcare, or any other field, your resume will be optimized with the right language and keywords.</p>
                  </div>
                  <div className="product-benefit-item">
                    <h4>Smart Content Enhancement</h4>
                    <p>We don't just match keywords - we enhance your bullet points to be more impactful, quantify achievements, and highlight transferable skills that resonate with hiring managers.</p>
                  </div>
                  <div className="product-benefit-item">
                    <h4>Format Preservation</h4>
                    <p>Your resume maintains its professional formatting throughout the optimization process. No broken layouts or formatting issues - just perfectly optimized content.</p>
                  </div>
                </div>
              </div>

              <div className="product-features">
                <h3 className="product-features-title">Key Features</h3>
                <div className="product-features-grid">
                  <div className="product-feature-item">
                    <div className="product-feature-icon">🎯</div>
                    <div className="product-feature-content">
                      <h4>ATS Optimization</h4>
                      <p>Automatically matches keywords and phrases from job descriptions to ensure your resume passes applicant tracking systems with flying colors.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">⚡</div>
                    <div className="product-feature-content">
                      <h4>Lightning Fast Processing</h4>
                      <p>Get a perfectly tailored resume in seconds. No more spending hours manually tweaking your resume for each application.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">📊</div>
                    <div className="product-feature-content">
                      <h4>Real-Time Match Scoring</h4>
                      <p>See exactly how well your resume matches each job description with detailed compatibility scores and improvement suggestions.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">🔍</div>
                    <div className="product-feature-content">
                      <h4>Advanced ATS Analysis</h4>
                      <p>Compare your original and tailored resumes side-by-side with detailed keyword analysis, missing skills detection, and optimization recommendations.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">💾</div>
                    <div className="product-feature-content">
                      <h4>Save & Organize</h4>
                      <p>Save multiple tailored versions of your resume for different job applications. Keep track of all your customized resumes in one place.</p>
                    </div>
                  </div>
                  <div className="product-feature-item">
                    <div className="product-feature-icon">📄</div>
                    <div className="product-feature-content">
                      <h4>Professional PDF Export</h4>
                      <p>Download your optimized resume as a professional PDF, ready to submit to employers immediately. Maintains perfect formatting and layout.</p>
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
                      <h4>Upload Your Resume</h4>
                      <p>Upload your existing resume in PDF or Word format. Our system extracts and analyzes your content.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">2</div>
                    <div className="product-step-content">
                      <h4>Paste Job Description</h4>
                      <p>Copy and paste the job description you're applying for. Our AI analyzes the requirements and keywords.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">3</div>
                    <div className="product-step-content">
                      <h4>AI Optimization</h4>
                      <p>Our advanced AI customizes your resume to match the job description, optimizing keywords, skills, and experiences.</p>
                    </div>
                  </div>
                  <div className="product-step">
                    <div className="product-step-number">4</div>
                    <div className="product-step-content">
                      <h4>Review & Download</h4>
                      <p>Review the tailored resume with highlighted changes, check ATS compatibility, and download your optimized PDF.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-cta">
                <Link to="/signin" className="product-cta-button primary">
                  Start Tailoring Your Resume
                </Link>
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

