'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Calendar, Clock, ChevronDown, Check, Search } from 'lucide-react';

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

// Dinamik kapalı ilçeler
const DEFAULT_DISABLED_DISTRICTS = ['Çatalca', 'Silivri', 'Büyükçekmece'];

interface DeliveryInfo {
  location: string | null;
  district: string | null;
  date: Date | null;
  timeSlot: string | null;
}

interface DeliverySelectorV2Props {
  onDeliveryComplete: (info: DeliveryInfo) => void;
  isRequired?: boolean;
  onOpenChange?: (open: boolean) => void;
  openSignal?: number;
}

export default function DeliverySelectorV2({ 
  onDeliveryComplete, 
  isRequired = true, 
  onOpenChange, 
  openSignal 
}: DeliverySelectorV2Props) {
  // Location states
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locationStep, setLocationStep] = useState<'region' | 'district'>('region');
  const [closedWarning, setClosedWarning] = useState<string | null>(null);
  
  // Date states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarWarning, setCalendarWarning] = useState<string | null>(null);
  
  // Time states
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const lastOpenSignal = useRef<number | null>(null);
  const [disabledDistricts, setDisabledDistricts] = useState<string[]>(DEFAULT_DISABLED_DISTRICTS);

  // Time slots - 2 options like cart page
  const timeSlots = [
    { id: '11-17', label: '11:00 - 17:00', shortLabel: '11-17' },
    { id: '17-22', label: '17:00 - 22:00', shortLabel: '17-22' },
  ];

  // Generate dates for quick selection
  const generateQuickDates = () => {
    const dates = [];
    const today = new Date();
    
    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    dates.push({ date: tomorrow, label: 'Yarın', isSpecial: false });
    
    // Day after tomorrow
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    dates.push({ date: dayAfter, label: dayNames[dayAfter.getDay()], isSpecial: false });
    
    // Check for special days (e.g., New Year)
    const newYear = new Date(today.getFullYear() + 1, 0, 1);
    if (newYear.getTime() - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
      dates.push({ date: newYear, label: 'Yeni Yıl', isSpecial: true });
    }
    
    return dates;
  };

  const quickDates = generateQuickDates();

  // Format date
  const formatDateShort = (date: Date) => {
    const day = date.getDate();
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${day} ${months[date.getMonth()]}`;
  };

  const formatDateFull = (date: Date) => {
    const day = date.getDate();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `${day} ${months[date.getMonth()]} ${days[date.getDay()]}`;
  };

  // Filter regions and districts
  const currentRegion = ISTANBUL_REGIONS.find(r => r.id === selectedRegion);
  
  const filteredRegions = ISTANBUL_REGIONS.filter(r =>
    r.name.toLowerCase().includes(locationSearchTerm.toLowerCase())
  );
  
  const filteredDistricts = currentRegion?.districts.filter(d =>
    d.toLowerCase().includes(locationSearchTerm.toLowerCase())
  ) || [];

  // All districts for search across regions
  const allDistricts = ISTANBUL_REGIONS.flatMap(r => 
    r.districts.map(d => ({ district: d, region: r }))
  ).filter(item => 
    item.district.toLowerCase().includes(locationSearchTerm.toLowerCase())
  );

  // Notify parent when delivery info changes
  useEffect(() => {
    onDeliveryComplete({
      location: selectedLocation,
      district: selectedDistrict,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });
  }, [selectedLocation, selectedDistrict, selectedDate, selectedTimeSlot]);

  // Load dynamic delivery settings (disabled districts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/settings?category=delivery', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = await res.json();
        const cat = payload?.settings || payload?.category?.settings || {};
        const dd = Array.isArray(cat?.disabled_districts) ? (cat.disabled_districts as string[]) : DEFAULT_DISABLED_DISTRICTS;
        if (mounted) setDisabledDistricts(dd);
      } catch {
        // keep defaults
      }
    })();
    return () => { mounted = false; };
  }, []);

  // External trigger to open location selector
  useEffect(() => {
    if (openSignal == null) return;
    if (lastOpenSignal.current === openSignal) return;
    lastOpenSignal.current = openSignal;
    setIsLocationDropdownOpen(true);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof onOpenChange === 'function') onOpenChange(true);
  }, [openSignal, onOpenChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
        setIsCalendarOpen(false);
        if (typeof onOpenChange === 'function') onOpenChange(false);
      }
    };

    const handleCloseAll = () => {
      setIsLocationDropdownOpen(false);
      setIsCalendarOpen(false);
      if (typeof onOpenChange === 'function') onOpenChange(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('closeAllOverlays', handleCloseAll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('closeAllOverlays', handleCloseAll);
    };
  }, [onOpenChange]);

  // Handlers
  const handleRegionSelect = (regionId: string) => {
    if (regionId === 'istanbul-anadolu') return; // Disabled
    setSelectedRegion(regionId);
    setLocationStep('district');
    setLocationSearchTerm('');
  };

  const handleDistrictSelect = (district: string, regionId?: string) => {
    if (disabledDistricts.includes(district)) return; // geçici olarak engellendi
    const region = regionId 
      ? ISTANBUL_REGIONS.find(r => r.id === regionId)
      : currentRegion;
    
    if (region?.id === 'istanbul-anadolu') return; // Disabled
    
    setSelectedRegion(region?.id || null);
    setSelectedDistrict(district);
    setSelectedLocation(`${district}, ${region?.name}`);
    setIsLocationDropdownOpen(false);
    setLocationSearchTerm('');
    if (typeof onOpenChange === 'function') onOpenChange(false);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handleTimeSelect = (timeSlotId: string) => {
    setSelectedTimeSlot(timeSlotId);
  };

  const resetLocation = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setSelectedLocation(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setLocationStep('region');
    setLocationSearchTerm('');
  };

  // Calendar helpers
  const generateCalendarDays = useCallback(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before first day of month
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [calendarMonth]);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7); // Sadece 1 hafta
    return date < today || date > maxDate;
  };

  // Takvimde geçersiz güne tıklama handlerı
  const handleCalendarDayClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);
    
    if (date < today) {
      setCalendarWarning('Geçmiş tarih seçilemez');
      setTimeout(() => setCalendarWarning(null), 2500);
      return;
    }
    
    if (date > maxDate) {
      setCalendarWarning('Sadece 1 hafta içindeki tarihler seçilebilir');
      setTimeout(() => setCalendarWarning(null), 2500);
      return;
    }
    
    handleDateSelect(date);
  };

  const isComplete = selectedLocation && selectedDate && selectedTimeSlot;

  return (
    <div ref={containerRef} className="w-full space-y-4 relative z-[20000]">
      {/* ========== LOCATION SELECTOR ========== */}
      <div className="relative z-[20000]">
        <div 
          className={`
            flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer
            ${selectedLocation 
              ? 'border-[#549658] bg-[#549658]/5' 
              : isLocationDropdownOpen 
                ? 'border-[#e05a4c] bg-white shadow-lg' 
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }
          `}
          onClick={() => {
            if (!selectedLocation) {
              setIsLocationDropdownOpen(!isLocationDropdownOpen);
              if (typeof onOpenChange === 'function') onOpenChange(!isLocationDropdownOpen);
            }
          }}
        >
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-xl
            ${selectedLocation ? 'bg-[#549658]/10' : 'bg-white'}
          `}>
            <MapPin size={20} className={selectedLocation ? 'text-[#549658]' : 'text-gray-400'} />
          </div>
          
          {selectedLocation ? (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Teslimat Adresi</p>
              <p className="text-sm font-medium text-gray-900 truncate">{selectedLocation}</p>
            </div>
          ) : (
            <div className="flex-1">
              {/* Use a div instead of input to prevent mobile keyboard from opening */}
              <div
                className="w-full text-sm text-gray-400 cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocationDropdownOpen(true);
                  if (typeof onOpenChange === 'function') onOpenChange(true);
                }}
              >
                İlçe veya bölge seçin...
              </div>
            </div>
          )}
          
          {selectedLocation ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetLocation();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          ) : (
            <ChevronDown 
              size={18} 
              className={`text-gray-400 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} 
            />
          )}
        </div>

        {/* Location Dropdown */}
        {isLocationDropdownOpen && !selectedLocation && (
          <div 
            ref={locationDropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-[20000] overflow-hidden max-h-[350px] flex flex-col"
          >
            {/* Search Input inside dropdown */}
            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="İlçe ara..."
                  value={locationSearchTerm}
                  onChange={(e) => setLocationSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                  autoComplete="off"
                />
                {locationSearchTerm && (
                  <button 
                    onClick={() => setLocationSearchTerm('')}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
            {/* Show search results if searching */}
            {locationSearchTerm.length >= 2 ? (
              <div className="p-2">
                {allDistricts.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-400 px-3 py-2 uppercase tracking-wider">Bulunan İlçeler</p>
                    {allDistricts.slice(0, 10).map((item, index) => {
                      const isAnadolu = item.region.id === 'istanbul-anadolu';
                      const isDisabled = disabledDistricts.includes(item.district);
                      const showDisabled = isAnadolu || isDisabled;
                      return (
                        <button
                          key={`${item.region.id}-${item.district}-${index}`}
                          onClick={() => {
                            if (showDisabled) {
                              setClosedWarning(item.district);
                              setTimeout(() => setClosedWarning(null), 3500);
                              return;
                            }
                            handleDistrictSelect(item.district, item.region.id);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left
                            ${showDisabled 
                              ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                              : 'hover:bg-[#549658]/5 active:bg-[#549658]/10'
                            }
                          `}
                        >
                          <MapPin size={16} className={showDisabled ? 'text-gray-300' : 'text-[#549658]'} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.district}</p>
                            <p className="text-xs text-gray-400">{item.region.name}</p>
                          </div>
                          {isAnadolu && <span className="text-xs text-amber-600">Yakında</span>}
                          {isDisabled && !isAnadolu && <span className="text-xs text-rose-600">Kapalı</span>}
                        </button>
                      );
                    })}
                    {closedWarning && (
                      <div className="p-3">
                        <div className="p-3 bg-rose-50 flex items-start gap-2 rounded-lg">
                          <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-rose-800 font-medium">{closedWarning} — Bu bölge geçici olarak kapalı</p>
                            <p className="text-xs text-rose-600 mt-0.5">Lütfen başka bir ilçe seçin veya daha sonra tekrar deneyin.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            ) : locationStep === 'region' ? (
              /* Region Selection */
              <div className="p-2">
                <p className="text-xs text-gray-400 px-3 py-2 uppercase tracking-wider">Bölge Seçin</p>
                {filteredRegions.map((region) => {
                  const isAnadolu = region.id === 'istanbul-anadolu';
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleRegionSelect(region.id)}
                      disabled={isAnadolu}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left
                        ${isAnadolu 
                          ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                          : 'hover:bg-[#549658]/5 active:bg-[#549658]/10'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${isAnadolu ? 'bg-gray-100' : 'bg-[#549658]/10'}
                      `}>
                        <MapPin size={18} className={isAnadolu ? 'text-gray-400' : 'text-[#549658]'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isAnadolu ? 'text-gray-400' : 'text-gray-800'}`}>
                          {region.name}
                        </p>
                        <p className="text-xs text-gray-400">{region.districts.length} ilçe</p>
                      </div>
                      {isAnadolu ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Yakında</span>
                      ) : (
                        <ChevronDown size={16} className="text-gray-400 -rotate-90" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* District Selection */
              <div className="p-2">
                <button
                  onClick={() => {
                    setLocationStep('region');
                    setSelectedRegion(null);
                    setLocationSearchTerm('');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#e05a4c] hover:underline"
                >
                  ← Bölge seçimine dön
                </button>
                <p className="text-xs text-gray-400 px-3 py-2 uppercase tracking-wider">
                  {currentRegion?.name} - İlçeler
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {filteredDistricts.map((district) => {
                    const isDisabled = disabledDistricts.includes(district);
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
                        className={`px-3 py-2.5 text-sm rounded-xl transition-colors text-left ${isDisabled ? 'text-gray-400 opacity-60 bg-gray-50' : 'text-gray-700 hover:bg-[#549658]/5 active:bg-[#549658]/10 cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{district}</span>
                          {isDisabled && <span className="text-xs text-rose-600">Kapalı</span>}
                        </div>
                      </button>
                    );
                  })}
                  {closedWarning && (
                    <div className="p-3">
                      <div className="p-3 bg-rose-50 flex items-start gap-2 rounded-lg">
                        <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-rose-800 font-medium">{closedWarning} — Bu bölge geçici olarak kapalı</p>
                          <p className="text-xs text-rose-600 mt-0.5">Lütfen başka bir ilçe seçin veya daha sonra tekrar deneyin.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Helper text when no location selected */}
        {!selectedLocation && !isLocationDropdownOpen && (
          <p className="text-xs text-[#e05a4c] mt-2 px-1">
            Şu an sadece İstanbul (Avrupa) teslimat yapılmaktadır.
          </p>
        )}
      </div>

      {/* ========== DATE SELECTOR ========== */}
      {selectedLocation && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
            Teslimat Tarihi
          </p>
          
          <div className="grid grid-cols-4 gap-2">
            {quickDates.map((item, index) => {
              const isSelected = selectedDate?.toDateString() === item.date.toDateString();
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(item.date)}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all
                    ${isSelected 
                      ? 'border-[#549658] bg-[#549658] text-white' 
                      : item.isSpecial
                        ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {formatDateShort(item.date)}
                  </span>
                  <span className={`text-xs font-semibold mt-0.5 ${
                    isSelected ? 'text-white' : item.isSpecial ? 'text-amber-700' : 'text-gray-800'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            
            {/* Calendar button */}
            <div className="relative">
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`
                  w-full flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all
                  ${selectedDate && !quickDates.some(q => q.date.toDateString() === selectedDate.toDateString())
                    ? 'border-[#549658] bg-[#549658] text-white'
                    : isCalendarOpen
                      ? 'border-[#e05a4c] bg-[#e05a4c]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                {selectedDate && !quickDates.some(q => q.date.toDateString() === selectedDate.toDateString()) ? (
                  <>
                    <span className="text-[10px] text-white/80">{formatDateShort(selectedDate)}</span>
                    <span className="text-xs font-semibold mt-0.5 text-white">Seçildi</span>
                  </>
                ) : (
                  <>
                    <Calendar size={16} className={isCalendarOpen ? 'text-[#e05a4c]' : 'text-gray-400'} />
                    <span className={`text-xs font-semibold mt-1 ${isCalendarOpen ? 'text-[#e05a4c]' : 'text-gray-600'}`}>
                      Takvim
                    </span>
                  </>
                )}
              </button>

              {/* Calendar Dropdown */}
              {isCalendarOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-[20000] p-4 w-[280px]">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const prev = new Date(calendarMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarMonth(prev);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      ←
                    </button>
                    <span className="text-sm font-medium text-gray-800">
                      {calendarMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => {
                        const next = new Date(calendarMonth);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarMonth(next);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      →
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="w-8 h-8" />;
                      }
                      
                      const isDisabled = isDateDisabled(date);
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleCalendarDayClick(date)}
                          className={`
                            w-8 h-8 rounded-lg text-sm transition-colors
                            ${isDisabled 
                              ? 'text-gray-300 opacity-40 cursor-not-allowed' 
                              : isSelected
                                ? 'bg-[#549658] text-white font-bold'
                                : isToday
                                  ? 'bg-amber-100 text-amber-700 font-bold hover:bg-amber-200'
                                  : 'text-gray-800 font-medium hover:bg-gray-100'
                            }
                          `}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Warning */}
                  {calendarWarning && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 text-center font-medium">
                        ⚠️ {calendarWarning}
                      </p>
                    </div>
                  )}

                  {/* Info text */}
                  <p className="text-xs text-gray-400 text-center mt-3">
                    Sadece 1 hafta içindeki tarihler seçilebilir
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== TIME SELECTOR ========== */}
      {selectedLocation && selectedDate && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
            Teslimat Saati
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              const isSelected = selectedTimeSlot === slot.id;
              return (
                <label
                  key={slot.id}
                  className={`
                    flex items-center justify-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-[#549658] bg-[#549658]/5' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.id}
                    checked={isSelected}
                    onChange={() => handleTimeSelect(slot.id)}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${isSelected 
                      ? 'border-[#549658] bg-[#549658]' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className={isSelected ? 'text-[#549658]' : 'text-gray-400'} />
                    <span className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-[#549658]' : 'text-gray-700'}`}>
                      {slot.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== COMPLETION STATUS ========== */}
      {isComplete && (
        <div className="flex items-center gap-3 p-3 bg-[#549658]/10 rounded-2xl border border-[#549658]/30">
          <div className="w-8 h-8 rounded-full bg-[#549658] flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#549658]">Teslimat Bilgileri Hazır</p>
            <p className="text-xs text-gray-500">
              {selectedDistrict} • {selectedDate && formatDateFull(selectedDate)} • {timeSlots.find(t => t.id === selectedTimeSlot)?.label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
