'use client';

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepProps {
  children: ReactNode;
}

export function Step({ children }: StepProps) {
  return <>{children}</>;
}

interface StepperProps {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  showIndicators?: boolean;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  className?: string;
}

export default function Stepper({
  children,
  initialStep = 0,
  onStepChange,
  onComplete,
  showIndicators = true,
  backButtonText = 'Geri',
  nextButtonText = 'İleri',
  completeButtonText = 'Tamamla',
  className = ''
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  
  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      setDirection(1);
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
      onStepChange?.(step);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Step Indicators */}
      {showIndicators && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`relative flex items-center justify-center transition-all duration-300
                ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: index === currentStep ? 1.2 : 1,
                  backgroundColor: index <= currentStep ? '#e05a4c' : '#e5e7eb'
                }}
                className="w-3 h-3 rounded-full"
              />
              {index < totalSteps - 1 && (
                <div className="w-8 h-0.5 mx-1 bg-gray-200 relative overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-[#e05a4c] origin-left"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className="relative overflow-hidden min-h-[200px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all
            ${currentStep === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {backButtonText}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-[#e05a4c] to-[#c94a3c] 
            text-white shadow-lg shadow-[#e05a4c]/25 hover:shadow-[#e05a4c]/40 transition-all"
        >
          {isLastStep ? completeButtonText : nextButtonText}
        </motion.button>
      </div>
    </div>
  );
}
