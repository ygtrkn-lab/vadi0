'use client';

import { useState } from 'react';
import { useTheme } from '../ThemeContext';

export default function BulkImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { isDark } = useTheme();

  const handleImport = async () => {
    if (!confirm('Tüm ürünleri Supabase\'e aktarmak istediğinizden emin misiniz?')) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/bulk-import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className={`rounded-2xl p-8 ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-gray-200'}`}>
        <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🚀 Toplu Ürün Aktarımı
        </h1>
        
        <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
          Bu araç lokal JSON dosyasındaki tüm ürünleri Supabase veritabanına aktarır. 
          Mevcut ürünler kontrol edilir ve sadece yeni ürünler eklenir.
        </p>
        
        <button
          onClick={handleImport}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
        >
          {loading ? '⏳ Aktarılıyor...' : '📤 Aktarımı Başlat'}
        </button>
        
        {result && (
          <div className={`mt-6 p-6 rounded-xl ${
            result.success 
              ? isDark ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'
              : isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold mb-3 ${
              result.success 
                ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                : isDark ? 'text-red-400' : 'text-red-700'
            }`}>
              {result.success ? '✅ Aktarım Tamamlandı' : '❌ Hata Oluştu'}
            </h3>
            
            {result.message && (
              <p className={`mb-4 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {result.message}
              </p>
            )}
            
            {result.stats && (
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg ${isDark ? 'bg-neutral-800/50' : 'bg-white/50'}`}>
                <div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {result.stats.total}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Toplam Ürün
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {result.stats.existing}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Mevcut
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {result.stats.inserted}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Eklendi
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {result.stats.failed}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Başarısız
                  </div>
                </div>
              </div>
            )}
            
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                  Hatalar:
                </h4>
                <div className={`max-h-60 overflow-y-auto space-y-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  {result.errors.map((err: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                      <span className="font-mono text-sm">Batch {err.batch}: {err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.error && (
              <pre className={`mt-4 p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-neutral-800 text-red-400' : 'bg-white text-red-600'}`}>
                {result.error}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
