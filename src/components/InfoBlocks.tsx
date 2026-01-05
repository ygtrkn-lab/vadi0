'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Truck, Shield, CreditCard, Gift } from 'lucide-react';
import { infoBlocks } from '@/data/products';

const iconMap: Record<string, React.ReactNode> = {
  truck: <Truck className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
  creditCard: <CreditCard className="w-8 h-8" />,
  gift: <Gift className="w-8 h-8" />,
};

export default function InfoBlocks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-12 lg:py-16 bg-gray-50">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {infoBlocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-soft 
                hover:shadow-soft-lg transition-all duration-300 text-center"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 
                bg-primary-50 text-primary-500 rounded-2xl mb-4 
                group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                {iconMap[block.icon]}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-800 text-base lg:text-lg mb-2">
                {block.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500">
                {block.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
