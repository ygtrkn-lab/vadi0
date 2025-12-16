'use client';

import { motion } from 'framer-motion';

interface MarqueeProps {
  text?: string;
  speed?: 'slow' | 'normal' | 'fast';
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function Marquee({ 
  text = "%70'e Varan İndirim  ★  Taze Çiçekler  ★  Hızlı Teslimat  ★  Ücretsiz Kargo  ★  Güvenli Alışveriş  ★", 
  speed = 'normal',
  variant = 'primary' 
}: MarqueeProps) {
  
  const speedClass = {
    slow: 'animate-marquee-slow',
    normal: 'animate-marquee',
    fast: 'animate-marquee'
  };

  const variantStyles = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white',
    accent: 'bg-accent-400 text-dark-900'
  };

  // Duplicate text for seamless loop
  const repeatedText = Array(4).fill(text).join('  ');

  return (
    <div className={`overflow-hidden py-3 lg:py-4 ${variantStyles[variant]}`}>
      <div className="flex whitespace-nowrap">
        <motion.div 
          className={`flex ${speedClass[speed]}`}
          style={{ willChange: 'transform' }}
        >
          <span className="inline-flex items-center text-sm lg:text-base font-medium tracking-wide">
            {repeatedText}
          </span>
          <span className="inline-flex items-center text-sm lg:text-base font-medium tracking-wide">
            {repeatedText}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
