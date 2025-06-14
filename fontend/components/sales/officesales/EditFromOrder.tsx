"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input,
    useDisclosure
} from "@heroui/react";
import { OptimizedProductItem } from "./OptimizedProductItem";
import { ProductManagement, ProductVariant, ProductWithVariants } from "./ProductListSaleOffice";
import PaymentModal from './PaymentModal';

interface Payment {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paymentStatus: string;
    transactionId?: string;
}

interface Order {
    orderId: number;
    orderCode: string;
    phoneNumber: string;
    customerName: string;
    subTotalAmount: number;
    discountAmount: number;
    finalAmount: number;
    orderStatus: string;
    payments?: Payment[];
}

interface OrderItem {
    orderItemId: number;
    orderId: number;
    productVariantId: number;
    quantity: number;
    priceAtPurchase: number;
    totalPrice: number;
    productName?: string;
    variantInfo?: string;
}

// From ProductListSaleOffice.tsx
interface BaseEntity { id: number; name: string; description?: string; }
interface ColorInfo extends BaseEntity { }
interface SizeInfo extends BaseEntity { }
interface PaginatedResponse<T> { content: T[]; page: { size: number; number: number; totalElements: number; totalPages: number; }; }
interface ApiEntitiesResponse<T> { timestamp: string; status: number; message: string; data: PaginatedResponse<T>; }
interface ApiManagementResponse { timestamp: string; status: number; message: string; data: PaginatedResponse<ProductManagement>; }
interface ProductDetail {
    productId: number;
    productName: string;
    description: string;
    variants: ProductVariant[];
}
interface ApiDetailResponse { timestamp: string; status: number; message: string; data: ProductDetail; }

interface Props {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    order: Order | null;
    onOrderUpdate: () => void;
}

const statusMap: { [key: string]: string } = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
};

