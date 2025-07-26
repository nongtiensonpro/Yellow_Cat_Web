// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import OrderTimeline from '@/components/order/OrderTimeline';
// import {CldImage} from "next-cloudinary";
//
// interface OrderItem {
//     orderItemId: number;
//     variantId: number;
//     sku: string;
//     productName: string;
//     colorName: string | null;
//     sizeName: string | null;
//     imageUrl: string | null;
//     quantity: number;
//     priceAtPurchase: number;
//     totalPrice: number;
// }
//
// interface OrderDetailWithItems {
//     orderId: number;
//     orderCode: string;
//     orderStatus: string;
//     orderDate: string;
//     customerName: string;
//     phoneNumber: string;
//     shippingMethod: string;
//     recipientName: string;
//     fullAddress: string;
//     email: string;
//     fullName: string;
//     customerNotes: string;
//     finalAmount: number;
//     subTotalAmount: number;
//     discountAmount: number;
//     shippingFee: number;
//     orderItems: OrderItem[];
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Paid: 'Đã thanh toán',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
// };
//
// export default function OrderDetailPage() {
//     const params = useParams();
//     const orderId = params?.orderId as string | undefined;
//     const [order, setOrder] = useState<OrderDetailWithItems | null>(null);
//
//     useEffect(() => {
//         const fetchOrderDetail = async () => {
//             const res = await fetch(
//                 `http://localhost:8080/api/orders/detail/id/${orderId}/with-items`
//             );
//             const data = await res.json();
//             setOrder(data.data);
//         };
//         if (orderId) fetchOrderDetail();
//     }, [orderId]);
//
//     if (!order) return <div className="p-8">Đang tải...</div>;
//
//     return (
//         <div className="p-8 max-w-6xl mx-auto">
//             <h1 className="text-2xl font-bold mb-4">
//                 Chi tiết đơn hàng #{order.orderCode}
//             </h1>
//
//             <OrderTimeline status={order.orderStatus} />
//
//
//             <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border border-gray-100">
//                 <div className="space-y-2">
//                     <InfoItem label="Mã đơn hàng" value={order.orderCode} bold />
//                     <InfoItem
//                         label="Trạng thái"
//                         value={STATUS_MAP[order.orderStatus] || order.orderStatus}
//                         highlight
//                         bold
//                     />
//                     <InfoItem
//                         label="Ngày tạo"
//                         value={new Date(order.orderDate).toLocaleString('vi-VN')}
//                         bold
//                     />
//                     <InfoItem
//                         label="Phương thức giao hàng"
//                         value={order.shippingMethod || '-'}
//                     />
//                     <InfoItem label="Địa chỉ" value={order.fullAddress || '-'} />
//                     <InfoItem label="Ghi chú" value={order.customerNotes || '-'} />
//                 </div>
//
//                 <div className="space-y-2">
//                     <InfoItem
//                         label="Tên khách hàng"
//                         value={order.customerName || order.fullName || '-'}
//                         bold
//                     />
//                     <InfoItem label="Email" value={order.email || '-'} />
//                     <InfoItem label="Số điện thoại" value={order.phoneNumber || '-'} bold />
//                     <InfoItem label="Người nhận" value={order.recipientName || '-'} bold />
//                 </div>
//             </div>
//
//
//             <div className="mt-10">
//                 <div className="overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
//                     <table className="w-full text-sm text-left">
//                         <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
//                         <tr>
//                             <th
//                                 colSpan={6}
//                                 className="px-4 py-3 border text-center text-base font-bold uppercase"
//                             >
//                                 DANH SÁCH SẢN PHẨM
//                             </th>
//                         </tr>
//                         <tr>
//                             <th className="px-4 py-3 border">STT</th>
//                             <th className="px-4 py-3 border">Hình ảnh</th>
//                             <th className="px-4 py-3 border">Sản phẩm</th>
//                             <th className="px-4 py-3 border text-center">Số lượng</th>
//                             <th className="px-4 py-3 border text-right">Đơn giá</th>
//                             <th className="px-4 py-3 border text-right">Số tiền</th>
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {order.orderItems.map((item, idx) => (
//                             <tr
//                                 key={item.orderItemId}
//                                 className="hover:bg-gray-50 transition"
//                             >
//                                 <td className="px-4 py-3 border text-center">{idx + 1}</td>
//                                 <td className="px-4 py-3 border text-center">
//                                     {item.imageUrl ? (
//                                             <CldImage
//                                                 width={100}
//                                                 height={100}
//                                                 src={item.imageUrl}
//                                                 alt={item.productName}
//                                                 sizes="100vw"
//                                                 className="w-full h-full object-cover"
//                                             />
//                                     ) : (
//                                         <span className="text-gray-400 italic">Không ảnh</span>
//                                     )}
//                                 </td>
//                                 <td className="px-4 py-3 border">
//                                     <div>{item.productName}</div>
//                                     <div className="text-xs text-gray-500">
//                                         {item.colorName || ''} {item.sizeName || ''} {item.sku && item.sku}
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-3 border text-center">{item.quantity}</td>
//                                 <td className="px-4 py-3 border text-right">
//                                     {item.priceAtPurchase.toLocaleString('vi-VN')} VND
//                                 </td>
//                                 <td className="px-4 py-3 border text-right">
//                                     {item.totalPrice.toLocaleString('vi-VN')} VND
//                                 </td>
//                             </tr>
//                         ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//
//
//             <div className="mt-4 max-w-md ml-auto text-[15px]">
//                 <div className="flex justify-between">
//                     <span className="text-gray-700">Tổng liên sản phẩm:</span>
//                     <span>{order.subTotalAmount.toLocaleString('vi-VN')} VND</span>
//                 </div>
//
//                 <div className="flex justify-between">
//                     <span className="text-gray-700">Mã giảm giá:</span>
//                     <span className="text-red-600">
//             {order.discountAmount > 0
//                 ? `PGG012 - ${order.discountAmount.toLocaleString('vi-VN')} VND`
//                 : '0 VND'}
//           </span>
//                 </div>
//
//                 <div className="flex justify-between font-bold text-[17px] mt-2">
//                     <span className="text-blue-600">Tổng thanh toán:</span>
//                     <span className="text-red-700">
//             {order.finalAmount.toLocaleString('vi-VN')} VND
//           </span>
//                 </div>
//             </div>
//         </div>
//     );
// }
//
// function InfoItem({
//                       label,
//                       value,
//                       bold = false,
//                       highlight = false,
//                   }: {
//     label: string;
//     value: string;
//     bold?: boolean;
//     highlight?: boolean;
// }) {
//     return (
//         <div className="flex items-start text-[15px]">
//       <span className="inline-block min-w-[160px] text-gray-600 font-medium">
//         {label}:
//       </span>
//             <span
//                 className={`${
//                     bold ? 'font-semibold' : ''
//                 } ${highlight ? 'text-blue-600 font-bold' : 'text-gray-900'}`}
//             >
//         {value}
//       </span>
//         </div>
//     );
// }
//
//

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OrderTimeline from '@/components/order/OrderTimeline'; // Assuming this component is styled appropriately
import { CldImage } from 'next-cloudinary';
import { Package, User, Clipboard, DollarSign, CalendarDays } from 'lucide-react'; // Added CalendarDays icon

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
    finalAmount: number; // Keeping this here in case it's used elsewhere, but will calculate total for display
    subTotalAmount: number;
    discountAmount: number; // Keeping this for the interface, but won't display it
    shippingFee: number;
    orderItems: OrderItem[];
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
    const orderId = params?.orderId as string | undefined;
    const [order, setOrder] = useState<OrderDetailWithItems | null>(null);

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
                // Optionally set an error state to display to the user
            }
        };
        if (orderId) fetchOrderDetail();
    }, [orderId]);

    if (!order) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-lg text-gray-600 animate-pulse">Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    // Determine the color for the status badge
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

    // Calculate the total payment without discount for display
    const calculatedTotalPayment = order.subTotalAmount + order.shippingFee;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-5 border-b-2 border-blue-100">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 sm:mb-0 flex items-center">
                        <Package className="w-9 h-9 text-blue-600 mr-3" />
                        Chi tiết đơn hàng <span className="text-blue-600 ml-3">#{order.orderCode}</span>
                    </h1>
                    <span className={`px-5 py-2 ${getStatusBadgeColor(order.orderStatus)} rounded-full text-md font-bold shadow-sm`}>
                        {STATUS_MAP[order.orderStatus] || order.orderStatus}
                    </span>
                </div>

                {/* Order Timeline */}
                <div className="mb-10">
                    <OrderTimeline status={order.orderStatus} />
                </div>

                {/* Information Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
                    {/* Order Information */}
                    <div className="lg:col-span-2 bg-blue-50 p-7 rounded-2xl border border-blue-200 shadow-md">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center border-b pb-3 border-blue-200">
                            <Clipboard className="w-6 h-6 mr-3 text-blue-600" />
                            Thông tin đơn hàng
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            <InfoItem label="Mã đơn hàng" value={order.orderCode} bold />
                            <InfoItem
                                label="Trạng thái"
                                value={STATUS_MAP[order.orderStatus] || order.orderStatus}
                                highlight
                                bold
                            />
                            <InfoItem
                                label="Ngày tạo"
                                value={
                                    // CHANGED: Using toLocaleString to include time
                                    order.orderDate
                                        ? new Date(order.orderDate).toLocaleString('vi-VN')
                                        : 'N/A'
                                }
                                bold
                                icon={<CalendarDays className="w-5 h-5 text-gray-500 mr-2" />}
                            />
                            <InfoItem
                                label="Phương thức giao hàng"
                                value={order.shippingMethod || 'N/A'}
                            />
                            <InfoItem label="Phí vận chuyển" value={`${order.shippingFee.toLocaleString('vi-VN')} VND`} />
                            {/* Adjusted address display to be multiline if needed */}
                            <div className="col-span-full"> {/* Make this item span full width on small screens */}
                                <InfoItem label="Địa chỉ giao hàng" value={order.fullAddress || 'N/A'} />
                            </div>
                            <div className="col-span-full"> {/* Make this item span full width on small screens */}
                                <InfoItem label="Ghi chú khách hàng" value={order.customerNotes || 'Không có'} />
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-green-50 p-7 rounded-2xl border border-green-200 shadow-md">
                        <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center border-b pb-3 border-green-200">
                            <User className="w-6 h-6 mr-3 text-green-600" />
                            Thông tin khách hàng
                        </h2>
                        <div className="space-y-4">
                            <InfoItem
                                label="Tên khách hàng"
                                value={order.customerName || order.fullName || 'N/A'}
                                bold
                            />
                            <InfoItem label="Email" value={order.email || 'N/A'} />
                            <InfoItem label="Số điện thoại" value={order.phoneNumber || 'N/A'} bold />
                            <InfoItem label="Người nhận" value={order.recipientName || 'N/A'} bold />
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mt-14">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-7">
                        Sản phẩm đã đặt
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    STT
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Hình ảnh
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Số lượng
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Đơn giá
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                                                width={90}
                                                height={90}
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                sizes="90px"
                                                className="rounded-lg object-cover border border-gray-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic border border-gray-200">
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
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-base font-medium text-gray-700">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-base text-gray-700">
                                        {item.priceAtPurchase.toLocaleString('vi-VN')} VND
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-gray-900">
                                        {item.totalPrice.toLocaleString('vi-VN')} VND
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-12 flex justify-end">
                    <div className="w-full max-w-sm bg-blue-50 p-8 rounded-2xl border border-blue-200 shadow-lg space-y-4">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                            <DollarSign className="w-6 h-6 mr-2 text-blue-600" />
                            Tổng kết đơn hàng
                        </h3>
                        <div className="flex justify-between items-center text-gray-700">
                            <span className="font-medium">Tổng tiền sản phẩm:</span>
                            <span className="text-gray-900 font-semibold">{order.subTotalAmount.toLocaleString('vi-VN')} VND</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-700">
                            <span className="font-medium">Phí vận chuyển:</span>
                            <span className="text-gray-900 font-semibold">{order.shippingFee.toLocaleString('vi-VN')} VND</span>
                        </div>
                        <div className="flex justify-between items-center border-t-2 border-blue-200 pt-5 mt-5 font-bold text-xl">
                            <span className="text-blue-700">Tổng thanh toán:</span>
                            <span className="text-red-700 text-3xl">
                                {calculatedTotalPayment.toLocaleString('vi-VN')} VND
                            </span>
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
                      icon, // Added icon prop
                  }: {
    label: string;
    value: string;
    bold?: boolean;
    highlight?: boolean;
    icon?: React.ReactNode; // Type for icon prop
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline text-sm"> {/* Reduced text size slightly */}
            <span className="min-w-[160px] text-gray-600 font-medium mb-1 sm:mb-0 flex items-center">
                {icon && <span className="mr-2">{icon}</span>} {/* Render icon if provided */}
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