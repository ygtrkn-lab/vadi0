'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle, 
  AlertCircle,
  Camera,
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import type { Review, ReviewStats } from '@/lib/supabase/reviewTypes';

interface ProductReviewsProps {
  productId: number;
  productName: string;
  currentCustomerId?: string;
  customerOrders?: string[]; // Order IDs for this customer
}

export default function ProductReviews({ 
  productId, 
  productName,
  currentCustomerId,
  customerOrders = []
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'helpful' | 'rating-high' | 'rating-low'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Review form state
  const [formData, setFormData] = useState({
    orderId: '',
    rating: 5,
    title: '',
    comment: '',
    pros: [''],
    cons: [''],
    photos: [] as string[],
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, sortBy, filterRating]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        productId: productId.toString(),
        isApproved: 'true',
        sortBy,
        ...(filterRating && { rating: filterRating.toString() }),
      });

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

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/reviews/stats/${productId}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, helpfulCount: data.data.helpfulCount, unhelpfulCount: data.data.unhelpfulCount }
            : r
        ));
      } else {
        alert(data.error || 'Oy kaydedilemedi');
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCustomerId) {
      window.location.href = '/giris';
      return;
    }

    if (!formData.orderId) {
      alert('Lütfen bir sipariş seçin');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerId: currentCustomerId,
          orderId: formData.orderId,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment,
          pros: formData.pros.filter(p => p.trim()),
          cons: formData.cons.filter(c => c.trim()),
          photos: formData.photos,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Değerlendirmeniz alındı! Onaylandıktan sonra yayınlanacaktır.');
        setShowReviewForm(false);
        setFormData({
          orderId: '',
          rating: 5,
          title: '',
          comment: '',
          pros: [''],
          cons: [''],
          photos: [],
        });
      } else {
        alert(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Bir hata oluştu');
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats || stats.totalReviews === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
          const percentage = (count / stats.totalReviews) * 100;

          return (
            <button
              key={rating}
              onClick={() => setFilterRating(filterRating === rating ? null : rating)}
              className={`flex items-center gap-3 w-full hover:bg-gray-50 p-3 rounded-xl transition-all ${
                filterRating === rating ? 'bg-gradient-to-r from-yellow-50 to-orange-50 shadow-sm' : ''
              }`}
            >
              <span className="text-sm font-semibold min-w-[65px] text-gray-700">{rating} yıldız</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 min-w-[45px] text-right">{count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-6 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e05a4c]/20 to-[#e05a4c]/5 rounded-2xl blur-xl"></div>
                  <div className="relative text-6xl font-black bg-gradient-to-br from-[#e05a4c] to-[#d04a3c] bg-clip-text text-transparent">
                    {stats.averageRating.toFixed(1)}
                  </div>
                </div>
                <div>
                  {renderStars(Math.round(stats.averageRating), 24)}
                  <p className="text-sm font-medium text-gray-600 mt-2">
                    <span className="font-bold text-gray-900">{stats.totalReviews}</span> müşteri değerlendirmesi
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {stats.verifiedPurchaseCount > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
                    <CheckCircle size={16} className="text-green-600" />
                    {stats.verifiedPurchaseCount} doğrulanmış
                  </span>
                )}
                {stats.withPhotosCount > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    <Camera size={16} />
                    {stats.withPhotosCount} fotoğraflı
                  </span>
                )}
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              {renderRatingDistribution()}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {currentCustomerId && customerOrders.length > 0 && (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="w-full py-3 px-6 bg-white border-2 border-gray-200 rounded-xl font-medium 
            hover:border-[#e05a4c] hover:text-[#e05a4c] transition-all"
        >
          {showReviewForm ? 'İptal' : 'Değerlendirme Yaz'}
        </button>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitReview}
            className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-semibold">Değerlendirmenizi Paylaşın</h3>

            {/* Order Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Sipariş Seçin</label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl"
                required
              >
                <option value="">Sipariş seçin</option>
                {customerOrders.map((orderId) => (
                  <option key={orderId} value={orderId}>
                    Sipariş #{orderId}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Puan</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      size={32}
                      className={star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Başlık</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl"
                placeholder="Örn: Harika bir ürün!"
                required
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">Yorumunuz</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl min-h-[100px]"
                placeholder="Deneyiminizi paylaşın..."
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-6 bg-[#e05a4c] text-white rounded-xl font-semibold 
                hover:opacity-90 transition-all"
            >
              Gönder
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={18} className="text-gray-500" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
        >
          <option value="newest">En Yeni</option>
          <option value="helpful">En Yararlı</option>
          <option value="rating-high">Yüksek Puan</option>
          <option value="rating-low">Düşük Puan</option>
        </select>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
          >
            {filterRating} yıldız <X size={14} />
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-inner">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#e05a4c]/20 to-[#e05a4c]/5 rounded-full blur-xl"></div>
              <AlertCircle size={64} className="relative text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Değerlendirme Yok</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Bu ürün için henüz müşteri değerlendirmesi bulunmuyor. İlk değerlendirmeyi siz yapın!
            </p>
            {currentCustomerId && customerOrders.length > 0 && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e05a4c] to-[#d04a3c] text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <Star size={18} className="fill-current" />
                İlk Değerlendirmeyi Yap
              </button>
            )}
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.customerName || 'Anonim'}</span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={12} />
                        Doğrulanmış Alım
                      </span>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-semibold text-lg mb-2">{review.title}</h4>

              {/* Comment */}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImages(review.photos);
                        setSelectedImageIndex(idx);
                        setImageModalOpen(true);
                      }}
                      className="relative w-20 h-20 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={photo}
                        alt={`Review ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Helpful Votes */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleVote(review.id, 'helpful')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <ThumbsUp size={16} />
                  <span>Yararlı ({review.helpfulCount || 0})</span>
                </button>
                <button
                  onClick={() => handleVote(review.id, 'unhelpful')}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <ThumbsDown size={16} />
                  <span>Yararlı Değil ({review.unhelpfulCount || 0})</span>
                </button>
              </div>

              {/* Seller Response */}
              {review.sellerResponse && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Satıcı Yanıtı</p>
                  <p className="text-sm text-blue-800">{review.sellerResponse.message}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    {new Date(review.sellerResponse.respondedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {imageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setImageModalOpen(false)}
          >
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
            >
              <X size={24} />
            </button>
            <div className="relative w-full max-w-4xl aspect-square">
              <Image
                src={selectedImages[selectedImageIndex]}
                alt="Review"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
