'use client';

import { useState, useEffect, createContext, useContext, useRef, useCallback, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollToTop } from '@/components';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { OrderProvider } from '@/context/OrderContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import WhatsAppButton from '@/components/WhatsAppButton';

interface PreloaderContextType {
  isPreloaderComplete: boolean;
  showHeaderLogo: boolean;
  logoRef: React.RefObject<HTMLDivElement | null>;
  registerLogoPosition: () => void;
}

const PreloaderContext = createContext<PreloaderContextType>({
  isPreloaderComplete: true,
  showHeaderLogo: true,
  logoRef: { current: null },
  registerLogoPosition: () => {},
});

export const usePreloader = () => useContext(PreloaderContext);

interface ClientRootProps {
  children: React.ReactNode;
}

export default function ClientRoot({ children }: ClientRootProps) {
  const [isPageReady, setIsPageReady] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const registerLogoPosition = useCallback(() => {
    // No longer needed, kept for backward compatibility
  }, []);

  useEffect(() => {
    // Sayfa hazır olduğunda hemen göster - bekletme yok
    setIsPageReady(true);
  }, []);

  // Always start from top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <CustomerProvider>
      <OrderProvider>
        <CartProvider>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <PreloaderContext.Provider value={{ 
                isPreloaderComplete: true, 
                showHeaderLogo: true, 
                logoRef, 
                registerLogoPosition 
              }}>
                {/* Minimal page transition - anında görünüm */}
                <div 
                  style={{ 
                    opacity: isPageReady ? 1 : 0,
                    transition: 'opacity 0.15s ease-out'
                  }}
                >
                  {children}
                </div>
                <WhatsAppButton />
                <ScrollToTop />
              </PreloaderContext.Provider>
            </AnalyticsProvider>
          </Suspense>
        </CartProvider>
      </OrderProvider>
    </CustomerProvider>
  );
}
