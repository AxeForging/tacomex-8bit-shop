import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PixelButton } from '@/components';
import { useAuth } from '@/stores';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      // Invalidate notifications so the bell shows the welcome SMS
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }), 2000);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth">
      <div className="auth__container">
        {/* Decorative elements */}
        <div className="auth__decoration auth__decoration--1">🌮</div>
        <div className="auth__decoration auth__decoration--2">🎮</div>
        <div className="auth__decoration auth__decoration--3">⭐</div>

        <div className="auth__card auth__card--register">
          {/* Header */}
          <div className="auth__header">
            <div className="auth__logo">
              <span className="auth__logo-icon">🕹️</span>
              <h1 className="auth__title">Register</h1>
            </div>
            <p className="auth__subtitle">Create your account!</p>
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
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="auth__input"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">
                <Mail size={14} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="auth__input"
                placeholder="player@tacomex.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">
                <Phone size={14} />
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="auth__input"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>

            <div className="auth__field">
              <label className="auth__label">
                <Lock size={14} />
                Password *
              </label>
              <div className="auth__password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth__input"
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
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

            <div className="auth__field">
              <label className="auth__label">
                <Lock size={14} />
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth__input"
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />
            </div>

            <PixelButton
              type="submit"
              variant="accent"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </PixelButton>
          </form>

          {/* Footer */}
          <div className="auth__footer">
            <p className="auth__footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth__link">
                Login
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
      </div>
    </div>
  );
};

export default Register;
