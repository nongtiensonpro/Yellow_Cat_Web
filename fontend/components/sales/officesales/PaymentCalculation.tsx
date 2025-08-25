"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Card, CardHeader, CardBody, CardFooter, Button, Spinner,
    Input, useDisclosure
} from "@heroui/react";
import PaymentModal from './PaymentModal';
import { useOrderStore } from './orderStore';
import InvoicePrint from './InvoicePrint';

// Regex để validate số điện thoại Việt Nam
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

// Helper function để format số điện thoại
const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/[\s\-\(\)\.]/g, '').trim();
};

const statusMap: { [key: string]: string } = {
    'PENDING': 'Chờ xử lý',
    'PROCESSING': 'Đang xử lý',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'PAID': 'Đã thanh toán',
    'Paid': 'Đã thanh toán',
    'Pending': 'Chờ thanh toán',
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
};

// Helper function để hiển thị trạng thái an toàn
const getStatusDisplay = (status: string): string => {
    if (!status) return 'Không xác định';
    if (statusMap[status]) return statusMap[status];
    if (statusMap[status.toUpperCase()]) return statusMap[status.toUpperCase()];
    if (statusMap[status.toLowerCase()]) return statusMap[status.toLowerCase()];
    const capitalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (statusMap[capitalized]) return statusMap[capitalized];
    return status;
};

// Định nghĩa interface cho editable order
interface EditableOrder {
    customerName: string;
    phoneNumber: string;
    discountAmount: number;
}

// Định nghĩa interface cho order item (phù hợp với store)
interface OrderItem {
    orderItemId: number;
    orderId: number;
    productVariantId: number;
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
    productName?: string;
    variantInfo?: string;
}

