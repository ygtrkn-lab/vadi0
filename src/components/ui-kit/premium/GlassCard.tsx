'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  borderColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  blur = 'md',
  opacity = 0.7,
  borderColor = 'rgba(255, 255, 255, 0.2)'
}) => {
  const blurValue = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden ${blurValue[blur]} ${className}`}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
