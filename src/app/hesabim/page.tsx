'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCustomer } from '@/context/CustomerContext';
import { useOrder, Order } from '@/context/OrderContext';
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineLocationMarker,
  HiOutlineCurrencyDollar,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineGift,
  HiOutlineCog,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { SpotlightCard, FadeIn, AnimatedCounter, Ripple } from '@/components/ui-kit/premium';

export default function HesabimPage() {
  const { state: customerState } = useCustomer();
  const { state: orderState } = useOrder();

  const customer = customerState.currentCustomer;
  if (!customer) return null;

  // Müşterinin siparişlerini getir
  const customerOrders: Order[] = orderState.orders.filter(
    (order: Order) => customer.orders.includes(order.id)
  );

  const stats = [
    {
      label: 'Toplam Sipariş',
      value: customer.orderCount,
      icon: HiOutlineShoppingBag,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      spotlightColor: 'rgba(59, 130, 246, 0.15)',
    },
    {
      label: 'Toplam Harcama',
      value: customer.totalSpent,
      prefix: '₺',
      icon: HiOutlineCurrencyDollar,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      spotlightColor: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: 'Favorilerim',
      value: customer.favorites.length,
      icon: HiOutlineHeart,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      spotlightColor: 'rgba(244, 63, 94, 0.15)',
    },
    {
      label: 'Kayıtlı Adres',
      value: customer.addresses.length,
      icon: HiOutlineLocationMarker,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      spotlightColor: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  const quickActions = [
    { label: 'Siparişlerim', href: '/hesabim/siparislerim', icon: HiOutlineShoppingBag, desc: 'Tüm siparişlerin' },
    { label: 'Favorilerim', href: '/hesabim/favorilerim', icon: HiOutlineHeart, desc: 'Beğendiklerin' },
    { label: 'Adreslerim', href: '/hesabim/adreslerim', icon: HiOutlineLocationMarker, desc: 'Teslimat adreslerin' },
    { label: 'Ayarlar', href: '/hesabim/ayarlar', icon: HiOutlineCog, desc: 'Hesap ayarların' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'shipped': return 'Yolda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return HiOutlineClock;
      case 'confirmed': return HiOutlineCheckCircle;
      case 'preparing': return HiOutlineGift;
      case 'shipped': return HiOutlineTruck;
      case 'delivered': return HiOutlineCheckCircle;
      case 'cancelled': return HiOutlineExclamationCircle;
      default: return HiOutlineShoppingBag;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Mobile Only */}
      <FadeIn className="lg:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#e05a4c] to-[#c94a3c] p-5 text-white">
          <Ripple mainCircleSize={150} color="rgba(255,255,255,0.1)" numCircles={4} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>Hoş geldin</span>
              <HiOutlineSparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold mt-1">{customer.name.split(' ')[0]}</h2>
            <p className="text-white/70 text-sm mt-2">
              Bugün nasıl yardımcı olabiliriz?
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
            <HiOutlineSparkles className="w-12 h-12" />
          </div>
        </div>
      </FadeIn>

      {/* Desktop Welcome */}
      <FadeIn className="hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e05a4c] via-[#d64a3c] to-[#c94a3c] p-8 text-white">
          <Ripple mainCircleSize={200} color="rgba(255,255,255,0.08)" numCircles={5} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <span>Hoş geldin</span>
                <HiOutlineSparkles className="w-4 h-4" />
              </div>
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              <p className="text-white/70 mt-2 flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4" />
                {customer.orderCount > 0 
                  ? `${customer.orderCount} sipariş ile birlikte büyük bir yol kat ettik!`
                  : 'İlk siparişine hazır mısın?'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  <AnimatedCounter value={customer.orderCount} />
                </p>
                <p className="text-white/70 text-sm">Sipariş</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-bold">
                  <AnimatedCounter value={customer.totalSpent} prefix="₺" />
                </p>
                <p className="text-white/70 text-sm">Toplam</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} delay={index * 0.1}>
            <SpotlightCard 
              spotlightColor={stat.spotlightColor}
              className="p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br ${stat.color} 
                flex items-center justify-center mb-3 shadow-lg`}
              >
                <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {stat.prefix && <span>{stat.prefix}</span>}
                <AnimatedCounter value={stat.value} />
              </p>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </SpotlightCard>
          </FadeIn>
        ))}
      </div>

      {/* Quick Actions */}
      <FadeIn delay={0.3}>
        <SpotlightCard className="p-4 lg:p-6 shadow-sm">
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">⚡</span> Hızlı Erişim
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 
                    transition-colors cursor-pointer group text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e05a4c]/10 to-[#e05a4c]/5 
                    flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <action.icon className="w-6 h-6 text-[#e05a4c]" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm lg:text-base">
                    {action.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 hidden lg:block">
                    {action.desc}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </SpotlightCard>
      </FadeIn>

      {/* Recent Orders */}
      <FadeIn delay={0.4}>
        <SpotlightCard className="shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-100">
            <h2 className="text-base lg:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <HiOutlineShoppingBag className="w-6 h-6 text-gray-600" />
              <span>Son Siparişlerim</span>
            </h2>
            <Link 
              href="/hesabim/siparislerim"
              className="text-sm font-medium text-[#e05a4c] hover:underline flex items-center gap-1"
            >
              Tümü <HiOutlineChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {customerOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {customerOrders.slice(0, 3).map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e05a4c]/10 to-[#e05a4c]/5 
                      flex items-center justify-center shrink-0">
                      {React.createElement(getStatusIcon(order.status), { className: 'w-6 h-6 text-[#e05a4c]' })}
                    </div>
                    
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 truncate">
                          #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border shrink-0
                          ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <HiOutlineClock className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₺{order.total.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 lg:p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl 
                flex items-center justify-center mx-auto mb-4 text-4xl">
                🌷
              </div>
              <p className="text-gray-600 font-medium mb-1">Henüz siparişin yok</p>
              <p className="text-gray-400 text-sm mb-6">İlk siparişini ver, çiçeklerle tanış!</p>
              <Link href="/kategoriler">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#c94a3c] 
                    text-white font-medium rounded-xl shadow-lg shadow-[#e05a4c]/25 
                    hover:shadow-[#e05a4c]/40 transition-shadow"
                >
                  <HiOutlineGift className="w-5 h-5" />
                  Alışverişe Başla
                </motion.button>
              </Link>
            </div>
          )}
        </SpotlightCard>
      </FadeIn>

      {/* Membership Info */}
      <FadeIn delay={0.5}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#549658] to-[#4a8a4e] p-5 lg:p-6 text-white">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineSparkles className="w-5 h-5" />
                <span className="text-sm font-medium text-white/80">Vadiler Üyesi</span>
              </div>
              <p className="text-lg lg:text-xl font-bold">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-white/70 mt-1 flex items-center gap-1">
                <span>tarihinden beri birlikteyiz</span>
                <HiOutlineSparkles className="w-4 h-4" />
              </p>
            </div>
            
            {customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customer.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Promo Banner */}
      <FadeIn delay={0.6}>
        <SpotlightCard 
          spotlightColor="rgba(224, 90, 76, 0.1)"
          className="p-4 lg:p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e05a4c]/10 to-[#e05a4c]/5 
              flex items-center justify-center shrink-0">
              <HiOutlineGift className="w-8 h-8 text-[#e05a4c]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Arkadaşını Davet Et</h3>
              <p className="text-sm text-gray-500">Arkadaşın ilk alışverişinde ikınıze de %15 indirim!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-[#e05a4c] text-white text-sm font-medium rounded-xl 
                shadow-md hover:shadow-lg transition-shadow shrink-0"
            >
              Davet Et
            </motion.button>
          </div>
        </SpotlightCard>
      </FadeIn>
    </div>
  );
}
