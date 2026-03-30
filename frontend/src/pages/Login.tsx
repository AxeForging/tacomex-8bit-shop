import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { PixelButton } from '@/components';
import { useAuth } from '@/stores';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="auth">
      <div className="auth__container">
        {/* Decorative elements */}
        <div className="auth__decoration auth__decoration--1">🌮</div>
        <div className="auth__decoration auth__decoration--2">🌯</div>
        <div className="auth__decoration auth__decoration--3">🌶️</div>

        <div className="auth__card">
          {/* Header */}
          <div className="auth__header">
            <div className="auth__logo">
              <span className="auth__logo-icon">🎮</span>
              <h1 className="auth__title">Login</h1>
            </div>
            <p className="auth__subtitle">Welcome back, player!</p>
          </div>

          {/* Form */}
          <form className="auth__form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth__error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="auth__field">
              <label className="auth__label">
                <User size={14} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth__input"
                placeholder="player@tacomex.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">
                <Lock size={14} />
                Password
              </label>
              <div className="auth__password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth__input"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <PixelButton
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Press Start'}
            </PixelButton>
          </form>

          {/* Footer */}
          <div className="auth__footer">
            <p className="auth__footer-text">
              New player?{' '}
              <Link to="/register" className="auth__link">
                Create Account
              </Link>
            </p>
          </div>

          {/* Pixel decoration */}
          <div className="auth__pixel-line">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                style={{
                  backgroundColor:
                    i % 4 === 0
                      ? '#FF6B35'
                      : i % 4 === 1
                      ? '#FFD700'
                      : i % 4 === 2
                      ? '#00A86B'
                      : '#DC143C',
                }}
              />
            ))}
          </div>
        </div>

        {/* Demo credentials */}
        <div className="auth__demo">
          <p className="auth__demo-title">Demo Accounts:</p>
          <p className="auth__demo-text">
            Customer: customer@tacomex.com / pass123
          </p>
          <p className="auth__demo-text">
            Admin: admin@tacomex.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
