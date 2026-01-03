/**
 * İstanbul İlçeleri - Anadolu ve Avrupa Yakası
 * Vadiler Çiçekçilik sadece İstanbul'a teslimat yapmaktadır.
 */

export interface IstanbulDistrict {
  id: number;
  name: string;
  side: 'anadolu' | 'avrupa';
}

// Avrupa Yakası İlçeleri
export const AVRUPA_ILCELERI: IstanbulDistrict[] = [
  { id: 1, name: 'Arnavutköy', side: 'avrupa' },
  { id: 2, name: 'Avcılar', side: 'avrupa' },
  { id: 3, name: 'Bağcılar', side: 'avrupa' },
  { id: 4, name: 'Bahçelievler', side: 'avrupa' },
  { id: 5, name: 'Bakırköy', side: 'avrupa' },
  { id: 6, name: 'Başakşehir', side: 'avrupa' },
  { id: 7, name: 'Bayrampaşa', side: 'avrupa' },
  { id: 8, name: 'Beşiktaş', side: 'avrupa' },
  { id: 9, name: 'Beylikdüzü', side: 'avrupa' },
  { id: 10, name: 'Beyoğlu', side: 'avrupa' },
  { id: 11, name: 'Büyükçekmece', side: 'avrupa' },
  { id: 12, name: 'Çatalca', side: 'avrupa' },
  { id: 13, name: 'Esenler', side: 'avrupa' },
  { id: 14, name: 'Esenyurt', side: 'avrupa' },
  { id: 15, name: 'Eyüpsultan', side: 'avrupa' },
  { id: 16, name: 'Fatih', side: 'avrupa' },
  { id: 17, name: 'Gaziosmanpaşa', side: 'avrupa' },
  { id: 18, name: 'Güngören', side: 'avrupa' },
  { id: 19, name: 'Kağıthane', side: 'avrupa' },
  { id: 20, name: 'Küçükçekmece', side: 'avrupa' },
  { id: 21, name: 'Sarıyer', side: 'avrupa' },
  { id: 22, name: 'Silivri', side: 'avrupa' },
  { id: 23, name: 'Sultangazi', side: 'avrupa' },
  { id: 24, name: 'Şişli', side: 'avrupa' },
  { id: 25, name: 'Zeytinburnu', side: 'avrupa' },
];

// Anadolu Yakası İlçeleri
export const ANADOLU_ILCELERI: IstanbulDistrict[] = [
  { id: 26, name: 'Adalar', side: 'anadolu' },
  { id: 27, name: 'Ataşehir', side: 'anadolu' },
  { id: 28, name: 'Beykoz', side: 'anadolu' },
  { id: 29, name: 'Çekmeköy', side: 'anadolu' },
  { id: 30, name: 'Kadıköy', side: 'anadolu' },
  { id: 31, name: 'Kartal', side: 'anadolu' },
  { id: 32, name: 'Maltepe', side: 'anadolu' },
  { id: 33, name: 'Pendik', side: 'anadolu' },
  { id: 34, name: 'Sancaktepe', side: 'anadolu' },
  { id: 35, name: 'Sultanbeyli', side: 'anadolu' },
  { id: 36, name: 'Şile', side: 'anadolu' },
  { id: 37, name: 'Tuzla', side: 'anadolu' },
  { id: 38, name: 'Ümraniye', side: 'anadolu' },
  { id: 39, name: 'Üsküdar', side: 'anadolu' },
];

// Tüm İstanbul ilçeleri
export const ISTANBUL_ILCELERI: IstanbulDistrict[] = [
  ...AVRUPA_ILCELERI,
  ...ANADOLU_ILCELERI,
].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

// Yaka seçenekleri
export const YAKA_OPTIONS = [
  { id: 'avrupa', name: 'Avrupa Yakası', icon: '🌉' },
  { id: 'anadolu', name: 'Anadolu Yakası', icon: '🏔️' },
] as const;

// İlçeyi yakaya göre getir
export function getDistrictsBySide(side: 'anadolu' | 'avrupa'): IstanbulDistrict[] {
  return side === 'anadolu' ? ANADOLU_ILCELERI : AVRUPA_ILCELERI;
}

// İlçe adından bilgi getir
export function getDistrictByName(name: string): IstanbulDistrict | undefined {
  return ISTANBUL_ILCELERI.find(d => d.name.toLowerCase() === name.toLowerCase());
}

// İlçe ID'sinden bilgi getir
export function getDistrictById(id: number): IstanbulDistrict | undefined {
  return ISTANBUL_ILCELERI.find(d => d.id === id);
}

export default {
  AVRUPA_ILCELERI,
  ANADOLU_ILCELERI,
  ISTANBUL_ILCELERI,
  YAKA_OPTIONS,
  getDistrictsBySide,
  getDistrictByName,
  getDistrictById,
};
