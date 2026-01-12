/**
 * Google Analytics Data API v1 Client
 * 
 * Bu modül, Google Analytics 4 verilerini çekmek için kullanılır.
 * 
 * Kurulum:
 * 1. Google Cloud Console'a gidin: https://console.cloud.google.com
 * 2. "Google Analytics Data API" etkinleştirin
 * 3. Service Account oluşturun ve JSON key indirin
 * 4. GA4 Property'nize Service Account email'ini "Viewer" olarak ekleyin
 * 5. .env.local'a aşağıdaki değerleri ekleyin:
 *    - GOOGLE_ANALYTICS_PROPERTY_ID=123456789
 *    - GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
 */

export interface GAMetric {
  name: string;
  value: string;
}

export interface GADimension {
  name: string;
  value: string;
}

export interface GARow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

export interface GAReportResponse {
  dimensionHeaders: { name: string }[];
  metricHeaders: { name: string }[];
  rows: GARow[];
  rowCount: number;
  metadata: {
    currencyCode: string;
    timeZone: string;
  };
}

// Google OAuth2 token için
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Service Account credentials'ı parse et
 */
function getCredentials() {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. ' +
      'Please add your Google Cloud Service Account JSON credentials.'
    );
  }

  try {
    return JSON.parse(credentialsJson);
  } catch {
    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
  }
}

/**
 * JWT token oluştur ve access token al
 */
async function getAccessToken(): Promise<string> {
  // Cache'den token varsa ve geçerliyse kullan
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const credentials = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  
  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  // JWT Payload
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
  };

  // Base64 URL encode
  const base64UrlEncode = (obj: object) => {
    const str = JSON.stringify(obj);
    const base64 = Buffer.from(str).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // RS256 ile imzala
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signature}`;

  // Token al
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData: TokenResponse = await tokenResponse.json();
  
  // Cache'le
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };

  return tokenData.access_token;
}

/**
 * GA4 Property ID'yi al
 */
function getPropertyId(): string {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  
  if (!propertyId) {
    throw new Error(
      'GOOGLE_ANALYTICS_PROPERTY_ID environment variable is not set. ' +
      'Find it in GA4: Admin > Property Settings > Property ID'
    );
  }

  return propertyId;
}

/**
 * Google Analytics Data API'ye rapor isteği gönder
 */
export async function runReport(request: {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: object;
  metricFilter?: object;
  orderBys?: object[];
  limit?: number;
  offset?: number;
}): Promise<GAReportResponse> {
  const accessToken = await getAccessToken();
  const propertyId = getPropertyId();

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Analytics API error: ${error}`);
  }

  return response.json();
}

/**
 * Realtime rapor al (son 30 dakika)
 */
export async function runRealtimeReport(request: {
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: object;
  metricFilter?: object;
  limit?: number;
}): Promise<GAReportResponse> {
  const accessToken = await getAccessToken();
  const propertyId = getPropertyId();

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Analytics Realtime API error: ${error}`);
  }

  return response.json();
}

/**
 * API'nin yapılandırılıp yapılandırılmadığını kontrol et
 */
export function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID
  );
}

/**
 * Yapılandırma durumunu ve hataları kontrol et
 */
export function getConfigurationStatus(): {
  configured: boolean;
  missingVars: string[];
  instructions: string;
} {
  const missingVars: string[] = [];
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    missingVars.push('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
  
  if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
    missingVars.push('GOOGLE_ANALYTICS_PROPERTY_ID');
  }

  return {
    configured: missingVars.length === 0,
    missingVars,
    instructions: `
Google Analytics API Kurulum Adımları:

1. Google Cloud Console'a gidin: https://console.cloud.google.com

2. Yeni proje oluşturun veya mevcut projeyi seçin

3. "APIs & Services" > "Enable APIs" > "Google Analytics Data API" etkinleştirin

4. "APIs & Services" > "Credentials" > "Create Credentials" > "Service Account"
   - İsim verin (örn: vadiler-analytics)
   - Role olarak "Viewer" seçin
   - "Done" tıklayın

5. Oluşturulan Service Account'a tıklayın > "Keys" > "Add Key" > "Create new key" > "JSON"
   - JSON dosyası indirilecek

6. GA4'e gidin: Admin > Property Access Management
   - Service Account email'ini ekleyin (örn: vadiler-analytics@project.iam.gserviceaccount.com)
   - "Viewer" rolü verin

7. .env.local dosyasına ekleyin:
   GOOGLE_ANALYTICS_PROPERTY_ID=123456789
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

Property ID'yi bulmak için: GA4 > Admin > Property Settings > Property ID
`
  };
}
