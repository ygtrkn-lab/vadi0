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
    <section ref={containerRef} className="py-12 lg:py-16 bg-white overflow-hidden">
      <div className="container-custom overflow-hidden">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Kategoriler</h2>
            <p className="text-gray-500 mt-1">İstediğiniz çiçeği kolayca bulun</p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button 
              className="category-prev p-2 rounded-full border border-gray-200 hover:border-primary-500 
                hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button 
              className="category-next p-2 rounded-full border border-gray-200 hover:border-primary-500 
                hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} className="text-gray-600" />
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
                    {/* Instagram Story Style Circle */}
                    <div className="relative p-1 rounded-full bg-gradient-to-tr from-primary-500 via-primary-400 
                      to-accent-400 mb-3 group-hover:scale-105 transition-transform duration-300">
                      <div className="p-0.5 bg-white rounded-full">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden 
                          bg-gray-100">
                          {category.image ? (
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                              🌸
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Product Count Badge */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 
                        bg-primary-500 text-white text-[10px] font-semibold rounded-full shadow-md">
                        {category.productCount}+
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <span className="text-sm font-medium text-gray-700 text-center group-hover:text-primary-500 
                      transition-colors max-w-[100px] line-clamp-2">
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
