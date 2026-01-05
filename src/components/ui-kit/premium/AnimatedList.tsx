'use client';

import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEventHandler } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  isSelected?: boolean;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  delay = 0, 
  index, 
  isSelected,
  onMouseEnter, 
  onClick 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: false });
  
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.05 }}
      className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[#e05a4c] ring-offset-2' : ''}`}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onItemSelect?: (item: T, index: number) => void;
  showGradients?: boolean;
  className?: string;
  itemClassName?: string;
  gap?: string;
  initialSelectedIndex?: number;
}

function AnimatedList<T>({
  items,
  renderItem,
  onItemSelect,
  showGradients = true,
  className = '',
  itemClassName = '',
  gap = 'gap-3',
  initialSelectedIndex = -1
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    setBottomGradientOpacity(Math.min((scrollHeight - scrollTop - clientHeight) / 50, 1));
  }, []);

  const handleItemClick = useCallback(
    (item: T, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Top Gradient */}
      {showGradients && (
        <div
          className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"
          style={{ opacity: topGradientOpacity }}
        />
      )}

      {/* List Container */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className={`flex flex-col ${gap} overflow-y-auto scrollbar-hide`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            index={index}
            delay={index}
            isSelected={selectedIndex === index}
            onClick={() => handleItemClick(item, index)}
          >
            <div className={itemClassName}>
              {renderItem(item, index)}
            </div>
          </AnimatedItem>
        ))}
      </div>

      {/* Bottom Gradient */}
      {showGradients && (
        <div
          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"
          style={{ opacity: bottomGradientOpacity }}
        />
      )}
    </div>
  );
}

export default AnimatedList;
