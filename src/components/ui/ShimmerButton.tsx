'use client';

import React, { ReactNode } from 'react';

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function ShimmerButton({
  children,
  className = '',
  disabled = false,
  onClick,
  style
}: ShimmerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
        style={{
          animationDuration: '1.8s'
        }}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </button>
  );
}
