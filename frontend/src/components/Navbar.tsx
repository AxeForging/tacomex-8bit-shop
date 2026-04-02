import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Package, LayoutDashboard, Mail, Bell } from 'lucide-react';
import { useAuth, useCart } from '@/stores';
import { useNotificationCount, useNotifications } from '@/hooks';
import { Notification } from '@/types';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { data: unreadCount = 0 } = useNotificationCount();
  const { data: notifData } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const recentNotifs = (notifData?.notifications || []).slice(0, 5);

  const formatNotifTime = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotifPreview = (n: Notification) => {
    if (n.channel === 'email') return n.subject || n.body.substring(0, 50);
    return n.body.substring(0, 50);
  };

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
            <>
              <Link
                to="/orders"
                className={`navbar__link ${isActive('/orders') ? 'navbar__link--active' : ''}`}
              >
                Orders
              </Link>
              <Link
                to="/messages"
                className={`navbar__link ${isActive('/messages') ? 'navbar__link--active' : ''}`}
              >
                Messages
              </Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Notification bell */}
          {isAuthenticated && (
            <div className="navbar__notif-wrapper">
              <button
                className="navbar__notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="View messages"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="navbar__notif-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="navbar__notif-dropdown">
                  <div className="navbar__notif-dropdown-header">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="navbar__notif-dropdown-badge">{unreadCount} new</span>
                    )}
                  </div>

                  {recentNotifs.length === 0 ? (
                    <div className="navbar__notif-empty">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="navbar__notif-list">
                      {recentNotifs.map((n) => (
                        <button
                          key={n.id}
                          className={`navbar__notif-item ${!n.isRead ? 'navbar__notif-item--unread' : ''}`}
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(`/messages?tab=${n.channel}&id=${n.id}`);
                          }}
                        >
                          <span className="navbar__notif-item-icon">
                            {n.channel === 'email' ? '📧' : '📱'}
                          </span>
                          <div className="navbar__notif-item-content">
                            <span className="navbar__notif-item-text">
                              {getNotifPreview(n)}
                            </span>
                            <span className="navbar__notif-item-time">
                              {formatNotifTime(n.createdAt)}
                            </span>
                          </div>
                          {!n.isRead && <span className="navbar__notif-item-dot" />}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className="navbar__notif-view-all"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/messages');
                    }}
                  >
                    View All Messages
                  </button>
                </div>
              )}
            </div>
          )}

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

                  <Link
                    to="/messages"
                    className="navbar__dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Mail size={16} />
                    Messages
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
              <Link
                to="/messages"
                className="navbar__mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Messages
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
