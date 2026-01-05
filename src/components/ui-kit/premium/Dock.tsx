'use client';

import React from 'react';
import { motion, MotionValue, useMotionValue, useSpring, useTransform, AnimatePresence, SpringOptions } from 'framer-motion';
import { useRef, useState, useEffect, useMemo, Children, cloneElement, ReactElement } from 'react';

export type DockItemData = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  badge?: number;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  position?: 'bottom' | 'top';
  magnification?: number;
  baseItemSize?: number;
};

type DockItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  badge?: number;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  baseItemSize: number;
};

function DockItem({
  children,
  onClick,
  isActive,
  badge,
  mouseX,
  spring,
  magnification,
  baseItemSize
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const distance = 150;

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance, 
    [-distance, 0, distance], 
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.button
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-2xl transition-colors
        ${isActive 
          ? 'bg-gradient-to-br from-[#e05a4c] to-[#c94a3c] text-white shadow-lg shadow-[#e05a4c]/30' 
          : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white shadow-md border border-gray-100'
        }`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        {children}
      </div>

      {/* Badge */}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="dock-indicator"
          className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
        />
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-50"
          >
            {/* @ts-ignore */}
            {children?.props?.label || 'Menu'}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function Dock({
  items,
  className = '',
  position = 'bottom',
  magnification = 60,
  baseItemSize = 48
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const spring: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 };

  return (
    <motion.nav
      initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseMove={({ pageX }) => mouseX.set(pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`fixed ${position === 'bottom' ? 'bottom-4' : 'top-4'} left-1/2 -translate-x-1/2 
        flex items-center gap-2 p-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-gray-200/50 
        shadow-xl shadow-black/5 z-50 ${className}`}
    >
      {items.map((item, index) => (
        <DockItem
          key={index}
          onClick={item.onClick}
          isActive={item.isActive}
          badge={item.badge}
          mouseX={mouseX}
          spring={spring}
          magnification={magnification}
          baseItemSize={baseItemSize}
        >
          <DockIcon label={item.label}>{item.icon}</DockIcon>
        </DockItem>
      ))}
    </motion.nav>
  );
}

function DockIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="flex items-center justify-center" data-label={label}>{children}</div>;
}

// Also export DockIcon for use in parent
export { DockIcon };
