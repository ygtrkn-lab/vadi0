'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineTruck } from 'react-icons/hi';

export default function OrderTrackingWidget() {
  const [orderNumber, setOrderNumber] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      // Sipariş takip sayfasına yönlendir
      router.push(`/siparis-takip?order=${orderNumber.trim()}`);
    }
  };

  return (
    <section className="relative py-12 sm:py-16 bg-gradient-to-br from-[#549658]/10 via-white to-[#e05a4c]/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-[#549658]/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#e05a4c]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#549658] to-[#468a4a] text-white mb-4 shadow-lg shadow-[#549658]/30">
              <HiOutlineTruck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Siparişini Takip Et
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Sipariş numaranızı girerek anlık durumunu öğrenin
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#549658] to-[#e05a4c] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-center w-12 sm:w-14 text-gray-400">
                  <HiOutlineSearch className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Sipariş numaranızı girin (örn: 100001)"
                  className="flex-1 py-4 sm:py-5 pr-4 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={!orderNumber.trim()}
                  className="m-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#549658] to-[#468a4a] hover:from-[#468a4a] hover:to-[#549658] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#549658]/30 hover:shadow-[#549658]/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
                >
                  Sorgula
                </button>
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-4">
              Sipariş numaranız e-posta ile gönderilmiştir. 6 haneli bir sayıdır.
            </p>
          </form>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">Anlık Takip</div>
              <div className="text-xs text-gray-500 mt-1">Gerçek zamanlı</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">Hızlı Teslimat</div>
              <div className="text-xs text-gray-500 mt-1">Hızlı teslimat</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">🔔</div>
              <div className="text-xs sm:text-sm font-medium text-gray-900">Bildirimler</div>
              <div className="text-xs text-gray-500 mt-1">Her adımda</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
