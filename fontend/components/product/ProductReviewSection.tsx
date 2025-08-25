'use client';

import { Card, CardHeader, CardBody, Divider, Badge } from '@heroui/react';
import ReviewSection from '@/components/review/ReviewSection';
import { useState } from 'react';

interface ProductReviewSectionProps {
    productId: number;
    productName: string;
}

const ProductReviewSection = ({ productId, productName }: ProductReviewSectionProps) => {
    const [reviewCount, setReviewCount] = useState(0);

    const handleReviewStatsChange = (stats: { totalReviews: number; averageRating: number }) => {
        setReviewCount(stats.totalReviews);
    };

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-warning-100 to-warning-200 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-warning-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Đánh giá sản phẩm</h2>
                            <p className="text-sm text-default-500">Ý kiến từ khách hàng đã mua</p>
                        </div>
                    </div>
                    <Badge color="warning" variant="flat" size="lg" className="font-semibold">
                        {reviewCount} đánh giá
                    </Badge>
                </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-6">
                <ReviewSection
                    productId={productId}
                    onReviewStatsChange={handleReviewStatsChange}
                />
            </CardBody>
        </Card>
    );
};

export default ProductReviewSection;
