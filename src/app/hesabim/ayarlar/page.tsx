'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '@/context/CustomerContext';
import { FadeIn, SpotlightCard, GlassCard } from '@/components/ui-kit/premium';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlineLightBulb,
  HiOutlineChartBar,
} from 'react-icons/hi';

export default function AyarlarPage() {
  const { state: customerState, updateProfile, changePassword } = useCustomer();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: customerState.currentCustomer?.name || '',
    phone: customerState.currentCustomer?.phone || '',
    email: customerState.currentCustomer?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const customer = customerState.currentCustomer;
  if (!customer) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    const result = await updateProfile(customer.id, {
      name: profileData.name,
      phone: profileData.phone,
      email: profileData.email,
    });

    setProfileLoading(false);

    if (result.success) {
      setProfileMessage({ type: 'success', text: 'Profiliniz başarıyla güncellendi!' });
    } else {
      setProfileMessage({ type: 'error', text: result.error || 'Bir hata oluştu.' });
    }

    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordLoading(false);
      setPasswordMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    const result = await changePassword(
      customer.id,
      passwordData.currentPassword,
      passwordData.newPassword
    );

    setPasswordLoading(false);

    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordMessage({ type: 'error', text: result.error || 'Bir hata oluştu.' });
    }

    setTimeout(() => setPasswordMessage(null), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: HiOutlineUser },
    { id: 'password', label: 'Şifre', icon: HiOutlineLockClosed },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Header - Native Style */}
      <FadeIn direction="down">
        <div className="bg-gradient-to-br from-[#e05a4c] to-[#d54a3c] -mx-4 md:mx-0 md:rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <HiOutlineCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ayarlar</h1>
              <p className="text-white/90 text-sm">Hesabınızı yönetin</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Tabs - iOS Style Segmented Control */}
      <FadeIn direction="up" delay={0.1}>
        <div className="bg-gray-100 rounded-2xl p-1">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'password')}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
                  transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <FadeIn>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleProfileSubmit} className="divide-y divide-gray-100">
                  {/* Message */}
                  <AnimatePresence>
                    {profileMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 px-5 py-4 ${
                          profileMessage.type === 'success' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {profileMessage.type === 'success' 
                          ? <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
                          : <HiOutlineExclamation className="w-5 h-5 flex-shrink-0" />
                        }
                        <span className="text-sm font-medium">{profileMessage.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name Field - Native List Style */}
                  <div className="px-5 py-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Ad Soyad
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full pl-8 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="Adınızı girin"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field - Native List Style */}
                  <div className="px-5 py-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      E-posta Adresi
                    </label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full pl-8 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Field - Native List Style */}
                  <div className="px-5 py-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Telefon Numarası
                    </label>
                    <div className="relative">
                      <HiOutlinePhone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-8 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="(5XX) XXX XX XX"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button - Full Width Native Style */}
                  <div className="p-5 bg-gray-50">
                    <motion.button
                      type="submit"
                      disabled={profileLoading}
                      whileTap={{ scale: 0.98 }}
                      className="w-full min-h-[52px] bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white 
                        font-semibold rounded-xl shadow-lg shadow-[#e05a4c]/20 active:shadow-md
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                    >
                      {profileLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <HiOutlineCheck className="w-5 h-5" />
                          Değişiklikleri Kaydet
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </FadeIn>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FadeIn>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handlePasswordSubmit} className="divide-y divide-gray-100">
                  {/* Message */}
                  <AnimatePresence>
                    {passwordMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-center gap-3 px-5 py-4 ${
                          passwordMessage.type === 'success' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {passwordMessage.type === 'success' 
                          ? <HiOutlineShieldCheck className="w-5 h-5 flex-shrink-0" />
                          : <HiOutlineExclamation className="w-5 h-5 flex-shrink-0" />
                        }
                        <span className="text-sm font-medium">{passwordMessage.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Current Password - Native Style */}
                  <div className="px-5 py-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full pl-8 pr-12 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="••••••••"
                        required
                      />
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 active:text-gray-600"
                      >
                        {showPasswords.current ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                  </div>

                  {/* New Password - Native Style */}
                  <div className="px-5 py-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full pl-8 pr-12 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 active:text-gray-600"
                      >
                        {showPasswords.new ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <HiOutlineKey className="w-3.5 h-3.5" /> En az 6 karakter olmalıdır
                    </p>
                  </div>

                  {/* Confirm Password - Native Style */}
                  <div className={`px-5 py-4 transition-colors ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                      ? 'bg-gray-100' 
                      : ''
                  }`}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full pl-8 pr-12 py-2 bg-transparent border-0 text-gray-900 text-base
                          focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 active:text-gray-600"
                      >
                        {showPasswords.confirm ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium"
                        >
                          <HiOutlineExclamation className="w-3.5 h-3.5" /> Şifreler eşleşmiyor
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit Button */}
                  <div className="p-5 bg-gray-50">
                    <motion.button
                      type="submit"
                      disabled={passwordLoading || passwordData.newPassword !== passwordData.confirmPassword}
                      whileTap={{ scale: 0.98 }}
                      className="w-full min-h-[52px] bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white 
                        font-semibold rounded-xl shadow-lg shadow-[#e05a4c]/20 active:shadow-md
                        transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <HiOutlineShieldCheck className="w-5 h-5" />
                          Şifreyi Değiştir
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Security Tip - Collapsible Card */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-5 mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <HiOutlineLightBulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 text-sm">Güvenlik İpucu</h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Güçlü bir şifre için büyük-küçük harf, rakam ve özel karakter kullanın.
                        Şifrenizi kimseyle paylaşmayın.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Info - Native Card Style */}
      <FadeIn delay={0.2}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-white border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineChartBar className="w-5 h-5 text-black" />
              Hesap Bilgileri
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Account ID */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Hesap ID</span>
              <span className="text-sm font-mono text-gray-900 truncate max-w-[200px]">{customer.id}</span>
            </div>
            {/* Registration Date */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Kayıt Tarihi</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            {/* Last Update */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Son Güncelleme</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(customer.updatedAt).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            {/* Account Status */}
            <div className="px-5 py-4 flex items-center justify-between bg-gray-100">
              <span className="text-sm text-gray-500">Hesap Durumu</span>
              <div className="flex items-center gap-2">
                <motion.span 
                  className="w-2 h-2 bg-black rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <span className="text-sm font-semibold text-black">Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
