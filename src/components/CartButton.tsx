'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartButton() {
  const { state, toggleCart, removeFromCart, getTotalItems, getTotalPrice } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const itemCount = getTotalItems();

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cart Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleCart}
        className="relative p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        
        {/* Badge */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Preview */}
      <AnimatePresence>
        {isHovered && itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sepetim ({itemCount} ürün)
              </h3>
            </div>

            {/* Items */}
            <div className="max-h-64 overflow-y-auto">
              {state.items.slice(0, 3).map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} adet
                    </p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {(item.product.price * item.quantity).toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.product.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {state.items.length > 3 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                  +{state.items.length - 3} ürün daha
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 dark:text-gray-400">Toplam</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {getTotalPrice().toLocaleString('tr-TR')} TL
                </span>
              </div>
              <Link
                href="/sepet"
                className="block w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center font-semibold rounded-xl hover:shadow-lg transition-shadow"
              >
                Sepete Git
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
