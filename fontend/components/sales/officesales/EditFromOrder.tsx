"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Card, CardHeader, CardBody, CardFooter, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input,
    useDisclosure
} from "@heroui/react";
import { OptimizedProductItem } from "./OptimizedProductItem";
import PaymentModal from './PaymentModal';
import { useOrderStore } from './orderStore';

const statusMap: { [key: string]: string } = {
    // Trạng thái cũ
    'PENDING': 'Chờ xử lý',
    'PROCESSING': 'Đang xử lý', 
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    
    // Trạng thái thanh toán mới từ backend (case-sensitive)
    'PAID': 'Đã thanh toán',
    'PARTIAL': 'Thanh toán một phần', 
    'Paid': 'Đã thanh toán',
    'Partial': 'Thanh toán một phần',
    'Pending': 'Chờ thanh toán',
    
    // Thêm các trạng thái khác có thể có
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'partial': 'Thanh toán một phần',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
};

// Helper function để hiển thị trạng thái an toàn
const getStatusDisplay = (status: string): string => {
    if (!status) return 'Không xác định';
    
    // Thử tìm exact match trước
    if (statusMap[status]) return statusMap[status];
    
    // Thử uppercase
    if (statusMap[status.toUpperCase()]) return statusMap[status.toUpperCase()];
    
    // Thử lowercase
    if (statusMap[status.toLowerCase()]) return statusMap[status.toLowerCase()];
    
    // Thử capitalize first letter
    const capitalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (statusMap[capitalized]) return statusMap[capitalized];
    
    // Fallback: trả về status gốc
    return status;
};

