'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  text: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusStyles = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400'
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400'
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400'
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400'
  },
  pending: {
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-400',
    dot: 'bg-neutral-400'
  }
};

export default function StatusBadge({ status, text, pulse = false, size = 'md', className = '' }: StatusBadgeProps) {
  const styles = statusStyles[status];
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full ${styles.bg} ${styles.text} font-medium ${className}`}>
      <span className={`relative w-1.5 h-1.5 rounded-full ${styles.dot}`}>
        {pulse && (
          <span className={`absolute inset-0 rounded-full ${styles.dot} animate-ping opacity-75`} />
        )}
      </span>
      {text}
    </span>
  );
}
