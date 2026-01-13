'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CartItem } from './CartContext';
import { useAnalytics } from './AnalyticsContext';
import { useCustomer } from './CustomerContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getOrderTimeGroupForNewOrder(): 'noon' | 'evening' | 'overnight' {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 11 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'overnight';
}

export type OrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'awaiting_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash_on_delivery';

export interface OrderProduct {
  id: number;
  productId?: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  category: string;
}

export interface OrderDelivery {
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  deliveryNotes: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  clientInfo?: OrderClientInfo;
  cardLast4?: string;
  transactionId?: string;
  paidAt?: string;
  token?: string;
  paidPrice?: string;
  cardType?: string;
  cardAssociation?: string;
  installment?: number;
  errorCode?: unknown;
  errorMessage?: string;
  errorGroup?: unknown;
  reminderShown?: boolean;
  reminderShownAt?: string;
  reminderChannel?: string;
  reminderType?: string;
  reminderMessage?: string;
  reminderClosed?: boolean;
  reminderClosedAt?: string;
  reminderAction?: string;
  reminderActionAt?: string;
  reminderDismissCount?: number;
  reminderResumeCount?: number;
}

export interface OrderClientInfo {
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
}

export interface OrderMessage {
  content: string;
  senderName: string;
  isGift: boolean;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  automated?: boolean;
}

export type OrderTimeGroup = 'noon' | 'evening' | 'overnight';

export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isGuest?: boolean;
  clientIp?: string;
  fromCartAbandonment?: boolean;
  cartAbandonmentId?: string;
  products: OrderProduct[];
  delivery: OrderDelivery;
  payment: OrderPayment;
  message: OrderMessage | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  orderTimeGroup?: OrderTimeGroup;
  timeline: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
  notes: string;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  lastOrderNumber: number;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_ORDERS'; payload: Order[] }
  | { type: 'CREATE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus; note?: string } }
  | { type: 'DELETE_ORDER'; payload: string }
  | { type: 'SET_LAST_ORDER_NUMBER'; payload: number };

const initialState: OrderState = {
  orders: [],
  isLoading: false,
  error: null,
  lastOrderNumber: 1000,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_ORDERS':
      return { ...state, orders: action.payload };
    case 'CREATE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        lastOrderNumber: action.payload.orderNumber,
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => (o.id === action.payload.id ? action.payload : o)),
      };
    case 'UPDATE_ORDER_STATUS': {
      const timelineEntry: OrderTimeline = {
        status: action.payload.status,
        timestamp: new Date().toISOString(),
        note: action.payload.note,
      };
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.orderId
            ? {
                ...o,
                status: action.payload.status,
                timeline: [...o.timeline, timelineEntry],
                updatedAt: new Date().toISOString(),
              }
            : o
        ),
      };
    }
    case 'DELETE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
    case 'SET_LAST_ORDER_NUMBER':
      return { ...state, lastOrderNumber: action.payload };
    default:
      return state;
  }
}

interface CreateOrderData {
  customerId: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isGuest?: boolean;
  items: CartItem[];
  delivery: OrderDelivery;
  payment: {
    method: PaymentMethod;
    status?: PaymentStatus;
  };
  message: OrderMessage | null;
  discount?: number;
  status?: OrderStatus;
}

