'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/app/yonetim/ThemeContext';
import { 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineReply,
  HiOutlinePhotograph,
  HiOutlineFilter,
  HiOutlineClock,
  HiOutlineEye,
} from 'react-icons/hi';
import type { Review } from '@/lib/supabase/reviewTypes';

export default function DegerlendirmelerPage() {
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [sellerResponse, setSellerResponse] = useState('');
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);

  const cardClasses = isDark 
    ? 'bg-neutral-900 border-neutral-800' 
    : 'bg-white border-gray-200';
  const textClasses = isDark ? 'text-white' : 'text-gray-900';
  const textMutedClasses = isDark ? 'text-neutral-400' : 'text-gray-500';

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filter === 'pending') {
        params.append('isApproved', 'false');
      } else if (filter === 'approved') {
        params.append('isApproved', 'true');
      }
      params.append('sortBy', 'newest');
      params.append('limit', '100');

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Değerlendirme onaylandı');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!confirm('Bu değerlendirmeyi reddetmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Değerlendirme silindi');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleSellerResponse = async () => {
    if (!selectedReview || !sellerResponse.trim()) return;

    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerResponse: {
            message: sellerResponse,
            respondedBy: 'Admin',
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Yanıt gönderildi');
        setSelectedReview(null);
        setSellerResponse('');
        fetchReviews();
      }
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleBulkApprove = async () => {
    if (bulkSelected.length === 0) return;

    try {
      await Promise.all(
        bulkSelected.map(id =>
          fetch(`/api/reviews/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isApproved: true }),
          })
        )
      );

      alert(`${bulkSelected.length} değerlendirme onaylandı`);
      setBulkSelected([]);
      fetchReviews();
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`${bulkSelected.length} değerlendirmeyi silmek istediğinizden emin misiniz?`)) return;

    try {
      await Promise.all(
        bulkSelected.map(id =>
          fetch(`/api/reviews/${id}`, { method: 'DELETE' })
        )
      );

      alert(`${bulkSelected.length} değerlendirme silindi`);
      setBulkSelected([]);
      fetchReviews();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Bir hata oluştu');
    }
  };

  const toggleBulkSelect = (reviewId: string) => {
    setBulkSelected(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiOutlineStar
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl lg:text-3xl font-bold mb-2 ${textClasses}`}>
          Değerlendirmeler
        </h1>
        <p className={textMutedClasses}>
          Müşteri yorumlarını yönetin ve yanıtlayın
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl p-6 ${cardClasses} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textMutedClasses}>Toplam</p>
              <p className={`text-2xl font-bold ${textClasses}`}>{reviews.length}</p>
            </div>
            <HiOutlineEye className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${cardClasses} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textMutedClasses}>Onay Bekliyor</p>
              <p className={`text-2xl font-bold text-yellow-500`}>{pendingCount}</p>
            </div>
            <HiOutlineClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className={`rounded-xl p-6 ${cardClasses} border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textMutedClasses}>Onaylandı</p>
              <p className={`text-2xl font-bold text-green-500`}>{approvedCount}</p>
            </div>
            <HiOutlineCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : isDark
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Onay Bekleyenler
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : isDark
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Onaylananlar
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tümü
          </button>
        </div>

        {/* Bulk Actions */}
        {bulkSelected.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Seçilenleri Onayla ({bulkSelected.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Seçilenleri Sil
            </button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : reviews.length === 0 ? (
        <div className={`text-center py-12 ${cardClasses} border rounded-xl`}>
          <p className={textMutedClasses}>Değerlendirme bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 ${cardClasses} border`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={bulkSelected.includes(review.id)}
                  onChange={() => toggleBulkSelect(review.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300"
                />

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${textClasses}`}>
                          {review.customerName || 'Anonim'}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            Doğrulanmış Alım
                          </span>
                        )}
                        {!review.isApproved && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                            Onay Bekliyor
                          </span>
                        )}
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <span className={`text-sm ${textMutedClasses}`}>
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  {/* Product */}
                  <Link 
                    href={`/yonetim/urunler/${review.productId}`}
                    className={`text-sm ${textMutedClasses} hover:underline mb-2 inline-block`}
                  >
                    Ürün: {review.productName}
                  </Link>

                  {/* Title & Comment */}
                  <h4 className={`font-semibold text-lg mb-2 ${textClasses}`}>
                    {review.title}
                  </h4>
                  <p className={textMutedClasses}>{review.comment}</p>

                  {/* Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <HiOutlinePhotograph className="w-5 h-5 text-blue-500" />
                      <span className={`text-sm ${textMutedClasses}`}>
                        {review.photos.length} fotoğraf
                      </span>
                    </div>
                  )}

                  {/* Seller Response */}
                  {review.sellerResponse && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Satıcı Yanıtı</p>
                      <p className="text-sm text-blue-800">{review.sellerResponse.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!review.isApproved && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <HiOutlineCheckCircle className="w-4 h-4" />
                        Onayla
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setSellerResponse(review.sellerResponse?.message || '');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <HiOutlineReply className="w-4 h-4" />
                      Yanıtla
                    </button>

                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl rounded-2xl p-6 ${cardClasses}`}
          >
            <h3 className={`text-xl font-bold mb-4 ${textClasses}`}>
              Değerlendirmeye Yanıt Ver
            </h3>

            <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
              <p className={`font-semibold mb-2 ${textClasses}`}>{selectedReview.title}</p>
              <p className={textMutedClasses}>{selectedReview.comment}</p>
            </div>

            <textarea
              value={sellerResponse}
              onChange={(e) => setSellerResponse(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl min-h-[120px] ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Yanıtınızı yazın..."
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setSellerResponse('');
                }}
                className={`px-6 py-2 rounded-xl font-medium ${
                  isDark
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                İptal
              </button>
              <button
                onClick={handleSellerResponse}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Gönder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