// Helper function để kiểm tra trạng thái thanh toán
const getPaymentStatus = (
    editableOrder: EditableOrder, 
    orderItems: OrderItem[], 
    calculateOrderTotals: () => { calculatedStatus: string; finalAmount: number; subTotalAmount: number }
) => {
    const totals = calculateOrderTotals();
    const isPaidStatus = totals.calculatedStatus.toUpperCase() === 'PAID';

    // Đã thanh toán
    if (isPaidStatus) {
        return {
            type: 'PAID',
            canEdit: false,
            canPayment: false,
            badge: { icon: '✅', text: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
            message: {
                title: 'Thanh toán hoàn tất',
                description: 'Đơn hàng đã được thanh toán thành công.',
                type: 'success'
            }
        };
    }

    // Chưa có sản phẩm
    if (orderItems.length === 0) {
        return {
            type: 'NO_PRODUCTS',
            canEdit: true,
            canPayment: false,
            badge: { icon: '📦', text: 'Chưa có sản phẩm', color: 'bg-orange-100 text-orange-800' },
            message: {
                title: 'Cần thêm sản phẩm',
                description: 'Vui lòng quay lại màn hình trước để thêm sản phẩm vào đơn hàng.',
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
            canPayment: false,
            badge: { icon: '👤', text: 'Cần thông tin KH', color: 'bg-yellow-100 text-yellow-800' },
            message: {
                title: 'Thiếu thông tin khách hàng',
                description: 'Vui lòng nhập đầy đủ tên và số điện thoại hợp lệ của khách hàng.',
                type: 'info'
            }
        };
    }

    // Sẵn sàng thanh toán
    return {
        type: 'READY_TO_PAY',
        canEdit: true,
        canPayment: true,
        badge: { icon: '💳', text: 'Sẵn sàng thanh toán', color: 'bg-blue-100 text-blue-800' },
        message: null
    };
};

// Validation function
const validateCustomerInfoWithPhoneRegex = (
    editableOrder: EditableOrder,
    orderItems: OrderItem[],
    setValidationErrors: (errors: { customerName: string; phoneNumber: string }) => void
): boolean => {
    const errors = {
        customerName: '',
        phoneNumber: '',
    };

    let isValid = true;

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

    // Validate số điện thoại
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

export default function PaymentCalculation() {
    const { data: session } = useSession();
    const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange } = useDisclosure();

    // Modal thanh toán tiền mặt states
    const {
        isOpen: isCashPaymentOpen,
        onOpen: onCashPaymentOpen,
        onOpenChange: onCashPaymentOpenChange
    } = useDisclosure();
    const [isCashPaymentProcessing, setIsCashPaymentProcessing] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(0);

    // Cash payment calculation states
    const [cashReceived, setCashReceived] = useState<string>('');
    const [showChangeCalculation, setShowChangeCalculation] = useState(false);

    // Helper functions for cash payment
    const formatCurrency = (amount: number): string => {
        return amount.toLocaleString('vi-VN');
    };

    const calculateChange = (): number => {
        const received = parseFloat(cashReceived) || 0;
        const total = calculateOrderTotals().finalAmount;
        return Math.max(0, received - total);
    };

    const isValidCashAmount = (): boolean => {
        const received = parseFloat(cashReceived) || 0;
        const total = calculateOrderTotals().finalAmount;
        return received >= total;
    };

    const getQuickAmounts = (): number[] => {
        const total = calculateOrderTotals().finalAmount;
        const roundedAmounts = [
            Math.ceil(total / 1000) * 1000, // Round up to nearest 1000
            Math.ceil(total / 5000) * 5000, // Round up to nearest 5000
            Math.ceil(total / 10000) * 10000, // Round up to nearest 10000
            Math.ceil(total / 20000) * 20000, // Round up to nearest 20000
            Math.ceil(total / 50000) * 50000, // Round up to nearest 50000
        ];

        // Remove duplicates and amounts equal to total
        return Array.from(new Set(roundedAmounts)).filter(amount => amount > total).slice(0, 4);
    };

    // Zustand store
    const {
        // States
        currentOrder,
        orderItems,
        editableOrder,
        validationErrors,
        isUpdatingOrder,
        error: storeError,

        // Actions
        setEditableOrder,
        setValidationErrors,
        resetError,
        closeEditOrder,

        // API Actions
        fetchOrderItems,
        updateOrder,
        cashPayment,

        // Utils
        calculateOrderTotals,
        forceUpdateCurrentOrder,
    } = useOrderStore();

    // Effect to refresh data when forceRefresh changes
    useEffect(() => {
        if (forceRefresh > 0 && currentOrder && session?.accessToken) {
            console.log('🔄 Force refresh triggered:', forceRefresh);
            setTimeout(async () => {
                await fetchOrderItems(session);
                const { refreshCurrentOrder } = useOrderStore.getState();
                await refreshCurrentOrder(session);
            }, 500);
        }
    }, [forceRefresh, currentOrder, session, fetchOrderItems]);

    // Navigation back to add products
    const handleBackToProducts = () => {
        const { setCurrentScreen } = useOrderStore.getState();
        setCurrentScreen('addProducts');
    };

    // Update order handler - wrapped in useCallback
    const handleUpdateOrder = useCallback(async () => {
        if (!currentOrder || !session?.accessToken) return;

        try {
            const requestBody = {
                orderId: currentOrder.orderId,
                customerName: editableOrder.customerName,
                phoneNumber: editableOrder.phoneNumber,
                discountAmount: editableOrder.discountAmount,
            };

            await updateOrder(requestBody, session);
        } catch {
            // Error handled in store
        }
    }, [currentOrder, session, editableOrder, updateOrder]);

    // Cash payment handlers - wrapped in useCallback
    const handleCashPaymentOpen = useCallback(async () => {
        setValidationErrors({ customerName: '', phoneNumber: '' });

        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with cash payment: No order items');
            return;
        }

        if (!validateCustomerInfoWithPhoneRegex(editableOrder, orderItems, setValidationErrors)) {
            return;
        }

        const totals = calculateOrderTotals();
        if (totals.calculatedStatus.toUpperCase() === 'PAID') {
            return;
        }

        await handleUpdateOrder();

        // Reset cash payment states
        setCashReceived('');
        setShowChangeCalculation(false);
        onCashPaymentOpen();
    }, [orderItems, editableOrder, calculateOrderTotals, handleUpdateOrder, setValidationErrors, onCashPaymentOpen, setCashReceived, setShowChangeCalculation]);

    const handleConfirmCashPayment = useCallback(async () => {
        if (!currentOrder || !session?.accessToken) return;

        setIsCashPaymentProcessing(true);

        try {
            await cashPayment(currentOrder.orderCode, session);

            console.log('💰 Cash payment successful, forcing UI refresh...');
            setForceRefresh(prev => prev + 1);
            forceUpdateCurrentOrder();

            setTimeout(() => {
                onCashPaymentOpenChange();
                setForceRefresh(prev => prev + 1);
                forceUpdateCurrentOrder();
                console.log('🔄 Payment modal closed, UI should reflect new status');

                // Auto-switch to invoice view after successful payment
                const { setCurrentScreen } = useOrderStore.getState();
                setCurrentScreen('invoice');
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

    // Auto-close modal after successful payment
    useEffect(() => {
        if (!isCashPaymentProcessing && showChangeCalculation && !isCashPaymentOpen) {
            // Reset states when modal closes
            setShowChangeCalculation(false);
            setCashReceived('');
        }
    }, [isCashPaymentOpen, isCashPaymentProcessing, showChangeCalculation]);

    // VNPay payment handler
    const handlePaymentOpen = async () => {
        setValidationErrors({ customerName: '', phoneNumber: '' });

        if (orderItems.length === 0) {
            console.warn('⚠️ Cannot proceed with VNPay payment: No order items');
            return;
        }

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

    // Handle editable order changes
    const handleEditableOrderChange = (field: string, value: string | number) => {
        setEditableOrder({
            ...editableOrder,
            [field]: value
        });

        // Clear validation error when user starts typing
        if (validationErrors[field as keyof typeof validationErrors]) {
            setValidationErrors({
                ...validationErrors,
                [field]: ''
            });
        }

        // Real-time validation for phone number
        if (field === 'phoneNumber' && typeof value === 'string') {
            const phone = formatPhoneNumber(value);
            if (phone && !PHONE_REGEX.test(phone)) {
                setValidationErrors({
                    ...validationErrors,
                    phoneNumber: 'Số điện thoại không đúng định dạng Việt Nam (VD: 0987654321 hoặc +84987654321)'
                });
            } else if (phone && PHONE_REGEX.test(phone)) {
                setValidationErrors({
                    ...validationErrors,
                    phoneNumber: ''
                });
            }
        }

        // Real-time validation for customer name
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
                setValidationErrors({
                    ...validationErrors,
                    customerName: ''
                });
            }
        }
    };

    // Keyboard shortcuts - moved before early return
    useEffect(() => {
        if (!currentOrder) return;

        const paymentStatus = getPaymentStatus(editableOrder, orderItems, calculateOrderTotals);
        
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'F1' && paymentStatus.canPayment && !isCashPaymentOpen) {
                event.preventDefault();
                handleCashPaymentOpen();
            }
            if (event.key === 'Escape' && isCashPaymentOpen && !isCashPaymentProcessing) {
                onCashPaymentOpenChange();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentOrder, editableOrder, orderItems, calculateOrderTotals, isCashPaymentOpen, isCashPaymentProcessing, handleCashPaymentOpen, onCashPaymentOpenChange]);

    // Early return if no current order
    if (!currentOrder) {
        return (
            <div className="flex w-full flex-col gap-4 p-4">
                <div className="text-center py-20">
                    <Spinner label="Đang tải thông tin đơn hàng..." />
                </div>
            </div>
        );
    }

    const paymentStatus = getPaymentStatus(editableOrder, orderItems, calculateOrderTotals);
    const totals = calculateOrderTotals();

    return (
        <div className="flex w-full flex-col gap-4 p-4 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        color="default"
                        variant="flat"
                        onPress={handleBackToProducts}
                        startContent="←"
                    >
                        Quay lại thêm sản phẩm
                    </Button>
                    <h1 className="text-2xl font-bold">Thanh toán - Đơn hàng: {currentOrder?.orderCode}</h1>
                </div>
                <div className="flex gap-2">
                    <Button
                        color="default"
                        variant="flat"
                        onPress={closeEditOrder}
                    >
                        Quay lại danh sách
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Customer Information */}
                <Card className="p-4">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-bold">Thông tin khách hàng</h3>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${paymentStatus.badge.color}`}>
                                <span>{paymentStatus.badge.icon}</span>
                                <span>{paymentStatus.badge.text}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {storeError && (
                            <div className="text-red-500 p-2 mb-2 bg-red-50 rounded" role="alert">
                                {storeError}
                                <Button size="sm" variant="light" color="danger" className="ml-2" onPress={resetError}>
                                    Đóng
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <Input
                                label="Tên khách hàng"
                                placeholder="VD: Nguyễn Văn A"
                                value={editableOrder.customerName}
                                onChange={(e) => handleEditableOrderChange('customerName', e.target.value)}
                                fullWidth
                                isInvalid={!!validationErrors.customerName}
                                errorMessage={validationErrors.customerName}
                                disabled={paymentStatus.type === 'PAID'}
                                startContent={<span className="text-gray-400 text-sm">👤</span>}
                                description="Nhập tên khách hàng (2-100 ký tự)"
                                color={validationErrors.customerName ? "danger" : "default"}
                            />

                            <Input
                                label="Số điện thoại"
                                placeholder="VD: 0987654321 hoặc +84987654321"
                                value={editableOrder.phoneNumber}
                                onChange={(e) => handleEditableOrderChange('phoneNumber', e.target.value)}
                                fullWidth
                                isInvalid={!!validationErrors.phoneNumber}
                                errorMessage={validationErrors.phoneNumber}
                                disabled={paymentStatus.type === 'PAID'}
                                startContent={<span className="text-gray-400 text-sm">📱</span>}
                                description="Nhập số điện thoại Việt Nam (VD: 0987654321)"
                                color={validationErrors.phoneNumber ? "danger" : "default"}
                            />

                            {paymentStatus.canEdit && (
                                <Button
                                    color="primary"
                                    onPress={handleUpdateOrder}
                                    disabled={isUpdatingOrder}
                                    className="mt-2"
                                >
                                    {isUpdatingOrder ? <Spinner color="white" size="sm" /> : "Lưu thông tin"}
                                </Button>
                            )}
                        </div>

                        {/* Status message */}
                        {paymentStatus.message && (
                            <div className={`mt-4 p-3 border rounded-lg ${paymentStatus.message.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                paymentStatus.message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                                    paymentStatus.message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                                        'bg-gray-50 border-gray-200 text-gray-800'
                                }`}>
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">{paymentStatus.badge.icon}</span>
                                    <div>
                                        <p className="font-medium text-sm">{paymentStatus.message.title}</p>
                                        <p className="text-xs mt-1">{paymentStatus.message.description}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Right Pane: Order Summary and Payment */}
                <Card className="p-4">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Tóm tắt đơn hàng</h3>
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                🏪 Bán tại quầy
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {/* Order summary */}
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                {/* Basic order info */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Số lượng sản phẩm:</span>
                                        <span className="font-medium">{orderItems.length} sản phẩm</span>
                                    </div>

                                    {(() => {
                                        // Tính toán chi tiết giảm giá
                                        const originalTotal = orderItems.reduce((sum, item) => {
                                            return sum + (item.originalPrice || item.priceAtPurchase) * item.quantity;
                                        }, 0);

                                        const productDiscountTotal = orderItems.reduce((sum, item) => {
                                            if (item.bestPromo && item.originalPrice) {
                                                return sum + (item.originalPrice - item.priceAtPurchase) * item.quantity;
                                            }
                                            return sum;
                                        }, 0);

                                        const orderDiscountAmount = totals.subTotalAmount - totals.finalAmount;
                                        const totalSavings = productDiscountTotal + orderDiscountAmount;

                                        return (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Tổng tiền gốc:</span>
                                                    <span className="font-medium">{originalTotal.toLocaleString('vi-VN')} VND</span>
                                                </div>

                                                {productDiscountTotal > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Giảm giá sản phẩm:</span>
                                                        <span className="font-medium">-{productDiscountTotal.toLocaleString('vi-VN')} VND</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between">
                                                    <span>Tạm tính:</span>
                                                    <span className="font-medium">{totals.subTotalAmount.toLocaleString('vi-VN')} VND</span>
                                                </div>

                                                {orderDiscountAmount > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Giảm giá đơn hàng:</span>
                                                        <span className="font-medium">-{orderDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                                    </div>
                                                )}

                                                {totalSavings > 0 && (
                                                    <div className="flex justify-between text-green-600 bg-green-50 px-2 py-1 rounded">
                                                        <span className="font-medium">💰 Tổng tiết kiệm:</span>
                                                        <span className="font-bold">{totalSavings.toLocaleString('vi-VN')} VND</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="flex justify-between text-lg font-bold bg-blue-50 px-3 py-2 rounded-lg">
                                    <span>💰 Khách cần trả tại quầy:</span>
                                    <span className="text-blue-600">{totals.finalAmount.toLocaleString('vi-VN')} VND</span>
                                </div>

                                <div className="text-sm text-gray-600">
                                    <span>Trạng thái: </span>
                                    <span className="font-medium">{getStatusDisplay(totals.calculatedStatus)}</span>
                                </div>
                            </div>

                            {/* Discount details */}
                            {(() => {
                                const itemsWithPromotions = orderItems.filter(item => item.bestPromo);
                                const orderDiscountAmount = totals.subTotalAmount - totals.finalAmount;

                                if (itemsWithPromotions.length > 0 || orderDiscountAmount > 0) {
                                    return (
                                        <div className="p-4 bg-orange-50 rounded-lg">
                                            <p className="font-bold mb-2 text-orange-800">🎁 Chi tiết khuyến mãi:</p>

                                            {/* Product-level promotions */}
                                            {itemsWithPromotions.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-orange-700 mb-1">Khuyến mãi sản phẩm:</p>
                                                    {itemsWithPromotions.map((item) => (
                                                        <div key={item.orderItemId} className="text-xs mb-1 p-2 bg-white rounded border-l-2 border-orange-300">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{item.productName}</p>
                                                                    <p className="text-gray-600">{item.variantInfo}</p>
                                                                    <p className="text-orange-600 font-medium">
                                                                        🏷️ {item.bestPromo?.promotionCode}: {item.bestPromo?.promotionName}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right ml-2">
                                                                    <p className="text-gray-500 line-through">
                                                                        {((item.originalPrice || item.priceAtPurchase) * item.quantity).toLocaleString('vi-VN')} VND
                                                                    </p>
                                                                    <p className="text-red-600 font-bold">
                                                                        -{(((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase) * item.quantity).toLocaleString('vi-VN')} VND
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Order-level discount */}
                                            {orderDiscountAmount > 0 && (
                                                <div className="text-sm p-2 bg-white rounded border-l-2 border-green-300">
                                                    <div className="flex justify-between">
                                                        <span className="text-green-700 font-medium">🎯 Giảm giá đơn hàng</span>
                                                        <span className="text-red-600 font-bold">-{orderDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Payment information */}
                            {currentOrder.payments && currentOrder.payments.length > 0 && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="font-bold mb-2">💳 Thông tin thanh toán:</p>
                                    {currentOrder.payments.map((payment, index) => (
                                        <div key={payment.paymentId || index} className="text-sm mb-2 p-2 bg-white rounded">
                                            <p><strong>Phương thức:</strong> {payment.paymentMethod}</p>
                                            <p><strong>Số tiền:</strong> {payment.amount.toLocaleString('vi-VN')} VND</p>
                                            <p><strong>Trạng thái:</strong>
                                                <span className={`ml-1 px-2 py-1 rounded text-xs ${payment.paymentStatus.toUpperCase() === 'SUCCESS' || payment.paymentStatus.toUpperCase() === 'COMPLETED'
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
                    </CardBody>
                    <CardFooter>
                        <div className="flex gap-2 w-full">
                            {paymentStatus.canPayment ? (
                                <div className="space-y-2">
                                    <Button
                                        color="success"
                                        size="lg"
                                        onPress={handleCashPaymentOpen}
                                        className="w-full font-bold"
                                        startContent="💰"
                                        endContent={<span className="text-xs opacity-70">F1</span>}
                                    >
                                        Thanh toán tiền mặt • {totals.finalAmount.toLocaleString('vi-VN')} VND
                                    </Button>
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        onPress={handlePaymentOpen}
                                        className="w-full"
                                        startContent="💳"
                                    >
                                        Thanh toán VNPay
                                    </Button>
                                </div>
                            ) : paymentStatus.type === 'PAID' && orderItems.length > 0 ? (
                                <InvoicePrint
                                    order={currentOrder}
                                    orderItems={orderItems}
                                    totals={calculateOrderTotals()}
                                />
                            ) : paymentStatus.type === 'NO_PRODUCTS' ? (
                                <Button
                                    color="primary"
                                    onPress={handleBackToProducts}
                                    className="w-full"
                                    startContent="📦"
                                >
                                    Thêm sản phẩm vào đơn hàng
                                </Button>
                            ) : (
                                <Button
                                    color="default"
                                    disabled
                                    className="w-full"
                                >
                                    Vui lòng hoàn thiện thông tin
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Enhanced Cash Payment Modal */}
            {isCashPaymentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <Card className="w-[500px] max-w-full mx-4">
                        <CardHeader>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <span>💰</span>
                                    <span className="font-bold">Thanh toán tiền mặt</span>
                                </div>
                                <span className="text-sm text-gray-500">#{currentOrder?.orderCode}</span>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {!showChangeCalculation ? (
                                <div className="space-y-4">
                                    {/* Order Total */}
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                        <p className="text-sm text-blue-600 mb-1">Tổng cần thanh toán</p>
                                        <p className="text-3xl font-bold text-blue-800">
                                            {formatCurrency(totals.finalAmount)} VND
                                        </p>
                                    </div>

                                    {/* Cash Input */}
                                    <div className="space-y-3">
                                        <Input
                                            label="Số tiền khách đưa"
                                            placeholder="Nhập số tiền..."
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            type="number"
                                            startContent={<span className="text-gray-400">💵</span>}
                                            endContent={<span className="text-gray-400 text-sm">VND</span>}
                                            size="lg"
                                            className="text-center"
                                        />

                                        {/* Quick Amount Buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="flat"
                                                color="primary"
                                                onPress={() => setCashReceived(totals.finalAmount.toString())}
                                                size="sm"
                                            >
                                                Vừa đủ
                                            </Button>
                                            {getQuickAmounts().map((amount) => (
                                                <Button
                                                    key={amount}
                                                    variant="flat"
                                                    color="default"
                                                    onPress={() => setCashReceived(amount.toString())}
                                                    size="sm"
                                                >
                                                    {formatCurrency(amount)}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Change Preview */}
                                        {cashReceived && parseFloat(cashReceived) > 0 && (
                                            <div className={`p-3 rounded-lg border ${isValidCashAmount()
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                                }`}>
                                                {isValidCashAmount() ? (
                                                    <div className="text-center">
                                                        <p className="text-sm text-green-600">Tiền thừa</p>
                                                        <p className="text-xl font-bold text-green-700">
                                                            {formatCurrency(calculateChange())} VND
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="text-sm text-red-600">Không đủ tiền</p>
                                                        <p className="text-lg font-bold text-red-700">
                                                            Thiếu: {formatCurrency(totals.finalAmount - (parseFloat(cashReceived) || 0))} VND
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {isCashPaymentProcessing ? (
                                        <div className="text-center space-y-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Spinner size="lg" color="success" />
                                                <span className="text-lg font-bold text-blue-800">Đang xử lý thanh toán...</span>
                                            </div>
                                            <p className="text-sm text-blue-600">
                                                Vui lòng chờ hệ thống cập nhật trạng thái đơn hàng
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-4xl mb-2">✅</div>
                                                <h3 className="text-xl font-bold text-green-800 mb-2">Thanh toán thành công!</h3>
                                                <p className="text-sm text-green-600">
                                                    Đơn hàng đã được cập nhật trạng thái thanh toán
                                                </p>
                                            </div>

                                            {/* Final Summary */}
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-blue-600">Tổng tiền</p>
                                                    <p className="font-bold text-blue-800">
                                                        {formatCurrency(totals.finalAmount)} VND
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-lg">
                                                    <p className="text-green-600">Tiền thừa</p>
                                                    <p className="font-bold text-green-800">
                                                        {formatCurrency(calculateChange())} VND
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardBody>
                        <CardFooter>
                            <div className="flex gap-2 w-full">
                                {!showChangeCalculation ? (
                                    <>
                                        <Button
                                            color="danger"
                                            variant="light"
                                            onPress={onCashPaymentOpenChange}
                                            className="flex-1"
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            color="success"
                                            onPress={() => setShowChangeCalculation(true)}
                                            disabled={!isValidCashAmount()}
                                            className="flex-1"
                                            startContent="💰"
                                        >
                                            Xác nhận thanh toán
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {!isCashPaymentProcessing && (
                                            <Button
                                                color="default"
                                                variant="light"
                                                onPress={() => setShowChangeCalculation(false)}
                                                className="flex-1"
                                            >
                                                ← Quay lại
                                            </Button>
                                        )}
                                        <Button
                                            color="primary"
                                            onPress={isCashPaymentProcessing ? undefined : handleConfirmCashPayment}
                                            disabled={isCashPaymentProcessing}
                                            className="flex-1"
                                        >
                                            {isCashPaymentProcessing ? (
                                                <>
                                                    <Spinner size="sm" color="white" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                'Hoàn tất'
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* VNPay Payment Modal */}
            {currentOrder && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onOpenChange={onPaymentOpenChange}
                    orderAmount={totals.finalAmount}
                    orderCode={currentOrder.orderCode}
                />
            )}
        </div>
    );
}