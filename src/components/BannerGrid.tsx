'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { banners } from '@/data/products';

export default function BannerGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className="py-8 lg:py-12 bg-gray-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link 
                href={banner.link}
                className="group block relative overflow-hidden rounded-2xl lg:rounded-3xl 
                  aspect-[16/9] md:aspect-[16/10] shadow-soft hover:shadow-soft-lg transition-all duration-500"
              >
                {/* Banner Image */}
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent 
                  opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute inset-0 p-4 lg:p-6 flex flex-col justify-end">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  >
                    <h3 className="text-white font-bold text-lg lg:text-xl mb-2 
                      group-hover:text-primary-200 transition-colors">
                      {banner.alt}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium 
                      group-hover:text-white transition-colors">
                      <span>Keşfet</span>
                      <ArrowRight size={16} className="transform group-hover:translate-x-2 
                        transition-transform duration-300" />
                    </div>
                  </motion.div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-white/0 rounded-2xl lg:rounded-3xl 
                  group-hover:border-white/30 transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
