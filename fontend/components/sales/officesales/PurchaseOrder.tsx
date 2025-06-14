'use client';

import { useEffect } from 'react';
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
    Pagination
} from "@heroui/react";
import EditFromOrder from './EditFromOrder';
import { useOrderStore } from './orderStore';

const statusMap: { [key: string]: string } = {
    all: 'Tất cả',
    Pending: 'Chờ xử lý',
    Partial: 'Thanh toán một phần',
    Paid: 'Đã thanh toán',
};

export default function PurchaseOrder() {
    const { data: session } = useSession();
    
    // Zustand store - Tất cả state và logic từ store
    const {
        // States
        orders,
        loading,
        error,
        isCreating,
        page,
        totalPages,
        activeTab,
        isEditMode,
        
        // Actions
        setPage,
        setActiveTab,
        resetError,
        
        // API Actions
        fetchOrders,
        createOrder,
        deleteOrder,
        openEditOrder,
    } = useOrderStore();

    // Auto-fetch orders when dependencies change
    useEffect(() => {
        fetchOrders(session);
    }, [session, page, activeTab, fetchOrders]);

    // Handlers using store functions
    const handleSelectionChange = (key: string | number) => {
        setActiveTab(key);
    };

    const handleCreateOrder = async () => {
        await createOrder(session);
    };

    const handleViewDetails = (order: any) => {
        openEditOrder(order);
    };

    const handleDeleteOrder = async (orderId: number) => {
        await deleteOrder(orderId, session);
    };

    // Render table content with all states handled by store
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
                            <TableCell>{order.customerName || 'Không có thông tin'}</TableCell>
                            <TableCell>{order.phoneNumber || 'Không có thông tin'}</TableCell>
                            <TableCell>{statusMap[order.orderStatus as keyof typeof statusMap] || order.orderStatus}</TableCell>
                            <TableCell className="text-right">{order.finalAmount.toLocaleString('vi-VN')} VND</TableCell>
                            <TableCell className="flex gap-2">
                                <Button size="sm" color="primary" variant="flat" onPress={() => handleViewDetails(order)}>
                                    Xem & Sửa
                                </Button>
                                <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteOrder(order.orderId)}>
                                    Xóa
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    };

    // Conditional rendering based on store state
    if (isEditMode) {
        return <EditFromOrder />;
    }

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
            
            {/* Error handling from store */}
            {error && !isCreating && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                    <span className="font-medium">Lỗi!</span> {error}
                    <Button 
                        size="sm" 
                        variant="light" 
                        color="danger" 
                        className="ml-2"
                        onPress={resetError}
                    >
                        Đóng
                    </Button>
                </div>
            )}
            
            {/* Tabs with store state */}
            <Tabs
                aria-label="Lọc đơn hàng theo trạng thái"
                items={Object.keys(statusMap).map(statusKey => ({
                    id: statusKey, 
                    label: statusMap[statusKey as keyof typeof statusMap]
                }))}
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
        </div>
    );
}
