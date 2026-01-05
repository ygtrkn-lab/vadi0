/**
 * Meta Pixel (Facebook Pixel) Integration
 * E-commerce event tracking for Meta/Facebook ads
 */

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
      push?: (...args: any[]) => void;
    };
    _fbq?: typeof window.fbq;
  }
}

// Get Pixel ID from environment
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

/**
 * Check if Meta Pixel is available
 */
export const isPixelAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function' && !!META_PIXEL_ID;
};

/**
 * Safe fbq wrapper - calls fbq only if available
 */
export const fbq = (...args: any[]): void => {
  if (isPixelAvailable()) {
    window.fbq(...args);
  } else if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel Debug]', ...args);
  }
};

// ============================================
// Standard E-commerce Events
// ============================================

export interface MetaPixelProduct {
  id: number | string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}

/**
 * Track PageView event (automatically tracked by base pixel)
 * Call this manually for SPA route changes if needed
 */
export const trackMetaPageView = (): void => {
  fbq('track', 'PageView');
};

/**
 * Track ViewContent event - when user views a product
 */
export const trackMetaViewContent = (product: MetaPixelProduct): void => {
  fbq('track', 'ViewContent', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category || '',
    value: product.price,
    currency: 'TRY',
  });
};

/**
 * Track AddToCart event - when user adds item to cart
 */
export const trackMetaAddToCart = (product: MetaPixelProduct): void => {
  fbq('track', 'AddToCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.price * (product.quantity || 1),
    currency: 'TRY',
    contents: [{
      id: String(product.id),
      quantity: product.quantity || 1,
      item_price: product.price,
    }],
  });
};

/**
 * Track InitiateCheckout event - when user starts checkout process
 */
export const trackMetaInitiateCheckout = (cart: {
  items: Array<{ id: number | string; name: string; price: number; quantity: number }>;
  total: number;
}): void => {
  fbq('track', 'InitiateCheckout', {
    content_ids: cart.items.map(item => String(item.id)),
    content_type: 'product',
    num_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    value: cart.total,
    currency: 'TRY',
    contents: cart.items.map(item => ({
      id: String(item.id),
      quantity: item.quantity,
      item_price: item.price,
    })),
  });
};

/**
 * Track AddPaymentInfo event - when user adds payment information
 */
export const trackMetaAddPaymentInfo = (cart: {
  items: Array<{ id: number | string; price: number; quantity: number }>;
  total: number;
}): void => {
  fbq('track', 'AddPaymentInfo', {
    content_ids: cart.items.map(item => String(item.id)),
    content_type: 'product',
    value: cart.total,
    currency: 'TRY',
    contents: cart.items.map(item => ({
      id: String(item.id),
      quantity: item.quantity,
      item_price: item.price,
    })),
  });
};

/**
 * Track Purchase event - when order is completed
 */
export const trackMetaPurchase = (order: {
  orderId: string;
  total: number;
  items: Array<{ id: number | string; name: string; price: number; quantity: number }>;
}): void => {
  fbq('track', 'Purchase', {
    content_ids: order.items.map(item => String(item.id)),
    content_name: order.items.map(item => item.name).join(', '),
    content_type: 'product',
    num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    value: order.total,
    currency: 'TRY',
    contents: order.items.map(item => ({
      id: String(item.id),
      quantity: item.quantity,
      item_price: item.price,
    })),
    // Event deduplication - helps prevent duplicate tracking
    eventID: `purchase_${order.orderId}`,
  });
};

/**
 * Track Search event - when user searches for products
 */
export const trackMetaSearch = (searchQuery: string): void => {
  fbq('track', 'Search', {
    search_string: searchQuery,
    content_type: 'product',
  });
};

/**
 * Track AddToWishlist event - when user adds to favorites
 */
export const trackMetaAddToWishlist = (product: MetaPixelProduct): void => {
  fbq('track', 'AddToWishlist', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    content_category: product.category || '',
    value: product.price,
    currency: 'TRY',
  });
};

/**
 * Track CompleteRegistration event - when user signs up
 */
export const trackMetaCompleteRegistration = (customerId?: string): void => {
  fbq('track', 'CompleteRegistration', {
    content_name: 'Customer Registration',
    status: true,
    ...(customerId && { customer_id: customerId }),
  });
};

/**
 * Track Contact event - when user contacts business
 */
export const trackMetaContact = (): void => {
  fbq('track', 'Contact');
};

/**
 * Track Lead event - when user shows interest (e.g., newsletter signup)
 */
export const trackMetaLead = (info?: { content_name?: string; value?: number }): void => {
  fbq('track', 'Lead', {
    content_name: info?.content_name || 'Lead',
    currency: 'TRY',
    ...(info?.value && { value: info.value }),
  });
};

// ============================================
// Custom Events (trackCustom)
// ============================================

/**
 * Track custom event
 */
export const trackMetaCustomEvent = (eventName: string, params?: Record<string, any>): void => {
  fbq('trackCustom', eventName, params);
};

/**
 * Track RemoveFromCart custom event
 */
export const trackMetaRemoveFromCart = (product: MetaPixelProduct): void => {
  fbq('trackCustom', 'RemoveFromCart', {
    content_ids: [String(product.id)],
    content_name: product.name,
    content_type: 'product',
    value: product.price * (product.quantity || 1),
    currency: 'TRY',
  });
};

/**
 * Track ViewCategory custom event
 */
export const trackMetaViewCategory = (category: { name: string; slug: string }): void => {
  fbq('trackCustom', 'ViewCategory', {
    content_name: category.name,
    content_category: category.slug,
    content_type: 'product_group',
  });
};

export default {
  fbq,
  isPixelAvailable,
  trackMetaPageView,
  trackMetaViewContent,
  trackMetaAddToCart,
  trackMetaInitiateCheckout,
  trackMetaAddPaymentInfo,
  trackMetaPurchase,
  trackMetaSearch,
  trackMetaAddToWishlist,
  trackMetaCompleteRegistration,
  trackMetaContact,
  trackMetaLead,
  trackMetaCustomEvent,
  trackMetaRemoveFromCart,
  trackMetaViewCategory,
};
