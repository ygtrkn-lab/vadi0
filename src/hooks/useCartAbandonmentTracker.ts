'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface CartItem {
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
}

interface CartAbandonmentData {
  visitorId?: string;
  sessionId?: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  interactions?: InteractionsSummary;
  cartItems: Array<{ id: number; name: string; price: number; quantity: number }>;
  cartTotal: number;
  cartItemCount: number;
  reachedStep: 'cart' | 'recipient' | 'message' | 'payment';
  reachedAddressForm: boolean;
  filledFields: Record<string, boolean>;
  timeOnCartSeconds: number;
  timeOnRecipientSeconds: number;
  timeOnMessageSeconds: number;
  timeOnPaymentSeconds: number;
  totalCheckoutSeconds: number;
  selectedDistrict?: string;
  selectedNeighborhood?: string;
  selectedDeliveryDate?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
  startedAt: string;
}

interface FieldInteractionMetrics {
  focus: number;
  blur: number;
  input: number;
  totalInputMs: number;
  errors: number;
}

interface ScrollMetrics {
  maxDepthPercent: number;
  timeTo50PercentMs?: number;
  timeTo90PercentMs?: number;
  firstScrollAtMs?: number;
}

interface CartChangeMetrics {
  quantityChanges: number;
  removals: number;
  valueChange: number;
}

interface InteractionsSummary {
  fields: Record<string, FieldInteractionMetrics>;
  scroll: ScrollMetrics;
  clicks: Record<string, number>;
  cart: CartChangeMetrics;
  timeToFirstInputMs?: number;
  timeToFirstErrorMs?: number;
}

interface UseCartAbandonmentTrackerOptions {
  items: CartItem[];
  currentStep: 'cart' | 'recipient' | 'message' | 'payment' | 'success';
  customerId?: string | null;
  customerEmail?: string;
  customerPhone?: string;
  // Form alanları
  recipientName?: string;
  recipientPhone?: string;
  district?: string;
  neighborhood?: string;
  deliveryDate?: string;
  streetName?: string;
  buildingNo?: string;
  messageCard?: string;
  // Minimum terk süresi (saniye)
  minAbandonTime?: number;
}

/**
 * Sepet terk takibi hook'u
 * - Sayfa açıldığında zamanlayıcı başlatır
 * - Her adımda geçirilen süreyi kaydeder
 * - Sayfa kapatıldığında/değiştiğinde beacon ile veri gönderir
 * - Minimum 20 saniye geçirmeli ve adres formuna ulaşmış olmalı
 */