interface OrderContextType {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  createOrder: (data: CreateOrderData) => Promise<{ success: boolean; order?: Order; error?: string }>;
  refreshOrders?: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  cancelOrderWithRefund: (orderId: string, reason: string, addCredit?: boolean) => Promise<{ success: boolean; error?: string }>;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByCustomer: (customerId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  simulatePayment: (orderId: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const createDemoOrders = (): Order[] => [
  {
    id: 'ord_1001',
    orderNumber: 1001,
    customerId: 'cust_demo1',
    customerName: 'Ahmet Yılmaz',
    customerEmail: 'ahmet@email.com',
    customerPhone: '+90 850 307 4876',
    products: [
      { id: 1, name: 'Kırmızı Güller Buketi', slug: 'kirmizi-guller-buketi', image: '/products/guller.jpg', price: 950, quantity: 1, category: 'buketler' },
      { id: 2, name: 'Çikolata Kutusu', slug: 'cikolata-kutusu', image: '/products/cikolata.jpg', price: 300, quantity: 1, category: 'hediyeler' },
    ],
    delivery: {
      recipientName: 'Zeynep Yılmaz',
      recipientPhone: '0532 987 65 43',
      province: 'İstanbul',
      district: 'Kadıköy',
      neighborhood: 'Moda',
      fullAddress: 'Moda Cad. No:25 D:4',
      deliveryDate: '2024-12-01',
      deliveryTimeSlot: '14:00-18:00',
      deliveryNotes: 'Kapıcıya bırakılabilir',
    },
    payment: {
      method: 'credit_card',
      status: 'paid',
      cardLast4: '4532',
      transactionId: 'txn_abc123',
      paidAt: '2024-12-01T10:00:00Z',
    },
    message: {
      content: 'İyi ki doğdun canım! Nice mutlu yıllara...',
      senderName: 'Sevgilerimle, Ahmet',
      isGift: true,
    },
    subtotal: 1250,
    deliveryFee: 0,
    discount: 0,
    total: 1250,
    status: 'pending',
    timeline: [
      { status: 'pending', timestamp: '2024-12-01T10:00:00Z', note: 'Sipariş alındı' },
    ],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    notes: '',
  },
  {
    id: 'ord_1002',
    orderNumber: 1002,
    customerId: 'cust_demo2',
    customerName: 'Ayşe Demir',
    customerEmail: 'ayse@email.com',
    customerPhone: '+90 850 307 4876',
    products: [
      { id: 3, name: 'Beyaz Orkide', slug: 'beyaz-orkide', image: '/products/orkide.jpg', price: 890, quantity: 1, category: 'saksili-cicekler' },
    ],
    delivery: {
      recipientName: 'Ayşe Demir',
      recipientPhone: '0533 234 56 78',
      province: 'İstanbul',
      district: 'Beşiktaş',
      neighborhood: 'Levent',
      fullAddress: 'Büyükdere Cad. Plaza No:42 Kat:5',
      deliveryDate: '2024-12-01',
      deliveryTimeSlot: '10:00-14:00',
      deliveryNotes: '',
    },
    payment: {
      method: 'credit_card',
      status: 'paid',
      cardLast4: '7891',
      transactionId: 'txn_def456',
      paidAt: '2024-12-01T09:30:00Z',
    },
    message: null,
    subtotal: 890,
    deliveryFee: 0,
    discount: 0,
    total: 890,
    status: 'processing',
    timeline: [
      { status: 'pending', timestamp: '2024-12-01T09:30:00Z', note: 'Sipariş alındı' },
      { status: 'confirmed', timestamp: '2024-12-01T09:35:00Z', note: 'Ödeme onaylandı' },
      { status: 'processing', timestamp: '2024-12-01T10:00:00Z', note: 'Hazırlanıyor' },
    ],
    createdAt: '2024-12-01T09:30:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
    notes: '',
  },
  {
    id: 'ord_1003',
    orderNumber: 1003,
    customerId: 'cust_demo3',
    customerName: 'Mehmet Kaya',
    customerEmail: 'mehmet@email.com',
    customerPhone: '+90 850 307 4876',
    products: [
      { id: 4, name: 'Premium Gül Aranjmanı', slug: 'premium-gul-aranjmani', image: '/products/premium-gul.jpg', price: 1800, quantity: 1, category: 'aranjmanlar' },
      { id: 5, name: 'Kristal Vazo', slug: 'kristal-vazo', image: '/products/vazo.jpg', price: 300, quantity: 1, category: 'hediyeler' },
    ],
    delivery: {
      recipientName: 'Elif Kaya',
      recipientPhone: '0534 111 22 33',
      province: 'İstanbul',
      district: 'Ataşehir',
      neighborhood: 'Küçükbakkalköy',
      fullAddress: 'Brandium AVM Karşısı Sitesi B Blok D:12',
      deliveryDate: '2024-11-30',
      deliveryTimeSlot: '14:00-18:00',
      deliveryNotes: 'Sürpriz, alıcıyı aramayın',
    },
    payment: {
      method: 'credit_card',
      status: 'paid',
      cardLast4: '3456',
      transactionId: 'txn_ghi789',
      paidAt: '2024-11-30T15:00:00Z',
    },
    message: {
      content: 'Yıldönümümüz kutlu olsun aşkım!',
      senderName: 'Seni seven Mehmet',
      isGift: true,
    },
    subtotal: 2100,
    deliveryFee: 0,
    discount: 0,
    total: 2100,
    status: 'shipped',
    timeline: [
      { status: 'pending', timestamp: '2024-11-30T15:00:00Z', note: 'Sipariş alındı' },
      { status: 'confirmed', timestamp: '2024-11-30T15:05:00Z', note: 'Ödeme onaylandı' },
      { status: 'processing', timestamp: '2024-11-30T15:30:00Z', note: 'Hazırlanıyor' },
      { status: 'shipped', timestamp: '2024-11-30T17:00:00Z', note: 'Kargoya verildi' },
    ],
    createdAt: '2024-11-30T15:00:00Z',
    updatedAt: '2024-11-30T17:00:00Z',
    notes: '',
  },
  {
    id: 'ord_1004',
    orderNumber: 1004,
    customerId: 'cust_demo4',
    customerName: 'Fatma Şahin',
    customerEmail: 'fatma@email.com',
    customerPhone: '+90 850 307 4876',
    products: [
      { id: 6, name: 'Papatya Buketi', slug: 'papatya-buketi', image: '/products/papatya.jpg', price: 650, quantity: 1, category: 'buketler' },
    ],
    delivery: {
      recipientName: 'Hasan Şahin',
      recipientPhone: '0535 999 88 77',
      province: 'İstanbul',
      district: 'Üsküdar',
      neighborhood: 'Kuzguncuk',
      fullAddress: 'Sahil Yolu Sok. No:8',
      deliveryDate: '2024-11-29',
      deliveryTimeSlot: '10:00-14:00',
      deliveryNotes: '',
    },
    payment: {
      method: 'credit_card',
      status: 'paid',
      cardLast4: '9012',
      transactionId: 'txn_jkl012',
      paidAt: '2024-11-29T12:00:00Z',
    },
    message: {
      content: 'Geçmiş olsun babacığım, çabuk iyileş!',
      senderName: 'Kızın Fatma',
      isGift: true,
    },
    subtotal: 650,
    deliveryFee: 0,
    discount: 0,
    total: 650,
    status: 'delivered',
    timeline: [
      { status: 'pending', timestamp: '2024-11-29T12:00:00Z', note: 'Sipariş alındı' },
      { status: 'confirmed', timestamp: '2024-11-29T12:05:00Z', note: 'Ödeme onaylandı' },
      { status: 'processing', timestamp: '2024-11-29T12:30:00Z', note: 'Hazırlanıyor' },
      { status: 'shipped', timestamp: '2024-11-29T14:00:00Z', note: 'Yola çıktı' },
      { status: 'delivered', timestamp: '2024-11-29T15:30:00Z', note: 'Teslim edildi' },
    ],
    createdAt: '2024-11-29T12:00:00Z',
    updatedAt: '2024-11-29T15:30:00Z',
    notes: '',
  },
  {
    id: 'ord_1005',
    orderNumber: 1005,
    customerId: 'cust_demo5',
    customerName: 'Ali Öztürk',
    customerEmail: 'ali@email.com',
    customerPhone: '+90 850 307 4876',
    products: [
      { id: 7, name: 'Karışık Mevsim Çiçekleri', slug: 'karisik-mevsim-cicekleri', image: '/products/mevsim.jpg', price: 1800, quantity: 1, category: 'buketler' },
    ],
    delivery: {
      recipientName: 'Selin Öztürk',
      recipientPhone: '0536 444 55 66',
      province: 'İstanbul',
      district: 'Bakırköy',
      neighborhood: 'Yeşilköy',
      fullAddress: 'Atatürk Cad. No:25 D:7',
      deliveryDate: '2024-11-28',
      deliveryTimeSlot: '14:00-18:00',
      deliveryNotes: '',
    },
    payment: {
      method: 'credit_card',
      status: 'refunded',
      cardLast4: '5678',
      transactionId: 'txn_mno345',
      paidAt: '2024-11-28T09:00:00Z',
    },
    message: null,
    subtotal: 1800,
    deliveryFee: 0,
    discount: 0,
    total: 1800,
    status: 'cancelled',
    timeline: [
      { status: 'pending', timestamp: '2024-11-28T09:00:00Z', note: 'Sipariş alındı' },
      { status: 'confirmed', timestamp: '2024-11-28T09:05:00Z', note: 'Ödeme onaylandı' },
      { status: 'cancelled', timestamp: '2024-11-28T09:30:00Z', note: 'Müşteri tarafından iptal edildi' },
    ],
    createdAt: '2024-11-28T09:00:00Z',
    updatedAt: '2024-11-28T09:30:00Z',
    notes: 'Müşteri yanlış adres girdiğini belirterek iptal etti.',
  },
];

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const pathname = usePathname();
  const prevCountRef = useRef<number>(0);
  const lastOrderNumberRef = useRef<number | null>(null);
  const notificationSoundUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL || '/siparis-bildirim.wav';
  const { getTrafficSource } = useAnalytics();
  const { state: customerState } = useCustomer();
  const currentCustomerId = customerState.currentCustomer?.id || null;

  const isAdminRoute = pathname?.startsWith('/yonetim');
  const isAccountRoute = pathname?.startsWith('/hesabim');

  const fetchOrders = async (args?: { silent?: boolean; customerId?: string | null }): Promise<void> => {
    const silent = args?.silent ?? false;
    const customerId = args?.customerId ?? null;

    try {
      if (!silent) dispatch({ type: 'SET_LOADING', payload: true });

      const url = customerId ? `/api/orders?customerId=${encodeURIComponent(customerId)}` : '/api/orders';
      const response = await fetch(url, { cache: 'no-store' });

      if (response.ok) {
        const data = await response.json();
        const orders: Order[] = data.orders || [];
        dispatch({ type: 'LOAD_ORDERS', payload: orders });

        if (!customerId && orders.length > 0) {
          const maxOrderNumber = Math.max(...orders.map(o => o.orderNumber));
          lastOrderNumberRef.current = maxOrderNumber;
          dispatch({ type: 'SET_LAST_ORDER_NUMBER', payload: maxOrderNumber });
        }
      }
    } catch (error) {
      console.error('OrderContext: fetchOrders failed', error);
      if (!silent) dispatch({ type: 'SET_ERROR', payload: 'Siparişler yüklenemedi' });
    } finally {
      if (!silent) dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Admin realtime + polling (ONLY for /yonetim)
  useEffect(() => {
    if (!isAdminRoute) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let realtimeSilentCheck: ReturnType<typeof setInterval> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let lastRealtimeEvent = Date.now();

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        loadOrders(true);
      }, 15000);
    };

    const stopPolling = () => {
      if (!pollInterval) return;
      clearInterval(pollInterval);
      pollInterval = null;
    };

    const loadOrders = async (silent = false) => {
      await fetchOrders({ silent });
      lastRealtimeEvent = Date.now();
    };

    loadOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          lastRealtimeEvent = Date.now();
          stopPolling();
          loadOrders(true);
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') stopPolling();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') startPolling();
      });

