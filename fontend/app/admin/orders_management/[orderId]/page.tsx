'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, EyeIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderItem {
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderTimeline {
    id: number;
    orderId: number;
    fromStatus: string;
    toStatus: string;
    note: string;
    changedAt: string;
}

interface OrderOnlineDetail {
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
    finalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    items: OrderItem[];
}

const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipped: 'Đang vận chuyển',
    Delivered: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
    CustomerReceived: 'Khách hàng đã nhận',
    Completed: 'Hoàn thành',
    Shipping: 'Đang vận chuyển',
    ReturnRequested: 'Yêu cầu hoàn hàng',
    ReturnApproved: 'Đã duyệt hoàn hàng',
    ReturnRejected: 'Từ chối hoàn hàng',
    ReturnedToSeller: 'Đã trả về người bán',
    Refunded: 'Đã hoàn tiền',
    DeliveryFailed: 'Giao hàng thất bại',
};

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Processing: 'bg-orange-100 text-orange-800',
    Shipped: 'bg-purple-100 text-purple-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ thanh toán',
    Paid: 'Đã thanh toán',
    Failed: 'Thanh toán thất bại',
    Refunded: 'Đã hoàn tiền',
};

export default function OrderDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const orderId = params?.orderId as string;
    
    const [order, setOrder] = useState<OrderOnlineDetail | null>(null);
    const [orderTimeline, setOrderTimeline] = useState<OrderTimeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            if (!session?.accessToken || !orderId) return;

            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8080/api/orders/detail-online/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Không tìm thấy đơn hàng');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('API Response:', data);
                
                // Handle different response formats
                if (data.data) {
                    setOrder(data.data);
                } else if (data.orderId) {
                    setOrder(data);
                } else {
                    console.error('Unexpected response format:', data);
                    setError('Định dạng dữ liệu không đúng');
                }
            } catch (err) {
                console.error('Error fetching order detail:', err);
                setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        const fetchOrderTimeline = async () => {
            if (!session?.accessToken || !orderId) return;

            try {
                const response = await fetch(`http://localhost:8080/api/order-timelines/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.data) {
                        setOrderTimeline(data.data);
                    } else {
                        setOrderTimeline([]);
                    }
                } else {
                    console.error('Failed to fetch order timeline');
                    setOrderTimeline([]);
                }
            } catch (err) {
                console.error('Error fetching order timeline:', err);
                setOrderTimeline([]);
            }
        };

        fetchOrderDetail();
        fetchOrderTimeline();
    }, [session, orderId]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!session?.accessToken || !orderId) return;

        try {
            const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Refresh order data
                window.location.reload();
            } else {
                alert('Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            alert('Lỗi khi cập nhật trạng thái' + error);
        }
    };

    const handleCancelOrder = async () => {
        if (!session?.accessToken || !orderId) return;

        // Confirm before canceling
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/orders/cancel/${orderId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                alert('Hủy đơn hàng thành công!');
                // Redirect back to list
                router.push('/admin/orders_management');
            } else {
                const errorData = await response.json();
                alert(`Hủy đơn hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            alert('Lỗi khi hủy đơn hàng' + error);
        }
    };

    const formatTimelineNote = (timeline: OrderTimeline) => {
        const fromStatus = STATUS_MAP[timeline.fromStatus] || timeline.fromStatus;
        const toStatus = STATUS_MAP[timeline.toStatus] || timeline.toStatus;
        
        if (timeline.fromStatus === timeline.toStatus) {
            return timeline.note || `Cập nhật trạng thái: ${fromStatus}`;
        }
        
        return timeline.note || `Chuyển từ ${fromStatus} sang ${toStatus}`;
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        href="/admin/orders_management"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy đơn hàng</h2>
                    <Link
                        href="/admin/orders_management"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/orders_management"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-5 h-5 mr-2" />
                            Quay lại
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Chi tiết đơn hàng #{order.orderCode}
                            </h1>
                            <p className="text-gray-600">Thông tin chi tiết đơn hàng online</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_MAP[order.orderStatus] || order.orderStatus}
                        </span>
                        <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(STATUS_MAP).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                        {order.orderStatus === 'Pending' && (
                            <button
                                onClick={handleCancelOrder}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center text-sm"
                            >
                                <XMarkIcon className="w-4 h-4 mr-1" />
                                Hủy đơn
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
                                    <p className="text-lg font-semibold text-gray-900">{order.orderCode}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ngày đặt hàng</label>
                                    <p className="text-gray-900">
                                        {new Date(order.orderDate).toLocaleDateString('vi-VN')} - {new Date(order.orderDate).toLocaleTimeString('vi-VN')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phương thức giao hàng</label>
                                    <p className="text-gray-900">Giao hàng tận nơi</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                                    <p className="text-gray-900">{order.paymentMethod || 'Chưa xác định'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Trạng thái thanh toán</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                        order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                                        order.paymentStatus === 'Refunded' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {PAYMENT_STATUS_MAP[order.paymentStatus || 'Pending'] || 'Chờ thanh toán'}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                                    <p className="text-gray-900">Không có ghi chú</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <EyeIcon className="w-5 h-5 mr-2" />
                            Thông tin khách hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-blue-600 font-semibold">
                                            {order.customerName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                                        <p className="text-sm text-gray-500">Khách hàng</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <PhoneIcon className="w-4 h-4 mr-2" />
                                    {order.phoneNumber}
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                                    Không có email
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Người nhận</label>
                                    <p className="text-gray-900">{order.customerName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Địa chỉ giao hàng</label>
                                    <div className="flex items-start text-gray-900">
                                        <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                        <p>{order.streetAddress}, {order.wardCommune}, {order.district}, {order.cityProvince}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Sản phẩm đã đặt</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thông tin
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số lượng
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đơn giá
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item: OrderItem, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-16 w-16">
                                                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                                            <span className="text-gray-400 text-xs">No Image</span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.productName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {item.variantName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <span className="text-gray-500">Sản phẩm</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {item.unitPrice.toLocaleString('vi-VN')} ₫
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                {item.totalPrice.toLocaleString('vi-VN')} ₫
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tổng tiền hàng:</span>
                                <span className="text-gray-900">{order.subTotal.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Phí vận chuyển:</span>
                                <span className="text-gray-900">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            {/* Discount removed as not available in API */}
                            {/* {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giảm giá:</span>
                                    <span className="text-red-600">-{order.discountAmount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                            )} */}
                            <hr className="border-gray-200" />
                            <div className="flex justify-between text-lg font-semibold">
                                <span className="text-gray-900">Tổng thanh toán:</span>
                                <span className="text-blue-600">{order.finalAmount.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử trạng thái đơn hàng</h3>
                        <div className="max-h-96 overflow-y-auto">
                            {orderTimeline.length > 0 ? (
                                <div className="space-y-4">
                                    {orderTimeline.map((timeline, index) => (
                                        <div key={timeline.id} className="relative">
                                            {/* Timeline line */}
                                            {index < orderTimeline.length - 1 && (
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
                                <p className="text-gray-500 text-sm">Chưa có lịch sử trạng thái</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleStatusUpdate('Confirmed')}
                                disabled={order.orderStatus === 'Confirmed'}
                                className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                                    order.orderStatus === 'Confirmed'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                Xác nhận đơn hàng
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Processing')}
                                disabled={order.orderStatus === 'Processing'}
                                className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                                    order.orderStatus === 'Processing'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                            >
                                Chuyển vận chuyển
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Shipped')}
                                disabled={order.orderStatus === 'Shipped'}
                                className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                                    order.orderStatus === 'Shipped'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-purple-500 text-white hover:bg-purple-600'
                                }`}
                            >
                                Đang vận chuyển
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Delivered')}
                                disabled={order.orderStatus === 'Delivered'}
                                className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                                    order.orderStatus === 'Delivered'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                            >
                                Hoàn thành
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Cancelled')}
                                disabled={order.orderStatus === 'Cancelled'}
                                className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                                    order.orderStatus === 'Cancelled'
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                            >
                                Hủy đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 