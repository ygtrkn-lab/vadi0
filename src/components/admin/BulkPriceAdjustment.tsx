'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreviewProduct {
  id: number;
  name: string;
  currentPrice: number;
  newPrice: number;
  currentOldPrice: number;
  newOldPrice: number;
}

interface BulkPriceAdjustmentProps {
  categories: Array<{ id: number; name: string; slug: string }>;
}

interface HistoryItem {
  key: string;
  value: {
    timestamp: string;
    operation: 'increase' | 'decrease';
    percentage: number;
    stats: {
      totalProcessed: number;
      successCount: number;
      failedCount: number;
    };
    filters?: {
      category?: string;
      inStock?: boolean;
    };
  };
}

export default function BulkPriceAdjustment({ categories }: BulkPriceAdjustmentProps) {
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [percentage, setPercentage] = useState<string>('10');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [preview, setPreview] = useState<PreviewProduct[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      totalProcessed: number;
      successCount: number;
      failedCount: number;
    };
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/admin/products/bulk-price-update');
      const data = await response.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setIsPreviewMode(true);
    setResult(null);

    try {
      const filters: any = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (inStockOnly) filters.inStock = true;
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = parseInt(minPrice);
        if (maxPrice) filters.priceRange.max = parseInt(maxPrice);
      }

      const response = await fetch('/api/admin/products/bulk-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          percentage: parseFloat(percentage),
          filters,
          preview: true,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.preview) {
        setPreview(data.preview);
        setResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Önizleme başarısız oldu',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);

    try {
      const filters: any = {};
      if (selectedCategory) filters.category = selectedCategory;
      if (inStockOnly) filters.inStock = true;
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = parseInt(minPrice);
        if (maxPrice) filters.priceRange.max = parseInt(maxPrice);
      }

      const response = await fetch('/api/admin/products/bulk-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          percentage: parseFloat(percentage),
          filters,
          preview: false,
        }),
      });

      const data = await response.json();
      setResult(data);
      setIsPreviewMode(false);
      setPreview([]);
      
      // Reload history
      await loadHistory();
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Toplu Fiyat Ayarlama
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tüm ürünlere veya filtrelenmiş ürünlere toplu fiyat ayarlaması yapın
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {showHistory ? 'Gizle' : 'Geçmiş İşlemler'}
        </button>
      </div>

      {/* History Section */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Son İşlemler
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Henüz işlem kaydı bulunmuyor
                </p>
              ) : (
                history.map((item, index) => (
                  <div
                    key={item.key}
                    className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-medium ${
                          item.value.operation === 'increase' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          %{item.value.percentage} {item.value.operation === 'increase' ? 'Artış' : 'Düşüş'}
                        </span>
                        {item.value.filters?.category && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            • {categories.find(c => c.slug === item.value.filters?.category)?.name || item.value.filters.category}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.value.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {item.value.stats.successCount} başarılı / {item.value.stats.totalProcessed} toplam
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              İşlem Türü
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="increase"
                  checked={operation === 'increase'}
                  onChange={(e) => setOperation(e.target.value as 'increase')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  Fiyat Arttır
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="decrease"
                  checked={operation === 'decrease'}
                  onChange={(e) => setOperation(e.target.value as 'decrease')}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  Fiyat Düşür
                </span>
              </label>
            </div>
          </div>

          {/* Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yüzde Oranı (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              placeholder="10"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori Filtresi
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="flex items-center cursor-pointer pt-8">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-rose-600 focus:ring-rose-500 rounded"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Sadece Stokta Olan Ürünler
              </span>
            </label>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Fiyat (TL)
            </label>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              placeholder="Min fiyat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Fiyat (TL)
            </label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              placeholder="Max fiyat"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handlePreview}
            disabled={isLoading || !percentage}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Yükleniyor...' : 'Önizleme Göster'}
          </button>
          
          {isPreviewMode && preview.length > 0 && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isLoading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              Uygula
            </button>
          )}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.stats && (
            <p className="text-sm mt-1">
              {result.stats.successCount} başarılı, {result.stats.failedCount} hatalı
            </p>
          )}
        </motion.div>
      )}

      {/* Preview Table */}
      {isPreviewMode && preview.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Önizleme - {preview.length} ürün etkilenecek
            </h4>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                    Ürün Adı
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    Mevcut Fiyat
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    Yeni Fiyat
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    Değişim
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {preview.slice(0, 50).map((product) => {
                  const change = product.newPrice - product.currentPrice;
                  const changePercent = ((change / product.currentPrice) * 100).toFixed(1);
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(product.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.newPrice)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change > 0 ? '+' : ''}{formatCurrency(change)} ({changePercent}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                ... ve {preview.length - 50} ürün daha
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Toplu Fiyat Ayarlaması
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {preview.length} ürünün fiyatları %{percentage} oranında{' '}
                {operation === 'increase' ? 'artırılacak' : 'düşürülecek'}.
                Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Onayla ve Uygula
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
