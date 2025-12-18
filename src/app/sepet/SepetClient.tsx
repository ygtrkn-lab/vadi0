'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useCustomer, Address } from '@/context/CustomerContext';
import { useOrder } from '@/context/OrderContext';
import { Header, Footer } from '@/components';
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
  Gift,
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

const EUROPE_DISTRICTS = ISTANBUL_REGIONS[0].districts;

type CheckoutStep = 'cart' | 'recipient' | 'message' | 'payment' | 'success';

function extractInlineScripts(html: string): string[] {
  const matches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  const scripts: string[] = [];
  for (const m of matches) {
    const code = (m[1] || '').trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

export default function SepetClient() {
  const { state, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { state: customerState, addOrderToCustomer, addAddress } = useCustomer();
  const { createOrder, simulatePayment } = useOrder();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: number; id: string } | null>(null);
  
  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [istanbulSide, setIstanbulSide] = useState<'avrupa' | ''>('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState(0);
  const [neighborhood, setNeighborhood] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isGift, setIsGift] = useState(true);
  const [senderName, setSenderName] = useState('');
  const [messageCard, setMessageCard] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  
  // Location dropdown states
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'region' | 'district'>('region');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  // Saved address selection
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);
  const [addressTitle, setAddressTitle] = useState('');
  
  // Payment states
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [threeDSHtmlContent, setThreeDSHtmlContent] = useState<string | null>(null);
  const iyzicoContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Misafir checkout states
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPhoneError, setGuestPhoneError] = useState('');
  const [guestEmailError, setGuestEmailError] = useState('');

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

  // Auto-populate guest phone from recipient phone on payment step
  useEffect(() => {
    if (currentStep === 'payment' && !isLoggedIn && recipientPhone && !guestPhone) {
      setGuestPhone(recipientPhone);
    }
  }, [currentStep, isLoggedIn, recipientPhone, guestPhone]);

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
  
  // Global delivery info'dan teslimat bilgilerini yükle (ürün detay sayfasından seçilen)
  useEffect(() => {
    if (state.globalDeliveryInfo) {
      const { location, district: globalDistrict, date, timeSlot } = state.globalDeliveryInfo;
      
      // Lokasyon bilgisini ayarla
      if (location) {
        // İlçe ve yaka bilgisini ayarla (sadece Avrupa yakası destekleniyor)
        if (globalDistrict && EUROPE_DISTRICTS.some(d => d.toLowerCase() === globalDistrict.toLowerCase())) {
          setSelectedLocation(location);
          setDistrict(globalDistrict);
          setIstanbulSide('avrupa');
        } else {
          // Desteklenmeyen ilçe ise sıfırla
          setSelectedLocation(null);
          setDistrict('');
          setIstanbulSide('');
        }
      }
      
      // Tarih bilgisini ayarla
      if (date) {
        const dateObj = new Date(date);
        const formattedDate = formatLocalISODate(dateObj);
        setDeliveryDate(formattedDate < MIN_DELIVERY_DATE ? MIN_DELIVERY_DATE : formattedDate);
      }
      
      // Zaman dilimi bilgisini ayarla
      if (timeSlot) {
        setDeliveryTimeSlot(normalizeDeliveryTimeSlot(timeSlot));
      }
    }
  }, [state.globalDeliveryInfo]);
  
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
  }, [customerState.currentCustomer]);

  // Mount iyzico CheckoutForm directly into the modal (no iframe)
  useEffect(() => {
    if (!show3DSModal || !threeDSHtmlContent) return;
    const container = iyzicoContainerRef.current;
    if (!container) return;

    try {
      const decoded = atob(threeDSHtmlContent);

      // Clear previous content
      container.innerHTML = '';

      // Ensure required container exists for iyzico script
      const checkoutDiv = document.createElement('div');
      checkoutDiv.id = 'iyzipay-checkout-form';
      checkoutDiv.className = 'responsive';
      container.appendChild(checkoutDiv);

      // Reset global iyziInit so the returned script can initialize again
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (w.iyziInit) {
          delete w.iyziInit;
          w.iyziInit = undefined;
        }
      } catch {
        // ignore
      }

      // Remove previously injected checkout bundle scripts to avoid stale init
      for (const s of Array.from(document.querySelectorAll('script[data-iyzico-checkout="1"]'))) {
        s.parentElement?.removeChild(s);
      }

      // Most of the time iyzico returns only a <script> block.
      // Execute scripts by appending them as real script tags.
      const scripts = extractInlineScripts(decoded);
      for (const code of scripts) {
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.setAttribute('data-iyzico-checkout', '1');
        scriptEl.text = code;
        document.body.appendChild(scriptEl);
      }

      // If content is not script-wrapped, fall back to injecting it into the container.
      if (scripts.length === 0) {
        container.insertAdjacentHTML('beforeend', decoded);
      }
    } catch (e) {
      console.error('❌ Failed to mount iyzico checkout form:', e);
    }
  }, [show3DSModal, threeDSHtmlContent]);

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

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedSavedAddress(addr);
    setRecipientName(addr.recipientName);
    setRecipientPhone(formatPhoneNumber(normalizeTrMobileDigits(addr.recipientPhone)));
    setPhoneError('');
    setSaveAddressToBook(false);
    setAddressTitle('');
    // İstanbul için yaka belirleme (kayıtlı adres İstanbul ise)
    if (addr.province.toLowerCase().includes('istanbul')) {
      // Sadece Avrupa yakası desteklenir
      if (EUROPE_DISTRICTS.some(d => d.toLowerCase() === addr.district.toLowerCase())) {
        setIstanbulSide('avrupa');
        setSelectedLocation(`${addr.district}, İstanbul`);
      } else {
        // Destek dışı ilçe: seçimleri sıfırla
        setIstanbulSide('');
        setSelectedLocation(null);
      }
    }
    setDistrict(addr.district);
    setDistrictId(addr.districtId);
    setNeighborhood(addr.neighborhood);
    setRecipientAddress(addr.fullAddress);
    setShowAddressForm(false);
  };

  // Location dropdown handlers
  const handleRegionSelect = (regionId: 'avrupa') => {
    setIstanbulSide(regionId);
    setLocationStep('district');
    setLocationSearch('');
  };

  const handleDistrictSelect = (districtName: string) => {
    setDistrict(districtName);
    const region = ISTANBUL_REGIONS.find(r => r.id === istanbulSide);
    setSelectedLocation(`${districtName}, ${region?.name}`);
    setIsLocationOpen(false);
    setLocationSearch('');
    setLocationStep('region');
  };

  const resetLocationSelection = () => {
    setIstanbulSide('');
    setDistrict('');
    setDistrictId(0);
    setNeighborhood('');
    setSelectedLocation(null);
    setLocationStep('region');
    setLocationSearch('');
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
  const requiresSenderName = isGift;
  const canProceedToMessage = recipientName.length >= 3 && isPhoneValid && recipientAddress.length >= 10 && district.length > 0 && deliveryDate.length > 0 && isValidDeliveryTimeSlot(deliveryTimeSlot) && (!requiresSenderName || senderName.trim().length >= 2);
  const guestEmailTrim = guestEmail.trim();
  const guestPhoneDigits = normalizeTrMobileDigits(guestPhone);
  const isGuestEmailValid = guestEmailTrim.length === 0 ? false : validateEmail(guestEmailTrim);
  const isGuestPhoneValid = guestPhoneDigits.length === 0 ? false : validatePhoneNumber(guestPhone);
  const hasGuestContact = isLoggedIn || (isGuestEmailValid && isGuestPhoneValid);
  const canProceedToPayment = canProceedToMessage;
  const canCompletePayment = acceptTerms && hasGuestContact;

  const handleCompleteOrder = async () => {
    if (!canCompletePayment) return;

    // Teslimat tarihi her zaman en erken yarın olmalı (mobil/manual giriş edge-case)
    if (!deliveryDate || deliveryDate < MIN_DELIVERY_DATE) {
      alert('Teslimat tarihi en erken yarın seçilebilir.');
      setCurrentStep('recipient');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Teslimat saati seçilmeden devam edilemez
    if (!isValidDeliveryTimeSlot(deliveryTimeSlot)) {
      alert('Lütfen teslimat saatini seçin.');
      setCurrentStep('recipient');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Hediye ise gönderen adı zorunlu
    if (isGift && senderName.trim().length < 2) {
      alert('Bu bir hediye seçiliyse gönderen adını yazmanız gerekiyor.');
      setCurrentStep('recipient');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Misafir checkout için e-posta VE telefon gerekli
    if (!isLoggedIn) {
      if (!guestEmailTrim || !isGuestEmailValid) {
        alert('Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
      if (!guestPhoneDigits || !isGuestPhoneValid) {
        alert('Lütfen geçerli bir Türkiye cep telefonu numarası girin (5XX XXX XX XX).');
        return;
      }
    }
    
    setIsProcessing(true);

    try {
      // Adresi defterime kaydet (sadece giriş yapmış kullanıcılar için ve yeni adres ise)
      if (isLoggedIn && customerState.currentCustomer && saveAddressToBook && !selectedSavedAddress) {
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
          fullAddress: recipientAddress,
          isDefault: customerState.currentCustomer.addresses.length === 0, // İlk adres ise varsayılan yap
        };
        
        const addressSaved = await addAddress(customerState.currentCustomer.id, newAddress);
        if (!addressSaved) {
          console.warn('Adres kaydedilemedi, ancak sipariş devam ediyor.');
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
        console.log('👤 Guest checkout - order will be created without customer_id');
      }

      // Create order with pending_payment status
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
          fullAddress: recipientAddress,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
          deliveryTimeSlot: isValidDeliveryTimeSlot(deliveryTimeSlot) ? normalizeDeliveryTimeSlot(deliveryTimeSlot) : null,
          deliveryNotes,
        },
        payment: {
          method: 'credit_card',
          status: 'pending',
        },
        message: (messageCard || isGift) ? {
          content: messageCard || '',
          senderName: senderName || '',
          isGift,
        } : null,
        status: 'pending_payment',
      });

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.error || 'Sipariş oluşturulamadı');
      }

      console.log('✅ Order created:', orderResult.order.id);

      // Initialize iyzico 3DS payment
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

      console.log('✅ Payment initialized:', paymentData.paymentId);

      // Show 3DS modal with HTML content
      setThreeDSHtmlContent(paymentData.threeDSHtmlContent);
      setShow3DSModal(true);
      
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
        <main className="min-h-screen bg-white pt-32 lg:pt-44 pb-32">
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
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-32 lg:pt-44 pb-32">
        <div className="max-w-2xl mx-auto px-4">
          
          {/* Step Indicator - Minimal */}
          {!isEmpty && currentStep !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-8">
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#e05a4c] text-white'
                          : isCompleted
                          ? 'bg-[#549658] text-white cursor-pointer'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={12} />
                      ) : (
                        <StepIcon size={12} />
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`w-6 h-0.5 ${index < currentStepIndex ? 'bg-[#549658]' : 'bg-gray-200'}`} />
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
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Sepetiniz boş
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                      Sevdiklerinize güzel bir sürpriz yapmaya ne dersiniz?
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e05a4c] text-white text-sm font-medium rounded-full hover:bg-[#cd3f31] transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Alışverişe Başla
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-0">
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
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
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
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 active:scale-95 transition-transform"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 active:scale-95 transition-transform"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.product.id)}
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

                    {/* Mobile Sticky Continue Button */}
                    <div className="fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:bg-transparent sm:backdrop-blur-0 sm:border-0 sm:p-0 sm:pb-0">
                      <div className="max-w-2xl mx-auto">
                        <button
                          onClick={() => setCurrentStep('recipient')}
                          disabled={!canProceedToRecipient}
                          className="w-full py-3.5 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="space-y-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-0"
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Teslimat Adresi</h2>
                  <p className="text-sm text-gray-500">Çiçekleri nereye gönderelim?</p>
                </div>

                {/* Kayıtlı Adresler */}
                {customerState.currentCustomer && customerState.currentCustomer.addresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-gray-600">Kayıtlı Adresler</p>
                    <div className="space-y-2">
                      {customerState.currentCustomer.addresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all
                            ${selectedSavedAddress?.id === addr.id 
                              ? 'border-[#e05a4c] bg-[#e05a4c]/5 ring-4 ring-[#e05a4c]/10' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                              ${selectedSavedAddress?.id === addr.id ? 'border-[#e05a4c] bg-[#e05a4c]' : 'border-gray-300'}`}>
                              {selectedSavedAddress?.id === addr.id && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-gray-900">
                                  {addr.title || (addr.type === 'home' ? 'Ev' : addr.type === 'work' ? 'İş' : 'Diğer')}
                                </span>
                                {addr.isDefault && (
                                  <span className="flex items-center gap-1 text-[10px] text-[#549658] font-medium">
                                    <Star size={10} className="fill-current" />
                                    Varsayılan
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{addr.recipientName}</p>
                              <p className="text-xs text-gray-500 truncate">{addr.fullAddress}</p>
                              <p className="text-xs text-gray-400">{addr.district}/{addr.province}</p>
                            </div>
                          </div>
                        </button>
                      ))}
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
                        setRecipientAddress('');
                        setSelectedLocation(null);
                        setShowAddressForm(true);
                      }}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-[#e05a4c] hover:text-[#e05a4c] transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Farklı Adres Gir
                    </button>
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
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Çiçeği alacak kişinin adı"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Alıcı Telefonu *
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
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
                          type="button"
                          onClick={() => setIsLocationOpen(!isLocationOpen)}
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

                        {/* Location Dropdown */}
                        <AnimatePresence>
                          {isLocationOpen && !selectedLocation && (
                            <motion.div
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
                                      return (
                                        <button
                                          key={region.id}
                                          type="button"
                                          onClick={() => {
                                            if (isAnadolu) return;
                                            handleRegionSelect(region.id as 'avrupa');
                                          }}
                                          disabled={isAnadolu}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                                            isAnadolu ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:bg-[#e05a4c]/5'
                                          }`}
                                        >
                                          <MapPin size={14} className={isAnadolu ? 'text-gray-400' : 'text-[#e05a4c]'} />
                                          <span className={`text-sm flex-1 ${isAnadolu ? 'text-gray-500' : 'text-gray-700'}`}>{region.name}</span>
                                          <ChevronRight size={14} className={isAnadolu ? 'text-gray-200' : 'text-gray-300'} />
                                        </button>
                                      );
                                    })}
                                    <p className="text-[11px] text-amber-600 mt-2 px-2">Anadolu yakası çok yakında!</p>
                                  </div>
                                ) : (
                                  <div className="p-2">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">
                                      {currentRegion?.name} - İlçeler
                                    </p>
                                    {filteredDistricts.map((districtName) => (
                                      <button
                                        key={districtName}
                                        type="button"
                                        onClick={() => handleDistrictSelect(districtName)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#e05a4c]/5 transition-colors text-left"
                                      >
                                        <Check size={14} className="text-transparent" />
                                        <span className="text-sm text-gray-700">{districtName}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mahalle - sadece ilçe seçildiyse göster */}
                      <AnimatePresence>
                        {selectedLocation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Mahalle
                            </label>
                            <input
                              type="text"
                              value={neighborhood}
                              onChange={(e) => setNeighborhood(e.target.value)}
                              placeholder="Mahalle adını yazın"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Açık Adres *
                        </label>
                        <div className="relative">
                          <Home size={16} className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="Sokak, bina no, daire no, kat gibi detayları yazın"
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all resize-none"
                          />
                        </div>
                      </div>

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
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (!next) {
                            setDeliveryDate('');
                            return;
                          }
                          // Min ve max kontrol
                          if (next < MIN_DELIVERY_DATE) {
                            setDeliveryDate(MIN_DELIVERY_DATE);
                            return;
                          }
                          if (next > MAX_DELIVERY_DATE) {
                            setDeliveryDate(MAX_DELIVERY_DATE);
                            return;
                          }
                          setDeliveryDate(next);
                        }}
                        onBlur={() => {
                          if (!deliveryDate) return;
                          if (deliveryDate < MIN_DELIVERY_DATE) setDeliveryDate(MIN_DELIVERY_DATE);
                          if (deliveryDate > MAX_DELIVERY_DATE) setDeliveryDate(MAX_DELIVERY_DATE);
                        }}
                        min={MIN_DELIVERY_DATE}
                        max={MAX_DELIVERY_DATE}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Saat Seçimi */}
                    <div>
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
                            onClick={() => setDeliveryTimeSlot(slot.id)}
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

                {/* Gift Option */}
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-pink-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bu bir hediye</p>
                      <p className="text-[10px] text-gray-500">Fiyat bilgisi gizlensin</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsGift(!isGift)}
                    className={`w-10 h-6 rounded-full transition-colors ${isGift ? 'bg-pink-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isGift ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {isGift && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Gönderen Adı (Kartta görünecek) *
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Sevgilerimle, Ahmet"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c] transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Hediye seçiliyse gönderen adı zorunludur.</p>
                  </motion.div>
                )}

                {/* Navigation (sticky on mobile) */}
                <div className="fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:bg-transparent sm:backdrop-blur-0 sm:border-0 sm:p-0 sm:pb-0">
                  <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                      onClick={() => setCurrentStep('cart')}
                      className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Geri
                    </button>
                    <button
                      onClick={() => {
                        if (!isValidDeliveryTimeSlot(deliveryTimeSlot)) {
                          alert('Lütfen teslimat saatini seçin (Gündüz veya Akşam).');
                          return;
                        }
                        if (!canProceedToMessage) return;
                        setCurrentStep('message');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={!canProceedToMessage}
                      className="flex-1 py-3 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="space-y-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-0"
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Mesaj Kartı</h2>
                  <p className="text-sm text-gray-500">Çiçeğinizle birlikte bir not gönderin (opsiyonel)</p>
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

                {/* Preview */}
                {messageCard && (
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                    <p className="text-[10px] text-pink-600 font-medium mb-1">Kart Önizleme</p>
                    <p className="text-sm text-gray-700 italic">&ldquo;{messageCard}&rdquo;</p>
                    {senderName && <p className="text-xs text-gray-500 text-right mt-2">- {senderName}</p>}
                  </div>
                )}

                {/* Skip option */}
                <button
                  type="button"
                  onClick={() => {
                    setMessageCard('');
                    setSelectedMessage(null);
                    if (!canProceedToPayment) return;
                    setCurrentStep('payment');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline mx-auto block"
                >
                  Mesaj kartı istemiyorum
                </button>

                {/* Navigation (sticky on mobile) */}
                <div className="fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:bg-transparent sm:backdrop-blur-0 sm:border-0 sm:p-0 sm:pb-0">
                  <div className="max-w-2xl mx-auto flex gap-3">
                    <button
                      onClick={() => setCurrentStep('recipient')}
                      className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Geri
                    </button>
                    <button
                      onClick={() => {
                        if (!canProceedToPayment) return;
                        setCurrentStep('payment');
                      }}
                      disabled={!canProceedToPayment}
                      className="flex-1 py-3 bg-[#e05a4c] text-white font-semibold rounded-xl hover:bg-[#cd3f31] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="space-y-5 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-0"
              >
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Sipariş Özeti</h2>
                  <p className="text-sm text-gray-500">Son adım! Siparişinizi tamamlayın</p>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {/* Products */}
                  <div className="space-y-2">
                    {state.items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
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
                    <button onClick={() => setCurrentStep('recipient')} className="text-xs text-[#e05a4c]">Düzenle</button>
                  </div>

                  {messageCard && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Mesaj Kartı</p>
                        <p className="text-sm text-gray-700 italic truncate">&ldquo;{messageCard}&rdquo;</p>
                      </div>
                      <button onClick={() => setCurrentStep('message')} className="text-xs text-[#e05a4c]">Düzenle</button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Ödeme Yöntemi</p>
                  <div className="border-2 border-[#e05a4c] bg-[#e05a4c]/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard size={24} className="text-[#e05a4c]" />
                      <div>
                        <p className="font-semibold text-gray-900">Kredi/Banka Kartı</p>
                        <p className="text-xs text-gray-600">Güvenli 3D Secure ile ödeme</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Logos */}
                  <div className="mt-3 flex items-center justify-center">
                    <Image
                      src="/logo_band_colored@3x.png"
                      alt="Güvenli Ödeme"
                      width={300}
                      height={20}
                      className="w-full h-auto object-contain max-w-xs opacity-70"
                    />
                  </div>

                  {/* iyzico Logo */}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500">Güvenli ödeme sağlayıcısı:</span>
                    <Image
                      src="iyzico/iyzico.svg"
                      alt="iyzico"
                      width={60}
                      height={20}
                      className="h-5 w-auto"
                    />
                  </div>
                </div>

                {/* 3DS Info Box */}
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

                {/* Misafir İletişim Bilgileri */}
                {!isLoggedIn && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle size={16} />
                      <p className="text-sm font-medium">Sipariş Takibi İçin İletişim Bilgisi</p>
                    </div>
                    <p className="text-xs text-blue-700">
                      Üye olmadan alışveriş yapıyorsunuz. Siparişinizi takip edebilmek için e-posta veya telefon numaranızı girin.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
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
                        placeholder="E-posta adresiniz"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                          guestEmailError ? 'border-red-300' : 'border-blue-200'
                        }`}
                      />
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={handleGuestPhoneChange}
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={13}
                        placeholder="Telefon numaranız"
                        className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                          guestPhoneError ? 'border-red-300' : 'border-blue-200'
                        }`}
                      />
                    </div>
                    {(guestEmailError || guestPhoneError) && (
                      <p className="text-[11px] text-red-600">
                        {guestEmailError || guestPhoneError}
                      </p>
                    )}
                    <p className="text-[10px] text-blue-600">
                      * Her iki alan da zorunludur
                    </p>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#e05a4c] focus:ring-[#e05a4c]" 
                  />
                  <span>
                    <Link href="/mesafeli-satis" className="text-[#e05a4c] hover:underline">Mesafeli satış sözleşmesini</Link> ve{' '}
                    <Link href="/gizlilik" className="text-[#e05a4c] hover:underline">gizlilik politikasını</Link> okudum, kabul ediyorum.
                  </span>
                </label>

                {/* Navigation (sticky on mobile) */}
                {!show3DSModal && (
                  <div className="fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:bg-transparent sm:backdrop-blur-0 sm:border-0 sm:p-0 sm:pb-0">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentStep('message')}
                          className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Geri
                        </button>
                        <button
                          onClick={handleCompleteOrder}
                          disabled={!canCompletePayment || isProcessing}
                          className="flex-1 py-3.5 bg-[#549658] text-white font-semibold rounded-xl hover:bg-[#468a4a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            <>
                              <Check size={18} />
                              Ödemeyi Yap
                            </>
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-[10px] text-center text-gray-400">
                        🔒 Ödeme bilgileriniz 256-bit SSL ile korunmaktadır
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* 3DS Payment Modal */}
      {show3DSModal && threeDSHtmlContent && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-stretch justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full h-[100dvh] min-h-[100svh] sm:h-auto sm:max-h-[95vh] sm:max-w-md overflow-hidden shadow-2xl rounded-none sm:rounded-2xl flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#e05a4c] to-[#e8b4bc] p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Güvenli Ödeme</h3>
                  <p className="text-white/80 text-xs">3D Secure Doğrulama</p>
                </div>
              </div>
              <Image
                src="/iyzico/iyzicoLogoWhite.svg"
                alt="iyzico"
                width={60}
                height={20}
                className="h-5 w-auto opacity-90"
              />
            </div>
            
            <div className="px-3 py-2 sm:p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-start gap-2 text-blue-800 text-xs sm:text-sm">
                <AlertCircle size={16} />
                <p>
                  Bankanızın 3D Secure sayfasına yönlendiriliyorsunuz. 
                  Lütfen SMS ile gelen doğrulama kodunu girin.
                </p>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-auto">
              <div ref={iyzicoContainerRef} className="w-full h-full" />
            </div>
          </motion.div>
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
