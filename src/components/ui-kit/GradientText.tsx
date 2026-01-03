'use client';

import React, { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = '',
  colors = ['#a855f7', '#ec4899', '#a855f7'],
  animationSpeed = 5,
  showBorder = false
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center font-medium transition-shadow duration-500 overflow-hidden ${className}`}
    >
      {showBorder && (
        <span
          className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient rounded-xl"
          style={{
            ...gradientStyle,
            backgroundSize: '300% 100%'
          }}
        >
          <span
            className="absolute inset-0 bg-black rounded-xl z-[-1]"
            style={{
              width: 'calc(100% - 2px)',
              height: 'calc(100% - 2px)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </span>
      )}
      <span
        className="inline-block relative z-2 text-transparent bg-cover animate-gradient"
        style={{
          ...gradientStyle,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          backgroundSize: '300% 100%'
        }}
      >
        {children}
      </span>
    </span>
  );
}
