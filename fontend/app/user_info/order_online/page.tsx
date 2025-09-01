"use client";

import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";
import { Dialog } from "@headlessui/react";
import { 
    ShoppingCart, 
    Calendar, 
    Phone,
    CreditCard, 
    Package,
    TrendingUp,
    Clock,
    Gift,
    Percent,
} from "lucide-react";
import {CldImage} from "next-cloudinary";
import React, { useState } from "react";
import OrderTabs from '@/components/order/OrderTabs';
import { useSession } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface OrderTimeline {
    id: number;
    orderId: number;
    fromStatus: string;
    toStatus: string;
    note: string;
    changedAt: string;
}

interface User {
    fullName?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    avatarUrl?: string;
}

interface Order {
    orderId: number;
    orderCode: string;
    customerName: string;
    orderStatus: string;
    finalAmount: number;
    discountAmount: number;
    createdAt: string;
}

interface OrderItem {
    productId?: number;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderDetail {
    orderId: number;
    orderCode: string;
    orderStatus: string;
    customerName: string;
    phoneNumber: string;
    wardCommune: string;
    streetAddress: string;
    district: string;
    cityProvince: string;
    country: string;
    orderDate: string;
    subTotal: number;
    shippingFee: number;
    voucherDiscount?: number;
    voucherCode?: string;
    finalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    customerNotes?: string;
    items: OrderItem[];
}

interface TokenData {
    sub: string;
    [key: string]: unknown;
}

const tabList = [
  { key: "Pending", label: "Chờ xác nhận" },
  { key: "Confirmed", label: "Chờ giao hàng" },
  { key: "Shipping", label: "Đang giao hàng" },
  { key: "Delivered", label: "Đã giao" },
  { key: "Completed", label: "Hoàn thành" },
  { key: "Refunded", label: "Đã hoàn tiền" },
  { key: "Cancelled", label: "Đã hủy" },
  { key: "DeliveryFailed", label: "Giao thất bại" },
  { key: "ReturnedToSeller", label: "Đã trả về người bán" },
  { key: "ReturnRequested", label: "Hoàn hàng" },
];

const RETURN_REASONS = [
    'Sản phẩm bị lỗi',
    'Sản phẩm không đúng mô tả',
    'Thiếu phụ kiện/quà tặng',
    'Đóng gói kém',
    'Khác',
];

export default function OrderOnlinePage() {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]); // Thêm state cho tất cả đơn hàng
    const [activeTab, setActiveTab] = useState("Pending");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openDetailOrderId, setOpenDetailOrderId] = useState<number | null>(null);
    const [orderDetailCache, setOrderDetailCache] = useState<Record<number, OrderDetail>>({});
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [orderTimeline, setOrderTimeline] = useState<Record<number, OrderTimeline[]>>({});
    const [timelineLoading, setTimelineLoading] = useState<Record<number, boolean>>({});
    const [showReturnPopup, setShowReturnPopup] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [returnImages, setReturnImages] = useState<string[]>([]);
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState<string | null>(null);
    const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
    // Hàm huỷ đơn hàng
    const [cancelLoading, setCancelLoading] = useState(false);
    // Đã bỏ thông báo huỷ đơn
    // State cho xác nhận huỷ đơn
    const [showCancelConfirm, setShowCancelConfirm] = useState<{orderId: number, orderCode: string} | null>(null);
    
    // State cho đánh giá sản phẩm
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewProductId, setReviewProductId] = useState<number | null>(null);
    const [reviewProductName, setReviewProductName] = useState<string>('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
    const [canReviewProduct, setCanReviewProduct] = useState<Record<number, boolean>>({});
    const [hasReviewedProduct, setHasReviewedProduct] = useState<Record<number, boolean>>({});

    // Lấy user info từ backend
    const fetchUserByKeycloakId = useCallback(async (keycloakId: string, accessToken: string) => {
        const res = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const apiRes = await res.json();
        if (!apiRes.data) throw new Error(apiRes.message || 'Không lấy được thông tin user');
        return apiRes.data;
    }, []);

    // Lấy tất cả orders của khách hàng
    const fetchAllOrders = useCallback(async (keycloakId: string, accessToken: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/orders/user-orders?keycloakId=${keycloakId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const allOrdersData = Array.isArray(data) ? data : data.data || [];
            
            // Sắp xếp đơn hàng theo thời gian tạo giảm dần (mới nhất lên đầu)
            const sortedAllOrders = allOrdersData.sort((a: Order, b: Order) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            setAllOrders(sortedAllOrders);
        } catch {
            console.error('Không lấy được tất cả đơn hàng');
            setAllOrders([]);
        }
    }, []);

    // Lấy orders theo trạng thái
    const fetchOrdersByStatus = useCallback(async (keycloakId: string, status: string, accessToken: string) => {
        setLoading(true);
        setError(null);
        let url = '';
        switch (status) {
            case 'Pending': url = '/user-orders_pending'; break;
            case 'Shipping': url = '/user-orders_shipping'; break;
            case 'Confirmed': url = '/user-orders_confirmed'; break;
            case 'Cancelled': url = '/user-orders_cancelled'; break;
            case 'Delivered': url = '/user-orders_delivered'; break;
            case 'Refunded': url = '/user-orders_refunded'; break;
            case 'Completed': url = '/user-orders_completed'; break;
            case 'DeliveryFailed': url = '/user-orders_deliveryFailed'; break;
            case 'ReturnedToSeller': url = '/user-orders_returnedToSeller'; break;
            case 'ReturnRequested': url = '/user-orders_returnRequested'; break;
            default: url = '/user-orders_pending';
        }
        try {
            const res = await fetch(`http://localhost:8080/api/orders${url}?keycloakId=${keycloakId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            const ordersData = Array.isArray(data) ? data : data.data || [];
            
            // Sắp xếp đơn hàng theo thời gian tạo giảm dần (mới nhất lên đầu)
            const sortedOrders = ordersData.sort((a: Order, b: Order) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            setOrders(sortedOrders);
        } catch {
            setError('Không lấy được danh sách đơn hàng');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy user và orders khi mount hoặc đổi tab
    useEffect(() => {
        const getUserAndOrders = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated' || !session) {
                setError('Bạn chưa đăng nhập');
                return;
            }
            try {
                const accessToken = session.accessToken || (session as { user?: { accessToken?: string } }).user?.accessToken;
                if (!accessToken) throw new Error('Không tìm thấy accessToken');
                const tokenData = jwtDecode<TokenData>(accessToken);
                const keycloakId = tokenData.sub;
                if (!keycloakId) throw new Error('Không tìm thấy keycloakId');
                // Lấy user
                const userData = await fetchUserByKeycloakId(keycloakId, accessToken);
                setUser(userData);
                // Lấy tất cả orders trước
                await fetchAllOrders(keycloakId, accessToken);
                // Lấy orders theo tab
                await fetchOrdersByStatus(keycloakId, activeTab, accessToken);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
                setError(errorMessage);
            }
        };
        getUserAndOrders();
    }, [session, status, activeTab, fetchUserByKeycloakId, fetchAllOrders, fetchOrdersByStatus]);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
};

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

    // Thêm hàm getStatusBadgeClass cho orderStatus và paymentStatus
    const getStatusBadgeClass = (status: string) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        const s = status.toLowerCase();
        if (["completed", "delivered", "paid", "success", "refunded"].includes(s)) return "bg-green-100 text-green-800";
        if (["pending", "processing", "confirmed", "shipping"].includes(s)) return "bg-yellow-100 text-yellow-800";
        if (["cancelled", "failed", "deliveryfailed", "returnrejected", "finalrejected"].includes(s)) return "bg-red-100 text-red-800";
        return "bg-gray-100 text-gray-800";
    };

    // Hàm lấy chi tiết đơn hàng (có cache)
    const fetchOrderDetail = useCallback(async (orderId: number) => {
        setLoadingDetail(true);
        setDetailError(null);
        if (orderDetailCache[orderId]) {
            setLoadingDetail(false);
            // Kiểm tra trạng thái đánh giá cho đơn hàng đã cache
            if (orderDetailCache[orderId].orderStatus === 'Completed') {
                checkReviewStatusForOrder(orderId);
            }
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/api/orders/detail-online/${orderId}`);
            const data = await res.json();
            setOrderDetailCache(prev => ({ ...prev, [orderId]: data }));
            
            // Kiểm tra trạng thái đánh giá nếu đơn hàng đã hoàn thành
            if (data.orderStatus === 'Completed') {
                checkReviewStatusForOrder(orderId);
            }
        } catch {
            setDetailError('Không lấy được chi tiết đơn hàng');
        } finally {
            setLoadingDetail(false);
        }
    }, [orderDetailCache]);

    // Hàm fetch order timeline
    const fetchOrderTimeline = useCallback(async (orderId: number) => {
        if (orderTimeline[orderId]) return;

        try {
            setTimelineLoading(prev => ({ ...prev, [orderId]: true }));
            
            const res = await fetch(`http://localhost:8080/api/order-timelines/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setOrderTimeline(prev => ({
                        ...prev,
                        [orderId]: data.data
                    }));
                } else {
                    setOrderTimeline(prev => ({
                        ...prev,
                        [orderId]: []
                    }));
                }
            } else {
                console.error('Failed to fetch order timeline');
                setOrderTimeline(prev => ({
                    ...prev,
                    [orderId]: []
                }));
            }
        } catch {
            console.error('Error fetching order timeline');
            setOrderTimeline(prev => ({
                ...prev,
                [orderId]: []
            }));
        } finally {
            setTimelineLoading(prev => ({ ...prev, [orderId]: false }));
        }
    }, [orderTimeline]);

    // Khi openDetailOrderId thay đổi, fetch chi tiết nếu chưa có
    useEffect(() => {
        if (openDetailOrderId) {
            fetchOrderDetail(openDetailOrderId);
        } else {
            setDetailError(null);
        }
    }, [openDetailOrderId, fetchOrderDetail]);

    // Fetch timeline khi có detail order và chưa có timeline
    useEffect(() => {
        if (openDetailOrderId && orderDetailCache[openDetailOrderId] && !orderTimeline[openDetailOrderId]) {
            fetchOrderTimeline(openDetailOrderId);
        }
    }, [openDetailOrderId, orderDetailCache, orderTimeline, fetchOrderTimeline]);

    let KeycloakIdUser = '';
    if (session?.user?.id) {
        KeycloakIdUser = session.user.id;
    }
    // Hàm xác nhận nhận hàng
    const handleConfirmReceived = async (orderId: number) => {
        setConfirmLoading(true);
        setConfirmError(null);
        setConfirmSuccess(null);
        let keycloakid = '';
        keycloakid = KeycloakIdUser
        try {
            const res = await fetch('http://localhost:8080/api/order-timelines/confirm-received', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, note: 'Khách xác nhận đã nhận hàng', imageUrls: returnImages, keycloakid }),
            });
            const data = await res.json();
            if (res.ok) {
                setConfirmSuccess('Xác nhận nhận hàng thành công!');
                setTimeout(() => { setConfirmSuccess(null); window.location.reload(); }, 1200);
            } else {
                setConfirmError(data.message || 'Không thể xác nhận nhận hàng');
            }
        } catch {
            setConfirmError('Lỗi hệ thống');
        } finally {
            setConfirmLoading(false);
        }
    };
    // Hàm gửi yêu cầu hoàn hàng
    const handleRequestReturn = async (orderId: number) => {
        setReturnLoading(true);
        setReturnError(null);
        setReturnSuccess(null);
        let keycloakid = '';
        keycloakid = KeycloakIdUser
        const note = returnReason === 'Khác' ? customReason : returnReason;
        try {
            const res = await fetch('http://localhost:8080/api/order-timelines/request-return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, note, imageUrls: returnImages, keycloakid }),
            });
            const data = await res.json();
            if (res.ok) {
                setReturnSuccess('Gửi yêu cầu hoàn hàng thành công!');
                setTimeout(() => { setReturnSuccess(null); setShowReturnPopup(false); window.location.reload(); }, 1200);
            } else {
                setReturnError(data.message || 'Không thể gửi yêu cầu hoàn hàng');
            }
        } catch {
            setReturnError('Lỗi hệ thống');
        } finally {
            setReturnLoading(false);
        }
    };

    // Hàm huỷ đơn hàng
    const handleCancelOrder = async (orderId: number, orderCode: string) => {
        setCancelLoading(true);
        let keycloakid = '';
        keycloakid = KeycloakIdUser
        try {
            const res = await fetch('http://localhost:8080/api/order-timelines/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, keycloakid }),
            });
            if (res.ok) {
                toast.success(`Đã huỷ đơn hàng thành công! (Mã đơn: ${orderCode})`);
                setTimeout(() => window.location.reload(), 1200);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Không thể huỷ đơn hàng');
            }
        } catch {
            toast.error('Lỗi hệ thống');
        } finally {
            setCancelLoading(false);
        }
    };

    // Hàm kiểm tra có thể đánh giá sản phẩm không
    const checkCanReviewProduct = async (productId: number) => {
        if (!session?.accessToken) return false;
        
        try {
            const res = await fetch(`http://localhost:8080/api/reviews/can-review?productId=${productId}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                return data.data || false;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    };

    // Hàm kiểm tra đã đánh giá sản phẩm chưa
    const checkHasReviewedProduct = async (productId: number) => {
        if (!session?.accessToken) return false;
        
        try {
            const res = await fetch(`http://localhost:8080/api/reviews/has-reviewed?productId=${productId}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                return data.data || false;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    };

    // Hàm kiểm tra trạng thái đánh giá cho tất cả sản phẩm trong đơn hàng
    const checkReviewStatusForOrder = async (orderId: number) => {
        if (!session?.accessToken) return;
        
        const orderDetail = orderDetailCache[orderId];
        if (!orderDetail || !orderDetail.items) return;
        
        const newCanReview: Record<number, boolean> = {};
        const newHasReviewed: Record<number, boolean> = {};
        
        for (const item of orderDetail.items) {
            if (item.productId) {
                // Gọi API kiểm tra quyền đánh giá
                const canReview = await checkCanReviewProduct(item.productId);
                
                // Gọi API kiểm tra đã đánh giá chưa
                const hasReviewed = await checkHasReviewedProduct(item.productId);
                
                newCanReview[item.productId] = canReview;
                newHasReviewed[item.productId] = hasReviewed;
            }
        }
        
        setCanReviewProduct(newCanReview);
        setHasReviewedProduct(newHasReviewed);
    };

    // Hàm tìm productId từ tên sản phẩm
    const findProductIdByName = async (productName: string): Promise<number | null> => {
        if (!session?.accessToken) return null;
        
        try {
            // Tìm sản phẩm theo tên
            const res = await fetch(`http://localhost:8080/api/products?page=0&size=100&search=${encodeURIComponent(productName)}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            
            if (data.data?.content && data.data.content.length > 0) {
                // Tìm sản phẩm có tên khớp nhất
                const matchingProduct = data.data.content.find((product: any) => 
                    product.productName?.toLowerCase().includes(productName.toLowerCase()) ||
                    product.displayName?.toLowerCase().includes(productName.toLowerCase())
                );
                
                if (matchingProduct) {
                    return matchingProduct.productId;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    };

    // Hàm mở modal đánh giá
    const handleOpenReviewModal = async (productId: number | undefined, productName: string) => {
        let finalProductId = productId;
        
        // Kiểm tra productId có hợp lệ không
        if (productId === undefined || productId === null || productId === 0) {
            // Thử tìm productId từ tên sản phẩm nếu có thể
            if (productName) {
                toast.success('Đang tìm thông tin sản phẩm...');
                
                const foundProductId = await findProductIdByName(productName);
                if (foundProductId) {
                    finalProductId = foundProductId;
                } else {
                    toast.error('Không tìm thấy ID sản phẩm. Vui lòng liên hệ hỗ trợ.');
                    return;
                }
            } else {
                toast.error('Không tìm thấy thông tin sản phẩm. Vui lòng thử lại sau.');
                return;
            }
        }
        
        setReviewProductId(finalProductId || null);
        setReviewProductName(productName);
        setReviewRating(5);
        setReviewComment('');
        setReviewError(null);
        setReviewSuccess(null);
        
        // Mở modal ngay lập tức, không cần kiểm tra trước
        setShowReviewModal(true);
    };

    // Hàm gửi đánh giá
    const handleSubmitReview = async () => {
        if (!reviewProductId || !session?.accessToken) return;
        
        setReviewLoading(true);
        setReviewError(null);
        
        try {
            const res = await fetch('http://localhost:8080/api/reviews', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    productId: reviewProductId,
                    rating: reviewRating,
                    comment: reviewComment
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setReviewSuccess('Đánh giá sản phẩm thành công!');
                
                // Cập nhật trạng thái đánh giá
                setHasReviewedProduct(prev => ({ ...prev, [reviewProductId]: true }));
                setCanReviewProduct(prev => ({ ...prev, [reviewProductId]: false }));
                
                // Hiển thị thông báo thành công
                toast.success('Đánh giá sản phẩm thành công!');
                
                setTimeout(() => {
                    setShowReviewModal(false);
                    setReviewSuccess(null);
                }, 1500);
            } else {
                setReviewError(data.message || 'Không thể gửi đánh giá');
            }
        } catch {
            setReviewError('Lỗi hệ thống');
        } finally {
            setReviewLoading(false);
        }
    };

    const formatTimelineNote = (timeline: OrderTimeline) => {
        const toStatus = timeline.toStatus;
        
        // Mapping trạng thái cho timeline
        const TIMELINE_STATUS_MAP: Record<string, string> = {
            Pending: 'Đơn hàng đang chờ xác nhận',
            WaitingForStock: 'Sản phẩm hiện chưa có sẵn. Đơn hàng được thêm vào danh sách chờ',
            Confirmed: 'Đơn hàng đã được xác nhận',
            Shipping: 'Đơn hàng đang được vận chuyển',
            Delivered: 'Đơn hàng đã được giao thành công',
            DeliveryFailed: 'Giao hàng không thành công',
            ReturnedToSeller: 'Đơn hàng đã được trả về người bán',
            CustomerReceived: 'Khách hàng đã xác nhận nhận hàng',
            ReturnRequested: 'Khách hàng yêu cầu trả hàng',
            ReturnApproved: 'Yêu cầu trả hàng đã được chấp nhận',
            ReturnRejected: 'Yêu cầu trả hàng đã bị từ chối',
            Refunded: 'Đơn hàng đã được hoàn tiền',
            Completed: 'Đơn hàng đã hoàn tất',
            Cancelled: 'Đơn hàng đã bị hủy',
        };
        
        return TIMELINE_STATUS_MAP[toStatus] || toStatus;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <OrderTabs />
            {/* Header */}
            <Card>
                <CardHeader className="flex gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {user?.avatarUrl ? (
                        <CldImage
                            width={64}
                            height={64}
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                        ) : (
                            <div className="w-full h-full bg-default-200 flex items-center justify-center">
                                <span className="text-default-500 text-lg font-medium">
                                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xl font-bold">Đơn hàng online của tôi</p>
                        <p className="text-small text-default-500">
                            {user?.fullName || user?.username} • {user?.email}
                        </p>
                        {user?.phoneNumber && (
                        <p className="text-small text-default-500 flex items-center gap-1">
                            <Phone size={12} />
                            {user.phoneNumber}
                        </p>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Tổng đơn hàng */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <ShoppingCart className="text-primary" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-primary">{allOrders.length}</p>
                        <p className="text-small text-default-500">Tổng đơn hàng</p>
                        <p className="text-xs text-default-400">Tất cả đơn hàng đã đặt</p>
                    </CardBody>
                </Card>
                
                {/* Card 2: Đơn hàng thành công */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Package className="text-success" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-success">
                            {allOrders.filter(o => o.orderStatus.toLowerCase() === 'completed').length}
                        </p>
                        <p className="text-small text-default-500">Đơn hàng thành công</p>
                        <p className="text-xs text-default-400">Đã giao và hoàn thành</p>
                    </CardBody>
                </Card>

                {/* Card 3: Đơn hàng đang xử lý */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Clock className="text-warning" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-warning">
                            {allOrders.filter(o => ['pending', 'confirmed', 'shipping'].includes(o.orderStatus.toLowerCase())).length}
                        </p>
                        <p className="text-small text-default-500">Đang xử lý</p>
                        <p className="text-xs text-default-400">Chờ xác nhận, giao hàng</p>
                    </CardBody>
                </Card>

                {/* Card 4: Tổng tiền đã chi */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CreditCard className="text-secondary" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-secondary">
                            {formatCurrency(allOrders.filter(o => o.orderStatus.toLowerCase() === 'completed').reduce((sum, order) => sum + order.finalAmount, 0))}
                        </p>
                        <p className="text-small text-default-500">Tổng tiền đã chi</p>
                        <p className="text-xs text-default-400">Chỉ đơn hàng hoàn thành</p>
                    </CardBody>
                </Card>

                {/* Card 5: Tiết kiệm từ voucher */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Gift className="text-success" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-success">
                            {formatCurrency(allOrders.filter(o => o.orderStatus.toLowerCase() === 'completed').reduce((sum, order) => {
                                // Tính tiết kiệm từ voucher: sử dụng discountAmount từ OrderSummaryDTO
                                return sum + (order.discountAmount || 0);
                            }, 0))}
                        </p>
                        <p className="text-small text-default-500">Tiết kiệm từ voucher</p>
                        <p className="text-xs text-default-400">Chỉ đơn hàng hoàn thành</p>
                    </CardBody>
                </Card>

                {/* Card 6: Đơn hàng trung bình */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="text-warning" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-warning">
                            {(() => {
                                const completedOrders = allOrders.filter(o => o.orderStatus.toLowerCase() === 'completed');
                                if (completedOrders.length > 0) {
                                    const totalAmount = completedOrders.reduce((sum, order) => sum + order.finalAmount, 0);
                                    return formatCurrency(totalAmount / completedOrders.length);
                                }
                                return '0 ₫';
                            })()}
                        </p>
                        <p className="text-small text-default-500">Đơn hàng trung bình</p>
                        <p className="text-xs text-default-400">Giá trị đơn hàng hoàn thành</p>
                    </CardBody>
                </Card>

                {/* Card 7: Đơn hàng gần nhất */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Calendar className="text-info" size={24} />
                        </div>
                        <p className="text-lg font-bold text-info">
                            {allOrders.length > 0 
                                ? formatDate(allOrders[0].createdAt)
                                : 'Chưa có đơn hàng'
                            }
                        </p>
                        <p className="text-small text-default-500">Đơn hàng gần nhất</p>
                        <p className="text-xs text-default-400">Ngày đặt cuối cùng</p>
                    </CardBody>
                </Card>

                {/* Card 8: Tỷ lệ thành công */}
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Percent className="text-primary" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-primary">
                            {allOrders.length > 0 
                                ? Math.round((allOrders.filter(o => o.orderStatus.toLowerCase() === 'completed').length / allOrders.length) * 100)
                                : 0
                            }%
                        </p>
                        <p className="text-small text-default-500">Tỷ lệ thành công</p>
                        <p className="text-xs text-default-400">% đơn hàng hoàn thành</p>
                    </CardBody>
                </Card>
            </div>

            {/* Tabs đẹp */}
            <div className="flex border-b mb-4">
                {tabList.map(tab => (
                    <button
                        key={tab.key}
                        className={`px-6 py-2 -mb-px font-semibold transition-colors border-b-2
                          ${activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-primary'}
                        `}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {/* Bảng đơn hàng */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Danh sách đơn hàng online</h3>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8">Đang tải...</div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart size={48} className="text-default-400 mx-auto mb-4" />
                            <p className="text-default-500">Không có đơn hàng nào ở trạng thái này</p>
                        </div>
                    ) : (
                        <Table aria-label="Bảng đơn hàng online">
                            <TableHeader>
                                <TableColumn>MÃ ĐƠN HÀNG</TableColumn>
                                <TableColumn>NGÀY ĐẶT</TableColumn>
                                <TableColumn>TRẠNG THÁI</TableColumn>
                                <TableColumn>TỔNG TIỀN</TableColumn>
                                <TableColumn>HÀNH ĐỘNG</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <React.Fragment key={order.orderId}>
                                        <TableRow>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.orderCode}</p>
                                                <p className="text-small text-default-500">{order.customerName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-default-400" />
                                                    {formatDate(order.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                color={getStatusColor(order.orderStatus)} 
                                                variant="flat"
                                                size="sm"
                                            >
                                                {order.orderStatus}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{formatCurrency(order.finalAmount)}</p>
                                                {order.discountAmount > 0 && (
                                                    <p className="text-small text-success">
                                                        Giảm: {formatCurrency(order.discountAmount)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                        onClick={() => setOpenDetailOrderId(openDetailOrderId === order.orderId ? null : order.orderId)}
                                                    >
                                                        {openDetailOrderId === order.orderId ? 'Đóng' : 'Chi tiết đầy đủ'}
                                                    </Button>
                                                    {/* Nút huỷ đơn cho trạng thái Pending */}
                                                    {order.orderStatus === 'Pending' && (
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            variant="flat"
                                                            onClick={() => setShowCancelConfirm({ orderId: order.orderId, orderCode: order.orderCode })}
                                                            disabled={cancelLoading}
                                                        >
                                                            {cancelLoading ? 'Đang huỷ...' : 'Huỷ đơn'}
                                                </Button>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                        {/* Hiển thị chi tiết nếu openDetailOrderId === order.orderId */}
                                        {openDetailOrderId === order.orderId && (
                                            <TableRow>
                                                <TableCell colSpan={5}>
                                                    {loadingDetail ? (
                                                        <div className="text-center py-8">Đang tải chi tiết đơn hàng...</div>
                                                    ) : detailError ? (
                                                        <div className="text-center text-red-600 py-8">{detailError}</div>
                                                    ) : orderDetailCache[order.orderId] ? (
                                                        <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200">
                                                            {/* Thông tin đơn hàng */}
                                                            <div className="mb-4">
                                                                <h3 className="text-lg font-bold text-blue-700 mb-2">Thông tin đơn hàng</h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div><span className="font-semibold">Mã đơn hàng:</span> {orderDetailCache[order.orderId].orderCode}</div>
                                                                        <div><span className="font-semibold">Ngày đặt:</span> {formatDate(orderDetailCache[order.orderId].orderDate)}</div>
                                                                        <div>
                                                                            <span className="font-semibold">Trạng thái:</span> 
                                                                            <span className={`inline-block ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(orderDetailCache[order.orderId].orderStatus)}`}>
                                                                                {orderDetailCache[order.orderId].orderStatus}
                                                                            </span>
                                                                        </div>
                                                                        <div><span className="font-semibold">Ghi chú:</span> {orderDetailCache[order.orderId].customerNotes || 'Không có'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div><span className="font-semibold">Phương thức thanh toán:</span> {orderDetailCache[order.orderId].paymentMethod}</div>
                                                                        <div>
                                                                            <span className="font-semibold">Trạng thái thanh toán:</span>
                                                                            <span className={`inline-block ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(orderDetailCache[order.orderId].paymentStatus)}`}>
                                                                                {orderDetailCache[order.orderId].paymentStatus}
                                                                            </span>
                                                                        </div>
                                                                        <div><span className="font-semibold">Phí ship:</span> {formatCurrency(orderDetailCache[order.orderId].shippingFee)}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Thông tin khách hàng */}
                                                            <div className="mb-4">
                                                                <h3 className="text-lg font-bold text-green-700 mb-2">Thông tin khách hàng</h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div><span className="font-semibold">Khách hàng:</span> {orderDetailCache[order.orderId].customerName}</div>
                                                                        <div><span className="font-semibold">Số điện thoại:</span> {orderDetailCache[order.orderId].phoneNumber}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div><span className="font-semibold">Địa chỉ:</span> {orderDetailCache[order.orderId].streetAddress}, {orderDetailCache[order.orderId].wardCommune}, {orderDetailCache[order.orderId].district}, {orderDetailCache[order.orderId].cityProvince}, {orderDetailCache[order.orderId].country}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Danh sách sản phẩm */}
                                                            <div className="mb-4">
                                                                <h3 className="text-lg font-bold text-purple-700 mb-2">Danh sách sản phẩm</h3>
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                                                        <thead className="bg-gray-100">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Sản phẩm</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Thông tin</th>
                                                                                <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Số lượng</th>
                                                                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Đơn giá</th>
                                                                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Thành tiền</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {orderDetailCache[order.orderId].items?.map((item: OrderItem, idx: number) => (
                                                                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                                                    <td className="px-4 py-2 font-medium text-gray-900">{item.productName}</td>
                                                                                    <td className="px-4 py-2 text-gray-700">{item.variantName}</td>
                                                                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                                                                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                            {/* Tổng kết */}
                                                            <div className="bg-blue-50 rounded-lg p-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-semibold text-gray-700">Tổng tiền hàng:</span>
                                                                        <span className="text-gray-700">{formatCurrency(orderDetailCache[order.orderId]?.subTotal || 0)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-semibold text-gray-700">Phí vận chuyển:</span>
                                                                        <span className="text-gray-700">{formatCurrency(orderDetailCache[order.orderId]?.shippingFee || 0)}</span>
                                                                    </div>
                                                                    {(orderDetailCache[order.orderId]?.voucherDiscount || 0) > 0 && (
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-semibold text-green-700">Giảm giá từ voucher:</span>
                                                                                {orderDetailCache[order.orderId]?.voucherCode && (
                                                                                    <span className="text-sm font-medium text-green-600">Mã: {orderDetailCache[order.orderId]?.voucherCode}</span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-green-700 font-semibold">-{formatCurrency(orderDetailCache[order.orderId]?.voucherDiscount || 0)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="border-t pt-2 flex justify-between items-center">
                                                                        <span className="font-semibold text-gray-700 text-lg">Tổng thanh toán:</span>
                                                                        <span className="text-2xl font-bold text-blue-700">{formatCurrency(orderDetailCache[order.orderId]?.finalAmount || 0)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Order Timeline */}
                                                            <div className="mt-6">
                                                                <h3 className="text-lg font-bold text-orange-700 mb-4">Lịch sử trạng thái đơn hàng</h3>
                                                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                                                    {timelineLoading[order.orderId] ? (
                                                                        <div className="text-center py-4">
                                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                                                            <p className="text-sm text-gray-500 mt-2">Đang tải lịch sử...</p>
                                                                        </div>
                                                                    ) : orderTimeline[order.orderId]?.length > 0 ? (
                                                                        <div className="space-y-4">
                                                                            {orderTimeline[order.orderId].slice().reverse().map((timeline, index) => (
                                                                                <div key={timeline.id} className="relative">
                                                                                    {/* Timeline line */}
                                                                                    {index < orderTimeline[order.orderId].length - 1 && (
                                                                                        <div className="absolute left-3 top-6 w-0.5 h-8 bg-gray-200"></div>
                                                                                    )}
                                                                                    
                                                                                    <div className="flex items-start space-x-3">
                                                                                        {/* Timeline dot */}
                                                                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                                                                                            index === 0 ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                                                        }`}></div>
                                                                                        
                                                                                        {/* Timeline content */}
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm text-gray-900 font-medium">
                                                                                                {formatTimelineNote(timeline)}
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                                {formatDateTime(timeline.changedAt)}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-gray-500 text-sm text-center">Chưa có lịch sử trạng thái</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {orderDetailCache[order.orderId].orderStatus === 'Delivered' && (
                                                                <div className="flex gap-4 mt-4">
                                                                    <Button color="success" onClick={() => handleConfirmReceived(order.orderId)} disabled={confirmLoading}>
                                                                        {confirmLoading ? 'Đang xác nhận...' : 'Xác nhận nhận hàng'}
                                                                    </Button>
                                                                    <Button color="warning" onClick={() => setShowReturnPopup(true)}>
                                                                        Yêu cầu hoàn hàng
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {/* Button đánh giá cho đơn hàng hoàn thành */}
                                                            {orderDetailCache[order.orderId].orderStatus === 'Completed' && (
                                                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                                    <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                                                                        <span className="mr-2">⭐</span>
                                                                        Đánh giá sản phẩm
                                                                    </h4>
                                                                    <p className="text-sm text-green-700 mb-4">
                                                                        Chia sẻ trải nghiệm của bạn về các sản phẩm trong đơn hàng này
                                                                    </p>
                                                                    <div className="space-y-3">
                                                                        {orderDetailCache[order.orderId].items?.map((item: OrderItem, idx: number) => {
                                                                            const productId = item.productId;
                                                                            const canReview = productId ? canReviewProduct[productId] : false;
                                                                            const hasReviewed = productId ? hasReviewedProduct[productId] : false;
                                                                            
                                                                            return (
                                                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                                                                                    <div className="flex-1">
                                                                                        <h5 className="font-semibold text-gray-900">{item.productName}</h5>
                                                                                        <p className="text-sm text-gray-600">{item.variantName}</p>
                                                                                    </div>
                                                                                    
                                                                                    {hasReviewed ? (
                                                                                        <div className="flex items-center space-x-2">
                                                                                            <span className="text-green-600 font-semibold">✅ Đã đánh giá</span>
                                                                                        </div>
                                                                                    ) : canReview ? (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            color="success"
                                                                                            variant="solid"
                                                                                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
                                                                                            onClick={() => handleOpenReviewModal(item.productId, item.productName)}
                                                                                        >
                                                                                            ⭐ Đánh giá ngay
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <span className="text-gray-500 text-sm">Không thể đánh giá</span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {confirmError && <div className="text-red-600 mt-2">{confirmError}</div>}
                                                            {confirmSuccess && <div className="text-green-600 mt-2">{confirmSuccess}</div>}
                                                        </div>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>
            {/* Popup yêu cầu hoàn hàng */}
            <Dialog open={showReturnPopup} onClose={() => setShowReturnPopup(false)} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="fixed inset-0 bg-black opacity-30" />
                    <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto z-10">
                        <Dialog.Title className="text-lg font-bold mb-4">Yêu cầu hoàn hàng</Dialog.Title>
                        <div className="mb-3">
                            <label className="block font-semibold mb-1">Lý do hoàn hàng</label>
                            <select
                                className="w-full border rounded px-3 py-2"
                                value={returnReason}
                                onChange={e => setReturnReason(e.target.value)}
                            >
                                <option value="">-- Chọn lý do --</option>
                                {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        {returnReason === 'Khác' && (
                            <div className="mb-3">
                                <label className="block font-semibold mb-1">Nhập lý do</label>
                                <input
                                    className="w-full border rounded px-3 py-2"
                                    value={customReason}
                                    onChange={e => setCustomReason(e.target.value)}
                                    placeholder="Nhập lý do hoàn hàng..."
                                />
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="block font-semibold mb-1">Ảnh minh họa (URL, mỗi dòng 1 ảnh)</label>
                            <textarea
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                                value={returnImages.join('\n')}
                                onChange={e => setReturnImages(e.target.value.split('\n'))}
                                placeholder="https://example.com/img1.jpg\nhttps://example.com/img2.jpg"
                            />
                        </div>
                        {returnError && <div className="text-red-600 mb-2">{returnError}</div>}
                        {returnSuccess && <div className="text-green-600 mb-2">{returnSuccess}</div>}
                        <div className="flex justify-end gap-2 mt-4">
                            <Button color="danger" variant="flat" onClick={() => setShowReturnPopup(false)} disabled={returnLoading}>Hủy</Button>
                            <Button color="primary" onClick={() => handleRequestReturn(openDetailOrderId!)} disabled={returnLoading || !returnReason || (returnReason === 'Khác' && !customReason)}>
                                {returnLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>
            {/* Dialog xác nhận huỷ đơn */}
            <Dialog open={!!showCancelConfirm} onClose={() => setShowCancelConfirm(null)} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="fixed inset-0 bg-black opacity-30" />
                    <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto z-10">
                        <Dialog.Title className="text-lg font-bold mb-4 text-red-700">Xác nhận huỷ đơn hàng</Dialog.Title>
                        <div className="mb-4 text-gray-700">Bạn có chắc chắn muốn huỷ đơn hàng <span className="font-semibold">{showCancelConfirm?.orderCode}</span> không?</div>
                        <div className="flex justify-end gap-2">
                            <Button color="default" variant="flat" onClick={() => setShowCancelConfirm(null)} disabled={cancelLoading}>Không</Button>
                            <Button color="danger" onClick={() => { if (showCancelConfirm) { handleCancelOrder(showCancelConfirm.orderId, showCancelConfirm.orderCode); setShowCancelConfirm(null); } }} disabled={cancelLoading}>
                                {cancelLoading ? 'Đang huỷ...' : 'Xác nhận huỷ'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Modal đánh giá sản phẩm */}
            <Dialog open={showReviewModal} onClose={() => setShowReviewModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="fixed inset-0 bg-black opacity-30" />
                    <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto z-10">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-2">⭐</div>
                            <Dialog.Title className="text-2xl font-bold text-green-700">Đánh giá sản phẩm</Dialog.Title>
                            {reviewProductName && (
                                <p className="text-sm text-gray-600 mt-2">{reviewProductName}</p>
                            )}
                        </div>
                        
                        {reviewError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {reviewError}
                            </div>
                        )}
                        
                        {reviewSuccess && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                                {reviewSuccess}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block font-semibold mb-3 text-center">Bạn đánh giá sản phẩm này như thế nào?</label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        className={`text-4xl ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors transform hover:scale-110`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-3 font-medium">
                                {reviewRating === 1 && '😞 Rất không hài lòng'}
                                {reviewRating === 2 && '😕 Không hài lòng'}
                                {reviewRating === 3 && '😐 Bình thường'}
                                {reviewRating === 4 && '😊 Hài lòng'}
                                {reviewRating === 5 && '😍 Rất hài lòng'}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Nhận xét của bạn</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                rows={4}
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Nhận xét giúp người khác hiểu rõ hơn về sản phẩm</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button 
                                color="default" 
                                variant="flat" 
                                onClick={() => setShowReviewModal(false)}
                                disabled={reviewLoading}
                                className="px-6"
                            >
                                Hủy
                            </Button>
                            <Button 
                                color="success" 
                                onClick={handleSubmitReview}
                                disabled={reviewLoading || !reviewComment.trim()}
                                className="px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                                {reviewLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang gửi...
                                    </div>
                                ) : (
                                    'Gửi đánh giá'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}