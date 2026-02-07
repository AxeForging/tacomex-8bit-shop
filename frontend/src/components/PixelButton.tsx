import React from 'react';
import './PixelButton.css';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`pixel-button pixel-button--${variant} pixel-button--${size} ${fullWidth ? 'pixel-button--full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="pixel-button__loading">
          <span className="pixel-button__loading-dot"></span>
          <span className="pixel-button__loading-dot"></span>
          <span className="pixel-button__loading-dot"></span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default PixelButton;
