"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductReviewForm from '@/components/review/ProductReviewForm';
import { DollarSign, Star } from "lucide-react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Divider,
    Image
} from "@heroui/react";
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Package,
    Truck,
    ShoppingBag,
    User,
    FileText
} from "lucide-react";

// Extend Session type để có accessToken
interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

interface OrderItemDetail {
    orderItemId: number;
    orderId: number;
    quantity: number;
    priceAtPurchase: number;
    totalPrice: number;
    variantId: number;
    productId: number; // Thêm productId
    sku: string;
    productName: string;
    colorName: string;
    sizeName: string;
    materialName: string;
    brandName: string;
    categoryName: string;
    targetAudienceName: string;
    currentPrice: number;
    salePrice: number;
    imageUrl: string;
    weight: number;
    quantityInStock: number;
    // Thông tin promotion từ backend (flat structure)
    promotionCode?: string;
    promotionName?: string;
    discountAmount?: number;
    originalPrice?: number;
    // Computed property để backward compatibility
    bestPromo?: {
        promotionCode: string;
        promotionName: string;
        discountAmount: number;
    };
}

interface OrderDetailWithItems {
    orderId: number;
    orderCode: string;
    orderDate: string;
    orderStatus: string;
    customerName: string;
    phoneNumber: string;
    finalAmount: number;
    subTotalAmount: number;
    shippingFee: number;
    discountAmount: number;
    shippingMethod: string;
    recipientName: string;
    fullAddress: string;
    email: string;
    fullName: string;
    customerNotes: string;
    orderItems: OrderItemDetail[];
    totalItems: number;
    totalQuantity: number;
    // Thông tin voucher/mã giảm giá đã áp dụng (nếu có)
    appliedVoucherCode?: string;
    appliedVoucherName?: string;
    voucherType?: string;
    voucherValue?: number;
    voucherDescription?: string;
    voucherDiscountAmount?: number;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
    error?: string;
    path?: string;
}

