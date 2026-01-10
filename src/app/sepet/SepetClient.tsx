'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useCustomer, Address } from '@/context/CustomerContext';
import { useOrder } from '@/context/OrderContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Header, Footer, MobileNavBar } from '@/components';
import { getMediaType } from '@/components/admin/MediaUpload';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  MapPin, 
  User, 
  Phone, 
  Home, 
  MessageSquare,
  CreditCard,
  Check,
  ArrowLeft,
  CheckCircle,
  Package,
  Loader2,
  FileText,
  Star,
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import { BorderBeam, GlassCard, SpotlightCard } from '@/components/ui-kit/premium';
import { getNeighborhoods, getDistricts, type Neighborhood } from '@/data/turkiye-api';
import GiftMessagePreview from '@/components/checkout/GiftMessagePreview';

// İstanbul bölgeleri (DeliverySelector'dan)
const ISTANBUL_REGIONS = [
  { 
    id: 'avrupa', 
    name: 'İstanbul (Avrupa)', 
    districts: [
      'Arnavutköy', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir',
      'Bayrampaşa', 'Beşiktaş', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca',
      'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören',
      'Kağıthane', 'Küçükçekmece', 'Sarıyer', 'Silivri', 'Sultangazi', 'Şişli',
      'Zeytinburnu'
    ]
  },
  { 
    id: 'anadolu', 
    name: 'İstanbul (Anadolu)', 
    districts: [
      'Adalar', 'Ataşehir', 'Beykoz', 'Çekmeköy', 'Kadıköy', 'Kartal', 'Maltepe',
      'Pendik', 'Sancaktepe', 'Sultanbeyli', 'Şile', 'Tuzla', 'Ümraniye', 'Üsküdar'
    ]
  },
];

// Dinamik kapatma ayarları (admin panelinden)
type DisabledNeighborhoodsMap = Record<string, string[]>;
const DEFAULT_DISABLED_DISTRICTS = ['Çatalca', 'Silivri', 'Büyükçekmece'];
const DEFAULT_DISABLED_NEIGHBORHOODS: DisabledNeighborhoodsMap = {
  'Arnavutköy': [
    'Hacımaşlı', 'Yavuz Selim', 'Mehmet Akif Ersoy', 'Hastane', 'Çilingir', 'Fatih',
    'Sazlıbosna', 'Deliklikaya', 'Yeşilbayır', 'Nenehatun', 'Boğazköy İstiklal', 'Hadımköy',
    'Yassıören', 'Baklalı', 'Nakkaş', 'Tayakadın', 'Balaban', 'Yeniköy', 'Boyalık',
    'Dursunköy', 'Karaburun', 'Durusu', 'Terkos'
  ]
};

const EUROPE_DISTRICTS = ISTANBUL_REGIONS[0].districts;

const DELIVERY_OFF_DAY_ERROR_MESSAGE = 'Yoğunluk sebebiyle bu tarihte teslimat yapılamamaktadır. Lütfen başka bir tarih seçin.';
const SUNDAY_BLOCK_ERROR_MESSAGE = 'Pazar günleri teslimat yapılamamaktadır. Lütfen başka bir tarih seçin.';
const NO_AVAILABLE_DELIVERY_DATE_ERROR_MESSAGE = 'Seçilen aralıkta uygun teslimat günü bulunamadı. Lütfen daha sonra tekrar deneyin veya bizimle iletişime geçin.';

type CheckoutStep = 'cart' | 'recipient' | 'message' | 'payment' | 'success';

type ValidationResult = {
  ok: boolean;
  firstId?: string;
  message?: string;
};

type RecipientErrors = {
  name?: string;
  location?: string;
  neighborhood?: string;
  address?: string;
  streetName?: string;
  buildingNo?: string;
  apartmentNo?: string;
  date?: string;
  time?: string;
  sender?: string;
};

