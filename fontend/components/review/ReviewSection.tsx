'use client';

import React, { useEffect, useState } from 'react';
import ReviewStats from './ReviewStas';
import ReviewForm from './ReviewForm';
import { ReviewStatsDTO } from '../../types/review';

interface Props {
    productId: number;
    productVariantId?: number;
}

export default function ReviewSection({ productId, productVariantId }: Props) {
    const [stats, setStats] = useState<ReviewStatsDTO | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/products/${productId}/review-stats`, {
                credentials: 'include',
            });
            const json = await res.json();
            setStats(json);
        } catch (e) {
            console.error('Lỗi khi tải thống kê đánh giá:', e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [productId]);

    return (
        <div className="p-4 space-y-4">
            <ReviewStats stats={stats} />
            {productVariantId ? (
                <ReviewForm
                    productId={productId}
                    productVariantId={productVariantId}
                    onSubmitted={fetchStats}
                />
            ) : (
                <p className="text-sm text-gray-500 italic">
                    Vui lòng chọn màu và kích cỡ để đánh giá sản phẩm.
                </p>
            )}
        </div>
    );
}