    realtimeSilentCheck = setInterval(() => {
      const silenceMs = Date.now() - lastRealtimeEvent;
      if (silenceMs > 30000) startPolling();
    }, 10000);

    pingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders/ping', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const latest = data.lastOrderNumber as number | undefined;
        if (latest && (!lastOrderNumberRef.current || latest > lastOrderNumberRef.current)) {
          lastOrderNumberRef.current = latest;
          loadOrders(true);
        }
      } catch (err) {
        console.error('OrderContext: ping failed', err);
      }
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
      if (realtimeSilentCheck) clearInterval(realtimeSilentCheck);
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [isAdminRoute]);

  // Account orders (ONLY for /hesabim)
  useEffect(() => {
    if (!isAccountRoute) return;
    if (!currentCustomerId) return;
    fetchOrders({ customerId: currentCustomerId });
  }, [isAccountRoute, currentCustomerId]);

  useEffect(() => {
    if (!isAdminRoute) return;

    const currentCount = state.orders.length;
    if (prevCountRef.current === 0) {
      prevCountRef.current = currentCount;
      return;
    }

    if (currentCount > prevCountRef.current) {
      const audio = new Audio(notificationSoundUrl);
      audio.play().catch(err => console.error('Bildirim sesi çalınamadı:', err));
    }
    prevCountRef.current = currentCount;
  }, [pathname, state.orders.length, notificationSoundUrl]);

  const refreshOrders = async (): Promise<void> => {
    if (isAdminRoute) {
      await fetchOrders({ silent: true });
      return;
    }
    if (isAccountRoute && currentCustomerId) {
      await fetchOrders({ customerId: currentCustomerId, silent: false });
    }
  };

  const createOrder = async (data: CreateOrderData): Promise<{ success: boolean; order?: Order; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const now = new Date().toISOString();

    const products: OrderProduct[] = data.items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity,
      category: item.product.category,
    }));

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const deliveryFee = 0;
    const discount = data.discount || 0;
    const total = subtotal + deliveryFee - discount;

    // Traffic source bilgisini al
    const trafficSource = getTrafficSource();

    const analytics = (() => {
      try {
        if (typeof window === 'undefined') return {};
        const visitorId = localStorage.getItem('vadiler_visitor_id') || undefined;
        const sessionId = localStorage.getItem('vadiler_session_id') || undefined;
        return { visitorId, sessionId };
      } catch {
        return {};
      }
    })();

    const orderData = {
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      is_guest: data.isGuest || false,
      products,
      delivery: data.delivery,
      payment: {
        method: data.payment.method,
        status: data.payment.status || 'pending',
      },
      message: data.message,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      status: data.status || 'pending',
      notes: '',
      order_time_group: getOrderTimeGroupForNewOrder(),
      traffic_source: trafficSource?.source || 'direct',
      traffic_medium: trafficSource?.medium || null,
      traffic_campaign: trafficSource?.campaign || null,
      traffic_referrer: trafficSource?.referrer || null,
      analytics,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const newOrder = await response.json();
        dispatch({ type: 'CREATE_ORDER', payload: newOrder });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, order: newOrder };
      }

      const errorData = await response.json();
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: errorData.error || 'Sipariş oluşturulamadı' };
    } catch (error) {
      console.error('Error creating order:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Bir hata oluştu' };
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const timelineEntry: OrderTimeline = {
      status,
      timestamp: new Date().toISOString(),
      note,
    };

    const updatedOrder = {
      ...order,
      status,
      timeline: [...order.timeline, timelineEntry],
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'UPDATE_ORDER', payload: result });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const cancelOrderWithRefund = async (orderId: string, reason: string, addCredit: boolean = false) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Sipariş bulunamadı' };

    const timelineEntry: OrderTimeline = {
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      note: reason,
    };

    const updatedOrder = {
      ...order,
      status: 'cancelled' as OrderStatus,
      timeline: [...order.timeline, timelineEntry],
      updatedAt: new Date().toISOString(),
      notes: order.notes + `\n[${new Date().toLocaleString('tr-TR')}] İptal: ${reason}`,
    };

    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (!orderResponse.ok) {
        return { success: false, error: 'Sipariş iptal edilemedi' };
      }

      const result = await orderResponse.json();
      dispatch({ type: 'UPDATE_ORDER', payload: result });

      if (addCredit && !order.isGuest && order.payment.status === 'paid') {
        const creditResponse = await fetch('/api/customers/credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: order.customerId,
            amount: order.total,
            reason: `Sipariş #${order.orderNumber} iptali - ${reason}`,
          }),
        });

        if (!creditResponse.ok) {
          console.error('Kredi eklenemedi');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling order:', error);
      return { success: false, error: 'Bir hata oluştu' };
    }
  };

  const updateOrder = async (order: Order) => {
    const updatedOrder = { ...order, updatedAt: new Date().toISOString() };

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder),
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'UPDATE_ORDER', payload: result });
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
      if (response.ok) dispatch({ type: 'DELETE_ORDER', payload: orderId });
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getOrderById = (orderId: string): Order | undefined => state.orders.find(o => o.id === orderId);
  const getOrdersByCustomer = (customerId: string): Order[] => state.orders.filter(o => o.customerId === customerId);
  const getOrdersByStatus = (status: OrderStatus): Order[] => state.orders.filter(o => o.status === status);

  const simulatePayment = async (orderId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        const updatedOrder: Order = {
          ...order,
          payment: {
            ...order.payment,
            status: 'paid',
            transactionId: 'txn_' + Date.now().toString(36),
            paidAt: new Date().toISOString(),
          },
          status: 'confirmed',
          timeline: [
            ...order.timeline,
            { status: 'confirmed', timestamp: new Date().toISOString(), note: 'Ödeme onaylandı' },
          ],
          updatedAt: new Date().toISOString(),
        };

        try {
          const response = await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder),
          });

          if (response.ok) {
            const result = await response.json();
            dispatch({ type: 'UPDATE_ORDER', payload: result });
          }
        } catch (error) {
          console.error('Error updating payment:', error);
        }
      }
    }

    return isSuccess;
  };

  return (
    <OrderContext.Provider
      value={{
        state,
        dispatch,
        createOrder,
        refreshOrders,
        updateOrderStatus,
        cancelOrderWithRefund,
        updateOrder,
        deleteOrder,
        getOrderById,
        getOrdersByCustomer,
        getOrdersByStatus,
        simulatePayment,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
