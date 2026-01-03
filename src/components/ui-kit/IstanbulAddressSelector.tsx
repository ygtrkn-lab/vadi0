'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineLocationMarker, 
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineSearch
} from 'react-icons/hi';
import { 
  YAKA_OPTIONS, 
  getDistrictsBySide, 
  IstanbulDistrict 
} from '@/data/istanbul-districts';

interface IstanbulAddressSelectorProps {
  selectedSide: 'anadolu' | 'avrupa' | '';
  selectedDistrict: string;
  selectedNeighborhood: string;
  onSideChange: (side: 'anadolu' | 'avrupa') => void;
  onDistrictChange: (district: string, districtId: number) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

// Modern Dropdown Component
interface DropdownOption {
  id: string | number;
  name: string;
  icon?: string;
  description?: string;
}

interface ModernDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string, id: string | number) => void;
  placeholder: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  showSearch?: boolean;
  accentColor?: string;
}

const ModernDropdown: React.FC<ModernDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  icon,
  showSearch = false,
  accentColor = '#e05a4c'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.name === value || opt.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-3.5
          bg-white border-2 rounded-2xl text-sm font-medium
          transition-all duration-300 ease-out group
          ${disabled 
            ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' 
            : isOpen 
              ? 'border-[#e05a4c] shadow-xl shadow-[#e05a4c]/10 ring-4 ring-[#e05a4c]/5' 
              : 'border-gray-200 hover:border-[#e05a4c]/50 hover:shadow-lg text-gray-700'
          }
        `}
      >
        <span className="flex items-center gap-3">
          {icon && (
            <span className={`transition-colors ${isOpen ? 'text-[#e05a4c]' : 'text-gray-400 group-hover:text-[#e05a4c]'}`}>
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="text-lg">{selectedOption.icon}</span>
          )}
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.name || placeholder}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`transition-colors ${isOpen ? 'text-[#e05a4c]' : 'text-gray-400'}`}
        >
          <HiOutlineChevronDown className="w-5 h-5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
          >
            {showSearch && options.length > 8 && (
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ara..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Sonuç bulunamadı
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.name, option.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-sm text-left
                      transition-all duration-150
                      ${value === option.name 
                        ? 'bg-gradient-to-r from-[#e05a4c]/10 to-transparent text-[#e05a4c] font-semibold' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-3">
                      {option.icon && <span className="text-lg">{option.icon}</span>}
                      <span>{option.name}</span>
                      {option.description && (
                        <span className="text-xs text-gray-400">{option.description}</span>
                      )}
                    </span>
                    {value === option.name && (
                      <HiOutlineCheck className="w-5 h-5 text-[#e05a4c]" />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function IstanbulAddressSelector({
  selectedSide,
  selectedDistrict,
  selectedNeighborhood,
  onSideChange,
  onDistrictChange,
  onNeighborhoodChange,
  className = '',
  disabled = false,
  compact = false
}: IstanbulAddressSelectorProps) {
  const [districts, setDistricts] = useState<IstanbulDistrict[]>([]);

  // Yaka değiştiğinde ilçeleri güncelle
  useEffect(() => {
    if (selectedSide) {
      setDistricts(getDistrictsBySide(selectedSide));
    } else {
      setDistricts([]);
    }
  }, [selectedSide]);

  const handleSideChange = (name: string, id: string | number) => {
    onSideChange(id as 'anadolu' | 'avrupa');
    onDistrictChange('', 0);
    onNeighborhoodChange('');
  };

  const handleDistrictChange = (name: string, id: string | number) => {
    onDistrictChange(name, id as number);
    onNeighborhoodChange('');
  };

  const yakaOptions = YAKA_OPTIONS.map(y => ({
    id: y.id,
    name: y.name,
    icon: y.icon
  }));

  const districtOptions = districts.map(d => ({
    id: d.id,
    name: d.name
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Teslimat Bilgisi */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#e05a4c]/5 to-[#549658]/5 rounded-xl border border-[#e05a4c]/10">
        <span className="text-lg">🚚</span>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">Vadiler Çiçekçilik</span> sadece{' '}
          <span className="font-semibold text-[#e05a4c]">İstanbul</span> genelinde teslimat yapmaktadır.
        </p>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
        {/* Yaka Seçimi */}
        <ModernDropdown
          label="Yaka"
          value={selectedSide === 'anadolu' ? 'Anadolu Yakası' : selectedSide === 'avrupa' ? 'Avrupa Yakası' : ''}
          options={yakaOptions}
          onChange={handleSideChange}
          placeholder="Yaka seçiniz"
          disabled={disabled}
          icon={<HiOutlineLocationMarker className="w-5 h-5" />}
        />

        {/* İlçe Seçimi */}
        <ModernDropdown
          label="İlçe"
          value={selectedDistrict}
          options={districtOptions}
          onChange={handleDistrictChange}
          placeholder="İlçe seçiniz"
          disabled={disabled || !selectedSide}
          showSearch
        />

        {/* Mahalle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Mahalle
          </label>
          <input
            type="text"
            value={selectedNeighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            placeholder="Mahalle adını yazınız"
            disabled={disabled || !selectedDistrict}
            className={`
              w-full px-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-medium
              transition-all duration-300
              ${disabled || !selectedDistrict
                ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                : 'border-gray-200 hover:border-[#e05a4c]/50 focus:border-[#e05a4c] focus:ring-4 focus:ring-[#e05a4c]/5 focus:outline-none'
              }
            `}
          />
        </div>
      </div>
    </div>
  );
}

// Kompakt versiyon export
export function CompactIstanbulSelector(props: Omit<IstanbulAddressSelectorProps, 'compact'>) {
  return <IstanbulAddressSelector {...props} compact />;
}
