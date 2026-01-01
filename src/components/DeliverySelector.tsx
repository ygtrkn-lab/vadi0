'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X, ChevronRight, Search, Check, AlertCircle } from 'lucide-react';

// İstanbul bölgeleri
const ISTANBUL_REGIONS = [
  { 
    id: 'istanbul-avrupa', 
    name: 'İstanbul (Avrupa)', 
    districts: [
      'Arnavutköy', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir',
      'Bayrampaşa', 'Beşiktaş', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca',
      'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören',
      'Kağıthane', 'Küçükçekmece', 'Sarıyer', 'Silivri', 'Sultangazi', 'Şişli',
      'Zeytinburnu'
    ]
  },
  { 
    id: 'istanbul-anadolu', 
    name: 'İstanbul (Anadolu)', 
    districts: [
      'Adalar', 'Ataşehir', 'Beykoz', 'Çekmeköy', 'Kadıköy', 'Kartal', 'Maltepe',
      'Pendik', 'Sancaktepe', 'Sultanbeyli', 'Şile', 'Tuzla', 'Ümraniye', 'Üsküdar'
    ]
  },
];


// Diğer iller
const OTHER_PROVINCES: string[] = [];

interface DeliveryInfo {
  location: string | null;
  district: string | null;
  date: Date | null;
  timeSlot: string | null;
}

interface DeliverySelectorProps {
  onDeliveryComplete: (info: DeliveryInfo) => void;
  isRequired?: boolean;
  onOpenChange?: (open: boolean) => void;
  openSignal?: number;
}

