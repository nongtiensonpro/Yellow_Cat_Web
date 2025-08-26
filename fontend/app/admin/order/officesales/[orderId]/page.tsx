'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {CldImage} from 'next-cloudinary';
import {Package, ArrowLeft, User, Clipboard, DollarSign, CalendarDays, Phone, ShoppingBag, Gift, CreditCard, TrendingUp, Mail, BadgeCheck} from 'lucide-react';

interface StaffInfo {
    appUserId: number;
    keycloakId: string;
    email: string;
    roles: string[];
    enabled: boolean;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string;
}

interface OrderItem {
    orderItemId: number;
    variantId: number;
    sku: string;
    productName: string;
    colorName: string | null;
    sizeName: string | null;
    imageUrl: string | null;
    quantity: number;
    priceAtPurchase: number;
    totalPrice: number;
    // Thông tin khuyến mãi
    bestPromo?: {
        promotionCode: string;
        promotionName: string;
        discountAmount: number;
    };
    originalPrice?: number; // Giá gốc (chưa giảm)
    variantInfo?: string;
}

interface Payment {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paymentStatus: string;
    transactionId?: string;
}

interface OrderDetailWithItems {
    orderId: number;
    orderCode: string;
    orderStatus: string;
    orderDate: string;
    customerName: string;
    phoneNumber: string;
    shippingMethod: string;
    recipientName: string;
    fullAddress: string;
    email: string;
    fullName: string;
    customerNotes: string;
    finalAmount: number;
    subTotalAmount: number;
    discountAmount: number;
    shippingFee: number;
    orderItems: OrderItem[];
    payments?: Payment[];
    // Thông tin nhân viên
    employeeName?: string;
    employeeId?: string;
    storeName?: string;
    storeAddress?: string;
    // Thông tin voucher
    appliedVoucherCode?: string;
    appliedVoucherName?: string;
    voucherType?: string;
    voucherValue?: number;
    voucherDescription?: string;
    voucherDiscountAmount?: number;
}

