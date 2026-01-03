'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerButtonProps {
  children: React.ReactNode;
  shimmerDuration?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  shimmerDuration = '2s',
  className = '',
  onClick,
  disabled,
  type = 'button'
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`relative overflow-hidden px-6 py-3 rounded-xl font-medium
        bg-gradient-to-r from-[#e05a4c] to-[#c94a3c] text-white
        shadow-lg shadow-[#e05a4c]/25 hover:shadow-[#e05a4c]/40
        transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Shimmer Effect */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
          animation: `shimmer ${shimmerDuration} infinite`
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.button>
  );
};

export default ShimmerButton;
