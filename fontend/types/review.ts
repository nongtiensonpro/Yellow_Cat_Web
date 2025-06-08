export interface CreateReviewDTO {
    productVariantId: number;
    rating: number;
    comment: string;
}

export interface ReviewDTO {
    rating: number;
    comment: string;
    createdAt: string;
    customerName: string;
    customerAvatar: string;
    productVariation: string;
}

export interface ReviewStatsDTO {
    averageRating: number;
    totalReviews: number;
}
