import React from 'react';
import './PixelCard.css';

interface PixelCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'dark';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const PixelCard: React.FC<PixelCardProps> = ({
  children,
  variant = 'default',
  hover = true,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`pixel-card-component pixel-card-component--${variant} ${hover ? 'pixel-card-component--hover' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default PixelCard;
