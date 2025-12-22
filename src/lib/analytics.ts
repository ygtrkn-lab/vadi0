/**
 * Custom Analytics Tracker
 * Google Analytics benzeri özel ziyaretçi takip sistemi
 */

// Session ID için localStorage key
const SESSION_KEY = 'vadiler_analytics_session';
const VISITOR_KEY = 'vadiler_visitor_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika

// Event tipleri
export type EventCategory = 'ecommerce' | 'engagement' | 'navigation' | 'form' | 'error';

export type EventName = 
  // E-commerce events
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase'
  // Engagement events
  | 'search'
  | 'click'
  | 'scroll'
  | 'video_play'
  | 'share'
  | 'favorite_add'
  | 'favorite_remove'
  // Navigation events
  | 'page_view'
  | 'outbound_click'
  // Form events
  | 'form_start'
  | 'form_submit'
  | 'login'
  | 'sign_up'
  // Custom
  | string;

export interface TrackEventProps {
  eventName: EventName;
  eventCategory?: EventCategory;
  eventLabel?: string;
  eventValue?: number;
  properties?: Record<string, any>;
}

export interface PageViewProps {
  pageUrl: string;
  pagePath: string;
  pageTitle: string;
  pageType?: string;
  productId?: number;
  productName?: string;
  categorySlug?: string;
  categoryName?: string;
  referrerPath?: string;
}

interface SessionData {
  sessionId: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
  pageViews: number;
}

interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceModel: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
}

interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

class AnalyticsTracker {
  private sessionData: SessionData | null = null;
  private currentPageViewId: string | null = null;
  private pageViewStartTime: number = 0;
  private isInitialized: boolean = false;
  private queue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  /**
   * Tracker'ı başlat
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;

    try {
      // Visitor ID al veya oluştur
      let visitorId = localStorage.getItem(VISITOR_KEY);
      if (!visitorId) {
        visitorId = this.generateId('v');
        localStorage.setItem(VISITOR_KEY, visitorId);
      }

      // Session kontrol et
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as SessionData;
        const now = Date.now();
        
        // Session timeout kontrolü (30 dakika)
        if (now - parsed.lastActivityAt < SESSION_TIMEOUT) {
          this.sessionData = {
            ...parsed,
            lastActivityAt: now,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionData));
        } else {
          // Eski session'ı sonlandır
          await this.endSession(parsed.sessionId);
          this.sessionData = null;
        }
      }

      // Yeni session başlat
      if (!this.sessionData) {
        await this.startSession(visitorId);
      }

      this.isInitialized = true;

      // Sayfa kapandığında session'ı güncelle
      window.addEventListener('beforeunload', () => {
        this.handlePageLeave();
      });

      // Visibility change - kullanıcı sekmeyi değiştirdiğinde
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.handlePageLeave();
        }
      });

      // Queue'daki işlemleri işle
      this.processQueue();
    } catch (error) {
      console.error('Analytics init error:', error);
    }
  }

  /**
   * Yeni oturum başlat
   */
  private async startSession(visitorId: string): Promise<void> {
    const sessionId = this.generateId('sess');
    const now = Date.now();
    
    this.sessionData = {
      sessionId,
      visitorId,
      startedAt: now,
      lastActivityAt: now,
      pageViews: 0,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionData));

