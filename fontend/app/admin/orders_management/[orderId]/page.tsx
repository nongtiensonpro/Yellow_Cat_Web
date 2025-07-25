// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useSession } from 'next-auth/react';
// import { useParams, useRouter } from 'next/navigation';
// import { ArrowLeftIcon, EyeIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import Link from 'next/link';
//
// interface OrderItem {
//     productName: string;
//     variantName: string;
//     quantity: number;
//     unitPrice: number;
//     totalPrice: number;
// }
//
// interface OrderOnlineDetail {
//     orderId: number;
//     orderCode: string;
//     orderStatus: string;
//     customerName: string;
//     phoneNumber: string;
//     wardCommune: string;
//     streetAddress: string;
//     district: string;
//     cityProvince: string;
//     country: string;
//     orderDate: string;
//     subTotal: number;
//     shippingFee: number;
//     finalAmount: number;
//     paymentStatus: string;
//     paymentMethod: string;
//     items: OrderItem[];
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
// };
//
// const STATUS_COLORS: Record<string, string> = {
//     Pending: 'bg-yellow-100 text-yellow-800',
//     Confirmed: 'bg-blue-100 text-blue-800',
//     Processing: 'bg-orange-100 text-orange-800',
//     Shipped: 'bg-purple-100 text-purple-800',
//     Delivered: 'bg-green-100 text-green-800',
//     Cancelled: 'bg-red-100 text-red-800',
// };
//
// const PAYMENT_STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ thanh toán',
//     Paid: 'Đã thanh toán',
//     Failed: 'Thanh toán thất bại',
//     Refunded: 'Đã hoàn tiền',
// };
//
// export default function OrderDetailPage() {
//     const { data: session } = useSession();
//     const params = useParams();
//     const router = useRouter();
//     const orderId = params?.orderId as string;
//
//     const [order, setOrder] = useState<OrderOnlineDetail | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     useEffect(() => {
//         const fetchOrderDetail = async () => {
//             if (!session?.accessToken || !orderId) return;
//
//             try {
//                 setLoading(true);
//                 const response = await fetch(`http://localhost:8080/api/orders/detail-online/${orderId}`, {
//                     headers: {
//                         'Authorization': `Bearer ${session.accessToken}`,
//                     },
//                 });
//
//                 if (!response.ok) {
//                     if (response.status === 404) {
//                         throw new Error('Không tìm thấy đơn hàng');
//                     }
//                     throw new Error(`HTTP error! status: ${response.status}`);
//                 }
//
//                 const data = await response.json();
//                 console.log('API Response:', data);
//
//                 // Handle different response formats
//                 if (data.data) {
//                     setOrder(data.data);
//                 } else if (data.orderId) {
//                     setOrder(data);
//                 } else {
//                     console.error('Unexpected response format:', data);
//                     setError('Định dạng dữ liệu không đúng');
//                 }
//             } catch (err) {
//                 console.error('Error fetching order detail:', err);
//                 setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchOrderDetail();
//     }, [session, orderId]);
//
//     const handleStatusUpdate = async (newStatus: string) => {
//         if (!session?.accessToken || !orderId) return;
//
//         try {
//             const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${session.accessToken}`,
//                 },
//                 body: JSON.stringify({ status: newStatus }),
//             });
//
//             if (response.ok) {
//                 // Refresh order data
//                 window.location.reload();
//             } else {
//                 alert('Cập nhật trạng thái thất bại');
//             }
//         } catch (error) {
//             alert('Lỗi khi cập nhật trạng thái' + error);
//         }
//     };
//
//     const handleCancelOrder = async () => {
//         if (!session?.accessToken || !orderId) return;
//
//         // Confirm before canceling
//         if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
//             return;
//         }
//
//         try {
//             const response = await fetch(`http://localhost:8080/api/orders/cancel/${orderId}`, {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${session.accessToken}`,
//                 },
//             });
//
//             if (response.ok) {
//                 alert('Hủy đơn hàng thành công!');
//                 // Redirect back to list
//                 router.push('/admin/orders_management');
//             } else {
//                 const errorData = await response.json();
//                 alert(`Hủy đơn hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
//             }
//         } catch (error) {
//             alert('Lỗi khi hủy đơn hàng' + error);
//         }
//     };
//
//     if (loading) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <div className="text-center">
//                     <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
//                     <p className="text-gray-600 mb-4">{error}</p>
//                     <Link
//                         href="/admin/orders_management"
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Quay lại danh sách
//                     </Link>
//                 </div>
//             </div>
//         );
//     }
//
//     if (!order) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <div className="text-center">
//                     <h2 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy đơn hàng</h2>
//                     <Link
//                         href="/admin/orders_management"
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Quay lại danh sách
//                     </Link>
//                 </div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             {/* Header */}
//             <div className="mb-8">
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                         <Link
//                             href="/admin/orders_management"
//                             className="flex items-center text-gray-600 hover:text-gray-900"
//                         >
//                             <ArrowLeftIcon className="w-5 h-5 mr-2" />
//                             Quay lại
//                         </Link>
//                         <div>
//                             <h1 className="text-3xl font-bold text-gray-900">
//                                 Chi tiết đơn hàng #{order.orderCode}
//                             </h1>
//                             <p className="text-gray-600">Thông tin chi tiết đơn hàng online</p>
//                         </div>
//                     </div>
//                     <div className="flex items-center space-x-4">
//                         <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
//                             {STATUS_MAP[order.orderStatus] || order.orderStatus}
//                         </span>
//                         <select
//                             value={order.orderStatus}
//                             onChange={(e) => handleStatusUpdate(e.target.value)}
//                             className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         >
//                             {Object.entries(STATUS_MAP).map(([key, value]) => (
//                                 <option key={key} value={key}>{value}</option>
//                             ))}
//                         </select>
//                         {order.orderStatus === 'Pending' && (
//                             <button
//                                 onClick={handleCancelOrder}
//                                 className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center text-sm"
//                             >
//                                 <XMarkIcon className="w-4 h-4 mr-1" />
//                                 Hủy đơn
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Main Content */}
//                 <div className="lg:col-span-2 space-y-6">
//                     {/* Order Information */}
//                     <div className="bg-white rounded-lg shadow p-6">
//                         <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             <div className="space-y-3">
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
//                                     <p className="text-lg font-semibold text-gray-900">{order.orderCode}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Ngày đặt hàng</label>
//                                     <p className="text-gray-900">
//                                         {new Date(order.orderDate).toLocaleDateString('vi-VN')} - {new Date(order.orderDate).toLocaleTimeString('vi-VN')}
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Phương thức giao hàng</label>
//                                     <p className="text-gray-900">Giao hàng tận nơi</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
//                                     <p className="text-gray-900">{order.paymentMethod || 'Chưa xác định'}</p>
//                                 </div>
//                             </div>
//                             <div className="space-y-3">
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Trạng thái thanh toán</label>
//                                     <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                                         order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
//                                         order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
//                                         order.paymentStatus === 'Refunded' ? 'bg-orange-100 text-orange-800' :
//                                         'bg-yellow-100 text-yellow-800'
//                                     }`}>
//                                         {PAYMENT_STATUS_MAP[order.paymentStatus || 'Pending'] || 'Chờ thanh toán'}
//                                     </span>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Ghi chú</label>
//                                     <p className="text-gray-900">Không có ghi chú</p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Customer Information */}
//                     <div className="bg-white rounded-lg shadow p-6">
//                         <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
//                             <EyeIcon className="w-5 h-5 mr-2" />
//                             Thông tin khách hàng
//                         </h2>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             <div className="space-y-3">
//                                 <div className="flex items-center">
//                                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
//                                         <span className="text-blue-600 font-semibold">
//                                             {order.customerName.charAt(0).toUpperCase()}
//                                         </span>
//                                     </div>
//                                     <div>
//                                         <p className="font-semibold text-gray-900">{order.customerName}</p>
//                                         <p className="text-sm text-gray-500">Khách hàng</p>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center text-gray-600">
//                                     <PhoneIcon className="w-4 h-4 mr-2" />
//                                     {order.phoneNumber}
//                                 </div>
//                                 <div className="flex items-center text-gray-600">
//                                     <EnvelopeIcon className="w-4 h-4 mr-2" />
//                                     Không có email
//                                 </div>
//                             </div>
//                             <div className="space-y-3">
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Người nhận</label>
//                                     <p className="text-gray-900">{order.customerName}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm font-medium text-gray-500">Địa chỉ giao hàng</label>
//                                     <div className="flex items-start text-gray-900">
//                                         <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
//                                         <p>{order.streetAddress}, {order.wardCommune}, {order.district}, {order.cityProvince}</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Order Items */}
//                     <div className="bg-white rounded-lg shadow overflow-hidden">
//                         <div className="px-6 py-4 border-b border-gray-200">
//                             <h2 className="text-xl font-semibold text-gray-900">Sản phẩm đã đặt</h2>
//                         </div>
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Sản phẩm
//                                         </th>
//                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Thông tin
//                                         </th>
//                                         <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Số lượng
//                                         </th>
//                                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Đơn giá
//                                         </th>
//                                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                             Thành tiền
//                                         </th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {order.items.map((item: OrderItem, index: number) => (
//                                         <tr key={index} className="hover:bg-gray-50">
//                                             <td className="px-6 py-4 whitespace-nowrap">
//                                                 <div className="flex items-center">
//                                                     <div className="flex-shrink-0 h-16 w-16">
//                                                         <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
//                                                             <span className="text-gray-400 text-xs">No Image</span>
//                                                         </div>
//                                                     </div>
//                                                     <div className="ml-4">
//                                                         <div className="text-sm font-medium text-gray-900">
//                                                             {item.productName}
//                                                         </div>
//                                                         <div className="text-sm text-gray-500">
//                                                             {item.variantName}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                                                 <div>
//                                                     <span className="text-gray-500">Sản phẩm</span>
//                                                 </div>
//                                             </td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
//                                                 {item.quantity}
//                                             </td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
//                                                 {item.unitPrice.toLocaleString('vi-VN')} ₫
//                                             </td>
//                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
//                                                 {item.totalPrice.toLocaleString('vi-VN')} ₫
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </div>
//
//                 {/* Sidebar */}
//                 <div className="space-y-6">
//                     {/* Order Summary */}
//                     <div className="bg-white rounded-lg shadow p-6">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
//                         <div className="space-y-3">
//                             <div className="flex justify-between text-sm">
//                                 <span className="text-gray-600">Tổng tiền hàng:</span>
//                                 <span className="text-gray-900">{order.subTotal.toLocaleString('vi-VN')} ₫</span>
//                             </div>
//                             <div className="flex justify-between text-sm">
//                                 <span className="text-gray-600">Phí vận chuyển:</span>
//                                 <span className="text-gray-900">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
//                             </div>
//                             {/* Discount removed as not available in API */}
//                             {/* {order.discountAmount > 0 && (
//                                 <div className="flex justify-between text-sm">
//                                     <span className="text-gray-600">Giảm giá:</span>
//                                     <span className="text-red-600">-{order.discountAmount.toLocaleString('vi-VN')} ₫</span>
//                                 </div>
//                             )} */}
//                             <hr className="border-gray-200" />
//                             <div className="flex justify-between text-lg font-semibold">
//                                 <span className="text-gray-900">Tổng thanh toán:</span>
//                                 <span className="text-blue-600">{order.finalAmount.toLocaleString('vi-VN')} ₫</span>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Quick Actions */}
//                     <div className="bg-white rounded-lg shadow p-6">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
//                         <div className="space-y-3">
//                             <button
//                                 onClick={() => handleStatusUpdate('Confirmed')}
//                                 disabled={order.orderStatus === 'Confirmed'}
//                                 className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
//                                     order.orderStatus === 'Confirmed'
//                                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         : 'bg-blue-500 text-white hover:bg-blue-600'
//                                 }`}
//                             >
//                                 Xác nhận đơn hàng
//                             </button>
//                             <button
//                                 onClick={() => handleStatusUpdate('Processing')}
//                                 disabled={order.orderStatus === 'Processing'}
//                                 className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
//                                     order.orderStatus === 'Processing'
//                                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         : 'bg-orange-500 text-white hover:bg-orange-600'
//                                 }`}
//                             >
//                                 Chuyển vận chuyển
//                             </button>
//                             <button
//                                 onClick={() => handleStatusUpdate('Shipped')}
//                                 disabled={order.orderStatus === 'Shipped'}
//                                 className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
//                                     order.orderStatus === 'Shipped'
//                                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         : 'bg-purple-500 text-white hover:bg-purple-600'
//                                 }`}
//                             >
//                                 Đang vận chuyển
//                             </button>
//                             <button
//                                 onClick={() => handleStatusUpdate('Delivered')}
//                                 disabled={order.orderStatus === 'Delivered'}
//                                 className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
//                                     order.orderStatus === 'Delivered'
//                                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         : 'bg-green-500 text-white hover:bg-green-600'
//                                 }`}
//                             >
//                                 Hoàn thành
//                             </button>
//                             <button
//                                 onClick={() => handleStatusUpdate('Cancelled')}
//                                 disabled={order.orderStatus === 'Cancelled'}
//                                 className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
//                                     order.orderStatus === 'Cancelled'
//                                         ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                                         : 'bg-red-500 text-white hover:bg-red-600'
//                                 }`}
//                             >
//                                 Hủy đơn hàng
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }


