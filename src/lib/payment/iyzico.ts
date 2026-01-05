import crypto from 'crypto';
import type {
  IyzicoConfig,
  IyzicoPaymentRequest,
  IyzicoPaymentResponse,
  IyzicoCheckoutFormInitializeRequest,
  IyzicoCheckoutFormRetrieveRequest,
} from './types';

/**
 * iyzico Payment Gateway Client
 * Modern REST API implementation (Turbopack compatible)
 * Exact port of iyzico SDK signature algorithm
 */
class IyzicoClient {
  private config: IyzicoConfig;

  constructor() {
    const apiKey = process.env.IYZICO_API_KEY?.trim();
    const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
    const uri = process.env.IYZICO_BASE_URL?.trim().replace(/\/+$/, '');

    this.config = {
      apiKey: apiKey!,
      secretKey: secretKey!,
      uri: uri!,
    };

    if (!this.config.apiKey || !this.config.secretKey || !this.config.uri) {
      throw new Error(
        'Missing iyzico credentials. Please check IYZICO_API_KEY, IYZICO_SECRET_KEY, and IYZICO_BASE_URL environment variables.'
      );
    }
  }

  /**
   * Generate random string
   */
  private generateRandomString(): string {
    // Postman + SDK examples use a digits-only-ish randomKey. Keep it simple and safe.
    return `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
  }

  /**
   * Generate PKI string (SDK v1 fallback format)
   */
  private generatePkiString(request: unknown): string {
    const isArray = Array.isArray(request);
    let requestString = '[';
    
    if (request && typeof request === 'object') {
      const obj = request as Record<string, unknown>;
      // Do NOT sort keys: v1 PKI depends on SDK's natural traversal order.
      const keys = Object.keys(obj);
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = obj[key];
        
        if (typeof val !== 'undefined' && typeof val !== 'function') {
          if (!isArray) {
            requestString += key + '=';
          }
          
          if (typeof val === 'object' && val !== null) {
            requestString += this.generatePkiString(val);
          } else {
            requestString += val;
          }
          
          // SDK: arrays use ', ' and objects use ','
          requestString += isArray ? ', ' : ',';
        }
      }
      
      // Remove trailing delimiter
      requestString = requestString.slice(0, isArray ? -2 : -1);
    }
    
    requestString += ']';
    return requestString;
  }

  /**
   * Generate authorization header (IYZWSv2)
   * Signature (Postman + SDK): HMAC-SHA256(secretKey, randomKey + uriPath + requestBodyString)
   * Authorization: IYZWSv2 base64("apiKey:<apiKey>&randomKey:<rnd>&signature:<hex>")
   */
  private generateAuthHeaderV2(params: {
    uriPath: string;
    bodyString: string;
  }): { authorization: string; randomKey: string } {
    const randomKey = this.generateRandomString();
    const signData = randomKey + params.uriPath + params.bodyString;

    const signatureHex = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signData, 'utf8')
      .digest('hex');

    const authorizationString = `apiKey:${this.config.apiKey}&randomKey:${randomKey}&signature:${signatureHex}`;
    const authorizationBase64 = Buffer.from(authorizationString, 'utf8').toString('base64');

    return {
      authorization: `IYZWSv2 ${authorizationBase64}`,
      randomKey,
    };
  }

  /**
   * Generate authorization header (IYZWS v1) for fallback compatibility.
   * Hash: base64(SHA1(apiKey + rnd + secretKey + pkiString))
   */
  private generateAuthHeaderV1Fallback(request: object, randomKey: string): string {
    const pkiString = this.generatePkiString(request);
    const shaSum = crypto.createHash('sha1');
    shaSum.update(this.config.apiKey + randomKey + this.config.secretKey + pkiString, 'utf8');
    const hash = shaSum.digest('base64');
    return `IYZWS ${this.config.apiKey}:${hash}`;
  }

  /**
   * Make API request to iyzico
   */
  async request<T>(endpoint: string, data: object): Promise<T> {
    const bodyString = JSON.stringify(data);
    const { authorization, randomKey } = this.generateAuthHeaderV2({
      uriPath: endpoint,
      bodyString,
    });
    const fallbackAuthorization = this.generateAuthHeaderV1Fallback(data, randomKey);
    const url = `${this.config.uri}${endpoint}`;

    console.log(`🔗 iyzico API Request: ${endpoint}`);
    console.log(`🎲 Random Key (x-iyzi-rnd): ${randomKey}`);
    console.log(`🔐 Authorization: IYZWSv2 <base64> (len=${authorization.length})`);
    console.log(`🔐 Authorization_Fallback: IYZWS <apiKey>:<sha1base64>`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Authorization_Fallback': fallbackAuthorization,
        'x-iyzi-rnd': randomKey,
        'x-iyzi-client-version': 'iyzipay-node-2.0.64',
      },
      body: bodyString,
    });

    const result = await response.json();
    
    console.log(`📦 iyzico API Response status: ${result.status}`);
    if (result.status !== 'success') {
      console.error(`❌ iyzico Error: ${result.errorMessage} (Code: ${result.errorCode})`);
    }
    
    return result as T;
  }

  /**
   * Initialize 3D Secure payment
   */
  async initializeThreeDS(request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> {
    return this.request<IyzicoPaymentResponse>('/payment/3dsecure/initialize', request);
  }

  /**
   * Initialize Checkout Form (hosted payment)
   */
  async initializeCheckoutForm(
    request: IyzicoCheckoutFormInitializeRequest
  ): Promise<IyzicoPaymentResponse> {
    return this.request<IyzicoPaymentResponse>(
      '/payment/iyzipos/checkoutform/initialize/auth/ecom',
      request
    );
  }

  /**
   * Retrieve Checkout Form result
   */
  async retrieveCheckoutForm(
    request: IyzicoCheckoutFormRetrieveRequest
  ): Promise<IyzicoPaymentResponse> {
    return this.request<IyzicoPaymentResponse>(
      '/payment/iyzipos/checkoutform/auth/ecom/detail',
      request
    );
  }

  /**
   * Complete 3D Secure payment after bank callback
   */
  async completeThreeDS(paymentId: string, conversationId?: string): Promise<IyzicoPaymentResponse> {
    const request = {
      locale: 'tr',
      conversationId: conversationId || this.generateRandomString(),
      paymentId: paymentId,
    };
    return this.request<IyzicoPaymentResponse>('/payment/3dsecure/auth', request);
  }

  /**
   * Retrieve payment details
   */
  async retrievePayment(paymentId: string, conversationId?: string): Promise<IyzicoPaymentResponse> {
    const request = {
      locale: 'tr',
      conversationId: conversationId || this.generateRandomString(),
      paymentId: paymentId,
    };
    return this.request<IyzicoPaymentResponse>('/payment/detail', request);
  }

  /**
   * Check if running in sandbox mode
   */
  isSandbox(): boolean {
    return this.config.uri?.includes('sandbox') ?? false;
  }

  /**
   * Get environment name
   */
  getEnvironment(): 'sandbox' | 'production' {
    return this.isSandbox() ? 'sandbox' : 'production';
  }
}

// Lazy singleton instance
let clientInstance: IyzicoClient | null = null;

export function getIyzicoClient(): IyzicoClient {
  if (!clientInstance) {
    clientInstance = new IyzicoClient();
  }
  return clientInstance;
}

// Export for backward compatibility
export const iyzicoClient = {
  get instance() {
    return getIyzicoClient();
  }
};

export default iyzicoClient;
