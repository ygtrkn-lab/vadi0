'use client';

import React, { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}

export default function GradientText({
  children,
  className = '',
  colors = ['#fff', '#a855f7', '#fff'],
  animationSpeed = 4
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`
  };

  return (
    <span
      className={`inline-block text-transparent bg-clip-text animate-gradient ${className}`}
      style={{
        ...gradientStyle,
        backgroundSize: '200% 100%'
      }}
    >
      {children}
    </span>
  );
}
