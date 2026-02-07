import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useAuth, useCart } from '../stores';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🌮</span>
          <span className="navbar__logo-text">
            <span className="navbar__logo-taco">Taco</span>
            <span className="navbar__logo-mex">Mex</span>
          </span>
          <span className="navbar__logo-8bit">8-BIT</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar__nav">
          <Link
            to="/"
            className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/menu"
            className={`navbar__link ${isActive('/menu') ? 'navbar__link--active' : ''}`}
          >
            Menu
          </Link>
          {isAuthenticated && (
            <Link
              to="/orders"
              className={`navbar__link ${isActive('/orders') ? 'navbar__link--active' : ''}`}
            >
              Orders
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Cart button */}
          <button
            className="navbar__cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="navbar__cart-count">{itemCount}</span>
            )}
          </button>

          {/* User menu */}
          {isAuthenticated ? (
            <div className="navbar__user-menu">
              <button
                className="navbar__user-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <User size={20} />
                <span className="navbar__user-name">{user?.name.split(' ')[0]}</span>
              </button>

              {userMenuOpen && (
                <div className="navbar__dropdown">
                  <div className="navbar__dropdown-header">
                    <span className="navbar__dropdown-greeting">Hola!</span>
                    <span className="navbar__dropdown-name">{user?.name}</span>
                  </div>

                  <Link
                    to="/orders"
                    className="navbar__dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Package size={16} />
                    My Orders
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="navbar__dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar__login-btn">
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          <Link
            to="/"
            className="navbar__mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/menu"
            className="navbar__mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Menu
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/orders"
                className="navbar__mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="navbar__mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                className="navbar__mobile-link navbar__mobile-link--logout"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            </>
          )}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="navbar__mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
