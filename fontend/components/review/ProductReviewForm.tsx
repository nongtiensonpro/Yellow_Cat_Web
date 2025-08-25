"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CldImage } from "next-cloudinary";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    Card,
    CardBody,
    Divider
} from "@heroui/react";
import { Star, Send } from "lucide-react";

// Extend Session type để có accessToken
interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

interface ProductReviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    productImage?: string;
    onReviewSubmitted?: () => void;
}

interface CreateReviewRequest {
    productId: number;
    rating: number;
    comment?: string;
}

const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
    isOpen,
    onClose,
    productId,
    productName,
    productImage,
    onReviewSubmitted
}) => {
    const { data: session } = useSession();
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleRatingClick = (selectedRating: number) => {
        setRating(selectedRating);
    };

    const handleSubmit = async () => {
        if (!session) {
            setError('Bạn cần đăng nhập để đánh giá sản phẩm');
            return;
        }

        if (rating === 0) {
            setError('Vui lòng chọn số sao đánh giá');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const extendedSession = session as unknown as ExtendedSession;
            
            const reviewData: CreateReviewRequest = {
                productId,
                rating,
                comment: comment.trim() || undefined
            };

            const response = await fetch('http://localhost:8080/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${extendedSession.accessToken}`,
                },
                body: JSON.stringify(reviewData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Có lỗi xảy ra khi gửi đánh giá');
            }

            // Reset form
            setRating(0);
            setComment('');
            
            // Gọi callback nếu có
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }

            // Đóng modal
            onClose();
            
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể gửi đánh giá. Vui lòng thử lại sau.";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setHoverRating(0);
        setComment('');
        setError(null);
        onClose();
    };

    const getRatingText = (rating: number): string => {
        switch (rating) {
            case 1: return 'Rất tệ';
            case 2: return 'Tệ';
            case 3: return 'Bình thường';
            case 4: return 'Tốt';
            case 5: return 'Rất tốt';
            default: return '';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose}
            size="2xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">Đánh giá sản phẩm</h3>
                </ModalHeader>
                <ModalBody>
                    {/* Thông tin sản phẩm */}
                    <Card className="mb-4">
                        <CardBody>
                            <div className="flex gap-4">
                                {productImage && (
                                    <div className="flex-shrink-0">
                                        <CldImage
                                            width={64}
                                            height={64}
                                            src={productImage}
                                            alt={productName}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h4 className="font-medium text-default-800">{productName}</h4>
                                    <p className="text-sm text-default-500">Sản phẩm bạn đã mua</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Divider className="my-4" />

                    {/* Rating */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-base font-medium mb-3">Đánh giá của bạn</h4>
                            <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="transition-transform hover:scale-110"
                                        onClick={() => handleRatingClick(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        <Star
                                            size={32}
                                            className={`${
                                                star <= (hoverRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-default-300'
                                            } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {(hoverRating || rating) > 0 && (
                                <p className="text-sm text-default-600">
                                    {getRatingText(hoverRating || rating)}
                                </p>
                            )}
                        </div>

                        {/* Comment */}
                        <div>
                            <h4 className="text-base font-medium mb-3">Nhận xét (tùy chọn)</h4>
                            <Textarea
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={1000}
                                rows={4}
                                variant="bordered"
                                description={`${comment.length}/1000 ký tự`}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                                <p className="text-danger-600 text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button 
                        variant="ghost" 
                        onPress={handleClose}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                        startContent={!isSubmitting ? <Send size={16} /> : null}
                        disabled={rating === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ProductReviewForm;