export default function SepetClient() {
  const { state, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { state: customerState, addOrderToCustomer, addAddress } = useCustomer();
  const { createOrder } = useOrder();
  const { trackEvent, trackBeginCheckout } = useAnalytics();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: number; id: string } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [istanbulSide, setIstanbulSide] = useState<'avrupa' | ''>('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState(0);
  const [neighborhood, setNeighborhood] = useState('');
  const [isAnadoluClosed, setIsAnadoluClosed] = useState(true);
  // Detaylı adres alanları
  const [streetName, setStreetName] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [apartmentNo, setApartmentNo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryDateNotice, setDeliveryDateNotice] = useState<string | null>(null);
  const DEFAULT_DELIVERY_TIME_SLOT = '11:00-17:00';
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(DEFAULT_DELIVERY_TIME_SLOT);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const isGift = true; // tüm siparişler hediye kabul edilir
  const [senderName, setSenderName] = useState('');
  const [messageCard, setMessageCard] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  // Location dropdown states
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'region' | 'district'>('region');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [closedWarning, setClosedWarning] = useState<string | null>(null);
  
  // Saved address selection
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);
  const [addressTitle, setAddressTitle] = useState('');
  
  // Payment states
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferOrderNumber, setBankTransferOrderNumber] = useState<number | null>(null);
  const [bankTransferOrderId, setBankTransferOrderId] = useState<string | null>(null);
  const [bankTransferTotal, setBankTransferTotal] = useState<number>(0);
  
  // 3DS states removed - using separate page instead of modal
  
  // Guest checkout mode selection
  const [checkoutMode, setCheckoutMode] = useState<'undecided' | 'guest' | 'login' | 'register'>('undecided');
  const [checkoutModeError, setCheckoutModeError] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPhoneError, setGuestPhoneError] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');
  const [recipientErrors, setRecipientErrors] = useState<RecipientErrors>({});
  const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [lastPaymentBanner, setLastPaymentBanner] = useState<null | { status: 'failed' | 'abandoned'; message?: string }>(null);
  const [deliveryOffDayDialog, setDeliveryOffDayDialog] = useState<string | null>(null);
  
  // Inline login/register states
  const [inlineLoginEmail, setInlineLoginEmail] = useState('');
  const [inlineLoginPassword, setInlineLoginPassword] = useState('');
  const [inlineRegisterName, setInlineRegisterName] = useState('');
  const [inlineRegisterEmail, setInlineRegisterEmail] = useState('');
  const [inlineRegisterPhone, setInlineRegisterPhone] = useState('');
  const [inlineRegisterPassword, setInlineRegisterPassword] = useState('');
  const [inlineOtpId, setInlineOtpId] = useState('');
  const [inlineOtpEmail, setInlineOtpEmail] = useState('');
  const [inlineOtpCode, setInlineOtpCode] = useState('');
  const [inlineOtpPurpose, setInlineOtpPurpose] = useState<'login' | 'register'>('login');
  const [inlineAuthLoading, setInlineAuthLoading] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState('');
  const [inlineAuthStep, setInlineAuthStep] = useState<'form' | 'otp'>('form');
  
  // Searchable neighborhood dropdown
  const [neighborhoodSearchOpen, setNeighborhoodSearchOpen] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');
  const neighborhoodInputRef = useRef<HTMLInputElement>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchActiveRef = useRef(false);

  const [deliveryOffDays, setDeliveryOffDays] = useState<string[]>([]);

  // Dynamic region blocks from admin settings
  const [disabledDistricts, setDisabledDistricts] = useState<string[]>(DEFAULT_DISABLED_DISTRICTS);
  const [disabledNeighborhoodsMap, setDisabledNeighborhoodsMap] = useState<DisabledNeighborhoodsMap>(DEFAULT_DISABLED_NEIGHBORHOODS);

  const isEmpty = state.items.length === 0;
  const isLoggedIn = !!customerState.currentCustomer;

  const getTomorrowLocalISODate = (): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMaxDeliveryDate = (): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 7); // 7 gün sonrası
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const MIN_DELIVERY_DATE = getTomorrowLocalISODate();
  const MAX_DELIVERY_DATE = getMaxDeliveryDate();

  const deliveryOffDaySet = useMemo(() => new Set(deliveryOffDays), [deliveryOffDays]);

  // Hydration fix
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadDeliveryOffDays = async () => {
      try {
        const response = await fetch('/api/delivery-off-days', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load delivery off days: ${response.status}`);
        }
        const payload = await response.json();
        if (!isMounted) return;
        const dates = Array.isArray(payload?.offDays)
          ? payload.offDays
              .map((item: { offDate?: string | null }) => (typeof item?.offDate === 'string' ? item.offDate : null))
              .filter((date): date is string => Boolean(date))
          : [];
        setDeliveryOffDays(dates);
      } catch (error) {
        if ((error as Error)?.name === 'AbortError' || !isMounted) {
          return;
        }
        console.error('Teslimat off günleri alınamadı:', error);
      }
    };

    loadDeliveryOffDays();

    // Load region block settings
    const loadRegionBlocks = async () => {
      try {
        const res = await fetch('/api/admin/settings?category=delivery', { cache: 'no-store' });
        if (!res.ok) return; // keep defaults
        const payload = await res.json();
        const cat = payload?.settings || payload?.category?.settings || {};
        const dd = Array.isArray(cat?.disabled_districts) ? (cat.disabled_districts as string[]) : DEFAULT_DISABLED_DISTRICTS;
        const dmap = typeof cat?.disabled_neighborhoods_by_district === 'object' && cat?.disabled_neighborhoods_by_district !== null
          ? (cat.disabled_neighborhoods_by_district as DisabledNeighborhoodsMap)
          : DEFAULT_DISABLED_NEIGHBORHOODS;
        setDisabledDistricts(dd);
        setDisabledNeighborhoodsMap(dmap);
        const anadolu = typeof cat?.is_anadolu_closed === 'boolean' ? !!cat.is_anadolu_closed : true;
        setIsAnadoluClosed(anadolu);
      } catch {}
    };

    loadRegionBlocks();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Detect last payment status and show resume banner (without forcing step change)
  useEffect(() => {
    try {
      const last = localStorage.getItem('vadiler_last_payment_status');
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed?.status === 'failed') {
          setLastPaymentBanner({ status: 'failed', message: parsed?.message || 'Ödeme işlemi tamamlanamadı' });
        }
        localStorage.removeItem('vadiler_last_payment_status');
        return;
      }

      const started = localStorage.getItem('vadiler_checkout_started');
      if (started) {
        // Payment flow started earlier but user is back to cart; treat as abandoned
        setLastPaymentBanner({ status: 'abandoned', message: 'Ödeme işleminiz yarıda kalmış görünüyor.' });
      }
    } catch {}
  }, []);

  // handleSelectSavedAddress - useCallback ile optimize edilmiş
  // Kayıtlı adresin desteklenen bölgede olup olmadığını kontrol et
  const isAddressSupported = useCallback((addr: Address): boolean => {
    const isIstanbul = addr.province.toLowerCase().includes('istanbul') || addr.province.toLowerCase().includes('i̇stanbul');
    if (!isIstanbul) return false; // Şimdilik sadece İstanbul destekleniyor
    const isSupportedEurope = EUROPE_DISTRICTS.some(d => d.toLowerCase() === addr.district.toLowerCase()) && !disabledDistricts.includes(addr.district);
    return isSupportedEurope;
  }, []);

  const handleSelectSavedAddress = useCallback((addr: Address) => {
    setSelectedSavedAddress(addr);
    setRecipientName(addr.recipientName);
    setRecipientPhone(formatPhoneNumber(normalizeTrMobileDigits(addr.recipientPhone)));
    setPhoneError('');
    setSaveAddressToBook(false);
    setAddressTitle('');
    
    // Kayıtlı adresten location ve ilçe bilgilerini ayarla
    const isIstanbul = addr.province.toLowerCase().includes('istanbul') || addr.province.toLowerCase().includes('i̇stanbul');
    
    let warningMessage: string | null = null;
    
    if (isIstanbul) {
      // İstanbul için yaka belirleme
      const isSupportedEurope = EUROPE_DISTRICTS.some(d => d.toLowerCase() === addr.district.toLowerCase()) && !disabledDistricts.includes(addr.district);
      if (isSupportedEurope) {
        setIstanbulSide('avrupa');
        setSelectedLocation(`${addr.district}, İstanbul`);
        setClosedWarning(null);
      } else {
        // Destek dışı veya kapalı ilçe - kullanıcıya uyarı göster
        setIstanbulSide('');
        setSelectedLocation(`${addr.district}, İstanbul`);
        warningMessage = `${addr.district} bölgesine şu an teslimat yapılamamaktadır. Lütfen farklı bir adres girin.`;
        setClosedWarning(warningMessage);
      }
    } else {
      // İstanbul dışı iller - henüz desteklenmiyor
      setIstanbulSide('');
      setSelectedLocation(`${addr.district}, ${addr.province}`);
      warningMessage = `${addr.province} iline şu an teslimat yapılamamaktadır. Şimdilik sadece İstanbul Avrupa Yakası'na hizmet veriyoruz.`;
      setClosedWarning(warningMessage);
    }
    
    setDistrict(addr.district);
    setDistrictId(addr.districtId);
    setNeighborhood(addr.neighborhood);
    
    // Kayıtlı adres seçildiğinde detaylı alanları parse etmeye çalış veya fullAddress'i kullan
    // Eski formatı desteklemek için: detaylı alanları temizle, fullAddress'ten tahmin et
    // Format: "Sokak/Cadde No: X (Bina) Kat: Y Daire: Z" veya serbest format
    const fullAddr = addr.fullAddress || '';
    
    // Basit regex ile parse etmeye çalış
    const noMatch = fullAddr.match(/No:\s*([^,\(]+)/i);
    const daireMatch = fullAddr.match(/Daire:\s*([^,]+)/i);
    
    if (noMatch && daireMatch) {
      // Yeni format - parse edebiliyoruz
      // Sokak kısmını bul (No: öncesi)
      const noIndex = fullAddr.toLowerCase().indexOf('no:');
      const sokak = noIndex > 0 ? fullAddr.substring(0, noIndex).trim().replace(/,\s*$/, '') : '';
      
      setStreetName(sokak);
      setBuildingNo(noMatch[1]?.trim() || '');
      setApartmentNo(daireMatch[1]?.trim() || '');
    } else {
      // Eski format - tüm adresi sokak alanına koy, diğerlerini kullanıcı doldursun
      setStreetName(fullAddr);
      setBuildingNo('');
      setApartmentNo('');
    }
    
    setShowAddressForm(false);
    
    // Hataları temizle, ama desteklenmeyen bölge hatası varsa onu koru
    setRecipientErrors((prev) => ({
      ...prev,
      name: undefined,
      location: warningMessage || undefined, // Uyarı varsa location hatasını set et
      neighborhood: undefined,
      address: undefined,
      streetName: undefined,
      buildingNo: undefined,
      apartmentNo: undefined,
      date: undefined,
      time: undefined,
      sender: undefined,
    }));
  }, []);

  // Track view_cart when component mounts with items
  useEffect(() => {
    if (state.items.length > 0) {
      trackEvent({
        eventName: 'view_cart',
        eventCategory: 'ecommerce',
        properties: {
          cart_total: getTotalPrice(),
          cart_items: getTotalItems(),
          products: state.items.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          }))
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-populate guest phone from recipient phone on payment step
  useEffect(() => {
    if (currentStep === 'payment' && !isLoggedIn && recipientPhone && !guestPhone) {
      setGuestPhone(recipientPhone);
    }
  }, [currentStep, isLoggedIn, recipientPhone, guestPhone]);

  // Track checkout step changes
  useEffect(() => {
    if (currentStep === 'recipient') {
      // Sepet görüntülendi, alıcı bilgilerine geçildi
      trackEvent({
        eventName: 'checkout_step',
        eventCategory: 'ecommerce',
        eventLabel: 'recipient_info',
        eventValue: 1,
        properties: {
          step: 'recipient',
          step_number: 1,
          cart_total: getTotalPrice(),
          cart_items: getTotalItems(),
        },
      });
    } else if (currentStep === 'message') {
      trackEvent({
        eventName: 'checkout_step',
        eventCategory: 'ecommerce',
        eventLabel: 'message_card',
        eventValue: 2,
        properties: {
          step: 'message',
          step_number: 2,
          cart_total: getTotalPrice(),
          recipient_name: recipientName,
          delivery_district: district,
        },
      });
    } else if (currentStep === 'payment') {
      // Ödeme adımına geçildi - begin_checkout
      trackBeginCheckout({
        items: state.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total: getTotalPrice(),
      });
      
      trackEvent({
        eventName: 'checkout_step',
        eventCategory: 'ecommerce',
        eventLabel: 'payment',
        eventValue: 3,
        properties: {
          step: 'payment',
          step_number: 3,
          cart_total: getTotalPrice(),
          cart_items: getTotalItems(),
          is_gift: isGift,
          has_message: !!messageCard,
        },
      });
    }
  }, [currentStep]);

  // Adım değiştiğinde sayfayı en üste scroll et
  useEffect(() => {
    if (currentStep !== 'cart') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Safety: whenever checkout selection error becomes visible, scroll to top
  useEffect(() => {
    if (checkoutModeError) {
      scrollToTop();
    }
  }, [checkoutModeError]);

  const DELIVERY_TIME_SLOT_IDS = ['11:00-17:00', '17:00-22:00'] as const;
  type DeliveryTimeSlotId = (typeof DELIVERY_TIME_SLOT_IDS)[number];

  const normalizeDeliveryTimeSlot = (value: string): string => {
    if (!value) return '';
    // Accept inputs like "11:00 - 17:00" or en-dash and normalize to "11:00-17:00"
    let s = value.trim().replace(/–/g, '-');
    s = s.replace(/\s+/g, '');
    const m = s.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!m) return value.trim();
    const pad = (t: string) => {
      const [hh, mm] = t.split(':');
      return `${String(hh).padStart(2, '0')}:${mm}`;
    };
    return `${pad(m[1])}-${pad(m[2])}`;
  };

  const isValidDeliveryTimeSlot = (value: string): value is DeliveryTimeSlotId => {
    const normalized = normalizeDeliveryTimeSlot(value);
    return (DELIVERY_TIME_SLOT_IDS as readonly string[]).includes(normalized);
  };

  const formatLocalISODate = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseLocalISODate = (iso: string): Date | null => {
    if (!iso) return null;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p))) return null;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    return Number.isFinite(date.getTime()) ? date : null;
  };

  const shiftLocalISODate = (iso: string, days: number): string | null => {
    const date = parseLocalISODate(iso);
    if (!date) return null;
    date.setDate(date.getDate() + days);
    return formatLocalISODate(date);
  };

  const clampIsoToDeliveryWindow = (iso: string): string => {
    if (iso < MIN_DELIVERY_DATE) return MIN_DELIVERY_DATE;
    if (iso > MAX_DELIVERY_DATE) return MAX_DELIVERY_DATE;
    return iso;
  };

  // Helper: check if a YYYY-MM-DD local ISO date string is a Sunday (Pazar)
  const isLocalIsoDateSunday = (iso: string): boolean => {
    if (!iso) return false;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(p => !Number.isFinite(p))) return false;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d).getDay() === 0;
  };

  const isDeliveryDateBlocked = useCallback(
    (iso: string): boolean => {
      if (!iso) return false;
      return isLocalIsoDateSunday(iso) || deliveryOffDaySet.has(iso);
    },
    [deliveryOffDaySet]
  );

  const getBlockedDeliveryMessage = useCallback(
    (iso: string): string | null => {
      if (!iso) return null;
      if (deliveryOffDaySet.has(iso)) return DELIVERY_OFF_DAY_ERROR_MESSAGE;
      if (isLocalIsoDateSunday(iso)) return SUNDAY_BLOCK_ERROR_MESSAGE;
      return null;
    },
    [deliveryOffDaySet]
  );

  const getNextAllowedDeliveryDate = useCallback(
    (preferred?: string | null): string | null => {
      let candidate = preferred && parseLocalISODate(preferred) ? clampIsoToDeliveryWindow(preferred) : MIN_DELIVERY_DATE;
      for (let i = 0; i < 10; i += 1) {
        if (candidate > MAX_DELIVERY_DATE) break;
        if (!isDeliveryDateBlocked(candidate)) {
          return candidate;
        }
        const next = shiftLocalISODate(candidate, 1);
        if (!next) break;
        candidate = next;
      }
      return null;
    },
    [isDeliveryDateBlocked, MIN_DELIVERY_DATE, MAX_DELIVERY_DATE]
  );

  const applyManualDeliveryDate = useCallback(
    (raw: string) => {
      if (!raw) {
        setDeliveryDate('');
        setDeliveryDateNotice(null);
        setRecipientErrors((prev) => ({ ...prev, date: undefined }));
        return;
      }

      if (!parseLocalISODate(raw)) {
        setRecipientErrors((prev) => ({ ...prev, date: 'Geçersiz tarih seçildi' }));
        return;
      }

      let bounded = raw;
      let notice: string | null = null;
      if (bounded < MIN_DELIVERY_DATE) {
        bounded = MIN_DELIVERY_DATE;
      } else if (bounded > MAX_DELIVERY_DATE) {
        bounded = MAX_DELIVERY_DATE;
        notice = 'Teslimat tarihi en fazla 7 gün sonrası seçilebilir. Sizi uygun güne yönlendirdik.';
      }

      // If selected day is offlined from panel, block with modal and do not auto-shift
      if (deliveryOffDaySet.has(bounded)) {
        const msg = DELIVERY_OFF_DAY_ERROR_MESSAGE;
        setDeliveryDate(bounded);
        setDeliveryDateNotice(null);
        setRecipientErrors((prev) => ({ ...prev, date: msg }));
        setDeliveryOffDayDialog(msg);
        return;
      }

      const fallback = getNextAllowedDeliveryDate(bounded);
      if (!fallback) {
        setDeliveryDate('');
        setDeliveryDateNotice(null);
        setRecipientErrors((prev) => ({ ...prev, date: NO_AVAILABLE_DELIVERY_DATE_ERROR_MESSAGE }));
        return;
      }

      if (!notice && fallback !== raw) {
        notice = getBlockedDeliveryMessage(raw);
      }

      setDeliveryDate(fallback);
      setDeliveryDateNotice(notice);
      setRecipientErrors((prev) => ({ ...prev, date: undefined }));
    },
    [getNextAllowedDeliveryDate, MIN_DELIVERY_DATE, MAX_DELIVERY_DATE, getBlockedDeliveryMessage, deliveryOffDaySet]
  );

  useEffect(() => {
    if (!deliveryDate) {
      setRecipientErrors((prev) => (prev.date ? { ...prev, date: undefined } : prev));
      return;
    }

    if (deliveryDate < MIN_DELIVERY_DATE) {
      return;
    }

    if (deliveryDate > MAX_DELIVERY_DATE) {
      setRecipientErrors((prev) => ({ ...prev, date: 'Teslimat tarihi en fazla 7 gün sonrası seçilebilir' }));
      return;
    }

    if (isDeliveryDateBlocked(deliveryDate)) {
      const msg = getBlockedDeliveryMessage(deliveryDate) || DELIVERY_OFF_DAY_ERROR_MESSAGE;
      setRecipientErrors((prev) => ({ ...prev, date: msg }));
    } else {
      setRecipientErrors((prev) => (prev.date ? { ...prev, date: undefined } : prev));
    }
  }, [deliveryDate, isDeliveryDateBlocked, MIN_DELIVERY_DATE, MAX_DELIVERY_DATE, getBlockedDeliveryMessage]);

  useEffect(() => {
    if (!deliveryDate) {
      setDeliveryDateNotice(null);
      return;
    }

    let target = deliveryDate;
    let notice: string | null = null;

    if (deliveryDate < MIN_DELIVERY_DATE) {
      target = MIN_DELIVERY_DATE;
    } else if (deliveryDate > MAX_DELIVERY_DATE) {
      target = MAX_DELIVERY_DATE;
      notice = 'Teslimat tarihi en fazla 7 gün sonrası seçilebilir. Sizi uygun güne yönlendirdik.';
    } else if (isDeliveryDateBlocked(deliveryDate)) {
      notice = getBlockedDeliveryMessage(deliveryDate);
    } else {
      return;
    }

    const fallback = getNextAllowedDeliveryDate(target);
    if (!fallback) {
      if (deliveryDate !== '') {
        setDeliveryDate('');
      }
      setDeliveryDateNotice(null);
      setRecipientErrors((prev) => ({ ...prev, date: NO_AVAILABLE_DELIVERY_DATE_ERROR_MESSAGE }));
      return;
    }

    if (fallback !== deliveryDate) {
      setDeliveryDate(fallback);
      setDeliveryDateNotice(notice ?? 'Teslimat tarihi güncellendi.');
      setRecipientErrors((prev) => ({ ...prev, date: undefined }));
    }
  }, [deliveryDate, MIN_DELIVERY_DATE, MAX_DELIVERY_DATE, getNextAllowedDeliveryDate, isDeliveryDateBlocked, getBlockedDeliveryMessage]);

  // Global delivery info'dan teslimat bilgilerini yükle (ürün detay sayfasından seçilen)
  useEffect(() => {
    if (state.globalDeliveryInfo) {
      const { location, district: globalDistrict, date, timeSlot } = state.globalDeliveryInfo;
      
      // Lokasyon bilgisini ayarla
      if (location) {
        // İlçe ve yaka bilgisini ayarla (sadece Avrupa yakası destekleniyor)
        if (globalDistrict && EUROPE_DISTRICTS.some(d => d.toLowerCase() === globalDistrict.toLowerCase()) && !disabledDistricts.includes(globalDistrict)) {
          setSelectedLocation(location);
          setDistrict(globalDistrict);
          setIstanbulSide('avrupa');
        } else {
          // Desteklenmeyen veya geçici kapalı ilçe ise sıfırla
          setSelectedLocation(null);
          setDistrict('');
          setIstanbulSide('');
        }
      }
      
      // Tarih bilgisini ayarla
      if (date) {
        const dateObj = new Date(date);
        const formattedDate = formatLocalISODate(dateObj);
        const bounded = formattedDate < MIN_DELIVERY_DATE
          ? MIN_DELIVERY_DATE
          : formattedDate > MAX_DELIVERY_DATE
            ? MAX_DELIVERY_DATE
            : formattedDate;
        const fallback = getNextAllowedDeliveryDate(bounded);
        if (fallback) {
          setDeliveryDate(fallback);
          setRecipientErrors((prev) => ({ ...prev, date: undefined }));
          if (fallback !== bounded) {
            setDeliveryDateNotice('Seçilen tarih artık uygun değil; en yakın müsait güne yönlendirildiniz.');
          }
        } else {
          setDeliveryDate('');
          setDeliveryDateNotice(null);
          setRecipientErrors((prev) => ({ ...prev, date: NO_AVAILABLE_DELIVERY_DATE_ERROR_MESSAGE }));
        }
      }
      
      // Zaman dilimi bilgisini ayarla
      if (timeSlot) {
        setDeliveryTimeSlot(normalizeDeliveryTimeSlot(timeSlot));
      }
    }
  }, [state.globalDeliveryInfo, getNextAllowedDeliveryDate, MIN_DELIVERY_DATE, MAX_DELIVERY_DATE]);
  
  // Kayıtlı müşteri varsayılan adresini yükle (global delivery yoksa)
  useEffect(() => {
    if (customerState.currentCustomer && customerState.currentCustomer.addresses.length > 0) {
      const defaultAddr = customerState.currentCustomer.addresses.find(a => a.isDefault) || customerState.currentCustomer.addresses[0];
      if (defaultAddr) {
        handleSelectSavedAddress(defaultAddr);
      }
    } else {
      setShowAddressForm(true);
    }
  }, [customerState.currentCustomer, handleSelectSavedAddress]);

  // Click outside handler for location dropdown
  useEffect(() => {
    if (!isLocationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById('location-dropdown');
      const trigger = document.getElementById('delivery-location');
      
      if (dropdown && !dropdown.contains(target) && trigger && !trigger.contains(target)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationOpen]);

  // Click outside handler for neighborhood dropdown
  useEffect(() => {
    if (!neighborhoodSearchOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.getElementById('neighborhood-dropdown');
      const input = neighborhoodInputRef.current;
      
      if (dropdown && !dropdown.contains(target) && input && !input.contains(target)) {
        setNeighborhoodSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [neighborhoodSearchOpen]);

  // Mobile edge swipe: navigate steps with left/right flicks from screen edges
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 1024) return; // only mobile/tablet
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      const edgeZone = 28;
      const isEdge = t.clientX <= edgeZone || t.clientX >= window.innerWidth - edgeZone;
      if (!isEdge) return;
      touchActiveRef.current = true;
      touchStartXRef.current = t.clientX;
      touchStartYRef.current = t.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchActiveRef.current) return;
      touchActiveRef.current = false;
      if (window.innerWidth > 1024) return;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - touchStartXRef.current;
      const dy = t.clientY - touchStartYRef.current;
      const minDistance = 70;
      const maxOffAxis = 50;
      if (Math.abs(dx) < minDistance || Math.abs(dy) > maxOffAxis) return;
      if (dx > 0) {
        handleEdgeSwipe('prev');
      } else {
        handleEdgeSwipe('next');
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleEdgeSwipe]);

  // LocalStorage'dan form verilerini yükle (sayfa yüklendiğinde)
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('vadiler_sepet_form');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Sadece kullanıcı giriş yapmamışsa veya kayıtlı adres seçilmemişse yükle
        if (!customerState.currentCustomer || !selectedSavedAddress) {
          if (parsed.recipientName) setRecipientName(parsed.recipientName);
          if (parsed.recipientPhone) setRecipientPhone(parsed.recipientPhone);
          if (parsed.recipientAddress) setRecipientAddress(parsed.recipientAddress);
          if (parsed.istanbulSide) setIstanbulSide(parsed.istanbulSide);
          if (parsed.district) setDistrict(parsed.district);
          if (parsed.districtId) setDistrictId(parsed.districtId);
          if (parsed.neighborhood) setNeighborhood(parsed.neighborhood);
          if (parsed.selectedLocation) setSelectedLocation(parsed.selectedLocation);
          if (parsed.deliveryDate) setDeliveryDate(parsed.deliveryDate);
          if (parsed.deliveryTimeSlot) {
            const normalized = normalizeDeliveryTimeSlot(parsed.deliveryTimeSlot);
            setDeliveryTimeSlot(isValidDeliveryTimeSlot(normalized) ? normalized : DEFAULT_DELIVERY_TIME_SLOT);
          }
          if (parsed.deliveryNotes) setDeliveryNotes(parsed.deliveryNotes);
          if (parsed.senderName) setSenderName(parsed.senderName);
          if (parsed.messageCard) setMessageCard(parsed.messageCard);
          if (parsed.guestEmail) setGuestEmail(parsed.guestEmail);
          if (parsed.guestPhone) setGuestPhone(parsed.guestPhone);
        }
      }
    } catch (error) {
      console.error('Form verilerini yüklerken hata:', error);
    }
  }, []);

  // If cart is empty but payment was started/failed, keep data and clear flags
  useEffect(() => {
    if (state.items.length === 0) {
      try {
        localStorage.removeItem('vadiler_checkout_started');
        localStorage.removeItem('vadiler_last_payment_status');
      } catch {}
    }
  }, [state.items.length]);

  // Set earliest available delivery date by default (usually tomorrow)
  useEffect(() => {
    if (deliveryDate || state.items.length === 0) return;
    const fallback = getNextAllowedDeliveryDate();
    if (fallback) {
      setDeliveryDate(fallback);
      setDeliveryDateNotice(null);
      setRecipientErrors((prev) => ({ ...prev, date: undefined }));
    }
  }, [deliveryDate, getNextAllowedDeliveryDate, state.items.length]);

  // Form verilerini localStorage'a kaydet (değiştiğinde)
  useEffect(() => {
    // Sadece sepet boş değilse ve success adımında değilse kaydet
    if (state.items.length === 0 || currentStep === 'success') return;

    try {
      const formData = {
        recipientName,
        recipientPhone,
        recipientAddress,
        istanbulSide,
        district,
        districtId,
        neighborhood,
        selectedLocation,
        deliveryDate,
        deliveryTimeSlot,
        deliveryNotes,
        senderName,
        messageCard,
        guestEmail,
        guestPhone,
        timestamp: Date.now()
      };
      localStorage.setItem('vadiler_sepet_form', JSON.stringify(formData));
    } catch (error) {
      console.error('Form verilerini kaydederken hata:', error);
    }
  }, [
    recipientName,
    recipientPhone,
    recipientAddress,
    istanbulSide,
    district,
    districtId,
    neighborhood,
    selectedLocation,
    deliveryDate,
    deliveryTimeSlot,
    deliveryNotes,
    senderName,
    messageCard,
    guestEmail,
    guestPhone,
    state.items.length,
    currentStep
  ]);

  const normalizeTrMobileDigits = (phone: string): string => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length >= 12) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('0') && digits.length >= 11) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) {
      // Never shift by taking the last 10 digits; just cap extras.
      digits = digits.slice(0, 10);
    }
    return digits;
  };

  // Location dropdown handlers
  const handleRegionSelect = (regionId: 'avrupa') => {
    setIstanbulSide(regionId);
    setLocationStep('district');
    setLocationSearch('');
    setRecipientErrors((prev) => ({ ...prev, location: undefined }));
  };

  const handleDistrictSelect = async (districtName: string) => {
    if (disabledDistricts.includes(districtName)) {
      setClosedWarning(districtName);
      setTimeout(() => setClosedWarning(null), 3500);
      return;
    }
    setDistrict(districtName);
    const region = ISTANBUL_REGIONS.find(r => r.id === istanbulSide);
    setSelectedLocation(`${districtName}, ${region?.name}`);
    setIsLocationOpen(false);
    setLocationSearch('');
    setLocationStep('region');
    setRecipientErrors((prev) => ({ ...prev, location: undefined, neighborhood: undefined }));
    
    // API'den İstanbul ilçelerini çekip, gerçek ilçe ID'sini bul
    setLoadingNeighborhoods(true);
    try {
      // İstanbul il ID'si = 34
      const istanbulDistricts = await getDistricts(34);
      const districtData = istanbulDistricts.find(d => d.name === districtName);
      if (districtData) {
        setDistrictId(districtData.id);
        const neighborhoods = await getNeighborhoods(districtData.id);
        setNeighborhoodSuggestions(neighborhoods);
      } else {
        setNeighborhoodSuggestions([]);
      }
    } catch (error) {
      console.error('Mahalle yüklenirken hata:', error);
      setNeighborhoodSuggestions([]);
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  const resetLocationSelection = () => {
    setIstanbulSide('');
    setDistrict('');
    setDistrictId(0);
    setNeighborhood('');
    setSelectedLocation(null);
    setLocationStep('region');
    setLocationSearch('');
    setRecipientErrors((prev) => ({ ...prev, location: undefined, neighborhood: undefined }));
  };

  // Filtered regions and districts
  const filteredRegions = ISTANBUL_REGIONS.filter(r =>
    r.name.toLowerCase().includes(locationSearch.toLowerCase())
  );
  
  const currentRegion = ISTANBUL_REGIONS.find(r => r.id === istanbulSide);
  const filteredDistricts = currentRegion?.districts.filter(d =>
    d.toLowerCase().includes(locationSearch.toLowerCase())
  ) || [];

  // Türkiye telefon numarası validasyonu
  const validatePhoneNumber = (phone: string): boolean => {
    const digits = normalizeTrMobileDigits(phone);
    // 5 ile başlamalı ve 10 haneli olmalı
    return /^5[0-9]{9}$/.test(digits);
  };

  // Telefon numarası formatlama (5XX XXX XX XX)
  const formatPhoneNumber = (value: string): string => {
    const digits = normalizeTrMobileDigits(value).slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = normalizeTrMobileDigits(value);
    
    // Maksimum 10 rakam
    if (digits.length > 10) return;

    setRecipientPhone(formatPhoneNumber(digits));

    if (digits.length === 0) {
      setPhoneError('');
      return;
    }

    // Don’t block typing; just validate and show feedback.
    if (digits[0] !== '5') {
      setPhoneError('Telefon numarası 5 ile başlamalıdır');
      return;
    }

    if (digits.length === 10 && !validatePhoneNumber(digits)) {
      setPhoneError('Geçersiz telefon numarası');
      return;
    }

    setPhoneError('');
  };

  const validateEmail = (email: string): boolean => {
    const v = email.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  };

  const handleGuestPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = normalizeTrMobileDigits(value);

    // Maksimum 10 rakam
    if (digits.length > 10) return;

    setGuestPhone(formatPhoneNumber(digits));

    if (digits.length === 0) {
      setGuestPhoneError('');
      return;
    }

    if (digits[0] !== '5') {
      setGuestPhoneError('Telefon numarası 5 ile başlamalıdır');
      return;
    }

    if (digits.length === 10 && !validatePhoneNumber(digits)) {
      setGuestPhoneError('Geçersiz telefon numarası');
      return;
    }

    setGuestPhoneError('');
  };

  const predefinedMessages = [
    {
      id: 'love',
      emoji: '❤️',
      label: 'Seni Seviyorum',
      templates: [
        'Seni çok seviyorum. İyi ki varsın.',
        'Kalbimin en güzel yerine sen yakışırsın.',
        'Seninle her şey daha sakin, daha güzel.',
        'Gülüşün günümü toparlıyor. İyi ki.',
        'Yanımda olmasan bile içimde yerin var.',
        'Varlığın bana yetiyor. Seni seviyorum.',
        'Seninle aynı dünyada olmak bile güzel.',
        'Kalbim senden yana. Her zaman.',
        'Bazen bir çiçek yetiyor, gerisini gözlerin anlatıyor.',
        'Düşünmeden geçemiyorum. İyi ki hayatımdasın.',
        'Sana “iyi ki” demenin yeni bir yolunu bulamadım, yine çiçek…',
        'Günün nasıl geçerse geçsin, sonunda gülümsemeni isterim.',
        'Benim en sevdiğim yer, senin yanın.',
        'Seni sevmek, her gün yeniden seçmek gibi.',
        'İçimden geldi. Sadece bu kadar.',
        'Sana her bakışımda aynı şeyi düşünüyorum: ne şanslıyım.',
        'Hayatın telaşında unutmadan söyleyeyim: seni çok seviyorum.',
        'Sen iyi ol, gerisi hallolur.',
        'Birlikte yaşlanmayı bile güzel hayal ediyorum.',
        'Seninle bir ömür, kısa bile gelir.',
        'Kalbim evini buldu: sende.',
        'Sana yakışan tek şey mutluluk. Biraz da ben ekleyeyim istedim.',
      ],
    },
    {
      id: 'birthday',
      emoji: '🎂',
      label: 'Doğum Günü',
      templates: [
        'İyi ki doğdun! Dilediğin her şey sana yaklaşsın.',
        'Yeni yaşın; sağlık, huzur ve içini ısıtan anlar getirsin.',
        'Nice mutlu yıllara! Gülüşün hiç eksik olmasın.',
        'Bugün senin günün. İyi ki varsın!',
        'Yeni yaşında kalbin kadar güzel bir yıl diliyorum.',
        'Hayatın en güzel çiçekleri hep seninle olsun.',
        'İyi ki doğdun, iyi ki hayatımdasın.',
        'Daha nice güzel yaşlara, hep birlikte…',
        'Yeni yaşın sana çok yakışacak, buna eminim.',
        'Dilerim bu yıl, “tam da istediğim gibi” dersin.',
        'Bir yıl daha büyüdün; umarım bir o kadar da mutlu oldun.',
        'Bugün dilek tutma günü. Benim dileğim belli: hep iyi ol.',
        'Yeni yaşın, kendin gibi güzel insanlarla dolsun.',
        'Senin gibi biri için sıradan bir kutlama yetmez; ama bu çiçek iyi bir başlangıç.',
        'Gözlerin hep parlasın, içindeki çocuk hep kalsın.',
        'Daha çok gül, daha az yorul. İyi ki doğdun.',
        'İyi ki geldin dünyaya; iyi ki yollarımız kesişti.',
        'Bu yıl sana güzel kapılar açsın.',
        'Güzel haberlerin, güzel günlerin olsun. Nice yıllara.',
        'Kendine iyi davranmayı unutma. Bugün ve her gün.',
        'İyi ki doğdun. İyi ki sen.',
        'Pastanın mumları çoksa dert değil; dileğin büyük olsun.',
      ],
    },
    {
      id: 'congrats',
      emoji: '🎉',
      label: 'Tebrik',
      templates: [
        'Tebrik ederim! Emeklerinin karşılığı çok yakıştı.',
        'Harikasın! Başarıların artarak devam etsin.',
        'Bu başarı tesadüf değil. Yolun açık olsun!',
        'Gurur duydum. Daha nicelerine!',
        'Başardın! Şimdi keyfini çıkarma zamanı.',
        'İnanınca oluyor. Sen bunun en güzel kanıtısın.',
        'Her adımın daha güzel sonuçlar getirsin.',
        'Kutlamayı hak ettin. Tebrikler!',
        'Bu kadar emek, bu kadar güzel sonuç… Helal olsun.',
        'Sakin kaldın, çalıştın, oldurdun. Tebrik ederim.',
        'Sen yaparsın zaten demiştim. Haklı çıktım.',
        'Bu sadece bir başlangıç. Daha güzelleri de geliyor.',
        'Güzel bir başarı, daha güzel bir yolculuğun habercisi.',
        'Çabanın karşılığını görmek çok iyi. Senin adına çok sevindim.',
        'İstediğini aldın. Şimdi daha büyüğü için yola devam.',
        'Bu başarı senin karakterin: istikrarlı ve güçlü.',
        'Bugün kendinle gurur duy. Hak ettin.',
        'Yolun açık, şansın bol olsun. Tebrikler.',
        'Güzel iş çıkardın. Emeğine sağlık.',
        'İyi haberler böyle gelmeli: peş peşe.',
        'Seninle gurur duyuyorum. Tebrikler!',
        'Bu başarıya bir çiçek yakışırdı. Buyur.',
      ],
    },
    {
      id: 'thanks',
      emoji: '💐',
      label: 'Teşekkür',
      templates: [
        'Her şey için çok teşekkür ederim. İyi ki varsın.',
        'Desteğin benim için çok değerli. Teşekkürler.',
        'İyiliğin kalbime dokundu. Çok teşekkür ederim.',
        'Varlığın bile yetiyor. Teşekkür ederim.',
        'Yanımda olduğun için minnettarım.',
        'İçtenliğin için teşekkür ederim.',
        'Emeklerin için çok teşekkürler.',
        'İyi ki sen. Teşekkür ederim.',
        'Beni düşündüğün için teşekkür ederim. Gerçekten iyi geldi.',
        'Sana güvenmek ne kadar doğruymuş… teşekkür ederim.',
        'Zor zamanda yanımda oldun. Unutmam.',
        'Küçük bir teşekkür değil bu; kocaman bir minnet.',
        'İyi kalbin için teşekkür ederim.',
        'Yaptığın şey benim için çok kıymetliydi. Teşekkürler.',
        'Hep böyle güzel insanlar çıksın karşıma… teşekkür ederim.',
        'Bana iyi geldiğin için teşekkür ederim.',
        'İlgin, nezaketin, sabrın… hepsi için teşekkür ederim.',
        'Bu çiçek, “sağ ol” demenin daha güzel hali.',
        'Sözle anlatmak zor; o yüzden çiçekle anlatayım: teşekkür ederim.',
        'İyi ki varsın. İyi ki yanımdasın.',
        'Güzel düşüncen için teşekkür ederim.',
        'Kalbime dokundun. Teşekkür ederim.',
      ],
    },
    {
      id: 'getwell',
      emoji: '🙏',
      label: 'Geçmiş Olsun',
      templates: [
        'Geçmiş olsun. En kısa zamanda iyi olmanı diliyorum.',
        'Kendine iyi bak. Gücünle bunu da atlatacaksın.',
        'Dualarım seninle. Şifa olsun.',
        'Her geçen gün daha iyi olman dileğiyle.',
        'İyileşince güzel bir kahve borcun var.',
        'Yalnız değilsin. Yanındayım.',
        'Sağlıkla toparlan, seni özledik.',
        'Hızlıca iyileş, enerjin geri gelsin.',
        'Dinlen, toparlan. Gerisi sonra.',
        'Bugün biraz yavaşla; kendine iyi davran.',
        'İyi haberini bekliyorum. Geçmiş olsun.',
        'Moral de ilaç gibi. Bu çiçek biraz moral olsun.',
        'Kendini yormadan iyileş. Yanındayım.',
        'Sana çok geçmiş olsun. En kısa zamanda toparlan.',
        'İçini ferah tut. Bu günler geçecek.',
        'Sana şifa, evine huzur olsun.',
        'Daha güçlü döneceksin, biliyorum.',
        'Bir an önce iyi ol da yine gülelim.',
        'İyileşmenin en güzel tarafı: yeniden kendin olmak.',
        'Geçmiş olsun. Kalbin de bedenin de iyi olsun.',
        'Kendini ihmal etme. İyi ol.',
        'Hızlıca iyi haberini alalım. Geçmiş olsun.',
      ],
    },
    {
      id: 'surprise',
      emoji: '🌹',
      label: 'Sürpriz',
      templates: [
        'Sadece gülümsemen için…',
        'Bugün seni mutlu etmek istedim.',
        'Küçük bir sürpriz, büyük bir gülümseme.',
        'Günün güzelleşsin diye…',
        'Senin için seçtim. Umarım beğenirsin.',
        'Aklıma düştün, çiçek de düştü yola.',
        'Bir tebessüm yeter; gerisi benden.',
        'Kalbine iyi gelsin diye…',
        'Bir anda aklıma geldin. Bu da peşinden geldi.',
        'Bugün bir güzellik yapalım dedim.',
        'Sana küçük bir “merhaba”.',
        'İçimden geldi. Bu kadar basit.',
        'Gününe renk katsın diye.',
        'Sen mutlu ol; sebebini sonra anlatırım.',
        'Sana denk gelen her şey güzel olsun.',
        'Bu çiçek “ben buradayım” demenin yolu.',
        'Bir çiçek, bir gülümseme, hepsi bu.',
        'Kendine iyi bakmayı hatırlatmak için.',
        'Günün en güzel anına eşlik etsin.',
        'Bugün biraz daha güzel olsun istedim.',
        'Şansın açık, kalbin ferah olsun.',
        'Seni düşünmek iyi geliyor. Bu da küçük bir iz.',
      ],
    },
  ] as const;

  const messageTemplateCursorRef = useRef<Record<string, number>>({});

  const handleSelectMessage = (msg: (typeof predefinedMessages)[number]) => {
    const current = messageTemplateCursorRef.current[msg.id] ?? -1;
    const nextIndex = (current + 1) % msg.templates.length;
    messageTemplateCursorRef.current[msg.id] = nextIndex;
    setSelectedMessage(`${msg.id}:${nextIndex}`);
    setMessageCard(msg.templates[nextIndex]);
  };

  const isPhoneValid = validatePhoneNumber(recipientPhone);
  const canProceedToRecipient = state.items.length > 0;
  const requiresSenderName = false;

  const handleEdgeSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'prev') {
        if (currentStep === 'payment') {
          setCurrentStep('message');
          scrollToTop();
          return;
        }
        if (currentStep === 'message') {
          setCurrentStep('recipient');
          scrollToTop();
          return;
        }
        if (currentStep === 'recipient') {
          setCurrentStep('cart');
          scrollToTop();
          return;
        }
        return;
      }

      // direction === 'next'
      if (currentStep === 'cart') {
        if (canProceedToRecipient) {
          setCurrentStep('recipient');
          scrollToTop();
        }
        return;
      }

      if (currentStep === 'recipient') {
        const check = validateRecipientStep();
        if (!check.ok) return;
        setCurrentStep('message');
        scrollToTop();
        return;
      }

      if (currentStep === 'message') {
        if (requiresSenderName && senderName.trim().length < 2) {
          setRecipientErrors(prev => ({ ...prev, sender: 'Gönderen adı en az 2 karakter olmalıdır' }));
          scrollToElement('sender-name');
          return;
        }
        setRecipientErrors(prev => ({ ...prev, sender: undefined }));
        setCurrentStep('payment');
        scrollToTop();
        return;
      }
    },
    [canProceedToRecipient, currentStep, requiresSenderName, senderName, validateRecipientStep]
  );
  
  // Detaylı adres alanlarından tam adresi oluştur
  const fullAddress = useMemo(() => {
    const parts = [];
    if (streetName.trim()) parts.push(streetName.trim());
    if (buildingNo.trim()) parts.push(`No: ${buildingNo.trim()}`);
    if (apartmentNo.trim()) parts.push(`Daire: ${apartmentNo.trim()}`);
    return parts.join(', ');
  }, [streetName, buildingNo, apartmentNo]);
  
  // Detaylı adres alanlarının dolu olup olmadığını kontrol et
  const hasValidAddressDetails = streetName.trim().length >= 3 && buildingNo.trim().length > 0;
  
  const canProceedToMessage = recipientName.length >= 3 && isPhoneValid && hasValidAddressDetails && neighborhood.length >= 2 && district.length > 0 && deliveryDate.length > 0 && !isDeliveryDateBlocked(deliveryDate) && isValidDeliveryTimeSlot(deliveryTimeSlot);
  const guestEmailTrim = guestEmail.trim();
  const guestPhoneDigits = normalizeTrMobileDigits(guestPhone);
  const isGuestEmailValid = guestEmailTrim.length === 0 ? false : validateEmail(guestEmailTrim);
  const isGuestPhoneValid = guestPhoneDigits.length === 0 ? false : validatePhoneNumber(guestPhone);
  const hasGuestContact = isLoggedIn || (isGuestEmailValid && isGuestPhoneValid);
  const canProceedToPayment = canProceedToMessage && (!requiresSenderName || senderName.trim().length >= 2);
  const canCompletePayment = acceptTerms && hasGuestContact;

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const offset = 20; // Daha az offset - element tam görünsün
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Focus için tabindex ekle
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }
      
      // Kısa delay ile focus
      setTimeout(() => {
        if (typeof element.focus === 'function') {
          element.focus({ preventScroll: true });
        }
      }, 300);
      
      // Add highlight effect - daha uzun süre
      element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
      }, 3000);
    }
  };

  // Scroll page to very top (for prominent error exposure)
  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) {}
    // Fallbacks for some browsers/containers
    try {
      document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' } as any);
      document.body?.scrollTo?.({ top: 0, behavior: 'smooth' } as any);
    } catch (_) {}
  };

  const validateRecipientStep = (options?: { skipScroll?: boolean }): ValidationResult => {
    const errors: RecipientErrors = {};
    let firstId: string | undefined;
    let firstMessage: string | undefined;
    const setErr = (id: string, key: keyof RecipientErrors, message: string) => {
      errors[key] = message;
      if (!firstId) {
        firstId = id;
        firstMessage = message;
      }
    };

    const trimmedName = recipientName.trim();
    const minName = isGift ? 2 : 3;
    if (trimmedName.length < minName) {
      setErr('recipient-name', 'name', `Alıcı adı en az ${minName} karakter olmalı`);
    }
    if (!isPhoneValid) {
      setPhoneError('Geçerli bir telefon girin (5XX XXX XX XX)');
      if (!firstId) {
        firstId = 'recipient-phone';
        firstMessage = 'Geçerli bir telefon girin (5XX XXX XX XX)';
      }
    } else {
      setPhoneError('');
    }
    if (!selectedLocation || selectedLocation.length === 0) {
      setErr('delivery-location', 'location', 'Teslimat bölgesi seçilmelidir');
      setIsLocationOpen(true);
    }
    
    // Desteklenmeyen bölge kontrolü - closedWarning varsa hata ver
    if (closedWarning) {
      setErr('delivery-location', 'location', closedWarning);
    }
    
    // Mahalle kontrolü - API'den seçilmiş olmalı
    if (selectedLocation && !closedWarning && (!neighborhood || neighborhood.trim().length < 2)) {
      setErr('neighborhood', 'neighborhood', 'Mahalle seçilmelidir');
    }
    
    // Detaylı adres alanları kontrolü
    if (!streetName || streetName.trim().length < 3) {
      setErr('street-name', 'streetName', 'Sokak/Cadde adı en az 3 karakter olmalıdır');
    }
    if (!buildingNo || buildingNo.trim().length === 0) {
      setErr('building-no', 'buildingNo', 'Bina/Kapı no zorunludur');
    }
    
    if (!deliveryDate) {
      setErr('delivery-date', 'date', 'Teslimat tarihi seçilmelidir');
    } else if (deliveryDate < MIN_DELIVERY_DATE) {
      // Silently allow past dates without error
    } else {
      // Validate blocked delivery dates (Sundays or manual off days)
      const [y, m, d] = deliveryDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      if (!Number.isFinite(dt.getTime())) {
        setErr('delivery-date', 'date', 'Geçersiz tarih seçildi');
        if (!firstId) {
          firstId = 'delivery-date';
          firstMessage = 'Geçersiz tarih seçildi';
        }
      } else if (isDeliveryDateBlocked(deliveryDate)) {
        const msg = getBlockedDeliveryMessage(deliveryDate) || DELIVERY_OFF_DAY_ERROR_MESSAGE;
        setErr('delivery-date', 'date', msg);
        if (!firstId) {
          firstId = 'delivery-date';
          firstMessage = msg;
        }
      }
    }
    if (!isValidDeliveryTimeSlot(deliveryTimeSlot)) {
      // Otomatik olarak varsayılan aralığa çek ve ilerlemeye izin ver
      setDeliveryTimeSlot(DEFAULT_DELIVERY_TIME_SLOT);
      setErr('delivery-time', 'time', undefined);
    }
    // senderName kontrolü message adımına taşındı - recipient adımında kontrol edilmemeli

    setRecipientErrors(errors);

    if (firstId) {
      if (!options?.skipScroll) {
        scrollToElement(firstId);
      }
      return { ok: false, firstId, message: firstMessage };
    }

    return { ok: true };
  };

  const validatePaymentStep = (): ValidationResult => {
    let firstId: string | undefined;
    let firstMessage: string | undefined;

    // Giriş yapmamış kullanıcılar için checkout mode kontrolü
    if (!isLoggedIn) {
      // Önce mode seçilmiş mi kontrol et
      if (checkoutMode === 'undecided') {
        const msg = 'Lütfen "Misafir Olarak Devam" veya "Üye Ol / Giriş Yap" seçeneklerinden birini seçin';
        setCheckoutModeError(msg);
        // Kullanıcı hatayı en üstte görsün
        scrollToTop();
        firstId = 'checkout-mode';
        firstMessage = msg;
        return { ok: false, firstId, message: firstMessage };
      }
      
      // Misafir modunda iletişim bilgileri kontrolü
      if (checkoutMode === 'guest') {
        if (!guestEmailTrim) {
          const msg = 'E-posta zorunludur';
          setGuestEmailError(msg);
          firstId = firstId || 'guest-email';
          firstMessage = firstMessage || msg;
        } else if (!isGuestEmailValid) {
          const msg = 'Geçerli bir e-posta girin';
          setGuestEmailError(msg);
          firstId = firstId || 'guest-email';
          firstMessage = firstMessage || msg;
        }

        if (!guestPhoneDigits) {
          const msg = 'Telefon zorunludur';
          setGuestPhoneError(msg);
          firstId = firstId || 'guest-phone';
          firstMessage = firstMessage || msg;
        } else if (!isGuestPhoneValid) {
          const msg = 'Geçerli bir telefon girin (5XX XXX XX XX)';
          setGuestPhoneError(msg);
          firstId = firstId || 'guest-phone';
          firstMessage = firstMessage || msg;
        }
      }
      
      // Login/Register modunda henüz giriş yapılmamışsa
      if ((checkoutMode === 'login' || checkoutMode === 'register') && !isLoggedIn) {
        const msg = 'Lütfen giriş yapın veya misafir olarak devam edin';
        firstId = 'checkout-mode';
        firstMessage = msg;
        return { ok: false, firstId, message: firstMessage };
      }
    }

    if (!acceptTerms) {
      const msg = 'Sözleşmeyi onaylayın';
      firstId = firstId || 'terms-checkbox';
      firstMessage = firstMessage || msg;
    }

    if (firstId) {
      scrollToElement(firstId);
      return { ok: false, firstId, message: firstMessage };
    }

    return { ok: true };
  };

  const handleCompleteOrder = async () => {
    const paymentCheck = validatePaymentStep();
    if (!paymentCheck.ok) {
      setCurrentStep('payment');
      return;
    }

    const recipientCheck = validateRecipientStep({ skipScroll: true });
    if (!recipientCheck.ok) {
      setCurrentStep('recipient');
      if (recipientCheck.firstId) {
        setTimeout(() => scrollToElement(recipientCheck.firstId as string), 150);
      }
      return;
    }
    
    setIsProcessing(true);

    try {
      // Adresi defterime kaydet (sadece giriş yapmış kullanıcılar için ve yeni adres ise)
      if (isLoggedIn && customerState.currentCustomer && saveAddressToBook && !selectedSavedAddress) {
        // Tam adresi oluştur
        const completeAddress = `${neighborhood} Mah. ${fullAddress}, ${district}/İstanbul`;
        const newAddress: Omit<Address, 'id'> = {
          title: addressTitle || 'Teslimat Adresi',
          type: 'other',
          recipientName,
          recipientPhone: normalizeTrMobileDigits(recipientPhone),
          province: 'İstanbul',
          provinceId: 34,
          district,
          districtId: districtId || 0,
          neighborhood,
          fullAddress: completeAddress,
          isDefault: customerState.currentCustomer.addresses.length === 0, // İlk adres ise varsayılan yap
        };
        
        const addressSaved = await addAddress(customerState.currentCustomer.id, newAddress);
        if (!addressSaved) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Adres kaydedilemedi, ancak sipariş devam ediyor.');
          }
        }
      }

      // Prepare customer info for iyzico (separate from order data)
      const customerInfo = {
        id: isLoggedIn && customerState.currentCustomer?.id ? customerState.currentCustomer.id : null,
        name: isLoggedIn && customerState.currentCustomer?.name ? customerState.currentCustomer.name : recipientName,
        email: isLoggedIn && customerState.currentCustomer?.email ? customerState.currentCustomer.email : (guestEmail || 'guest@vadiler.com'),
        phone: isLoggedIn && customerState.currentCustomer?.phone ? customerState.currentCustomer.phone : (guestPhone || recipientPhone),
      };

      // For guest checkout, we don't create a customer record
      // Orders API accepts customer_id = null for guest orders
      if (!isLoggedIn) {
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 Guest checkout - order will be created without customer_id');
        }
      }

      // Create order with pending_payment status
      // Tam adresi oluştur
      const completeDeliveryAddress = `${neighborhood} Mah. ${fullAddress}, ${district}/İstanbul`;
        const orderResult = await createOrder({
        customerId: customerInfo.id,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        isGuest: !isLoggedIn,
        items: state.items,
        delivery: {
          recipientName,
          recipientPhone,
          province: 'İstanbul (Avrupa)',
          district,
          neighborhood,
          fullAddress: completeDeliveryAddress,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
          deliveryTimeSlot: isValidDeliveryTimeSlot(deliveryTimeSlot) ? normalizeDeliveryTimeSlot(deliveryTimeSlot) : null,
          deliveryNotes,
        },
        payment: {
          method: selectedPaymentMethod,
          status: 'pending',
        },
        message: (messageCard || isGift) ? {
          content: messageCard || '',
          senderName: senderName || '',
          isGift,
        } : null,
        status: selectedPaymentMethod === 'bank_transfer' ? 'awaiting_payment' : 'pending',
      });

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.error || 'Sipariş oluşturulamadı');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Order created:', orderResult.order.id);
      }

      // Handle payment based on selected method
      if (selectedPaymentMethod === 'bank_transfer') {
        // Bank transfer flow - redirect to dedicated confirmation page
        const totalAmount = getTotalPrice();
        setBankTransferOrderNumber(orderResult.order.orderNumber);
        setBankTransferOrderId(orderResult.order.id);
        setBankTransferTotal(totalAmount);
        const orderItemsSummary = state.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          total: item.product.price * item.quantity,
        }));
        try {
          localStorage.setItem('vadiler_bank_transfer_info', JSON.stringify({
            orderNumber: orderResult.order.orderNumber,
            orderId: orderResult.order.id,
            totalAmount,
            items: orderItemsSummary,
            createdAt: Date.now(),
          }));
        } catch {}
        router.push(`/payment/havale-onay?orderNumber=${orderResult.order.orderNumber}&amount=${encodeURIComponent(totalAmount)}`);
        
        // Not clearing cart or form data per retention requirement
        
        // Add to customer orders if logged in
        if (isLoggedIn && customerState.currentCustomer) {
          await addOrderToCustomer(customerState.currentCustomer.id, orderResult.order.id, totalAmount);
        }
      } else {
        // Credit card flow - Initialize iyzico 3DS payment
        const paymentResponse = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderResult.order.id,
            cartItems: state.items,
            customer: customerInfo,
            deliveryInfo: {
              province: { name: district }, // Using district as province for iyzico
              recipientName,
              recipientPhone,
              recipientAddress,
            },
            totalAmount: getTotalPrice(),
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentData.success) {
          throw new Error(paymentData.error || 'Payment initialization failed');
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Payment initialized:', paymentData.paymentId);
        }

        // Mark checkout as started (in case user abandons or fails)
        try {
          localStorage.setItem('vadiler_checkout_started', JSON.stringify({
            startedAt: Date.now(),
            orderId: orderResult.order.id,
            paymentId: paymentData.paymentId || null,
            method: 'credit_card'
          }));
        } catch {}

        // Redirect to 3DS page (full page, not modal)
        // This is e-commerce standard - callback will return to our site
        const threeDSUrl = new URL('/payment/3ds', window.location.origin);
        threeDSUrl.searchParams.set('html', paymentData.threeDSHtmlContent);
        if (orderResult?.order?.id) {
          threeDSUrl.searchParams.set('orderId', orderResult.order.id);
        }
        
        // Navigate to 3DS page
        window.location.href = threeDSUrl.toString();
      }
      
    } catch (error: unknown) {
      console.error('Order error:', error);
      const message = error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen tekrar deneyin.';
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Step indicator
  const steps = [
    { id: 'cart', label: 'Sepet', icon: ShoppingBag },
    { id: 'recipient', label: 'Alıcı', icon: User },
    { id: 'message', label: 'Mesaj', icon: MessageSquare },
    { id: 'payment', label: 'Ödeme', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Success screen
  if (currentStep === 'success' && completedOrder) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white pt-32 lg:pt-52 pb-32">
          <div className="max-w-lg mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <SpotlightCard className="p-8 text-center">
                <BorderBeam size={260} duration={12} />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 mx-auto mb-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center"
                >
                  <CheckCircle className="w-9 h-9 text-emerald-600" />
                </motion.div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Siparişiniz Alındı</h1>
                <p className="text-gray-500 mb-6">
                  Sipariş numaranız: <span className="font-bold text-[#e05a4c]">#{completedOrder.orderNumber}</span>
                </p>

                <GlassCard className="p-6 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4">Sipariş Detayları</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Alıcı</span>
                      <span className="text-gray-900 font-medium text-right">{recipientName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Teslimat Adresi</span>
                      <span className="text-gray-900 font-medium text-right max-w-[60%]">
                        {selectedLocation || `${district}, İstanbul`}
                      </span>
                    </div>
                    {deliveryDate && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Teslimat Tarihi</span>
                        <span className="text-gray-900 font-medium text-right">{deliveryDate} {deliveryTimeSlot}</span>
                      </div>
                    )}
                  </div>
                </GlassCard>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 text-left">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-700 mt-0.5" />
                    <p className="text-sm text-emerald-700">
                      Ödemeniz başarıyla alındı. Siparişiniz en kısa sürede hazırlanacaktır.
                    </p>
                  </div>
                </div>

                {/* Misafir kullanıcılar için sipariş takip bilgisi */}
                {!isLoggedIn && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
                    <p className="text-sm text-blue-900 font-semibold mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Sipariş Takibi
                    </p>
                    <p className="text-sm text-blue-800">
                      Siparişinizi takip etmek için <strong>#{completedOrder.orderNumber}</strong> numarasını ve
                      {guestEmail ? <> <strong>{guestEmail}</strong> e-posta adresinizi</> : <> telefon numaranızı</>} kullanabilirsiniz.
                    </p>
                    <Link
                      href="/siparis-takip"
                      className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Sipariş Takip Sayfasına Git
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Link
                    href="/"
                    className="w-full py-3.5 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all flex items-center justify-center"
                  >
                    Alışverişe Devam Et
                  </Link>
                  {isLoggedIn && (
                    <button
                      onClick={() => router.push('/hesabim/siparislerim')}
                      className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Siparişlerimi Görüntüle
                    </button>
                  )}
                  {!isLoggedIn && (
                    <Link
                      href="/siparis-takip"
                      className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-center"
                    >
                      Siparişimi Takip Et
                    </Link>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </main>
        <Footer />
        <MobileNavBar />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-32 lg:pt-52 pb-32" suppressHydrationWarning>
        <div className="max-w-2xl mx-auto px-4">
          
          {/* Step Indicator - Apple Premium Style */}
          {!isEmpty && currentStep !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const StepIcon = step.icon;
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => {
                        if (index < currentStepIndex) {
                          setCurrentStep(step.id as CheckoutStep);
                        }
                      }}
                      disabled={index > currentStepIndex}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#e05a4c] to-[#ff6b5a] text-white shadow-lg shadow-[#e05a4c]/30'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer shadow-md shadow-emerald-500/20'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <StepIcon size={14} />
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-white/20"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <motion.div 
                        className={`h-0.5 ${index < currentStepIndex ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-200'}`}
                        initial={{ width: 0 }}
                        animate={{ width: 24 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Content based on step */}
          <AnimatePresence mode="wait">
            {/* STEP: CART */}
            {currentStep === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {isEmpty ? (
                  /* Empty State */
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                  >
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#e05a4c]/10 to-[#e05a4c]/5 rounded-3xl flex items-center justify-center"
                    >
                      <ShoppingBag size={40} className="text-[#e05a4c]" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      Sepetiniz Boş
                    </h2>
                    <p className="text-gray-600 text-base mb-8 max-w-md mx-auto">
                      Sevdiklerinize özel çiçekler ve hediyeler ile mutluluk gönderin ✨
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-all hover:shadow-lg active:scale-95"
                    >
                      <ArrowLeft size={18} />
                      Alışverişe Başla
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items */}
                    {state.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 p-4 bg-gray-50 rounded-2xl"
                      >
                        <Link
                          href={`/${item.product.category}/${item.product.slug}`}
                          className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                        >
                          {getMediaType(item.product.image) === 'video' ? (
                            <video
                              src={item.product.image}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                              autoPlay
                            />
                          ) : (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${item.product.category}/${item.product.slug}`}
                            className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-[#e05a4c] transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-base font-bold text-[#e05a4c]">
                              {formatPrice(item.product.price)}
                            </span>
                            {item.product.oldPrice && item.product.oldPrice > item.product.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(item.product.oldPrice)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200">
                              <button
                                onClick={() => {
                                  updateQuantity(item.product.id, item.quantity - 1);
                                  trackEvent({
                                    eventName: 'cart_quantity_change',
                                    eventCategory: 'ecommerce',
                                    properties: {
                                      action: 'decrease',
                                      product_id: item.product.id,
                                      product_name: item.product.name,
                                      new_quantity: item.quantity - 1
                                    }
                                  });
                                }}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 active:scale-95 transition-transform"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                              <button
                                onClick={() => {
                                  updateQuantity(item.product.id, item.quantity + 1);
                                  trackEvent({
                                    eventName: 'cart_quantity_change',
                                    eventCategory: 'ecommerce',
                                    properties: {
                                      action: 'increase',
                                      product_id: item.product.id,
                                      product_name: item.product.name,
                                      new_quantity: item.quantity + 1
                                    }
                                  });
                                }}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 active:scale-95 transition-transform"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                trackEvent({
                                  eventName: 'remove_from_cart',
                                  eventCategory: 'ecommerce',
                                  properties: {
                                    product_id: item.product.id,
                                    product_name: item.product.name,
                                    quantity: item.quantity
                                  }
                                });
                                removeFromCart(item.product.id);
                              }}
                              className="p-3 -mr-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Ara Toplam ({getTotalItems()} ürün)</span>
                        <span>{formatPrice(getTotalPrice())}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-gray-500">Teslimat</span>
                        <span className="text-[#549658] font-medium">Ücretsiz</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span className="font-medium text-gray-900">Toplam</span>
                        <span className="text-xl font-bold text-gray-900">{formatPrice(getTotalPrice())}</span>
                      </div>
                    </div>

                    {/* Devam Et Butonu (mobilde sayfa sonunda statik) */}
                    <div className="mt-6">
                      <div className="max-w-2xl mx-auto">
                        <button
                          onClick={() => {
                            console.log('İleri butonuna tıklandı', { canProceedToRecipient, itemsLength: state.items.length });
                            if (!canProceedToRecipient) {
                              alert('Sepetinizde ürün bulunmuyor.');
                              return;
                            }
                            console.log('Alıcı bilgilerine geçiliyor...');
                            setCurrentStep('recipient');
                            console.log('Step değiştirildi, yeni currentStep: recipient');
                          }}
                          className="w-full py-3.5 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-colors flex items-center justify-center gap-2"
                        >
                          İleri
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP: RECIPIENT */}
            {currentStep === 'recipient' && (
              <motion.div
                key="recipient"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#e05a4c] to-[#ff7961] bg-clip-text text-transparent mb-2">Çiçekler Nereye Gitsin?</h2>
                  <p className="text-sm text-gray-500">Sevdiklerinize özel anlar yaratmak için sadece bir adım kaldı</p>
                </div>

                {/* Kayıtlı Adresler */}
                {customerState.currentCustomer && customerState.currentCustomer.addresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-600">Kayıtlı Adresler</p>
                    <div className="space-y-2">
                      {customerState.currentCustomer.addresses.map(addr => {
                        const supported = isAddressSupported(addr);
                        return (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all
                            ${selectedSavedAddress?.id === addr.id 
                              ? 'border-[#e05a4c] bg-[#e05a4c]/5 ring-4 ring-[#e05a4c]/10' 
                              : supported ? 'border-gray-200 hover:border-gray-300 bg-white' : 'border-orange-200 bg-orange-50'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                              ${selectedSavedAddress?.id === addr.id ? 'border-[#e05a4c] bg-[#e05a4c]' : 'border-gray-300'}`}>
                              {selectedSavedAddress?.id === addr.id && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-sm text-gray-900">
                                  {addr.title || (addr.type === 'home' ? 'Ev' : addr.type === 'work' ? 'İş' : 'Diğer')}
                                </span>
                                {addr.isDefault && (
                                  <span className="flex items-center gap-1 text-[10px] text-[#549658] font-medium">
                                    <Star size={10} className="fill-current" />
                                    Varsayılan
                                  </span>
                                )}
                                {!supported && (
                                  <span className="flex items-center gap-1 text-[10px] text-orange-600 font-medium bg-orange-100 px-1.5 py-0.5 rounded">
                                    ⚠️ Bu bölgeye teslimat yapılamamaktadır
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{addr.recipientName}</p>
                              <p className="text-xs text-gray-500 truncate">{addr.fullAddress}</p>
                              <p className="text-xs text-gray-400">{addr.district}/{addr.province}</p>
                            </div>
                          </div>
                        </button>
                      );})}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedSavedAddress(null);
                        setRecipientName('');
                        setRecipientPhone('');
                        setIstanbulSide('');
                        setDistrict('');
                        setDistrictId(0);
                        setNeighborhood('');
                        // Detaylı adres alanlarını temizle
                        setStreetName('');
                        setBuildingNo('');
                        setApartmentNo('');
                        setSelectedLocation(null);
                        setClosedWarning(null);
                        setShowAddressForm(true);
                      }}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-[#e05a4c] hover:text-[#e05a4c] transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Farklı Adres Gir
                    </button>
                    
                    {/* Desteklenmeyen bölge uyarısı */}
                    {closedWarning && selectedSavedAddress && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">{closedWarning}</p>
                            <p className="text-xs text-red-600 mt-1">Devam etmek için lütfen &quot;Farklı Adres Gir&quot; butonuna tıklayarak desteklenen bir bölge seçin.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Yeni Adres Formu */}
                <AnimatePresence>
                  {(showAddressForm || !customerState.currentCustomer || customerState.currentCustomer.addresses.length === 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {customerState.currentCustomer && customerState.currentCustomer.addresses.length > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-600">Yeni Adres</p>
                          <button
                            onClick={() => setShowAddressForm(false)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            İptal
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Alıcı Adı Soyadı *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="recipient-name"
                            type="text"
                            value={recipientName}
                            onChange={(e) => {
                              setRecipientName(e.target.value);
                              setRecipientErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            placeholder="Çiçeği alacak kişinin adı"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all"
                          />
                        </div>
                        {recipientErrors.name && (
                          <p className="text-[10px] text-red-500 mt-1">{recipientErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Alıcı Telefonu *
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="recipient-phone"
                            type="tel"
                            value={recipientPhone}
                            onChange={handlePhoneChange}
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={13}
                            placeholder="5XX XXX XX XX"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-base focus:outline-none focus:ring-2 transition-all ${
                              phoneError ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]'
                            }`}
                          />
                        </div>
                        {phoneError ? (
                          <p className="text-[10px] text-red-500 mt-1">{phoneError}</p>
                        ) : (
                          <p className="text-[10px] text-gray-400 mt-1">Teslimat için alıcıyla iletişime geçeceğiz</p>
                        )}
                      </div>

                      {/* İstanbul İlçe Seçici - DeliverySelector tarzı */}
                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Teslimat Bölgesi *
                        </label>
                        <button
                          id="delivery-location"
                          type="button"
                          onClick={() => {
                            if (selectedLocation) {
                              // Seçili konum varsa, sıfırla ve dropdown'u aç
                              resetLocationSelection();
                              setIsLocationOpen(true);
                            } else {
                              setIsLocationOpen(!isLocationOpen);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                            selectedLocation 
                              ? 'border-[#549658] bg-[#549658]/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <MapPin size={18} className={selectedLocation ? 'text-[#549658]' : 'text-gray-400'} />
                          <span className={`flex-1 text-sm ${selectedLocation ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            {selectedLocation || 'Teslimat bölgesini seçin'}
                          </span>
                          {selectedLocation && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                resetLocationSelection();
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full"
                            >
                              <X size={16} className="text-gray-500" />
                            </button>
                          )}
                        </button>

                        {/* Helper text */}
                        {!selectedLocation && !isLocationOpen && (
                          <p className="text-xs text-[#e05a4c] mt-1.5 px-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Şu an sadece İstanbul içi teslimat yapılmaktadır.
                          </p>
                        )}
                        {recipientErrors.location && (
                          <p className="text-[10px] text-red-500 mt-1 px-1">{recipientErrors.location}</p>
                        )}

                        {/* Location Dropdown */}
                        <AnimatePresence>
                          {isLocationOpen && (
                            <motion.div
                              id="location-dropdown"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden"
                            >
                              {/* Search */}
                              <div className="p-3 border-b border-gray-100">
                                <div className="relative">
                                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder={locationStep === 'region' ? 'Bölge ara...' : 'İlçe ara...'}
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]"
                                  />
                                </div>
                                {locationStep === 'district' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLocationStep('region');
                                      setIstanbulSide('');
                                      setLocationSearch('');
                                    }}
                                    className="flex items-center gap-1 text-xs text-[#e05a4c] mt-2 hover:underline"
                                  >
                                    ← Bölge seçimine dön
                                  </button>
                                )}
                              </div>

                              {/* Results */}
                              <div className="max-h-56 overflow-y-auto">
                                {locationStep === 'region' ? (
                                  <div className="p-2">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">İstanbul</p>
                                    {filteredRegions.map((region) => {
                                      const isAnadolu = region.id === 'anadolu';
                                      const anadoluDisabled = isAnadolu && isAnadoluClosed;
                                      return (
                                        <button
                                          key={region.id}
                                          type="button"
                                          onClick={() => {
                                            if (anadoluDisabled) return;
                                            handleRegionSelect(region.id as 'avrupa');
                                          }}
                                          disabled={anadoluDisabled}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                                            anadoluDisabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-[#e05a4c]/5'
                                          }`}
                                        >
                                          <MapPin size={14} className={anadoluDisabled ? 'text-gray-400' : 'text-[#e05a4c]'} />
                                          <span className={`text-sm flex-1 ${anadoluDisabled ? 'text-gray-500' : 'text-gray-700'}`}>{region.name}</span>
                                          <ChevronRight size={14} className={anadoluDisabled ? 'text-gray-200' : 'text-gray-300'} />
                                        </button>
                                      );
                                    })}
                                    {isAnadoluClosed && (
                                      <p className="text-[11px] text-amber-600 mt-2 px-2">Anadolu yakası çok yakında!</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">
                                      {currentRegion?.name} - İlçeler
                                    </p>
                                    {filteredDistricts.map((districtName) => (
                                      (() => {
                                        const isDisabled = disabledDistricts.includes(districtName);
                                        return (
                                          <button
                                            key={districtName}
                                            type="button"
                                            onClick={() => {
                                              if (isDisabled) {
                                                setClosedWarning(districtName);
                                                setTimeout(() => setClosedWarning(null), 3500);
                                                return;
                                              }
                                              handleDistrictSelect(districtName);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${isDisabled ? 'opacity-60 bg-gray-50' : 'hover:bg-[#e05a4c]/5'}`}
                                          >
                                            <Check size={14} className="text-transparent" />
                                            <span className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>{districtName}</span>
                                            {isDisabled && <span className="ml-auto text-xs text-rose-600">Kapalı</span>}
                                          </button>
                                        );
                                      })()
                                    ))}
                                    {closedWarning && (
                                      <div className="mt-2 p-3 bg-rose-50 rounded-lg">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle size={16} className="text-rose-600 mt-0.5" />
                                          <div>
                                            <p className="text-sm text-rose-800 font-medium">{closedWarning} — Bu bölge geçici olarak kapalı</p>
                                            <p className="text-xs text-rose-600">Lütfen başka bir ilçe seçin veya daha sonra tekrar deneyin.</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mahalle - sadece ilçe seçildiyse göster - SADECE DROPDOWN */}
                      <AnimatePresence>
                        {selectedLocation && (
                          <motion.div
                            id="neighborhood"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Mahalle *
                            </label>
                            <div className="relative">
                              {/* Seçim Butonu */}
                              <button
                                type="button"
                                onClick={() => setNeighborhoodSearchOpen(!neighborhoodSearchOpen)}
                                disabled={loadingNeighborhoods || neighborhoodSuggestions.length === 0}
                                className={`w-full px-4 py-3 bg-white border rounded-2xl text-base text-left focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${
                                  recipientErrors.neighborhood ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                              >
                                <span className={neighborhood ? 'text-gray-900' : 'text-gray-400'}>
                                  {loadingNeighborhoods 
                                    ? 'Mahalleler yükleniyor...' 
                                    : neighborhood 
                                      ? neighborhood 
                                      : neighborhoodSuggestions.length > 0 
                                        ? 'Mahalle seçin...' 
                                        : 'Önce ilçe seçin'}
                                </span>
                                {loadingNeighborhoods ? (
                                  <Loader2 size={16} className="animate-spin text-[#e05a4c]" />
                                ) : (
                                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${neighborhoodSearchOpen ? 'rotate-90' : ''}`} />
                                )}
                              </button>
                              
                              {/* Dropdown Liste */}
                              <AnimatePresence>
                                {neighborhoodSearchOpen && !loadingNeighborhoods && neighborhoodSuggestions.length > 0 && (
                                  <motion.div
                                    id="neighborhood-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                                  >
                                    {/* Arama Kutusu */}
                                    <div className="p-2 border-b border-gray-100">
                                      <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                          ref={neighborhoodInputRef}
                                          type="text"
                                          value={neighborhoodSearch}
                                          onChange={(e) => setNeighborhoodSearch(e.target.value)}
                                          placeholder="Mahalle ara..."
                                          autoComplete="off"
                                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]"
                                        />
                                      </div>
                                    </div>
                                    
                                    {/* Mahalle Listesi */}
                                    <div className="max-h-48 overflow-y-auto">
                                      {neighborhoodSuggestions
                                        .filter(n => 
                                          !neighborhoodSearch || 
                                          n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase())
                                        )
                                        .map((n) => {
                                          // Arnavutköy için kapalı mahalle kontrolü (isim içeriyor mu kontrol et)
                                          const isDisabledNeighborhood = district === 'Arnavutköy' && 
                                            (disabledNeighborhoodsMap['Arnavutköy'] || DEFAULT_DISABLED_NEIGHBORHOODS['Arnavutköy']).some(disabled => 
                                              n.name.toLowerCase().includes(disabled.toLowerCase()) ||
                                              disabled.toLowerCase().includes(n.name.toLowerCase())
                                            );
                                          
                                          return (
                                          <button
                                            key={n.id}
                                            type="button"
                                            disabled={isDisabledNeighborhood}
                                            onClick={() => {
                                              if (isDisabledNeighborhood) return;
                                              setNeighborhood(n.name);
                                              setNeighborhoodSearch('');
                                              setNeighborhoodSearchOpen(false);
                                              setRecipientErrors((prev) => ({ ...prev, neighborhood: undefined }));
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                              isDisabledNeighborhood 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : neighborhood === n.name 
                                                  ? 'bg-[#e05a4c]/10 text-[#e05a4c] hover:bg-[#e05a4c]/5' 
                                                  : 'text-gray-700 hover:bg-[#e05a4c]/5'
                                            }`}
                                          >
                                            {neighborhood === n.name && !isDisabledNeighborhood && <Check size={14} className="text-[#e05a4c]" />}
                                            <span className={neighborhood === n.name ? 'font-medium' : ''}>{n.name}</span>
                                            {isDisabledNeighborhood && (
                                              <span className="ml-auto text-[10px] text-orange-500 font-medium">Yoğunluk</span>
                                            )}
                                          </button>
                                        );
                                        })}
                                      {neighborhoodSuggestions.filter(n => 
                                        !neighborhoodSearch || 
                                        n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase())
                                      ).length === 0 && (
                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                          &quot;{neighborhoodSearch}&quot; bulunamadı
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Alt bilgi */}
                                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                                      <p className="text-[10px] text-gray-500 text-center">
                                        {neighborhoodSuggestions.length} mahalle listeleniyor
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              {/* Dropdown dışına tıklandığında kapat */}
                              {neighborhoodSearchOpen && (
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => {
                                    setNeighborhoodSearchOpen(false);
                                    setNeighborhoodSearch('');
                                  }}
                                />
                              )}
                            </div>
                            {recipientErrors.neighborhood && (
                              <p className="text-[10px] text-red-500 mt-1">{recipientErrors.neighborhood}</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Detaylı Adres Alanları */}
                      <AnimatePresence>
                        {selectedLocation && neighborhood && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            {/* Sokak/Cadde */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Sokak / Cadde *
                              </label>
                              <input
                                id="street-name"
                                type="text"
                                value={streetName}
                                onChange={(e) => {
                                  setStreetName(e.target.value);
                                  setRecipientErrors((prev) => ({ ...prev, streetName: undefined }));
                                }}
                                placeholder="örn: Atatürk Caddesi, Cumhuriyet Sokak"
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all ${
                                  recipientErrors.streetName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                              />
                              {recipientErrors.streetName && (
                                <p className="text-[10px] text-red-500 mt-1">{recipientErrors.streetName}</p>
                              )}
                            </div>

                            {/* Bina / Kapı ve Daire No */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Bina / Kapı No *
                                </label>
                                <input
                                  id="building-no"
                                  type="text"
                                  value={buildingNo}
                                  onChange={(e) => {
                                    setBuildingNo(e.target.value);
                                    setRecipientErrors((prev) => ({ ...prev, buildingNo: undefined }));
                                  }}
                                  placeholder="örn: 15, 15A"
                                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all ${
                                    recipientErrors.buildingNo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                  }`}
                                />
                                {recipientErrors.buildingNo && (
                                  <p className="text-[10px] text-red-500 mt-1">{recipientErrors.buildingNo}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Daire / Dükkan (Opsiyonel)
                                </label>
                                <input
                                  id="apartment-no"
                                  type="text"
                                  value={apartmentNo}
                                  onChange={(e) => {
                                    setApartmentNo(e.target.value);
                                  }}
                                  placeholder="örn: 5, Dükkan 3"
                                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all border-gray-200"
                                />
                              </div>
                            </div>

                            {/* Oluşturulan tam adres önizlemesi */}
                            {fullAddress && (
                              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-[10px] text-blue-600 font-medium mb-1">📍 Adres Önizleme:</p>
                                <p className="text-xs text-blue-800">
                                  {neighborhood} Mah. {fullAddress}, {district}/İstanbul
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bu adresi defterime kaydet - sadece giriş yapmış kullanıcılar için */}
                      {isLoggedIn && (
                        <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveAddressToBook}
                              onChange={(e) => setSaveAddressToBook(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-[#549658] focus:ring-[#549658] cursor-pointer"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Bu adresi adres defterime kaydet</p>
                              <p className="text-[10px] text-gray-500">Gelecekte kolayca kullanabilmek için</p>
                            </div>
                          </label>

                          <AnimatePresence>
                            {saveAddressToBook && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-green-100"
                              >
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Adres Başlığı
                                </label>
                                <input
                                  type="text"
                                  value={addressTitle}
                                  onChange={(e) => setAddressTitle(e.target.value)}
                                  placeholder="örn: Evim, İşyerim, Annemin Evi"
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#549658]/20 focus:border-[#549658] transition-all"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Teslimat Tarihi ve Saati */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-700 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Teslimat Zamanı
                  </div>
                  
                  <div className="space-y-4">
                    {/* Tarih Seçimi */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Teslimat Tarihi *
                      </label>
                      <input
                        id="delivery-date"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          applyManualDeliveryDate(next);
                        }}
                        onBlur={() => {
                          if (!deliveryDate) return;
                          if (
                            deliveryDate < MIN_DELIVERY_DATE ||
                            deliveryDate > MAX_DELIVERY_DATE ||
                            isDeliveryDateBlocked(deliveryDate)
                          ) {
                            applyManualDeliveryDate(deliveryDate);
                          }
                        }}
                        min={MIN_DELIVERY_DATE}
                        max={MAX_DELIVERY_DATE}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                      {recipientErrors.date && (
                        <p className="text-[10px] text-red-500 mt-1">{recipientErrors.date}</p>
                      )}
                      {!recipientErrors.date && deliveryDateNotice && (
                        <p className="text-[11px] text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{deliveryDateNotice}</span>
                        </p>
                      )}
                    </div>

                    {/* Saat Seçimi */}
                    <div id="delivery-time">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Teslimat Saati *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: '11:00-17:00', label: '11:00 - 17:00', sublabel: 'Gündüz' },
                          { id: '17:00-22:00', label: '17:00 - 22:00', sublabel: 'Akşam' },
                        ].map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              setDeliveryTimeSlot(slot.id);
                              setRecipientErrors((prev) => ({ ...prev, time: undefined }));
                            }}
                            className={`p-3 rounded-xl border-2 transition-all text-left ${
                              deliveryTimeSlot === slot.id
                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <p className={`text-sm font-medium ${deliveryTimeSlot === slot.id ? 'text-orange-700' : 'text-gray-900'}`}>
                              {slot.label}
                            </p>
                            <p className={`text-[10px] ${deliveryTimeSlot === slot.id ? 'text-orange-600' : 'text-gray-500'}`}>
                              {slot.sublabel}
                            </p>
                          </button>
                        ))}
                      </div>
                      {recipientErrors.time && (
                        <p className="text-[10px] text-red-500 mt-1">{recipientErrors.time}</p>
                      )}
                    </div>

                    {/* Teslimat Notları */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Teslimat Notları (Opsiyonel)
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Kapıcıya bırakın, zil çalınmasın vb."
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation (mobilde adım sonunda statik) */}
                <div className="mt-6">
                  <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep('cart');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                      Geri
                    </button>
                    <button
                      onClick={() => {
                        console.log('=== İLERİ BUTONUNA BASILDI ===');
                        console.log('recipientName:', recipientName, 'length:', recipientName.trim().length);
                        console.log('recipientPhone:', recipientPhone, 'isPhoneValid:', isPhoneValid);
                        console.log('selectedLocation:', selectedLocation);
                        console.log('neighborhood:', neighborhood);
                        console.log('streetName:', streetName);
                        console.log('buildingNo:', buildingNo);
                        console.log('deliveryDate:', deliveryDate);
                        console.log('deliveryTimeSlot:', deliveryTimeSlot);
                        console.log('closedWarning:', closedWarning);
                        
                        const check = validateRecipientStep();
                        console.log('Validation result:', check);
                        
                        if (!check.ok) {
                          console.log('VALIDATION FAILED - firstId:', check.firstId, 'message:', check.message);
                          return;
                        }
                        console.log('VALIDATION OK - geçiş yapılıyor');
                        setCurrentStep('message');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 py-3 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      İleri
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: MESSAGE */}
            {currentStep === 'message' && (
              <motion.div
                key="message"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Sevdiklerinize Ne Söylemek İstersiniz?</h2>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="gold" stroke="gold" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span className="font-medium text-purple-700">%80 müşterimiz mesaj gönderiyor</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Atlamak isterseniz "İleri" butonuna basın</p>
                </div>

                {/* Quick Messages */}
                <div className="grid grid-cols-3 gap-2">
                  {predefinedMessages.map((msg) => {
                    const isActive = !!selectedMessage && selectedMessage.startsWith(`${msg.id}:`);
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleSelectMessage(msg)}
                        className={`p-3 rounded-xl border transition-all text-center active:scale-[0.99] ${
                          isActive
                            ? 'border-[#e05a4c] bg-[#e05a4c]/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl leading-none">{msg.emoji}</span>
                          <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-[#e05a4c]' : 'text-gray-600'}`}>
                            {msg.label}
                          </span>
                          <span className="text-[9px] text-gray-400 leading-none">Dokun: yeni şablon</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-700">Mesajınız</label>
                    <span className="text-[10px] text-gray-400">{messageCard.length}/200</span>
                  </div>
                  <textarea
                    value={messageCard}
                    onChange={(e) => {
                      setMessageCard(e.target.value);
                      setSelectedMessage(null);
                    }}
                    placeholder="Sevdiklerinize özel bir mesaj yazın..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all resize-none"
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Gönderen Adı (Kartta görünecek)
                  </label>
                  <input
                    id="sender-name"
                    type="text"
                    value={senderName}
                    onChange={(e) => {
                      setSenderName(e.target.value);
                      setRecipientErrors((prev) => ({ ...prev, sender: undefined }));
                    }}
                    placeholder="Sevgilerimle, Ahmet"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Fiyat bilgisi gizlenir, tüm siparişler hediye olarak hazırlanır.</p>
                  {recipientErrors.sender && (
                    <p className="text-[10px] text-red-500 mt-1">{recipientErrors.sender}</p>
                  )}
                </div>

                {/* Gift Card Template Preview */}
                <GiftMessagePreview message={messageCard} senderName={senderName} />

                {/* Skip option - More visible */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setMessageCard('');
                      setSelectedMessage(null);
                      // senderName kontrolü
                      if (requiresSenderName && senderName.trim().length < 2) {
                        setRecipientErrors(prev => ({ ...prev, sender: 'Gönderen adı en az 2 karakter olmalıdır' }));
                        scrollToElement('sender-name');
                        return;
                      }
                      setRecipientErrors(prev => ({ ...prev, sender: undefined }));
                      setCurrentStep('payment');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={14} />
                    <span>Mesajsız devam et</span>
                  </button>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Navigation (mobilde adım sonunda statik) */}
                <div className="mt-6">
                  <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep('recipient');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                      Geri
                    </button>
                    <button
                      onClick={() => {
                        // senderName kontrolü - message adımında yapılmalı
                        if (requiresSenderName && senderName.trim().length < 2) {
                          setRecipientErrors(prev => ({ ...prev, sender: 'Gönderen adı en az 2 karakter olmalıdır' }));
                          scrollToElement('sender-name');
                          return;
                        }
                        setRecipientErrors(prev => ({ ...prev, sender: undefined }));
                        setCurrentStep('payment');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 py-3 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      İleri
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: PAYMENT */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-6 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Özeti</h2>
                    <p className="text-sm text-gray-500">Son adım! Siparişinizi tamamlayın</p>
                  </div>
                  {lastPaymentBanner && (
                    <div
                      className={`mx-auto max-w-2xl p-4 rounded-xl border flex items-start gap-3 text-left ${
                        lastPaymentBanner.status === 'failed'
                          ? 'border-red-200 bg-red-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
                    >
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${lastPaymentBanner.status === 'failed' ? 'text-red-600' : 'text-amber-600'}`} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {lastPaymentBanner.status === 'failed' ? 'Ödeme tamamlanamadı' : 'Ödeme yarıda kalmış'}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {lastPaymentBanner.message || 'Lütfen ödeme adımını tekrar deneyin.'}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStep('payment');
                              setLastPaymentBanner(null);
                              scrollToTop();
                              try {
                                localStorage.removeItem('vadiler_checkout_started');
                              } catch {}
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Ödemeye dön
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLastPaymentBanner(null);
                              try {
                                localStorage.removeItem('vadiler_checkout_started');
                              } catch {}
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            Gizle
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Üye / Misafir Seçimi - Sadece giriş yapmamışsa göster */}
                {!isLoggedIn && (
                  <div id="checkout-mode" className="space-y-3">
                    {/* Önemli Başlık */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${
                      checkoutModeError
                        ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/20 animate-[shake_0.5s_ease-in-out]' 
                        : checkoutMode === 'undecided'
                        ? 'border-red-300 bg-red-50/50 animate-pulse' 
                        : 'border-blue-100 bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          checkoutModeError ? 'bg-red-600 animate-pulse' : 'bg-[#e05a4c]'
                        }`}>
                          <AlertCircle size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                            Nasıl devam etmek istersiniz?
                            <span className="text-red-600 text-lg">*</span>
                          </p>
                          <p className="text-xs text-gray-600">
                            Lütfen aşağıdaki seçeneklerden birini seçin
                          </p>
                        </div>
                      </div>
                      {checkoutModeError && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3 mt-3 bg-red-600 text-white rounded-xl px-4 py-3.5 shadow-lg"
                        >
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={18} className="animate-pulse" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm mb-0.5">Zorunlu Seçim!</p>
                            <p className="text-xs opacity-95">
                              {checkoutModeError}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Seçim Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Misafir Olarak Devam */}
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMode('guest');
                          setCheckoutModeError('');
                          setInlineAuthStep('form');
                          setInlineAuthError('');
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left transform hover:scale-[1.02] hover:shadow-lg ${
                          checkoutMode === 'guest'
                            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/20 shadow-md'
                            : checkoutModeError
                            ? 'border-red-400 bg-red-50/30 animate-[shake_0.5s_ease-in-out] shadow-red-400/20 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            checkoutMode === 'guest' ? 'bg-blue-500 scale-110' : 'bg-gray-100'
                          }`}>
                            <User size={22} className={checkoutMode === 'guest' ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <div>
                            <p className={`font-bold text-base ${
                              checkoutMode === 'guest' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              Misafir Olarak Devam
                            </p>
                            <p className="text-[11px] text-gray-500">🚀 Kayıt olmadan • Hemen</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">E-posta ve telefon ile sipariş takibi yapabilirsiniz</p>
                        {checkoutMode === 'guest' && (
                          <div className="mt-2 flex items-center gap-1 text-blue-600">
                            <Check size={14} strokeWidth={3} />
                            <span className="text-xs font-semibold">Seçildi</span>
                          </div>
                        )}
                      </button>

                      {/* Üye Ol / Giriş Yap */}
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutMode('login');
                          setCheckoutModeError('');
                          setInlineAuthStep('form');
                          setInlineAuthError('');
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left transform hover:scale-[1.02] hover:shadow-lg ${
                          checkoutMode === 'login' || checkoutMode === 'register'
                            ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20 shadow-md'
                            : checkoutModeError
                            ? 'border-red-400 bg-red-50/30 animate-[shake_0.5s_ease-in-out] shadow-red-400/20 shadow-lg'
                            : 'border-gray-200 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            checkoutMode === 'login' || checkoutMode === 'register' ? 'bg-emerald-500 scale-110' : 'bg-gray-100'
                          }`}>
                            <Check size={22} className={checkoutMode === 'login' || checkoutMode === 'register' ? 'text-white' : 'text-gray-500'} />
                          </div>
                          <div>
                            <p className={`font-bold text-base ${
                              checkoutMode === 'login' || checkoutMode === 'register' ? 'text-emerald-700' : 'text-gray-700'
                            }`}>
                              Üye Ol veya Giriş Yap
                            </p>
                            <p className="text-[11px] text-gray-500">⭐ Siparişlerinizi takip edin</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">Adres defteri, sipariş geçmişi ve daha fazlası</p>
                        {(checkoutMode === 'login' || checkoutMode === 'register') && (
                          <div className="mt-2 flex items-center gap-1 text-emerald-600">
                            <Check size={14} strokeWidth={3} />
                            <span className="text-xs font-semibold">Seçildi</span>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Misafir İletişim Formu */}
                    <AnimatePresence>
                      {checkoutMode === 'guest' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 mt-3">
                            <p className="text-xs text-blue-700">
                              Sipariş durumunu takip edebilmeniz için iletişim bilgilerinizi girin.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="email"
                                id="guest-email"
                                value={guestEmail}
                                onChange={(e) => {
                                  setGuestEmail(e.target.value);
                                  if (guestEmailError) setGuestEmailError('');
                                }}
                                onBlur={() => {
                                  const v = guestEmail.trim();
                                  if (!v) {
                                    setGuestEmailError('');
                                    return;
                                  }
                                  setGuestEmailError(validateEmail(v) ? '' : 'Geçerli bir e-posta girin');
                                }}
                                placeholder="E-posta adresiniz *"
                                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                  guestEmailError ? 'border-red-300' : 'border-blue-200'
                                }`}
                              />
                              <input
                                type="tel"
                                id="guest-phone"
                                value={guestPhone}
                                onChange={handleGuestPhoneChange}
                                inputMode="numeric"
                                autoComplete="tel"
                                maxLength={13}
                                placeholder="Telefon numaranız *"
                                className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                                  guestPhoneError ? 'border-red-300' : 'border-blue-200'
                                }`}
                              />
                            </div>
                            {(guestEmailError || guestPhoneError) && (
                              <p className="text-[11px] text-red-600">{guestEmailError || guestPhoneError}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline Login/Register Form */}
                    <AnimatePresence>
                      {(checkoutMode === 'login' || checkoutMode === 'register') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 mt-3">
                            {/* Tab Switch */}
                            <div className="flex gap-2 p-1 bg-emerald-100 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutMode('login');
                                  setInlineAuthStep('form');
                                  setInlineAuthError('');
                                }}
                                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                                  checkoutMode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600'
                                }`}
                              >
                                Giriş Yap
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutMode('register');
                                  setInlineAuthStep('form');
                                  setInlineAuthError('');
                                }}
                                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                                  checkoutMode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600'
                                }`}
                              >
                                Üye Ol
                              </button>
                            </div>

                            {inlineAuthError && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs text-red-600">{inlineAuthError}</p>
                              </div>
                            )}

                            {/* Login Form */}
                            {checkoutMode === 'login' && inlineAuthStep === 'form' && (
                              <div className="space-y-3">
                                <input
                                  type="email"
                                  value={inlineLoginEmail}
                                  onChange={(e) => setInlineLoginEmail(e.target.value)}
                                  placeholder="E-posta adresiniz"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <input
                                  type="password"
                                  value={inlineLoginPassword}
                                  onChange={(e) => setInlineLoginPassword(e.target.value)}
                                  placeholder="Şifreniz"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!inlineLoginEmail || !inlineLoginPassword) {
                                      setInlineAuthError('E-posta ve şifre gerekli');
                                      return;
                                    }
                                    setInlineAuthLoading(true);
                                    setInlineAuthError('');
                                    try {
                                      const res = await fetch('/api/customers/login/start', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: inlineLoginEmail, password: inlineLoginPassword }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) {
                                        setInlineAuthError(data.error || 'Giriş başarısız');
                                      } else if (data.otpRequired) {
                                        setInlineOtpId(data.otpId);
                                        setInlineOtpEmail(data.email);
                                        setInlineOtpPurpose('login');
                                        setInlineAuthStep('otp');
                                      }
                                    } catch {
                                      setInlineAuthError('Bir hata oluştu');
                                    } finally {
                                      setInlineAuthLoading(false);
                                    }
                                  }}
                                  disabled={inlineAuthLoading}
                                  className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {inlineAuthLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                  Giriş Yap
                                </button>
                              </div>
                            )}

                            {/* Register Form */}
                            {checkoutMode === 'register' && inlineAuthStep === 'form' && (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={inlineRegisterName}
                                  onChange={(e) => setInlineRegisterName(e.target.value)}
                                  placeholder="Adınız Soyadınız"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <input
                                  type="email"
                                  value={inlineRegisterEmail}
                                  onChange={(e) => setInlineRegisterEmail(e.target.value)}
                                  placeholder="E-posta adresiniz"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <input
                                  type="tel"
                                  value={inlineRegisterPhone}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 0 && !val.startsWith('0')) val = '0' + val;
                                    if (val.length > 4) val = val.slice(0, 4) + ' ' + val.slice(4);
                                    if (val.length > 8) val = val.slice(0, 8) + ' ' + val.slice(8);
                                    if (val.length > 11) val = val.slice(0, 11) + ' ' + val.slice(11);
                                    setInlineRegisterPhone(val.slice(0, 13));
                                  }}
                                  placeholder="Telefon (05XX XXX XX XX)"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <input
                                  type="password"
                                  value={inlineRegisterPassword}
                                  onChange={(e) => setInlineRegisterPassword(e.target.value)}
                                  placeholder="Şifre (min 6 karakter)"
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!inlineRegisterName || !inlineRegisterEmail || !inlineRegisterPhone || !inlineRegisterPassword) {
                                      setInlineAuthError('Tüm alanları doldurun');
                                      return;
                                    }
                                    if (inlineRegisterPassword.length < 6) {
                                      setInlineAuthError('Şifre en az 6 karakter olmalı');
                                      return;
                                    }
                                    setInlineAuthLoading(true);
                                    setInlineAuthError('');
                                    try {
                                      const res = await fetch('/api/customers/register/start', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          name: inlineRegisterName,
                                          email: inlineRegisterEmail,
                                          phone: inlineRegisterPhone.replace(/\s/g, ''),
                                          password: inlineRegisterPassword,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) {
                                        setInlineAuthError(data.error || 'Kayıt başarısız');
                                      } else if (data.otpRequired) {
                                        setInlineOtpId(data.otpId);
                                        setInlineOtpEmail(data.email);
                                        setInlineOtpPurpose('register');
                                        setInlineAuthStep('otp');
                                      }
                                    } catch {
                                      setInlineAuthError('Bir hata oluştu');
                                    } finally {
                                      setInlineAuthLoading(false);
                                    }
                                  }}
                                  disabled={inlineAuthLoading}
                                  className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {inlineAuthLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                  Üye Ol
                                </button>
                              </div>
                            )}

                            {/* OTP Verification */}
                            {inlineAuthStep === 'otp' && (
                              <div className="space-y-3">
                                <div className="text-center p-3 bg-white rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <strong>{inlineOtpEmail}</strong> adresine 6 haneli doğrulama kodu gönderdik
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  value={inlineOtpCode}
                                  onChange={(e) => setInlineOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="6 haneli kod"
                                  maxLength={6}
                                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (inlineOtpCode.length !== 6) {
                                      setInlineAuthError('6 haneli kodu girin');
                                      return;
                                    }
                                    setInlineAuthLoading(true);
                                    setInlineAuthError('');
                                    try {
                                      const endpoint = inlineOtpPurpose === 'login' 
                                        ? '/api/customers/login/verify' 
                                        : '/api/customers/register/verify';
                                      const res = await fetch(endpoint, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ otpId: inlineOtpId, email: inlineOtpEmail, code: inlineOtpCode }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) {
                                        setInlineAuthError(data.error || 'Doğrulama başarısız');
                                      } else {
                                        // Login successful - CustomerContext will handle session
                                        window.location.reload();
                                      }
                                    } catch {
                                      setInlineAuthError('Bir hata oluştu');
                                    } finally {
                                      setInlineAuthLoading(false);
                                    }
                                  }}
                                  disabled={inlineAuthLoading}
                                  className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {inlineAuthLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                  Doğrula
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineAuthStep('form');
                                    setInlineOtpCode('');
                                  }}
                                  className="w-full text-xs text-emerald-600 hover:underline"
                                >
                                  Geri dön
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {/* Products */}
                  <div className="space-y-2">
                    {state.items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          {getMediaType(item.product.image) === 'video' ? (
                            <video
                              src={item.product.image}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                              autoPlay
                            />
                          ) : (
                            <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} adet</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ara Toplam</span>
                      <span className="text-gray-900">{formatPrice(getTotalPrice())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Teslimat</span>
                      <span className="text-[#549658] font-medium">Ücretsiz</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Toplam</span>
                      <span className="text-lg font-bold text-[#e05a4c]">{formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Info Summary */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Teslimat Adresi</p>
                      <p className="text-sm font-medium text-gray-900">{recipientName}</p>
                      <p className="text-xs text-gray-600">{recipientAddress}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentStep('recipient');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                      className="text-xs text-[#e05a4c] hover:text-[#cd3f31] font-medium transition-colors"
                    >
                      Düzenle
                    </button>
                  </div>

                  {messageCard && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Mesaj Kartı</p>
                        <p className="text-sm text-gray-700 italic truncate">&ldquo;{messageCard}&rdquo;</p>
                      </div>
                      <button 
                        onClick={() => {
                          setCurrentStep('message');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                        className="text-xs text-[#e05a4c] hover:text-[#cd3f31] font-medium transition-colors"
                      >
                        Düzenle
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Ödeme Yöntemi Seçin</p>
                  <div className="space-y-3">
                    {/* Kredi Kartı Seçeneği */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentMethod('credit_card');
                        trackEvent({
                          eventName: 'select_payment_method',
                          eventCategory: 'ecommerce',
                          eventLabel: 'credit_card',
                          properties: {
                            payment_method: 'credit_card',
                            cart_total: getTotalPrice(),
                          },
                        });
                      }}
                      className={`w-full border-2 rounded-xl p-4 transition-all text-left ${
                        selectedPaymentMethod === 'credit_card'
                          ? 'border-[#e05a4c] bg-[#e05a4c]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'credit_card' ? 'border-[#e05a4c]' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'credit_card' && (
                            <div className="w-3 h-3 bg-[#e05a4c] rounded-full" />
                          )}
                        </div>
                        <CreditCard size={24} className={selectedPaymentMethod === 'credit_card' ? 'text-[#e05a4c]' : 'text-gray-400'} />
                        <div>
                          <p className={`font-semibold ${selectedPaymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-700'}`}>
                            Kredi/Banka Kartı
                          </p>
                          <p className="text-xs text-gray-500">Güvenli 3D Secure ile ödeme</p>
                        </div>
                      </div>
                    </button>

                    {/* Havale/EFT Seçeneği */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentMethod('bank_transfer');
                        trackEvent({
                          eventName: 'select_payment_method',
                          eventCategory: 'ecommerce',
                          eventLabel: 'bank_transfer',
                          properties: {
                            payment_method: 'bank_transfer',
                            cart_total: getTotalPrice(),
                          },
                        });
                      }}
                      className={`w-full border-2 rounded-xl p-4 transition-all text-left ${
                        selectedPaymentMethod === 'bank_transfer'
                          ? 'border-[#549658] bg-[#549658]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'bank_transfer' ? 'border-[#549658]' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'bank_transfer' && (
                            <div className="w-3 h-3 bg-[#549658] rounded-full" />
                          )}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={selectedPaymentMethod === 'bank_transfer' ? 'text-[#549658]' : 'text-gray-400'}>
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="M12 9v6"/>
                          <path d="M8 12h8"/>
                        </svg>
                        <div>
                          <p className={`font-semibold ${selectedPaymentMethod === 'bank_transfer' ? 'text-gray-900' : 'text-gray-700'}`}>
                            Havale / EFT
                          </p>
                          <p className="text-xs text-gray-500">Banka havalesi ile ödeme</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Premium Trust Badges - Apple Style */}
                  {selectedPaymentMethod === 'credit_card' && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-semibold text-slate-700">256-bit SSL Şifreleme Aktif</span>
                      </div>
                      
                      <div className="flex items-center justify-center mb-3">
                        <Image
                          src="/logo_band_colored@3x.png"
                          alt="Güvenli Ödeme"
                          width={300}
                          height={20}
                          className="w-full h-auto object-contain max-w-xs opacity-80"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2 pb-3 border-b border-slate-200/50">
                        <span className="text-[11px] text-slate-500">Güvenli ödeme:</span>
                        <Image
                          src="iyzico/iyzico.svg"
                          alt="iyzico"
                          width={60}
                          height={20}
                          className="h-5 w-auto"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </div>
                          <p className="text-[9px] font-medium text-slate-700">Güvenli<br/>Ödeme</p>
                        </div>
                        <div className="text-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                          </div>
                          <p className="text-[9px] font-medium text-slate-700">%100<br/>Koruma</p>
                        </div>
                        <div className="text-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <p className="text-[9px] font-medium text-slate-700">3D Secure<br/>Onaylı</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3DS Info Box - Kredi Kartı seçiliyse */}
                {selectedPaymentMethod === 'credit_card' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Güvenli Ödeme Bilgilendirmesi
                        </p>
                        <p className="text-xs text-blue-800">
                          &quot;Siparişi Tamamla&quot; butonuna tıkladıktan sonra bankanızın 3D Secure sayfasına yönlendirileceksiniz. 
                          Kart bilgilerinizi ve SMS ile gelen doğrulama kodunu güvenli bir şekilde girebilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Havale Bilgilendirme - Havale seçiliyse */}
                {selectedPaymentMethod === 'bank_transfer' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#549658] rounded-full flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="M12 9v6"/>
                          <path d="M8 12h8"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Havale / EFT Bilgilendirmesi
                        </p>
                        <p className="text-xs text-green-800">
                          Siparişinizi tamamladıktan sonra banka hesap bilgileri ve sipariş numaranız gösterilecektir. 
                          Havale açıklamasına sipariş numaranızı yazmayı unutmayın.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="terms-checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#e05a4c] focus:ring-[#e05a4c]" 
                  />
                  <span>
                    <Link href="/mesafeli-satis" className="text-[#e05a4c] hover:underline">Mesafeli satış sözleşmesini</Link> ve{' '}
                    <Link href="/gizlilik" className="text-[#e05a4c] hover:underline">gizlilik politikasını</Link> okudum, kabul ediyorum.
                  </span>
                </label>

                {/* Navigation (mobilde adım sonunda statik) */}
                {!showBankTransferModal && (
                  <div className="mt-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setCurrentStep('message');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                        >
                          Geri
                        </button>
                        <button
                          onClick={handleCompleteOrder}
                          disabled={isProcessing}
                          className={`relative flex-1 py-3.5 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedPaymentMethod === 'bank_transfer' 
                              ? 'bg-[#549658] hover:bg-[#468a4a] active:scale-95' 
                              : 'bg-[#e05a4c] hover:bg-[#cd3f31] active:scale-95'
                          } ${isProcessing ? 'shadow-xl' : 'hover:shadow-lg'}`}
                        >
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black/10 rounded-xl animate-pulse" />
                          )}
                          {isProcessing ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>İşleniyor...</span>
                            </>
                          ) : selectedPaymentMethod === 'bank_transfer' ? (
                            <>
                              <Check size={18} />
                              <span>Siparişi Tamamla</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={18} />
                              <span>Ödemeyi Yap</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-[10px] text-center text-gray-400">
                        🔒 {selectedPaymentMethod === 'bank_transfer' 
                          ? 'Siparişiniz güvenli bir şekilde oluşturulacaktır' 
                          : 'Ödeme bilgileriniz 256-bit SSL ile korunmaktadır'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bank Transfer Modal - Apple Pay Style */}
      {showBankTransferModal && bankTransferOrderNumber && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-stretch sm:items-center justify-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:mx-4 rounded-none sm:rounded-3xl overflow-y-auto shadow-2xl flex flex-col"
          >
            {/* Success Header */}
            <div className="pt-6 pb-4 px-6 text-center relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">Ödeme Bekleniyor</h3>
              <p className="text-gray-500 text-sm mt-1">Havale sonrası siparişiniz onaylanacak</p>
            </div>

            {/* Amount Card */}
            <div className="mx-6 mb-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Ödenecek Tutar</p>
                  <p className="text-2xl font-bold mt-0.5">{formatPrice(bankTransferTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Sipariş No</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold">#{bankTransferOrderNumber}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(bankTransferOrderNumber));
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details - Compact */}
            <div className="px-6 pb-4 space-y-2">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Banka</span>
                <Image src="/TR/garanti.svg" alt="Garanti Bankası" width={100} height={24} className="h-6 w-auto" />
              </div>
              <div className="py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm block mb-1">Hesap Sahibi</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900 text-center">STR GRUP A.Ş</p>
                  <button
                    onClick={() => navigator.clipboard.writeText('STR GRUP A.Ş')}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Kopyala</span>
                  </button>
                </div>
              </div>
              <div className="py-2.5">
                <span className="text-gray-500 text-sm block mb-1">IBAN</span>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-mono text-sm text-gray-900 leading-relaxed text-center">TR12 0006 2000 7520 0006 2942 76</p>
                  <button
                    onClick={() => navigator.clipboard.writeText('TR120006200075200006294276')}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>IBAN&#39;ı Kopyala</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mx-6 mb-4 bg-amber-50 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Açıklama kısmına <strong className="text-amber-900">{bankTransferOrderNumber}</strong> yazın
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 space-y-2">
              <Link
                href={`/siparis-takip?order=${bankTransferOrderNumber}`}
                className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                Siparişi Takip Et
              </Link>
              <Link
                href="/"
                className="w-full py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors text-center block"
              >
                Alışverişe Devam Et
              </Link>
            </div>
          </motion.div>
        </div>
      )}
      
      {deliveryOffDayDialog && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/25" onClick={() => setDeliveryOffDayDialog(null)}></div>
          <div className="relative bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-100 max-w-xs w-full p-4">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Teslimat yapılamıyor</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{deliveryOffDayDialog}</p>
              </div>
            </div>
            <button
              onClick={() => setDeliveryOffDayDialog(null)}
              className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      <Footer />
      {/* Checkout Step Nav - Bottom Mobile */}
      {!isEmpty && currentStep !== 'success' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden">
          <div className="flex gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (index < currentStepIndex) {
                      setCurrentStep(step.id as CheckoutStep);
                    }
                  }}
                  disabled={index > currentStepIndex}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#e05a4c] text-white'
                      : isCompleted
                      ? 'bg-[#549658] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={step.label}
                >
                  <StepIcon size={16} />
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
