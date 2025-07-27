"use client"

import { useEffect} from "react";
import {useSession} from "next-auth/react";
import {
    Card, CardHeader, CardBody, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input
} from "@heroui/react";
import {OptimizedProductItem} from "./OptimizedProductItem";
import {useOrderStore} from './orderStore';

// Helper function để kiểm tra trạng thái đơn hàng cho việc thêm sản phẩm
const getAddProductStatus = (orderItems: unknown[]) => {
    // Chưa có sản phẩm
    if (orderItems.length === 0) {
        return {
            type: 'NO_PRODUCTS',
            canAddProducts: true,
            badge: { icon: '📦', text: 'Chưa có sản phẩm', color: 'bg-orange-100 text-orange-800' },
            message: {
                title: 'Đơn hàng trống',
                description: 'Vui lòng thêm ít nhất một sản phẩm vào đơn hàng để có thể tiếp tục.',
                type: 'warning'
            }
        };
    }
    
    // Có sản phẩm, có thể tiếp tục thêm
    return {
        type: 'HAS_PRODUCTS',
        canAddProducts: true,
        badge: { icon: '✅', text: `${orderItems.length} sản phẩm`, color: 'bg-green-100 text-green-800' },
        message: null
    };
};

export default function AddProductsToOrder() {
    const {data: session} = useSession();

    // Zustand store
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
        error: storeError,

        // Actions
        setSearchTerm,
        resetError,
        closeEditOrder,

        // API Actions
        fetchOrderItems,
        addVariantToOrder,
        updateOrderItemQuantity,
        deleteOrderItem,
        initializeProductData,

        // Utils
        calculateOrderTotals,
    } = useOrderStore();

    // Initialize data when currentOrder changes
    useEffect(() => {
        if (currentOrder && session?.accessToken) {
            initializeProductData();
            fetchOrderItems(session);
        }
    }, [currentOrder, session, initializeProductData, fetchOrderItems]);

    // Navigation to payment screen
    const handleProceedToPayment = () => {
        const {setCurrentScreen} = useOrderStore.getState();
        setCurrentScreen('payment');
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

    const productStatus = getAddProductStatus(orderItems);

    return (
        <div className="flex w-full flex-col gap-4 p-4 min-h-screen">
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
                    <h1 className="text-2xl font-bold">Thêm sản phẩm - Đơn hàng: {currentOrder?.orderCode}</h1>
                </div>
                <div className="flex gap-2">
                    {productStatus.badge && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${productStatus.badge.color}`}>
                            <span>{productStatus.badge.icon}</span>
                            <span>{productStatus.badge.text}</span>
                        </div>
                    )}
                    {orderItems.length > 0 && (
                        <Button
                            color="primary"
                            onPress={handleProceedToPayment}
                            startContent="💳"
                        >
                            Tiếp tục thanh toán
                        </Button>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Pane: Current Order Items */}
                <Card className="flex-grow">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-bold">Sản phẩm trong đơn</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                {(() => {
                                    const totals = calculateOrderTotals();
                                    const originalTotal = orderItems.reduce((sum, item) => {
                                        return sum + (item.originalPrice || item.priceAtPurchase) * item.quantity;
                                    }, 0);
                                    const totalDiscount = originalTotal - totals.subTotalAmount;
                                    
                                    return (
                                        <div className="text-right">
                                            {totalDiscount > 0 && (
                                                <div className="text-xs text-red-600">
                                                    Tiết kiệm: {totalDiscount.toLocaleString('vi-VN')} VND
                                                </div>
                                            )}
                                            <div>
                                                Tổng: {totals.subTotalAmount.toLocaleString('vi-VN')} VND
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
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
                                                            <span className="text-xs line-through text-gray-400">{item.originalPrice?.toLocaleString('vi-VN')} VND</span>
                                                            <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded">
                                                                🏷️ {item.bestPromo.promotionCode}
                                                            </span>
                                                            <span className="text-[10px] text-green-600 font-medium">
                                                                Tiết kiệm: {((item.originalPrice || item.priceAtPurchase) - item.priceAtPurchase).toLocaleString('vi-VN')} VND
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium">{item.priceAtPurchase.toLocaleString('vi-VN')} VND</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-semibold">{item.totalPrice.toLocaleString('vi-VN')} VND</span>
                                                        {item.bestPromo && item.originalPrice && (
                                                            <span className="text-xs text-gray-500">
                                                                (Gốc: {(item.originalPrice * item.quantity).toLocaleString('vi-VN')} VND)
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
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
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Right Pane: Product Search and Add */}
                <Card className="flex flex-col gap-4 h-full">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full">
                            <h3 className="text-lg font-bold">Tìm kiếm sản phẩm</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                <span>🔍</span>
                                <span className="font-medium">Thêm sản phẩm</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col gap-4 h-full">
                            <Input
                                label="Tìm kiếm sản phẩm"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-full"
                                placeholder="Nhập tên sản phẩm..."
                                startContent={<span className="text-gray-400">🔍</span>}
                            />
                            
                            {productsError && <div className="text-red-500 p-2">{productsError}</div>}
                            
                            <div className="flex-grow overflow-y-auto pr-2 border rounded-lg p-2">
                                {productsLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Spinner label="Đang tải sản phẩm..."/>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map(p => (
                                                <OptimizedProductItem
                                                    key={p.productId}
                                                    product={p}
                                                    onLoadVariants={() => Promise.resolve()}
                                                    onAddToCart={(variant) => addVariantToOrder(variant, session)}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-gray-500">
                                                {searchTerm ? 'Không tìm thấy sản phẩm phù hợp.' : 'Nhập từ khóa để tìm kiếm sản phẩm.'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Order Summary */}
            {orderItems.length > 0 && (
                <Card>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(() => {
                                const totals = calculateOrderTotals();
                                const originalTotal = orderItems.reduce((sum, item) => {
                                    return sum + (item.originalPrice || item.priceAtPurchase) * item.quantity;
                                }, 0);
                                const totalSavings = originalTotal - totals.subTotalAmount;
                                const itemsWithPromotions = orderItems.filter(item => item.bestPromo);
                                
                                return (
                                    <>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-600 font-medium">Tổng tiền hàng</p>
                                            <p className="text-xl font-bold text-blue-800">{totals.subTotalAmount.toLocaleString('vi-VN')} VND</p>
                                        </div>
                                        
                                        {totalSavings > 0 && (
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-600 font-medium">Tiết kiệm được</p>
                                                <p className="text-xl font-bold text-green-800">{totalSavings.toLocaleString('vi-VN')} VND</p>
                                                <p className="text-xs text-green-600">Từ {itemsWithPromotions.length} sản phẩm KM</p>
                                            </div>
                                        )}
                                        
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600 font-medium">Tổng sản phẩm</p>
                                            <p className="text-xl font-bold text-gray-800">{orderItems.length} sản phẩm</p>
                                            <p className="text-xs text-gray-600">
                                                {orderItems.reduce((sum, item) => sum + item.quantity, 0)} món
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Status message */}
            {productStatus.message && (
                <Card>
                    <CardBody>
                        <div className={`p-3 border rounded-lg ${
                            productStatus.message.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 
                            productStatus.message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : 
                            'bg-gray-50 border-gray-200 text-gray-800'
                        }`}>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{productStatus.badge?.icon}</span>
                                <div>
                                    <p className="font-medium text-sm">{productStatus.message.title}</p>
                                    <p className="text-xs mt-1">{productStatus.message.description}</p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}