'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineStar
} from 'react-icons/hi';
import AddressSelector from './AddressSelector';

export interface Address {
  id: string;
  title: string;
  type: 'home' | 'work' | 'other';
  recipientName: string;
  recipientPhone: string;
  province: string;
  provinceId: number;
  district: string;
  districtId: number;
  neighborhood: string;
  fullAddress: string;
  postalCode?: string;
  isDefault: boolean;
}

interface AddressFormData {
  title: string;
  type: 'home' | 'work' | 'other';
  recipientName: string;
  recipientPhone: string;
  province: string;
  provinceId: number;
  district: string;
  districtId: number;
  neighborhood: string;
  fullAddress: string;
  postalCode: string;
  isDefault: boolean;
}

interface AddressFormProps {
  addresses: Address[];
  onAddAddress: (address: Omit<Address, 'id'>) => void;
  onUpdateAddress: (id: string, address: Partial<Address>) => void;
  onDeleteAddress: (id: string) => void;
  onSelectAddress?: (address: Address) => void;
  selectedAddressId?: string;
  mode?: 'full' | 'select' | 'compact';
  showBillingOption?: boolean;
  billingAddress?: Address | null;
  onBillingAddressChange?: (address: Address | null, sameAsDelivery: boolean) => void;
  title?: string;
}

const initialFormData: AddressFormData = {
  title: '',
  type: 'home',
  recipientName: '',
  recipientPhone: '',
  province: '',
  provinceId: 0,
  district: '',
  districtId: 0,
  neighborhood: '',
  fullAddress: '',
  postalCode: '',
  isDefault: false,
};

