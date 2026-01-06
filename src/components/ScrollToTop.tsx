'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px on mobile, 400px on desktop
      const threshold = window.innerWidth < 768 ? 300 : 400;
      
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Calculate scroll progress
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const progress = (scrollTop / trackLength) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Check on mount

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          onClick={scrollToTop}
          className={`fixed z-[14999] group ${isMobile ? 'right-4' : 'bottom-6 right-6'}`}
          style={{
            ...(isMobile && {
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px + var(--mobile-bottom-nav-offset, 0px))',
            }),
            ...(!isMobile && {
              bottom: '80px',
            }),
          }}
          aria-label="Yukarı Çık"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
          
          {/* Button container with circular progress */}
          <div className="relative">
            {/* Circular progress ring */}
            <svg
              className={`absolute inset-0 -rotate-90 ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}
              viewBox="0 0 56 56"
            >
              {/* Background circle */}
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="rgba(224, 90, 76, 0.1)"
                strokeWidth="2"
              />
              {/* Progress circle */}
              <motion.circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: scrollProgress / 100 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  strokeDasharray: '163.36',
                  strokeDashoffset: 163.36 * (1 - scrollProgress / 100),
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e05a4c" />
                  <stop offset="100%" stopColor="#d43a2a" />
                </linearGradient>
              </defs>
            </svg>

            {/* Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-2xl bg-white shadow-lg flex items-center justify-center 
                border border-gray-100 group-hover:border-primary-200 transition-all duration-300 ${
                  isMobile ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'
                }`}
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <ChevronUp 
                  size={isMobile ? 20 : 24} 
                  className="text-gray-700 group-hover:text-primary-600 transition-colors" 
                />
              </motion.div>

              {/* Shine effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          </div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 
              bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap
              pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Yukarı Çık
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 
              w-2 h-2 bg-gray-900" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
