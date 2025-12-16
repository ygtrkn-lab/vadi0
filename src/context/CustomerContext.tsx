'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toCamelCase } from '@/lib/supabase/transformer';

// Customer Types
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  password: string; // In real app, this would be hashed
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  orders: string[]; // Order IDs
  favorites: string[]; // Product IDs
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string | null;
  accountCredit: number; // İptal edilen siparişlerden dönen kredi
  isActive: boolean;
  notes: string;
  tags: string[];
}

export interface Address {
  id: string;
  title: string; // Adres başlığı (Evim, İşyerim vs.)
  type: 'home' | 'work' | 'other';
  recipientName: string;
  recipientPhone: string;
  province: string;
  provinceId: number;
  district: string;
  districtId: number;
  neighborhood: string;
  fullAddress: string;
  postalCode?: string;
  isDefault: boolean;
}

interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // True once the initial localStorage session restore + initial fetch have finished.
  // Used by protected layouts to avoid redirecting during hydration on hard refresh.
  isReady: boolean;
  error: string | null;
}

type CustomerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_READY'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_CUSTOMERS'; payload: Customer[] }
  | { type: 'REGISTER_CUSTOMER'; payload: Customer }
  | { type: 'LOGIN_CUSTOMER'; payload: Customer }
  | { type: 'LOGOUT_CUSTOMER' }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_ADDRESS'; payload: { customerId: string; address: Address } }
  | { type: 'UPDATE_CUSTOMER_ORDER'; payload: { customerId: string; orderId: string; amount: number } }
  | { type: 'ADD_ACCOUNT_CREDIT'; payload: { customerId: string; amount: number; reason: string } };

const initialState: CustomerState = {
  customers: [],
  currentCustomer: null,
  isAuthenticated: false,
  isLoading: false,
  isReady: false,
  error: null,
};

function generateId(): string {
  return 'cust_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function customerReducer(state: CustomerState, action: CustomerAction): CustomerState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_READY':
      return { ...state, isReady: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'LOAD_CUSTOMERS':
      return { ...state, customers: action.payload };
    
    case 'REGISTER_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload],
        currentCustomer: action.payload,
        isAuthenticated: true,
        error: null,
      };
    
    case 'LOGIN_CUSTOMER':
      return {
        ...state,
        currentCustomer: action.payload,
        isAuthenticated: true,
        error: null,
      };
    
    case 'LOGOUT_CUSTOMER':
      return {
        ...state,
        currentCustomer: null,
        isAuthenticated: false,
      };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.id 
          ? action.payload 
          : state.currentCustomer,
      };
    
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };
    
    case 'ADD_ADDRESS':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.customerId
            ? { ...c, addresses: [...c.addresses, action.payload.address] }
            : c
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.customerId
          ? { ...state.currentCustomer, addresses: [...state.currentCustomer.addresses, action.payload.address] }
          : state.currentCustomer,
      };
    
    case 'UPDATE_CUSTOMER_ORDER':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.customerId
            ? {
                ...c,
                orders: [...c.orders, action.payload.orderId],
                orderCount: c.orderCount + 1,
                totalSpent: c.totalSpent + action.payload.amount,
                lastOrderDate: new Date().toISOString(),
              }
            : c
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.customerId
          ? {
              ...state.currentCustomer,
              orders: [...state.currentCustomer.orders, action.payload.orderId],
              orderCount: state.currentCustomer.orderCount + 1,
              totalSpent: state.currentCustomer.totalSpent + action.payload.amount,
              lastOrderDate: new Date().toISOString(),
            }
          : state.currentCustomer,
      };
    
    case 'ADD_ACCOUNT_CREDIT':
      return {
        ...state,
        customers: state.customers.map(c => 
          c.id === action.payload.customerId
            ? {
                ...c,
                accountCredit: c.accountCredit + action.payload.amount,
                updatedAt: new Date().toISOString(),
                notes: c.notes + `\n[${new Date().toLocaleString('tr-TR')}] Kredi eklendi: ${action.payload.amount}₺ - ${action.payload.reason}`,
              }
            : c
        ),
        currentCustomer: state.currentCustomer?.id === action.payload.customerId
          ? {
              ...state.currentCustomer,
              accountCredit: state.currentCustomer.accountCredit + action.payload.amount,
              updatedAt: new Date().toISOString(),
              notes: state.currentCustomer.notes + `\n[${new Date().toLocaleString('tr-TR')}] Kredi eklendi: ${action.payload.amount}₺ - ${action.payload.reason}`,
            }
          : state.currentCustomer,
      };
    
    default:
      return state;
  }
}