const STATUS_MAP: Record<string, string> = {
    Paid: 'Đã thanh toán',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipped: 'Đang vận chuyển',
    Delivered: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const {data: session} = useSession();
    const orderId = params?.orderId as string | undefined;
    const [order, setOrder] = useState<OrderDetailWithItems | null>(null);
    const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
    const [staffLoading, setStaffLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const res = await fetch(
                    `http://localhost:8080/api/orders/detail/id/${orderId}/with-items`
                );
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setOrder(data.data);
            } catch (error) {
                console.error("Failed to fetch order details:", error);
            }
        };
        if (orderId) fetchOrderDetail();
    }, [orderId]);

    // Fetch thông tin nhân viên theo order code
    useEffect(() => {
        const fetchStaffInfo = async () => {
            if (!order?.orderCode || !session?.accessToken) return;
            
            setStaffLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/orders/staff-info/${order.orderCode}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('👤 Fetched staff info:', data);
                
                if (data.status >= 200 && data.status < 300 && data.data) {
                    setStaffInfo(data.data);
                } else {
                    console.warn('⚠️ No staff info found for order:', order.orderCode);
                }
            } catch (error) {
                console.error('❌ Error fetching staff info:', error);
            } finally {
                setStaffLoading(false);
            }
        };

        if (order?.orderCode) {
            fetchStaffInfo();
        }
    }, [order?.orderCode, session?.accessToken]);



    if (!order) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-lg text-gray-600 animate-pulse">Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Paid':
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Confirmed':
            case 'Processing':
                return 'bg-blue-100 text-blue-800';
            case 'Shipped':
                return 'bg-yellow-100 text-yellow-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate detailed pricing information
    const originalTotal = order.orderItems.reduce((sum, item) => {
        return sum + (item.originalPrice || item.priceAtPurchase) * item.quantity;
    }, 0);

    const productDiscountTotal = order.orderItems.reduce((sum, item) => {
        // NGĂN CHẶN TÍNH TOÁN TRÙNG LẶP:
        // Nếu promotionCode của sản phẩm trùng với mã voucher,
        // thì khoản giảm giá này đã được tính vào voucherDiscountAmount,
        // không cần cộng vào tổng tiết kiệm sản phẩm nữa.
        if (item.bestPromo && item.bestPromo.promotionCode && item.bestPromo.promotionCode === order.appliedVoucherCode) {
            return sum;
        }

        // Tính toán các khuyến mãi sản phẩm khác (nếu có)
        if (item.bestPromo && item.originalPrice) {
            return sum + (item.originalPrice - item.priceAtPurchase) * item.quantity;
        }
        return sum;
    }, 0);

  
    const voucherDiscountAmount = order.voucherDiscountAmount || 0;
    const totalSavings = productDiscountTotal + voucherDiscountAmount;
    const itemsWithPromotions = order.orderItems.filter(item => item.bestPromo);
    const calculatedTotalPayment = order.subTotalAmount + order.shippingFee;

    return (
        <div className="full bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8 font-sans">
            <div
                className="max mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
                {/* Header Section */}
                <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-blue-100">
                    <div className="flex items-center mb-3 sm:mb-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 -ml-2"
                            aria-label="Quay lại"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-700"/>
                        </button>
                        <h4 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center ml-2">
                            <Package className="w-7 h-7 text-blue-600 mr-2"/>
                            Chi tiết đơn hàng <span className="text-blue-600 ml-2">#{order.orderCode}</span>
                        </h4>
                    </div>
                    <span
                        className={`px-4 py-1.5 ${getStatusBadgeColor(order.orderStatus)} rounded-full text-sm font-bold shadow-sm`}>
                        {STATUS_MAP[order.orderStatus] || order.orderStatus}
                    </span>
                </div>

                {/* Order Summary Banner */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-md text-center">
                        <div className="flex items-center justify-center mb-2">
                            <ShoppingBag className="w-6 h-6 text-blue-600"/>
                        </div>
                        <p className="text-lg font-bold text-blue-700">{order.orderItems.length}</p>
                        <p className="text-xs text-blue-600">Loại sản phẩm</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-md text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Package className="w-6 h-6 text-purple-600"/>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                            {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                        <p className="text-xs text-purple-600">Tổng số lượng</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200 shadow-md text-center">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="w-6 h-6 text-green-600"/>
                        </div>
                        <p className="text-sm font-bold text-green-700">{STATUS_MAP[order.orderStatus] || order.orderStatus}</p>
                        <p className="text-xs text-green-600">Trạng thái</p>
                    </div>

                    {totalSavings > 0 && (
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 shadow-md text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Gift className="w-6 h-6 text-orange-600"/>
                            </div>
                            <p className="text-lg font-bold text-orange-700">
                                {totalSavings.toLocaleString('vi-VN')} VND
                            </p>
                            <p className="text-xs text-orange-600">Tổng tiết kiệm</p>
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-md text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CreditCard className="w-6 h-6 text-gray-600"/>
                        </div>
                        <p className="text-lg font-bold text-gray-700">
                            {calculatedTotalPayment.toLocaleString('vi-VN')} VND
                        </p>
                        <p className="text-xs text-gray-600">Đã thanh toán</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Information */}
                        <div className="bg-blue-50 p-7 rounded-2xl border border-blue-200 shadow-md">
                            <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center border-b pb-3 border-blue-200">
                                <User className="w-6 h-6 mr-3 text-blue-600"/>
                                Thông tin khách hàng
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <InfoItem
                                    label="Tên khách hàng"
                                    value={order.customerName || order.fullName || 'N/A'}
                                    bold
                                />
                                <InfoItem
                                    label="Số điện thoại"
                                    value={order.phoneNumber || 'N/A'}
                                    bold
                                    icon={<Phone className="w-5 h-5 text-gray-500 mr-2"/>}
                                />
                                <InfoItem 
                                    label="Email" 
                                    value={order.email || 'N/A'}
                                    icon={<Mail className="w-5 h-5 text-gray-500 mr-2"/>}
                                />
                                <InfoItem
                                    label="Ngày tạo"
                                    value={
                                        order.orderDate
                                            ? new Date(order.orderDate).toLocaleString('vi-VN')
                                            : 'N/A'
                                    }
                                    bold
                                    icon={<CalendarDays className="w-5 h-5 text-gray-500 mr-2"/>}
                                />
                                <div className="col-span-full">
                                    <InfoItem label="Ghi chú khách hàng" value={order.customerNotes || 'Không có'}/>
                                </div>
                            </div>
                        </div>

                        {/* Employee Information */}
                        <div className="bg-green-50 p-7 rounded-2xl border border-green-200 shadow-md">
                            <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center border-b pb-3 border-green-200">
                                <BadgeCheck className="w-6 h-6 mr-3 text-green-600"/>
                                Thông tin nhân viên bán hàng
                            </h2>
                            {staffLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="text-lg text-gray-600 animate-pulse">Đang tải thông tin nhân viên...</div>
                                </div>
                            ) : staffInfo ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <InfoItem
                                        label="Tên nhân viên"
                                        value={staffInfo.fullName}
                                        bold
                                        highlight
                                    />
                                    <InfoItem
                                        label="Mã nhân viên"
                                        value={`NV${staffInfo.appUserId.toString().padStart(4, '0')}`}
                                        bold
                                    />
                                    <InfoItem
                                        label="Email"
                                        value={staffInfo.email}
                                        icon={<Mail className="w-5 h-5 text-gray-500 mr-2"/>}
                                    />
                                    <InfoItem
                                        label="Số điện thoại"
                                        value={staffInfo.phoneNumber}
                                        icon={<Phone className="w-5 h-5 text-gray-500 mr-2"/>}
                                    />
                                    <InfoItem
                                        label="Trạng thái"
                                        value={staffInfo.enabled ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                                        icon={<BadgeCheck className={`w-5 h-5 mr-2 ${staffInfo.enabled ? 'text-green-500' : 'text-red-500'}`}/>}
                                    />
                                    <InfoItem
                                        label="Chức vụ"
                                        value={(() => {
                                            if (!staffInfo.roles || staffInfo.roles.length === 0) {
                                                return 'Nhân viên';
                                            }
                                            
                                            // Lọc và ưu tiên chức vụ theo thứ tự
                                            const validRoles = staffInfo.roles.filter(role => 
                                                role === 'Admin_Web' || role === 'Staff_Web'
                                            );
                                            
                                            if (validRoles.includes('Admin_Web')) {
                                                return 'Quản lý';
                                            } else if (validRoles.includes('Staff_Web')) {
                                                return 'Nhân viên';
                                            } else {
                                                return 'Khách hàng';
                                            }
                                        })()}
                                    />
                                                                         <div className="col-span-full flex items-center space-x-4">
                                         <span className="text-gray-600 font-medium">Ảnh đại diện:</span>
                                         {staffInfo.avatarUrl ? (
                                             <CldImage
                                                 width={100}
                                                 height={100}
                                                 src={staffInfo.avatarUrl}
                                                 alt={staffInfo.fullName}
                                                 sizes="64px"
                                                 className="rounded-full object-cover border-2 border-green-200"
                                             />
                                         ) : (
                                             <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-green-200 flex items-center justify-center">
                                                 <User className="w-8 h-8 text-gray-400" />
                                             </div>
                                         )}
                                     </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-500 mb-2">
                                        <User className="w-12 h-12 mx-auto text-gray-300"/>
                                    </div>
                                    <p className="text-gray-600">Không tìm thấy thông tin nhân viên</p>
                                    <p className="text-sm text-gray-500">Có thể đơn hàng này được tạo bởi hệ thống</p>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-7 rounded-2xl border border-gray-200 shadow-md">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b pb-3 border-gray-200">
                                <ShoppingBag className="w-6 h-6 mr-3 text-gray-600"/>
                                Chi tiết sản phẩm
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg bg-white">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                    <tr>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            STT
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Hình ảnh
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Số lượng
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Đơn giá
                                        </th>
                                        <th scope="col"
                                            className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Số tiền
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {order.orderItems.map((item, idx) => (
                                        <tr key={item.orderItemId} className="hover:bg-blue-50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {idx + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                                                 {item.imageUrl ? (
                                                     <CldImage
                                                         width={450}
                                                         height={450}
                                                         src={item.imageUrl}
                                                         alt={item.productName}
                                                         sizes="450px"
                                                         className="rounded-lg object-cover border border-gray-200 shadow-sm w-32 h-32"
                                                     />
                                                 ) : (
                                                     <div
                                                         className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic border border-gray-200">
                                                         Không ảnh
                                                     </div>
                                                 )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-base font-medium text-gray-900">{item.productName}</div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {item.colorName && `Màu: ${item.colorName}`}
                                                    {item.sizeName && ` - Kích cỡ: ${item.sizeName}`}
                                                    {item.sku && ` - SKU: ${item.sku}`}
                                                </div>
                                                                                                 {item.bestPromo && (
                                                     <div className="flex flex-wrap items-center gap-2 mt-2">
                                                         <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
                                                             🏷️ {item.bestPromo.promotionCode}
                                                         </span>
                                                         <span className="text-xs text-green-600 font-medium">
                                                             -{((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase).toLocaleString('vi-VN')} VND
                                                         </span>
                                                     </div>
                                                 )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-base font-medium text-gray-700">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-base text-gray-700">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-semibold">
                                                        {item.priceAtPurchase.toLocaleString('vi-VN')} VND
                                                    </span>
                                                    {item.bestPromo && item.originalPrice && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {item.originalPrice.toLocaleString('vi-VN')} VND
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-gray-900">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold">
                                                        {item.totalPrice.toLocaleString('vi-VN')} VND
                                                    </span>
                                                    {item.bestPromo && item.originalPrice && (
                                                        <span className="text-xs text-gray-500">
                                                            (Gốc: {(item.originalPrice * item.quantity).toLocaleString('vi-VN')} VND)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                                                 {/* Detailed Discount Analysis - Chỉ hiển thị khi có khuyến mãi phức tạp */}
                         {(itemsWithPromotions.length > 1 || (voucherDiscountAmount > 0 && itemsWithPromotions.length > 0)) && (
                            <div className="bg-orange-50 p-7 rounded-2xl border border-orange-200 shadow-md">
                                <h2 className="text-2xl font-bold text-orange-800 mb-6 flex items-center border-b pb-3 border-orange-200">
                                    <Gift className="w-6 h-6 mr-3 text-orange-600"/>
                                    Phân tích khuyến mãi chi tiết
                                </h2>
                                <div className="space-y-6">
                                    {/* Voucher applied (nếu có) */}
                                    {order.appliedVoucherCode && (
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-green-800">
                                                    <span className="font-semibold">Voucher áp dụng:</span>
                                                    <span className="ml-2">{order.appliedVoucherCode}</span>
                                                    {order.appliedVoucherName && (
                                                        <span className="ml-2 text-gray-600">({order.appliedVoucherName})</span>
                                                    )}
                                                </div>
                                                {order.voucherDiscountAmount && order.voucherDiscountAmount > 0 && (
                                                    <div className="text-sm font-bold text-green-700">
                                                        -{order.voucherDiscountAmount.toLocaleString('vi-VN')} VND
                                                    </div>
                                                )}
                                            </div>
                                            {order.voucherDescription && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    {order.voucherDescription}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Product-level promotions */}
                                    {itemsWithPromotions.length > 0 && (
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-semibold text-orange-700">Khuyến mãi theo sản phẩm</p>
                                                <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                    {itemsWithPromotions.length} sản phẩm
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {itemsWithPromotions.map((item) => (
                                                    <div key={item.orderItemId} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="md:col-span-2">
                                                                <p className="font-medium text-sm text-gray-800">{item.productName}</p>
                                                                <p className="text-xs text-gray-600 mb-2">{item.variantInfo}</p>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded font-medium">
                                                                        🏷️ {item.bestPromo?.promotionCode}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600">
                                                                        {item.bestPromo?.promotionName}
                                                                    </span>
                                                                </div>

                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <div className="text-xs text-gray-600">
                                                                    Giá gốc: <span className="line-through">{item.originalPrice?.toLocaleString('vi-VN')} VND</span>
                                                                </div>
                                                                <div className="text-xs text-blue-600">
                                                                    Giá bán: <span className="font-medium">{item.priceAtPurchase.toLocaleString('vi-VN')} VND</span>
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    SL: {item.quantity} × Giảm: {((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase).toLocaleString('vi-VN')} VND
                                                                </div>
                                                                <div className="text-sm font-bold text-green-600 border-t pt-1">
                                                                    Tiết kiệm: {(((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase) * item.quantity).toLocaleString('vi-VN')} VND
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-orange-800">Tổng tiết kiệm từ sản phẩm:</span>
                                                    <span className="font-bold text-green-700">
                                                        {productDiscountTotal.toLocaleString('vi-VN')} VND
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order-level discount */}
                                    {voucherDiscountAmount > 0 && (
                                        <div>
                                            <p className="font-semibold text-green-700 mb-3">Giảm giá cấp đơn hàng</p>
                                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-green-700">🎯 Voucher giảm giá</p>
                                                        <p className="text-xs text-gray-600">Áp dụng sau khi tính khuyến mãi sản phẩm</p>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            Tạm tính: {order.subTotalAmount.toLocaleString('vi-VN')} VND → 
                                                            Sau giảm: {order.finalAmount.toLocaleString('vi-VN')} VND
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-green-600">
                                                            -{voucherDiscountAmount.toLocaleString('vi-VN')} VND
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total savings summary */}
                                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 mb-1">Tổng cộng khách hàng đã tiết kiệm</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {totalSavings.toLocaleString('vi-VN')} VND
                                            </p>
                                            <div className="flex justify-center gap-4 mt-2 text-xs text-gray-600">
                                                {productDiscountTotal > 0 && (
                                                    <span>Sản phẩm: {productDiscountTotal.toLocaleString('vi-VN')} VND</span>
                                                )}
                                                {voucherDiscountAmount > 0 && (
                                                    <span>Voucher: {voucherDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                Tỷ lệ tiết kiệm: {((totalSavings / originalTotal) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Summary & Payment */}
                    <div className="space-y-6">
                        {/* Detailed Financial Summary */}
                        <div className="bg-blue-50 p-7 rounded-2xl border border-blue-200 shadow-md sticky top-4">
                            <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center border-b pb-3 border-blue-200">
                                <DollarSign className="w-6 h-6 mr-3 text-blue-600"/>
                                Tóm tắt tài chính
                            </h3>
                            <div className="space-y-4">
                                {/* Quantity Summary */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Thống kê sản phẩm</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Loại SP:</span>
                                            <span className="font-medium">{order.orderItems.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tổng SL:</span>
                                            <span className="font-medium">
                                                {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>SP có KM:</span>
                                            <span className="font-medium text-orange-600">{itemsWithPromotions.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>SP thường:</span>
                                            <span className="font-medium">{order.orderItems.length - itemsWithPromotions.length}</span>
                                        </div>
                                    </div>
                                </div>

                                                                 <div className="border-t border-gray-200 pt-4"></div>

                                 {/* Voucher Summary (nếu có) */}
                                 {order.appliedVoucherCode && (
                                     <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                                         <div className="flex justify-between items-center">
                                             <div className="flex items-center gap-2">
                                                 <span className="text-sm font-medium text-green-700">🏷️ {order.appliedVoucherCode}</span>
                                                 {order.appliedVoucherName && (
                                                     <span className="text-xs text-green-600">({order.appliedVoucherName})</span>
                                                 )}
                                             </div>
                                             {voucherDiscountAmount > 0 && (
                                                 <span className="text-sm font-bold text-green-700">
                                                     -{voucherDiscountAmount.toLocaleString('vi-VN')} VND
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 )}

                                 {/* Price Breakdown */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Tổng tiền gốc:</span>
                                        <span className="font-medium">{originalTotal.toLocaleString('vi-VN')} VND</span>
                                    </div>

                                    {productDiscountTotal > 0 && (
                                        <div className="flex justify-between text-sm text-orange-600">
                                            <span>Giảm giá sản phẩm:</span>
                                            <span className="font-medium">-{productDiscountTotal.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm border-t pt-2">
                                        <span>Tạm tính:</span>
                                        <span className="font-medium">{order.subTotalAmount.toLocaleString('vi-VN')} VND</span>
                                    </div>

                                                                         {voucherDiscountAmount > 0 && (
                                         <div className="flex justify-between text-sm text-green-600">
                                             <span>Giảm giá voucher:</span>
                                             <span className="font-medium">-{voucherDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                         </div>
                                     )}

                                    <div className="flex justify-between text-sm">
                                        <span>Phí vận chuyển:</span>
                                        <span className="font-medium">{order.shippingFee.toLocaleString('vi-VN')} VND</span>
                                    </div>
                                </div>

                                {totalSavings > 0 && (
                                    <>
                                        <div className="border-t border-gray-200 pt-4"></div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <div className="text-center mb-3">
                                                <h4 className="text-lg font-semibold text-green-700">
                                                    Tổng tiết kiệm của khách hàng
                                                </h4>
                                            </div>
                                                                                         <div className="space-y-2">
                                                 {productDiscountTotal > 0 && (
                                                     <div className="flex justify-between items-center text-sm">
                                                         <span className="text-green-600">Khuyến mãi sản phẩm:</span>
                                                         <span className="font-semibold text-green-700">
                                                             {productDiscountTotal.toLocaleString('vi-VN')} VND
                                                         </span>
                                                     </div>
                                                 )}
                                                 {voucherDiscountAmount > 0 && (
                                                     <div className="flex justify-between items-center text-sm">
                                                         <span className="text-green-600">Voucher giảm giá:</span>
                                                         <span className="font-semibold text-green-700">
                                                             {voucherDiscountAmount.toLocaleString('vi-VN')} VND
                                                         </span>
                                                     </div>
                                                 )}
                                                <div className="border-t border-green-200 pt-2 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-semibold text-green-700">Tổng cộng:</span>
                                                        <span className="text-xl font-bold text-green-700">
                                                            {totalSavings.toLocaleString('vi-VN')} VND
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-green-600 space-y-1 mt-2">
                                                    <div className="flex justify-between">
                                                        <span>Tỷ lệ giảm:</span>
                                                        <span>{((totalSavings / originalTotal) * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Tiết kiệm/SP:</span>
                                                        <span>{(totalSavings / order.orderItems.length).toLocaleString('vi-VN')} VND</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="border-t border-gray-200 pt-4"></div>

                                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-blue-800">Thành tiền:</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {calculatedTotalPayment.toLocaleString('vi-VN')} VND
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1 text-center">
                                        Đã bao gồm tất cả khuyến mãi
                                    </div>
                                </div>

                                {/* Profit Analysis */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Phân tích giao dịch</p>
                                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Giá trị gốc:</span>
                                            <span>{originalTotal.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Đã bán:</span>
                                            <span>{calculatedTotalPayment.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tỷ lệ thực thu:</span>
                                            <span>{((calculatedTotalPayment / originalTotal) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        {order.payments && order.payments.length > 0 && (
                            <div className="bg-blue-50 p-7 rounded-2xl border border-blue-200 shadow-md">
                                <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center border-b pb-3 border-blue-200">
                                    <CreditCard className="w-6 h-6 mr-3 text-blue-600"/>
                                    Thông tin thanh toán
                                </h3>
                                <div className="space-y-3">
                                    {order.payments.map((payment, index) => (
                                        <div key={payment.paymentId || index} className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium">{payment.paymentMethod}</span>
                                                <span className="font-bold text-blue-600">
                                                    {payment.amount.toLocaleString('vi-VN')} VND
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Trạng thái:</span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    payment.paymentStatus.toUpperCase() === 'SUCCESS' || payment.paymentStatus.toUpperCase() === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {payment.paymentStatus}
                                                </span>
                                            </div>
                                            {payment.transactionId && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Mã GD: {payment.transactionId}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transaction Details */}
                        <div className="bg-gray-50 p-7 rounded-2xl border border-gray-200 shadow-md">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center border-b pb-3 border-gray-200">
                                <Clipboard className="w-6 h-6 mr-3 text-gray-600"/>
                                Chi tiết giao dịch
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đơn hàng:</span>
                                    <span className="font-medium">{order.orderCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thời gian tạo:</span>
                                    <span className="font-medium">{new Date(order.orderDate).toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Loại giao dịch:</span>
                                    <span className="font-medium text-blue-600">Bán tại quầy</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Trạng thái:</span>
                                    <span className="font-medium text-green-600">{STATUS_MAP[order.orderStatus] || order.orderStatus}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3"></div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tổng tiền gốc:</span>
                                    <span className="font-medium">{originalTotal.toLocaleString('vi-VN')} VND</span>
                                </div>
                                {totalSavings > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Tổng giảm giá:</span>
                                        <span className="font-medium">-{totalSavings.toLocaleString('vi-VN')} VND</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold">
                                    <span>Thành tiền:</span>
                                    <span className="text-blue-600">{calculatedTotalPayment.toLocaleString('vi-VN')} VND</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({
                      label,
                      value,
                      bold = false,
                      highlight = false,
                      icon,
                  }: {
    label: string;
    value: string;
    bold?: boolean;
    highlight?: boolean;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline text-sm">
            <span className="min-w-[160px] text-gray-600 font-medium mb-1 sm:mb-0 flex items-center">
                {icon && <span className="mr-2">{icon}</span>}
                {label}:
            </span>
            <span
                className={`${
                    bold ? 'font-semibold' : ''
                } ${highlight ? 'text-blue-700 font-extrabold' : 'text-gray-800'} flex-1`}
            >
                {value}
            </span>
        </div>
    );
}
