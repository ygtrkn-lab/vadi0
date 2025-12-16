'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer, Address } from '@/context/CustomerContext';
import { YAKA_OPTIONS, getDistrictsBySide } from '@/data/istanbul-districts';
import {
  HiOutlineLocationMarker,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiStar,
  HiOutlinePhone,
  HiOutlineCheck,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineTruck,
} from 'react-icons/hi';

const typeConfig = {
  home: { 
    icon: HiOutlineHome, 
    label: 'Ev', 
    defaultTitle: 'Evim', 
    color: 'bg-blue-50 text-blue-600 border-blue-200' 
  },
  work: { 
    icon: HiOutlineOfficeBuilding, 
    label: 'İş', 
    defaultTitle: 'İşyerim', 
    color: 'bg-purple-50 text-purple-600 border-purple-200' 
  },
  other: { 
    icon: HiOutlineLocationMarker, 
    label: 'Diğer', 
    defaultTitle: 'Diğer Adresim', 
    color: 'bg-gray-50 text-gray-600 border-gray-200' 
  },
};

export default function AdreslerimPage() {
  const { 
    state: customerState, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress 
  } = useCustomer();
  
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'home' as 'home' | 'work' | 'other',
    recipientName: '',
    recipientPhone: '',
    side: '' as 'anadolu' | 'avrupa' | '',
    district: '',
    districtId: 0,
    neighborhood: '',
    fullAddress: '',
  });

  const customer = customerState.currentCustomer;
  if (!customer) return null;

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'home',
      recipientName: customer.name,
      recipientPhone: customer.phone,
      side: '',
      district: '',
      districtId: 0,
      neighborhood: '',
      fullAddress: '',
    });
    setEditingAddress(null);
  };

  const handleOpenForm = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      const anadoluDistricts = ['Ataşehir', 'Beykoz', 'Çekmeköy', 'Kadıköy', 'Kartal', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sultanbeyli', 'Şile', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Adalar'];
      const side = anadoluDistricts.includes(address.district) ? 'anadolu' : 'avrupa';
      
      setFormData({
        title: address.title,
        type: address.type,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        side,
        district: address.district,
        districtId: address.districtId,
        neighborhood: address.neighborhood,
        fullAddress: address.fullAddress,
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressData: Omit<Address, 'id'> = {
      title: formData.title,
      type: formData.type,
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      province: 'İstanbul',
      provinceId: 34,
      district: formData.district,
      districtId: formData.districtId,
      neighborhood: formData.neighborhood,
      fullAddress: formData.fullAddress,
      postalCode: '',
      isDefault: customer.addresses.length === 0,
    };

    if (editingAddress) {
      updateAddress(customer.id, editingAddress.id, addressData);
      setSuccessMessage('Adres başarıyla güncellendi');
    } else {
      addAddress(customer.id, addressData);
      setSuccessMessage('Yeni adres eklendi');
    }

    setShowForm(false);
    resetForm();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = (addressId: string) => {
    deleteAddress(customer.id, addressId);
    setDeleteConfirm(null);
    setSuccessMessage('Adres silindi');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Success Toast - Amazon style */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#549658] text-white px-6 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <HiOutlineCheckCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Amazon style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Adreslerim
            </h1>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-medium rounded-lg hover:from-[#d54a3c] hover:to-[#c43a2c] transition-all shadow-sm hover:shadow-md"
            >
              <HiOutlinePlus className="w-5 h-5" />
              <span className="hidden sm:inline">Yeni Adres Ekle</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {customer.addresses.length === 0 ? (
          /* Empty State - Amazon style */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineLocationMarker className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz kayıtlı adresiniz yok
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Teslimat adresinizi ekleyerek siparişlerinizi hızlıca tamamlayabilirsiniz
            </p>
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-medium rounded-lg hover:from-[#d54a3c] hover:to-[#c43a2c] transition-all"
            >
              <HiOutlinePlus className="w-5 h-5" />
              İlk Adresimi Ekle
            </button>
          </motion.div>
        ) : (
          /* Address Grid - Amazon style */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg border-2 p-5 relative hover:shadow-md transition-all ${
                  address.isDefault 
                    ? 'border-[#e05a4c] shadow-sm' 
                    : 'border-gray-200'
                }`}
              >
                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-[#e05a4c] text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <HiStar className="w-3 h-3 fill-current" />
                    VARSAYILAN
                  </div>
                )}

                {/* Address Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${typeConfig[address.type].color}`}>
                    {React.createElement(typeConfig[address.type].icon, { className: 'w-6 h-6' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                      {address.title}
                    </h3>
                    <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {typeConfig[address.type].label}
                    </span>
                  </div>
                </div>

                {/* Address Details */}
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">{address.recipientName}</p>
                  <p className="text-gray-700 line-clamp-2">{address.fullAddress}</p>
                  <p className="text-gray-600">
                    {address.neighborhood}, {address.district}
                  </p>
                  <a 
                    href={`tel:${address.recipientPhone}`}
                    className="text-[#e05a4c] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <HiOutlinePhone className="w-4 h-4" />
                    {address.recipientPhone}
                  </a>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => setDefaultAddress(customer.id, address.id)}
                      className="flex-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-md transition-colors"
                    >
                      Varsayılan Yap
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenForm(address)}
                    className={`${address.isDefault ? 'flex-1' : ''} py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1`}
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(address.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <HiOutlineTruck className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">
              İstanbul Genelinde Hızlı Teslimat
            </h4>
            <p className="text-sm text-gray-600">
              İstanbul Genelinde Hızlı Teslimat 
              Şu an sadece İstanbul içi teslimat yapılmaktadır.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <AddressFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isEditing={!!editingAddress}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineTrash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Adresi Sil
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Bu adresi silmek istediğinize emin misiniz?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Address Form Modal Component
interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

function AddressFormModal({ isOpen, onClose, formData, setFormData, onSubmit, isEditing }: AddressFormModalProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'region' | 'district'>('region');
  const [locationSearch, setLocationSearch] = useState('');

  const districts = useMemo(() => {
    if (!formData.side) return [];
    return getDistrictsBySide(formData.side);
  }, [formData.side]);

  const filteredRegions = YAKA_OPTIONS.filter(r => 
    r.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredDistricts = districts.filter((d: any) => 
    d.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleRegionSelect = (side: 'anadolu' | 'avrupa') => {
    setFormData({ ...formData, side, district: '', districtId: 0, neighborhood: '' });
    setLocationStep('district');
    setLocationSearch('');
  };

  const handleDistrictSelect = (districtName: string) => {
    const selectedDistrict = districts.find((d: any) => d.name === districtName);
    setFormData({ 
      ...formData, 
      district: districtName, 
      districtId: selectedDistrict?.id || 0,
      neighborhood: ''
    });
    setIsLocationOpen(false);
    setLocationSearch('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
      onClick={onClose}
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <HiOutlineX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Address Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Adres Tipi *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const shouldAutoFill = !formData.title || 
                          formData.title === 'Evim' || 
                          formData.title === 'İşyerim' || 
                          formData.title === 'Diğer Adresim';
                        
                        setFormData({ 
                          ...formData, 
                          type: key,
                          title: shouldAutoFill ? config.defaultTitle : formData.title
                        });
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.type === key
                          ? 'border-[#e05a4c] bg-[#e05a4c]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="mb-2">
                        {React.createElement(config.icon, { className: 'w-8 h-8 mx-auto' })}
                      </div>
                      <div className="font-semibold text-sm">{config.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Adres Başlığı *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Evim, İşyerim"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent"
                />
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Alıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location Selector */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Teslimat Bölgesi *
                </label>
                <button
                  type="button"
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.district 
                      ? 'border-[#549658] bg-[#549658]/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <HiOutlineLocationMarker className="w-5 h-5 text-gray-500" />
                  <span className="flex-1 text-left text-sm">
                    {formData.district 
                      ? `İstanbul / ${formData.side === 'anadolu' ? 'Anadolu' : 'Avrupa'} / ${formData.district}`
                      : 'Bölge seçiniz'}
                  </span>
                  <HiOutlineChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isLocationOpen ? 'rotate-90' : ''}`} />
                </button>

                {isLocationOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-xl z-50 max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <HiOutlineSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder={locationStep === 'region' ? 'Bölge ara...' : 'İlçe ara...'}
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent"
                        />
                      </div>
                      {locationStep === 'district' && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, side: '', district: '', districtId: 0 });
                            setLocationStep('region');
                            setLocationSearch('');
                          }}
                          className="text-xs text-[#e05a4c] mt-2 hover:underline"
                        >
                          ← Bölge seçimine dön
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-64">
                      {locationStep === 'region' ? (
                        filteredRegions.map((region) => (
                          <button
                            key={region.id}
                            type="button"
                            onClick={() => handleRegionSelect(region.id as 'anadolu' | 'avrupa')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span className="text-xl">{region.icon}</span>
                            <span className="text-sm font-medium text-gray-700 flex-1">{region.name}</span>
                            <HiOutlineChevronRight className="w-4 h-4 text-gray-300" />
                          </button>
                        ))
                      ) : (
                        filteredDistricts.map((district: any) => (
                          <button
                            key={district.id}
                            type="button"
                            onClick={() => handleDistrictSelect(district.name)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span className="text-sm text-gray-700">{district.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Neighborhood */}
              {formData.district && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mahalle
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Mahalle adı"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent"
                  />
                </motion.div>
              )}

              {/* Full Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Açık Adres *
                </label>
                <textarea
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                  placeholder="Sokak, cadde, bina no, daire no vb."
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e05a4c] focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!formData.title || !formData.district || !formData.fullAddress}
                  className="flex-1 py-3 bg-gradient-to-r from-[#e05a4c] to-[#d54a3c] text-white font-medium rounded-lg hover:from-[#d54a3c] hover:to-[#c43a2c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
