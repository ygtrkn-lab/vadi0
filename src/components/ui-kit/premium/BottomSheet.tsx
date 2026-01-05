'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
  fullHeight?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showHandle = true,
  fullHeight = false
}) => {
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] 
              ${fullHeight ? 'h-[90vh]' : 'max-h-[90vh]'} ${className}`}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <HiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: title ? 'calc(90vh - 80px)' : 'calc(90vh - 40px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
