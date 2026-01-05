// Review System Types for Vadiler E-commerce

export interface Review {
  id: string;
  productId: number;
  product_id?: number; // snake_case from DB
  customerId: string;
  customer_id?: string; // snake_case from DB
  orderId: string | null;
  order_id?: string | null; // snake_case from DB
  rating: number; // 1-5
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  photos: string[];
  isVerifiedPurchase: boolean;
  is_verified_purchase?: boolean; // snake_case from DB
  isApproved: boolean;
  is_approved?: boolean; // snake_case from DB
  helpfulCount: number;
  helpful_count?: number; // snake_case from DB
  unhelpfulCount: number;
  unhelpful_count?: number; // snake_case from DB
  sellerResponse: SellerResponse | null;
  seller_response?: SellerResponse | null; // snake_case from DB
  createdAt: string;
  created_at?: string; // snake_case from DB
  updatedAt: string;
  updated_at?: string; // snake_case from DB
  
  // Populated fields (joined data)
  customerName?: string;
  customer_name?: string;
  productName?: string;
  product_name?: string;
}

export interface SellerResponse {
  message: string;
  respondedBy: string;
  respondedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchaseCount: number;
  withPhotosCount: number;
}

export interface ReviewFilters {
  productId?: number;
  customerId?: string;
  rating?: number;
  isApproved?: boolean;
  isVerifiedPurchase?: boolean;
  hasPhotos?: boolean;
  sortBy?: 'newest' | 'oldest' | 'helpful' | 'rating-high' | 'rating-low';
  limit?: number;
  offset?: number;
}

export interface CreateReviewInput {
  productId: number;
  customerId: string;
  orderId?: string; // Opsiyonel - otomatik doğrulanıyor
  rating: number;
  title: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  photos?: string[];
}

export interface UpdateReviewInput {
  title?: string;
  comment?: string;
  pros?: string[];
  cons?: string[];
  photos?: string[];
}

export interface ReviewVoteInput {
  reviewId: string;
  voteType: 'helpful' | 'unhelpful';
  voterId: string; // IP or customer ID
}
