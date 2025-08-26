export interface ChatMessage {
  role: 'user' | 'ai' | 'system' | 'thinking';
  content: string;
  timestamp?: Date;
}

export interface ProductOverview {
  productId: number;
  productName: string;
  description: string;
  brandName: string;
  categoryName: string;
  targetAudience: string;
  materialName: string;
  minPrice: number;
  maxPrice: number;
  minSalePrice?: number;
  totalStock: number;
  totalSold: number;
  purchases: number;
  availableColors: string;
  availableSizes: string;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  isFeatured: boolean;
  hasPromotion: boolean;
}

export interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}