export default function OrderDetailPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();

    const [orderDetail, setOrderDetail] = useState<OrderDetailWithItems | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
    const [selectedProductForReview, setSelectedProductForReview] = useState<{
        productId: number;
        productName: string;
        imageUrl?: string;
    } | null>(null);
    const [reviewableProducts, setReviewableProducts] = useState<Set<number>>(new Set());
    const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(new Set());
    const [userReviews, setUserReviews] = useState<Map<number, {
        rating: number;
        comment: string;
        reviewDate: string;
    }>>(new Map());

    // Kiểm tra orderCode sớm
    const orderCode = params?.orderCode as string | undefined;

    // Xử lý redirect nếu không có orderCode
    useEffect(() => {
        if (params && !orderCode) {
            router.push("http://localhost:3000/user_info/order");
        }
    }, [params, orderCode, router]);

    // Hàm lấy chi tiết đơn hàng
    const fetchOrderDetail = useCallback(async (orderCode: string): Promise<OrderDetailWithItems> => {
        // Kiểm tra accessToken trước khi gọi API
        if (!session) {
            throw new Error('Bạn cần đăng nhập để xem chi tiết đơn hàng');
        }

        const extendedSession = session as unknown as ExtendedSession;
        if (!extendedSession.accessToken) {
            throw new Error('Không tìm thấy access token');
        }

        const response = await fetch(`http://localhost:8080/api/orders/public/detail/${orderCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${extendedSession.accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy đơn hàng');
            }
            if (response.status === 403) {
                throw new Error('Bạn không có quyền xem đơn hàng này');
            }
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse<OrderDetailWithItems> = await response.json();

        // Debug: Log dữ liệu để kiểm tra (có thể xóa sau khi test xong)
        console.log('Order Detail API Response:', apiResponse);
        console.log('Voucher Info:', {
            appliedVoucherCode: apiResponse.data?.appliedVoucherCode,
            appliedVoucherName: apiResponse.data?.appliedVoucherName,
            voucherDiscountAmount: apiResponse.data?.voucherDiscountAmount,
            discountAmount: apiResponse.data?.discountAmount
        });

        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy chi tiết đơn hàng');
        }

        if (apiResponse.error) {
            throw new Error(apiResponse.error);
        }

        if (!apiResponse.data) {
            throw new Error('Không có dữ liệu đơn hàng trong response');
        }

        return apiResponse.data;
    }, [session]);

    // Hàm format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Hàm format ngày
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Hàm lấy màu status chip
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'warning';
            case 'paid': return 'success';
            case 'partial': return 'secondary';
            case 'completed': return 'success';
            case 'cancelled': return 'danger';
            default: return 'default';
        }
    };

    // Hàm render sao đánh giá
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                size={16}
                className={`${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    // Hàm kiểm tra quyền đánh giá sản phẩm
    const checkReviewPermissions = useCallback(async () => {
        if (!orderDetail || orderDetail.orderStatus !== 'Paid' || !session) {
            console.log('Không thể đánh giá: orderDetail =', orderDetail?.orderStatus);
            return;
        }

        const extendedSession = session as unknown as ExtendedSession;
        if (!extendedSession.accessToken) {
            return;
        }

        // Nếu trạng thái là Paid, cho phép đánh giá tất cả sản phẩm trong đơn hàng
        const reviewableProductIds = new Set<number>();
        const reviewedProductIds = new Set<number>();

        // Kiểm tra từng sản phẩm trong đơn hàng
        for (const item of orderDetail.orderItems) {
            try {
                const productId = item.productId;

                // Kiểm tra đã đánh giá chưa
                const hasReviewedResponse = await fetch(`http://localhost:8080/api/reviews/has-reviewed?productId=${productId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${extendedSession.accessToken}`,
                    },
                });

                if (hasReviewedResponse.ok) {
                    const hasReviewedData = await hasReviewedResponse.json();
                    if (hasReviewedData.data === true) {
                        reviewedProductIds.add(productId);
                        
                        // Lấy thông tin đánh giá chi tiết
                        try {
                            const userReviewResponse = await fetch(`http://localhost:8080/api/reviews/user-review?productId=${productId}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${extendedSession.accessToken}`,
                                },
                            });

                            if (userReviewResponse.ok) {
                                const userReviewData = await userReviewResponse.json();
                                if (userReviewData.data) {
                                    const review = userReviewData.data;
                                    userReviews.set(productId, {
                                        rating: review.rating,
                                        comment: review.comment,
                                        reviewDate: review.reviewDate
                                    });
                                }
                            }
                        } catch (reviewError) {
                            console.error('Lỗi khi lấy thông tin đánh giá:', reviewError);
                        }
                    } else {
                        reviewableProductIds.add(productId);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái đánh giá:', error);
                // Nếu có lỗi, vẫn cho phép đánh giá
                reviewableProductIds.add(item.productId);
            }
        }

        console.log('Có thể đánh giá sản phẩm:', Array.from(reviewableProductIds));
        console.log('Đã đánh giá sản phẩm:', Array.from(reviewedProductIds));
        setReviewableProducts(reviewableProductIds);
        setReviewedProducts(reviewedProductIds);
        setUserReviews(new Map(userReviews));
    }, [orderDetail, session, userReviews]);

    // Lấy chi tiết đơn hàng khi component mount
    useEffect(() => {
        const getOrderDetail = async () => {
            // Kiểm tra trạng thái loading
            if (status === 'loading') {
                return;
            }

            // Kiểm tra xem có orderCode không
            if (!orderCode) {
                // Không cần set error vì đã xử lý redirect ở useEffect trước
                setLoading(false);
                return;
            }

            // Kiểm tra đăng nhập
            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const orderData = await fetchOrderDetail(orderCode);

                // Transform orderItems để tạo bestPromo từ các field riêng lẻ
                const transformedOrderData = {
                    ...orderData,
                    orderItems: orderData.orderItems.map(item => ({
                        ...item,
                        bestPromo: item.promotionCode && item.discountAmount ? {
                            promotionCode: item.promotionCode,
                            promotionName: item.promotionName || item.promotionCode,
                            discountAmount: item.discountAmount
                        } : undefined
                    }))
                };

                console.log('Order detail loaded:', transformedOrderData.orderStatus);
                setOrderDetail(transformedOrderData);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Không thể lấy thông tin đơn hàng. Vui lòng thử lại sau.";
                console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        getOrderDetail();
    }, [session, status, orderCode, fetchOrderDetail]);

    // Kiểm tra quyền đánh giá khi orderDetail được load
    useEffect(() => {
        if (orderDetail && orderDetail.orderStatus === 'Paid') {
            checkReviewPermissions();
        }
    }, [orderDetail, checkReviewPermissions]);

    // Hàm mở modal đánh giá
    const handleOpenReviewModal = (productId: number, productName: string, imageUrl?: string) => {
        setSelectedProductForReview({ productId, productName, imageUrl });
        setReviewModalOpen(true);
    };

    // Hàm đóng modal đánh giá
    const handleCloseReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedProductForReview(null);
    };

    // Hàm xử lý sau khi gửi đánh giá thành công
    const handleReviewSubmitted = () => {
        // Refresh lại trạng thái đánh giá và thông tin đánh giá
        checkReviewPermissions();
    };

    // Hàm quay lại
    const handleGoBack = () => {
        router.back();
    };

    // Nếu không có orderCode và chưa redirect, hiển thị loading
    if (!orderCode || status === 'loading' || loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Button
                    startContent={<ArrowLeft size={16} />}
                    variant="ghost"
                    onClick={handleGoBack}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center">
                        <p className="text-danger mb-4">{error}</p>
                        <Button color="primary" onClick={() => window.location.reload()}>
                            Thử lại
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (!orderDetail) {
        return (
            <div className="container mx-auto p-6">
                <Button
                    startContent={<ArrowLeft size={16} />}
                    variant="ghost"
                    onClick={handleGoBack}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center">
                        <p className="text-default-500">Không tìm thấy thông tin đơn hàng</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Logic tính toán tiết kiệm được đặt ở đây để sử dụng lại
    const totalOrderSavings = orderDetail.voucherDiscountAmount || 0;

    const totalItemSavings = orderDetail.orderItems.reduce((total, item) => {
        // NGĂN CHẶN TÍNH TOÁN TRÙNG LẶP:
        // Nếu promotionCode của sản phẩm trùng với mã voucher,
        // thì khoản giảm giá này đã được tính vào totalOrderSavings,
        // không cần cộng vào tổng tiết kiệm sản phẩm nữa.
        if (item.bestPromo && item.bestPromo.promotionCode && item.bestPromo.promotionCode === orderDetail.appliedVoucherCode) {
            return total;
        }

        // Tính toán các khuyến mãi sản phẩm khác (nếu có)
        if (item.bestPromo && item.bestPromo.discountAmount > 0) {
            return total + (item.bestPromo.discountAmount * item.quantity);
        }
        if (item.originalPrice && item.originalPrice > item.priceAtPurchase) {
            return total + ((item.originalPrice - item.priceAtPurchase) * item.quantity);
        }
        return total;
    }, 0);

    const grandTotalSavings = totalItemSavings + totalOrderSavings;


    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header với nút quay lại */}
            <div className="flex items-center gap-4">
                <Button
                    startContent={<ArrowLeft size={16} />}
                    variant="ghost"
                    onClick={handleGoBack}
                >
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-default-800">Chi tiết đơn hàng #{orderDetail.orderCode}</h1>
                    <p className="text-sm text-default-500">{formatDate(orderDetail.orderDate)}</p>
                </div>
            </div>

            {/* Thông tin tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <ShoppingBag className="text-primary" size={24} />
                        </div>
                        <p className="text-base font-medium">{orderDetail.totalItems}</p>
                        <p className="text-xs text-default-500">Loại sản phẩm</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Package className="text-success" size={24} />
                        </div>
                        <p className="text-base font-medium">{orderDetail.totalQuantity}</p>
                        <p className="text-xs text-default-500">Tổng số lượng</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Chip
                                color={getStatusColor(orderDetail.orderStatus)}
                                variant="flat"
                            >
                                {orderDetail.orderStatus}
                            </Chip>
                        </div>
                        <p className="text-xs text-default-500">Trạng thái</p>
                    </CardBody>
                </Card>

                {/* Thẻ tiết kiệm */}
                {grandTotalSavings > 0 && (
                    <Card className="bg-success-50 border-success-200">
                        <CardBody className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <DollarSign className="text-success" size={24} />
                            </div>
                            <p className="text-base font-medium text-success-700">{formatCurrency(grandTotalSavings)}</p>
                            <p className="text-xs text-success-600">Đã tiết kiệm</p>
                        </CardBody>
                    </Card>
                )}

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CreditCard className="text-secondary" size={24} />
                        </div>
                        <p className="text-base font-medium">{formatCurrency(orderDetail.finalAmount)}</p>
                        <p className="text-xs text-default-500">Tổng thanh toán</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột bên trái - Thông tin đơn hàng */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Thông tin khách hàng */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <User size={20} />
                                <h3 className="text-base font-medium">Thông tin khách hàng</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-default-400" />
                                <span>{orderDetail.customerName || orderDetail.fullName || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-default-400" />
                                <span>{orderDetail.phoneNumber || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-default-400" />
                                <span>{orderDetail.email || 'Chưa cập nhật'}</span>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Địa chỉ giao hàng */}
                    {(orderDetail.fullAddress || orderDetail.recipientName || orderDetail.shippingMethod) && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <MapPin size={20} />
                                    <h3 className="text-base font-medium">Địa chỉ giao hàng</h3>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {orderDetail.recipientName && (
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-default-400" />
                                        <span>{orderDetail.recipientName}</span>
                                    </div>
                                )}
                                {orderDetail.fullAddress && (
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-default-400 mt-1" />
                                        <span>{orderDetail.fullAddress}</span>
                                    </div>
                                )}
                                {orderDetail.shippingMethod && (
                                    <div className="flex items-center gap-2">
                                        <Truck size={16} className="text-default-400" />
                                        <span>{orderDetail.shippingMethod}</span>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* Thông tin thanh toán */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard size={20} />
                                <h3 className="text-base font-medium">Thông tin thanh toán</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex justify-between text-default-700">
                                <span>Tạm tính ({orderDetail.totalQuantity} sản phẩm):</span>
                                <span className="font-medium">{formatCurrency(orderDetail.subTotalAmount)}</span>
                            </div>

                            <div className="flex justify-between text-default-700">
                                <span>Phí vận chuyển:</span>
                                <span className="font-medium">
                                    {orderDetail.shippingFee > 0 ? formatCurrency(orderDetail.shippingFee) : 'Miễn phí'}
                                </span>
                            </div>

                            {/* Hiển thị giảm giá đơn hàng */}
                            {((orderDetail.discountAmount && orderDetail.discountAmount > 0) ||
                                (orderDetail.voucherDiscountAmount && orderDetail.voucherDiscountAmount > 0)) && (
                                <div className="bg-success-50 border border-success-200 rounded px-3 py-2 my-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {orderDetail.appliedVoucherCode ? (
                                                    <Chip size="sm" color="success" variant="flat" startContent="🏷️">
                                                        {orderDetail.appliedVoucherCode}
                                                    </Chip>
                                                ) : (
                                                    <Chip size="sm" color="success" variant="flat" startContent="💰">
                                                        Giảm giá đơn hàng
                                                    </Chip>
                                                )}
                                                {orderDetail.appliedVoucherName && (
                                                    <span className="text-sm text-success-700">{orderDetail.appliedVoucherName}</span>
                                                )}
                                            </div>

                                            {/* Hiển thị thông tin voucher nếu có */}
                                            {orderDetail.voucherType && orderDetail.voucherValue !== undefined && (
                                                <span className="text-xs text-success-600">
                                                        Loại: {orderDetail.voucherType === '%' ? 'Phần trăm' : 'Số tiền'}
                                                    {orderDetail.voucherType === '%' ? ` -${orderDetail.voucherValue}%` : ` -${formatCurrency(orderDetail.voucherValue)}`}
                                                    </span>
                                            )}

                                            {/* Hiển thị mô tả voucher nếu có */}
                                            {orderDetail.voucherDescription && (
                                                <span className="text-xs text-success-600" title={orderDetail.voucherDescription}>
                                                        {orderDetail.voucherDescription.length > 50 ? orderDetail.voucherDescription.slice(0, 50) + '...' : orderDetail.voucherDescription}
                                                    </span>
                                            )}

                                            {/* Nếu không có thông tin voucher chi tiết, hiển thị thông báo chung */}
                                            {!orderDetail.appliedVoucherCode && !orderDetail.voucherType && (
                                                <span className="text-xs text-success-600">
                                                        Đã áp dụng khuyến mãi cho đơn hàng này
                                                    </span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-success-700">
                                                -{formatCurrency(orderDetail.voucherDiscountAmount || orderDetail.discountAmount)}
                                            </span>
                                    </div>
                                </div>
                            )}



                            <Divider className="my-3" />

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-default-800">Tổng thanh toán:</span>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(orderDetail.finalAmount)}
                                    </span>
                                    {(() => {
                                        const totalOrderDiscount = orderDetail.voucherDiscountAmount || orderDetail.discountAmount || 0;

                                        if (totalOrderDiscount > 0) {
                                            return (
                                                <p className="text-xs text-success-600 mt-1">
                                                    Đã tiết kiệm {formatCurrency(totalOrderDiscount)}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Ghi chú */}
                    {orderDetail.customerNotes && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileText size={20} />
                                    <h3 className="text-base font-medium">Ghi chú</h3>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <p className="text-default-600">{orderDetail.customerNotes}</p>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Cột bên phải - Danh sách sản phẩm */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Package size={20} />
                                <h3 className="text-base font-medium">Danh sách sản phẩm ({orderDetail.totalItems} loại)</h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {orderDetail.orderItems.map((item) => (
                                    <Card key={item.orderItemId} className="border border-default-200">
                                        <CardBody>
                                            <div className="flex gap-4">
                                                {/* Hình ảnh sản phẩm */}
                                                <div className="flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={`https://res.cloudinary.com/djjvqwnww/image/upload/${item.imageUrl}`}
                                                            alt={item.productName}
                                                            width={80}
                                                            height={80}
                                                            className="rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-20 bg-default-200 rounded-lg flex items-center justify-center">
                                                            <Package size={24} className="text-default-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thông tin sản phẩm */}
                                                <div className="flex-grow space-y-2">
                                                    <div>
                                                        <h4 className="font-medium text-base">{item.productName}</h4>
                                                        <p className="text-default-500 text-sm">SKU: {item.sku}</p>
                                                    </div>

                                                    {/* Thuộc tính sản phẩm */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.colorName && (
                                                            <Chip size="sm" variant="flat" color="primary">
                                                                {item.colorName}
                                                            </Chip>
                                                        )}
                                                        {item.sizeName && (
                                                            <Chip size="sm" variant="flat" color="secondary">
                                                                {item.sizeName}
                                                            </Chip>
                                                        )}
                                                        {item.materialName && (
                                                            <Chip size="sm" variant="flat" color="default">
                                                                {item.materialName}
                                                            </Chip>
                                                        )}
                                                    </div>

                                                    {/* Thông tin bổ sung */}
                                                    <div className="grid grid-cols-2 gap-4 text-sm text-default-600">
                                                        {item.brandName && (
                                                            <div>
                                                                <span className="font-medium">Thương hiệu:</span> {item.brandName}
                                                            </div>
                                                        )}
                                                        {item.categoryName && (
                                                            <div>
                                                                <span className="font-medium">Danh mục:</span> {item.categoryName}
                                                            </div>
                                                        )}
                                                        {item.targetAudienceName && (
                                                            <div>
                                                                <span className="font-medium">Đối tượng:</span> {item.targetAudienceName}
                                                            </div>
                                                        )}
                                                        {item.weight && (
                                                            <div>
                                                                <span className="font-medium">Trọng lượng:</span> {item.weight}kg
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Giá và số lượng */}
                                                    <div className="flex justify-between items-end">
                                                        <div className="space-y-2">
                                                            {/* Hiển thị giá và khuyến mãi */}
                                                            {item.bestPromo && item.bestPromo.discountAmount > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-base font-semibold text-primary">
                                                                            {formatCurrency(item.priceAtPurchase)}
                                                                        </span>
                                                                        <span className="text-sm line-through text-default-400">
                                                                            {formatCurrency(item.originalPrice ?? (item.priceAtPurchase + item.bestPromo.discountAmount))}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip
                                                                            size="sm"
                                                                            color="success"
                                                                            variant="flat"
                                                                            startContent="🎉"
                                                                        >
                                                                            {item.bestPromo.promotionName || item.bestPromo.promotionCode}
                                                                        </Chip>
                                                                        <span className="text-xs text-success-600 font-medium">
                                                                            Tiết kiệm {formatCurrency(item.bestPromo.discountAmount)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : item.originalPrice && item.originalPrice > item.priceAtPurchase ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-base font-semibold text-primary">
                                                                            {formatCurrency(item.priceAtPurchase)}
                                                                        </span>
                                                                        <span className="text-sm line-through text-default-400">
                                                                            {formatCurrency(item.originalPrice)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip
                                                                            size="sm"
                                                                            color="success"
                                                                            variant="flat"
                                                                            startContent="💰"
                                                                        >
                                                                            Giảm giá
                                                                        </Chip>
                                                                        <span className="text-xs text-success-600 font-medium">
                                                                            Tiết kiệm {formatCurrency(item.originalPrice - item.priceAtPurchase)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <span className="text-base font-semibold text-default-700">
                                                                        {formatCurrency(item.priceAtPurchase)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Hiển thị giá hiện tại nếu khác giá mua */}
                                                            {/*{item.currentPrice && item.currentPrice !== item.priceAtPurchase && (*/}
                                                            {/*    <div className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded">*/}
                                                            {/*        <span>Giá hiện tại: {formatCurrency(item.currentPrice)}</span>*/}
                                                            {/*        {item.currentPrice > item.priceAtPurchase && (*/}
                                                            {/*            <Chip size="sm" color="warning" variant="flat" className="ml-2">*/}
                                                            {/*                Đã tăng giá*/}
                                                            {/*            </Chip>*/}
                                                            {/*        )}*/}
                                                            {/*        {item.currentPrice < item.priceAtPurchase && (*/}
                                                            {/*            <Chip size="sm" color="success" variant="flat" className="ml-2">*/}
                                                            {/*                Đã giảm giá*/}
                                                            {/*            </Chip>*/}
                                                            {/*        )}*/}
                                                            {/*    </div>*/}
                                                            {/*)}*/}

                                                            <div className="flex items-center gap-2 text-sm text-default-600">
                                                                <span>Số lượng:</span>
                                                                <Chip size="sm" variant="flat" color="default">
                                                                    {item.quantity}
                                                                </Chip>
                                                            </div>
                                                        </div>
                                                        <div className="text-right space-y-2">
                                                            <p className="font-medium text-base">
                                                                {formatCurrency(item.totalPrice)}
                                                            </p>
                                                            {/* Debug: Hiển thị trạng thái đơn hàng */}
                                                            <p className="text-xs text-gray-500">
                                                                Trạng thái: {orderDetail.orderStatus}
                                                            </p>
                                                            {/* Hiển thị trạng thái đánh giá */}
                                                                                                                         {(() => {
                                                                 console.log('Kiểm tra điều kiện đánh giá:', orderDetail.orderStatus === 'Paid', orderDetail.orderStatus);
                                                                 return orderDetail.orderStatus === 'Paid';
                                                             })() && (
                                                                 <>
                                                                     {reviewedProducts.has(item.productId) ? (
                                                                         <div className="space-y-2">
                                                                             <div className="flex items-center gap-2">
                                                                                 <Chip
                                                                                     size="sm"
                                                                                     color="success"
                                                                                     variant="flat"
                                                                                     startContent={<Star size={12} className="fill-current" />}
                                                                                 >
                                                                                     Đã đánh giá
                                                                                 </Chip>
                                                                             </div>
                                                                             
                                                                             {/* Hiển thị nội dung đánh giá */}
                                                                             {userReviews.has(item.productId) && (
                                                                                 <div className="bg-success-50 border border-success-200 rounded-lg p-3 space-y-2">
                                                                                     <div className="flex items-center gap-2">
                                                                                         <span className="text-sm font-medium text-success-700">Đánh giá của bạn:</span>
                                                                                         <div className="flex items-center gap-1">
                                                                                             {renderStars(userReviews.get(item.productId)!.rating)}
                                                                                         </div>
                                                                                     </div>
                                                                                     
                                                                                     {userReviews.get(item.productId)!.comment && (
                                                                                         <div className="text-sm text-success-600">
                                                                                             <p className="italic"> {userReviews.get(item.productId)!.comment} </p>
                                                                                         </div>
                                                                                     )}
                                                                                     
                                                                                     <div className="text-xs text-success-500">
                                                                                         {formatDate(userReviews.get(item.productId)!.reviewDate)}
                                                                                     </div>
                                                                                 </div>
                                                                             )}
                                                                         </div>
                                                                     ) : reviewableProducts.has(item.productId) ? (
                                                                         <Button
                                                                             size="sm"
                                                                             color="primary"
                                                                             variant="flat"
                                                                             startContent={<Star size={14} />}
                                                                             onPress={() => {
                                                                                 console.log('Mở modal đánh giá cho sản phẩm:', item.productId);
                                                                                 handleOpenReviewModal(
                                                                                     item.productId,
                                                                                     item.productName,
                                                                                     item.imageUrl
                                                                                 );
                                                                             }}
                                                                         >
                                                                             Đánh giá sản phẩm
                                                                         </Button>
                                                                     ) : (
                                                                         <div className="text-xs text-gray-400">
                                                                             Đang kiểm tra...
                                                                         </div>
                                                                     )}
                                                                 </>
                                                             )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}

                                {/* Tổng kết tiết kiệm */}
                                {grandTotalSavings > 0 && (
                                    <Card className="bg-success-50 border-success-200">
                                        <CardBody className="text-center py-4">
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <h4 className="text-lg font-semibold text-success-700">
                                                    Tổng tiết kiệm của bạn
                                                </h4>
                                            </div>
                                            <div className="space-y-2">
                                                {totalOrderSavings > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-success-600">
                                                            {orderDetail.appliedVoucherCode ?
                                                                `Mã giảm giá ${orderDetail.appliedVoucherCode}:` :
                                                                'Giảm giá đơn hàng:'
                                                            }
                                                        </span>
                                                        <span className="font-semibold text-success-700">
                                                            {formatCurrency(totalOrderSavings)}
                                                        </span>
                                                    </div>
                                                )}
                                                {totalItemSavings > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-success-600">Khuyến mãi sản phẩm:</span>
                                                        <span className="font-semibold text-success-700">
                                                            {formatCurrency(totalItemSavings)}
                                                        </span>
                                                    </div>
                                                )}
                                                <Divider className="my-2" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base font-semibold text-success-700">Tổng cộng:</span>
                                                    <span className="text-xl font-bold text-success-700">
                                                        {formatCurrency(grandTotalSavings)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Modal đánh giá sản phẩm */}
            {selectedProductForReview && (
                <ProductReviewForm
                    isOpen={reviewModalOpen}
                    onClose={handleCloseReviewModal}
                    productId={selectedProductForReview.productId}
                    productName={selectedProductForReview.productName}
                    productImage={selectedProductForReview.imageUrl}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    );
}