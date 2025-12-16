'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  color?: string;
  className?: string;
}

const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 150,
  duration = 8,
  delay = 0,
  color = '#e05a4c',
  className = ''
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none ${className}`}>
      <motion.div
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          position: 'absolute',
          filter: 'blur(8px)'
        }}
      />
    </div>
  );
};

export default BorderBeam;
