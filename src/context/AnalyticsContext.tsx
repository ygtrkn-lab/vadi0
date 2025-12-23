'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  analytics, 
  PageViewProps,
  TrackEventProps,
  trackAddToCart as _trackAddToCart,
  trackRemoveFromCart as _trackRemoveFromCart,
  trackBeginCheckout as _trackBeginCheckout,
  trackPurchase as _trackPurchase,
  trackSearch as _trackSearch,
  trackFavoriteAdd as _trackFavoriteAdd,
  trackLogin as _trackLogin,
  trackSignUp as _trackSignUp,
  trackViewItem as _trackViewItem,
} from '@/lib/analytics';

// ============================================
// Context Types
// ============================================

interface AnalyticsContextType {
  // Sayfa görüntüleme
  trackPageView: (props?: Partial<PageViewProps>) => void;
  
  // Genel event - supports both (props) and (eventName, properties) signatures
  trackEvent: ((props: TrackEventProps) => void) & ((eventName: string, properties?: Record<string, any>) => void);
  
  // E-commerce events
  trackViewItem: (product: { id: number; name: string; price: number; category?: string }) => void;
  trackAddToCart: (product: { id: number; name: string; price: number; quantity: number; category?: string }) => void;
  trackRemoveFromCart: (product: { id: number; name: string; price: number; quantity: number }) => void;
  trackBeginCheckout: (cart: { items: Array<{ id: number; name: string; price: number; quantity: number }>; total: number }) => void;
  trackPurchase: (order: { orderId: string; total: number; items: Array<{ id: number; name: string; price: number; quantity: number }>; coupon?: string }) => void;
  
  // Engagement events
  trackSearch: (query: string, resultsCount: number) => void;
  trackFavoriteAdd: (product: { id: number; name: string; price?: number; category?: string }) => void;
  trackClick: (element: string, properties?: Record<string, any>) => void;
  
  // Auth events
  trackLogin: (customerId: string) => void;
  trackSignUp: (customerId: string) => void;
  
  // Session bilgisi
  getSessionInfo: () => { sessionId: string; visitorId: string } | null;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// ============================================
// Hook
// ============================================

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Eğer provider dışında kullanılırsa, no-op döndür
    return {
      trackPageView: () => {},
      trackEvent: () => {},
      trackViewItem: () => {},
      trackAddToCart: () => {},
      trackRemoveFromCart: () => {},
      trackBeginCheckout: () => {},
      trackPurchase: () => {},
      trackSearch: () => {},
      trackFavoriteAdd: () => {},
      trackClick: () => {},
      trackLogin: () => {},
      trackSignUp: () => {},
      getSessionInfo: () => null,
    };
  }
  return context;
}

// ============================================
// Sayfa tipi belirleme yardımcısı
// ============================================

function getPageType(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname === '/sepet') return 'cart';
  if (pathname.startsWith('/payment') || pathname.startsWith('/odeme')) return 'checkout';
  if (pathname.startsWith('/hesabim')) return 'account';
  if (pathname.startsWith('/arama')) return 'search';
  if (pathname.startsWith('/siparis-takip')) return 'order_tracking';
  if (pathname.startsWith('/giris')) return 'login';
  if (pathname.startsWith('/yonetim')) return 'admin';
  if (pathname.startsWith('/kategoriler')) return 'categories';
  if (pathname.startsWith('/iletisim')) return 'contact';
  if (pathname.startsWith('/hakkimizda')) return 'about';
  if (pathname.startsWith('/rehber')) return 'guide';
  if (pathname.startsWith('/ozel-gun')) return 'special_day';
  if (pathname.startsWith('/sehir')) return 'city';
  
  // Kategori sayfaları (tek segment slug)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return 'category';
  
  // Ürün sayfaları (kategori/urun formatı)
  if (segments.length === 2) return 'product';
  
  return 'page';
}

// ============================================
// Provider Component
// ============================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Analytics'i başlat
  useEffect(() => {
    if (!isInitializedRef.current) {
      analytics.init();
      isInitializedRef.current = true;
    }
  }, []);

  // Sayfa değişikliklerini takip et
  useEffect(() => {
    // Admin sayfalarını takip etme
    if (pathname.startsWith('/yonetim')) return;
    
    // İlk render veya sayfa değişikliği
    const fullUrl = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    // Sayfa görüntüleme kaydet
    analytics.trackPageView({
      pageUrl: fullUrl,
      pagePath: pathname,
      pageTitle: document.title,
      pageType: getPageType(pathname),
      referrerPath: previousPathRef.current || undefined,
    });

    previousPathRef.current = pathname;
  }, [pathname, searchParams]);

  // Context value
  const trackPageView = useCallback((props?: Partial<PageViewProps>) => {
    const fullUrl = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    analytics.trackPageView({
      pageUrl: fullUrl,
      pagePath: pathname,
      pageTitle: document.title,
      pageType: getPageType(pathname),
      ...props,
    });
  }, [pathname, searchParams]);

  const trackEvent = useCallback((propsOrEventName: TrackEventProps | string, properties?: Record<string, any>) => {
    if (typeof propsOrEventName === 'string') {
      // Called as trackEvent('eventName', { properties })
      analytics.trackEvent({
        eventName: propsOrEventName,
        properties,
      });
    } else {
      // Called as trackEvent({ eventName, ... })
      analytics.trackEvent(propsOrEventName);
    }
  }, []);

  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    analytics.trackEvent({
      eventName: 'click',
      eventCategory: 'engagement',
      eventLabel: element,
      properties: {
        element,
        ...properties,
      },
    });
  }, []);

  const getSessionInfo = useCallback(() => {
    const session = analytics.getSessionInfo();
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      visitorId: session.visitorId,
    };
  }, []);

  const value: AnalyticsContextType = {
    trackPageView,
    trackEvent,
    trackViewItem: _trackViewItem,
    trackAddToCart: _trackAddToCart,
    trackRemoveFromCart: _trackRemoveFromCart,
    trackBeginCheckout: _trackBeginCheckout,
    trackPurchase: _trackPurchase,
    trackSearch: _trackSearch,
    trackFavoriteAdd: _trackFavoriteAdd,
    trackClick,
    trackLogin: _trackLogin,
    trackSignUp: _trackSignUp,
    getSessionInfo,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export default AnalyticsProvider;
