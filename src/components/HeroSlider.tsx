'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, EffectCreative, EffectFade } from 'swiper/modules';
import { ArrowRight, ArrowLeft, Play, Pause, Flower2, Leaf, Percent, ChevronRight } from 'lucide-react';
import { slides as productSlides } from '@/data/products';

import 'swiper/css';
import 'swiper/css/effect-creative';
import 'swiper/css/effect-fade';

type HeroSlide = {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage?: string;
  buttonText: string;
  buttonLink: string;
};

type HeroSliderProps = {
  id?: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    title: 'Taze Çiçekler',
    subtitle: 'Günün en güzel seçkisi',
    description: 'Özenle hazırlanan buket ve aranjmanlarla sevdiklerinize zarif bir sürpriz yapın.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225219/vadiler/products/vadiler-sevginin-gucu-7-kirmizi-guller-aranjmani.jpg',
    buttonText: 'Ürünleri İncele',
    buttonLink: '/kategoriler',
  },
  {
    id: 'hero-2',
    title: 'Orkide Seçkisi',
    subtitle: 'Zarif ve kalıcı',
    description: 'Minimal ve şık orkide çeşitleriyle ev ve ofisler için harika bir seçim.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765224480/vadiler/products/vadiler-hayal-adasi-2-dal-tasarim-mor-orkide.jpg',
    buttonText: 'Orkideleri Gör',
    buttonLink: '/orkideler',
  },
  {
    id: 'hero-3',
    title: 'Özel Günler',
    subtitle: 'Kutlamalara özel',
    description: 'Doğum günü, yıldönümü ve tüm özel anlar için hediye seçkilerini keşfedin.',
    image:
      'https://res.cloudinary.com/dgdl1vdao/image/upload/v1765225910/vadiler/products/vadiler-teraryum-i-yi-ki-dogdun-canim-arkadasim-mor.jpg',
    buttonText: 'Özel Günlere Git',
    buttonLink: '/ozel-gun',
  },
];

export default function HeroSlider({ id }: HeroSliderProps) {
  const slides: HeroSlide[] = Array.isArray(productSlides) && productSlides.length > 0
    ? (productSlides as HeroSlide[])
    : FALLBACK_SLIDES;

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

  const getWallpaperSrc = useCallback((slide: HeroSlide, width: number) => {
    const raw = slide.mobileImage ?? slide.image;
    try {
      const url = new URL(raw);
      const existingW = url.searchParams.get('w');
      if (existingW) {
        url.searchParams.set('w', String(width));
      }
      return url.toString();
    } catch {
      return raw;
    }
  }, []);

  return (
    <section id={id} className="relative min-h-[100svh] lg:min-h-screen lg:max-h-[900px] overflow-hidden">

      <Swiper
        modules={[Autoplay, EffectCreative, EffectFade]}
        effect="fade"
        speed={800}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        // Small perf win: don't eagerly preload all slide images.
        preloadImages={false}
        loop
        className="h-full min-h-[100svh] lg:min-h-screen lg:max-h-[900px]"
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative min-h-[100svh] lg:min-h-screen lg:max-h-[900px] lg:h-screen flex items-center">
              {/* Background Image (mobile + desktop, same concept) */}
              <div className="absolute inset-0">
                <Image
                  src={getWallpaperSrc(slide, 1920)}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  quality={80}
                  className="object-cover"
                  priority={index === 0}
                />
                {/* Readability overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
                {/* Subtle wallpaper texture (no external assets) */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.18) 0 2px, transparent 3px),\n' +
                      'radial-gradient(circle at 82% 28%, rgba(255,255,255,0.14) 0 2px, transparent 3px),\n' +
                      'radial-gradient(circle at 28% 78%, rgba(255,255,255,0.12) 0 2px, transparent 3px),\n' +
                      'radial-gradient(circle at 78% 82%, rgba(255,255,255,0.10) 0 2px, transparent 3px)',
                    backgroundSize: '160px 160px',
                  }}
                />
              </div>

              <div className="container-custom relative z-10 pt-40 pb-24 sm:pt-40 sm:pb-28 lg:pt-32 lg:pb-20">
                <div className="grid lg:grid-cols-1 gap-8 lg:gap-12 items-center">
                  {/* Text Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-center lg:text-left
                      mx-auto max-w-[520px] lg:mx-0 lg:max-w-[640px]
                      bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 lg:p-6"
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
                      className="hidden lg:inline-flex items-center gap-2 px-4 py-2 bg-white/90 
                        backdrop-blur-sm rounded-full text-sm font-medium text-primary-600 mb-4 shadow-sm"
                    >
                      <span className="w-2 h-2 bg-primary-500 rounded-full" />
                      {slide.subtitle}
                    </motion.span>

                    {/* Title */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-[32px] leading-[1.08] sm:text-5xl lg:text-5xl xl:text-6xl font-bold mb-4 text-white"
                    >
                      <span className="text-white">{slide.title.split(' ')[0]}</span>{' '}
                      {slide.title.split(' ').slice(1).join(' ')}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-[15px] sm:text-lg text-white/90 mb-6 max-w-md 
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
                        className="w-full sm:w-auto px-8 py-4.5 bg-primary-500 hover:bg-primary-600 
                          text-white font-semibold rounded-2xl flex items-center justify-center gap-3 
                          transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30 group"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                        className="px-6 py-3 rounded-2xl text-white font-semibold 
                          flex items-center gap-2 group bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md
                          transition-all duration-300"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>

                      {/* removed category link - slider should go directly to product pages */}
                    </motion.div>

                    {/* Stats - Desktop Only */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={activeIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="hidden lg:flex items-center justify-start gap-6 mt-8"
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">500+</p>
                        <p className="text-sm text-white/70">Çiçek Çeşidi</p>
                      </div>
                      <div className="w-px h-10 bg-white/15" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">50K+</p>
                        <p className="text-sm text-white/70">Mutlu Müşteri</p>
                      </div>
                      <div className="w-px h-10 bg-white/15" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">4.9</p>
                        <p className="text-sm text-white/70">Puan</p>
                      </div>
                    </motion.div>
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
                  aria-label={`Slayt ${index + 1}`}
                  aria-current={activeIndex === index ? 'true' : 'false'}
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
    </section>
  );
}
