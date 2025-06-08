'use client';

import React, { useState } from 'react';
import { CreateReviewDTO } from '../../types/review';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Props {
    productId: number;
    productVariantId: number;
    onSubmitted: () => void;
}

const ReviewForm: React.FC<Props> = ({ productId, productVariantId, onSubmitted }) => {
    const [rating, setRating] = useState<number>(5);
    const [comment, setComment] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const review: CreateReviewDTO = { productVariantId, rating, comment };

        try {
            setLoading(true);
            await axios.post(`/api/products/${productId}/reviews`, review, {
                withCredentials: true,
            });
            toast.success('🎉 Gửi đánh giá thành công!');
            setComment('');
            setRating(5);
            onSubmitted();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 mt-6">
            <h4 className="text-lg font-semibold">Viết đánh giá của bạn</h4>
            <div>
                <label className="block text-sm font-medium mb-1">Số sao:</label>
                <select
                    className="w-full border rounded px-3 py-2"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                >
                    {[5, 4, 3, 2, 1].map((star) => (
                        <option key={star} value={star}>{star} sao</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Bình luận:</label>
                <textarea
                    className="w-full border rounded px-3 py-2"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nhập nhận xét của bạn..."
                    rows={4}
                    maxLength={500}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
        </form>
    );
};

export default ReviewForm;
