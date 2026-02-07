import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
}) => {
  const spinner = (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="loading-spinner__taco">
        {/* Animated pixel taco */}
        <div className="loading-spinner__taco-shell">
          <div className="loading-spinner__taco-filling"></div>
        </div>
      </div>
      {text && <p className="loading-spinner__text">{text}</p>}
      <div className="loading-spinner__dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner__overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
