'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, User, MessageSquare, CreditCard, Check } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, title: 'Bölge', icon: MapPin },
  { id: 2, title: 'Zaman', icon: Calendar },
  { id: 3, title: 'Alıcı', icon: User },
  { id: 4, title: 'Mesaj', icon: MessageSquare },
  { id: 5, title: 'Ödeme', icon: CreditCard },
];

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const currentStep = 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl 
              md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-3xl md:max-h-[85vh]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white px-5 pt-5 pb-4 border-b border-gray-100">
              {/* Handle bar for mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full md:hidden" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Step Progress */}
              <div className="flex items-center justify-between gap-1 mt-2">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1.1 : 1,
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isCompleted
                              ? 'bg-[#549658] shadow-md'
                              : isCurrent
                              ? 'bg-[#e05a4c] shadow-lg shadow-[#e05a4c]/30'
                              : 'bg-gray-100'
                          }`}
                        >
                          {isCompleted ? (
                            <Check size={18} className="text-white" />
                          ) : (
                            <StepIcon size={18} className={isCurrent ? 'text-white' : 'text-gray-400'} />
                          )}
                        </motion.div>
                        <span
                          className={`text-[10px] mt-1.5 font-medium ${
                            isCurrent
                              ? 'text-[#e05a4c]'
                              : isCompleted
                              ? 'text-[#549658]'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-gray-100 mx-1 mb-5 rounded-full overflow-hidden">
                          <motion.div
                            initial={false}
                            animate={{
                              width: currentStep > step.id ? '100%' : '0%',
                            }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-[#549658] rounded-full"
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(92vh-100px)] md:max-h-[calc(85vh-100px)] p-5">
              <div className="text-center py-12">
                <p className="text-gray-500">Sepet sayfasında devam edin</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
