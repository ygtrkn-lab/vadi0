'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  color?: string;
  className?: string;
}

const Ripple: React.FC<RippleProps> = ({
  mainCircleSize = 200,
  mainCircleOpacity = 0.24,
  numCircles = 6,
  color = '#e05a4c',
  className = ''
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: numCircles }).map((_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = mainCircleOpacity - i * 0.03;
        const delay = i * 0.5;

        return (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.1, 0.8], 
              opacity: [opacity * 0.5, opacity, opacity * 0.5] 
            }}
            transition={{
              duration: 4,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              border: `1px solid ${color}`,
              opacity: Math.max(0, opacity),
              backgroundColor: `${color}05`
            }}
          />
        );
      })}
    </div>
  );
};

export default Ripple;