export default function EditFromOrder() {
    const { data: session } = useSession();
    const {isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange} = useDisclosure();
    
    // Modal thanh toán tiền mặt states
    const {isOpen: isCashPaymentOpen, onOpen: onCashPaymentOpen, onOpenChange: onCashPaymentOpenChange} = useDisclosure();
    const [cashPaymentCountdown, setCashPaymentCountdown] = useState(5);
    const [isCashPaymentProcessing, setIsCashPaymentProcessing] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(0);

    // Zustand store - Tất cả state và logic đều từ store
    const {
        // States
        currentOrder,
        orderItems,
        itemsLoading,
        itemsError,
        products,
        filteredProducts,
        productsLoading,
        productsError,
        searchTerm,
        editableOrder,
        validationErrors,
        isUpdatingOrder,
        error: storeError,
        
        // Actions
        setSearchTerm,
        setEditableOrder,
        setValidationErrors,
        resetError,
        closeEditOrder,
        
        // API Actions
        fetchOrderItems,
        addVariantToOrder,
        updateOrderItemQuantity,
        deleteOrderItem,
        initializeProductData,
        updateOrder,
        cashPayment,
        
        // Utils
        validateCustomerInfo,
        isPaid,
        calculateOrderTotals,
        forceUpdateCurrentOrder,
    } = useOrderStore();

    // Initialize data when currentOrder changes
    useEffect(() => {
        if (currentOrder && session?.accessToken) {
            initializeProductData();
            fetchOrderItems(session);
        }
    }, [currentOrder, session, initializeProductData, fetchOrderItems]);

    // Debug effect to log when orderItems change
    useEffect(() => {
        console.log('🔄 OrderItems changed:', orderItems);
        if (orderItems.length > 0) {
            const totals = calculateOrderTotals();
            console.log('💰 Recalculated totals:', totals);
        }
    }, [orderItems, calculateOrderTotals]);

    // Effect to monitor payment status changes
    useEffect(() => {
        if (currentOrder?.payments) {
            console.log('💳 Payments changed:', currentOrder.payments);
            const totals = calculateOrderTotals();
            console.log('🔄 Status after payment change:', totals.calculatedStatus);
        }
    }, [currentOrder?.payments, calculateOrderTotals, forceRefresh]);

    // Effect to refresh data when forceRefresh changes
    useEffect(() => {
        if (forceRefresh > 0 && currentOrder && session?.accessToken) {
            console.log('🔄 Force refresh triggered:', forceRefresh);
            // Small delay to ensure backend has processed the payment
            setTimeout(async () => {
                await fetchOrderItems(session);
                // Also refresh the current order detail
                const { refreshCurrentOrder } = useOrderStore.getState();
                await refreshCurrentOrder(session);
            }, 500);
        }
    }, [forceRefresh, currentOrder, session, fetchOrderItems]);

    // Cash payment countdown logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isCashPaymentOpen && cashPaymentCountdown > 0) {
            interval = setInterval(() => {
                setCashPaymentCountdown(prev => {
                    const newCount = prev - 1;
                    if (newCount === 0) {
                        handleConfirmCashPayment();
                    }
                    return newCount;
                });
            }, 1000);
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isCashPaymentOpen, cashPaymentCountdown]);

    // Handlers using store functions
    const handleUpdateOrder = async () => {
        if (!currentOrder || !session?.accessToken) return;
        
        try {
            const requestBody = {
                orderId: currentOrder.orderId,
                customerName: editableOrder.customerName,
                phoneNumber: editableOrder.phoneNumber,
                discountAmount: editableOrder.discountAmount,
                payments: [],
            };
            
            await updateOrder(requestBody, session);
            
        } catch (err: any) {
            // Error đã được handle trong store
        }
    };

    const handleCashPaymentOpen = async () => {
        setValidationErrors({ customerName: '', phoneNumber: '' });
        
        // Kiểm tra có sản phẩm trong đơn hàng không
        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with cash payment: No order items');
            return;
        }
        
        if (!validateCustomerInfo()) {
            return;
        }

        const totals = calculateOrderTotals();
        if (totals.calculatedStatus.toUpperCase() === 'PAID') {
            return;
        }

        await handleUpdateOrder();
        setCashPaymentCountdown(5);
        onCashPaymentOpen();
    };

    const handleConfirmCashPayment = async () => {
        if (!currentOrder || !session?.accessToken) return;
        
        setIsCashPaymentProcessing(true);
        
        try {
            await cashPayment(currentOrder.orderCode, session);
            
            // Force refresh UI để hiển thị trạng thái mới ngay lập tức
            console.log('💰 Cash payment successful, forcing UI refresh...');
            setForceRefresh(prev => prev + 1);
            forceUpdateCurrentOrder();
            
            setTimeout(() => {
                onCashPaymentOpenChange();
                // Trigger another refresh after modal closes
                setForceRefresh(prev => prev + 1);
                forceUpdateCurrentOrder();
                console.log('🔄 Payment modal closed, UI should reflect new status');
            }, 2000);
            
        } catch (error: any) {
            console.error('❌ Cash payment failed:', error);
            setTimeout(() => {
                onCashPaymentOpenChange();
            }, 3000);
        } finally {
            setIsCashPaymentProcessing(false);
        }
    };

    const handlePaymentOpen = async () => {
        setValidationErrors({ customerName: '', phoneNumber: '' });
        
        // Kiểm tra có sản phẩm trong đơn hàng không
        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with VNPay payment: No order items');
            return;
        }
        
        if (!validateCustomerInfo()) {
            return;
        }

        const totals = calculateOrderTotals();
        if (totals.calculatedStatus.toUpperCase() === 'PAID') {
            return;
        }

        await handleUpdateOrder();
        onPaymentOpen();
    };

    const handleEditableOrderChange = (field: string, value: string | number) => {
        setEditableOrder({
            ...editableOrder,
            [field]: value
        });
        
        if (validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors({
                ...validationErrors,
                [field]: ''
            });
        }
    };

    if (!currentOrder) {
        return (
            <div className="flex w-full flex-col gap-4 p-4">
                <div className="text-center py-20">
                    <Spinner label="Đang tải thông tin đơn hàng..." />
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-4 p-4 min-h-screen">
            {/* Header với nút quay lại */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button 
                        color="default" 
                        variant="flat" 
                        onPress={closeEditOrder}
                        startContent="←"
                    >
                        Quay lại danh sách
                    </Button>
                    <h1 className="text-2xl font-bold">Chỉnh sửa Đơn hàng: {currentOrder?.orderCode}</h1>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Order Details */}
                <div className="flex flex-col gap-4 h-full">
                    <Card className="p-4">
                        <CardHeader>
                            <div className="flex justify-between items-center w-full">
                                <h3 className="text-lg font-bold">Thông tin đơn hàng</h3>
                                <div className="flex gap-2">
                                    {(() => {
                                        const totals = calculateOrderTotals();
                                        const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                        const hasOrderItems = orderItems.length > 0;
                                        const canPayment = !isPaidStatus && currentOrder.orderStatus !== 'COMPLETED' && hasOrderItems;
                                        
                                        return (
                                            <>
                                                <Button 
                                                    color="warning" 
                                                    size="sm" 
                                                    onPress={handleCashPaymentOpen}
                                                    disabled={!canPayment}
                                                    title={!hasOrderItems ? "Vui lòng thêm sản phẩm vào đơn hàng trước khi thanh toán" : ""}
                                                >
                                                    💰 Tiền mặt
                                                </Button>
                                                <Button 
                                                    color="success" 
                                                    size="sm" 
                                                    onPress={handlePaymentOpen}
                                                    disabled={!canPayment}
                                                    title={!hasOrderItems ? "Vui lòng thêm sản phẩm vào đơn hàng trước khi thanh toán" : ""}
                                                >
                                                    Thanh toán VN Pay
                                                </Button>
                                            </>
                                        );
                                    })()}
                                    {(() => {
                                        const totals = calculateOrderTotals();
                                        const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                        return (
                                            <Button 
                                                color="primary" 
                                                size="sm" 
                                                onPress={handleUpdateOrder} 
                                                disabled={isUpdatingOrder || isPaidStatus}
                                            >
                                                {isUpdatingOrder ? <Spinner color="white" size="sm" /> : "Lưu thay đổi"}
                                            </Button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(() => {
                                    const totals = calculateOrderTotals();
                                    const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                    return (
                                        <>
                                            <div>
                                                <Input
                                                    label="Tên khách hàng"
                                                    value={editableOrder.customerName}
                                                    onChange={(e) => handleEditableOrderChange('customerName', e.target.value)}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.customerName}
                                                    errorMessage={validationErrors.customerName}
                                                    disabled={isPaidStatus}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Số điện thoại"
                                                    value={editableOrder.phoneNumber}
                                                    onChange={(e) => handleEditableOrderChange('phoneNumber', e.target.value)}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.phoneNumber}
                                                    errorMessage={validationErrors.phoneNumber}
                                                    disabled={isPaidStatus}
                                                />
                                            </div>
                                            <Input
                                                label="Giảm giá"
                                                type="number"
                                                value={String(editableOrder.discountAmount)}
                                                onChange={(e) => handleEditableOrderChange('discountAmount', Number(e.target.value) || 0)}
                                                fullWidth
                                                startContent={<span className="text-gray-400 text-sm">VND</span>}
                                                disabled={isPaidStatus}
                                            />
                                        </>
                                    );
                                })()}
                                <div className="p-2 bg-white rounded-md border text-sm">
                                    {(() => {
                                        const totals = calculateOrderTotals();
                                        console.log('🔍 Debug status display:', {
                                            calculatedStatus: totals.calculatedStatus,
                                            mappedStatus: statusMap[totals.calculatedStatus] || statusMap[totals.calculatedStatus.toUpperCase()],
                                            currentOrderStatus: currentOrder.orderStatus,
                                            payments: currentOrder.payments
                                        });
                                        return (
                                            <>
                                                <p><strong>Tạm tính:</strong> {totals.subTotalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Thành tiền:</strong> {totals.finalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Trạng thái:</strong> {getStatusDisplay(totals.calculatedStatus)}</p>
                                                
                                                {/* Thông báo khi không có sản phẩm */}
                                                {orderItems.length === 0 && (
                                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                                                        ⚠️ Vui lòng thêm sản phẩm vào đơn hàng để có thể thanh toán
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    
                                    {/* Hiển thị trạng thái thanh toán */}
                                    {(() => {
                                        const totals = calculateOrderTotals();
                                        const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                        return (
                                            <p><strong>Thanh toán:</strong> 
                                                <span className={`ml-1 px-2 py-1 rounded text-xs ${isPaidStatus ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {isPaidStatus ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                </span>
                                            </p>
                                        );
                                    })()}
                                    
                                    {/* Hiển thị thông tin thanh toán */}
                                    {currentOrder.payments && currentOrder.payments.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="font-bold mb-2">Thông tin thanh toán:</p>
                                            {currentOrder.payments.map((payment: any, index: number) => (
                                                <div key={payment.paymentId || index} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                                                    <p><strong>Phương thức:</strong> {payment.paymentMethod}</p>
                                                    <p><strong>Số tiền:</strong> {payment.amount.toLocaleString('vi-VN')} VND</p>
                                                    <p><strong>Trạng thái:</strong> 
                                                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                            payment.paymentStatus.toUpperCase() === 'SUCCESS' || payment.paymentStatus.toUpperCase() === 'COMPLETED' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {payment.paymentStatus}
                                                        </span>
                                                    </p>
                                                    {payment.transactionId && (
                                                        <p><strong>Mã giao dịch:</strong> {payment.transactionId}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    
                    <Card className="flex-grow">
                        <CardHeader>
                            <h3 className="text-lg font-bold">Sản phẩm trong đơn</h3>
                        </CardHeader>
                        <CardBody>
                            {(itemsError || storeError) && (
                                <div className="text-red-500 p-2 mb-2 bg-red-50 rounded" role="alert">
                                    {itemsError || storeError}
                                    {storeError && (
                                        <Button size="sm" variant="light" color="danger" className="ml-2" onPress={resetError}>
                                            Đóng
                                        </Button>
                                    )}
                                </div>
                            )}
                            <div className="overflow-y-auto">
                                {itemsLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spinner label="Đang tải..." />
                                    </div>
                                ) : orderItems.length === 0 ? (
                                    <div className="text-center p-10 text-gray-500">Đơn hàng này chưa có sản phẩm.</div>
                                ) : (
                                    <Table removeWrapper aria-label="Sản phẩm trong đơn hàng">
                                        <TableHeader>
                                            <TableColumn>SẢN PHẨM</TableColumn>
                                            <TableColumn>SỐ LƯỢNG</TableColumn>
                                            <TableColumn className="text-right">ĐƠN GIÁ</TableColumn>
                                            <TableColumn className="text-right">THÀNH TIỀN</TableColumn>
                                            <TableColumn>HÀNH ĐỘNG</TableColumn>
                                        </TableHeader>
                                        <TableBody items={orderItems}>
                                            {(item) => (
                                                <TableRow key={item.orderItemId}>
                                                    <TableCell>
                                                        <div>{item.productName}</div>
                                                        <div className="text-xs text-gray-500">{item.variantInfo}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {(() => {
                                                                const totals = calculateOrderTotals();
                                                                const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                                                return (
                                                                    <>
                                                                        <Button 
                                                                            isIconOnly 
                                                                            size="sm" 
                                                                            variant="flat" 
                                                                            onPress={() => updateOrderItemQuantity(item.orderItemId, item.quantity - 1, session)}
                                                                            disabled={isPaidStatus}
                                                                        >-</Button>
                                                                        <Input
                                                                            type="number"
                                                                            value={String(item.quantity)}
                                                                            onBlur={(e) => {
                                                                                if (!isPaidStatus) {
                                                                                    const newQuantity = parseInt(e.target.value, 10);
                                                                                    if (!isNaN(newQuantity)) {
                                                                                        updateOrderItemQuantity(item.orderItemId, newQuantity, session);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-16 text-center"
                                                                            disabled={isPaidStatus}
                                                                        />
                                                                        <Button 
                                                                            isIconOnly 
                                                                            size="sm" 
                                                                            variant="flat" 
                                                                            onPress={() => updateOrderItemQuantity(item.orderItemId, item.quantity + 1, session)}
                                                                            disabled={isPaidStatus}
                                                                        >+</Button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{item.priceAtPurchase.toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell className="text-right">{item.totalPrice.toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const totals = calculateOrderTotals();
                                                            const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                                            return (
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    onPress={() => deleteOrderItem(item.orderItemId, session)}
                                                                    disabled={isPaidStatus}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            );
                                                        })()}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Pane: Product List */}
                <Card className="flex flex-col gap-4 h-full">
                    <CardHeader>
                        <h3 className="text-lg font-bold">Thêm sản phẩm vào đơn</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col gap-4 h-full">
                            <Input
                                label="Tìm kiếm sản phẩm"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-full"
                            />
                            {productsError && <div className="text-red-500 p-2">{productsError}</div>}
                            <div className="flex-grow overflow-y-auto pr-2 border rounded-lg p-2">
                                {productsLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spinner label="Đang tải sản phẩm..." />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(() => {
                                            const totals = calculateOrderTotals();
                                            const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                            
                                            if (isPaidStatus) {
                                                return (
                                                    <div className="text-center py-10 text-gray-500">
                                                        <p>Đơn hàng đã được thanh toán.</p>
                                                        <p>Không thể thêm sản phẩm mới.</p>
                                                    </div>
                                                );
                                            }
                                            
                                            return filteredProducts.length > 0 ? (
                                                filteredProducts.map(p => (
                                                    <OptimizedProductItem
                                                        key={p.productId}
                                                        product={p}
                                                        onLoadVariants={() => Promise.resolve()}
                                                        onAddToCart={(variant) => addVariantToOrder(variant, session)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-gray-500">Không tìm thấy sản phẩm.</div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            
            {/* Modal thanh toán tiền mặt */}
            {isCashPaymentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <Card className="w-96 max-w-full mx-4">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <span>💰</span>
                                <span>Thanh toán bằng tiền mặt</span>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <h4 className="text-lg font-bold text-yellow-800 mb-2">
                                        Đơn hàng: {currentOrder?.orderCode}
                                    </h4>
                                    <p className="text-2xl font-bold text-yellow-900">
                                        Số tiền: {calculateOrderTotals().finalAmount.toLocaleString('vi-VN')} VND
                                    </p>
                                </div>
                                
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    {cashPaymentCountdown > 0 ? (
                                        <>
                                            <p className="text-blue-800 font-medium mb-2">
                                                🕒 Vui lòng đếm tiền từ khách hàng
                                            </p>
                                            <div className="space-y-2">
                                                <div className="text-3xl font-bold text-blue-600">
                                                    {cashPaymentCountdown}
                                                </div>
                                                <p className="text-sm text-blue-600">
                                                    Tự động thanh toán sau {cashPaymentCountdown} giây
                                                </p>
                                                <div className="w-full bg-blue-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                                                        style={{ width: `${((5 - cashPaymentCountdown) / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            {isCashPaymentProcessing ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Spinner size="md" color="success" />
                                                        <span className="text-blue-800 font-bold">Đang xử lý thanh toán...</span>
                                                    </div>
                                                    <p className="text-sm text-blue-600">
                                                        Vui lòng chờ hệ thống cập nhật trạng thái đơn hàng
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-green-600 font-bold text-xl">
                                                        ✅ Thanh toán thành công!
                                                    </div>
                                                    <p className="text-sm text-green-600">
                                                        Đơn hàng đã được cập nhật trạng thái thanh toán
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                        <CardFooter>
                            {cashPaymentCountdown > 0 ? (
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={onCashPaymentOpenChange}
                                    className="w-full"
                                >
                                    Hủy thanh toán
                                </Button>
                            ) : (
                                <Button 
                                    color="primary" 
                                    onPress={onCashPaymentOpenChange}
                                    disabled={isCashPaymentProcessing}
                                    className="w-full"
                                >
                                    {isCashPaymentProcessing ? 'Đang xử lý...' : 'Đóng'}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
            
            {currentOrder && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onOpenChange={onPaymentOpenChange}
                    orderAmount={calculateOrderTotals().finalAmount}
                    orderCode={currentOrder.orderCode}
                />
            )}
        </div>
    );
}