'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    XMarkIcon,
    CubeIcon,
    UserCircleIcon,
    CalendarIcon,
    CreditCardIcon,
    ShoppingCartIcon,
    ArrowPathIcon, // Added for refresh
    WalletIcon, // Alternative for Payment Status
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderItem {
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        fetchOrderDetail();
    }, [session, orderId]); // Dependency array includes session and orderId

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
                // Instead of full reload, re-fetch data for a smoother update
                await fetchOrderDetail();
                alert('Cập nhật trạng thái thành công!');
            } else {
                const errorData = await response.json();
                alert(`Cập nhật trạng thái thất bại: ${errorData.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            alert('Lỗi khi cập nhật trạng thái: ' + error);
        }
    };

    const handleCancelOrder = async () => {
        if (!session?.accessToken || !orderId) return;

        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.')) {
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
                router.push('/admin/orders_management');
            } else {
                const errorData = await response.json();
                alert(`Hủy đơn hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            alert('Lỗi khi hủy đơn hàng: ' + error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải dữ liệu</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/admin/orders_management"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Quay lại danh sách đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-6">Đơn hàng bạn đang tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
                    <Link
                        href="/admin/orders_management"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Quay lại danh sách đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen font-sans">
            {/* Header Section */}
            <header className="mb-8 bg-white shadow-lg rounded-xl p-6 border border-gray-100 animate-fade-in-down">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/orders_management"
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 group p-2 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Quay lại danh sách đơn hàng"
                        >
                            <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                            <span className="font-medium">Quay lại</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                                Chi tiết đơn hàng <span className="text-blue-600">#{order.orderCode}</span>
                            </h1>
                            <p className="text-gray-600 text-sm mt-1">Quản lý và xem thông tin chi tiết đơn hàng online.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-full ${STATUS_COLORS[order.orderStatus] || 'bg-gray-200 text-gray-800'} shadow-sm`}>
                            {STATUS_MAP[order.orderStatus] || order.orderStatus}
                        </span>
                        <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 cursor-pointer hover:border-blue-400"
                            aria-label="Cập nhật trạng thái đơn hàng"
                        >
                            {Object.entries(STATUS_MAP).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                        {order.orderStatus === 'Pending' && (
                            <button
                                onClick={handleCancelOrder}
                                className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center text-sm font-medium transition-colors duration-200 shadow-md"
                            >
                                <XMarkIcon className="w-4 h-4 mr-2" />
                                Hủy đơn
                            </button>
                        )}
                        <button
                            onClick={fetchOrderDetail}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center text-sm font-medium transition-colors duration-200 shadow-sm"
                            title="Làm mới dữ liệu đơn hàng"
                        >
                            <ArrowPathIcon className="w-4 h-4 mr-2" />
                            Làm mới
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <section className="lg:col-span-2 space-y-6">
                    {/* Order Information Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center border-b pb-3 border-gray-100">
                            <ShoppingCartIcon className="w-6 h-6 mr-3 text-blue-500" />
                            Thông tin đơn hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
                                <p className="text-lg font-semibold text-gray-900 mt-1">{order.orderCode}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ngày đặt hàng</label>
                                <div className="flex items-center text-gray-900 mt-1">
                                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>
                                        {new Date(order.orderDate).toLocaleDateString('vi-VN')} lúc {new Date(order.orderDate).toLocaleTimeString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phương thức giao hàng</label>
                                <p className="text-gray-900 mt-1">Giao hàng tận nơi</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                                <div className="flex items-center text-gray-900 mt-1">
                                    <CreditCardIcon className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{order.paymentMethod || 'Chưa xác định'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Trạng thái thanh toán</label>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full mt-1 ${
                                    order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                        order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                                            order.paymentStatus === 'Refunded' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                } shadow-sm`}>
                                    <WalletIcon className="w-3.5 h-3.5 mr-1" />
                                    {PAYMENT_STATUS_MAP[order.paymentStatus || 'Pending'] || 'Chờ thanh toán'}
                                </span>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                                <p className="text-gray-900 mt-1 italic">Không có ghi chú</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center border-b pb-3 border-gray-100">
                            <UserCircleIcon className="w-6 h-6 mr-3 text-blue-500" />
                            Thông tin khách hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600 font-bold text-xl ring-2 ring-blue-200">
                                        {order.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-gray-900">{order.customerName}</p>
                                        <p className="text-sm text-gray-500">Khách hàng</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-700 text-sm">
                                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                                    {order.phoneNumber}
                                </div>
                                <div className="flex items-center text-gray-700 text-sm">
                                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                                    Không có email
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Người nhận</label>
                                    <p className="text-gray-900 mt-1">{order.customerName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Địa chỉ giao hàng</label>
                                    <div className="flex items-start text-gray-900 mt-1">
                                        <MapPinIcon className="w-4 h-4 mr-2 mt-1 flex-shrink-0 text-gray-400" />
                                        <p>{order.streetAddress}, {order.wardCommune}, {order.district}, {order.cityProvince}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                <CubeIcon className="w-6 h-6 mr-3 text-blue-500" />
                                Sản phẩm đã đặt
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Sản phẩm
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Thông tin
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Số lượng
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Đơn giá
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Thành tiền
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map((item: OrderItem, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                                    <span className="text-gray-400 text-xs text-center p-1">No Image</span>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span>Sản phẩm đặt hàng</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right tabular-nums">
                                            {item.unitPrice.toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900 text-right tabular-nums">
                                            {item.totalPrice.toLocaleString('vi-VN')} ₫
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Sidebar Area */}
                <aside className="space-y-6">
                    {/* Order Summary Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3 border-gray-100">Tổng kết đơn hàng</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Tổng tiền hàng:</span>
                                <span className="text-gray-900 font-medium tabular-nums">{order.subTotal.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Phí vận chuyển:</span>
                                <span className="text-gray-900 font-medium tabular-nums">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <hr className="border-gray-200 my-4" />
                            <div className="flex justify-between items-center text-xl font-extrabold">
                                <span className="text-gray-900">Tổng thanh toán:</span>
                                <span className="text-blue-600 tabular-nums">{order.finalAmount.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3 border-gray-100">Hành động nhanh</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleStatusUpdate('Confirmed')}
                                disabled={order.orderStatus === 'Confirmed' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'}
                                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${order.orderStatus === 'Confirmed' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md focus:ring-blue-500'
                                }`}
                            >
                                Xác nhận đơn hàng
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Processing')}
                                disabled={order.orderStatus === 'Processing' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'}
                                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${order.orderStatus === 'Processing' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md focus:ring-orange-500'
                                }`}
                            >
                                Chuyển vận chuyển
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Shipped')}
                                disabled={order.orderStatus === 'Shipped' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'}
                                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${order.orderStatus === 'Shipped' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md focus:ring-purple-500'
                                }`}
                            >
                                Đang vận chuyển
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Delivered')}
                                disabled={order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled'}
                                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled'
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md focus:ring-green-500'
                                }`}
                            >
                                Hoàn thành
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Cancelled')}
                                disabled={order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'}
                                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                    ${order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered'
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md focus:ring-red-500'
                                }`}
                            >
                                Hủy đơn hàng
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}