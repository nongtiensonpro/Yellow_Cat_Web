"use client";

import {useState, useEffect, useCallback} from 'react';
import {useSession} from 'next-auth/react';
import {useParams, useRouter} from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductReviewForm from '@/components/review/ProductReviewForm';
import {DollarSign, Star} from "lucide-react";
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
    const {data: session, status} = useSession();
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
    const [reviewedProducts, setReviewedProducts] = useState<Set<number>>(new Set());
    const [userReviews, setUserReviews] = useState<Map<number, {
        rating: number;
        comment: string;
        reviewDate: string;
    }>>(new Map());

    const orderCode = params?.orderCode as string | undefined;

    useEffect(() => {
        if (params && !orderCode) {
            router.push("http://localhost:3000/user_info/order");
        }
    }, [params, orderCode, router]);

    const fetchOrderDetail = useCallback(async (orderCode: string): Promise<OrderDetailWithItems> => {
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
            if (response.status === 404) throw new Error('Không tìm thấy đơn hàng');
            if (response.status === 403) throw new Error('Bạn không có quyền xem đơn hàng này');
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse<OrderDetailWithItems> = await response.json();

        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy chi tiết đơn hàng');
        }
        if (apiResponse.error) throw new Error(apiResponse.error);
        if (!apiResponse.data) throw new Error('Không có dữ liệu đơn hàng trong response');

        return apiResponse.data;
    }, [session]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'paid':
                return 'success';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'danger';
            default:
                return 'default';
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({length: 5}, (_, index) => (
            <Star
                key={index}
                size={16}
                className={`${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    // =================================================================================
    // HÀM ĐÃ SỬA LỖI GỌI API LIÊN TỤC
    // =================================================================================
    const checkReviewPermissions = useCallback(async () => {

        if (!orderDetail || orderDetail.orderStatus !== 'Paid' || !session) {
            return;
        }

        const extendedSession = session as unknown as ExtendedSession;
        if (!extendedSession.accessToken) {
            return;
        }

        const reviewableProductIds = new Set<number>();
        const reviewedProductIds = new Set<number>();
        // TẠO MỘT MAP MỚI thay vì đọc và sửa đổi state cũ
        const newUserReviews = new Map<number, {
            rating: number;
            comment: string;
            reviewDate: string;
        }>();

        // Sử dụng Promise.all để các cuộc gọi API chạy song song, giúp tăng tốc độ
        await Promise.all(orderDetail.orderItems.map(async (item) => {
            try {
                const productId = item.productId;

                const hasReviewedResponse = await fetch(`http://localhost:8080/api/reviews/has-reviewed?productId=${productId}`, {
                    method: 'GET',
                    headers: {'Authorization': `Bearer ${extendedSession.accessToken}`},
                });

                if (hasReviewedResponse.ok) {
                    const hasReviewedData = await hasReviewedResponse.json();
                    if (hasReviewedData.data === true) {
                        reviewedProductIds.add(productId);

                        try {
                            const userReviewResponse = await fetch(`http://localhost:8080/api/reviews/user-review?productId=${productId}`, {
                                method: 'GET',
                                headers: {'Authorization': `Bearer ${extendedSession.accessToken}`},
                            });

                            if (userReviewResponse.ok) {
                                const userReviewData = await userReviewResponse.json();
                                if (userReviewData.data) {
                                    const review = userReviewData.data;
                                    // THÊM VÀO MAP MỚI, không sửa đổi state cũ
                                    newUserReviews.set(productId, {
                                        rating: review.rating,
                                        comment: review.comment,
                                        reviewDate: review.reviewDate
                                    });
                                }
                            }
                        } catch (reviewError) {
                            console.error(`Lỗi khi lấy thông tin đánh giá cho sản phẩm ${productId}:`, reviewError);
                        }
                    } else {
                        reviewableProductIds.add(productId);
                    }
                }
            } catch (error) {
                console.error(`Lỗi khi kiểm tra trạng thái đánh giá cho sản phẩm ${item.productId}:`, error);
                reviewableProductIds.add(item.productId);
            }
        }));

        // CẬP NHẬT TẤT CẢ STATE MỘT LẦN VỚI DỮ LIỆU MỚI
        setReviewableProducts(reviewableProductIds);
        setReviewedProducts(reviewedProductIds);
        setUserReviews(newUserReviews);

    }, [orderDetail, session]); // <-- LOẠI BỎ `userReviews` khỏi dependency array
    useEffect(() => {
        const getOrderDetail = async () => {
            if (status === 'loading') return;
            if (!orderCode) {
                setLoading(false);
                return;
            }
            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const orderData = await fetchOrderDetail(orderCode);
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
                setOrderDetail(transformedOrderData);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Không thể lấy thông tin đơn hàng. Vui lòng thử lại sau.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        getOrderDetail();
    }, [session, status, orderCode, fetchOrderDetail]);

    useEffect(() => {
        if (orderDetail) {
            checkReviewPermissions();
        }
    }, [orderDetail, checkReviewPermissions]);

    const handleOpenReviewModal = (productId: number, productName: string, imageUrl?: string) => {
        setSelectedProductForReview({productId, productName, imageUrl});
        setReviewModalOpen(true);
    };

    const handleCloseReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedProductForReview(null);
    };

    const handleReviewSubmitted = () => {
        // Refresh lại trạng thái đánh giá
        checkReviewPermissions();
    };

    const handleGoBack = () => {
        router.back();
    };

    if (!orderCode || status === 'loading' || loading) {
        return <LoadingSpinner/>;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Button startContent={<ArrowLeft size={16}/>} variant="ghost" onClick={handleGoBack} className="mb-4">
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
                <Button startContent={<ArrowLeft size={16}/>} variant="ghost" onClick={handleGoBack} className="mb-4">
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

    const totalOrderSavings = orderDetail.voucherDiscountAmount || 0;
    const totalItemSavings = orderDetail.orderItems.reduce((total, item) => {
        if (item.bestPromo && item.bestPromo.promotionCode && item.bestPromo.promotionCode === orderDetail.appliedVoucherCode) {
            return total;
        }
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
            <div className="flex items-center gap-4">
                <Button startContent={<ArrowLeft size={16}/>} variant="ghost" onClick={handleGoBack}>
                    Quay lại
                </Button>
                <div>
                    <h1 className="text-xl font-semibold text-default-800">Chi tiết đơn hàng
                        #{orderDetail.orderCode}</h1>
                    <p className="text-sm text-default-500">{formatDate(orderDetail.orderDate)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Cards for total items, quantity, status, etc. */}
                <Card><CardBody className="text-center"><ShoppingBag className="mx-auto mb-2 text-primary" size={24}/><p
                    className="text-base font-medium">{orderDetail.totalItems}</p><p
                    className="text-xs text-default-500">Loại sản phẩm</p></CardBody></Card>
                <Card><CardBody className="text-center"><Package className="mx-auto mb-2 text-success" size={24}/><p
                    className="text-base font-medium">{orderDetail.totalQuantity}</p><p
                    className="text-xs text-default-500">Tổng số lượng</p></CardBody></Card>
                <Card><CardBody className="text-center">
                    <div className="flex justify-center mb-2"><Chip color={getStatusColor(orderDetail.orderStatus)}
                                                                    variant="flat">{orderDetail.orderStatus}</Chip>
                    </div>
                    <p className="text-xs text-default-500">Trạng thái</p></CardBody></Card>
                {grandTotalSavings > 0 && (
                    <Card className="bg-success-50 border-success-200"><CardBody className="text-center"><DollarSign
                        className="mx-auto mb-2 text-success" size={24}/><p
                        className="text-base font-medium text-success-700">{formatCurrency(grandTotalSavings)}</p><p
                        className="text-xs text-success-600">Đã tiết kiệm</p></CardBody></Card>)}
                <Card><CardBody className="text-center"><CreditCard className="mx-auto mb-2 text-secondary" size={24}/>
                    <p className="text-base font-medium">{formatCurrency(orderDetail.finalAmount)}</p><p
                        className="text-xs text-default-500">Tổng thanh toán</p></CardBody></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer & Payment Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2"><User size={20}/><h3
                                className="text-base font-medium">Thông tin khách hàng</h3></div>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex items-center gap-2"><User size={16}
                                                                           className="text-default-400"/><span>{orderDetail.customerName || orderDetail.fullName || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2"><Phone size={16}
                                                                            className="text-default-400"/><span>{orderDetail.phoneNumber || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex items-center gap-2"><Mail size={16}
                                                                           className="text-default-400"/><span>{orderDetail.email || 'Chưa cập nhật'}</span>
                            </div>
                        </CardBody>
                    </Card>

                    {(orderDetail.fullAddress || orderDetail.recipientName || orderDetail.shippingMethod) && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2"><MapPin size={20}/><h3
                                    className="text-base font-medium">Địa chỉ giao hàng</h3></div>
                            </CardHeader>
                            <CardBody className="space-y-3">
                                {orderDetail.recipientName && <div className="flex items-center gap-2"><User size={16}
                                                                                                             className="text-default-400"/><span>{orderDetail.recipientName}</span>
                                </div>}
                                {orderDetail.fullAddress && <div className="flex items-start gap-2"><MapPin size={16}
                                                                                                            className="text-default-400 mt-1"/><span>{orderDetail.fullAddress}</span>
                                </div>}
                                {orderDetail.shippingMethod && <div className="flex items-center gap-2"><Truck size={16}
                                                                                                               className="text-default-400"/><span>{orderDetail.shippingMethod}</span>
                                </div>}
                            </CardBody>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2"><CreditCard size={20}/><h3
                                className="text-base font-medium">Thông tin thanh toán</h3></div>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex justify-between text-default-700">
                                <span>Tạm tính ({orderDetail.totalQuantity} sản phẩm):</span><span
                                className="font-medium">{formatCurrency(orderDetail.subTotalAmount)}</span></div>
                            <div className="flex justify-between text-default-700"><span>Phí vận chuyển:</span><span
                                className="font-medium">{orderDetail.shippingFee > 0 ? formatCurrency(orderDetail.shippingFee) : 'Miễn phí'}</span>
                            </div>
                            {((orderDetail.discountAmount && orderDetail.discountAmount > 0) || (orderDetail.voucherDiscountAmount && orderDetail.voucherDiscountAmount > 0)) && (
                                <div className="bg-success-50 border border-success-200 rounded px-3 py-2 my-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">{orderDetail.appliedVoucherCode ? (
                                                <Chip size="sm" color="success" variant="flat"
                                                      startContent="🏷️">{orderDetail.appliedVoucherCode}</Chip>) : (
                                                <Chip size="sm" color="success" variant="flat" startContent="💰">Giảm giá
                                                    đơn hàng</Chip>)}{orderDetail.appliedVoucherName && (<span
                                                className="text-sm text-success-700">{orderDetail.appliedVoucherName}</span>)}</div>
                                            {orderDetail.voucherType && orderDetail.voucherValue !== undefined && (<span
                                                className="text-xs text-success-600">Loại: {orderDetail.voucherType === '%' ? 'Phần trăm' : 'Số tiền'}{orderDetail.voucherType === '%' ? ` -${orderDetail.voucherValue}%` : ` -${formatCurrency(orderDetail.voucherValue)}`}</span>)}
                                            {orderDetail.voucherDescription && (
                                                <span className="text-xs text-success-600"
                                                      title={orderDetail.voucherDescription}>{orderDetail.voucherDescription.length > 50 ? orderDetail.voucherDescription.slice(0, 50) + '...' : orderDetail.voucherDescription}</span>)}
                                            {!orderDetail.appliedVoucherCode && !orderDetail.voucherType && (
                                                <span className="text-xs text-success-600">Đã áp dụng khuyến mãi cho đơn hàng này</span>)}
                                        </div>
                                        <span
                                            className="font-semibold text-success-700">-{formatCurrency(orderDetail.voucherDiscountAmount || orderDetail.discountAmount)}</span>
                                    </div>
                                </div>
                            )}
                            <Divider className="my-3"/>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-default-800">Tổng thanh toán:</span>
                                <div className="text-right">
                                    <span
                                        className="text-xl font-bold text-primary">{formatCurrency(orderDetail.finalAmount)}</span>
                                    {(orderDetail.voucherDiscountAmount || orderDetail.discountAmount || 0) > 0 && (
                                        <p className="text-xs text-success-600 mt-1">
                                            Đã tiết
                                            kiệm {formatCurrency(orderDetail.voucherDiscountAmount || orderDetail.discountAmount || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {orderDetail.customerNotes && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2"><FileText size={20}/><h3
                                    className="text-base font-medium">Ghi chú</h3></div>
                            </CardHeader>
                            <CardBody><p className="text-default-600">{orderDetail.customerNotes}</p></CardBody>
                        </Card>
                    )}
                </div>

                {/* Right Column - Product List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2"><Package size={20}/><h3
                                className="text-base font-medium">Danh sách sản phẩm
                                ({orderDetail.totalItems} loại)</h3></div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {orderDetail.orderItems.map((item) => (
                                    <Card key={item.orderItemId} className="border border-default-200">
                                        <CardBody>
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0">
                                                    {item.imageUrl ? (<Image
                                                        src={`https://res.cloudinary.com/djjvqwnww/image/upload/${item.imageUrl}`}
                                                        alt={item.productName} width={80} height={80}
                                                        className="rounded-lg object-cover"/>) : (<div
                                                        className="w-20 h-20 bg-default-200 rounded-lg flex items-center justify-center">
                                                        <Package size={24} className="text-default-400"/></div>)}
                                                </div>

                                                <div className="flex-grow space-y-2">
                                                    <div>
                                                        <h4 className="font-medium text-base">{item.productName}</h4>
                                                        <p className="text-default-500 text-sm">SKU: {item.sku}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.colorName && <Chip size="sm" variant="flat"
                                                                                 color="primary">{item.colorName}</Chip>}
                                                        {item.sizeName && <Chip size="sm" variant="flat"
                                                                                color="secondary">{item.sizeName}</Chip>}
                                                        {item.materialName && <Chip size="sm" variant="flat"
                                                                                    color="default">{item.materialName}</Chip>}
                                                    </div>

                                                    <div className="flex justify-between items-end">
                                                        <div className="space-y-2">
                                                            {/* Price & Promotion Display */}
                                                            {item.bestPromo && item.bestPromo.discountAmount > 0 ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="text-base font-semibold text-primary">{formatCurrency(item.priceAtPurchase)}</span>
                                                                        <span
                                                                            className="text-sm line-through text-default-400">{formatCurrency(item.originalPrice ?? (item.priceAtPurchase + item.bestPromo.discountAmount))}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip size="sm" color="success" variant="flat"
                                                                              startContent="🎉">{item.bestPromo.promotionName || item.bestPromo.promotionCode}</Chip>
                                                                        <span
                                                                            className="text-xs text-success-600 font-medium">Tiết kiệm {formatCurrency(item.bestPromo.discountAmount)}</span>
                                                                    </div>
                                                                </div>
                                                            ) : item.originalPrice && item.originalPrice > item.priceAtPurchase ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className="text-base font-semibold text-primary">{formatCurrency(item.priceAtPurchase)}</span>
                                                                        <span
                                                                            className="text-sm line-through text-default-400">{formatCurrency(item.originalPrice)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Chip size="sm" color="success" variant="flat"
                                                                              startContent="💰">Giảm giá</Chip>
                                                                        <span
                                                                            className="text-xs text-success-600 font-medium">Tiết kiệm {formatCurrency(item.originalPrice - item.priceAtPurchase)}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div><span
                                                                    className="text-base font-semibold text-default-700">{formatCurrency(item.priceAtPurchase)}</span>
                                                                </div>
                                                            )}
                                                            <div
                                                                className="flex items-center gap-2 text-sm text-default-600">
                                                                <span>Số lượng:</span><Chip size="sm" variant="flat"
                                                                                            color="default">{item.quantity}</Chip>
                                                            </div>
                                                        </div>
                                                        <div className="text-right space-y-2">
                                                            <p className="font-medium text-base">{formatCurrency(item.totalPrice)}</p>
                                                            {orderDetail.orderStatus === 'Paid' && (
                                                                <>
                                                                    {reviewedProducts.has(item.productId) ? (
                                                                        <div className="space-y-2">
                                                                            <Chip size="sm" color="success"
                                                                                  variant="flat"
                                                                                  startContent={<Star size={12}
                                                                                                      className="fill-current"/>}>Đã
                                                                                đánh giá</Chip>
                                                                            {userReviews.has(item.productId) && (
                                                                                <div
                                                                                    className="bg-success-50 border border-success-200 rounded-lg p-3 space-y-2 text-left">
                                                                                    <div
                                                                                        className="flex items-center gap-2">
                                                                                        <span
                                                                                            className="text-sm font-medium text-success-700">Đánh giá của bạn:</span>
                                                                                        <div
                                                                                            className="flex items-center gap-1">{renderStars(userReviews.get(item.productId)!.rating)}</div>
                                                                                    </div>
                                                                                    {userReviews.get(item.productId)!.comment && (
                                                                                        <p className="text-sm text-success-600 italic">{userReviews.get(item.productId)!.comment}</p>)}
                                                                                    <div
                                                                                        className="text-xs text-success-500">{formatDate(userReviews.get(item.productId)!.reviewDate)}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : reviewableProducts.has(item.productId) ? (
                                                                        <Button size="sm" color="primary" variant="flat"
                                                                                startContent={<Star size={14}/>}
                                                                                onPress={() => handleOpenReviewModal(item.productId, item.productName, item.imageUrl)}>
                                                                            Đánh giá sản phẩm
                                                                        </Button>
                                                                    ) : (
                                                                        <div className="text-xs text-gray-400">Kiểm
                                                                            tra...</div>
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

                                {grandTotalSavings > 0 && (
                                    <Card className="bg-success-50 border-success-200">
                                        <CardBody className="text-center py-4">
                                            <h4 className="text-lg font-semibold text-success-700 mb-3">Tổng tiết kiệm
                                                của bạn</h4>
                                            <div className="space-y-2">
                                                {totalOrderSavings > 0 && (
                                                    <div className="flex justify-between items-center text-sm"><span
                                                        className="text-success-600">{orderDetail.appliedVoucherCode ? `Mã giảm giá ${orderDetail.appliedVoucherCode}:` : 'Giảm giá đơn hàng:'}</span><span
                                                        className="font-semibold text-success-700">{formatCurrency(totalOrderSavings)}</span>
                                                    </div>)}
                                                {totalItemSavings > 0 && (
                                                    <div className="flex justify-between items-center text-sm"><span
                                                        className="text-success-600">Khuyến mãi sản phẩm:</span><span
                                                        className="font-semibold text-success-700">{formatCurrency(totalItemSavings)}</span>
                                                    </div>)}
                                                <Divider className="my-2"/>
                                                <div className="flex justify-between items-center"><span
                                                    className="text-base font-semibold text-success-700">Tổng cộng:</span><span
                                                    className="text-xl font-bold text-success-700">{formatCurrency(grandTotalSavings)}</span>
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