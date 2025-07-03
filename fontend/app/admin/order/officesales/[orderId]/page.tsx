

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import OrderTimeline from '@/components/order/OrderTimeline';

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
    finalAmount: number;
    subTotalAmount: number;
    discountAmount: number;
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
    const { orderId } = useParams();
    const [order, setOrder] = useState<OrderDetailWithItems | null>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            const res = await fetch(
                `http://localhost:8080/api/orders/detail/id/${orderId}/with-items`
            );
            const data = await res.json();
            setOrder(data.data);
        };
        if (orderId) fetchOrderDetail();
    }, [orderId]);

    if (!order) return <div className="p-8">Đang tải...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Link href="/admin/order/officesales" className="text-gray-600 hover:text-gray-900 inline-flex items-center">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                Chi tiết đơn hàng #{order.orderCode}
            </h1>

            <OrderTimeline status={order.orderStatus} />

            {/* ✅ Thông tin hóa đơn: Viết thẳng */}
            <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border border-gray-100">
                <div className="space-y-2">
                    <Row label="Mã đơn hàng" value={order.orderCode} bold />
                    <Row
                        label="Trạng thái"
                        value={STATUS_MAP[order.orderStatus] || order.orderStatus}
                        bold
                        highlight
                    />
                    <Row
                        label="Ngày tạo"
                        value={new Date(order.orderDate).toLocaleString('vi-VN')}
                        bold
                    />
                    <Row label="Phương thức giao hàng" value={order.shippingMethod || '-'} />
                    <Row label="Địa chỉ" value={order.fullAddress || '-'} />
                    <Row label="Ghi chú" value={order.customerNotes || '-'} />
                </div>

                <div className="space-y-2">
                    <Row label="Tên khách hàng" value={order.customerName || order.fullName || '-'} bold />
                    <Row label="Email" value={order.email || '-'} />
                    <Row label="Số điện thoại" value={order.phoneNumber || '-'} bold />
                    <Row label="Người nhận" value={order.recipientName || '-'} bold />
                </div>
            </div>

            {/* ✅ Bảng DANH SÁCH SẢN PHẨM */}
            <div className="mt-10">
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                        <tr>
                            <th
                                colSpan={6}
                                className="px-4 py-3 border text-center text-base font-bold uppercase"
                            >
                                DANH SÁCH SẢN PHẨM
                            </th>
                        </tr>
                        <tr>
                            <th className="px-4 py-3 border">STT</th>
                            <th className="px-4 py-3 border">Hình ảnh</th>
                            <th className="px-4 py-3 border">Sản phẩm</th>
                            <th className="px-4 py-3 border text-center">Số lượng</th>
                            <th className="px-4 py-3 border text-right">Đơn giá</th>
                            <th className="px-4 py-3 border text-right">Số tiền</th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.orderItems.map((item, idx) => (
                            <tr
                                key={item.orderItemId}
                                className="hover:bg-gray-50 transition"
                            >
                                <td className="px-4 py-3 border text-center">{idx + 1}</td>
                                <td className="px-4 py-3 border text-center">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            className="w-16 h-16 object-cover rounded border mx-auto"
                                        />
                                    ) : (
                                        <span className="text-gray-400 italic">Không ảnh</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 border">
                                    <div>{item.productName}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.colorName || ''} {item.sizeName || ''} {item.sku && item.sku}
                                    </div>
                                </td>
                                <td className="px-4 py-3 border text-center">{item.quantity}</td>
                                <td className="px-4 py-3 border text-right">
                                    {item.priceAtPurchase.toLocaleString('vi-VN')} VND
                                </td>
                                <td className="px-4 py-3 border text-right">
                                    {item.totalPrice.toLocaleString('vi-VN')} VND
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ✅ Block tổng tiền */}
            <div className="mt-4 max-w-md ml-auto text-[15px]">
                <div className="flex justify-between">
                    <span className="text-gray-700">Tổng liên sản phẩm:</span>
                    <span>{order.subTotalAmount.toLocaleString('vi-VN')} VND</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-700">Mã giảm giá:</span>
                    <span className="text-red-600">
            {order.discountAmount > 0
                ? `PGG012 - ${order.discountAmount.toLocaleString('vi-VN')} VND`
                : '0 VND'}
          </span>
                </div>

                <div className="flex justify-between font-bold text-[17px] mt-2">
                    <span className="text-blue-600">Tổng thanh toán:</span>
                    <span className="text-red-700">
            {order.finalAmount.toLocaleString('vi-VN')} VND
          </span>
                </div>
            </div>
        </div>
    );
}

// ✅ Row component nhỏ gọn
function Row({
                 label,
                 value,
                 bold = false,
                 highlight = false,
             }: {
    label: string;
    value: string;
    bold?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-start text-[15px]">
      <span className="inline-block min-w-[160px] text-gray-600 font-medium">
        {label}:
      </span>
            <span
                className={`${
                    bold ? 'font-semibold' : ''
                } ${highlight ? 'text-blue-600 font-bold' : 'text-gray-900'}`}
            >
        {value}
      </span>
        </div>
    );
}
