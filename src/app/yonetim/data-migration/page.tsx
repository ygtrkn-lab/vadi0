'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface MigrationStats {
  total: number;
  existing: number;
  inserted: number;
  failed: number;
}

interface MigrationResult {
  success: boolean;
  message: string;
  stats: MigrationStats;
  errors?: Array<{ batch?: number; error: string }>;
}

export default function DataMigrationPage() {
  const [customerResult, setCustomerResult] = useState<MigrationResult | null>(null);
  const [orderResult, setOrderResult] = useState<MigrationResult | null>(null);
  const [couponResult, setCouponResult] = useState<MigrationResult | null>(null);
  
  const [customerLoading, setCustomerLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const importCustomers = async () => {
    setCustomerLoading(true);
    setCustomerResult(null);
    
    try {
      const response = await fetch('/api/admin/bulk-import-customers', {
        method: 'POST',
      });
      
      const result = await response.json();
      setCustomerResult(result);
    } catch (error: any) {
      setCustomerResult({
        success: false,
        message: error.message,
        stats: { total: 0, existing: 0, inserted: 0, failed: 0 }
      });
    } finally {
      setCustomerLoading(false);
    }
  };

  const importOrders = async () => {
    setOrderLoading(true);
    setOrderResult(null);
    
    try {
      const response = await fetch('/api/admin/bulk-import-orders', {
        method: 'POST',
      });
      
      const result = await response.json();
      setOrderResult(result);
    } catch (error: any) {
      setOrderResult({
        success: false,
        message: error.message,
        stats: { total: 0, existing: 0, inserted: 0, failed: 0 }
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const importCoupons = async () => {
    setCouponLoading(true);
    setCouponResult(null);
    
    try {
      const response = await fetch('/api/admin/bulk-import-coupons', {
        method: 'POST',
      });
      
      const result = await response.json();
      setCouponResult(result);
    } catch (error: any) {
      setCouponResult({
        success: false,
        message: error.message,
        stats: { total: 0, existing: 0, inserted: 0, failed: 0 }
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const importAll = async () => {
    await importCustomers();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await importOrders();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await importCoupons();
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Veri Taşıma Merkezi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Müşteri, sipariş ve kupon verilerini Supabase'e aktarın
          </p>
        </div>

        {/* Import All Button */}
        <div className="mb-8">
          <button
            onClick={importAll}
            disabled={customerLoading || orderLoading || couponLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg 
                     hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed
                     font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {(customerLoading || orderLoading || couponLoading) ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Aktarılıyor...
              </span>
            ) : (
              '🚀 Tüm Verileri Aktar (Sıralı)'
            )}
          </button>
        </div>

        {/* Migration Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customers */}
          <MigrationCard
            title="👥 Müşteriler"
            description="Müşteri hesapları ve adresleri"
            onImport={importCustomers}
            loading={customerLoading}
            result={customerResult}
            color="blue"
          />

          {/* Orders */}
          <MigrationCard
            title="📦 Siparişler"
            description="Sipariş geçmişi ve detayları"
            onImport={importOrders}
            loading={orderLoading}
            result={orderResult}
            color="purple"
          />

          {/* Coupons */}
          <MigrationCard
            title="🎟️ Kupon Kodları"
            description="İndirim kuponları"
            onImport={importCoupons}
            loading={couponLoading}
            result={couponResult}
            color="orange"
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ℹ️ Önemli Notlar
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">1.</span>
              <span>İlk olarak <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">scripts/prepare-customer-migration.js</code> scriptini çalıştırın (şifreleri hashlemek için)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">2.</span>
              <span>Veri aktarımı sıralaması önemlidir: Müşteriler → Siparişler → Kuponlar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">3.</span>
              <span>Mevcut veriler atlanır, yalnızca yeni kayıtlar eklenir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">4.</span>
              <span>Tüm şifreler bcrypt ile hashlenmiştir, kullanıcılar aynı şifrelerle giriş yapabilir</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface MigrationCardProps {
  title: string;
  description: string;
  onImport: () => void;
  loading: boolean;
  result: MigrationResult | null;
  color: 'blue' | 'purple' | 'orange';
}

function MigrationCard({ title, description, onImport, loading, result, color }: MigrationCardProps) {
  const [showErrors, setShowErrors] = useState(false);
  
  const colorClasses = {
    blue: {
      bg: 'from-blue-600 to-blue-700',
      hover: 'hover:from-blue-700 hover:to-blue-800',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100'
    },
    purple: {
      bg: 'from-purple-600 to-purple-700',
      hover: 'hover:from-purple-700 hover:to-purple-800',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100'
    },
    orange: {
      bg: 'from-orange-600 to-orange-700',
      hover: 'hover:from-orange-700 hover:to-orange-800',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-900 dark:text-orange-100'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg border ${colorClasses[color].border} overflow-hidden shadow-lg`}
    >
      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${colorClasses[color].bg}`}>
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Import Button */}
        <button
          onClick={onImport}
          disabled={loading}
          className={`w-full px-4 py-3 bg-gradient-to-r ${colorClasses[color].bg} ${colorClasses[color].hover}
                     text-white rounded-lg font-semibold shadow-md hover:shadow-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Aktarılıyor...
            </span>
          ) : (
            'Aktarımı Başlat'
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Toplam</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.stats.existing}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Mevcut</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {result.stats.inserted}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Eklendi</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {result.stats.failed}
                </div>
                <div className="text-xs text-red-600 dark:text-red-500">Başarısız</div>
              </div>
            </div>

            {/* Message */}
            <div className={`p-3 rounded text-sm ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {result.message}
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  {showErrors ? '▼' : '▶'} Hataları Göster ({result.errors.length})
                </button>
                
                {showErrors && (
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded">
                        {err.batch && `Batch ${err.batch}: `}{err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
