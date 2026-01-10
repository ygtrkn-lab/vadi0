'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineSave, HiOutlineRefresh, HiOutlineSearch, HiOutlineLocationMarker } from 'react-icons/hi';
import { ISTANBUL_ILCELERI, ANADOLU_ILCELERI, AVRUPA_ILCELERI, type IstanbulDistrict } from '@/data/istanbul-districts';
import { getDistricts, getNeighborhoods, type District, type Neighborhood } from '@/data/turkiye-api';

type DisabledMap = Record<string, string[]>; // districtName -> disabled neighborhoods

export default function BolgeKapatmaPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [disabledDistricts, setDisabledDistricts] = useState<string[]>([]);
  const [disabledNeighborhoods, setDisabledNeighborhoods] = useState<DisabledMap>({});
  const [isAnadoluClosed, setIsAnadoluClosed] = useState(true);

  const [istanbulDistricts, setIstanbulDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Arnavutköy');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [searchNeighborhood, setSearchNeighborhood] = useState('');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const districtDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedSide, setSelectedSide] = useState<'avrupa' | 'anadolu'>('avrupa');

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(e.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Load current settings
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/settings?category=delivery', { cache: 'no-store' });
        const payload = await res.json();
        if (!mounted) return;
        const cat = payload?.settings || payload?.category?.settings || {};
        const dd = Array.isArray(cat?.disabled_districts) ? cat.disabled_districts as string[] : [];
        const dmap = typeof cat?.disabled_neighborhoods_by_district === 'object' && cat?.disabled_neighborhoods_by_district !== null
          ? (cat.disabled_neighborhoods_by_district as DisabledMap)
          : {};
        const anadolu = typeof cat?.is_anadolu_closed === 'boolean' ? !!cat.is_anadolu_closed : true;
        setDisabledDistricts(dd);
        setDisabledNeighborhoods(dmap);
        setIsAnadoluClosed(anadolu);
      } catch (err) {
        if (!mounted) return;
        setLoadError('Ayarlar yüklenemedi. Lütfen tekrar deneyin.');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load Istanbul districts with IDs and neighborhoods for selected district
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const districts = await getDistricts(34); // İstanbul provinceId = 34
        if (!mounted) return;
        setIstanbulDistricts(districts);
        const match = districts.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
        if (match) {
          const nh = await getNeighborhoods(match.id);
          if (!mounted) return;
          setNeighborhoods(nh);
        } else {
          setNeighborhoods([]);
        }
      } catch (err) {
        if (!mounted) return;
        // Fail silently, allow manual entry
      }
    })();
    return () => { mounted = false; };
  }, [selectedDistrict]);

  const filteredNeighborhoods = useMemo(() => {
    const q = searchNeighborhood.trim().toLowerCase();
    return neighborhoods.filter(n => !q || n.name.toLowerCase().includes(q));
  }, [neighborhoods, searchNeighborhood]);

  const currentDisabledNeighborhoods = useMemo(() => disabledNeighborhoods[selectedDistrict] || [], [disabledNeighborhoods, selectedDistrict]);

  const toggleDistrict = (name: string) => {
    setDisabledDistricts(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);
  };

  const toggleNeighborhood = (name: string) => {
    setDisabledNeighborhoods(prev => {
      const list = prev[selectedDistrict] || [];
      const next = list.includes(name) ? list.filter(n => n !== name) : [...list, name];
      return { ...prev, [selectedDistrict]: next };
    });
  };

  // Side-based district lists (dynamic via Türkiye API mapped to side definitions)
  const avrupaNames = useMemo(() => new Set(AVRUPA_ILCELERI.map(d => d.name)), []);
  const anadoluNames = useMemo(() => new Set(ANADOLU_ILCELERI.map(d => d.name)), []);
  const avrupaDistricts = useMemo(() => istanbulDistricts.filter(d => avrupaNames.has(d.name)), [istanbulDistricts, avrupaNames]);
  const anadoluDistricts = useMemo(() => istanbulDistricts.filter(d => anadoluNames.has(d.name)), [istanbulDistricts, anadoluNames]);

  // Ensure selectedSide stays in sync with selectedDistrict
  useEffect(() => {
    if (avrupaNames.has(selectedDistrict)) setSelectedSide('avrupa');
    else if (anadoluNames.has(selectedDistrict)) setSelectedSide('anadolu');
  }, [selectedDistrict, avrupaNames, anadoluNames]);

  // Ensure selectedDistrict is valid for current side
  useEffect(() => {
    const list = selectedSide === 'avrupa' ? avrupaDistricts : anadoluDistricts;
    const fallback = selectedSide === 'avrupa' ? (AVRUPA_ILCELERI[0]?.name) : (ANADOLU_ILCELERI[0]?.name);
    if (!list.some(d => d.name === selectedDistrict)) {
      setSelectedDistrict(list[0]?.name || fallback || selectedDistrict);
    }
  }, [selectedSide, avrupaDistricts, anadoluDistricts]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'delivery',
          updates: {
            is_anadolu_closed: isAnadoluClosed,
            disabled_districts: disabledDistricts,
            disabled_neighborhoods_by_district: disabledNeighborhoods,
          },
        }),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      // Clear cache
      await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'delivery' }) });
      setSaveSuccess('Ayarlar kaydedildi.');
    } catch (err) {
      setSaveError('Ayarlar kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Bölge Kapatma</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : ''} bg-purple-600 text-white hover:bg-purple-700`}
          >
            <span className="inline-flex items-center gap-2"><HiOutlineSave className="w-4 h-4" /> Kaydet</span>
          </button>
        </div>
      </div>

      {(loadError || saveError || saveSuccess) && (
        <div className="mb-4">
          {loadError && <div className="px-4 py-2 rounded-lg bg-rose-100 text-rose-800 text-sm">{loadError}</div>}
          {saveError && <div className="px-4 py-2 rounded-lg bg-rose-100 text-rose-800 text-sm">{saveError}</div>}
          {saveSuccess && <div className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm">{saveSuccess}</div>}
        </div>
      )}

      {/* Side selector band + Anadolu kapatma toggle */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-2xl border backdrop-blur-xl bg-white/3 border-white/8">
          <button
            className={`px-4 py-2 rounded-xl text-sm ${selectedSide === 'avrupa' ? 'bg-white/20' : ''}`}
            onClick={() => setSelectedSide('avrupa')}
          >
            Avrupa Yakası
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-sm ${selectedSide === 'anadolu' ? 'bg-white/20' : ''}`}
            onClick={() => setSelectedSide('anadolu')}
          >
            Anadolu Yakası
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-xl bg-white/3 border-white/8">
          <div className="text-sm">
            <p className="font-medium">Anadolu Yakası</p>
            <p className="text-xs text-gray-500">Kapalı/açık durumu</p>
          </div>
          <button
            onClick={() => setIsAnadoluClosed(v => !v)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isAnadoluClosed ? 'bg-rose-500/80' : 'bg-emerald-500/80'}`}
            aria-pressed={isAnadoluClosed}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${isAnadoluClosed ? 'translate-x-1' : 'translate-x-7'}`}/>
            <span className="sr-only">{isAnadoluClosed ? 'Kapalı' : 'Açık'}</span>
          </button>
          <span className={`text-xs font-semibold ${isAnadoluClosed ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isAnadoluClosed ? 'Kapalı' : 'Açık'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İlçe Kapatma - Selected side only */}
        <div className="p-4 rounded-2xl border backdrop-blur-xl bg-white/3 border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">İlçe Kapatma — {selectedSide === 'avrupa' ? 'Avrupa' : 'Anadolu'}</h2>
            <button
              onClick={() => setDisabledDistricts(prev => prev.filter(name => !(selectedSide === 'avrupa' ? avrupaNames : anadoluNames).has(name)))}
              className="px-3 py-1.5 rounded-lg text-xs bg-black/5 hover:bg-black/10"
            >
              Temizle
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {((selectedSide === 'avrupa' ? avrupaDistricts : anadoluDistricts).length
              ? (selectedSide === 'avrupa' ? avrupaDistricts : anadoluDistricts)
              : (selectedSide === 'avrupa' ? AVRUPA_ILCELERI : ANADOLU_ILCELERI)).map((d: any) => {
              const isDisabled = disabledDistricts.includes(d.name);
              return (
                <button
                  key={d.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                    isDisabled ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => toggleDistrict(d.name)}
                >
                  <span>{d.name}</span>
                  {isDisabled ? <HiOutlineX className="w-4 h-4" /> : <HiOutlineCheck className="w-4 h-4 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mahalle Kapatma */}
        <div className="p-4 rounded-2xl border backdrop-blur-xl bg-white/3 border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Mahalle Kapatma</h2>
            <div className="flex items-center gap-2">
              {/* Custom District Dropdown */}
              <div className="relative" ref={districtDropdownRef}>
                <button
                  onClick={() => setDistrictDropdownOpen(v => !v)}
                  className="px-3 py-2 rounded-xl border bg-white/5 border-white/10 text-sm min-w-[220px] flex items-center justify-between hover:bg-white/10"
                  aria-haspopup="listbox"
                  aria-expanded={districtDropdownOpen}
                >
                  <span className="truncate">{selectedDistrict}</span>
                  <svg className="w-4 h-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.854a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                </button>
                {districtDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-[280px] rounded-2xl border bg-white/90 backdrop-blur-xl text-gray-900 shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={districtSearch}
                          onChange={(e) => setDistrictSearch(e.target.value)}
                          placeholder="İlçe ara..."
                          className="pl-9 pr-3 py-2 rounded-xl border bg-white/70 border-gray-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-200"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {(selectedSide === 'avrupa' ? AVRUPA_ILCELERI : ANADOLU_ILCELERI)
                        .filter(d => !districtSearch || d.name.toLowerCase().includes(districtSearch.toLowerCase()))
                        .map((d) => {
                        const isActive = d.name === selectedDistrict;
                        const isClosed = disabledDistricts.includes(d.name);
                        return (
                          <button
                            key={d.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                              isActive ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => { setSelectedDistrict(d.name); setDistrictDropdownOpen(false); setSelectedSide(selectedSide); }}
                            role="option"
                            aria-selected={isActive}
                          >
                            <span className="flex-1 truncate">{d.name}</span>
                            {isClosed && <span className="text-xs text-rose-600">Kapalı</span>}
                            {isActive && <HiOutlineCheck className="w-4 h-4 text-purple-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchNeighborhood}
                  onChange={(e) => setSearchNeighborhood(e.target.value)}
                  placeholder="Mahalle ara..."
                  className="pl-9 pr-3 py-2 rounded-xl border bg-white/5 border-white/10 text-sm w-56"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto">
            {filteredNeighborhoods.map(n => {
              const isDisabled = currentDisabledNeighborhoods.includes(n.name);
              return (
                <button
                  key={n.id}
                  onClick={() => toggleNeighborhood(n.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors ${
                    isDisabled ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>{n.name}</span>
                  {isDisabled ? <HiOutlineX className="w-4 h-4" /> : <HiOutlineCheck className="w-4 h-4 opacity-50" />}
                </button>
              );
            })}
            {filteredNeighborhoods.length === 0 && (
              <div className="col-span-2 text-sm text-gray-500 px-2 py-6">Seçilen ilçe için mahalle bulunamadı.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
