"use client"

import {useEffect} from "react";
import {useSession} from "next-auth/react";
import {
    Card, CardHeader, CardBody, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Divider
} from "@heroui/react";
import {useOrderStore} from './orderStore';
import InvoicePrint from './InvoicePrint';

const statusMap: { [key: string]: string } = {
    'PAID': 'Đã thanh toán',
    'Paid': 'Đã thanh toán',
    'paid': 'Đã thanh toán',
    'COMPLETED': 'Hoàn thành',
    'completed': 'Hoàn thành',
    'PENDING': 'Chờ xử lý',
    'Pending': 'Chờ xử lý',
    'pending': 'Chờ xử lý',
};

const getStatusDisplay = (status: string): string => {
    if (!status) return 'Không xác định';
    if (statusMap[status]) return statusMap[status];
    if (statusMap[status.toUpperCase()]) return statusMap[status.toUpperCase()];
    if (statusMap[status.toLowerCase()]) return statusMap[status.toLowerCase()];
    const capitalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (statusMap[capitalized]) return statusMap[capitalized];
    return status;
};

export default function InvoiceView() {
    const {data: session} = useSession();

    // Zustand store
    const {
        // States
        currentOrder,
        orderItems,
        itemsLoading,
        itemsError,
        error: storeError,

        // Actions
        closeEditOrder,

        // API Actions
        fetchOrderItems,

        // Utils
        calculateOrderTotals,
    } = useOrderStore();

    // Initialize data when currentOrder changes
    useEffect(() => {
        if (currentOrder && session?.accessToken) {
            fetchOrderItems(session);
        }
    }, [currentOrder, session, fetchOrderItems]);

    if (!currentOrder) {
        return (
            <div className="flex w-full flex-col gap-4 p-4">
                <div className="text-center py-20">
                    <Spinner label="Đang tải thông tin đơn hàng..."/>
                </div>
            </div>
        );
    }

    const totals = calculateOrderTotals();
    const currentDate = new Date().toLocaleString('vi-VN');

    // Calculate detailed pricing information
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
    const itemsWithPromotions = orderItems.filter(item => item.bestPromo);

    return (
        <div className="flex w-full flex-col gap-6 p-6 min-h-screen bg-gray-50">
            {/* Header */}
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
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📋 Chi tiết đơn hàng #{currentOrder.orderCode}</h1>
                        <p className="text-gray-600">Trạng thái: <span className="font-semibold text-green-600">{getStatusDisplay(totals.calculatedStatus)}</span> • {currentDate}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <InvoicePrint
                        order={currentOrder}
                        orderItems={orderItems}
                        totals={calculateOrderTotals()}
                    />
                </div>
            </div>

            {/* Order Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl">🛍️</span>
                        </div>
                        <p className="text-lg font-bold text-blue-700">{orderItems.length}</p>
                        <p className="text-xs text-blue-600">Loại sản phẩm</p>
                    </CardBody>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl">📦</span>
                        </div>
                        <p className="text-lg font-bold text-purple-700">
                            {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                        <p className="text-xs text-purple-600">Tổng số lượng</p>
                    </CardBody>
                </Card>

                <Card className="bg-green-50 border-green-200">
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl">✅</span>
                        </div>
                        <p className="text-sm font-bold text-green-700">{getStatusDisplay(totals.calculatedStatus)}</p>
                        <p className="text-xs text-green-600">Trạng thái</p>
                    </CardBody>
                </Card>

                {totalSavings > 0 && (
                    <Card className="bg-orange-50 border-orange-200">
                        <CardBody className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <span className="text-2xl">💰</span>
                            </div>
                            <p className="text-lg font-bold text-orange-700">
                                {totalSavings.toLocaleString('vi-VN')} VND
                            </p>
                            <p className="text-xs text-orange-600">Tổng tiết kiệm</p>
                        </CardBody>
                    </Card>
                )}

                <Card className="bg-gray-50 border-gray-200">
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-2xl">💳</span>
                        </div>
                        <p className="text-lg font-bold text-gray-700">
                            {totals.finalAmount.toLocaleString('vi-VN')} VND
                        </p>
                        <p className="text-xs text-gray-600">Đã thanh toán</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-bold">👤 Thông tin khách hàng</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Tên khách hàng</p>
                                    <p className="font-semibold">{currentOrder.customerName || 'Khách lẻ'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Số điện thoại</p>
                                    <p className="font-semibold">{currentOrder.phoneNumber || 'Không có'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Mã đơn hàng</p>
                                    <p className="font-semibold text-blue-600">{currentOrder.orderCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Trạng thái</p>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✅ {getStatusDisplay(totals.calculatedStatus)}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-bold">🛍️ Chi tiết sản phẩm</h3>
                        </CardHeader>
                        <CardBody>
                            {itemsLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <Spinner label="Đang tải..."/>
                                </div>
                            ) : itemsError || storeError ? (
                                <div className="text-red-500 p-4 text-center">
                                    {itemsError || storeError}
                                </div>
                            ) : (
                                <Table removeWrapper aria-label="Chi tiết sản phẩm">
                                    <TableHeader>
                                        <TableColumn>SẢN PHẨM</TableColumn>
                                        <TableColumn className="text-center">SL</TableColumn>
                                        <TableColumn className="text-right">ĐƠN GIÁ</TableColumn>
                                        <TableColumn className="text-right">THÀNH TIỀN</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {orderItems.map((item) => (
                                            <TableRow key={item.orderItemId}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.productName ?? 'Sản phẩm không xác định'}</p>
                                                        <p className="text-xs text-gray-500">{item.variantInfo}</p>
                                                        {item.bestPromo && (
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
                                                                    🏷️ {item.bestPromo.promotionCode}
                                                                </span>
                                                                <span className="text-xs text-green-600 font-medium">
                                                                    -{((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase).toLocaleString('vi-VN')} VND
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    ({item.bestPromo.promotionName})
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium">{item.quantity}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
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
                                                </TableCell>
                                                <TableCell className="text-right">
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
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardBody>
                    </Card>

                    {/* Detailed Discount Analysis */}
                    {(itemsWithPromotions.length > 0 || orderDiscountAmount > 0) && (
                        <Card className="border-orange-200">
                            <CardHeader>
                                <h3 className="text-lg font-bold text-orange-800">🎁 Phân tích khuyến mãi chi tiết</h3>
                            </CardHeader>
                            <CardBody>
                                {/* Product-level promotions */}
                                {itemsWithPromotions.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-3">
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
                                {orderDiscountAmount > 0 && (
                                    <div className="mb-4">
                                        <p className="font-semibold text-green-700 mb-3">Giảm giá cấp đơn hàng</p>
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-green-700">🎯 Giảm giá tổng đơn</p>
                                                    <p className="text-xs text-gray-600">Áp dụng sau khi tính khuyến mãi sản phẩm</p>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Tạm tính: {totals.subTotalAmount.toLocaleString('vi-VN')} VND → 
                                                        Sau giảm: {totals.finalAmount.toLocaleString('vi-VN')} VND
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">
                                                        -{orderDiscountAmount.toLocaleString('vi-VN')} VND
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
                                            {orderDiscountAmount > 0 && (
                                                <span>Đơn hàng: {orderDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Tỷ lệ tiết kiệm: {((totalSavings / originalTotal) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Right Column: Summary & Payment */}
                <div className="space-y-6">
                    {/* Detailed Financial Summary */}
                    <Card className="sticky top-4">
                        <CardHeader>
                            <h3 className="text-lg font-bold">💰 Tóm tắt tài chính</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {/* Quantity Summary */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Thống kê sản phẩm</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Loại SP:</span>
                                            <span className="font-medium">{orderItems.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tổng SL:</span>
                                            <span className="font-medium">
                                                {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>SP có KM:</span>
                                            <span className="font-medium text-orange-600">{itemsWithPromotions.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>SP thường:</span>
                                            <span className="font-medium">{orderItems.length - itemsWithPromotions.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <Divider />

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
                                        <span className="font-medium">{totals.subTotalAmount.toLocaleString('vi-VN')} VND</span>
                                    </div>

                                    {orderDiscountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Giảm giá đơn hàng:</span>
                                            <span className="font-medium">-{orderDiscountAmount.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                    )}
                                </div>

                                {totalSavings > 0 && (
                                    <>
                                        <Divider />
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-green-700">💰 Tổng tiết kiệm</span>
                                                <span className="font-bold text-green-700">{totalSavings.toLocaleString('vi-VN')} VND</span>
                                            </div>
                                            <div className="text-xs text-green-600 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Tỷ lệ giảm:</span>
                                                    <span>{((totalSavings / originalTotal) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tiết kiệm/SP:</span>
                                                    <span>{(totalSavings / orderItems.length).toLocaleString('vi-VN')} VND</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Divider />

                                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-blue-800">Thành tiền:</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {totals.finalAmount.toLocaleString('vi-VN')} VND
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 mt-1 text-center">
                                        Đã bao gồm tất cả khuyến mãi
                                    </div>
                                </div>

                                {/* Profit Analysis (if needed) */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Phân tích giao dịch</p>
                                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Giá trị gốc:</span>
                                            <span>{originalTotal.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Đã bán:</span>
                                            <span>{totals.finalAmount.toLocaleString('vi-VN')} VND</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tỷ lệ thực thu:</span>
                                            <span>{((totals.finalAmount / originalTotal) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Payment Information */}
                    {currentOrder.payments && currentOrder.payments.length > 0 && (
                        <Card className="border-blue-200">
                            <CardHeader>
                                <h3 className="text-lg font-bold text-blue-800">💳 Thông tin thanh toán</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-3">
                                    {currentOrder.payments.map((payment, index) => (
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
                            </CardBody>
                        </Card>
                    )}

                    {/* Transaction Details */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <h3 className="text-lg font-bold text-gray-800">📊 Chi tiết giao dịch</h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đơn hàng:</span>
                                    <span className="font-medium">{currentOrder.orderCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thời gian tạo:</span>
                                    <span className="font-medium">{currentDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Loại giao dịch:</span>
                                    <span className="font-medium text-blue-600">Bán tại quầy</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Trạng thái:</span>
                                    <span className="font-medium text-green-600">{getStatusDisplay(totals.calculatedStatus)}</span>
                                </div>
                                <Divider className="my-2" />
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
                                    <span className="text-blue-600">{totals.finalAmount.toLocaleString('vi-VN')} VND</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}