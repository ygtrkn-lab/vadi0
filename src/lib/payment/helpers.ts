import type { CartItem, DeliveryInfo } from '@/context/CartContext';
import type { Product } from '@/data/products';
import type {
  IyzicoBuyer,
  IyzicoAddress,
  IyzicoBasketItem,
  IyzicoCheckoutFormInitializeRequest,
  IyzicoPaymentRequest,
} from './types';

/**
 * Format price for iyzico (must be string with 2 decimal places)
 */
export function formatIyzicoPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Transform cart items to iyzico basket items format
 */
export function transformCartToBasketItems(items: CartItem[]): IyzicoBasketItem[] {
  return items.map((item) => {
    // Support both CartContext shape (item.product.*) and flat shape (item.*)
    const anyItem = item as any;
    const productLike = anyItem.product ?? anyItem;

    const productId = productLike?.id ?? anyItem?.id ?? '0';
    const productName = (productLike?.name ?? anyItem?.name ?? 'Urun').toString();
    const category1 =
      (productLike?.categoryName ?? productLike?.category ?? anyItem?.category ?? 'Flowers').toString();
    const category2 = productLike?.tags?.[0] ?? anyItem?.tags?.[0] ?? undefined;

    const unitPrice = Number(productLike?.price ?? anyItem?.price ?? 0);
    const quantity = Number(anyItem?.quantity ?? productLike?.quantity ?? 1);

    return {
      id: `PROD_${productId}`,
      name: productName.substring(0, 256),
      category1,
      category2,
      itemType: 'PHYSICAL' as const,
      price: formatIyzicoPrice(unitPrice * quantity),
    };
  });
}

/**
 * Generate buyer information for iyzico
 * Uses customer data or guest checkout data
 */
export function generateBuyerInfo(
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt?: string;
  },
  deliveryInfo: DeliveryInfo,
  ipAddress: string = '85.34.78.112' // Fallback IP
): IyzicoBuyer {
  const [firstName, ...lastNameParts] = customer.name.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  // Format phone number (must start with +90)
  let formattedPhone = customer.phone.replace(/\s/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.startsWith('0')
      ? '+90' + formattedPhone.substring(1)
      : '+90' + formattedPhone;
  }

  return {
    id: customer.id,
    name: firstName,
    surname: lastName,
    gsmNumber: formattedPhone,
    email: customer.email,
    identityNumber: '11111111111', // Test value for sandbox (TC kimlik)
    registrationAddress: deliveryInfo.recipientAddress || 'Istanbul, Turkey',
    registrationDate: customer.createdAt
      ? new Date(customer.createdAt).toISOString().replace('T', ' ').substring(0, 19)
      : new Date().toISOString().replace('T', ' ').substring(0, 19),
    ip: ipAddress,
    city: deliveryInfo.province?.name || 'Istanbul',
    country: 'Turkey',
    zipCode: '34000',
  };
}

/**
 * Generate shipping address for iyzico
 */
export function generateShippingAddress(
  deliveryInfo: DeliveryInfo,
  recipientName?: string
): IyzicoAddress {
  return {
    contactName: recipientName || deliveryInfo.recipientName,
    city: deliveryInfo.province?.name || 'Istanbul',
    country: 'Turkey',
    address: deliveryInfo.recipientAddress || 'Address not provided',
    zipCode: '34000',
  };
}

/**
 * Generate billing address for iyzico
 */
export function generateBillingAddress(
  deliveryInfo: DeliveryInfo,
  customerName: string
): IyzicoAddress {
  return {
    contactName: customerName,
    city: deliveryInfo.province?.name || 'Istanbul',
    country: 'Turkey',
    address: deliveryInfo.recipientAddress || 'Address not provided',
    zipCode: '34000',
  };
}

/**
 * Build complete iyzico payment request
 */
