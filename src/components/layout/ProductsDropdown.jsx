import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ProductsDropdown.css';

export default function ProductsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isProductsPage = location.pathname.startsWith('/products') || location.pathname === '/about';
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle hover with delay to prevent premature closing
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add small delay before closing to allow moving to dropdown items
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150ms delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className="products-dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link 
        to="/about" 
        className={`landing-nav-link ${isProductsPage ? "active" : ""}`}
      >
        About
      </Link>
      {isOpen && (
        <div className="products-dropdown-menu">
          <Link 
            to="/products/resume-tailor" 
            className="products-dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="dropdown-item-icon">✨</span>
            <div className="dropdown-item-content">
              <div className="dropdown-item-title">Resume Tailor</div>
              <div className="dropdown-item-desc">AI-powered resume optimization</div>
            </div>
          </Link>
          <Link 
            to="/products/mock-interviews" 
            className="products-dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <span className="dropdown-item-icon">🎤</span>
            <div className="dropdown-item-content">
              <div className="dropdown-item-title">Mock Interviews</div>
              <div className="dropdown-item-desc">AI interview practice</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

