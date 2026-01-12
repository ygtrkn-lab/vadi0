'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LogoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PreloaderProps {
  isLoading: boolean;
  targetPosition: LogoPosition | null;
  onLogoArrived: () => void;
}

export default function Preloader({ isLoading, targetPosition, onLogoArrived }: PreloaderProps) {
  const [phase, setPhase] = useState<'loading' | 'moving' | 'complete'>('loading');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Get window size
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && phase === 'loading') {
      // Start moving phase
      setPhase('moving');
    }
  }, [isLoading, phase]);

  // Calculate movement from center to target
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;
  
  // Logo dimensions in preloader - same as header logo
  const preloaderLogoWidth = 150;
  const preloaderLogoHeight = 50;
  
  // Target position (header logo)
  const targetX = targetPosition?.x || centerX;
  const targetY = targetPosition?.y || 80;
  
  // Calculate translation needed
  const translateX = targetX - centerX;
  const translateY = targetY - centerY;

  const handleMoveComplete = () => {
    if (phase === 'moving') {
      setPhase('complete');
      onLogoArrived();
    }
  };

  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div
          key="preloader-bg"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'moving' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: phase === 'moving' ? 0.4 : 0 }}
          className="fixed inset-0 z-[100] bg-white"
          style={{ pointerEvents: phase === 'moving' ? 'none' : 'auto' }}
        >
        </motion.div>
      )}

      {/* Logo - separate from background for smooth animation */}
      {phase !== 'complete' && (
        <motion.div
          key="preloader-logo"
          className="fixed z-[101] pointer-events-none"
          style={{
            left: centerX,
            top: centerY,
            x: '-50%',
            y: '-50%',
          }}
          initial={{ 
            scale: 0.8, 
            opacity: 0,
            translateX: 0,
            translateY: 0,
          }}
          animate={phase === 'loading' ? { 
            scale: 1,
            opacity: 1,
            translateX: 0,
            translateY: 0,
          } : {
            scale: 1,
            opacity: 1,
            translateX: translateX,
            translateY: translateY,
          }}
          transition={{ 
            duration: phase === 'loading' ? 0.6 : 0.7,
            ease: phase === 'loading' ? [0.25, 0.1, 0.25, 1] : [0.4, 0, 0.2, 1],
          }}
          onAnimationComplete={handleMoveComplete}
        >
          {/* Floating animation wrapper - only during loading */}
          <motion.div
            animate={phase === 'loading' ? { 
              y: [0, -10, 0],
            } : { y: 0 }}
            transition={{ 
              duration: 2,
              repeat: phase === 'loading' ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/logo.webp"
              alt="Vadiler Çiçek"
              width={preloaderLogoWidth}
              height={preloaderLogoHeight}
              className="object-contain"
              priority
            />
          </motion.div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}
