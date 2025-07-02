'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PaymentDTO {
    paymentId: number;
    method: string;
    amount: number;
    createdAt: string;
    confirmedBy: string | null;
}

interface ProductDTO {
    productId: number;
    productName: string;
    imageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderDetailDTO {
    orderId: number;
    orderId: string;
    orderStatus: string;
    orderType: string;
    note: string | null;
    customerInfo: string | null;
    payments: PaymentDTO[];
    items: ProductDTO[];
    subTotal: number;
    discount: number;
    finalAmount: number;
}

export default function OrderDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const { orderId } = params as { orderId: string };

    const [order, setOrder] = useState<OrderDetailDTO | null>(null);

    useEffect(() => {
        if (!session?.accessToken) return;

        const fetchDetail = async () => {
            const res = await fetch(`http://localhost:8080/api/orders/detail/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!res.ok) {
                console.error('❌ Lỗi API:', res.status);
                return;
            }

            const data = await res.json();
            setOrder(data.data);
        };

        fetchDetail();
    }, [session, orderId]);

    if (!order) return <p className="p-4">Đang tải chi tiết hóa đơn...</p>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">
                Thông tin hóa đơn {order.orderId}
            </h1>

            <div className="bg-white shadow p-4 rounded">
                <p>
                    <strong>Trạng thái:</strong> {order.orderStatus}
                </p>
                <p>
                    <strong>Loại hóa đơn:</strong> {order.orderType}
                </p>
                <p>
                    <strong>Ghi chú:</strong> {order.note || '-'}
                </p>
                <p>
                    <strong>Khách hàng:</strong> {order.customerInfo || '-'}
                </p>
            </div>

            <div className="bg-white shadow p-4 rounded">
                <h2 className="text-lg font-bold mb-2">Lịch sử thanh toán</h2>
                <table className="w-full border">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">#</th>
                        <th className="p-2 border">Phương thức</th>
                        <th className="p-2 border">Số tiền</th>
                        <th className="p-2 border">Thời gian</th>
                        <th className="p-2 border">Xác nhận</th>
                    </tr>
                    </thead>
                    <tbody>
                    {order.payments.map((p, idx) => (
                        <tr key={p.paymentId}>
                            <td className="p-2 border">{idx + 1}</td>
                            <td className="p-2 border">{p.method}</td>
                            <td className="p-2 border">
                                {p.amount.toLocaleString('vi-VN')} VND
                            </td>
                            <td className="p-2 border">{p.createdAt}</td>
                            <td className="p-2 border">{p.confirmedBy || '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white shadow p-4 rounded">
                <h2 className="text-lg font-bold mb-2">Danh sách sản phẩm</h2>
                <table className="w-full border">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">STT</th>
                        <th className="p-2 border">Hình ảnh</th>
                        <th className="p-2 border">Sản phẩm</th>
                        <th className="p-2 border">Số lượng</th>
                        <th className="p-2 border">Đơn giá</th>
                        <th className="p-2 border">Số tiền</th>
                    </tr>
                    </thead>
                    <tbody>
                    {order.items.map((item, idx) => (
                        <tr key={item.productId}>
                            <td className="p-2 border">{idx + 1}</td>
                            <td className="p-2 border">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt="sp"
                                        className="w-12 h-12 object-cover"
                                    />
                                ) : (
                                    '-'
                                )}
                            </td>
                            <td className="p-2 border">{item.productName}</td>
                            <td className="p-2 border">{item.quantity}</td>
                            <td className="p-2 border">
                                {item.unitPrice.toLocaleString('vi-VN')} VND
                            </td>
                            <td className="p-2 border">
                                {item.totalPrice.toLocaleString('vi-VN')} VND
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white shadow p-4 rounded">
                <p>Tổng tiền sản phẩm: {order.subTotal.toLocaleString('vi-VN')} VND</p>
                <p>Mã giảm giá: -{order.discount.toLocaleString('vi-VN')} VND</p>
                <p className="text-xl font-bold text-red-600">
                    Tổng thanh toán: {order.finalAmount.toLocaleString('vi-VN')} VND
                </p>
            </div>
        </div>
    );
}
