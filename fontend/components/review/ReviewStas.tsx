import React from 'react';
import { ReviewStatsDTO } from '../../types/review';

interface Props {
    stats: ReviewStatsDTO | null;
}

const ReviewStats: React.FC<Props> = ({ stats }) => {
    if (!stats) return <p>Đang tải thống kê đánh giá...</p>;

    return (
        <div className="mb-6">
            <h4 className="text-xl font-semibold">Đánh giá sản phẩm</h4>
            <p className="text-gray-600">Điểm trung bình: {stats.averageRating.toFixed(1)} / 5</p>
            <p className="text-gray-600">{stats.totalReviews} lượt đánh giá</p>
            <ul className="mt-2 space-y-1">
                {stats.starDistribution.map((percent, i) => (
                    <li key={i}>
                        <span className="font-medium">{5 - i} sao:</span> {percent}%
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ReviewStats;
