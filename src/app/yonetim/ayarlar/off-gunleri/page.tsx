'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { SpotlightCard, FadeContent } from '@/components/admin';
import { useTheme } from '../../ThemeContext';
import {
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineEyeOff
} from 'react-icons/hi';

type DeliveryOffDay = {
  id: number;
  offDate: string;
  note: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

const formatDate = (iso: string) => {
  try {
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}.${m}.${y}`;
  } catch {
    return iso;
  }
};

export default function DeliveryOffDaysPage() {
  const { isDark } = useTheme();
  const [offDays, setOffDays] = useState<DeliveryOffDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDate, setFormDate] = useState('');
  const [formNote, setFormNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const todayIso = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOffDays = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showPast) params.set('includePast', 'true');
      if (showInactive) params.set('all', 'true');
      const qs = params.toString();
      const response = await fetch(`/api/delivery-off-days${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Off günler alınamadı');
      }
      const data = await response.json();
      const parsed = Array.isArray(data?.offDays)
        ? data.offDays.map((item: any) => ({
            id: Number(item.id),
            offDate: String(item.offDate),
            note: String(item.note || ''),
            isActive: Boolean(item.isActive),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
        : [];
      setOffDays(parsed);
    } catch (error) {
      console.error(error);
      showToast('Off gün listesi yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [showInactive, showPast]);

  useEffect(() => {
    loadOffDays();
  }, [loadOffDays]);

  const handleCreate = async () => {
    if (!formDate) {
      showToast('Lütfen bir tarih seçin', 'error');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('/api/delivery-off-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offDate: formDate, note: formNote.trim() })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Kayıt başarısız');
      }
      setFormDate('');
      setFormNote('');
      showToast('Off günü eklendi', 'success');
      loadOffDays();
    } catch (error) {
      console.error(error);
      showToast('Off günü eklenemedi', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (day: DeliveryOffDay) => {
    setTogglingId(day.id);
    try {
      const response = await fetch(`/api/delivery-off-days/${day.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !day.isActive })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Güncellenemedi');
      }
      showToast('Durum güncellendi', 'success');
      loadOffDays();
    } catch (error) {
      console.error(error);
      showToast('Durum güncellenemedi', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteDay = async (day: DeliveryOffDay) => {
    const confirmDelete = window.confirm(`${formatDate(day.offDate)} tarihini silmek istediğinize emin misiniz?`);
    if (!confirmDelete) return;
    setDeletingId(day.id);
    try {
      const response = await fetch(`/api/delivery-off-days/${day.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Silinemedi');
      }
      showToast('Off günü silindi', 'success');
      loadOffDays();
    } catch (error) {
      console.error(error);
      showToast('Off günü silinemedi', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <FadeContent direction="up" delay={0}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Teslimat Off Günleri</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Belirli günlerde sipariş alımını kapatın. Sepet ve API otomatik olarak bu günleri bloklar.
            </p>
          </div>
          <Link
            href="/yonetim/ayarlar"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'
            }`}
          >
            <HiOutlineCalendar className="w-5 h-5" />
            Ayarlara Dön
          </Link>
        </div>
      </FadeContent>

      <FadeContent direction="up" delay={0.05}>
        <SpotlightCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <HiOutlinePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Yeni Off Günü Ekle</h2>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Date picker, checkout ve sipariş API'si bu tarihte sipariş oluşturmayı engeller.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Tarih
              </label>
              <input
                type="date"
                value={formDate}
                min={todayIso}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-gray-200'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Not (opsiyonel)
              </label>
              <input
                type="text"
                value={formNote}
                maxLength={120}
                placeholder="Örn: Kurban Bayramı"
                onChange={(e) => setFormNote(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none ${
                  isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-gray-200'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              <HiOutlineExclamationCircle className="w-4 h-4" />
              Aynı tarihte iki kayıt oluşturamazsınız.
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
                creating ? 'opacity-60 cursor-not-allowed' : ''
              } ${isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
              {creating ? 'Kaydediliyor...' : 'Off Gününü Kaydet'}
              <HiOutlineCheckCircle className="w-5 h-5" />
            </button>
          </div>
        </SpotlightCard>
      </FadeContent>

      <FadeContent direction="up" delay={0.1}>
        <SpotlightCard className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Planlanmış Off Günleri</h2>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Aktif kayıtlar Sepet sayfasında gösterilir ve sipariş API'si tarafından engellenir.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-full border cursor-pointer ${
                isDark ? 'border-neutral-800 text-neutral-300' : 'border-gray-200 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={showPast}
                  onChange={(e) => setShowPast(e.target.checked)}
                  className="accent-purple-600"
                />
                Geçmişi Göster
              </label>
              <label className={`flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-full border cursor-pointer ${
                isDark ? 'border-neutral-800 text-neutral-300' : 'border-gray-200 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="accent-purple-600"
                />
                Pasifleri Göster
              </label>
              <button
                onClick={loadOffDays}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
                  isDark ? 'border-neutral-800 text-neutral-200' : 'border-gray-200 text-gray-600'
                }`}
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Yenile
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm">
              <div className={`flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                Kayıtlar yükleniyor...
              </div>
            </div>
          ) : offDays.length === 0 ? (
            <div className={`text-center py-12 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Henüz kayıt yok.
            </div>
          ) : (
            <div className="space-y-3">
              {offDays.map((day) => (
                <div
                  key={day.id}
                  className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 rounded-2xl border ${
                    isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-semibold">
                      {new Date(day.offDate).toLocaleDateString('tr-TR', { day: '2-digit' })}
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(day.offDate)}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {day.note || 'Not bulunmuyor'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Oluşturma: {new Date(day.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        day.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}
                    >
                      {day.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <button
                      onClick={() => toggleStatus(day)}
                      disabled={togglingId === day.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        togglingId === day.id ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        day.isActive
                          ? isDark ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700' : 'bg-white border border-gray-200'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {day.isActive ? (
                        <>
                          <HiOutlineEyeOff className="w-4 h-4" />
                          Pasifleştir
                        </>
                      ) : (
                        <>
                          <HiOutlineEye className="w-4 h-4" />
                          Aktifleştir
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteDay(day)}
                      disabled={deletingId === day.id}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        deletingId === day.id ? 'opacity-60 cursor-not-allowed' : ''
                      } ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      </FadeContent>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <HiOutlineCheckCircle className="w-5 h-5" />
            ) : (
              <HiOutlineXCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
