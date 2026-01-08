'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '../../ThemeContext';
import { SpotlightCard, FadeContent } from '@/components/admin';
import { 
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import '@/styles/admin-modern.css';

interface DeletedOrder {
  id: string;
  original_id: string;
  order_number: string;
  order_data: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total: number;
    status: string;
    created_at: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    delivery?: {
      district?: string;
      neighborhood?: string;
      date?: string;
    };
  };
  deleted_at: string;
  is_restored: boolean;
}

export default function DeletedOrdersPage() {
  const { isDark } = useTheme();
  const [deletedOrders, setDeletedOrders] = useState<DeletedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restoreModalOrder, setRestoreModalOrder] = useState<DeletedOrder | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDeletedOrders();
  }, []);

  const fetchDeletedOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders/deleted');
      if (response.ok) {
        const data = await response.json();
        setDeletedOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching deleted orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (order: DeletedOrder) => {
    try {
      setIsRestoring(true);
      const response = await fetch('/api/orders/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedOrderId: order.id }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `Sipariş #${order.order_number} başarıyla geri yüklendi!` });
        setDeletedOrders(prev => prev.filter(o => o.id !== order.id));
        setRestoreModalOrder(null);
      } else {
        const error = await response.json();
        setNotification({ type: 'error', message: error.error || 'Geri yükleme başarısız' });
      }
    } catch (error) {
      console.error('Error restoring order:', error);
      setNotification({ type: 'error', message: 'Bir hata oluştu' });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = deletedOrders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(term) ||
      order.order_data?.customer_name?.toLowerCase().includes(term) ||
      order.order_data?.customer_phone?.includes(term)
    );
  });

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 ${
              notification.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <HiOutlineCheckCircle className="w-5 h-5" />
            ) : (
              <HiOutlineExclamation className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <FadeContent direction="up" delay={0}>
        <div className={`p-6 rounded-3xl backdrop-blur-xl ${
          isDark 
            ? 'bg-white/[0.03] border border-white/[0.08]' 
            : 'bg-white/60 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/yonetim/siparisler"
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Silinen Siparişler
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {deletedOrders.length} silinen sipariş
                </p>
              </div>
            </div>

            {/* Search */}
            <div className={`relative w-full sm:w-64 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <HiOutlineSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-neutral-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 focus:border-white/30 placeholder:text-neutral-500'
                    : 'bg-white border-gray-200 focus:border-gray-400 placeholder:text-gray-400'
                } outline-none`}
              />
            </div>
          </div>
        </div>
      </FadeContent>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent border-current rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <FadeContent direction="up" delay={0.1}>
          <div className="text-center py-16">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isDark ? 'bg-neutral-800/50' : 'bg-gray-100'
            }`}>
              <HiOutlineTrash className={`w-10 h-10 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Silinen sipariş yok
            </h3>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Sildiğiniz siparişler burada görünecek
            </p>
          </div>
        </FadeContent>
      ) : (
        <FadeContent direction="up" delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SpotlightCard className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        #{order.order_number}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        Silindi: {formatDate(order.deleted_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
                    }`}>
                      Silindi
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Müşteri:</span> {order.order_data?.customer_name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Tutar:</span> {formatPrice(order.order_data?.total || 0)}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Ürün sayısı:</span> {order.order_data?.products?.length || 0}
                    </p>
                    {order.order_data?.delivery?.date && (
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Teslimat:</span> {order.order_data.delivery.date}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setRestoreModalOrder(order)}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                    Geri Yükle
                  </button>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </FadeContent>
      )}

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {restoreModalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isRestoring && setRestoreModalOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl p-6 ${
                isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'
              } shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Siparişi Geri Yükle
                </h3>
                <button
                  onClick={() => setRestoreModalOrder(null)}
                  disabled={isRestoring}
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-4 rounded-2xl mb-4 ${
                isDark ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  #{restoreModalOrder.order_number}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {restoreModalOrder.order_data?.customer_name}
                </p>
                <p className={`text-sm font-medium mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatPrice(restoreModalOrder.order_data?.total || 0)}
                </p>
              </div>

              <p className={`text-sm mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Bu sipariş geri yüklenecek ve siparişler listesinde tekrar görünecek. Tüm veriler korunacak.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setRestoreModalOrder(null)}
                  disabled={isRestoring}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleRestore(restoreModalOrder)}
                  disabled={isRestoring}
                  className="flex-1 py-3 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isRestoring ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlineRefresh className="w-4 h-4" />
                      Geri Yükle
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
