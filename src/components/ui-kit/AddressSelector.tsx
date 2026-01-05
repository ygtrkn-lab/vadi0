'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineLocationMarker, 
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineX
} from 'react-icons/hi';
import { PROVINCES, getDistricts, getNeighborhoods, District, Neighborhood } from '@/data/turkiye-api';

interface AddressSelectorProps {
  selectedProvince: string;
  selectedDistrict: string;
  selectedNeighborhood: string;
  onProvinceChange: (province: string, provinceId: number) => void;
  onDistrictChange: (district: string, districtId: number) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

interface DropdownProps {
  label: string;
  value: string;
  options: { id: number; name: string }[];
  onChange: (name: string, id: number) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
}

const ModernDropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  loading = false,
  disabled = false,
  searchable = true,
  icon
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

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3
          bg-gradient-to-br from-gray-50 to-white
          border-2 rounded-xl text-sm font-medium
          transition-all duration-200 ease-out
          ${disabled 
            ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
            : isOpen 
              ? 'border-[#e05a4c] shadow-lg shadow-[#e05a4c]/10 ring-4 ring-[#e05a4c]/5' 
              : 'border-gray-200 hover:border-[#e05a4c]/50 hover:shadow-md text-gray-700'
          }
        `}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-[#e05a4c]">{icon}</span>}
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {loading ? 'Yükleniyor...' : value || placeholder}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <HiOutlineChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#e05a4c]' : 'text-gray-400'}`} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-gray-100 shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            {searchable && options.length > 5 && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ara..."
                    className="w-full pl-9 pr-8 py-2 text-base bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c]/20 focus:border-[#e05a4c]"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  {search ? 'Sonuç bulunamadı' : 'Seçenek yok'}
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
                      transition-colors duration-150
                      ${value === option.name 
                        ? 'bg-[#e05a4c]/10 text-[#e05a4c] font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span>{option.name}</span>
                    {value === option.name && (
                      <HiOutlineCheck className="w-4 h-4 text-[#e05a4c]" />
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

export default function AddressSelector({
  selectedProvince,
  selectedDistrict,
  selectedNeighborhood,
  onProvinceChange,
  onDistrictChange,
  onNeighborhoodChange,
  className = '',
  disabled = false,
  compact = false
}: AddressSelectorProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

  // İl değiştiğinde ilçeleri getir
  useEffect(() => {
    if (selectedProvinceId) {
      setLoadingDistricts(true);
      getDistricts(selectedProvinceId)
        .then(data => {
          setDistricts(data);
          setNeighborhoods([]);
        })
        .catch(console.error)
        .finally(() => setLoadingDistricts(false));
    }
  }, [selectedProvinceId]);

  // İlçe değiştiğinde mahalleleri getir
  useEffect(() => {
    if (selectedDistrictId) {
      setLoadingNeighborhoods(true);
      getNeighborhoods(selectedDistrictId)
        .then(data => setNeighborhoods(data))
        .catch(console.error)
        .finally(() => setLoadingNeighborhoods(false));
    }
  }, [selectedDistrictId]);

  const handleProvinceChange = (name: string, id: number) => {
    setSelectedProvinceId(id);
    setSelectedDistrictId(null);
    setDistricts([]);
    setNeighborhoods([]);
    onProvinceChange(name, id);
    onDistrictChange('', 0);
    onNeighborhoodChange('');
  };

  const handleDistrictChange = (name: string, id: number) => {
    setSelectedDistrictId(id);
    setNeighborhoods([]);
    onDistrictChange(name, id);
    onNeighborhoodChange('');
  };

  const provinceOptions = PROVINCES.map(p => ({ id: p.id, name: p.name }));
  const districtOptions = districts.map(d => ({ id: d.id, name: d.name }));
  const neighborhoodOptions = neighborhoods.map(n => ({ id: n.id, name: n.name }));

  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'} ${className}`}>
      <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-3 gap-4'}`}>
        <ModernDropdown
          label="İl"
          value={selectedProvince}
          options={provinceOptions}
          onChange={handleProvinceChange}
          placeholder="İl seçiniz"
          disabled={disabled}
          icon={<HiOutlineLocationMarker className="w-4 h-4" />}
        />

        <ModernDropdown
          label="İlçe"
          value={selectedDistrict}
          options={districtOptions}
          onChange={handleDistrictChange}
          placeholder="İlçe seçiniz"
          loading={loadingDistricts}
          disabled={disabled || !selectedProvince}
        />

        <ModernDropdown
          label="Mahalle"
          value={selectedNeighborhood}
          options={neighborhoodOptions}
          onChange={(name) => onNeighborhoodChange(name)}
          placeholder="Mahalle seçiniz"
          loading={loadingNeighborhoods}
          disabled={disabled || !selectedDistrict}
        />
      </div>
    </div>
  );
}

// Kompakt versiyon - Modal ve küçük alanlarda kullanım için
export function CompactAddressSelector(props: Omit<AddressSelectorProps, 'compact'>) {
  return <AddressSelector {...props} compact />;
}