interface CustomerContextType {
  state: CustomerState;
  dispatch: React.Dispatch<CustomerAction>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean; otpId?: string; email?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresOtp?: boolean; otpId?: string; email?: string }>;
  loginWithGoogle: (args?: { redirectTo?: string }) => Promise<{ success: boolean; error?: string }>;
  verifyLoginOtp: (args: { otpId: string; email: string; code: string }) => Promise<{ success: boolean; error?: string }>;
  verifyRegisterOtp: (args: { otpId: string; email: string; code: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addAddress: (customerId: string, address: Omit<Address, 'id'>) => Promise<boolean>;
  updateAddress: (customerId: string, addressId: string, address: Partial<Address>) => void;
  deleteAddress: (customerId: string, addressId: string) => void;
  setDefaultAddress: (customerId: string, addressId: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByEmail: (email: string) => Customer | undefined;
  addOrderToCustomer: (customerId: string, orderId: string, amount: number) => void;
  addAccountCredit: (customerId: string, amount: number, reason: string) => Promise<boolean>;
  getDefaultAddress: (customerId: string) => Address | undefined;
  // Favorites
  addToFavorites: (customerId: string, productId: string) => void;
  removeFromFavorites: (customerId: string, productId: string) => void;
  isFavorite: (customerId: string, productId: string) => boolean;
  // Profile update
  updateProfile: (customerId: string, data: { name?: string; phone?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (customerId: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  name: string;
  phone: string;
  password: string;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

// Demo customers for initial data
const demoCustomers: Customer[] = [
  {
    id: 'cust_demo1',
    email: 'ahmet@email.com',
    name: 'Ahmet Yılmaz',
    phone: '+90 850 307 4876',
    password: '123456',
    createdAt: '2024-10-15T10:30:00Z',
    updatedAt: '2024-12-01T14:20:00Z',
    addresses: [
      {
        id: 'addr_1',
        title: 'Evim',
        type: 'home',
        recipientName: 'Ahmet Yılmaz',
        recipientPhone: '+90 850 307 4876',
        province: 'İstanbul',
        provinceId: 34,
        district: 'Kadıköy',
        districtId: 446,
        neighborhood: 'Caferağa',
        fullAddress: 'Moda Cad. No:15 D:3',
        isDefault: true,
      }
    ],
    orders: ['ord_1001'],
    favorites: ['1', '5', '12'],
    totalSpent: 1250,
    orderCount: 1,
    lastOrderDate: '2024-12-01T10:00:00Z',
    accountCredit: 0,
    isActive: true,
    notes: 'VIP müşteri',
    tags: ['VIP', 'Sık Alıcı'],
  },
  {
    id: 'cust_demo2',
    email: 'ayse@email.com',
    name: 'Ayşe Demir',
    phone: '+90 850 307 4876',
    password: '123456',
    createdAt: '2024-11-01T08:15:00Z',
    updatedAt: '2024-12-01T11:30:00Z',
    addresses: [
      {
        id: 'addr_2',
        title: 'İşyerim',
        type: 'work',
        recipientName: 'Ayşe Demir',
        recipientPhone: '+90 850 307 4876',
        province: 'İstanbul',
        provinceId: 34,
        district: 'Beşiktaş',
        districtId: 409,
        neighborhood: 'Levent',
        fullAddress: 'Büyükdere Cad. Plaza No:42 Kat:5',
        isDefault: true,
      }
    ],
    orders: ['ord_1002'],
    favorites: ['3', '8'],
    totalSpent: 890,
    orderCount: 1,
    lastOrderDate: '2024-12-01T09:30:00Z',
    accountCredit: 0,
    isActive: true,
    notes: '',
    tags: ['Yeni'],
  },
  {
    id: 'cust_demo3',
    email: 'mehmet@email.com',
    name: 'Mehmet Kaya',
    phone: '+90 850 307 4876',
    password: '123456',
    createdAt: '2024-09-20T14:45:00Z',
    updatedAt: '2024-11-30T16:00:00Z',
    addresses: [
      {
        id: 'addr_3',
        title: 'Evim',
        type: 'home',
        recipientName: 'Mehmet Kaya',
        recipientPhone: '+90 850 307 4876',
        province: 'İstanbul',
        provinceId: 34,
        district: 'Ataşehir',
        districtId: 403,
        neighborhood: 'Küçükbakkalköy',
        fullAddress: 'Brandium AVM Karşısı Sitesi B Blok D:12',
        isDefault: true,
      }
    ],
    orders: ['ord_1003'],
    favorites: ['2', '7', '15'],
    totalSpent: 2100,
    orderCount: 1,
    lastOrderDate: '2024-11-30T15:00:00Z',
    accountCredit: 0,
    isActive: true,
    notes: 'Kurumsal alıcı',
    tags: ['Kurumsal'],
  },
  {
    id: 'cust_demo4',
    email: 'fatma@email.com',
    name: 'Fatma Şahin',
    phone: '+90 850 307 4876',
    password: '123456',
    createdAt: '2024-08-10T11:20:00Z',
    updatedAt: '2024-11-29T13:40:00Z',
    addresses: [
      {
        id: 'addr_4',
        title: 'Evim',
        type: 'home',
        recipientName: 'Fatma Şahin',
        recipientPhone: '+90 850 307 4876',
        province: 'İstanbul',
        provinceId: 34,
        district: 'Üsküdar',
        districtId: 470,
        neighborhood: 'Kuzguncuk',
        fullAddress: 'Sahil Yolu Sok. No:8',
        isDefault: true,
      }
    ],
    orders: ['ord_1004'],
    favorites: [],
    totalSpent: 650,
    orderCount: 1,
    lastOrderDate: '2024-11-29T12:00:00Z',
    accountCredit: 0,
    isActive: true,
    notes: '',
    tags: [],
  },
  {
    id: 'cust_demo5',
    email: 'ali@email.com',
    name: 'Ali Öztürk',
    phone: '+90 850 307 4876',
    password: '123456',
    createdAt: '2024-07-05T09:00:00Z',
    updatedAt: '2024-11-28T10:15:00Z',
    addresses: [
      {
        id: 'addr_5',
        title: 'Evim',
        type: 'home',
        recipientName: 'Ali Öztürk',
        recipientPhone: '+90 850 307 4876',
        province: 'İstanbul',
        provinceId: 34,
        district: 'Bakırköy',
        districtId: 406,
        neighborhood: 'Yeşilköy',
        fullAddress: 'Atatürk Cad. No:25 D:7',
        isDefault: true,
      }
    ],
    orders: ['ord_1005'],
    favorites: ['4', '9'],
    totalSpent: 1800,
    orderCount: 1,
    lastOrderDate: '2024-11-28T09:00:00Z',
    accountCredit: 0,
    isActive: true,
    notes: 'Siparişi iptal edildi',
    tags: ['İptal Geçmişi'],
  },
];

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // Load customers from API on mount
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Önce session'ı kontrol et ve müşteriyi yükle
        const savedSession = localStorage.getItem('vadiler_customer_session');
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            // Session'daki müşteriyi doğrudan API'den çek (en güncel veri)
            const customerResponse = await fetch(`/api/customers/${sessionData.id}`);
            if (customerResponse.ok) {
              const freshCustomer = toCamelCase(await customerResponse.json());
              if (freshCustomer && freshCustomer.isActive !== false) {
                dispatch({ type: 'LOGIN_CUSTOMER', payload: freshCustomer });
              } else {
                localStorage.removeItem('vadiler_customer_session');
              }
            } else {
              // Müşteri bulunamadı, session'ı temizle
              localStorage.removeItem('vadiler_customer_session');
            }
          } catch {
            console.error('Failed to restore customer session');
            localStorage.removeItem('vadiler_customer_session');
          }
        }
        
        // If no local customer session, try restoring from server-side cookie session
        if (!savedSession) {
          try {
            const sessionResp = await fetch('/api/auth/session');
            if (sessionResp.ok) {
              const payload = await sessionResp.json();
              const customer = payload?.customer ? toCamelCase(payload.customer) : null;
              if (customer && customer.isActive !== false) {
                dispatch({ type: 'LOGIN_CUSTOMER', payload: customer });
                localStorage.setItem(
                  'vadiler_user',
                  JSON.stringify({
                    email: customer.email,
                    name: customer.name,
                    role: 'user',
                    customerId: customer.id,
                    loginTime: Date.now(),
                  })
                );
              }
            }
          } catch (e) {
            console.warn('Cookie session restore failed', e);
          }
        }

        // API'den müşterileri yükle (admin paneli için)
        const response = await fetch('/api/customers');
        if (response.ok) {
          const customersData = await response.json();
          const customers = Array.isArray(customersData) ? toCamelCase(customersData) : [];
          dispatch({ type: 'LOAD_CUSTOMERS', payload: customers });
        }
      } catch (error) {
        console.error('Failed to load customers from API:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_READY', payload: true });
      }
    };
    
    loadData();
  }, []);

  // Save current session to localStorage (for page refresh persistence)
  useEffect(() => {
    if (state.currentCustomer) {
      localStorage.setItem('vadiler_customer_session', JSON.stringify(state.currentCustomer));
    } else {
      localStorage.removeItem('vadiler_customer_session');
    }
  }, [state.currentCustomer]);

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // API'ye kayıt + OTP başlatma isteği gönder
      const response = await fetch('/api/customers/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          phone: data.phone,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_ERROR', payload: errorData.error });
        return { success: false, error: errorData.error };
      }

      const payload = await response.json();
      dispatch({ type: 'SET_LOADING', payload: false });

      if (payload?.otpRequired && payload?.otpId && payload?.email) {
        return { success: true, requiresOtp: true, otpId: String(payload.otpId), email: String(payload.email) };
      }

      return { success: false, error: 'Doğrulama kodu oluşturulamadı.' };
    } catch (error) {
      console.error('Register error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Kayıt sırasında bir hata oluştu.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresOtp?: boolean; otpId?: string; email?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // API'ye login + OTP başlatma isteği gönder
      const response = await fetch('/api/customers/login/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_ERROR', payload: errorData.error });
        return { success: false, error: errorData.error };
      }

      dispatch({ type: 'SET_LOADING', payload: false });

      const data = await response.json();
      if (data?.otpRequired && data?.otpId && data?.email) {
        return { success: true, requiresOtp: true, otpId: String(data.otpId), email: String(data.email) };
      }

      return { success: false, error: 'Doğrulama kodu oluşturulamadı.' };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Giriş sırasında bir hata oluştu.' };
    }
  };

  const loginWithGoogle = async (args?: { redirectTo?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectTo = args?.redirectTo || `${window.location.origin}/giris`;
      const url = new URL(redirectTo);
      const redirectPath = url.pathname + url.search;
      window.location.href = `/api/auth/google/start?redirect=${encodeURIComponent(redirectPath)}`;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Google ile giriş başlatılamadı.' };
    }
  };

  const verifyLoginOtp = async (args: { otpId: string; email: string; code: string }): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch('/api/customers/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId: args.otpId, email: args.email, code: args.code }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_ERROR', payload: data?.error || 'Doğrulama başarısız.' });
        return { success: false, error: data?.error || 'Doğrulama başarısız.' };
      }

      const customer = toCamelCase(data.customer);
      dispatch({ type: 'LOGIN_CUSTOMER', payload: customer });
      dispatch({ type: 'SET_LOADING', payload: false });

      // vadiler_user for compatibility
      localStorage.setItem('vadiler_user', JSON.stringify({
        email: customer.email,
        name: customer.name,
        role: 'user',
        customerId: customer.id,
        loginTime: Date.now(),
      }));

      return { success: true };
    } catch (error) {
      console.error('verifyLoginOtp error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Doğrulama sırasında bir hata oluştu.' };
    }
  };

  const verifyRegisterOtp = async (args: { otpId: string; email: string; code: string }): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch('/api/customers/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpId: args.otpId, email: args.email, code: args.code }),
      });

      const data = await response.json();

      if (!response.ok) {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_ERROR', payload: data?.error || 'Doğrulama başarısız.' });
        return { success: false, error: data?.error || 'Doğrulama başarısız.' };
      }

      const customer = toCamelCase(data.customer);

      // Keep customers list in sync if it exists locally
      const alreadyInList = state.customers.some((c) => c.id === customer.id);
      if (!alreadyInList) {
        dispatch({ type: 'LOAD_CUSTOMERS', payload: [...state.customers, customer] });
      }

      dispatch({ type: 'LOGIN_CUSTOMER', payload: customer });
      dispatch({ type: 'SET_LOADING', payload: false });

      // vadiler_user for compatibility
      localStorage.setItem('vadiler_user', JSON.stringify({
        email: customer.email,
        name: customer.name,
        role: 'user',
        customerId: customer.id,
        loginTime: Date.now(),
      }));

      return { success: true };
    } catch (error) {
      console.error('verifyRegisterOtp error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Doğrulama sırasında bir hata oluştu.' };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT_CUSTOMER' });
    localStorage.removeItem('vadiler_user');
    localStorage.removeItem('vadiler_customer_session');

    // Clear server-side session cookie
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetch('/api/auth/logout', { method: 'POST' });
  };

  // API tabanlı müşteri güncelleme
  const updateCustomer = async (customer: Customer) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        
        // State'i güncelle
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === updatedCustomer.id ? updatedCustomer : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === updatedCustomer.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: updatedCustomer });
        }
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedCustomers = state.customers.filter((c: Customer) => c.id !== id);
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const addAddress = async (customerId: string, address: Omit<Address, 'id'>): Promise<boolean> => {
    // Önce currentCustomer'dan bak, yoksa customers listesinden
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
      
    if (!customer) {
      console.error('Customer not found for addAddress:', customerId);
      return false;
    }

    const newAddress: Address = {
      ...address,
      id: 'addr_' + Date.now().toString(36),
    };

    const updatedCustomer = {
      ...customer,
      addresses: [...customer.addresses, newAddress],
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
        return true;
      } else {
        console.error('Failed to add address, response status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error adding address:', error);
      return false;
    }
  };

  const updateAddress = async (customerId: string, addressId: string, updates: Partial<Address>) => {
    // Önce currentCustomer'dan bak, yoksa customers listesinden
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
      
    if (!customer) {
      console.error('Customer not found for updateAddress:', customerId);
      return;
    }

    const updatedAddresses = customer.addresses.map((addr: Address) =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    );

    const updatedCustomer = {
      ...customer,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const deleteAddress = async (customerId: string, addressId: string) => {
    // Önce currentCustomer'dan bak, yoksa customers listesinden
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
      
    if (!customer) {
      console.error('Customer not found for deleteAddress:', customerId);
      return;
    }

    const updatedAddresses = customer.addresses.filter((addr: Address) => addr.id !== addressId);

    const updatedCustomer = {
      ...customer,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const setDefaultAddress = async (customerId: string, addressId: string) => {
    // Önce currentCustomer'dan bak, yoksa customers listesinden
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
      
    if (!customer) {
      console.error('Customer not found for setDefaultAddress:', customerId);
      return;
    }

    const updatedAddresses = customer.addresses.map((addr: Address) => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));

    const updatedCustomer = {
      ...customer,
      addresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const getDefaultAddress = (customerId: string): Address | undefined => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return undefined;
    return customer.addresses.find(addr => addr.isDefault) || customer.addresses[0];
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return state.customers.find(c => c.id === id);
  };

  const getCustomerByEmail = (email: string): Customer | undefined => {
    return state.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  };

  const addOrderToCustomer = async (customerId: string, orderId: string, amount: number) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const updatedCustomer = {
      ...customer,
      orders: [...customer.orders, orderId],
      orderCount: customer.orderCount + 1,
      totalSpent: customer.totalSpent + amount,
      lastOrderDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error adding order to customer:', error);
    }
  };

  const addAccountCredit = async (customerId: string, amount: number, reason: string): Promise<boolean> => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return false;

    const updatedCustomer = {
      ...customer,
      accountCredit: customer.accountCredit + amount,
      updatedAt: new Date().toISOString(),
      notes: customer.notes + `\n[${new Date().toLocaleString('tr-TR')}] Kredi eklendi: ${amount}₺ - ${reason}`,
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding account credit:', error);
      return false;
    }
  };

  // Favoriler - API tabanlı
  const addToFavorites = async (customerId: string, productId: string) => {
    // Önce currentCustomer'a bak, sonra customers listesine
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
    
    if (!customer || customer.favorites.includes(productId)) return;

    const updatedCustomer = {
      ...customer,
      favorites: [...customer.favorites, productId],
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (customerId: string, productId: string) => {
    // Önce currentCustomer'a bak, sonra customers listesine
    let customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
    
    if (!customer) return;

    const updatedCustomer = {
      ...customer,
      favorites: customer.favorites.filter((id: string) => id !== productId),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedCustomers = state.customers.map((c: Customer) => 
          c.id === result.id ? result : c
        );
        dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
        
        if (state.currentCustomer?.id === result.id) {
          dispatch({ type: 'LOGIN_CUSTOMER', payload: result });
        }
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const isFavorite = (customerId: string, productId: string): boolean => {
    // Önce currentCustomer'a bak, sonra customers listesine
    const customer = state.currentCustomer?.id === customerId 
      ? state.currentCustomer 
      : state.customers.find(c => c.id === customerId);
    return customer?.favorites.includes(productId) || false;
  };

  // Profil güncelleme - Supabase API
  const updateProfile = async (customerId: string, data: { name?: string; phone?: string; email?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!customerId) return { success: false, error: 'Müşteri ID bulunamadı.' };

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Profil güncellenemedi.' };
      }

      // Supabase'den gelen snake_case veriyi camelCase'e çevir
      const updatedCustomer = {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
        phone: result.customer.phone,
        password: result.customer.password, // Supabase'de password olarak saklanıyor
        addresses: result.customer.addresses || [],
        orders: result.customer.orders || [],
        favorites: result.customer.favorites || [],
        createdAt: result.customer.created_at,
        updatedAt: result.customer.updated_at,
      };

      // State'i güncelle
      const updatedCustomers = state.customers.map((c: Customer) => 
        c.id === updatedCustomer.id ? updatedCustomer : c
      );
      dispatch({ type: 'LOAD_CUSTOMERS', payload: updatedCustomers });
      
      // Aktif müşteri ise currentCustomer'ı da güncelle
      if (state.currentCustomer?.id === updatedCustomer.id) {
        dispatch({ type: 'LOGIN_CUSTOMER', payload: updatedCustomer });
        // localStorage güncellemesi
        localStorage.setItem('vadiler_user', JSON.stringify({
          email: updatedCustomer.email,
          name: updatedCustomer.name,
          role: 'user',
          customerId: updatedCustomer.id,
          loginTime: Date.now(),
        }));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Profil güncellenirken hata oluştu.' };
    }
  };

  const changePassword = async (customerId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!customerId) return { success: false, error: 'Müşteri ID bulunamadı.' };

    // Frontend validasyonu
    if (newPassword.length < 6) {
      return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' };
    }

    try {
      const response = await fetch(`/api/customers/${customerId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Şifre değiştirilemedi.' };
      }

      // Şifre başarıyla değiştirildi
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Şifre değiştirilirken hata oluştu.' };
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        state,
        dispatch,
        register,
        login,
        loginWithGoogle,
        verifyLoginOtp,
        verifyRegisterOtp,
        logout,
        updateCustomer,
        deleteCustomer,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getCustomerById,
        getCustomerByEmail,
        addOrderToCustomer,
        addAccountCredit,
        getDefaultAddress,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