export function useCartAbandonmentTracker(options: UseCartAbandonmentTrackerOptions) {
  const {
    items,
    currentStep,
    customerId,
    customerEmail,
    customerPhone,
    recipientName,
    recipientPhone,
    district,
    neighborhood,
    deliveryDate,
    streetName,
    buildingNo,
    messageCard,
    minAbandonTime = 20,
  } = options;

  const pathname = usePathname();
  
  // Zamanlama için ref'ler - lazy initialization
  const startTimeRef = useRef<number>(0);
  const stepStartTimeRef = useRef<number>(0);
  const stepTimesRef = useRef<{
    cart: number;
    recipient: number;
    message: number;
    payment: number;
  }>({ cart: 0, recipient: 0, message: 0, payment: 0 });
  
  const lastStepRef = useRef<string>(currentStep);
  const hasReachedAddressFormRef = useRef<boolean>(false);
  const hasSentAbandonmentRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const interactionsRef = useRef<InteractionsSummary>({
    fields: {},
    scroll: { maxDepthPercent: 0 },
    clicks: {},
    cart: { quantityChanges: 0, removals: 0, valueChange: 0 },
  });
  const fieldActiveSinceRef = useRef<Record<string, number>>({});
  const firstInputTimeRef = useRef<number | null>(null);
  const firstErrorTimeRef = useRef<number | null>(null);
  const baseCartTotalRef = useRef<number>(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  const lastCartItemsRef = useRef<CartItem[]>(items);
  const hasCartChangeInitializedRef = useRef<boolean>(false);
  const scrollTickingRef = useRef<boolean>(false);
  const lastClickTsRef = useRef<number>(0);

  // Initialize timing refs on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      const now = Date.now();
      startTimeRef.current = now;
      stepStartTimeRef.current = now;
      isInitializedRef.current = true;
    }
  }, [items]);

  // Device detection
  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return {};
    
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';
    
    // Device type
    if (/Mobi|Android/i.test(ua)) {
      deviceType = /Tablet|iPad/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    // Browser detection
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    // OS detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return {
      deviceType,
      browser,
      os,
      userAgent: ua,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  }, []);

  // Session bilgilerini al
  const getSessionInfo = useCallback(() => {
    if (typeof window === 'undefined') return { visitorId: undefined, sessionId: undefined };
    
    try {
      const visitorId = localStorage.getItem('vadiler_visitor_id') || undefined;
      const sessionId = localStorage.getItem('vadiler_session_id') || undefined;
      return { visitorId, sessionId };
    } catch {
      return { visitorId: undefined, sessionId: undefined };
    }
  }, []);

  // UTM parametrelerini al
  const getUTMParams = useCallback(() => {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = sessionStorage.getItem('vadiler_utm_params');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    
    return {};
  }, []);

  const getFieldKey = useCallback((target: HTMLElement) => {
    const datasetKey = target.getAttribute('data-field') || target.getAttribute('data-interaction-key');
    const name = target.getAttribute('name');
    const id = target.getAttribute('id');
    const aria = target.getAttribute('aria-label');
    return datasetKey || name || id || aria || target.tagName.toLowerCase();
  }, []);

  // Doldurulmuş alanları kontrol et
  const getFilledFields = useCallback(() => {
    return {
      recipientName: !!recipientName?.trim(),
      recipientPhone: !!recipientPhone?.trim(),
      district: !!district?.trim(),
      neighborhood: !!neighborhood?.trim(),
      deliveryDate: !!deliveryDate?.trim(),
      streetName: !!streetName?.trim(),
      buildingNo: !!buildingNo?.trim(),
      messageCard: !!messageCard?.trim(),
    };
  }, [recipientName, recipientPhone, district, neighborhood, deliveryDate, streetName, buildingNo, messageCard]);

  // Form etkileşimlerini, scroll ve tıklamaları takip et
  useEffect(() => {
    const ensureField = (key: string) => {
      if (!interactionsRef.current.fields[key]) {
        interactionsRef.current.fields[key] = {
          focus: 0,
          blur: 0,
          input: 0,
          totalInputMs: 0,
          errors: 0,
        };
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const key = getFieldKey(target);
      ensureField(key);
      interactionsRef.current.fields[key].focus += 1;
      fieldActiveSinceRef.current[key] = Date.now();
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const key = getFieldKey(target);
      ensureField(key);
      interactionsRef.current.fields[key].blur += 1;
      const startedAt = fieldActiveSinceRef.current[key];
      if (startedAt) {
        interactionsRef.current.fields[key].totalInputMs += Date.now() - startedAt;
        delete fieldActiveSinceRef.current[key];
      }
    };

    const handleInput = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const key = getFieldKey(target);
      ensureField(key);
      interactionsRef.current.fields[key].input += 1;

      if (firstInputTimeRef.current === null) {
        firstInputTimeRef.current = Date.now();
        interactionsRef.current.timeToFirstInputMs = firstInputTimeRef.current - startTimeRef.current;
      }
    };

    const handleInvalid = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const key = getFieldKey(target);
      ensureField(key);
      interactionsRef.current.fields[key].errors += 1;
      if (firstErrorTimeRef.current === null) {
        firstErrorTimeRef.current = Date.now();
        interactionsRef.current.timeToFirstErrorMs = firstErrorTimeRef.current - startTimeRef.current;
      }
    };

    const handleScroll = () => {
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - doc.clientHeight;
        if (total <= 0) {
          scrollTickingRef.current = false;
          return;
        }
        const depth = Math.min(100, Math.round(((window.scrollY + doc.clientHeight) / doc.scrollHeight) * 100));
        const scrollMetrics = interactionsRef.current.scroll;
        if (!scrollMetrics.firstScrollAtMs) {
          scrollMetrics.firstScrollAtMs = Date.now() - startTimeRef.current;
        }
        if (depth > scrollMetrics.maxDepthPercent) {
          scrollMetrics.maxDepthPercent = depth;
        }
        const elapsed = Date.now() - startTimeRef.current;
        if (depth >= 50 && !scrollMetrics.timeTo50PercentMs) {
          scrollMetrics.timeTo50PercentMs = elapsed;
        }
        if (depth >= 90 && !scrollMetrics.timeTo90PercentMs) {
          scrollMetrics.timeTo90PercentMs = elapsed;
        }
        scrollTickingRef.current = false;
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const now = Date.now();
      if (now - lastClickTsRef.current < 120) return; // throttle bursts
      lastClickTsRef.current = now;

      const key = target.getAttribute('data-interaction-key')
        || getFieldKey(target)
        || (target.textContent ? target.textContent.slice(0, 40).trim() : target.tagName.toLowerCase());
      interactionsRef.current.clicks[key] = (interactionsRef.current.clicks[key] || 0) + 1;
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('invalid', handleInvalid, true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('invalid', handleInvalid, true);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick, true);
    };
  }, [getFieldKey]);

  // Sepet değişimlerini takip et (adet değişimi / silme / değer değişimi)
  useEffect(() => {
    if (!hasCartChangeInitializedRef.current) {
      hasCartChangeInitializedRef.current = true;
      lastCartItemsRef.current = items;
      return;
    }

    const prevMap = new Map<number, number>();
    lastCartItemsRef.current.forEach(item => prevMap.set(item.product.id, item.quantity));

    let quantityChanges = 0;
    let removals = 0;

    items.forEach(item => {
      const prevQty = prevMap.get(item.product.id);
      if (prevQty === undefined) {
        quantityChanges += 1;
      } else if (prevQty !== item.quantity) {
        quantityChanges += 1;
      }
      prevMap.delete(item.product.id);
    });

    removals = prevMap.size;

    if (quantityChanges > 0) {
      interactionsRef.current.cart.quantityChanges += quantityChanges;
    }

    if (removals > 0) {
      interactionsRef.current.cart.removals += removals;
    }

    const newTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    interactionsRef.current.cart.valueChange = newTotal - baseCartTotalRef.current;

    lastCartItemsRef.current = items;
  }, [items]);

  // Abandonment verisini hazırla
  const prepareAbandonmentData = useCallback((): CartAbandonmentData | null => {
    if (items.length === 0) return null;
    
    const now = Date.now();
    const totalSeconds = Math.round((now - startTimeRef.current) / 1000);
    
    // Mevcut adımın süresini güncelle
    const currentStepTime = Math.round((now - stepStartTimeRef.current) / 1000);
    if (currentStep !== 'success') {
      stepTimesRef.current[currentStep] += currentStepTime;
    }

    // Aktif alan sürelerini flush et
    Object.entries(fieldActiveSinceRef.current).forEach(([key, startedAt]) => {
      const metrics = interactionsRef.current.fields[key];
      if (metrics && startedAt) {
        metrics.totalInputMs += now - startedAt;
      }
      delete fieldActiveSinceRef.current[key];
    });
    
    // Minimum süre kontrolü
    if (totalSeconds < minAbandonTime) return null;
    
    // Adres formuna ulaşmış olmalı (recipient adımına geçmiş olmalı)
    if (!hasReachedAddressFormRef.current) return null;
    
    // Step sürelerini normalize et (toplamı toplam süreyi aşmasın)
    const normalizedStepTimes = (() => {
      const times = { ...stepTimesRef.current };
      Object.keys(times).forEach((key) => {
        const val = times[key as keyof typeof times];
        times[key as keyof typeof times] = Number.isFinite(val) && val > 0 ? val : 0;
        if (times[key as keyof typeof times] > totalSeconds) {
          times[key as keyof typeof times] = totalSeconds;
        }
      });
      const sum = Object.values(times).reduce((acc, v) => acc + v, 0);
      if (sum > totalSeconds && sum > 0) {
        const ratio = totalSeconds / sum;
        Object.keys(times).forEach((key) => {
          times[key as keyof typeof times] = Math.max(0, Math.round(times[key as keyof typeof times] * ratio));
        });
      }
      return times;
    })();

    const { visitorId, sessionId } = getSessionInfo();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();
    const filledFields = getFilledFields();
    
    return {
      visitorId,
      sessionId,
      customerId: customerId || undefined,
      customerEmail,
      customerPhone,
      cartItems: items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      cartTotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      cartItemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      reachedStep: currentStep === 'success' ? 'payment' : currentStep,
      reachedAddressForm: hasReachedAddressFormRef.current,
      filledFields,
      timeOnCartSeconds: normalizedStepTimes.cart,
      timeOnRecipientSeconds: normalizedStepTimes.recipient,
      timeOnMessageSeconds: normalizedStepTimes.message,
      timeOnPaymentSeconds: normalizedStepTimes.payment,
      totalCheckoutSeconds: totalSeconds,
      selectedDistrict: district,
      selectedNeighborhood: neighborhood,
      selectedDeliveryDate: deliveryDate,
      ...deviceInfo,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      utmSource: utmParams.utm_source,
      utmMedium: utmParams.utm_medium,
      utmCampaign: utmParams.utm_campaign,
      landingPage: typeof window !== 'undefined' ? sessionStorage.getItem('vadiler_landing_page') || undefined : undefined,
      startedAt: new Date(startTimeRef.current).toISOString(),
      interactions: interactionsRef.current,
    };
  }, [items, currentStep, customerId, customerEmail, customerPhone, district, neighborhood, deliveryDate, minAbandonTime, getSessionInfo, getDeviceInfo, getUTMParams, getFilledFields]);

  // Abandonment verisini gönder
  const sendAbandonment = useCallback(() => {
    // Zaten gönderildiyse veya tamamlandıysa gönderme
    if (hasSentAbandonmentRef.current || isCompletedRef.current) return;
    
    const data = prepareAbandonmentData();
    if (!data) return;
    
    hasSentAbandonmentRef.current = true;
    
    // Beacon API ile gönder (sayfa kapansa bile çalışır)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/cart-abandonment', blob);
    } else {
      // Fallback: fetch ile gönder
      fetch('/api/analytics/cart-abandonment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  }, [prepareAbandonmentData]);

  // Adım değişikliklerini takip et
  useEffect(() => {
    if (lastStepRef.current !== currentStep) {
      const now = Date.now();
      const stepDuration = Math.round((now - stepStartTimeRef.current) / 1000);
      
      // Önceki adımın süresini kaydet
      if (lastStepRef.current !== 'success') {
        stepTimesRef.current[lastStepRef.current as keyof typeof stepTimesRef.current] += stepDuration;
      }
      
      // Yeni adımın başlangıç zamanını güncelle
      stepStartTimeRef.current = now;
      lastStepRef.current = currentStep;
      
      // Adres formuna ulaştı mı kontrol et (recipient adımına geçtiyse)
      if (currentStep === 'recipient' || currentStep === 'message' || currentStep === 'payment') {
        hasReachedAddressFormRef.current = true;
      }
      
      // Başarıyla tamamlandı
      if (currentStep === 'success') {
        isCompletedRef.current = true;
      }
    }
  }, [currentStep]);

  // Sayfa kapatılırken/değiştiğinde gönder
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendAbandonment();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendAbandonment();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendAbandonment]);

  // Pathname değişirse (başka sayfaya giderse) gönder
  useEffect(() => {
    if (pathname !== '/sepet') {
      sendAbandonment();
    }
  }, [pathname, sendAbandonment]);

  // Cleanup - component unmount olursa
  useEffect(() => {
    return () => {
      if (!isCompletedRef.current) {
        sendAbandonment();
      }
    };
  }, [sendAbandonment]);

  // Tamamlandı olarak işaretle (sipariş başarılı olduğunda çağrılacak)
  const markAsCompleted = useCallback(() => {
    isCompletedRef.current = true;
  }, []);

  // Reset (yeni sepet oturumu için)
  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
    stepStartTimeRef.current = Date.now();
    stepTimesRef.current = { cart: 0, recipient: 0, message: 0, payment: 0 };
    lastStepRef.current = 'cart';
    hasReachedAddressFormRef.current = false;
    hasSentAbandonmentRef.current = false;
    isCompletedRef.current = false;
    interactionsRef.current = {
      fields: {},
      scroll: { maxDepthPercent: 0 },
      clicks: {},
      cart: { quantityChanges: 0, removals: 0, valueChange: 0 },
    };
    fieldActiveSinceRef.current = {};
    firstInputTimeRef.current = null;
    firstErrorTimeRef.current = null;
    baseCartTotalRef.current = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    lastCartItemsRef.current = items;
    hasCartChangeInitializedRef.current = true;
  }, []);

  return {
    markAsCompleted,
    reset,
    getTotalTime: () => Math.round((Date.now() - startTimeRef.current) / 1000),
    getStepTimes: () => ({ ...stepTimesRef.current }),
    hasReachedAddressForm: () => hasReachedAddressFormRef.current,
  };
}

export default useCartAbandonmentTracker;
