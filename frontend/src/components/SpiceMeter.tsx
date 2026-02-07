import React from 'react';
import './SpiceMeter.css';

interface SpiceMeterProps {
  level: 0 | 1 | 2 | 3 | 4 | 5;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const spiceLabels = ['Mild', 'Light', 'Medium', 'Hot', 'Fire', 'Inferno'];

const SpiceMeter: React.FC<SpiceMeterProps> = ({
  level,
  size = 'md',
  showLabel = false,
}) => {
  return (
    <div className={`spice-meter spice-meter--${size}`}>
      <div className="spice-meter__chilies">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={`spice-meter__chili ${index < level ? 'spice-meter__chili--active' : ''}`}
            title={index < level ? 'Spicy!' : 'Not spicy'}
          >
            {/* Pixel art chili pepper */}
            <svg viewBox="0 0 16 24" className="spice-meter__chili-svg">
              {/* Stem */}
              <rect x="6" y="0" width="4" height="4" fill={index < level ? '#228B22' : '#4a4a5a'} />
              {/* Body */}
              <rect x="4" y="4" width="8" height="4" fill={index < level ? '#DC143C' : '#4a4a5a'} />
              <rect x="2" y="8" width="12" height="4" fill={index < level ? '#DC143C' : '#4a4a5a'} />
              <rect x="2" y="12" width="12" height="4" fill={index < level ? '#FF4500' : '#3a3a4a'} />
              <rect x="4" y="16" width="8" height="4" fill={index < level ? '#FF4500' : '#3a3a4a'} />
              <rect x="6" y="20" width="4" height="4" fill={index < level ? '#FF6347' : '#2a2a3a'} />
              {/* Highlight */}
              {index < level && (
                <rect x="4" y="6" width="2" height="6" fill="#FF6B6B" opacity="0.5" />
              )}
            </svg>
          </span>
        ))}
      </div>
      {showLabel && (
        <span className="spice-meter__label">{spiceLabels[level]}</span>
      )}
    </div>
  );
};

export default SpiceMeter;
