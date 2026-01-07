'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CartItem } from './CartContext';

// Supabase client for realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Yeni sipariş için zaman grubunu hesapla
 */
function getOrderTimeGroupForNewOrder(): 'noon' | 'evening' | 'overnight' {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 11 && hour < 17) {
    return 'noon';
  }
  
  if (hour >= 17 && hour < 22) {
    return 'evening';
  }
  
  return 'overnight';
}

// Order Types
export type OrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'awaiting_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash_on_delivery';

export interface OrderProduct {
  id: number;
  productId?: string; // Product slug for linking
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
        orders: state.orders.map(o => 
          o.id === action.payload.id ? action.payload : o
        ),
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
      return {
        ...state,
        orders: state.orders.filter(o => o.id !== action.payload),
      };
    
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

// Demo orders with new structure
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

  // Load orders from API on mount
  useEffect(() => {
    const loadOrders = async (silent = false) => {
      try {
        if (!silent) {
          console.log('📦 OrderContext: Siparişler yükleniyor...');
          dispatch({ type: 'SET_LOADING', payload: true });
        }
        const response = await fetch('/api/orders');
        if (!silent) console.log('📦 OrderContext: API yanıtı:', response.status);
        if (response.ok) {
          const data = await response.json();
          if (!silent) console.log('📦 OrderContext: Yüklenen siparişler:', data.orders?.length || 0);
          dispatch({ type: 'LOAD_ORDERS', payload: data.orders || [] });
          
          // Set last order number
          if (data.orders && data.orders.length > 0) {
            const maxOrderNumber = Math.max(...data.orders.map((o: Order) => o.orderNumber));
            dispatch({ type: 'SET_LAST_ORDER_NUMBER', payload: maxOrderNumber });
          }
        } else {
          console.error('📦 OrderContext: API hatası:', response.status);
        }
      } catch (error) {
        console.error('📦 OrderContext: Yükleme hatası:', error);
        if (!silent) dispatch({ type: 'SET_ERROR', payload: 'Siparişler yüklenemedi' });
      } finally {
        if (!silent) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadOrders(); // İlk yükleme (loading göster)
    
    // Supabase Realtime: Sadece yeni/güncellenmiş siparişler için WebSocket
    console.log('🔌 Supabase Realtime: orders tablosuna abone oluyor...');
    
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('📬 Realtime: Sipariş değişikliği algılandı!', payload.eventType);
          // Sessiz güncelleme - sadece yeni data çek
          loadOrders(true);
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime bağlantı durumu:', status);
      });

    // Cleanup
    return () => {
      console.log('🛑 OrderContext: Realtime channel kapatılıyor');
      supabase.removeChannel(channel);
    };
  }, []);

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

    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const deliveryFee = 0; // Free delivery
    const discount = data.discount || 0;
    const total = subtotal + deliveryFee - discount;

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
      } else {
        const errorData = await response.json();
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: errorData.error || 'Sipariş oluşturulamadı' };
      }
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

    // Siparişi iptal et
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
      // Siparişi güncelle
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

      // Eğer müşteri kredisi eklenecekse ve ödeme yapılmışsa
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
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_ORDER', payload: orderId });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return state.orders.find(o => o.id === orderId);
  };

  const getOrdersByCustomer = (customerId: string): Order[] => {
    return state.orders.filter(o => o.customerId === customerId);
  };

  const getOrdersByStatus = (status: OrderStatus): Order[] => {
    return state.orders.filter(o => o.status === status);
  };

  const simulatePayment = async (orderId: string): Promise<boolean> => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 95% success rate
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
