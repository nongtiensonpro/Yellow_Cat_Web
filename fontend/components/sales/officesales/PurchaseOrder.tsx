'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tabs,
    Tab,
    Button,
    Spinner,
    Pagination, useDisclosure
} from "@heroui/react";
import EditFromOrder from './EditFromOrder';
import PaymentModal from './PaymentModal';

interface Order {
    orderId: number;
    orderCode: string;
    phoneNumber: string;
    customerName: string;
    subTotalAmount: number;
    discountAmount: number;
    finalAmount: number;
    orderStatus: string;
}


const statusMap: { [key: string]: string } = {
    all: 'Tất cả',
    Pending: 'Chờ xử lý',
    Partial: 'Thanh toán một phần',
    Paid: 'Đã thanh toán',
};


export default function PurchaseOrder() {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const {isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange} = useDisclosure();
    const { data: session } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState<string | number>('all');

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

    const handleSelectionChange = (key: string | number) => {
        setActiveTab(key);
        setPage(1); // Reset về trang 1 khi đổi tab
    };

    const fetchOrders = useCallback(async () => {
        if (!session?.accessToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const url = new URL('http://localhost:8080/api/orders');
            url.searchParams.append('page', `${page - 1}`);
            url.searchParams.append('size', '10');

            // Nếu không phải tab "Tất cả", thì gọi endpoint /status với parameter status
            if (activeTab !== 'all') {
                url.pathname = '/api/orders/status';
                url.searchParams.append('status', activeTab.toString());
            }

            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Lỗi ${res.status}: Không thể tải danh sách đơn hàng.`);
            }

            const responseData = await res.json();
            setOrders(responseData?.data?.content || []);
            setTotalPages(responseData?.data?.page?.totalPages || 1);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [session, page, activeTab]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCreateOrder = async () => {
        if (!session?.accessToken) {
            setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
        }

        setIsCreating(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.message || `Lỗi ${res.status}: Không thể tạo đơn hàng mới.`;
                throw new Error(errorMessage);
            }

            // Chuyển về tab "all", trang 1 để xem đơn hàng mới
            if (activeTab !== 'all' || page !== 1) {
                setActiveTab('all');
                setPage(1);
            } else {
                fetchOrders();
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        onOpen();
    };


    const deleteOrder = async (orderId: number)=>{
        if (!session?.accessToken) {
            setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });
            if (!res.ok) {
                throw new Error(`Lỗi ${res.status}: Không thể xóa đơn hàng.`);
            }
            if (activeTab!== 'all' || page!== 1) {
                setActiveTab('all');
                setPage(1);
            } else {
                 fetchOrders();
            }
        }catch (err: any) {
            setError(err.message);
        }
    }

    const renderTableContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><Spinner label="Đang tải..." /></div>;
        }

        if (error) {
            return <div className="text-center text-red-500 p-4 h-64">{error}</div>;
        }

        if (orders.length === 0) {
            return <div className="text-center text-gray-500 p-4 h-64">Không có đơn hàng nào để hiển thị.</div>;
        }

        return (
            <Table
                aria-label="Bảng danh sách đơn hàng"
                bottomContent={
                    totalPages > 1 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={totalPages}
                                onChange={setPage}
                            />
                        </div>
                    ) : null
                }
            >
                <TableHeader>
                    <TableColumn>MÃ ĐƠN HÀNG</TableColumn>
                    <TableColumn>KHÁCH HÀNG</TableColumn>
                    <TableColumn>SỐ ĐIỆN THOẠI</TableColumn>
                    <TableColumn>TRẠNG THÁI</TableColumn>
                    <TableColumn className="text-right">TỔNG TIỀN</TableColumn>
                    <TableColumn>HÀNH ĐỘNG</TableColumn>
                </TableHeader>
                <TableBody emptyContent={"Không có đơn hàng."}>
                    {orders.map((order) => (
                        <TableRow key={order.orderId}>
                            <TableCell>{order.orderCode}</TableCell>
                            <TableCell>{order.customerName!=null?order.customerName:'Không có thông tin'}</TableCell>
                            <TableCell>{order.phoneNumber!=null?order.phoneNumber:'Không có thông tin'}</TableCell>
                            <TableCell>{statusMap[order.orderStatus as keyof typeof statusMap] || order.orderStatus}</TableCell>
                            <TableCell className="text-right">{order.finalAmount.toLocaleString('vi-VN')} VND</TableCell>
                            <TableCell className="flex gap-2">
                                <Button size="sm" color="primary" variant="flat" onPress={() => handleViewDetails(order)}>Xem & Sửa</Button>
                                <Button size="sm" color="danger" variant="flat" onPress={() => deleteOrder(order.orderId)}>Xóa</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    };

    return (
        <div className="flex w-full flex-col gap-4 p-4">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Quản lý Đơn hàng</h1>
                <Button
                    color="default"
                    onClick={handleCreateOrder}
                    disabled={isCreating}
                >
                    {isCreating ? <Spinner color="white" size="sm" /> : "Tạo Đơn Hàng Mới"}
                </Button>
            </div>
            {error && !isCreating && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span className="font-medium">Lỗi!</span> {error}
            </div>}
            <Tabs
                aria-label="Lọc đơn hàng theo trạng thái"
                items={Object.keys(statusMap).map(statusKey => ({id: statusKey, label: statusMap[statusKey as keyof typeof statusMap]}))}
                selectedKey={activeTab}
                onSelectionChange={handleSelectionChange}
                color="primary"
                variant="underlined"
            >
                {(item) => (
                    <Tab key={item.id} title={item.label}>
                        {renderTableContent()}
                    </Tab>
                )}
            </Tabs>
            {selectedOrder && (
                <EditFromOrder
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    order={selectedOrder}
                    onOrderUpdate={fetchOrders}
                />
            )}
            {selectedOrderForPayment && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onOpenChange={onPaymentOpenChange}
                    orderAmount={selectedOrderForPayment.finalAmount}
                    orderCode={selectedOrderForPayment.orderCode}
                />
            )}
        </div>
    );
}
