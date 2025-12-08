import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Tailor AI</h3>
            <p className="footer-description">
              AI-powered tools to help you land your dream job.
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-links">
              <Link to="/products" className="footer-link">Products</Link>
              <Link to="/pricing" className="footer-link">Pricing</Link>
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Contact</h4>
            <a href="mailto:johnaasencio@gmail.com" className="footer-contact-button">
              <svg className="footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              johnaasencio@gmail.com
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Tailor AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

