import { StarIcon, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

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

interface ReviewSectionProps {
    productId: number;
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

export default function ReviewSection({ productId, onReviewStatsChange }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [overallRating, setOverallRating] = useState<number | null>(null);
    const [totalReviewsCount, setTotalReviewsCount] = useState(0); // Internal state for this component's title/display
    const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
    const [showReviewForm, setShowReviewForm] = useState(false);

    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewComment, setNewReviewComment] = useState("");
    const [newReviewName, setNewReviewName] = useState("");
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    const [nameError, setNameError] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [ratingError, setRatingError] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

    const updateOverallStats = useCallback((currentReviews: Review[]) => {
        const count = currentReviews.length;
        setTotalReviewsCount(count); // Update internal count

        let totalRating = 0;
        let average = 0.0;
        const distribution = [0, 0, 0, 0, 0];

        if (count > 0) {
            totalRating = currentReviews.reduce((sum, r) => sum + r.rating, 0);
            average = totalRating / count;
            setOverallRating(average);

            currentReviews.forEach(r => {
                if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
            });
            setRatingDistribution(distribution);
        } else {
            setOverallRating(0);
            setRatingDistribution([0, 0, 0, 0, 0]);
        }

        // Call the prop to send stats to the parent
        onReviewStatsChange?.({ totalReviews: count, averageRating: average });
    }, [onReviewStatsChange]);

    const fetchReviews = useCallback(() => {
        setLoading(true);
        try {
            // Using localStorage for mock data
            const stored = localStorage.getItem(`productReviews_${productId}`);
            const fetchedReviews: Review[] = stored ? JSON.parse(stored) : [];
            fetchedReviews.sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
            setReviews(fetchedReviews);
            updateOverallStats(fetchedReviews);
            setCurrentPage(1); // Reset to first page when reviews are fetched
        } catch (error) {
            console.error("Failed to fetch reviews from localStorage:", error);
            setReviews([]);
            setOverallRating(0);
            setTotalReviewsCount(0);
            setRatingDistribution([0, 0, 0, 0, 0]);
            setCurrentPage(1); // Reset to first page on error
        } finally {
            setLoading(false);
        }
    }, [productId, updateOverallStats]);

    useEffect(() => {
        fetchReviews();
    }, [productId, fetchReviews]); // Add fetchReviews to dependency array

    useEffect(() => {
        if (!loading) {
            localStorage.setItem(`productReviews_${productId}`, JSON.stringify(reviews));
        }
        // If current page becomes out of bounds after an update (e.g., deleting last review on a page)
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0 && currentPage !== 1) { // Ensure page is 1 if no reviews
            setCurrentPage(1);
        }
    }, [reviews, productId, loading, currentPage, totalPages]);

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

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        let hasError = false;
        setNameError(null);
        setCommentError(null);
        setRatingError(null);

        if (newReviewRating === 0) {
            setRatingError("Vui lòng chọn số sao đánh giá.");
            hasError = true;
        }
        if (!newReviewComment.trim()) {
            setCommentError("Vui lòng nhập nhận xét.");
            hasError = true;
        }
        if (!newReviewName.trim()) {
            setNameError("Vui lòng nhập tên.");
            hasError = true;
        }

        if (hasError) return;

        if (editingReviewId) {
            const updated = reviews.map(r =>
                r.id === editingReviewId
                    ? { ...r, rating: newReviewRating, comment: newReviewComment, customerName: newReviewName }
                    : r
            );
            setReviews(updated);
            updateOverallStats(updated);
        } else {
            const newReview: Review = {
                id: `user-review-${Date.now()}`,
                rating: newReviewRating,
                comment: newReviewComment,
                customerName: newReviewName,
                isPurchased: false,
                createdAt: new Date().toISOString(),
            };
            const updated = [newReview, ...reviews];
            updated.sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
            setReviews(updated);
            updateOverallStats(updated);
            setCurrentPage(1); // Go to the first page when a new review is added
        }

        setNewReviewRating(0);
        setNewReviewComment("");
        setNewReviewName("");
        setEditingReviewId(null);
        setShowReviewForm(false);
    };

    const handleEditReview = (r: Review) => {
        setNewReviewRating(r.rating);
        setNewReviewComment(r.comment);
        setNewReviewName(r.customerName);
        setEditingReviewId(r.id);
        setShowReviewForm(true);
        setNameError(null);
        setCommentError(null);
        setRatingError(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteReview = (id: string) => {
        if (confirm("Bạn có chắc muốn xóa đánh giá này?")) {
            const updated = reviews.filter(r => r.id !== id);
            setReviews(updated);
            updateOverallStats(updated);
            // currentPage state will be adjusted by the useEffect after reviews update
        }
    };

    const handleCancelReviewForm = () => {
        setShowReviewForm(false);
        setNewReviewRating(0);
        setNewReviewComment("");
        setNewReviewName("");
        setEditingReviewId(null);
        setNameError(null);
        setCommentError(null);
        setRatingError(null);
    };

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

                <button
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 ml-auto"
                    onClick={() => {
                        setShowReviewForm(true);
                        setEditingReviewId(null);
                        setNewReviewName("");
                        setNewReviewComment("");
                        setNewReviewRating(0);
                        setNameError(null);
                        setCommentError(null);
                        setRatingError(null);
                    }}
                >
                    VIẾT NHẬN XÉT
                </button>
            </div>

            {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-md border mb-6">
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Số sao đánh giá:</label>
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon
                                    key={i}
                                    size={28}
                                    onClick={() => { setNewReviewRating(i + 1); setRatingError(null); }}
                                    // Form review stars - solid amber for selected, light gray for unselected
                                    className={`cursor-pointer ${i < newReviewRating ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-300"}`}
                                />
                            ))}
                        </div>
                        {ratingError && <p className="text-red-500 text-sm mt-1">{ratingError}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Nhận xét:</label>
                        <textarea
                            className={`w-full rounded p-2 border ${commentError ? "border-red-500" : "border-gray-300"}`}
                            rows={4}
                            value={newReviewComment}
                            onChange={(e) => { setNewReviewComment(e.target.value); setCommentError(null); }}
                        />
                        {commentError && <p className="text-red-500 text-sm mt-1">{commentError}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Tên của bạn:</label>
                        <input
                            type="text"
                            className={`w-full rounded p-2 border ${nameError ? "border-red-500" : "border-gray-300"}`}
                            value={newReviewName}
                            onChange={(e) => { setNewReviewName(e.target.value); setNameError(null); }}
                        />
                        {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={handleCancelReviewForm} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                            {editingReviewId ? "Cập nhật" : "Gửi đánh giá"}
                        </button>
                    </div>
                </form>
            )}

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
                                    <div className="ml-auto flex gap-2">
                                        <button onClick={() => handleEditReview(r)} className="text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteReview(r.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
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
            {!loading && reviews.length === 0 && !showReviewForm && (
                <p className="text-center italic text-gray-500 py-6">Chưa có đánh giá nào cho sản phẩm này.</p>
            )}
        </div>
    );
}

