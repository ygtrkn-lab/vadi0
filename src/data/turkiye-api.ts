/**
 * Türkiye API - İl, İlçe, Mahalle, Köy Verileri
 * 
 * API Kaynağı: https://turkiyeapi.dev
 * GitHub: https://github.com/ubeydeozdmr/turkiye-api
 * 
 * Güncel Türkiye idari bölünme verileri:
 * - 81 İl (Provinces)
 * - 973 İlçe (Districts)  
 * - 32.000+ Mahalle (Neighborhoods)
 * - 18.000+ Köy (Villages)
 * - Beldeler (Towns)
 */

const API_BASE_URL = 'https://turkiyeapi.dev/api/v1';

// TypeScript Interfaces
export interface Province {
  id: number;
  name: string;
  population: number;
  area: number;
  altitude: number;
  areaCode: number[];
  isCoastal: boolean;
  isMetropolitan: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  maps: {
    googleMaps: string;
    openStreetMap: string;
  };
  region: {
    tr: string;
    en: string;
  };
  districts?: District[];
}

export interface District {
  id: number;
  provinceId: number;
  province?: string;
  name: string;
  population: number;
  area: number;
  postalCode?: string;
  neighborhoods?: Neighborhood[];
  villages?: Village[];
}

export interface Neighborhood {
  id: number;
  provinceId: number;
  districtId: number;
  province: string;
  district: string;
  name: string;
  population: number;
}

export interface Village {
  id: number;
  provinceId: number;
  districtId: number;
  province: string;
  district: string;
  name: string;
  population: number;
}

export interface Town {
  id: number;
  provinceId: number;
  districtId: number;
  province: string;
  district: string;
  name: string;
  population: number;
}

// API Response Types
interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data: T;
  error?: string;
}

// API Fonksiyonları

/**
 * Tüm illeri getir
 */