export default function DeliverySelector({ onDeliveryComplete, isRequired = true, onOpenChange, openSignal }: DeliverySelectorProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOtherCityWarning, setShowOtherCityWarning] = useState(false);
  const [closedWarning, setClosedWarning] = useState<string | null>(null);
  const [step, setStep] = useState<'region' | 'district'>('region');
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const lastOpenSignal = useRef<number | null>(null);

  // Generate next 7 days starting from tomorrow (no same-day delivery)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const timeSlots = [
    { id: '11-17', label: '11:00-17:00' },
    { id: '17-22', label: '17:00-22:00' },
  ];

  const formatDateShort = (date: Date) => {
    const day = date.getDate();
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${day} ${months[date.getMonth()]}`;
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return days[date.getDay()];
  };

  // Filter based on search
  const filteredRegions = ISTANBUL_REGIONS.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredOtherProvinces = OTHER_PROVINCES.filter(p =>
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentRegion = ISTANBUL_REGIONS.find(r => r.id === selectedRegion);
// Geçici olarak hizmet verilmeyen ilçeler
const DISABLED_DISTRICTS = ['Çatalca', 'Silivri', 'Büyükçekmece'];

  const filteredDistricts = currentRegion?.districts.filter(d =>
    d.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Notify parent when delivery info is complete
  const hasNotified = useRef(false);
  
  useEffect(() => {
    if (selectedLocation && selectedDate && selectedTimeSlot) {
      // Her değişiklikte yeniden bildirim gönder
      hasNotified.current = false;
      
      if (!hasNotified.current) {
        hasNotified.current = true;
        onDeliveryComplete({
          location: selectedLocation,
          district: selectedDistrict,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
        });
      }
    } else {
      // Herhangi bir değer değiştiğinde bildirimi sıfırla
      hasNotified.current = false;
    }
  }, [selectedLocation, selectedDistrict, selectedDate, selectedTimeSlot, onDeliveryComplete]);

  // External trigger to open location selector and bring into view
  useEffect(() => {
    if (openSignal == null) return;
    if (lastOpenSignal.current === openSignal) return;
    lastOpenSignal.current = openSignal;
    setIsLocationOpen(true);
    setShowOtherCityWarning(false);
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof onOpenChange === 'function') onOpenChange(true);
  }, [openSignal, onOpenChange]);

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setStep('district');
    setSearchTerm('');
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    const region = ISTANBUL_REGIONS.find(r => r.id === selectedRegion);
    setSelectedLocation(`${district}, ${region?.name}`);
    setIsLocationOpen(false);
    setShowOtherCityWarning(false);
    if (typeof onOpenChange === 'function') onOpenChange(false);
    setSearchTerm('');
  };

  const handleOtherCityClick = () => {
    setShowOtherCityWarning(true);
  };

  const resetSelection = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedLocation(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setStep('region');
    setSearchTerm('');
    setShowOtherCityWarning(false);
  };

  const isComplete = selectedLocation && selectedDate && selectedTimeSlot;

  // Close all dropdowns and calendar when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
        setShowOtherCityWarning(false);
        if (typeof onOpenChange === 'function') onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    const handleCloseAll = () => {
      if (isLocationOpen || showOtherCityWarning) {
        setIsLocationOpen(false);
        setShowOtherCityWarning(false);
        if (typeof onOpenChange === 'function' && isLocationOpen) onOpenChange(false);
      }
    };
    window.addEventListener('closeAllOverlays', handleCloseAll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('closeAllOverlays', handleCloseAll);
    };
  }, [selectorRef, onOpenChange]);

  return (
    <div className="space-y-3">
      {/* Location Selector */}
      <div ref={selectorRef} className="relative">
        <button
          onClick={() => {
            const next = !isLocationOpen;
            setIsLocationOpen(next);
            setShowOtherCityWarning(false);
            if (typeof onOpenChange === 'function' && next !== isLocationOpen) onOpenChange(next);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
            selectedLocation 
              ? 'border-[#549658] bg-[#549658]/5' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <MapPin size={20} className={selectedLocation ? 'text-[#549658]' : 'text-gray-400'} />
          <span className={`flex-1 text-sm ${selectedLocation ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {selectedLocation || 'Teslimat bölgesini seçin'}
          </span>
          {selectedLocation && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                resetSelection();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  resetSelection();
                }
              }}
              className="p-1 hover:bg-gray-200 rounded-full cursor-pointer inline-flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </span>
          )}
        </button>

        {/* Helper text */}
        {!selectedLocation && !isLocationOpen && (
          <div className="text-xs text-[#e05a4c] mt-1.5 px-1 space-y-0.5">
            <p>Şu an sadece İstanbul (Avrupa) teslimat yapılmaktadır.</p>
            <p className="text-[11px] text-amber-600">Anadolu yakası çok yakında hizmete açılacak.</p>
          </div>
        )}

        {/* Location Dropdown */}
        {isLocationOpen && !selectedLocation && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={step === 'region' ? 'Bölge ara...' : 'İlçe ara...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]"
                />
              </div>
              {step === 'district' && (
                <button
                  onClick={() => {
                    setStep('region');
                    setSelectedRegion(null);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-1 text-xs text-[#e05a4c] mt-2 hover:underline"
                >
                  ← Bölge seçimine dön
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-56 overflow-y-auto">
              {step === 'region' ? (
                <>
                  {/* İstanbul Bölgeleri */}
                  <div className="p-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">İstanbul</p>
                    {filteredRegions.map((region) => {
                      const isAnadolu = region.id === 'istanbul-anadolu';
                      return (
                        <button
                          key={region.id}
                          onClick={() => {
                            if (isAnadolu) return; // disable selection
                            handleRegionSelect(region.id);
                          }}
                          disabled={isAnadolu}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            isAnadolu
                              ? 'opacity-60 cursor-not-allowed bg-gray-50'
                              : 'hover:bg-[#e05a4c]/5'
                          }`}
                        >
                          <MapPin size={14} className={isAnadolu ? 'text-gray-400' : 'text-[#e05a4c]'} />
                          <span className={`text-sm flex-1 ${isAnadolu ? 'text-gray-500' : 'text-gray-700'}`}>{region.name}</span>
                          <ChevronRight size={14} className={isAnadolu ? 'text-gray-200' : 'text-gray-300'} />
                        </button>
                      );
                    })}
                    <p className="text-[11px] text-amber-600 mt-2 px-2">Anadolu yakası çok yakında!</p>
                  </div>

                  {/* Diğer İller */}
                  {filteredOtherProvinces.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">Diğer İller</p>
                      {filteredOtherProvinces.slice(0, 5).map((province) => (
                        <button
                          key={province}
                          onClick={handleOtherCityClick}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left opacity-60"
                        >
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500 flex-1">{province}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* İlçe Seçimi */
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">
                    {currentRegion?.name} - İlçeler
                  </p>
                  {filteredDistricts.map((district) => {
                    const isDisabled = DISABLED_DISTRICTS.includes(district);
                    return (
                      <button
                        key={district}
                        onClick={() => {
                          if (isDisabled) {
                            setClosedWarning(district);
                            setTimeout(() => setClosedWarning(null), 3500);
                            return;
                          }
                          handleDistrictSelect(district);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${isDisabled ? 'opacity-60 bg-gray-50' : 'hover:bg-[#e05a4c]/5 cursor-pointer'}`}
                      >
                        <Check size={14} className={isDisabled ? 'text-gray-300' : 'text-transparent'} />
                        <span className={`text-sm ${isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>{district}</span>
                        {isDisabled && <span className="ml-auto text-xs text-rose-600">Kapalı</span>}
                      </button>
                    );
                  })}
                </div>
                {closedWarning && (
                  <div className="border-t border-gray-100">
                    <div className="p-3 bg-rose-50 flex items-start gap-2">
                      <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-rose-800 font-medium">{closedWarning} — Bu bölge geçici olarak kapalı</p>
                        <p className="text-xs text-rose-600 mt-0.5">Lütfen başka bir ilçe seçin veya daha sonra tekrar deneyin.</p>
                      </div>
                    </div>
                  </div>
                )}
              )}
            </div>

            {/* Warning for other cities */}
            {showOtherCityWarning && (
              <div className="border-t border-gray-100">
                <div className="p-3 bg-amber-50 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Şu an sadece İstanbul&apos;a teslimat yapıyoruz</p>
                    <p className="text-xs text-amber-600 mt-0.5">Çok yakında diğer illere de teslimat başlayacak!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date & Time Selector - Only show when location is selected */}
      {selectedLocation && (
        <div className="space-y-3">
          {/* Date Selector - Scrollable - Mobile optimized with 4 visible items */}
          <div>
            <div className="relative overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide snap-scroll-container" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 px-0 pb-2 min-w-max">
                  {dates.map((date, index) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(date);
                        }}
                        className={`flex flex-col items-center px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl border-2 transition-all min-w-[calc(25%-6px)] sm:min-w-[70px] flex-shrink-0 snap-scroll-item ${
                          isSelected
                            ? 'border-[#549658] bg-[#549658]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-[#549658]' : 'text-gray-500'}`}>
                          {formatDateShort(date)}
                        </span>
                        <span className={`text-[11px] sm:text-xs font-semibold ${isSelected ? 'text-[#549658]' : 'text-gray-900'}`}>
                          {getDayLabel(date)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Scroll hint for mobile */}
            <div className="text-xs text-gray-400 text-center mt-1 sm:hidden">← Sağa kaydırın →</div>
          </div>

          {/* Time Slots - Scrollable - Mobile optimized */}
          {selectedDate && (
            <div>
              <div className="relative overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 px-0 pb-2 min-w-max">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedTimeSlot(slot.id);
                          // Close all overlays immediately
                          setIsLocationOpen(false);
                          setShowOtherCityWarning(false);
                          if (typeof onOpenChange === 'function') onOpenChange(false);
                          // Remove focus from possible active elements to avoid stuck focus
                          try { (document.activeElement as HTMLElement | null)?.blur(); } catch {}
                        }}
                        className={`px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl border-2 transition-all text-[11px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          isSelected
                            ? 'border-[#549658] bg-[#549658] text-white'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Status */}
      {isComplete && (
        <div className="flex items-center gap-2 p-2.5 bg-[#549658]/10 rounded-xl border border-[#549658]/30">
          <Check size={16} className="text-[#549658]" />
          <span className="text-xs text-[#549658] font-medium">
            Teslimat bilgileri tamamlandı
          </span>
        </div>
      )}
    </div>
  );
}
