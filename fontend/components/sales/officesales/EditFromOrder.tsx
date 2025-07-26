"use client"

import {useState, useEffect, useCallback} from "react";
import {useSession} from "next-auth/react";
import {
    Card, CardHeader, CardBody, CardFooter, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input,
    useDisclosure
} from "@heroui/react";
import {OptimizedProductItem} from "./OptimizedProductItem";
import PaymentModal from './PaymentModal';
import {useOrderStore} from './orderStore';
import InvoicePrint from './InvoicePrint';

// Regex để validate số điện thoại Việt Nam
// Bắt đầu bằng 0 hoặc +84, theo sau là:
// - 03[2-9] (Vinaphone, Mobifone)
// - 05[689] (Vietnamobile) 
// - 07[06-9] (Mobifone, Gmobile)
// - 08[1-689] (Vinaphone, Vietnamobile)
// - 09[0-46-9] (Mobifone, Vinaphone, Vietnamobile)
// Kết thúc với 7 chữ số nữa (tổng cộng 10-11 số)
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

// Helper function để format số điện thoại (loại bỏ ký tự không cần thiết)
const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)\.]/g, '').trim();
};

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

// Helper function để kiểm tra trạng thái đơn hàng
const getOrderStatus = (editableOrder: EditableOrderInfo, orderItems: unknown[], calculateOrderTotals: () => { calculatedStatus: string; finalAmount: number; subTotalAmount: number }) => {
    const totals = calculateOrderTotals();
    const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
    
    // Đã thanh toán
    if (isPaidStatus) {
        return {
            type: 'PAID',
            canEdit: false,
            canAddProducts: false,
            canPayment: false,
            badge: { icon: '✅', text: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
            message: null
        };
    }
    
    // Chưa có sản phẩm
    if (orderItems.length === 0) {
        return {
            type: 'NO_PRODUCTS',
            canEdit: true,
            canAddProducts: true,
            canPayment: false,
            badge: { icon: '📦', text: 'Chưa có sản phẩm', color: 'bg-orange-100 text-orange-800' },
            message: {
                title: 'Đơn hàng trống',
                description: 'Vui lòng thêm ít nhất một sản phẩm vào đơn hàng để có thể tiếp tục.',
                type: 'warning'
            }
        };
    }
    
    // Kiểm tra thông tin khách hàng
    const hasValidCustomerInfo = editableOrder.customerName.trim().length >= 2 && 
                                editableOrder.phoneNumber.trim() && 
                                PHONE_REGEX.test(formatPhoneNumber(editableOrder.phoneNumber));
    
    if (!hasValidCustomerInfo) {
        return {
            type: 'INVALID_CUSTOMER_INFO',
            canEdit: true,
            canAddProducts: true,
            canPayment: false,
            badge: { icon: '👤', text: 'Cần thông tin KH', color: 'bg-yellow-100 text-yellow-800' },
            message: {
                title: 'Thiếu thông tin khách hàng',
                description: 'Vui lòng nhập đầy đủ tên và số điện thoại hợp lệ của khách hàng.',
                type: 'info'
            }
        };
    }
    
    // Đơn hàng hoàn chỉnh, sẵn sàng thanh toán
    return {
        type: 'READY_TO_PAY',
        canEdit: true,
        canAddProducts: true,
        canPayment: true,
        badge: { icon: '💳', text: 'Sẵn sàng thanh toán', color: 'bg-blue-100 text-blue-800' },
        message: null
    };
};

// --------------------
// Type definitions
// --------------------
type EditableOrderInfo = {
    customerName: string;
    phoneNumber: string;
};

type ValidationErrors = {
    customerName: string;
    phoneNumber: string;
};

type SessionWithToken = {
    accessToken?: string;
};

// Function validate thông tin khách hàng với regex chính xác
const validateCustomerInfoWithPhoneRegex = (
    editableOrder: EditableOrderInfo,
    orderItems: unknown[],
    setValidationErrors: (errors: ValidationErrors) => void
): boolean => {
    const errors = {
        customerName: '',
        phoneNumber: '',
    };

    let isValid = true;

    // Kiểm tra có sản phẩm trong đơn hàng không
    if (orderItems.length === 0) {
        console.warn('⚠️ Cannot validate customer info: No order items');
        return false;
    }

    // Validate tên khách hàng
    if (!editableOrder.customerName.trim()) {
        errors.customerName = 'Vui lòng nhập tên khách hàng';
        isValid = false;
    } else if (editableOrder.customerName.trim().length < 2) {
        errors.customerName = 'Tên khách hàng phải có ít nhất 2 ký tự';
        isValid = false;
    } else if (editableOrder.customerName.trim().length > 100) {
        errors.customerName = 'Tên khách hàng không được quá 100 ký tự';
        isValid = false;
    }

    // Validate số điện thoại với regex chính xác
    if (!editableOrder.phoneNumber.trim()) {
        errors.phoneNumber = 'Vui lòng nhập số điện thoại';
        isValid = false;
    } else {
        const phone = formatPhoneNumber(editableOrder.phoneNumber);
        if (!PHONE_REGEX.test(phone)) {
            errors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam (VD: 0987654321 hoặc +84987654321)';
            isValid = false;
        }
    }

    setValidationErrors(errors);
    return isValid;
};

export default function EditFromOrder() {
    const {data: session} = useSession();
    const {isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange} = useDisclosure();

    // Modal thanh toán tiền mặt states
    const {
        isOpen: isCashPaymentOpen,
        onOpen: onCashPaymentOpen,
        onOpenChange: onCashPaymentOpenChange
    } = useDisclosure();
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
        calculateOrderTotals,
        forceUpdateCurrentOrder,
    } = useOrderStore();

    // Initialize data when currentOrder changes
    useEffect(() => {
        if (currentOrder && (session as SessionWithToken | null)?.accessToken) {
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
        if (forceRefresh > 0 && currentOrder && (session as SessionWithToken | null)?.accessToken) {
            console.log('🔄 Force refresh triggered:', forceRefresh);
            // Small delay to ensure backend has processed the payment
            setTimeout(async () => {
                await fetchOrderItems(session);
                // Also refresh the current order detail
                const {refreshCurrentOrder} = useOrderStore.getState();
                await refreshCurrentOrder(session);
            }, 500);
        }
    }, [forceRefresh, currentOrder, session, fetchOrderItems]);

    // Handlers using store functions
    const handleUpdateOrder = async () => {
        if (!currentOrder || !(session as SessionWithToken | null)?.accessToken) return;

        try {
            // QUAN TRỌNG: Khi chỉ cập nhật thông tin khách hàng (tên, số điện thoại, giảm giá)
            // thì KHÔNG gửi payments để tránh backend tự động thay đổi trạng thái đơn hàng
            // Trạng thái đơn hàng chỉ nên thay đổi khi có thanh toán thực tế xảy ra
            const requestBody = {
                orderId: currentOrder.orderId,
                customerName: editableOrder.customerName,
                phoneNumber: editableOrder.phoneNumber,
                discountAmount: editableOrder.discountAmount,
                // CHỈ gửi payments khi thực sự cần thiết, không gửi array rỗng
                // payments: [], // REMOVED: không gửi payments rỗng
            };

            await updateOrder(requestBody, session);

        } catch {
            // Error đã được handle trong store
        }
    };

    const handleCashPaymentOpen = async () => {
        setValidationErrors({customerName: '', phoneNumber: ''});

        // Kiểm tra có sản phẩm trong đơn hàng không
        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with cash payment: No order items');
            return;
        }

        // Sử dụng validation mới với regex chính xác
        if (!validateCustomerInfoWithPhoneRegex(editableOrder, orderItems, setValidationErrors)) {
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

    const handleConfirmCashPayment = useCallback(async () => {
        if (!currentOrder || !(session as SessionWithToken | null)?.accessToken) return;

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

        } catch (error: unknown) {
            console.error('❌ Cash payment failed:', error);
            setTimeout(() => {
                onCashPaymentOpenChange();
            }, 3000);
        } finally {
            setIsCashPaymentProcessing(false);
        }
    }, [currentOrder, session, cashPayment, setForceRefresh, forceUpdateCurrentOrder, onCashPaymentOpenChange]);

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
    }, [isCashPaymentOpen, cashPaymentCountdown, handleConfirmCashPayment]);

    const handlePaymentOpen = async () => {
        setValidationErrors({customerName: '', phoneNumber: ''});

        // Kiểm tra có sản phẩm trong đơn hàng không
        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with VNPay payment: No order items');
            return;
        }

        // Sử dụng validation mới với regex chính xác
        if (!validateCustomerInfoWithPhoneRegex(editableOrder, orderItems, setValidationErrors)) {
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

        // Clear validation error khi người dùng bắt đầu nhập
        if (validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors({
                ...validationErrors,
                [field]: ''
            });
        }

        // Real-time validation cho số điện thoại
        if (field === 'phoneNumber' && typeof value === 'string') {
            const phone = formatPhoneNumber(value);
            if (phone && !PHONE_REGEX.test(phone)) {
                setValidationErrors({
                    ...validationErrors,
                    phoneNumber: 'Số điện thoại không đúng định dạng Việt Nam (VD: 0987654321 hoặc +84987654321)'
                });
            } else if (phone && PHONE_REGEX.test(phone)) {
                // Clear error nếu số điện thoại hợp lệ
                setValidationErrors({
                    ...validationErrors,
                    phoneNumber: ''
                });
            }
        }

        // Real-time validation cho tên khách hàng
        if (field === 'customerName' && typeof value === 'string') {
            const name = value.trim();
            if (name && name.length < 2) {
                setValidationErrors({
                    ...validationErrors,
                    customerName: 'Tên khách hàng phải có ít nhất 2 ký tự'
                });
            } else if (name && name.length > 100) {
                setValidationErrors({
                    ...validationErrors,
                    customerName: 'Tên khách hàng không được quá 100 ký tự'
                });
            } else if (name && name.length >= 2 && name.length <= 100) {
                // Clear error nếu tên hợp lệ
                setValidationErrors({
                    ...validationErrors,
                    customerName: ''
                });
            }
        }
    };

    if (!currentOrder) {
        return (
            <div className="flex w-full flex-col gap-4 p-4">
                <div className="text-center py-20">
                    <Spinner label="Đang tải thông tin đơn hàng..."/>
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
                                        const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);
                                        
                                        return (
                                            <>
                                                {/* Badge trạng thái */}
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${orderStatus.badge.color}`}>
                                                    <span>{orderStatus.badge.icon}</span>
                                                    <span>{orderStatus.badge.text}</span>
                                                </div>
                                                
                                                {/* Nút thanh toán */}
                                                {orderStatus.canPayment && (
                                                    <>
                                                        <Button
                                                            color="warning"
                                                            size="sm"
                                                            onPress={handleCashPaymentOpen}
                                                            title="Thanh toán bằng tiền mặt"
                                                        >
                                                            💰 Tiền mặt
                                                        </Button>
                                                        <Button
                                                            color="success"
                                                            size="sm"
                                                            onPress={handlePaymentOpen}
                                                            title="Thanh toán qua VNPay"
                                                        >
                                                            Thanh toán VN Pay
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {/* Nút khác */}
                                                {orderStatus.type === 'PAID' && orderItems.length > 0 ? (
                                                    <InvoicePrint
                                                        order={currentOrder}
                                                        orderItems={orderItems}
                                                        totals={calculateOrderTotals()}
                                                    />
                                                ) : orderStatus.canEdit && (
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        onPress={handleUpdateOrder}
                                                        disabled={isUpdatingOrder}
                                                        title="Lưu thông tin đơn hàng"
                                                    >
                                                        {isUpdatingOrder ? <Spinner color="white" size="sm"/> : "Lưu thay đổi"}
                                                    </Button>
                                                )}
                                            </>
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
                                                    placeholder="VD: Nguyễn Văn A"
                                                    value={editableOrder.customerName}
                                                    onChange={(e) => handleEditableOrderChange('customerName', e.target.value)}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.customerName}
                                                    errorMessage={validationErrors.customerName}
                                                    disabled={isPaidStatus}
                                                    startContent={<span className="text-gray-400 text-sm">👤</span>}
                                                    description="Nhập tên khách hàng (2-100 ký tự)"
                                                    color={validationErrors.customerName ? "danger" : "default"}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Số điện thoại"
                                                    placeholder="VD: 0987654321 hoặc +84987654321"
                                                    value={editableOrder.phoneNumber}
                                                    onChange={(e) => handleEditableOrderChange('phoneNumber', e.target.value)}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.phoneNumber}
                                                    errorMessage={validationErrors.phoneNumber}
                                                    disabled={isPaidStatus}
                                                    startContent={<span className="text-gray-400 text-sm">📱</span>}
                                                    description="Nhập số điện thoại Việt Nam (VD: 0987654321)"
                                                    color={validationErrors.phoneNumber ? "danger" : "default"}
                                                />
                                            </div>
                                            {/*<Input*/}
                                            {/*    label="Giảm giá"*/}
                                            {/*    type="number"*/}
                                            {/*    value={String(editableOrder.discountAmount)}*/}
                                            {/*    onChange={(e) => handleEditableOrderChange('discountAmount', Number(e.target.value) || 0)}*/}
                                            {/*    fullWidth*/}
                                            {/*    startContent={<span className="text-gray-400 text-sm">VND</span>}*/}
                                            {/*    disabled={isPaidStatus}*/}
                                            {/*/>*/}
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
                                                <p><strong>Tạm
                                                    tính:</strong> {totals.subTotalAmount.toLocaleString('vi-VN')} VND
                                                </p>
                                                <p><strong>Thành
                                                    tiền:</strong> {totals.finalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Trạng
                                                    thái:</strong> {getStatusDisplay(totals.calculatedStatus)}</p>
                                            </>
                                        );
                                    })()}

                                    {/* Thông báo trạng thái và hướng dẫn */}
                                    {(() => {
                                        const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);
                                        
                                        if (orderStatus.message) {
                                            const bgColor = orderStatus.message.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 
                                                           orderStatus.message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : 
                                                           'bg-gray-50 border-gray-200 text-gray-800';
                                            
                                            return (
                                                <div className={`mt-3 p-3 border rounded-lg ${bgColor}`}>
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg">{orderStatus.badge.icon}</span>
                                                        <div>
                                                            <p className="font-medium text-sm">{orderStatus.message.title}</p>
                                                            <p className="text-xs mt-1">{orderStatus.message.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        // Hiển thị thông báo sẵn sàng thanh toán
                                        if (orderStatus.type === 'READY_TO_PAY') {
                                            return (
                                                <div className="mt-3 p-3 border border-green-200 rounded-lg bg-green-50 text-green-800">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-lg">✅</span>
                                                        <div>
                                                            <p className="font-medium text-sm">Sẵn sàng thanh toán</p>
                                                            <p className="text-xs mt-1">Đơn hàng đã đầy đủ thông tin. Bạn có thể tiến hành thanh toán.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        return null;
                                    })()}

                                    {/* Hiển thị thông tin thanh toán */}
                                    {currentOrder.payments && currentOrder.payments.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="font-bold mb-2">Thông tin thanh toán:</p>
                                            {currentOrder.payments.map((payment, index) => (
                                                <div key={payment.paymentId || index}
                                                     className="text-sm mb-2 p-2 bg-gray-50 rounded">
                                                    <p><strong>Phương thức:</strong> {payment.paymentMethod}</p>
                                                    <p><strong>Số
                                                        tiền:</strong> {payment.amount.toLocaleString('vi-VN')} VND</p>
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
                            <div className="flex justify-between items-center w-full">
                                <h3 className="text-lg font-bold">Sản phẩm trong đơn</h3>
                                {(() => {
                                    const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);
                                    
                                    if (orderStatus.type === 'PAID') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                <span>✅</span>
                                                <span className="font-medium">Đã thanh toán - Chỉ xem</span>
                                            </div>
                                        );
                                    }
                                    
                                    if (orderStatus.type === 'NO_PRODUCTS') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                                <span>📦</span>
                                                <span className="font-medium">Trống</span>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            <span>📝</span>
                                            <span className="font-medium">Có thể chỉnh sửa</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </CardHeader>
                        <CardBody>
                            {(itemsError || storeError) && (
                                <div className="text-red-500 p-2 mb-2 bg-red-50 rounded" role="alert">
                                    {itemsError || storeError}
                                    {storeError && (
                                        <Button size="sm" variant="light" color="danger" className="ml-2"
                                                onPress={resetError}>
                                            Đóng
                                        </Button>
                                    )}
                                </div>
                            )}
                            <div className="overflow-y-auto">
                                {itemsLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spinner label="Đang tải..."/>
                                    </div>
                                ) : orderItems.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <div className="max-w-md mx-auto space-y-4">
                                            <div className="flex justify-center">
                                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">📦</span>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-700">Đơn hàng chưa có sản phẩm</h4>
                                            <p className="text-sm text-gray-500">
                                                Vui lòng thêm ít nhất một sản phẩm vào đơn hàng để có thể tiếp tục xử lý.
                                            </p>
                                            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                                                💡 Sử dụng khung bên phải để tìm kiếm và thêm sản phẩm
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    (() => {
                                        const totals = calculateOrderTotals();
                                        const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';
                                        
                                        // Render Table cho trạng thái đã thanh toán (chỉ đọc)
                                        if (isPaidStatus) {
                                            return (
                                                <Table removeWrapper aria-label="Sản phẩm trong đơn hàng">
                                                    <TableHeader>
                                                        <TableColumn>SẢN PHẨM</TableColumn>
                                                        <TableColumn>SỐ LƯỢNG</TableColumn>
                                                        <TableColumn className="text-right">ĐƠN GIÁ</TableColumn>
                                                        <TableColumn className="text-right">THÀNH TIỀN</TableColumn>
                                                    </TableHeader>
                                                    <TableBody items={orderItems}>
                                                        {(item) => (
                                                            <TableRow key={item.orderItemId}>
                                                                <TableCell>
                                                                    <div>{item.productName ?? 'Tên sản phẩm không xác định'}</div>
                                                                    <div className="text-xs text-gray-500">{item.variantInfo}</div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="px-4">{item.quantity}</span>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {item.bestPromo ? (
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="font-semibold text-red-600">{item.priceAtPurchase.toLocaleString('vi-VN')} VND</span>
                                                                            <span className="text-xs line-through text-gray-400">{item.originalPrice?.toLocaleString('vi-VN')}</span>
                                                                            <span className="text-[10px] text-orange-600">KM: {item.bestPromo.promotionCode}</span>
                                                                        </div>
                                                                    ) : (
                                                                        item.priceAtPurchase.toLocaleString('vi-VN') + ' VND'
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">{item.totalPrice.toLocaleString('vi-VN')} VND</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            );
                                        }
                                        
                                        // Render Table cho trạng thái có thể chỉnh sửa
                                        return (
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
                                                                <div>{item.productName ?? 'Tên sản phẩm không xác định'}</div>
                                                                <div className="text-xs text-gray-500">{item.variantInfo}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="flat"
                                                                        onPress={() => updateOrderItemQuantity(item.orderItemId, item.quantity - 1, session)}
                                                                    >-</Button>
                                                                    <Input
                                                                        type="number"
                                                                        value={String(item.quantity)}
                                                                        onBlur={(e) => {
                                                                            const newQuantity = parseInt(e.target.value, 10);
                                                                            if (!isNaN(newQuantity)) {
                                                                                updateOrderItemQuantity(item.orderItemId, newQuantity, session);
                                                                            }
                                                                        }}
                                                                        className="w-16 text-center"
                                                                    />
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="flat"
                                                                        onPress={() => updateOrderItemQuantity(item.orderItemId, item.quantity + 1, session)}
                                                                    >+</Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                    {item.bestPromo ? (
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="font-semibold text-red-600">{item.priceAtPurchase.toLocaleString('vi-VN')} VND</span>
                                                                            <span className="text-xs line-through text-gray-400">{item.originalPrice?.toLocaleString('vi-VN')}</span>
                                                                            <span className="text-[10px] text-orange-600">KM: {item.bestPromo.promotionCode}</span>
                                                                        </div>
                                                                    ) : (
                                                                        item.priceAtPurchase.toLocaleString('vi-VN') + ' VND'
                                                                    )}
                                                                </TableCell>
                                                            <TableCell className="text-right">{item.totalPrice.toLocaleString('vi-VN')} VND</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    onPress={() => deleteOrderItem(item.orderItemId, session)}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        );
                                    })()
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Pane: Product List */}
                <Card className="flex flex-col gap-4 h-full">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-bold">Thêm sản phẩm vào đơn</h3>
                            {(() => {
                                const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);
                                
                                if (orderStatus.type === 'PAID') {
                                    return (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                            <span>🔒</span>
                                            <span className="font-medium">Đã khóa</span>
                                        </div>
                                    );
                                }
                                
                                if (orderStatus.type === 'NO_PRODUCTS') {
                                    return (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                            <span>➕</span>
                                            <span className="font-medium">Hãy thêm sản phẩm</span>
                                        </div>
                                    );
                                }
                                
                                if (orderStatus.type === 'INVALID_CUSTOMER_INFO') {
                                    return (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                            <span>⚠️</span>
                                            <span className="font-medium">Cần thông tin KH</span>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        <span>✅</span>
                                        <span className="font-medium">Sẵn sàng</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col gap-4 h-full">
                            {(() => {
                                const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);
                                
                                let placeholder = "Nhập tên sản phẩm...";
                                let isDisabled = false;
                                
                                if (orderStatus.type === 'PAID') {
                                    placeholder = "Không thể tìm kiếm - Đơn hàng đã thanh toán";
                                    isDisabled = true;
                                } else if (orderStatus.type === 'INVALID_CUSTOMER_INFO') {
                                    placeholder = "Vui lòng nhập thông tin khách hàng trước";
                                    isDisabled = false; // Vẫn cho phép tìm kiếm để thêm sản phẩm
                                }
                                
                                return (
                                    <Input
                                        label="Tìm kiếm sản phẩm"
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-full"
                                        disabled={isDisabled}
                                        placeholder={placeholder}
                                        startContent={<span className="text-gray-400">🔍</span>}
                                    />
                                );
                            })()}
                            {productsError && <div className="text-red-500 p-2">{productsError}</div>}
                            <div className="flex-grow overflow-y-auto pr-2 border rounded-lg p-2">
                                {productsLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spinner label="Đang tải sản phẩm..."/>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(() => {
                                            const orderStatus = getOrderStatus(editableOrder, orderItems, calculateOrderTotals);

                                            if (orderStatus.type === 'PAID') {
                                                return (
                                                    <div className="text-center py-10 text-gray-500">
                                                        <div className="max-w-md mx-auto space-y-4">
                                                            <div className="flex justify-center">
                                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-2xl">✅</span>
                                                                </div>
                                                            </div>
                                                            <h4 className="text-lg font-semibold text-gray-700">Đơn hàng đã hoàn tất thanh toán</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Đơn hàng này đã được thanh toán thành công. Bạn không thể thêm sản phẩm mới hoặc chỉnh sửa đơn hàng.
                                                            </p>
                                                            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                                                                💡 Để thêm sản phẩm, vui lòng tạo đơn hàng mới
                                                            </div>
                                                        </div>
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
                                                        style={{width: `${((5 - cashPaymentCountdown) / 5) * 100}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            {isCashPaymentProcessing ? (
                                                <>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Spinner size="md" color="success"/>
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