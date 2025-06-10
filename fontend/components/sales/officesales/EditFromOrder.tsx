"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input,
} from "@heroui/react";
import { OptimizedProductItem } from "./OptimizedProductItem";
import { ProductManagement, ProductVariant, ProductWithVariants } from "./ProductListSaleOffice";

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

    // State for editable order fields
    const [editableOrder, setEditableOrder] = useState({
        customerName: '',
        phoneNumber: '',
        discountAmount: 0,
    });
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

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

    // Effect to sync editableOrder state with order prop
    useEffect(() => {
        if (order) {
            setEditableOrder({
                customerName: order.customerName || '',
                phoneNumber: order.phoneNumber || '',
                discountAmount: order.discountAmount || 0,
            });
        }
    }, [order]);

    const fetchOrderItems = useCallback(async () => {
        if (!order || !session?.accessToken) return;
        setItemsLoading(true);
        setItemsError(null);
        try {
            const url = new URL(`http://localhost:8080/api/order-items`);
            url.searchParams.append('orderId', order.orderId.toString());
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
    }, [order, session]);

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
        if (isOpen && order) {
            fetchOrderItems();
        }
    }, [isOpen, order, fetchOrderItems]);

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

    const handleUpdateOrder = async () => {
        if (!order || !session?.accessToken) return;
        setIsUpdatingOrder(true);
        setItemsError(null); // Clear other errors
        try {
            const requestBody = {
                orderId: order.orderId,
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
            onOrderUpdate(); // Refresh the main list
        } catch (err: any) {
            setItemsError(`Lỗi cập nhật đơn hàng: ${err.message}`);
        } finally {
            setIsUpdatingOrder(false);
        }
    };

    const handleAddVariantToOrder = async (variant: ProductVariant) => {
        if (!order || !session?.accessToken) return;
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
                    body: JSON.stringify({ orderId: order.orderId, productVariantId: variant.variantId, quantity: 1 }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Lỗi ${res.status}`);
                }
                await fetchOrderItems();
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
            onOrderUpdate();
        } catch (err: any) {
            setItemsError(`Lỗi xóa sản phẩm: ${err.message}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Chỉnh sửa Đơn hàng: {order?.orderCode}</ModalHeader>
                        <ModalBody className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Pane: Order Details */}
                            <div className="flex flex-col gap-4 h-full">
                                {order && (
                                    <div className="p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-bold">Thông tin đơn hàng</h3>
                                            <Button color="primary" size="sm" onPress={handleUpdateOrder} disabled={isUpdatingOrder}>
                                                {isUpdatingOrder ? <Spinner color="white" size="sm" /> : "Lưu thay đổi"}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input
                                                label="Tên khách hàng"
                                                value={editableOrder.customerName}
                                                onChange={(e) => setEditableOrder(prev => ({ ...prev, customerName: e.target.value }))}
                                                fullWidth
                                            />
                                            <Input
                                                label="Số điện thoại"
                                                value={editableOrder.phoneNumber}
                                                onChange={(e) => setEditableOrder(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                fullWidth
                                            />
                                            <Input
                                                label="Giảm giá"
                                                type="number"
                                                value={String(editableOrder.discountAmount)}
                                                onChange={(e) => setEditableOrder(prev => ({ ...prev, discountAmount: Number(e.target.value) || 0 }))}
                                                fullWidth
                                                startContent={<span className="text-gray-400 text-sm">VND</span>}
                                            />
                                            <div className="p-2 bg-white rounded-md border text-sm">
                                                <p><strong>Tạm tính:</strong> {order.subTotalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Thành tiền:</strong> {order.finalAmount.toLocaleString('vi-VN')} VND</p>
                                                <p><strong>Trạng thái:</strong> {statusMap[order.orderStatus.toUpperCase() as keyof typeof statusMap] || order.orderStatus}</p>
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
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}