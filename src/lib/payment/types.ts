// iyzico Payment Type Definitions

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  uri: string;
}

export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  gsmNumber: string;
  email: string;
  identityNumber: string;
  lastLoginDate?: string;
  registrationDate?: string;
  registrationAddress: string;
  ip: string;
  city: string;
  country: string;
  zipCode?: string;
}

export interface IyzicoAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: 'PHYSICAL' | 'VIRTUAL';
  price: string;
}

export interface IyzicoPaymentRequest {
  locale: 'tr' | 'en';
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
  installment: number;
  basketId: string;
  paymentChannel: 'WEB' | 'MOBILE' | 'MOBILE_WEB' | 'MOBILE_IOS' | 'MOBILE_ANDROID';
  paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION';
  callbackUrl: string;
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

export interface IyzicoCheckoutFormInitializeRequest {
  locale: 'tr' | 'en';
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
  basketId: string;
  paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION';
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

export interface IyzicoCheckoutFormRetrieveRequest {
  locale: 'tr' | 'en';
  conversationId: string;
  token: string;
}

export interface IyzicoPaymentResponse {
  status: 'success' | 'failure';
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  paymentId?: string;
  threeDSHtmlContent?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  token?: string;
  paidPrice?: string;
  lastFourDigits?: string;
  cardType?: string;
  cardAssociation?: string;
  installment?: number;
  paymentStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface Iyzico3DSCallbackParams {
  paymentId?: string;
  conversationId?: string;
  mdStatus?: string;
  status?: string;
}

export interface IyzicoAuthRequest {
  locale: 'tr' | 'en';
  conversationId: string;
  paymentId: string;
}

export interface IyzicoAuthResponse {
  status: 'success' | 'failure';
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  paymentId?: string;
  price?: number;
  paidPrice?: number;
  currency?: string;
  installment?: number;
  paymentStatus?: string;
  fraudStatus?: number;
  merchantCommissionRate?: number;
  merchantCommissionRateAmount?: number;
  iyziCommissionRateAmount?: number;
  iyziCommissionFee?: number;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  binNumber?: string;
  lastFourDigits?: string;
  basketId?: string;
  itemTransactions?: Array<{
    itemId: string;
    paymentTransactionId: string;
    transactionStatus: number;
    price: number;
    paidPrice: number;
    merchantCommissionRate: number;
    merchantCommissionRateAmount: number;
    iyziCommissionRateAmount: number;
    iyziCommissionFee: number;
    blockageRate: number;
    blockageRateAmountMerchant: number;
    blockageRateAmountSubMerchant: number;
    blockageResolvedDate: string;
    subMerchantPrice: number;
    subMerchantPayoutRate: number;
    subMerchantPayoutAmount: number;
    merchantPayoutAmount: number;
    convertedPayout: {
      paidPrice: number;
      iyziCommissionRateAmount: number;
      iyziCommissionFee: number;
      blockageRateAmountMerchant: number;
      blockageRateAmountSubMerchant: number;
      subMerchantPayoutAmount: number;
      merchantPayoutAmount: number;
      iyziConversionRate: number;
      iyziConversionRateAmount: number;
      currency: string;
    };
  }>;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}

export interface IyzicoWebhookPayload {
  iyziEventType: 'payment.success' | 'payment.failed' | 'payment.fraud' | 'refund.success';
  paymentId: string;
  paymentConversationId: string;
  status: 'success' | 'failure';
  price?: string;
  paidPrice?: string;
  currency?: string;
  token?: string; // For checkout form
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentProvider: 'iyzico';
  transactionId: string | null;
  conversationId: string;
  paymentPageUrl: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed';
  amount: number;
  currency: 'TRY';
  errorMessage: string | null;
  callbackData: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
