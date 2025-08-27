import { StarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import AIReviewSummary from "./AIReviewSummary";

const API_BASE_URL = 'http://localhost:8080';

interface Review {
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    customerAvatar?: string;
    isPurchased: boolean;
    imageUrl?: string;
    createdAt?: string;
}

// API Response interfaces
interface ApiReview {
    id: number;
    rating: number;
    comment: string | null;
    customerName: string | null;
    customerAvatar?: string;
    isPurchased: boolean | null;
    imageUrl?: string;
    createdAt: string;
}

interface ApiReviewsResponse {
    reviews: ApiReview[];
}

interface StarDistributionItem {
    star: number;
    count: number;
}

interface ApiStatsResponse {
    averageRating: number;
    totalReviews: number;
    starDistribution: StarDistributionItem[];
}

interface ProductInfoForAI {
    productId: number;
    productName: string;
    brandName?: string;
    categoryName?: string;
    materialName?: string;
    targetAudienceName?: string;
}

interface ReviewSectionProps {
    productId: number;
    productInfo?: ProductInfoForAI;
    // Updated: Now sends an object with totalReviews and averageRating
    onReviewStatsChange?: (stats: { totalReviews: number; averageRating: number }) => void;
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const REVIEWS_PER_PAGE = 5; // Define how many reviews to show per page

export default function ReviewSection({ productId, productInfo, onReviewStatsChange }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [overallRating, setOverallRating] = useState<number | null>(null);
    const [totalReviewsCount, setTotalReviewsCount] = useState(0); // Internal state for this component's title/display
    const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);


    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);



    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch reviews from API
            const [reviewsResponse, statsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/reviews?productId=${productId}&page=0&limit=100`),
                fetch(`${API_BASE_URL}/api/reviews/stats?productId=${productId}`)
            ]);

            if (reviewsResponse.ok && statsResponse.ok) {
                const reviewsData: ApiReviewsResponse = await reviewsResponse.json();
                const statsData: ApiStatsResponse = await statsResponse.json();



                // Transform API data to match frontend interface
                const transformedReviews: Review[] = reviewsData.reviews.map((review: ApiReview) => ({
                    id: review.id.toString(),
                    rating: review.rating,
                    comment: review.comment || '',
                    customerName: review.customerName || 'Khách hàng',
                    customerAvatar: review.customerAvatar,
                    isPurchased: review.isPurchased || true,
                    imageUrl: review.imageUrl,
                    createdAt: review.createdAt
                }));

                setReviews(transformedReviews);
                setOverallRating(statsData.averageRating);
                setTotalReviewsCount(statsData.totalReviews);

                // Transform star distribution
                const distribution = [0, 0, 0, 0, 0];
                statsData.starDistribution.forEach((item: StarDistributionItem) => {
                    if (item.star >= 1 && item.star <= 5) {
                        distribution[item.star - 1] = item.count;
                    }
                });
                setRatingDistribution(distribution);

                // Call the prop to send stats to the parent
                onReviewStatsChange?.({ totalReviews: statsData.totalReviews, averageRating: statsData.averageRating });
            } else {
                console.error('API Response Error:');
                console.error('Reviews Response Status:', reviewsResponse.status, reviewsResponse.statusText);
                console.error('Stats Response Status:', statsResponse.status, statsResponse.statusText);
                
                throw new Error(`API Error - Reviews: ${reviewsResponse.status}, Stats: ${statsResponse.status}`);
            }
            setCurrentPage(1);
        } catch (error) {
            console.error("Failed to fetch reviews from API:", error);
            setReviews([]);
            setOverallRating(0);
            setTotalReviewsCount(0);
            setRatingDistribution([0, 0, 0, 0, 0]);
            setCurrentPage(1);
            onReviewStatsChange?.({ totalReviews: 0, averageRating: 0 });
        } finally {
            setLoading(false);
        }
    }, [productId, onReviewStatsChange]);

    useEffect(() => {
        fetchReviews();
    }, [productId, fetchReviews]); // Add fetchReviews to dependency array

    useEffect(() => {
        // If current page becomes out of bounds after an update
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0 && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [reviews, currentPage, totalPages]);

    // RENDER STARS - Adjusted for solid fill as per image, with gray for unfilled
    const renderStars = (rating: number, size: number = 16) => (
        <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                    key={i}
                    size={size}
                    // Solid amber for filled, light gray for unfilled
                    className={`${i < rating ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-300"}`}
                />
            ))}
        </div>
    );



    // Calculate reviews to display on the current page
    const indexOfLastReview = currentPage * REVIEWS_PER_PAGE;
    const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Logic to generate page numbers for pagination control (now always includes ellipses for many pages)
    const getPaginationPages = () => {
        const pages = [];
        const numVisiblePages = 3; // Number of page buttons around the current page (e.g., 1 ... 5 6 7 ... 100)
        const boundaryPages = 1; // Number of pages to show at the start/end (e.g., 1, lastPage)

        if (totalPages <= numVisiblePages + 2 * boundaryPages) {
            // If total pages are few, show all of them
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show the first page
            pages.push(1);

            // Calculate range around current page
            let startRange = Math.max(2, currentPage - Math.floor(numVisiblePages / 2));
            let endRange = Math.min(totalPages - 1, currentPage + Math.floor(numVisiblePages / 2));

            // Adjust range to ensure fixed number of visible pages around current if at boundaries
            if (currentPage - startRange < Math.floor(numVisiblePages / 2)) {
                endRange = Math.min(totalPages - 1, endRange + (Math.floor(numVisiblePages / 2) - (currentPage - startRange)));
            }
            if (endRange - currentPage < Math.floor(numVisiblePages / 2)) {
                startRange = Math.max(2, startRange - (Math.floor(numVisiblePages / 2) - (endRange - currentPage)));
            }

            // Add ellipsis if gap after first page
            if (startRange > 2) {
                pages.push("...");
            }

            // Add pages in the calculated range
            for (let i = startRange; i <= endRange; i++) {
                pages.push(i);
            }

            // Add ellipsis if gap before last page
            if (endRange < totalPages - 1) {
                pages.push("...");
            }

            // Always show the last page (if not already included)
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
                    <div className="bg-white p-6 rounded-md border shadow-sm">
            <h3 className="text-xl font-bold mb-6">Đánh giá sản phẩm ({totalReviewsCount})</h3>

            {/* AI Review Summary */}
            <AIReviewSummary reviews={reviews} productInfo={productInfo} />

            <div className="flex items-start gap-6 border-b pb-6 mb-6">
                <div className="text-center w-32">
                    <div className="text-5xl font-bold text-red-500">
                        {overallRating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="flex justify-center mt-1">
                        {/* Overall rating stars - using renderStars with calculated fill */}
                        {renderStars(Math.round(overallRating ?? 0), 20)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">({totalReviewsCount} đánh giá)</p>
                </div>

                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingDistribution[star - 1] || 0;
                        const percent = totalReviewsCount ? (count / totalReviewsCount) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2">
                                <span className="text-sm">{star}</span>
                                {/* Rating distribution stars - solid amber fill */}
                                <StarIcon size={16} className="fill-amber-500 text-amber-500" />
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <span className="text-sm w-8 text-right">({count})</span>
                            </div>
                        );
                    })}
                </div>


            </div>



            {!loading && reviews.length > 0 && (
                <div className="space-y-4">
                    {currentReviews.map(r => ( // Use currentReviews for display
                        <div key={r.id} className="flex gap-4 pb-4 border-b">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                {r.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {renderStars(r.rating)}
                                    <span className="text-xs text-gray-500">{formatDate(r.createdAt!)}</span>
                                </div>
                                <p className="font-semibold text-sm">{r.customerName}</p>
                                <p className="text-sm text-gray-700">{r.comment}</p>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls - Sử dụng icon cho "Trước" và "Sau" */}
                    {totalPages > 1 && (
                        <nav className="flex justify-center mt-6">
                            <ul className="inline-flex -space-x-px text-sm font-medium">
                                <li>
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} /> {/* Sử dụng icon thay chữ "Trước" */}
                                    </button>
                                </li>
                                {getPaginationPages().map((page, index) => (
                                    <li key={index}>
                                        {typeof page === "number" ? (
                                            <button
                                                onClick={() => paginate(page)}
                                                className={`flex items-center justify-center px-3 h-8 leading-tight border border-gray-300 ${
                                                    currentPage === page ? "bg-blue-50 text-blue-600 border-blue-300" : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-300 cursor-default">
                                                {page}
                                            </span>
                                        )}
                                    </li>
                                ))}
                                <li>
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} /> {/* Sử dụng icon thay chữ "Sau" */}
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            )}

            {loading && <p className="text-center text-gray-500 py-6">Đang tải đánh giá...</p>}
            {!loading && reviews.length === 0 && (
                <p className="text-center italic text-gray-500 py-6">Chưa có đánh giá nào cho sản phẩm này.</p>
            )}
        </div>
    );
}

