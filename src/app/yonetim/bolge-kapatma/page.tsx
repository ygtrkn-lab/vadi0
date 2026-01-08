'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineSave, HiOutlineRefresh, HiOutlineSearch, HiOutlineLocationMarker } from 'react-icons/hi';
import { ISTANBUL_ILCELERI, type IstanbulDistrict } from '@/data/istanbul-districts';
import { getDistricts, getNeighborhoods, type District, type Neighborhood } from '@/data/turkiye-api';

type DisabledMap = Record<string, string[]>; // districtName -> disabled neighborhoods

export default function BolgeKapatmaPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [disabledDistricts, setDisabledDistricts] = useState<string[]>([]);
  const [disabledNeighborhoods, setDisabledNeighborhoods] = useState<DisabledMap>({});

  const [istanbulDistricts, setIstanbulDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Arnavutköy');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [searchNeighborhood, setSearchNeighborhood] = useState('');

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
        setDisabledDistricts(dd);
        setDisabledNeighborhoods(dmap);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İlçe Kapatma */}
        <div className="p-4 rounded-2xl border backdrop-blur-xl bg-white/3 border-white/8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">İlçe Kapatma</h2>
            <button
              onClick={() => setDisabledDistricts([])}
              className="px-3 py-1.5 rounded-lg text-xs bg-black/5 hover:bg-black/10"
            >
              Temizle
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISTANBUL_ILCELERI.map((d: IstanbulDistrict) => {
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
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-white/5 border-white/10 text-sm"
              >
                {ISTANBUL_ILCELERI.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
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
