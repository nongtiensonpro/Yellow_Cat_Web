import React, { useEffect, useState } from 'react';
import { fetchReviews, fetchStats } from '../../api/reviewApi';
import { ReviewDTO, ReviewStatsDTO } from '../../types/review';
import ReviewForm from './ReviewForm';
import ReviewStats from './ReviewStas';

interface Props {
    productId: number;
    productVariantId: number;
}

const ReviewList: React.FC<Props> = ({ productId, productVariantId }) => {
    const [reviews, setReviews] = useState<ReviewDTO[]>([]);
    const [stats, setStats] = useState<ReviewStatsDTO | null>(null);
    const [page, setPage] = useState<number>(1);

    const loadReviews = async () => {
        try {
            const res = await fetchReviews(productId, page);
            setReviews(res.data);
        } catch (error) {
            console.error("Lỗi tải danh sách đánh giá:", error);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetchStats(productId);
            setStats(res.data);
        } catch (error) {
            console.error("Lỗi tải thống kê đánh giá:", error);
        }
    };

    const refresh = () => {
        loadReviews();
        loadStats();
    };

    useEffect(() => {
        refresh();
    }, [page]);

    return (
        <div>
            <ReviewStats stats={stats} />
            <ReviewForm
                productId={productId}
                productVariantId={productVariantId}
                onSubmitted={refresh}
            />


            <h4 className="mt-6 font-semibold text-lg">Danh sách đánh giá</h4>
            {reviews.length === 0 ? (
                <p>Chưa có đánh giá</p>
            ) : (
                reviews.map((r, idx) => (
                    <div key={idx} className="border-b py-3">
                        <strong>{r.customerName}</strong> - {r.rating} ⭐
                        <p>{r.comment}</p>
                        <small>{r.createdAt && new Date(r.createdAt).toLocaleString()}</small>
                    </div>
                ))
            )}
        </div>
    );
};

export default ReviewList;