export default function AddressForm({
  addresses,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSelectAddress,
  selectedAddressId,
  mode = 'full',
  showBillingOption = false,
  billingAddress,
  onBillingAddressChange,
  title = 'Teslimat Adresi'
}: AddressFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const addressTypeIcons = {
    home: <HiOutlineHome className="w-4 h-4" />,
    work: <HiOutlineOfficeBuilding className="w-4 h-4" />,
    other: <HiOutlineLocationMarker className="w-4 h-4" />
  };

  const addressTypeLabels = {
    home: 'Ev',
    work: 'İş',
    other: 'Diğer'
  };

  const handleSubmit = () => {
    if (!formData.recipientName || !formData.province || !formData.district || !formData.fullAddress) {
      return;
    }

    if (editingId) {
      onUpdateAddress(editingId, formData);
    } else {
      onAddAddress(formData);
    }

    setFormData(initialFormData);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      title: address.title,
      type: address.type,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      province: address.province,
      provinceId: address.provinceId,
      district: address.district,
      districtId: address.districtId,
      neighborhood: address.neighborhood,
      fullAddress: address.fullAddress,
      postalCode: address.postalCode || '',
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (onBillingAddressChange) {
      if (checked && selectedAddressId) {
        const selectedAddr = addresses.find(a => a.id === selectedAddressId);
        onBillingAddressChange(selectedAddr || null, true);
      } else {
        onBillingAddressChange(null, false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <HiOutlineLocationMarker className="w-5 h-5 text-[#e05a4c]" />
          {title}
        </h3>
        {!isFormOpen && addresses.length > 0 && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#e05a4c] hover:text-[#cd3f31] transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Yeni Adres
          </button>
        )}
      </div>

      {/* Address List */}
      {!isFormOpen && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${selectedAddressId === address.id 
                  ? 'border-[#e05a4c] bg-[#e05a4c]/5 shadow-lg shadow-[#e05a4c]/10' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
              onClick={() => onSelectAddress?.(address)}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-[#549658] text-white text-xs font-medium rounded-full">
                  <HiOutlineStar className="w-3 h-3" />
                  Varsayılan
                </span>
              )}

              {/* Selection Indicator */}
              <div className={`
                absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedAddressId === address.id 
                  ? 'border-[#e05a4c] bg-[#e05a4c]' 
                  : 'border-gray-300'
                }
              `}>
                {selectedAddressId === address.id && (
                  <HiOutlineCheck className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Address Content */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg ${selectedAddressId === address.id ? 'bg-[#e05a4c]/10 text-[#e05a4c]' : 'bg-gray-100 text-gray-600'}`}>
                    {addressTypeIcons[address.type]}
                  </span>
                  <span className="font-semibold text-gray-900">{address.title || addressTypeLabels[address.type]}</span>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2 text-gray-700">
                    <HiOutlineUser className="w-4 h-4 text-gray-400" />
                    {address.recipientName}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <HiOutlinePhone className="w-4 h-4 text-gray-400" />
                    {address.recipientPhone}
                  </p>
                  <p className="flex items-start gap-2 text-gray-600">
                    <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{address.fullAddress}, {address.neighborhood}, {address.district}/{address.province}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(address);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#e05a4c] transition-colors"
                  >
                    <HiOutlinePencil className="w-3.5 h-3.5" />
                    Düzenle
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAddress(address.id);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  )}
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateAddress(address.id, { isDefault: true });
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#549658] transition-colors ml-auto"
                    >
                      <HiOutlineStar className="w-3.5 h-3.5" />
                      Varsayılan Yap
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isFormOpen && addresses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-[#e05a4c]/10 rounded-2xl flex items-center justify-center">
            <HiOutlineLocationMarker className="w-8 h-8 text-[#e05a4c]" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Kayıtlı Adres Yok</h4>
          <p className="text-sm text-gray-500 mb-6">Henüz kayıtlı bir adresiniz bulunmuyor</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#cd3f31] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all"
          >
            <HiOutlinePlus className="w-5 h-5" />
            İlk Adresini Ekle
          </button>
        </motion.div>
      )}

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  {editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
                </h4>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Adres Tipi</label>
                <div className="flex gap-2">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${formData.type === type 
                          ? 'border-[#e05a4c] bg-[#e05a4c]/5 text-[#e05a4c]' 
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }
                      `}
                    >
                      {addressTypeIcons[type]}
                      {addressTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Adres Başlığı</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Örn: Evim, İş yerim"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#e05a4c]/10 focus:border-[#e05a4c] transition-all"
                />
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Alıcı Adı Soyadı *</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.recipientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Ad Soyad"
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#e05a4c]/10 focus:border-[#e05a4c] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon *</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      placeholder="5XX XXX XX XX"
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#e05a4c]/10 focus:border-[#e05a4c] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address Selector */}
              <AddressSelector
                selectedProvince={formData.province}
                selectedDistrict={formData.district}
                selectedNeighborhood={formData.neighborhood}
                onProvinceChange={(name, id) => setFormData(prev => ({ ...prev, province: name, provinceId: id }))}
                onDistrictChange={(name, id) => setFormData(prev => ({ ...prev, district: name, districtId: id }))}
                onNeighborhoodChange={(name) => setFormData(prev => ({ ...prev, neighborhood: name }))}
              />

              {/* Full Address */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Açık Adres *</label>
                <textarea
                  value={formData.fullAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  placeholder="Sokak, bina no, daire no, kat bilgileri..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#e05a4c]/10 focus:border-[#e05a4c] transition-all resize-none"
                />
              </div>

              {/* Default Address Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${formData.isDefault ? 'bg-[#549658]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isDefault ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-gray-700">Bu adresi varsayılan olarak kaydet</span>
              </label>

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formData.recipientName || !formData.province || !formData.district || !formData.fullAddress}
                  className="flex-1 py-3 bg-gradient-to-r from-[#e05a4c] to-[#cd3f31] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#e05a4c]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Billing Address Option */}
      {showBillingOption && selectedAddressId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-100"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => handleBillingToggle(!sameAsBilling)}
              className={`relative w-11 h-6 rounded-full transition-colors ${sameAsBilling ? 'bg-[#549658]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sameAsBilling ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Fatura adresi teslimat adresiyle aynı</p>
              <p className="text-xs text-gray-500">Farklı bir fatura adresi kullanmak için kapatın</p>
            </div>
          </label>

          {!sameAsBilling && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-blue-100"
            >
              <p className="text-sm font-medium text-gray-700 mb-3">Fatura Adresi Seçin</p>
              <div className="space-y-2">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => onBillingAddressChange?.(address, false)}
                    className={`
                      w-full text-left p-3 rounded-lg border-2 transition-all text-sm
                      ${billingAddress?.id === address.id 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="font-medium">{address.title || addressTypeLabels[address.type]}</span>
                    <span className="text-gray-500"> - {address.district}/{address.province}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
