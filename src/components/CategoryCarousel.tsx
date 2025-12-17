'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';

export default function CategoryCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section ref={containerRef} className="py-12 lg:py-16 bg-gradient-to-b from-white to-gray-50/50 overflow-hidden">
      <div className="container-custom overflow-hidden">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              Kategoriler
            </h2>
            <p className="text-gray-600 mt-1.5 text-sm lg:text-base">
              İstediğiniz çiçeği kolayca bulun
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button 
              className="category-prev p-2.5 rounded-full border-2 border-gray-200 hover:border-primary-500 
                hover:bg-primary-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-sm hover:shadow-md group"
            >
              <ChevronLeft size={20} className="text-gray-600 group-hover:text-primary-500 transition-colors" />
            </button>
            <button 
              className="category-next p-2.5 rounded-full border-2 border-gray-200 hover:border-primary-500 
                hover:bg-primary-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-sm hover:shadow-md group"
            >
              <ChevronRight size={20} className="text-gray-600 group-hover:text-primary-500 transition-colors" />
            </button>
          </div>
        </motion.div>

        {/* Categories Swiper */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Swiper
            modules={[FreeMode, Navigation]}
            slidesPerView="auto"
            spaceBetween={16}
            freeMode={{
              enabled: true,
              sticky: true,
            }}
            navigation={{
              prevEl: '.category-prev',
              nextEl: '.category-next',
            }}
            breakpoints={{
              640: { spaceBetween: 20 },
              1024: { spaceBetween: 24 },
            }}
            className="!overflow-hidden"
          >
            {categories.map((category, index) => (
              <SwiperSlide key={category.id} className="!w-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link 
                    href={`/${category.slug}`}
                    className="group flex flex-col items-center"
                  >
                    {/* Modern Category Card */}
                    <div className="relative mb-3 group-hover:scale-105 transition-all duration-300">
                      {/* Gradient Border */}
                      <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-primary-400 via-primary-300 
                        to-accent-300 opacity-75 group-hover:opacity-100 blur-sm group-hover:blur transition-all duration-300"></div>
                      
                      {/* Card Content */}
                      <div className="relative p-[3px] rounded-full bg-gradient-to-br from-primary-500 via-primary-400 to-accent-400">
                        <div className="p-1 bg-white rounded-full">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden 
                            bg-gradient-to-br from-gray-50 to-gray-100 ring-2 ring-white shadow-inner">
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                🌸
                              </div>
                            )}
                            {/* Overlay gradient on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Product Count Badge */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 
                        bg-gradient-to-r from-primary-500 to-primary-600 text-white text-[10px] font-bold 
                        rounded-full shadow-lg ring-2 ring-white group-hover:shadow-xl transition-all duration-300">
                        {category.productCount}+
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <span className="text-sm font-semibold text-gray-800 text-center group-hover:text-primary-500 
                      transition-colors duration-300 max-w-[100px] line-clamp-2 group-hover:scale-105">
                      {category.name}
                    </span>
                  </Link>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}
