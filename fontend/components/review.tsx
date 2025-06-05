"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Skeleton,
    Divider,
    Progress,
    Pagination,
    Chip,
} from "@heroui/react";
import {
    StarIcon,
    UserCircleIcon,
    ChatBubbleLeftRightIcon,
    CalendarDaysIcon,
    CubeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid"; // For filled stars

// Define interfaces based on your backend DTOs
interface ReviewDTO {
    rating: number;
    comment: string;
    createdAt: string; // Changed from LocalDateTime to string for frontend display
    customerName: string;
    customerAvatar: string | null;
    productVariation: string; // Assuming this is SKU
}

interface ReviewStatsDTO {
    averageRating: number;
    totalReviews: number;
    totalPages: number;
    starDistribution: number[]; // Array of percentages for 1-5 stars, e.g., [10, 20, 0, 30, 40]
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

interface ProductReviewsProps {
    productId: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
    const [reviews, setReviews] = useState<ReviewDTO[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStatsDTO | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch review statistics
    const fetchReviewStats = useCallback(async () => {
        setLoadingStats(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8080/api/products/${productId}/review-stats`);
            if (!response.ok) {
                throw new Error('Failed to fetch review statistics');
            }
            const apiResponse: ApiResponse<ReviewStatsDTO> = await response.json();
            if (apiResponse.status === 200 && apiResponse.data) {
                setReviewStats(apiResponse.data);
            } else {
                throw new Error(apiResponse.message || 'Failed to fetch review statistics');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching stats');
        } finally {
            setLoadingStats(false);
        }
    }, [productId]);

    // Function to fetch reviews for a specific page
    const fetchReviews = useCallback(async (page: number) => {
        setLoadingReviews(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8080/api/products/${productId}/reviews?page=${page}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }
            const apiResponse: ApiResponse<ReviewDTO[]> = await response.json();
            if (apiResponse.status === 200 && apiResponse.data) {
                setReviews(apiResponse.data);
            } else {
                throw new Error(apiResponse.message || 'Failed to fetch reviews');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching reviews');
        } finally {
            setLoadingReviews(false);
        }
    }, [productId]);

    // Initial data fetch on component mount
    useEffect(() => {
        fetchReviewStats();
        fetchReviews(currentPage);
    }, [fetchReviewStats, fetchReviews, currentPage]);

    // Handle page change for reviews
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Helper to render star rating
    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<SolidStarIcon key={i} className="w-5 h-5 text-yellow-400" />);
            } else {
                stars.push(<StarIcon key={i} className="w-5 h-5 text-gray-300" />);
            }
        }
        return <div className="flex">{stars}</div>;
    };

    // Helper to render star distribution bars
    const renderStarDistribution = () => {
        if (!reviewStats || reviewStats.starDistribution.length === 0) {
            return (
                <div className="text-center text-default-500">
                    Chưa có đánh giá nào để hiển thị phân phối sao.
                </div>
            );
        }

        // The backend `starDistribution` is indexed from 0 (1-star) to 4 (5-star)
        // We want to display from 5-star down to 1-star
        const starOrder = [5, 4, 3, 2, 1]; // Visual order for display

        return (
            <div className="space-y-2">
                {starOrder.map((star, index) => {
                    // Adjust index for starDistribution array (5-star is index 4, 1-star is index 0)
                    const distIndex = star - 1;
                    const percentage = reviewStats.starDistribution[distIndex];
                    return (
                        <div key={star} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-8 text-right">{star} sao</span>
                            <Progress
                                aria-label={`${star} star distribution`}
                                value={percentage}
                                className="flex-grow"
                                color="warning"
                                size="sm"
                            />
                            <span className="text-sm text-default-500 w-10 text-right">{percentage}%</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <div className="text-danger text-xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
                        <p className="text-default-500">{error}</p>
                        <Button
                            color="primary"
                            variant="flat"
                            className="mt-4"
                            onClick={() => {
                                setError(null); // Clear error before retrying
                                fetchReviewStats();
                                fetchReviews(currentPage);
                            }}
                        >
                            Thử lại
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Đánh giá sản phẩm</h2>

            {/* Review Statistics Section */}
            <Card className="mb-8 p-6 shadow-md">
                <CardHeader className="flex items-center gap-2 text-xl font-semibold text-default-700">
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    Tổng quan đánh giá
                </CardHeader>
                <Divider className="my-4" />
                <CardBody>
                    {loadingStats ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-1/2 rounded-lg" />
                            <Skeleton className="h-6 w-1/3 rounded-lg" />
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-4 w-full rounded-lg" />
                                ))}
                            </div>
                        </div>
                    ) : (
                        reviewStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                {/* Average Rating */}
                                <div className="flex flex-col items-center justify-center p-4 bg-default-50 rounded-lg">
                                    <div className="text-5xl font-bold text-primary-600">
                                        {reviewStats.averageRating.toFixed(1)}
                                    </div>
                                    <div className="flex mt-2">
                                        {renderStars(Math.round(reviewStats.averageRating))}
                                    </div>
                                    <div className="text-default-600 mt-2">
                                        từ {reviewStats.totalReviews} đánh giá
                                    </div>
                                </div>

                                {/* Star Distribution */}
                                <div className="p-4 bg-default-50 rounded-lg">
                                    {renderStarDistribution()}
                                </div>
                            </div>
                        )
                    )}
                </CardBody>
            </Card>

            {/* Individual Reviews Section */}
            <h3 className="text-xl font-bold mb-4">Tất cả đánh giá ({reviewStats?.totalReviews || 0})</h3>
            {loadingReviews ? (
                <div className="grid grid-cols-1 gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                    <Skeleton className="h-3 w-24 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full mb-2 rounded-lg" />
                            <Skeleton className="h-4 w-5/6 rounded-lg" />
                            <Skeleton className="h-3 w-1/4 mt-3 rounded-lg" />
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {reviews.map((review, index) => (
                                <Card key={index} className="p-6 shadow-sm">
                                    <CardHeader className="flex items-center justify-between pb-3">
                                        <div className="flex items-center gap-3">
                                            {review.customerAvatar ? (
                                                <img
                                                    src={review.customerAvatar}
                                                    alt={review.customerName}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-default-200"
                                                />
                                            ) : (
                                                <UserCircleIcon className="w-10 h-10 text-default-400" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-default-800">
                                                    {review.customerName || 'Người dùng ẩn danh'}
                                                </span>
                                                <div className="flex items-center gap-1 text-sm text-default-500">
                                                    <CalendarDaysIcon className="w-4 h-4" />
                                                    <span>{review.createdAt}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </CardHeader>
                                    <CardBody className="py-2">
                                        <p className="text-default-700 mb-3">{review.comment}</p>
                                        {review.productVariation && (
                                            <Chip
                                                startContent={<CubeIcon className="w-4 h-4" />}
                                                variant="flat"
                                                color="default"
                                                size="sm"
                                            >
                                                Biến thể: {review.productVariation}
                                            </Chip>
                                        )}
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="max-w-md mx-auto mt-12">
                            <CardBody className="text-center py-12">
                                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Chưa có đánh giá nào</h3>
                                <p className="text-default-500">
                                    Hãy là người đầu tiên đánh giá sản phẩm này!
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {/* Pagination */}
                    {reviewStats && reviewStats.totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                            <Pagination
                                total={reviewStats.totalPages}
                                initialPage={1}
                                page={currentPage}
                                onChange={handlePageChange}
                                showControls
                                color="primary"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductReviews;
