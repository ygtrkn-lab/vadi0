'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product } from '@/data/products';

// Types
export interface CartItem {
  product: Product;
  quantity: number;
  deliveryInfo?: DeliveryInfo;
}

export interface DeliveryInfo {
  province: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  neighborhood: { id: number; name: string } | null;
  deliveryDate: Date | null;
  deliveryTimeSlot: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  messageCard: string;
  isGift: boolean;
  senderName: string;
}

// Global Delivery Info - ürün detaydan sepete yansıyacak
export interface GlobalDeliveryInfo {
  location: string | null;
  district: string | null;
  date: Date | null;
  timeSlot: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  currentStep: number;
  tempDeliveryInfo: DeliveryInfo | null;
  selectedProductId: number | null;
  globalDeliveryInfo: GlobalDeliveryInfo | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'UPDATE_DELIVERY_INFO'; payload: { id: number; deliveryInfo: DeliveryInfo } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TEMP_DELIVERY_INFO'; payload: Partial<DeliveryInfo> }
  | { type: 'SET_SELECTED_PRODUCT'; payload: number | null }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'SET_GLOBAL_DELIVERY_INFO'; payload: GlobalDeliveryInfo }
  | { type: 'LOAD_GLOBAL_DELIVERY'; payload: GlobalDeliveryInfo | null };

const initialDeliveryInfo: DeliveryInfo = {
  province: null,
  district: null,
  neighborhood: null,
  deliveryDate: null,
  deliveryTimeSlot: null,
  recipientName: '',
  recipientPhone: '',
  recipientAddress: '',
  messageCard: '',
  isGift: false,
  senderName: '',
};

const initialState: CartState = {
  items: [],
  isOpen: false,
  currentStep: 1,
  tempDeliveryInfo: { ...initialDeliveryInfo },
  selectedProductId: null,
  globalDeliveryInfo: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
        selectedProductId: action.payload.id,
        currentStep: 1,
        tempDeliveryInfo: { ...initialDeliveryInfo },
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0),
      };
    case 'UPDATE_DELIVERY_INFO':
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.payload.id
            ? { ...item, deliveryInfo: action.payload.deliveryInfo }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [], globalDeliveryInfo: null };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_TEMP_DELIVERY_INFO':
      return {
        ...state,
        tempDeliveryInfo: state.tempDeliveryInfo
          ? { ...state.tempDeliveryInfo, ...action.payload }
          : { ...initialDeliveryInfo, ...action.payload },
      };
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProductId: action.payload };
    case 'LOAD_CART':
      return { ...state, items: action.payload };
    case 'SET_GLOBAL_DELIVERY_INFO':
      return { ...state, globalDeliveryInfo: action.payload };
    case 'LOAD_GLOBAL_DELIVERY':
      return { ...state, globalDeliveryInfo: action.payload };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setStep: (step: number) => void;
  updateTempDeliveryInfo: (info: Partial<DeliveryInfo>) => void;
  setSelectedProduct: (id: number | null) => void;
  completeDeliveryInfo: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  setGlobalDeliveryInfo: (info: GlobalDeliveryInfo) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart and global delivery from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('vadiler-cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch {
        console.error('Failed to parse cart from localStorage');
      }
    }
    
    // Global delivery info'yu da yükle
    const savedDelivery = localStorage.getItem('vadiler-delivery');
    if (savedDelivery) {
      try {
        const parsed = JSON.parse(savedDelivery);
        // Date'i geri dönüştür
        if (parsed.date) {
          parsed.date = new Date(parsed.date);
        }
        dispatch({ type: 'LOAD_GLOBAL_DELIVERY', payload: parsed });
      } catch {
        console.error('Failed to parse delivery from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('vadiler-cart', JSON.stringify(state.items));
    } else {
      localStorage.removeItem('vadiler-cart');
    }
  }, [state.items]);

  // Save global delivery info to localStorage
  useEffect(() => {
    if (state.globalDeliveryInfo) {
      localStorage.setItem('vadiler-delivery', JSON.stringify(state.globalDeliveryInfo));
    }
  }, [state.globalDeliveryInfo]);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeFromCart = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem('vadiler-cart');
    localStorage.removeItem('vadiler-delivery');
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const setStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const updateTempDeliveryInfo = (info: Partial<DeliveryInfo>) => {
    dispatch({ type: 'SET_TEMP_DELIVERY_INFO', payload: info });
  };

  const setSelectedProduct = (id: number | null) => {
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload: id });
  };

  const completeDeliveryInfo = () => {
    if (state.selectedProductId && state.tempDeliveryInfo) {
      dispatch({
        type: 'UPDATE_DELIVERY_INFO',
        payload: {
          id: state.selectedProductId,
          deliveryInfo: state.tempDeliveryInfo,
        },
      });
    }
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const setGlobalDeliveryInfo = (info: GlobalDeliveryInfo) => {
    dispatch({ type: 'SET_GLOBAL_DELIVERY_INFO', payload: info });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        setStep,
        updateTempDeliveryInfo,
        setSelectedProduct,
        completeDeliveryInfo,
        getTotalPrice,
        getTotalItems,
        setGlobalDeliveryInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