export function buildIyzicoPaymentRequest(params: {
  orderId: string;
  cartItems: CartItem[];
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt?: string;
  };
  deliveryInfo: DeliveryInfo;
  totalAmount: number;
  callbackUrl: string;
  ipAddress?: string;
}): IyzicoPaymentRequest {
  const {
    orderId,
    cartItems,
    customer,
    deliveryInfo,
    totalAmount,
    callbackUrl,
    ipAddress,
  } = params;

  const basketItems = transformCartToBasketItems(cartItems);
  const buyer = generateBuyerInfo(customer, deliveryInfo, ipAddress);
  const shippingAddress = generateShippingAddress(deliveryInfo);
  const billingAddress = generateBillingAddress(deliveryInfo, customer.name);

  return {
    locale: 'tr',
    conversationId: orderId,
    price: formatIyzicoPrice(totalAmount),
    paidPrice: formatIyzicoPrice(totalAmount),
    currency: 'TRY',
    installment: 1, // Peşin ödeme
    basketId: `BASKET_${orderId}`,
    paymentChannel: 'WEB',
    paymentGroup: 'PRODUCT',
    callbackUrl,
    buyer,
    shippingAddress,
    billingAddress,
    basketItems,
  };
}

/**
 * Build iyzico Checkout Form initialize request (hosted payment)
 */
export function buildIyzicoCheckoutFormInitializeRequest(params: {
  orderId: string;
  cartItems: CartItem[];
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt?: string;
  };
  deliveryInfo: DeliveryInfo;
  totalAmount: number;
  callbackUrl: string;
  ipAddress?: string;
}): IyzicoCheckoutFormInitializeRequest {
  const {
    orderId,
    cartItems,
    customer,
    deliveryInfo,
    totalAmount,
    callbackUrl,
    ipAddress,
  } = params;

  const basketItems = transformCartToBasketItems(cartItems);
  const buyer = generateBuyerInfo(customer, deliveryInfo, ipAddress);
  const shippingAddress = generateShippingAddress(deliveryInfo);
  const billingAddress = generateBillingAddress(deliveryInfo, customer.name);

  return {
    locale: 'tr',
    conversationId: orderId,
    price: formatIyzicoPrice(totalAmount),
    paidPrice: formatIyzicoPrice(totalAmount),
    currency: 'TRY',
    basketId: `BASKET_${orderId}`,
    paymentGroup: 'PRODUCT',
    callbackUrl,
    enabledInstallments: [1],
    buyer,
    shippingAddress,
    billingAddress,
    basketItems,
  };
}

/**
 * Validate iyzico payment response
 */
export function validatePaymentResponse(response: any): {
  isValid: boolean;
  error?: string;
} {
  if (!response) {
    return { isValid: false, error: 'No response from payment gateway' };
  }

  if (response.status !== 'success') {
    return {
      isValid: false,
      error: response.errorMessage || 'Payment failed',
    };
  }

  return { isValid: true };
}

/**
 * Validate 3DS mdStatus
 */
export function validate3DSStatus(mdStatus: string): {
  isValid: boolean;
  message: string;
} {
  const statusMap: Record<string, { valid: boolean; message: string }> = {
    '1': { valid: true, message: '3DS authentication successful' },
    '2': { valid: true, message: '3DS authentication successful (Card not enrolled)' },
    '3': { valid: true, message: '3DS authentication successful (Bank not enrolled)' },
    '4': { valid: true, message: '3DS authentication successful (Registration attempt)' },
    '0': { valid: false, message: '3DS authentication failed' },
    '5': { valid: false, message: '3DS authentication failed (Unknown error)' },
    '6': { valid: false, message: '3DS authentication failed (Error)' },
    '7': { valid: false, message: '3DS authentication failed (System error)' },
  };

  const result = statusMap[mdStatus] || { valid: false, message: 'Unknown 3DS status' };
  return { isValid: result.valid, message: result.message };
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return '85.34.78.112'; // Fallback
}
