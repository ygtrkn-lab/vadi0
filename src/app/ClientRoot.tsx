'use client';

import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Preloader } from '@/components';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { OrderProvider } from '@/context/OrderContext';

interface LogoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PreloaderContextType {
  isPreloaderComplete: boolean;
  showHeaderLogo: boolean;
  logoRef: React.RefObject<HTMLDivElement | null>;
  registerLogoPosition: () => void;
}

const PreloaderContext = createContext<PreloaderContextType>({
  isPreloaderComplete: false,
  showHeaderLogo: false,
  logoRef: { current: null },
  registerLogoPosition: () => {},
});

export const usePreloader = () => useContext(PreloaderContext);

interface ClientRootProps {
  children: React.ReactNode;
}

export default function ClientRoot({ children }: ClientRootProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPreloaderComplete, setIsPreloaderComplete] = useState(false);
  const [showHeaderLogo, setShowHeaderLogo] = useState(false);
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
  const [targetPosition, setTargetPosition] = useState<LogoPosition | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const registerLogoPosition = useCallback(() => {
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      setTargetPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    // Calculate logo position after a short delay to ensure header is rendered
    const positionTimer = setTimeout(() => {
      registerLogoPosition();
    }, 100);

    // Minimum loading time for smooth UX
    const minLoadTime = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    // Also check if page is loaded
    const handleLoad = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    };

    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoading(false), 2000);
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(positionTimer);
      clearTimeout(minLoadTime);
      window.removeEventListener('load', handleLoad);
    };
  }, [registerLogoPosition]);

  // Always start from top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  const handleLogoArrived = () => {
    // Logo arrived at header position, now show actual header logo
    setShowHeaderLogo(true);
    setTimeout(() => {
      setIsPreloaderComplete(true);
      setIsPreloaderVisible(false);
    }, 200);
  };

  // Sadece anasayfada preloader göster
  const isHomePage = pathname === '/';
  const shouldShowPreloader = isHomePage && isPreloaderVisible;

  return (
    <CustomerProvider>
      <OrderProvider>
        <CartProvider>
          <PreloaderContext.Provider value={{ isPreloaderComplete: isHomePage ? isPreloaderComplete : true, showHeaderLogo: isHomePage ? showHeaderLogo : true, logoRef, registerLogoPosition }}>
            {shouldShowPreloader && (
              <Preloader 
                isLoading={isLoading} 
                targetPosition={targetPosition}
                onLogoArrived={handleLogoArrived}
              />
            )}
            <div 
              style={{ 
                opacity: (isHomePage ? isPreloaderComplete : true) ? 1 : 0.99,
                transition: 'opacity 0.3s ease'
              }}
            >
              {children}
            </div>
          </PreloaderContext.Provider>
        </CartProvider>
      </OrderProvider>
    </CustomerProvider>
  );
}
