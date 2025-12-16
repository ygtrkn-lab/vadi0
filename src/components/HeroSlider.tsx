'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, EffectCreative, EffectFade } from 'swiper/modules';
import { ArrowRight, ArrowLeft, Play, Pause, Flower2, Leaf, Percent, ChevronRight } from 'lucide-react';
import { slides } from '@/data/products';

import 'swiper/css';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-fade';

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);

  const handlePrev = useCallback(() => {
    swiperRef.current?.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const toggleAutoplay = useCallback(() => {
    if (swiperRef.current) {
      if (isPlaying) {
        swiperRef.current.autoplay.stop();
      } else {
        swiperRef.current.autoplay.start();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const goToSlide = useCallback((index: number) => {
    swiperRef.current?.slideTo(index);
  }, []);

  return (
    <section className="relative min-h-[100svh] lg:min-h-screen lg:max-h-[900px] overflow-hidden">
      {/* Desktop Background */}
      <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 z-0" />
      
      {/* Desktop Animated Circles */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="hidden lg:block absolute -top-20 -right-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50"
      />
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="hidden lg:block absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary-100 rounded-full blur-3xl opacity-40"
      />

      <Swiper
        modules={[Autoplay, EffectCreative, EffectFade]}
        effect="fade"
        speed={800}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop
        className="h-full min-h-[100svh] lg:min-h-screen lg:max-h-[900px]"
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative min-h-[100svh] lg:min-h-screen lg:max-h-[900px] lg:h-screen flex items-center">
              {/* Mobile Background Image */}
              <div className="absolute inset-0 lg:hidden">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
              </div>

              <div className="container-custom relative z-10 pt-28 pb-32 lg:pt-32 lg:pb-20">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-center lg:text-left"
                  >
                    {/* Badge - Mobile */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={activeIndex === index ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white/90 
                        backdrop-blur-sm rounded-full text-sm font-medium text-primary-600 mb-6 shadow-sm"
                    >
                      <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      {slide.subtitle}
                    </motion.div>

                    {/* Badge - Desktop */}
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="hidden lg:inline-block px-4 py-2 bg-primary-100 text-primary-600 rounded-full 
                        text-sm font-medium mb-4"
                    >
                      {slide.subtitle}
                    </motion.span>

                    {/* Title */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1]
                        text-white lg:text-gray-900"
                    >
                      <span className="lg:text-gradient">{slide.title.split(' ')[0]}</span>{' '}
                      {slide.title.split(' ').slice(1).join(' ')}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-base sm:text-lg text-white/90 lg:text-gray-600 mb-8 max-w-md 
                        mx-auto lg:mx-0 leading-relaxed"
                    >
                      {slide.description}
                    </motion.p>

                    {/* CTA Buttons - Mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:hidden"
                    >
                      <Link
                        href={slide.buttonLink}
                        className="w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 
                          text-white font-semibold rounded-2xl flex items-center justify-center gap-3 
                          transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30 group"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href="/kategoriler"
                        className="w-full sm:w-auto px-8 py-4 bg-white/20 backdrop-blur-sm
                          hover:bg-white/30 text-white font-medium 
                          rounded-2xl flex items-center justify-center gap-2 transition-all duration-300"
                      >
                        Kategorileri Keşfet
                      </Link>
                    </motion.div>

                    {/* CTA Buttons - Desktop */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="hidden lg:flex flex-row items-center gap-4 justify-start"
                    >
                      <Link
                        href={slide.buttonLink}
                        className="btn-primary px-8 py-4 rounded-full text-white font-semibold 
                          flex items-center gap-2 group"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href="/kategoriler"
                        className="flex items-center gap-2 text-gray-600 hover:text-primary-500 
                          transition-colors font-medium"
                      >
                        <span>Tüm Kategoriler</span>
                        <ChevronRight size={18} />
                      </Link>
                    </motion.div>

                    {/* Stats - Desktop Only */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="hidden lg:flex items-center justify-start gap-8 mt-12"
                    >
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">500+</p>
                        <p className="text-sm text-gray-500">Çiçek Çeşidi</p>
                      </div>
                      <div className="w-px h-12 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">50K+</p>
                        <p className="text-sm text-gray-500">Mutlu Müşteri</p>
                      </div>
                      <div className="w-px h-12 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">4.9</p>
                        <p className="text-sm text-gray-500">Puan</p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Desktop Image - Circular Design */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={activeIndex === index ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative h-[400px] lg:h-[600px] hidden lg:block"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Decorative Ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[90%] h-[90%] border-2 border-dashed border-primary-200 rounded-full"
                      />
                      
                      {/* Main Image Container */}
                      <div className="relative w-[80%] h-[80%] rounded-full overflow-hidden shadow-2xl">
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </div>

                      {/* Floating Elements */}
                      <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute top-10 right-10 w-20 h-20 bg-white rounded-2xl shadow-lg 
                          flex items-center justify-center"
                      >
                        <Flower2 className="w-10 h-10 text-pink-400" />
                      </motion.div>

                      <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 3.5, repeat: Infinity }}
                        className="absolute bottom-20 left-0 w-16 h-16 bg-white rounded-2xl shadow-lg 
                          flex items-center justify-center"
                      >
                        <Leaf className="w-8 h-8 text-green-500" />
                      </motion.div>

                      <motion.div
                        animate={{ y: [-5, 15, -5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute bottom-10 right-20 w-24 h-24 bg-primary-500 rounded-2xl shadow-lg 
                          flex items-center justify-center text-white"
                      >
                        <div className="text-center flex flex-col items-center">
                          <Percent className="w-6 h-6 mb-1" />
                          <p className="text-xl font-bold">70</p>
                          <p className="text-xs">İndirim</p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Mobile Navigation - Bottom Bar */}
      <div className="absolute bottom-6 left-0 right-0 z-20 lg:hidden">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`relative h-1 rounded-full transition-all duration-500 overflow-hidden
                    ${activeIndex === index ? 'w-10 bg-white' : 'w-6 bg-white/40'}`}
                >
                  {activeIndex === index && isPlaying && (
                    <motion.div
                      className="absolute inset-0 bg-white origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 5, ease: 'linear' }}
                      key={`progress-${activeIndex}`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAutoplay}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm 
                  flex items-center justify-center text-white
                  hover:bg-white/30 transition-all duration-300 border border-white/20"
                aria-label={isPlaying ? 'Durdur' : 'Oynat'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>

              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm 
                  flex items-center justify-center text-white
                  hover:bg-white/30 transition-all duration-300 border border-white/20"
                aria-label="Önceki"
              >
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-white 
                  flex items-center justify-center text-primary-500
                  hover:bg-gray-100 transition-all duration-300 shadow-lg"
                aria-label="Sonraki"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
      >
        <div className="w-8 h-12 border-2 border-gray-400 rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-primary-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Mobile Slide Counter */}
      <div className="absolute top-28 right-4 lg:hidden z-20">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white text-sm font-medium">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="opacity-50">/</span>
          <span className="opacity-50">{String(slides.length).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