export async function getProvinces(): Promise<Province[]> {
  const response = await fetch(`${API_BASE_URL}/provinces`);
  const result: ApiResponse<Province[]> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Tek bir ili getir (ilçeleri dahil)
 */
export async function getProvince(id: number, extend: boolean = false): Promise<Province> {
  const url = extend 
    ? `${API_BASE_URL}/provinces/${id}?extend=true`
    : `${API_BASE_URL}/provinces/${id}`;
  const response = await fetch(url);
  const result: ApiResponse<Province> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Tüm ilçeleri getir
 */
export async function getDistricts(provinceId?: number): Promise<District[]> {
  const url = provinceId 
    ? `${API_BASE_URL}/districts?provinceId=${provinceId}`
    : `${API_BASE_URL}/districts`;
  const response = await fetch(url);
  const result: ApiResponse<District[]> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Tek bir ilçeyi getir (mahalle ve köyleri dahil)
 */
export async function getDistrict(id: number): Promise<District> {
  const response = await fetch(`${API_BASE_URL}/districts/${id}`);
  const result: ApiResponse<District> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Mahalleleri getir
 */
export async function getNeighborhoods(districtId?: number): Promise<Neighborhood[]> {
  const url = districtId 
    ? `${API_BASE_URL}/neighborhoods?districtId=${districtId}`
    : `${API_BASE_URL}/neighborhoods?limit=1000`;
  const response = await fetch(url);
  const result: ApiResponse<Neighborhood[]> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Köyleri getir
 */
export async function getVillages(districtId?: number): Promise<Village[]> {
  const url = districtId 
    ? `${API_BASE_URL}/villages?districtId=${districtId}`
    : `${API_BASE_URL}/villages?limit=1000`;
  const response = await fetch(url);
  const result: ApiResponse<Village[]> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

/**
 * Beldeleri getir
 */
export async function getTowns(districtId?: number): Promise<Town[]> {
  const url = districtId 
    ? `${API_BASE_URL}/towns?districtId=${districtId}`
    : `${API_BASE_URL}/towns?limit=1000`;
  const response = await fetch(url);
  const result: ApiResponse<Town[]> = await response.json();
  if (result.status === 'ERROR') throw new Error(result.error);
  return result.data;
}

// İl Listesi (Statik - Hızlı erişim için)
export const PROVINCES = [
  { id: 1, name: 'Adana', plateCode: '01' },
  { id: 2, name: 'Adıyaman', plateCode: '02' },
  { id: 3, name: 'Afyonkarahisar', plateCode: '03' },
  { id: 4, name: 'Ağrı', plateCode: '04' },
  { id: 5, name: 'Amasya', plateCode: '05' },
  { id: 6, name: 'Ankara', plateCode: '06' },
  { id: 7, name: 'Antalya', plateCode: '07' },
  { id: 8, name: 'Artvin', plateCode: '08' },
  { id: 9, name: 'Aydın', plateCode: '09' },
  { id: 10, name: 'Balıkesir', plateCode: '10' },
  { id: 11, name: 'Bilecik', plateCode: '11' },
  { id: 12, name: 'Bingöl', plateCode: '12' },
  { id: 13, name: 'Bitlis', plateCode: '13' },
  { id: 14, name: 'Bolu', plateCode: '14' },
  { id: 15, name: 'Burdur', plateCode: '15' },
  { id: 16, name: 'Bursa', plateCode: '16' },
  { id: 17, name: 'Çanakkale', plateCode: '17' },
  { id: 18, name: 'Çankırı', plateCode: '18' },
  { id: 19, name: 'Çorum', plateCode: '19' },
  { id: 20, name: 'Denizli', plateCode: '20' },
  { id: 21, name: 'Diyarbakır', plateCode: '21' },
  { id: 22, name: 'Edirne', plateCode: '22' },
  { id: 23, name: 'Elazığ', plateCode: '23' },
  { id: 24, name: 'Erzincan', plateCode: '24' },
  { id: 25, name: 'Erzurum', plateCode: '25' },
  { id: 26, name: 'Eskişehir', plateCode: '26' },
  { id: 27, name: 'Gaziantep', plateCode: '27' },
  { id: 28, name: 'Giresun', plateCode: '28' },
  { id: 29, name: 'Gümüşhane', plateCode: '29' },
  { id: 30, name: 'Hakkari', plateCode: '30' },
  { id: 31, name: 'Hatay', plateCode: '31' },
  { id: 32, name: 'Isparta', plateCode: '32' },
  { id: 33, name: 'Mersin', plateCode: '33' },
  { id: 34, name: 'İstanbul', plateCode: '34' },
  { id: 35, name: 'İzmir', plateCode: '35' },
  { id: 36, name: 'Kars', plateCode: '36' },
  { id: 37, name: 'Kastamonu', plateCode: '37' },
  { id: 38, name: 'Kayseri', plateCode: '38' },
  { id: 39, name: 'Kırklareli', plateCode: '39' },
  { id: 40, name: 'Kırşehir', plateCode: '40' },
  { id: 41, name: 'Kocaeli', plateCode: '41' },
  { id: 42, name: 'Konya', plateCode: '42' },
  { id: 43, name: 'Kütahya', plateCode: '43' },
  { id: 44, name: 'Malatya', plateCode: '44' },
  { id: 45, name: 'Manisa', plateCode: '45' },
  { id: 46, name: 'Kahramanmaraş', plateCode: '46' },
  { id: 47, name: 'Mardin', plateCode: '47' },
  { id: 48, name: 'Muğla', plateCode: '48' },
  { id: 49, name: 'Muş', plateCode: '49' },
  { id: 50, name: 'Nevşehir', plateCode: '50' },
  { id: 51, name: 'Niğde', plateCode: '51' },
  { id: 52, name: 'Ordu', plateCode: '52' },
  { id: 53, name: 'Rize', plateCode: '53' },
  { id: 54, name: 'Sakarya', plateCode: '54' },
  { id: 55, name: 'Samsun', plateCode: '55' },
  { id: 56, name: 'Siirt', plateCode: '56' },
  { id: 57, name: 'Sinop', plateCode: '57' },
  { id: 58, name: 'Sivas', plateCode: '58' },
  { id: 59, name: 'Tekirdağ', plateCode: '59' },
  { id: 60, name: 'Tokat', plateCode: '60' },
  { id: 61, name: 'Trabzon', plateCode: '61' },
  { id: 62, name: 'Tunceli', plateCode: '62' },
  { id: 63, name: 'Şanlıurfa', plateCode: '63' },
  { id: 64, name: 'Uşak', plateCode: '64' },
  { id: 65, name: 'Van', plateCode: '65' },
  { id: 66, name: 'Yozgat', plateCode: '66' },
  { id: 67, name: 'Zonguldak', plateCode: '67' },
  { id: 68, name: 'Aksaray', plateCode: '68' },
  { id: 69, name: 'Bayburt', plateCode: '69' },
  { id: 70, name: 'Karaman', plateCode: '70' },
  { id: 71, name: 'Kırıkkale', plateCode: '71' },
  { id: 72, name: 'Batman', plateCode: '72' },
  { id: 73, name: 'Şırnak', plateCode: '73' },
  { id: 74, name: 'Bartın', plateCode: '74' },
  { id: 75, name: 'Ardahan', plateCode: '75' },
  { id: 76, name: 'Iğdır', plateCode: '76' },
  { id: 77, name: 'Yalova', plateCode: '77' },
  { id: 78, name: 'Karabük', plateCode: '78' },
  { id: 79, name: 'Kilis', plateCode: '79' },
  { id: 80, name: 'Osmaniye', plateCode: '80' },
  { id: 81, name: 'Düzce', plateCode: '81' },
] as const;

// Büyükşehirler
export const METROPOLITAN_CITIES = [
  'Adana', 'Ankara', 'Antalya', 'Aydın', 'Balıkesir', 'Bursa', 
  'Denizli', 'Diyarbakır', 'Erzurum', 'Eskişehir', 'Gaziantep', 
  'Hatay', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Kayseri', 
  'Kocaeli', 'Konya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 
  'Muğla', 'Ordu', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Tekirdağ', 
  'Trabzon', 'Van'
] as const;

// Bölgeler
export const REGIONS = {
  'Marmara': ['İstanbul', 'Tekirdağ', 'Edirne', 'Kırklareli', 'Balıkesir', 'Çanakkale', 'Kocaeli', 'Sakarya', 'Bilecik', 'Bursa', 'Yalova'],
  'Ege': ['İzmir', 'Aydın', 'Denizli', 'Muğla', 'Manisa', 'Afyonkarahisar', 'Kütahya', 'Uşak'],
  'Akdeniz': ['Antalya', 'Isparta', 'Burdur', 'Adana', 'Mersin', 'Hatay', 'Kahramanmaraş', 'Osmaniye'],
  'İç Anadolu': ['Ankara', 'Konya', 'Eskişehir', 'Kayseri', 'Sivas', 'Yozgat', 'Aksaray', 'Niğde', 'Nevşehir', 'Kırşehir', 'Kırıkkale', 'Çankırı', 'Karaman'],
  'Karadeniz': ['Zonguldak', 'Karabük', 'Bartın', 'Kastamonu', 'Çorum', 'Sinop', 'Samsun', 'Amasya', 'Tokat', 'Ordu', 'Giresun', 'Trabzon', 'Rize', 'Artvin', 'Gümüşhane', 'Bayburt', 'Bolu', 'Düzce'],
  'Doğu Anadolu': ['Erzurum', 'Erzincan', 'Kars', 'Iğdır', 'Ağrı', 'Ardahan', 'Van', 'Muş', 'Bitlis', 'Hakkari', 'Bingöl', 'Tunceli', 'Elazığ', 'Malatya'],
  'Güneydoğu Anadolu': ['Gaziantep', 'Adıyaman', 'Kilis', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Şırnak', 'Siirt']
} as const;

export default {
  API_BASE_URL,
  getProvinces,
  getProvince,
  getDistricts,
  getDistrict,
  getNeighborhoods,
  getVillages,
  getTowns,
  PROVINCES,
  METROPOLITAN_CITIES,
  REGIONS
};
