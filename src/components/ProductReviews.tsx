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
  const [votedReviews, setVotedReviews] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const autoReply = 'Kaliteli bir hizmet sunabilmek adına ilettiğiniz değerli geri bildiriminiz için VADİLER ailesi olarak teşekkür ediyoruz. Memnuniyetiniz bizler için önemlidir. İlginiz için teşekkür eder, iyi günler dileriz.';

  // Load voted reviews from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('votedReviews');
    if (stored) {
      try {
        setVotedReviews(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse voted reviews', e);
      }
    }
  }, []);

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
        limit: '200',
        offset: '0',
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
    // Check authentication
    if (!currentCustomerId) {
      alert('Oy vermek için giriş yapmalısınız.');
      window.location.href = '/giris';
      return;
    }

    // Check if already voted
    if (votedReviews[reviewId]) {
      alert('Bu değerlendirme için zaten oy kullandınız.');
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType, customerId: currentCustomerId }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setReviews(reviews.map(r => 
          r.id === reviewId 
            ? { ...r, helpfulCount: data.data.helpfulCount, unhelpfulCount: data.data.unhelpfulCount }
            : r
        ));
        
        // Mark as voted in localStorage
        const updated = { ...votedReviews, [reviewId]: voteType };
        setVotedReviews(updated);
        localStorage.setItem('votedReviews', JSON.stringify(updated));
      } else {
        alert(data.error || 'Oy kaydedilemedi');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCustomerId) {
      window.location.href = '/giris';
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerId: currentCustomerId,
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
              className={`flex items-center gap-2 w-full py-1 text-xs ${
                filterRating === rating ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="min-w-[40px]">{rating} yıldız</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="min-w-[24px] text-right text-gray-400">{count}</span>
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
    <div className="space-y-4">
      {/* Review Summary - Minimal */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-gray-100">
          {/* Average Rating - Compact */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</span>
            <div>
              {renderStars(Math.round(stats.averageRating), 14)}
              <p className="text-xs text-gray-500 mt-0.5">{stats.totalReviews} değerlendirme</p>
            </div>
          </div>
          
          {/* Badges - Inline */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {stats.verifiedPurchaseCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle size={12} className="text-green-600" />
                {stats.verifiedPurchaseCount} doğrulanmış
              </span>
            )}
          </div>
        </div>
      )}

      {/* Write Review Button - Minimal */}
      {currentCustomerId ? (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
        >
          {showReviewForm ? 'İptal' : 'Değerlendirme yaz'}
        </button>
      ) : (
        <a
          href="/giris"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Değerlendirme yazmak için giriş yapın
        </a>
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Değerlendirme Yaz</h3>

            {/* Rating */}
            <div className="mb-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-0.5"
                  >
                    <Star
                      size={20}
                      className={star <= formData.rating ? 'fill-gray-900 text-gray-900' : 'text-gray-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                placeholder="Başlık"
                required
              />
            </div>

            {/* Comment */}
            <div className="mb-3">
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg min-h-[80px] focus:outline-none focus:border-gray-400"
                placeholder="Deneyiminizi paylaşın..."
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              Gönder
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters - Minimal */}
      <div className="flex items-center gap-2 text-xs">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2 py-1 border border-gray-200 rounded text-gray-600 bg-transparent focus:outline-none"
        >
          <option value="newest">En Yeni</option>
          <option value="helpful">En Yararlı</option>
          <option value="rating-high">Yüksek Puan</option>
          <option value="rating-low">Düşük Puan</option>
        </select>

        {filterRating && (
          <button
            onClick={() => setFilterRating(null)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600"
          >
            {filterRating}★ <X size={10} />
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-0 divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Henüz değerlendirme yok</p>
            {currentCustomerId && customerOrders.length > 0 && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-2 text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
              >
                İlk değerlendirmeyi yap
              </button>
            )}
          </div>
        ) : (
          reviews.map((review, index) => (
            <div
              key={review.id}
              className="py-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{review.customerName || 'Anonim'}</span>
                  {review.isVerifiedPurchase && (
                    <span className="text-[10px] text-green-600">✓ Doğrulanmış</span>
                  )}
                  {renderStars(review.rating, 12)}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {/* Title */}
              {review.title && <p className="text-sm font-medium text-gray-900 mb-1">{review.title}</p>}

              {/* Comment */}
              <p className="text-sm text-gray-600 mb-3">{review.comment}</p>

              {/* Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-1.5 mb-3">
                  {review.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImages(review.photos);
                        setSelectedImageIndex(idx);
                        setImageModalOpen(true);
                      }}
                      className="relative w-12 h-12 rounded overflow-hidden"
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

              {/* Helpful Votes - Minimal */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <button
                  onClick={() => handleVote(review.id, 'helpful')}
                  disabled={!!votedReviews[review.id]}
                  className={`flex items-center gap-1 transition-colors ${
                    votedReviews[review.id] === 'helpful'
                      ? 'text-gray-900'
                      : votedReviews[review.id]
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:text-gray-600 cursor-pointer'
                  }`}
                >
                  <ThumbsUp size={12} className={votedReviews[review.id] === 'helpful' ? 'fill-current' : ''} />
                  <span>Yararlı ({review.helpfulCount || 0})</span>
                </button>
                <button
                  onClick={() => handleVote(review.id, 'unhelpful')}
                  disabled={!!votedReviews[review.id]}
                  className={`flex items-center gap-1 transition-colors ${
                    votedReviews[review.id] === 'unhelpful'
                      ? 'text-gray-900'
                      : votedReviews[review.id]
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:text-gray-600 cursor-pointer'
                  }`}
                >
                  <ThumbsDown size={12} className={votedReviews[review.id] === 'unhelpful' ? 'fill-current' : ''} />
                  <span>({review.unhelpfulCount || 0})</span>
                </button>
              </div>

              {/* Seller Response - Minimal */}
              {review.sellerResponse && (
                <div className="mt-3 pl-3 border-l-2 border-gray-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Satıcı:</span> {review.sellerResponse.message}
                  </p>
                </div>
              )}
            </div>
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
