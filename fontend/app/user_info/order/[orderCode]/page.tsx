"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
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
    bestPromo?: {
        promotionCode: string;
        promotionName: string;
        discountAmount: number;
    };
    originalPrice?: number;
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
                setOrderDetail(orderData);
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
                {(() => {
                    const totalItemSavings = orderDetail.orderItems.reduce((total, item) => {
                        if (item.bestPromo && item.bestPromo.discountAmount > 0) {
                            return total + (item.bestPromo.discountAmount * item.quantity);
                        }
                        if (item.originalPrice && item.originalPrice > item.priceAtPurchase) {
                            return total + ((item.originalPrice - item.priceAtPurchase) * item.quantity);
                        }
                        return total;
                    }, 0);

                    const totalOrderSavings = orderDetail.discountAmount || 0;
                    const grandTotalSavings = totalItemSavings + totalOrderSavings;

                    if (grandTotalSavings > 0) {
                        return (
                            <Card className="bg-success-50 border-success-200">
                                <CardBody className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <span className="text-success-600 text-2xl">💰</span>
                                    </div>
                                    <p className="text-base font-medium text-success-700">{formatCurrency(grandTotalSavings)}</p>
                                    <p className="text-xs text-success-600">Đã tiết kiệm</p>
                                </CardBody>
                            </Card>
                        );
                    }
                    return null;
                })()}

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

                            {orderDetail.discountAmount !== undefined && orderDetail.discountAmount !== null && orderDetail.discountAmount > 0 && (
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-success-600">Giảm giá đơn hàng:</span>
                                        <Chip size="sm" color="success" variant="flat">
                                            Tiết kiệm
                                        </Chip>
                                    </div>
                                    <span className="font-semibold text-success-600">
                                        -{formatCurrency(orderDetail.discountAmount)}
                                    </span>
                                </div>
                            )}

                            <Divider className="my-3" />

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-default-800">Tổng thanh toán:</span>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(orderDetail.finalAmount)}
                                    </span>
                                    {orderDetail.discountAmount > 0 && (
                                        <p className="text-xs text-success-600 mt-1">
                                            Đã tiết kiệm {formatCurrency(orderDetail.discountAmount)}
                                        </p>
                                    )}
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
                                                            {item.currentPrice && item.currentPrice !== item.priceAtPurchase && (
                                                                <div className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded">
                                                                    <span>Giá hiện tại: {formatCurrency(item.currentPrice)}</span>
                                                                    {item.currentPrice > item.priceAtPurchase && (
                                                                        <Chip size="sm" color="warning" variant="flat" className="ml-2">
                                                                            Đã tăng giá
                                                                        </Chip>
                                                                    )}
                                                                    {item.currentPrice < item.priceAtPurchase && (
                                                                        <Chip size="sm" color="success" variant="flat" className="ml-2">
                                                                            Đã giảm giá
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2 text-sm text-default-600">
                                                                <span>Số lượng:</span>
                                                                <Chip size="sm" variant="flat" color="default">
                                                                    {item.quantity}
                                                                </Chip>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium text-base">
                                                                {formatCurrency(item.totalPrice)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}

                                {/* Tổng kết tiết kiệm */}
                                {(() => {
                                    const totalItemSavings = orderDetail.orderItems.reduce((total, item) => {
                                        if (item.bestPromo && item.bestPromo.discountAmount > 0) {
                                            return total + (item.bestPromo.discountAmount * item.quantity);
                                        }
                                        if (item.originalPrice && item.originalPrice > item.priceAtPurchase) {
                                            return total + ((item.originalPrice - item.priceAtPurchase) * item.quantity);
                                        }
                                        return total;
                                    }, 0);

                                    const totalOrderSavings = orderDetail.discountAmount || 0;
                                    const grandTotalSavings = totalItemSavings + totalOrderSavings;

                                    if (grandTotalSavings > 0) {
                                        return (
                                            <Card className="bg-success-50 border-success-200">
                                                <CardBody className="text-center py-4">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <span className="text-2xl">🎉</span>
                                                        <h4 className="text-lg font-semibold text-success-700">
                                                            Tổng tiết kiệm của bạn
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {totalItemSavings > 0 && (
                                                            <p className="text-sm text-success-600">
                                                                Khuyến mãi sản phẩm: {formatCurrency(totalItemSavings)}
                                                            </p>
                                                        )}
                                                        {totalOrderSavings > 0 && (
                                                            <p className="text-sm text-success-600">
                                                                Giảm giá đơn hàng: {formatCurrency(totalOrderSavings)}
                                                            </p>
                                                        )}
                                                        <p className="text-xl font-bold text-success-700">
                                                            {formatCurrency(grandTotalSavings)}
                                                        </p>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
} 