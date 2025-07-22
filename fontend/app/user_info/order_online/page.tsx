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
    TableCell
} from "@heroui/react";
import { 
    ShoppingCart, 
    Calendar, 
    Phone,
    CreditCard, 
    Package,
} from "lucide-react";
import {CldImage} from "next-cloudinary";
import { useState } from "react";
import OrderTabs from '@/components/order/OrderTabs';

const user = {
    fullName: "Nguyễn Văn A",
    username: "nguyenvana",
    email: "nguyenvana@example.com",
    phoneNumber: "0987654321",
    avatarUrl: "sample_avatar_public_id"
};

const tabList = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Chờ lấy hàng" },
  { key: "shipping", label: "Chờ giao hàng" },
  { key: "delivered", label: "Đã giao" },
];

// Dữ liệu mẫu, thêm trạng thái cho từng đơn hàng
const orders = [
  {
    orderId: 1,
    orderCode: "ONL123456",
    orderDate: "2024-06-01T10:30:00Z",
    orderStatus: "pending",
    customerName: "Nguyễn Văn A",
    finalAmount: 1500000,
    discountAmount: 50000
  },
  {
    orderId: 2,
    orderCode: "ONL123457",
    orderDate: "2024-06-02T14:15:00Z",
    orderStatus: "processing",
    customerName: "Nguyễn Văn A",
    finalAmount: 800000,
    discountAmount: 0
  },
  {
    orderId: 3,
    orderCode: "ONL123458",
    orderDate: "2024-06-03T09:00:00Z",
    orderStatus: "shipping",
    customerName: "Nguyễn Văn A",
    finalAmount: 1200000,
    discountAmount: 0
  },
  {
    orderId: 4,
    orderCode: "ONL123459",
    orderDate: "2024-06-04T09:00:00Z",
    orderStatus: "delivered",
    customerName: "Nguyễn Văn A",
    finalAmount: 900000,
    discountAmount: 0
  }
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
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

export default function OrderOnlinePage() {
    const [activeTab, setActiveTab] = useState("pending");
    // Lọc đơn hàng theo tab
    const filteredOrders = orders.filter(order => order.orderStatus === activeTab);
    return (
        <div className="container mx-auto p-6 space-y-6">
            <OrderTabs />
            {/* Header */}
            <Card>
                <CardHeader className="flex gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <CldImage
                            width={64}
                            height={64}
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xl font-bold">Đơn hàng online của tôi</p>
                        <p className="text-small text-default-500">
                            {user.fullName} • {user.email}
                        </p>
                        <p className="text-small text-default-500 flex items-center gap-1">
                            <Phone size={12} />
                            {user.phoneNumber}
                        </p>
                    </div>
                </CardHeader>
            </Card>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <ShoppingCart className="text-primary" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.length}</p>
                        <p className="text-small text-default-500">Tổng đơn hàng</p>
                    </CardBody>
                </Card>
                
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Package className="text-success" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus.toLowerCase() === 'paid').length}</p>
                        <p className="text-small text-default-500">Đã thanh toán</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Calendar className="text-warning" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus.toLowerCase() === 'pending').length}</p>
                        <p className="text-small text-default-500">Chờ thanh toán</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CreditCard className="text-secondary" size={24} />
                        </div>
                        <p className="text-2xl font-bold">
                            {formatCurrency(orders.reduce((sum, order) => sum + order.finalAmount, 0))}
                        </p>
                        <p className="text-small text-default-500">Tổng giá trị</p>
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
                    {filteredOrders.length === 0 ? (
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
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.orderId}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.orderCode}</p>
                                                <p className="text-small text-default-500">{order.customerName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-default-400" />
                                                {formatDate(order.orderDate)}
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
                                                    onClick={() => alert(`Xem chi tiết đơn hàng: ${order.orderCode}`)}
                                                >
                                                    Chi tiết đầy đủ
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}