    // Session'ı sunucuya gönder
    const deviceInfo = this.getDeviceInfo();
    const utmParams = this.getUTMParams();

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId,
          ...deviceInfo,
          ...utmParams,
          referrer: document.referrer || null,
          referrerDomain: this.extractDomain(document.referrer),
          landingPage: window.location.pathname,
        }),
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * Oturumu sonlandır
   */
  private async endSession(sessionId: string): Promise<void> {
    try {
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          exitPage: window.location.pathname,
          ended: true,
        }),
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Sayfa görüntüleme kaydet
   */
  async trackPageView(props: PageViewProps): Promise<void> {
    if (!this.isInitialized) {
      this.queue.push(() => this.trackPageView(props));
      return;
    }

    if (!this.sessionData) return;

    // Önceki sayfadan çıkışı kaydet
    if (this.currentPageViewId) {
      await this.updatePageViewDuration();
    }

    this.pageViewStartTime = Date.now();
    this.sessionData.pageViews++;
    this.sessionData.lastActivityAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionData));

    try {
      const response = await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          visitorId: this.sessionData.visitorId,
          ...props,
          loadTimeMs: this.getPageLoadTime(),
        }),
      });

      const data = await response.json();
      if (data.pageViewId) {
        this.currentPageViewId = data.pageViewId;
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Event kaydet
   */
  async trackEvent(props: TrackEventProps): Promise<void> {
    if (!this.isInitialized) {
      this.queue.push(() => this.trackEvent(props));
      return;
    }

    if (!this.sessionData) return;

    this.sessionData.lastActivityAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionData));

    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          pageViewId: this.currentPageViewId,
          visitorId: this.sessionData.visitorId,
          pageUrl: window.location.href,
          pagePath: window.location.pathname,
          ...props,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * E-commerce: Ürün görüntüleme
   */
  trackViewItem(product: {
    id: number;
    name: string;
    price: number;
    category?: string;
  }): void {
    this.trackEvent({
      eventName: 'view_item',
      eventCategory: 'ecommerce',
      eventLabel: product.name,
      eventValue: product.price,
      properties: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        category: product.category,
      },
    });
  }

  /**
   * E-commerce: Sepete ekleme
   */
  trackAddToCart(product: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }): void {
    this.trackEvent({
      eventName: 'add_to_cart',
      eventCategory: 'ecommerce',
      eventLabel: product.name,
      eventValue: product.price * product.quantity,
      properties: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: product.quantity,
        category: product.category,
      },
    });
  }

  /**
   * E-commerce: Sepetten çıkarma
   */
  trackRemoveFromCart(product: {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }): void {
    this.trackEvent({
      eventName: 'remove_from_cart',
      eventCategory: 'ecommerce',
      eventLabel: product.name,
      eventValue: product.price * product.quantity,
      properties: {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: product.quantity,
      },
    });
  }

  /**
   * E-commerce: Checkout başlama
   */
  trackBeginCheckout(cart: {
    items: Array<{ id: number; name: string; price: number; quantity: number }>;
    total: number;
  }): void {
    this.trackEvent({
      eventName: 'begin_checkout',
      eventCategory: 'ecommerce',
      eventLabel: `${cart.items.length} items`,
      eventValue: cart.total,
      properties: {
        items: cart.items,
        total: cart.total,
        item_count: cart.items.length,
      },
    });
  }

  /**
   * E-commerce: Satın alma
   */
  trackPurchase(order: {
    orderId: string;
    total: number;
    items: Array<{ id: number; name: string; price: number; quantity: number }>;
    coupon?: string;
  }): void {
    this.trackEvent({
      eventName: 'purchase',
      eventCategory: 'ecommerce',
      eventLabel: order.orderId,
      eventValue: order.total,
      properties: {
        order_id: order.orderId,
        total: order.total,
        items: order.items,
        item_count: order.items.length,
        coupon: order.coupon,
      },
    });

    // Session'ı conversion olarak işaretle
    this.markConversion(order.total);
  }

  /**
   * Arama event'i
   */
  trackSearch(query: string, resultsCount: number): void {
    this.trackEvent({
      eventName: 'search',
      eventCategory: 'engagement',
      eventLabel: query,
      eventValue: resultsCount,
      properties: {
        search_query: query,
        results_count: resultsCount,
      },
    });
  }

  /**
   * Favorilere ekleme
   */
  trackFavoriteAdd(product: { id: number; name: string }): void {
    this.trackEvent({
      eventName: 'favorite_add',
      eventCategory: 'engagement',
      eventLabel: product.name,
      properties: {
        product_id: product.id,
        product_name: product.name,
      },
    });
  }

  /**
   * Kullanıcı girişi
   */
  trackLogin(customerId: string): void {
    this.trackEvent({
      eventName: 'login',
      eventCategory: 'form',
      properties: {
        customer_id: customerId,
      },
    });

    // Session'a customer_id ekle
    this.linkCustomer(customerId);
  }

  /**
   * Kullanıcı kaydı
   */
  trackSignUp(customerId: string): void {
    this.trackEvent({
      eventName: 'sign_up',
      eventCategory: 'form',
      properties: {
        customer_id: customerId,
      },
    });

    this.linkCustomer(customerId);
  }

  /**
   * Session'a müşteri ID bağla
   */
  private async linkCustomer(customerId: string): Promise<void> {
    if (!this.sessionData) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          customerId,
        }),
      });
    } catch (error) {
      console.error('Failed to link customer:', error);
    }
  }

  /**
   * Session'ı conversion olarak işaretle
   */
  private async markConversion(value: number): Promise<void> {
    if (!this.sessionData) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionData.sessionId,
          converted: true,
          conversionValue: value,
        }),
      });
    } catch (error) {
      console.error('Failed to mark conversion:', error);
    }
  }

  /**
   * Sayfa görüntüleme süresini güncelle
   */
  private async updatePageViewDuration(): Promise<void> {
    if (!this.currentPageViewId || !this.pageViewStartTime) return;

    const duration = Math.round((Date.now() - this.pageViewStartTime) / 1000);
    
    try {
      await fetch('/api/analytics/pageview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageViewId: this.currentPageViewId,
          timeOnPageSeconds: duration,
          scrollDepthPercent: this.getScrollDepth(),
        }),
      });
    } catch (error) {
      console.error('Failed to update page view duration:', error);
    }
  }

  /**
   * Sayfa ayrılırken çağrılır
   */
  private handlePageLeave(): void {
    if (!this.sessionData || !this.currentPageViewId) return;

    const duration = Math.round((Date.now() - this.pageViewStartTime) / 1000);
    const scrollDepth = this.getScrollDepth();

    // Beacon API ile veri gönder (sayfa kapansa bile gönderilir)
    const data = JSON.stringify({
      pageViewId: this.currentPageViewId,
      sessionId: this.sessionData.sessionId,
      timeOnPageSeconds: duration,
      scrollDepthPercent: scrollDepth,
      exitPage: window.location.pathname,
    });

    navigator.sendBeacon('/api/analytics/leave', data);
  }

  /**
   * Scroll derinliği hesapla
   */
  private getScrollDepth(): number {
    if (typeof window === 'undefined') return 0;
    
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return 100;
    
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }

  /**
   * Sayfa yüklenme süresi
   */
  private getPageLoadTime(): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;
    
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!timing) return null;
    
    return Math.round(timing.loadEventEnd - timing.startTime);
  }

  /**
   * Cihaz bilgilerini al
   */
  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    
    // Device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
      deviceType = 'mobile';
    }

    // Device model detection
    let deviceModel = 'Unknown';
    
    // iPhone models
    if (ua.includes('iPhone')) {
      deviceModel = 'iPhone';
      // Try to detect specific model from screen size
      const w = window.screen.width;
      const h = window.screen.height;
      const ratio = window.devicePixelRatio || 1;
      if ((w === 430 || h === 932) && ratio === 3) deviceModel = 'iPhone 14 Pro Max / 15 Pro Max';
      else if ((w === 393 || h === 852) && ratio === 3) deviceModel = 'iPhone 14 Pro / 15 Pro';
      else if ((w === 390 || h === 844) && ratio === 3) deviceModel = 'iPhone 12/13/14';
      else if ((w === 375 || h === 812) && ratio === 3) deviceModel = 'iPhone X/XS/11 Pro';
      else if ((w === 414 || h === 896) && ratio === 3) deviceModel = 'iPhone XS Max/11 Pro Max';
      else if ((w === 414 || h === 736) && ratio === 3) deviceModel = 'iPhone 6/7/8 Plus';
      else if ((w === 375 || h === 667) && ratio === 2) deviceModel = 'iPhone 6/7/8/SE';
    }
    // iPad models
    else if (ua.includes('iPad')) {
      deviceModel = 'iPad';
      if (ua.includes('iPad Pro')) deviceModel = 'iPad Pro';
      else if (ua.includes('iPad Air')) deviceModel = 'iPad Air';
      else if (ua.includes('iPad Mini')) deviceModel = 'iPad Mini';
    }
    // Samsung models
    else if (ua.includes('Samsung') || ua.includes('SM-')) {
      const samsungMatch = ua.match(/SM-([A-Z]\d{3}[A-Z]?)/i);
      if (samsungMatch) {
        const model = samsungMatch[1].toUpperCase();
        if (model.startsWith('S9')) deviceModel = 'Samsung Galaxy S24';
        else if (model.startsWith('S91')) deviceModel = 'Samsung Galaxy S23';
        else if (model.startsWith('G99')) deviceModel = 'Samsung Galaxy S21/S22';
        else if (model.startsWith('A')) deviceModel = 'Samsung Galaxy A Series';
        else if (model.startsWith('N')) deviceModel = 'Samsung Galaxy Note';
        else deviceModel = `Samsung ${model}`;
      } else {
        deviceModel = 'Samsung Galaxy';
      }
    }
    // Google Pixel
    else if (ua.includes('Pixel')) {
      const pixelMatch = ua.match(/Pixel (\d+[a-z]?)/i);
      deviceModel = pixelMatch ? `Google Pixel ${pixelMatch[1]}` : 'Google Pixel';
    }
    // Huawei
    else if (ua.includes('HUAWEI') || ua.includes('Huawei')) {
      deviceModel = 'Huawei';
    }
    // Xiaomi
    else if (ua.includes('Xiaomi') || ua.includes('Redmi') || ua.includes('POCO')) {
      if (ua.includes('Redmi')) deviceModel = 'Xiaomi Redmi';
      else if (ua.includes('POCO')) deviceModel = 'Xiaomi POCO';
      else deviceModel = 'Xiaomi';
    }
    // OnePlus
    else if (ua.includes('OnePlus')) {
      deviceModel = 'OnePlus';
    }
    // Desktop detection
    else if (deviceType === 'desktop') {
      if (ua.includes('Macintosh')) deviceModel = 'Mac';
      else if (ua.includes('Windows')) deviceModel = 'Windows PC';
      else if (ua.includes('Linux')) deviceModel = 'Linux PC';
      else deviceModel = 'Desktop';
    }
    // Generic Android
    else if (ua.includes('Android')) {
      const androidMatch = ua.match(/;\s*([^;]+)\s+Build/i);
      if (androidMatch) {
        deviceModel = androidMatch[1].trim();
      } else {
        deviceModel = 'Android Device';
      }
    }

    // Browser detection
    let browser = 'Unknown';
    let browserVersion = '';
    
    if (ua.includes('Firefox/')) {
      browser = 'Firefox';
      browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    } else if (ua.includes('Edg/')) {
      browser = 'Edge';
      browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
    } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
      browser = 'Opera';
      browserVersion = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || '';
    } else if (ua.includes('Chrome/')) {
      browser = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browser = 'Safari';
      browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
      browser = 'Internet Explorer';
      browserVersion = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || '';
    }

    // OS detection
    let os = 'Unknown';
    let osVersion = '';
    
    if (ua.includes('Windows NT')) {
      os = 'Windows';
      const version = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
      if (version === '10.0') osVersion = '10/11';
      else if (version === '6.3') osVersion = '8.1';
      else if (version === '6.2') osVersion = '8';
      else if (version === '6.1') osVersion = '7';
    } else if (ua.includes('Mac OS X')) {
      os = 'macOS';
      osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    } else if (ua.includes('Android')) {
      os = 'Android';
      osVersion = ua.match(/Android (\d+\.?\d*)/)?.[1] || '';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
      osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }

    return {
      deviceType,
      deviceModel,
      browser,
      browserVersion,
      os,
      osVersion,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    };
  }

  /**
   * UTM parametrelerini al
   */
  private getUTMParams(): UTMParams {
    if (typeof window === 'undefined') return {};
    
    const params = new URLSearchParams(window.location.search);
    
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
    };
  }

  /**
   * Domain çıkar
   */
  private extractDomain(url: string): string | null {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Benzersiz ID oluştur
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${timestamp}${random}`;
  }

  /**
   * Queue'u işle
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Queue task error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Session bilgisini getir
   */
  getSessionInfo(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Visitor ID getir
   */
  getVisitorId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(VISITOR_KEY);
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();

// Kolaylık fonksiyonları
export const trackPageView = (props: PageViewProps) => analytics.trackPageView(props);
export const trackEvent = (props: TrackEventProps) => analytics.trackEvent(props);
export const trackViewItem = (product: Parameters<typeof analytics.trackViewItem>[0]) => analytics.trackViewItem(product);
export const trackAddToCart = (product: Parameters<typeof analytics.trackAddToCart>[0]) => analytics.trackAddToCart(product);
export const trackRemoveFromCart = (product: Parameters<typeof analytics.trackRemoveFromCart>[0]) => analytics.trackRemoveFromCart(product);
export const trackBeginCheckout = (cart: Parameters<typeof analytics.trackBeginCheckout>[0]) => analytics.trackBeginCheckout(cart);
export const trackPurchase = (order: Parameters<typeof analytics.trackPurchase>[0]) => analytics.trackPurchase(order);
export const trackSearch = (query: string, resultsCount: number) => analytics.trackSearch(query, resultsCount);
export const trackFavoriteAdd = (product: Parameters<typeof analytics.trackFavoriteAdd>[0]) => analytics.trackFavoriteAdd(product);
export const trackLogin = (customerId: string) => analytics.trackLogin(customerId);
export const trackSignUp = (customerId: string) => analytics.trackSignUp(customerId);

export default analytics;
