import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ProductsDropdown.css';

export default function ProductsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isProductsPage = location.pathname.startsWith('/products');

  return (
    <div 
      className="products-dropdown"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to="/products" 
        className={`landing-nav-link ${isProductsPage ? "active" : ""}`}
      >
        Products
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

