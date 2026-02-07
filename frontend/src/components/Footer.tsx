import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Heart } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Pixel divider */}
      <div className="footer__divider"></div>

      <div className="footer__container">
        {/* Logo and description */}
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-icon">🌮</span>
            <span className="footer__logo-text">
              <span className="footer__logo-taco">Taco</span>
              <span className="footer__logo-mex">Mex</span>
            </span>
          </div>
          <p className="footer__description">
            Authentic Mexican flavors delivered with 8-bit nostalgia!
            Level up your taste buds.
          </p>
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="Github">
              <Github size={18} />
            </a>
            <a href="#" className="footer__social-link" aria-label="Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" className="footer__social-link" aria-label="Instagram">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div className="footer__links">
          <h4 className="footer__links-title">Quick Links</h4>
          <ul className="footer__links-list">
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__contact">
          <h4 className="footer__contact-title">Contact</h4>
          <ul className="footer__contact-list">
            <li>
              <span className="footer__contact-label">Phone:</span>
              <span>(555) TACO-MEX</span>
            </li>
            <li>
              <span className="footer__contact-label">Email:</span>
              <span>hola@tacomex.8bit</span>
            </li>
            <li>
              <span className="footer__contact-label">Hours:</span>
              <span>11am - 10pm Daily</span>
            </li>
          </ul>
        </div>

        {/* Fun pixel art */}
        <div className="footer__pixel-art">
          <div className="footer__pixel-taco">
            <div className="footer__pixel-row">
              <span style={{background: '#228B22'}}></span>
              <span style={{background: '#228B22'}}></span>
              <span style={{background: '#FF6347'}}></span>
              <span style={{background: '#FFD700'}}></span>
              <span style={{background: '#FF6347'}}></span>
              <span style={{background: '#228B22'}}></span>
              <span style={{background: '#228B22'}}></span>
            </div>
            <div className="footer__pixel-row">
              <span style={{background: '#F4A460'}}></span>
              <span style={{background: '#8B4513'}}></span>
              <span style={{background: '#FFD700'}}></span>
              <span style={{background: '#8B4513'}}></span>
              <span style={{background: '#FFD700'}}></span>
              <span style={{background: '#8B4513'}}></span>
              <span style={{background: '#F4A460'}}></span>
            </div>
            <div className="footer__pixel-row">
              <span></span>
              <span style={{background: '#DEB887'}}></span>
              <span style={{background: '#DEB887'}}></span>
              <span style={{background: '#DEB887'}}></span>
              <span style={{background: '#DEB887'}}></span>
              <span style={{background: '#DEB887'}}></span>
              <span></span>
            </div>
          </div>
          <p className="footer__pixel-text">Insert Coin</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          {currentYear} TacoMex 8-Bit Shop. Made with <Heart size={12} className="footer__heart" /> and pixels.
        </p>
        <p className="footer__credit">
          Press START to order!
        </p>
      </div>
    </footer>
  );
};

export default Footer;