export default function EditFromOrder({ isOpen, onOpenChange, order, onOrderUpdate }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {isOpen: isPaymentOpen, onOpen: onPaymentOpen, onOpenChange: onPaymentOpenChange} = useDisclosure();
    
    // Thêm state cho modal thanh toán tiền mặt
    const {isOpen: isCashPaymentOpen, onOpen: onCashPaymentOpen, onOpenChange: onCashPaymentOpenChange} = useDisclosure();
    const [cashPaymentCountdown, setCashPaymentCountdown] = useState(5);
    const [isCashPaymentProcessing, setIsCashPaymentProcessing] = useState(false);

    // Thêm state để lưu order hiện tại trong modal
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

    // State for editable order fields
    const [editableOrder, setEditableOrder] = useState({
        customerName: '',
        phoneNumber: '',
        discountAmount: 0,
    });
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

    // Thêm state cho validation errors
    const [validationErrors, setValidationErrors] = useState({
        customerName: '',
        phoneNumber: '',
    });

    // States for order items
    const [orderItems, setOrderItems] = useState<Omit<OrderItem, 'productName' | 'variantInfo'>[]>([]);
    const [enrichedOrderItems, setEnrichedOrderItems] = useState<OrderItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [itemsError, setItemsError] = useState<string | null>(null);

    // States for product list
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [sizes, setSizes] = useState<SizeInfo[]>([]);

    // Effect để sync currentOrder với order prop từ parent
    useEffect(() => {
        if (order) {
            setCurrentOrder(order);
        }
    }, [order]);

    // Effect to sync editableOrder state with currentOrder
    useEffect(() => {
        if (currentOrder) {
            setEditableOrder({
                customerName: currentOrder.customerName || '',
                phoneNumber: currentOrder.phoneNumber || '',
                discountAmount: currentOrder.discountAmount || 0,
            });
        }
    }, [currentOrder]);

    // Thêm function để fetch lại order detail từ backend
    const fetchOrderDetail = useCallback(async (orderCode: string) => {
        if (!session?.accessToken) return;
        
        try {
            const response = await fetch(`http://localhost:8080/api/orders/status/${orderCode}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Lỗi ${response.status}: Không thể tải thông tin đơn hàng`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                // Cập nhật currentOrder với dữ liệu mới từ backend
                setCurrentOrder(result.data);
                console.log('📋 Order detail refreshed:', result.data);
            }
        } catch (error: any) {
            console.error('Error fetching order detail:', error);
            setItemsError(`Lỗi tải thông tin đơn hàng: ${error.message}`);
        }
    }, [session]);

    const fetchOrderItems = useCallback(async () => {
        if (!currentOrder || !session?.accessToken) return;
        setItemsLoading(true);
        setItemsError(null);
        try {
            const url = new URL(`http://localhost:8080/api/order-items`);
            url.searchParams.append('orderId', currentOrder.orderId.toString());
            url.searchParams.append('page', '0');
            url.searchParams.append('size', '100');

            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}: Không thể tải chi tiết đơn hàng.`);
            const responseData = await res.json();
            setOrderItems(responseData?.data?.content || []);
        } catch (err: any) {
            setItemsError(err.message);
        } finally {
            setItemsLoading(false);
        }
    }, [currentOrder, session]);

    const initializeProductData = useCallback(async () => {
        setProductsLoading(true);
        try {
            const [colorsRes, sizesRes, productsRes] = await Promise.all([
                fetch(`http://localhost:8080/api/colors?page=0&size=1000`).then(res => res.json()),
                fetch(`http://localhost:8080/api/sizes?page=0&size=1000`).then(res => res.json()),
                fetch(`http://localhost:8080/api/products/management`).then(res => res.json())
            ]);

            const fetchedColors: ColorInfo[] = colorsRes?.data?.content || [];
            const fetchedSizes: SizeInfo[] = sizesRes?.data?.content || [];
            const baseProducts: ProductManagement[] = productsRes?.data?.content || [];

            const variantPromises = baseProducts.map(p =>
                fetch(`http://localhost:8080/api/products/${p.productId}`).then(res => res.json())
            );
            const detailResponses: ApiDetailResponse[] = await Promise.all(variantPromises);

            const productsWithVariants = baseProducts.map(p => {
                const detail = detailResponses.find(dr => dr.data?.productId === p.productId)?.data;
                const variants = detail?.variants.map(variant => ({
                    ...variant,
                    colorName: fetchedColors.find(c => c.id === variant.colorId)?.name || 'N/A',
                    sizeName: fetchedSizes.find(s => s.id === variant.sizeId)?.name || 'N/A',
                })) || [];
                return { ...p, variants, variantsLoaded: true };
            });

            setProducts(productsWithVariants);
            setProductsError(null);
        } catch (err: any) {
            setProductsError(err.message || "Lỗi tải dữ liệu sản phẩm");
        } finally {
            setProductsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            initializeProductData();
        }
    }, [isOpen, initializeProductData]);

    useEffect(() => {
        if (isOpen && currentOrder) {
            fetchOrderItems();
        }
    }, [isOpen, currentOrder, fetchOrderItems]);

    useEffect(() => {
        if (orderItems.length === 0 || products.length === 0) {
            setEnrichedOrderItems([]);
            return;
        }

        const variantMap = new Map<number, { productName: string; variantInfo: string }>();
        products.forEach(p => {
            (p.variants || []).forEach(v => {
                variantMap.set(v.variantId, {
                    productName: p.productName,
                    variantInfo: `${v.colorName} - ${v.sizeName}`
                });
            });
        });

        const newEnrichedItems = orderItems.map(item => {
            const details = variantMap.get(item.productVariantId);
            return {
                ...item,
                productName: details?.productName || 'Không tìm thấy sản phẩm',
                variantInfo: details?.variantInfo || `ID Biến thể: ${item.productVariantId}`
            };
        });

        setEnrichedOrderItems(newEnrichedItems);
    }, [orderItems, products]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredProducts(products);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.productName.toLowerCase().includes(lowercasedFilter) ||
                p.categoryName.toLowerCase().includes(lowercasedFilter) ||
                p.brandName.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    // Thêm function để validate thông tin khách hàng
    const validateCustomerInfo = (): boolean => {
        const errors = {
            customerName: '',
            phoneNumber: '',
        };
        
        let isValid = true;
        
        if (!editableOrder.customerName.trim()) {
            errors.customerName = 'Vui lòng nhập tên khách hàng';
            isValid = false;
        }
        
        if (!editableOrder.phoneNumber.trim()) {
            errors.phoneNumber = 'Vui lòng nhập số điện thoại';
            isValid = false;
        } else if (!/^[0-9]{10,11}$/.test(editableOrder.phoneNumber.trim())) {
            errors.phoneNumber = 'Số điện thoại phải có 10-11 chữ số';
            isValid = false;
        }
        
        setValidationErrors(errors);
        return isValid;
    };

    // Thêm function để kiểm tra trạng thái thanh toán với currentOrder
    const isPaid = (): boolean => {
        if (!currentOrder) {
            return false;
        }
        
        // Kiểm tra orderStatus có phải là PAID hoặc COMPLETED không
        return currentOrder.orderStatus.toUpperCase() === 'PAID' || 
               currentOrder.orderStatus.toUpperCase() === 'COMPLETED';
    };

    // Cập nhật function handlePaymentOpen
    const handlePaymentOpen = async () => {
        // Clear validation errors trước
        setValidationErrors({ customerName: '', phoneNumber: '' });
        
        // Validate thông tin khách hàng
        if (!validateCustomerInfo()) {
            setItemsError('Vui lòng nhập đầy đủ thông tin khách hàng trước khi thanh toán');
            return;
        }

        // Kiểm tra trạng thái thanh toán
        if (isPaid()) {
            setItemsError('Đơn hàng này đã được thanh toán, không thể thanh toán lại');
            return;
        }

        // Cập nhật thông tin khách hàng trước khi thanh toán
        await handleUpdateOrder();
        
        // Mở modal thanh toán
        onPaymentOpen();
    };

    const handleUpdateOrder = async () => {
        if (!currentOrder || !session?.accessToken) return;
        setIsUpdatingOrder(true);
        setItemsError(null); // Clear other errors
        setValidationErrors({ customerName: '', phoneNumber: '' }); // Clear validation errors
        
        try {
            const requestBody = {
                orderId: currentOrder.orderId,
                customerName: editableOrder.customerName,
                phoneNumber: editableOrder.phoneNumber,
                discountAmount: editableOrder.discountAmount,
                payments: [], // payments is required in DTO, send empty array for now
            };
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(requestBody),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                throw new Error(errorData.message);
            }
            
            // Fetch lại order detail sau khi update
            await fetchOrderDetail(currentOrder.orderCode);
            onOrderUpdate(); // Refresh the main list
        } catch (err: any) {
            setItemsError(`Lỗi cập nhật đơn hàng: ${err.message}`);
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleAddVariantToOrder = async (variant: ProductVariant) => {
        if (!currentOrder || !session?.accessToken) return;
        setItemsError(null);

        const existingItem = enrichedOrderItems.find(item => item.productVariantId === variant.variantId);

        if (existingItem) {
            // If item exists, update its quantity
            await handleUpdateQuantity(existingItem.orderItemId, existingItem.quantity + 1);
        } else {
            // If item does not exist, create a new one
            try {
                const res = await fetch('http://localhost:8080/api/order-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                    body: JSON.stringify({ orderId: currentOrder.orderId, productVariantId: variant.variantId, quantity: 1 }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Lỗi ${res.status}`);
                }
                await fetchOrderItems();
                // Fetch lại order detail để cập nhật tổng tiền
                await fetchOrderDetail(currentOrder.orderCode);
                onOrderUpdate();
            } catch (err: any) {
                setItemsError(`Lỗi thêm sản phẩm: ${err.message}`);
            }
        }
    };

    const handleUpdateQuantity = async (orderItemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            await handleDeleteItem(orderItemId);
            return;
        }

        if (!session?.accessToken) return;
        setItemsError(null);

        try {
            const res = await fetch('http://localhost:8080/api/order-items', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                body: JSON.stringify({ orderItemId, newQuantity }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                throw new Error(errorData.message);
            }

            await fetchOrderItems();
            // Fetch lại order detail để cập nhật tổng tiền
            if (currentOrder) {
                await fetchOrderDetail(currentOrder.orderCode);
            }
            onOrderUpdate();
        } catch (err: any) {
            setItemsError(`Lỗi cập nhật số lượng: ${err.message}`);
        }
    };

    const handleDeleteItem = async (orderItemId: number) => {
        if (!session?.accessToken) return;
        setItemsError(null);

        try {
            const res = await fetch(`http://localhost:8080/api/order-items/${orderItemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Lỗi ${res.status}` }));
                throw new Error(errorData.message);
            }

            await fetchOrderItems();
            // Fetch lại order detail để cập nhật tổng tiền
            if (currentOrder) {
                await fetchOrderDetail(currentOrder.orderCode);
            }
            onOrderUpdate();
        } catch (err: any) {
            setItemsError(`Lỗi xóa sản phẩm: ${err.message}`);
        }
    };

    // Thêm function xử lý thanh toán tiền mặt
    const handleCashPaymentOpen = async () => {
        // Clear validation errors trước
        setValidationErrors({ customerName: '', phoneNumber: '' });
        
        // Validate thông tin khách hàng
        if (!validateCustomerInfo()) {
            setItemsError('Vui lòng nhập đầy đủ thông tin khách hàng trước khi thanh toán');
            return;
        }

        // Kiểm tra trạng thái thanh toán
        if (isPaid()) {
            setItemsError('Đơn hàng này đã được thanh toán, không thể thanh toán lại');
            return;
        }

        // Cập nhật thông tin khách hàng trước khi thanh toán
        await handleUpdateOrder();
        
        // Reset countdown và mở modal
        setCashPaymentCountdown(5);
        onCashPaymentOpen();
    };

    // Effect cho countdown và tự động thanh toán
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (isCashPaymentOpen && cashPaymentCountdown > 0) {
            interval = setInterval(() => {
                setCashPaymentCountdown(prev => {
                    const newCount = prev - 1;
                    // Khi countdown về 0, tự động thực hiện thanh toán
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

    // Function xác nhận thanh toán tiền mặt
    const handleConfirmCashPayment = async () => {
        if (!currentOrder || !session?.accessToken) return;
        
        setIsCashPaymentProcessing(true);
        
        try {
            const response = await fetch(`http://localhost:8080/api/orders/cash-checkin/${currentOrder.orderCode}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Lỗi ${response.status}` }));
                throw new Error(errorData.message || 'Không thể xử lý thanh toán tiền mặt');
            }

            const result = await response.json();
            console.log('Cash payment result:', result);

            // Fetch lại order detail từ backend để có dữ liệu mới nhất
            await fetchOrderDetail(currentOrder.orderCode);

            // Hiển thị thành công trong 2 giây trước khi đóng modal
            setTimeout(() => {
                onCashPaymentOpenChange();
                onOrderUpdate(); // Refresh main list
            }, 2000);
            
            // Hiển thị thông báo thành công
            setItemsError(null);
            
        } catch (error: any) {
            console.error('Cash payment error:', error);
            setItemsError(`Lỗi thanh toán tiền mặt: ${error.message}`);
            // Đóng modal sau 3 giây nếu có lỗi
            setTimeout(() => {
                onCashPaymentOpenChange();
            }, 3000);
        } finally {
            setIsCashPaymentProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Chỉnh sửa Đơn hàng: {currentOrder?.orderCode}</ModalHeader>
                        <ModalBody className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Pane: Order Details */}
                            <div className="flex flex-col gap-4 h-full">
                                {currentOrder && (
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-bold">Thông tin đơn hàng</h3>
                                            <div className="flex gap-2">
                                                {currentOrder.orderStatus !== 'COMPLETED' && !isPaid() && (
                                                    <>
                                                        <Button color="warning" size="sm" onPress={handleCashPaymentOpen}>
                                                            💰 Tiền mặt
                                                        </Button>
                                                        <Button color="success" size="sm" onPress={handlePaymentOpen}>
                                                            Thanh toán khác
                                                        </Button>
                                                    </>
                                                )}
                                                <Button color="primary" size="sm" onPress={handleUpdateOrder} disabled={isUpdatingOrder}>
                                                    {isUpdatingOrder ? <Spinner color="white" size="sm" /> : "Lưu thay đổi"}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <Input
                                                    label="Tên khách hàng"
                                                    value={editableOrder.customerName}
                                                    onChange={(e) => {
                                                        setEditableOrder(prev => ({ ...prev, customerName: e.target.value }));
                                                        if (validationErrors.customerName) {
                                                            setValidationErrors(prev => ({ ...prev, customerName: '' }));
                                                        }
                                                    }}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.customerName}
                                                    errorMessage={validationErrors.customerName}
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    label="Số điện thoại"
                                                    value={editableOrder.phoneNumber}
                                                    onChange={(e) => {
                                                        setEditableOrder(prev => ({ ...prev, phoneNumber: e.target.value }));
                                                        if (validationErrors.phoneNumber) {
                                                            setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
                                                        }
                                                    }}
                                                    fullWidth
                                                    isInvalid={!!validationErrors.phoneNumber}
                                                    errorMessage={validationErrors.phoneNumber}
                                                />
                                            </div>
                                            <Input
                                                label="Giảm giá"
                                                type="number"
                                                value={String(editableOrder.discountAmount)}
                                                onChange={(e) => setEditableOrder(prev => ({ ...prev, discountAmount: Number(e.target.value) || 0 }))}
                                                fullWidth
                                                startContent={<span className="text-gray-400 text-sm">VND</span>}
                                            />
                                            <div className="p-2 bg-white rounded-md border text-sm">
                                                <p><strong>Tạm tính:</strong> {currentOrder.subTotalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Thành tiền:</strong> {currentOrder.finalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Trạng thái:</strong> {statusMap[currentOrder.orderStatus.toUpperCase() as keyof typeof statusMap] || currentOrder.orderStatus}</p>
                                                
                                                {/* Hiển thị trạng thái thanh toán */}
                                                <p><strong>Thanh toán:</strong> 
                                                    <span className={`ml-1 px-2 py-1 rounded text-xs ${isPaid() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {isPaid() ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                    </span>
                                                </p>
                                                
                                                {/* Hiển thị thông tin thanh toán */}
                                                {currentOrder.payments && currentOrder.payments.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="font-bold mb-2">Thông tin thanh toán:</p>
                                                        {currentOrder.payments.map((payment, index) => (
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
                                    </div>
                                )}
                                <div className="flex-grow flex flex-col">
                                    <h3 className="text-lg font-bold mb-2">Sản phẩm trong đơn</h3>
                                    {itemsError && <div className="text-red-500 p-2" role="alert">{itemsError}</div>}
                                    <div className="flex-grow overflow-y-auto border rounded-lg">
                                        {itemsLoading ? <div className="flex justify-center items-center h-full"><Spinner label="Đang tải..." /></div>
                                            : enrichedOrderItems.length === 0 ? <div className="text-center p-10 text-gray-500">Đơn hàng này chưa có sản phẩm.</div>
                                                : (
                                                    <Table removeWrapper aria-label="Sản phẩm trong đơn hàng">
                                                        <TableHeader>
                                                            <TableColumn>SẢN PHẨM</TableColumn>
                                                            <TableColumn>SỐ LƯỢNG</TableColumn>
                                                            <TableColumn className="text-right">ĐƠN GIÁ</TableColumn>
                                                            <TableColumn className="text-right">THÀNH TIỀN</TableColumn>
                                                            <TableColumn>HÀNH ĐỘNG</TableColumn>
                                                        </TableHeader>
                                                        <TableBody items={enrichedOrderItems}>
                                                            {(item) => (
                                                                <TableRow key={item.orderItemId}>
                                                                    <TableCell>
                                                                        <div>{item.productName}</div>
                                                                        <div className="text-xs text-gray-500">{item.variantInfo}</div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button isIconOnly size="sm" variant="flat" onPress={() => handleUpdateQuantity(item.orderItemId, item.quantity - 1)}>-</Button>
                                                                            <Input
                                                                                type="number"
                                                                                value={String(item.quantity)}
                                                                                onBlur={(e) => {
                                                                                    const newQuantity = parseInt(e.target.value, 10);
                                                                                    if (!isNaN(newQuantity)) {
                                                                                        handleUpdateQuantity(item.orderItemId, newQuantity);
                                                                                    }
                                                                                }}
                                                                                className="w-16 text-center"
                                                                            />
                                                                            <Button isIconOnly size="sm" variant="flat" onPress={() => handleUpdateQuantity(item.orderItemId, item.quantity + 1)}>+</Button>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">{item.priceAtPurchase.toLocaleString('vi-VN')}</TableCell>
                                                                    <TableCell className="text-right">{item.totalPrice.toLocaleString('vi-VN')}</TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            size="sm"
                                                                            color="danger"
                                                                            variant="flat"
                                                                            onPress={() => handleDeleteItem(item.orderItemId)}
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
                                </div>
                            </div>

                            {/* Right Pane: Product List */}
                            <div className="flex flex-col gap-4 h-full">
                                <h3 className="text-lg font-bold">Thêm sản phẩm vào đơn</h3>
                                <Input
                                    label="Tìm kiếm sản phẩm"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-full"
                                />
                                {productsError && <div className="text-red-500 p-2">{productsError}</div>}
                                <div className="flex-grow overflow-y-auto pr-2 border rounded-lg p-2">
                                    {productsLoading ? <div className="flex justify-center items-center h-full"><Spinner label="Đang tải sản phẩm..." /></div>
                                        : (
                                            <div className="space-y-3">
                                                {filteredProducts.length > 0 ? (
                                                    filteredProducts.map(p => (
                                                        <OptimizedProductItem
                                                            key={p.productId}
                                                            product={p}
                                                            onLoadVariants={() => Promise.resolve()} // Variants are pre-loaded, so this is a no-op
                                                            onAddToCart={(variant) => handleAddVariantToOrder(variant)}
                                                        />
                                                    ))
                                                ) : <div className="text-center py-10 text-gray-500">Không tìm thấy sản phẩm.</div>}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>Đóng</Button>
                        </ModalFooter>
                        
                        {/* Modal thanh toán tiền mặt */}
                        <Modal 
                            isOpen={isCashPaymentOpen} 
                            onOpenChange={onCashPaymentOpenChange}
                            isDismissable={false}
                            hideCloseButton={cashPaymentCountdown > 0}
                            size="md"
                        >
                            <ModalContent>
                                {(onClose) => (
                                    <>
                                        <ModalHeader className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span>💰</span>
                                                <span>Thanh toán bằng tiền mặt</span>
                                            </div>
                                        </ModalHeader>
                                        <ModalBody>
                                            <div className="text-center space-y-4">
                                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <h4 className="text-lg font-bold text-yellow-800 mb-2">
                                                        Đơn hàng: {currentOrder?.orderCode}
                                                    </h4>
                                                    <p className="text-2xl font-bold text-yellow-900">
                                                        Số tiền: {currentOrder?.finalAmount.toLocaleString('vi-VN')} VND
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
                                        </ModalBody>
                                        <ModalFooter>
                                            {cashPaymentCountdown > 0 ? (
                                                <Button 
                                                    color="danger" 
                                                    variant="light" 
                                                    onPress={onClose}
                                                >
                                                    Hủy thanh toán
                                                </Button>
                                            ) : (
                                                <Button 
                                                    color="primary" 
                                                    onPress={onClose}
                                                    disabled={isCashPaymentProcessing}
                                                >
                                                    {isCashPaymentProcessing ? 'Đang xử lý...' : 'Đóng'}
                                                </Button>
                                            )}
                                        </ModalFooter>
                                    </>
                                )}
                            </ModalContent>
                        </Modal>
                        
                        {currentOrder && (
                            <PaymentModal
                                isOpen={isPaymentOpen}
                                onOpenChange={onPaymentOpenChange}
                                orderAmount={currentOrder.finalAmount}
                                orderCode={currentOrder.orderCode}
                            />
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}