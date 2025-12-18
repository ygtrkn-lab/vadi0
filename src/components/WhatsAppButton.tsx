'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const WHATSAPP_NUMBER = '908503074876';

interface MenuOption {
  id: string;
  label: string;
  description: string;
  message: string;
  gradient: string;
  icon: JSX.Element;
}

const getMenuOptions = (pageUrl: string): MenuOption[] => [
  {
    id: 'order',
    label: 'Sipariş Ver',
    description: 'Yeni sipariş oluştur',
    message: 'Merhaba, sipariş vermek istiyorum.',
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'order-help',
    label: 'Sipariş Yardımı',
    description: 'Mevcut siparişiniz hakkında',
    message: 'Merhaba, siparişim hakkında yardıma ihtiyacım var.',
    gradient: 'from-blue-500 to-cyan-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'delivery',
    label: 'Teslimat Bilgisi',
    description: 'Teslimat ve kargo takibi',
    message: 'Merhaba, teslimat hakkında bilgi almak istiyorum.',
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Genel Destek',
    description: 'Diğer sorularınız için',
    message: 'Merhaba, yardıma ihtiyacım var.',
    gradient: 'from-orange-500 to-red-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleWhatsAppClick = (message: string) => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    // Ürün sayfası kontrolü ve bilgi toplama
    let productInfo = '';
    if (typeof window !== 'undefined') {
      // Pathname'den ürün sayfası olup olmadığını kontrol et
      const pathParts = pathname.split('/').filter(Boolean);
      const isProductPage = pathParts.length === 2 && !['kategoriler', 'sehir', 'ozel-gun', 'giris', 'hesabim', 'sepet', 'yonetim', 'api'].includes(pathParts[0]);
      
      if (isProductPage) {
        // Sayfa başlığından ürün adını al
        const pageTitle = document.title.split('|')[0].trim() || document.title.split('-')[0].trim();
        
        // H1 başlığını kontrol et (daha doğru olabilir)
        const h1Element = document.querySelector('h1');
        const productName = h1Element?.textContent?.trim() || pageTitle;
        
        // Fiyat bilgisini bul (varsa)
        const priceElement = document.querySelector('[class*="price"]') || 
                            document.querySelector('[class*="fiyat"]');
        const price = priceElement?.textContent?.trim();
        
        productInfo = `\n\nÜrün: ${productName}`;
        if (price) {
          productInfo += `\nFiyat: ${price}`;
        }
      }
    }
    
    const fullMessage = `${message}${productInfo}\n\nSayfa: ${fullUrl}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const menuOptions = getMenuOptions(pathname);

  return (
    <>
      {/* Backdrop with blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-[54]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* WhatsApp Button Container */}
      <div
        className={`fixed z-[55] ${
          isMobile ? 'bottom-28 right-4' : 'bottom-8 right-8'
        }`}
        style={{
          ...(isMobile && {
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 7rem)',
          }),
        }}
      >
        {/* Menu Options - Modern Card Design */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
              className={`absolute ${
                isMobile ? 'bottom-20 right-0 w-[280px]' : 'bottom-24 right-0 w-[320px]'
              }`}
            >
              <div
                className="rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Nasıl yardımcı olabiliriz?
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hızlı destek için bir seçenek belirleyin
                  </p>
                </div>

                {/* Options */}
                <div className="p-2">
                  {menuOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        delay: index * 0.04,
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleWhatsAppClick(option.message)}
                      className="group relative w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all hover:bg-gray-50"
                    >
                      {/* Icon with gradient */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                        {option.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg
                        className="flex-shrink-0 w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all transform group-hover:translate-x-0.5 self-center"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span>Genellikle birkaç dakika içinde yanıt verilir</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button - Modern Minimal Design */}
        <motion.button
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.6,
          }}
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-[68px] h-[68px] rounded-[22px] overflow-hidden group shadow-2xl"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            transition: 'background 0.3s ease',
          }}
          aria-label="WhatsApp Destek"
        >
          {/* Ambient glow effect */}
          {!isOpen && (
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-[22px]"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                filter: 'blur(12px)',
              }}
            />
          )}

          {/* Icon Container */}
          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
              scale: isOpen ? 0.9 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className="relative z-10"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.svg
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="whatsapp"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="w-8 h-8 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-[22px]"
            initial={{ x: '-100%' }}
            whileHover={{
              x: '100%',
              transition: { duration: 0.6, ease: 'easeInOut' },
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
          />

          {/* Subtle inner shadow */}
          <div className="absolute inset-0 rounded-[22px] shadow-inner pointer-events-none" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }} />
        </motion.button>

        {/* Active indicator dot */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-lg"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full opacity-75"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
