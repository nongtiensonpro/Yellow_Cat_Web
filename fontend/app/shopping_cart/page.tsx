'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Divider,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@heroui/react';
import { CldImage } from 'next-cloudinary';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface CartItem {
    id: number; // variantId
    productId: number;
    productName: string;
    name: string;
    price: number; // giá gốc
    salePrice?: number | null; // giá đã giảm (nếu có)
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
    cartItemId?: number;
}

const money = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ShoppingCartPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        const loadCart = async () => {
            setLoading(true);
            // Nếu đã đăng nhập, lấy từ API
            if (session?.user) {
                try {
                    const user = session.user as { id?: string; sub?: string; email?: string };
                    const userId = user.id || user.sub || user.email;
                    if (!userId) {
                        setCartItems([]);
                        setLoading(false);
                        return;
                    }
                    const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                    if (!res.ok) {
                        setCartItems([]);
                        setLoading(false);
                        return;
                    }
                    const data = await res.json();
                    if (!data.items || !Array.isArray(data.items)) {
                        setCartItems([]);
                        setLoading(false);
                        return;
                    }
                    // Map dữ liệu từ API về CartItem
                    const items: CartItem[] = data.items.map((item: unknown) => ({
                        id: (item as { variantId: number }).variantId,
                        productId: (item as { variantId: number }).variantId,
                        productName: (item as { productName: string }).productName,
                        name: `${(item as { productName: string }).productName} - ${(item as { colorName: string }).colorName} / ${(item as { sizeName: string }).sizeName}`,
                        price: Number((item as { price: number }).price), // giá gốc
                        salePrice: (item as { salePrice: number | null }).salePrice != null ? Number((item as { salePrice: number | null }).salePrice) : null, // giá sale nếu có
                        quantity: (item as { quantity: number }).quantity,
                        imageUrl: (item as { imageUrl: string }).imageUrl,
                        sku: (item as { sku: string }).sku,
                        stockLevel: (item as { stockLevel: number }).stockLevel,
                        colorName: (item as { colorName: string }).colorName,
                        sizeName: (item as { sizeName: string }).sizeName,
                        cartItemId: (item as { cartItemId: number }).cartItemId,
                    }));
                    setCartItems(items);
                } catch {
                    setCartItems([]);
                } finally {
                    setLoading(false);
                }
            } else {
                // Chưa đăng nhập, lấy từ localStorage
                try {
                    const cartData = localStorage.getItem('cart');
                    if (cartData) {
                        const items = JSON.parse(cartData) as CartItem[];
                        setCartItems(items);
                    } else {
                        setCartItems([]);
                    }
                } catch {
                    setCartItems([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadCart();

        // Listen for cart updates (chỉ localStorage, không cần cho API)
        const handleCartUpdate = () => {
            if (!session?.user) loadCart();
        };
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, [session]);

    // Update cart in localStorage
    const updateCart = (newItems: CartItem[]) => {
        setCartItems(newItems);
        localStorage.setItem('cart', JSON.stringify(newItems));
        window.dispatchEvent(new Event('cart-updated'));
    };

    // Increase quantity
    const increaseQuantity = async (itemId: number) => {
        if (session?.user) {
            const item = cartItems.find(i => i.id === itemId);
            if (!item) return;
            // Gọi API update
            try {
                const user = session.user as { id?: string; sub?: string; email?: string };
                const userId = user.id || user.sub || user.email;
                await fetch('http://localhost:8080/api/cart-items/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keycloakId: userId,
                        variantId: item.id,
                        cartItemId: item.cartItemId,
                        quantity: item.quantity + 1
                    })
                });
                // Reload cart
                const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                const data = await res.json();
                if (data.items && Array.isArray(data.items)) {
                    const items: CartItem[] = data.items.map((item: unknown) => ({
                        id: (item as { variantId: number }).variantId,
                        productId: (item as { variantId: number }).variantId,
                        productName: (item as { productName: string }).productName,
                        name: `${(item as { productName: string }).productName} - ${(item as { colorName: string }).colorName} / ${(item as { sizeName: string }).sizeName}`,
                        price: Number((item as { price: number }).price), // giá gốc
                        salePrice: (item as { salePrice: number | null }).salePrice != null ? Number((item as { salePrice: number | null }).salePrice) : null, // giá sale nếu có
                        quantity: (item as { quantity: number }).quantity,
                        imageUrl: (item as { imageUrl: string }).imageUrl,
                        sku: (item as { sku: string }).sku,
                        stockLevel: (item as { stockLevel: number }).stockLevel,
                        colorName: (item as { colorName: string }).colorName,
                        sizeName: (item as { sizeName: string }).sizeName,
                        cartItemId: (item as { cartItemId: number }).cartItemId,
                    }));
                    setCartItems(items);
                }
            } catch {
            }
        } else {
            const newItems = cartItems.map(item => {
                if (item.id === itemId && item.quantity < item.stockLevel) {
                    return { ...item, quantity: item.quantity + 1 };
                }
                return item;
            });
            updateCart(newItems);
        }
    };

    // Decrease quantity
    const decreaseQuantity = async (itemId: number) => {
        if (session?.user) {
            const item = cartItems.find(i => i.id === itemId);
            if (!item || item.quantity <= 1) return;
            // Gọi API update
            try {
                const user = session.user as { id?: string; sub?: string; email?: string };
                const userId = user.id || user.sub || user.email;
                await fetch('http://localhost:8080/api/cart-items/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keycloakId: userId,
                        variantId: item.id,
                        cartItemId: item.cartItemId,
                        quantity: item.quantity - 1
                    })
                });
                // Reload cart
                const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                const data = await res.json();
                if (data.items && Array.isArray(data.items)) {
                    const items: CartItem[] = data.items.map((item: unknown) => ({
                        id: (item as { variantId: number }).variantId,
                        productId: (item as { variantId: number }).variantId,
                        productName: (item as { productName: string }).productName,
                        name: `${(item as { productName: string }).productName} - ${(item as { colorName: string }).colorName} / ${(item as { sizeName: string }).sizeName}`,
                        price: Number((item as { price: number }).price), // giá gốc
                        salePrice: (item as { salePrice: number | null }).salePrice != null ? Number((item as { salePrice: number | null }).salePrice) : null, // giá sale nếu có
                        quantity: (item as { quantity: number }).quantity,
                        imageUrl: (item as { imageUrl: string }).imageUrl,
                        sku: (item as { sku: string }).sku,
                        stockLevel: (item as { stockLevel: number }).stockLevel,
                        colorName: (item as { colorName: string }).colorName,
                        sizeName: (item as { sizeName: string }).sizeName,
                        cartItemId: (item as { cartItemId: number }).cartItemId,
                    }));
                    setCartItems(items);
                }
            } catch {
            }
        } else {
            const newItems = cartItems.map(item => {
                if (item.id === itemId && item.quantity > 1) {
                    return { ...item, quantity: item.quantity - 1 };
                }
                return item;
            });
            updateCart(newItems);
        }
    };

    // Remove item
    const removeItem = async (itemId: number) => {
        if (session?.user) {
            const item = cartItems.find(i => i.id === itemId);
            if (!item) return;
            try {
                await fetch(`http://localhost:8080/api/cart-items/remove/${item.cartItemId}`, {
                    method: 'DELETE'
                });
                // Reload cart
                const user = session.user as { id?: string; sub?: string; email?: string };
                const userId = user.id || user.sub || user.email;
                const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                const data = await res.json();
                if (data.items && Array.isArray(data.items)) {
                    const items: CartItem[] = data.items.map((item: unknown) => ({
                        id: (item as { variantId: number }).variantId,
                        productId: (item as { variantId: number }).variantId,
                        productName: (item as { productName: string }).productName,
                        name: `${(item as { productName: string }).productName} - ${(item as { colorName: string }).colorName} / ${(item as { sizeName: string }).sizeName}`,
                        price: Number((item as { price: number }).price), // giá gốc
                        salePrice: (item as { salePrice: number | null }).salePrice != null ? Number((item as { salePrice: number | null }).salePrice) : null, // giá sale nếu có
                        quantity: (item as { quantity: number }).quantity,
                        imageUrl: (item as { imageUrl: string }).imageUrl,
                        sku: (item as { sku: string }).sku,
                        stockLevel: (item as { stockLevel: number }).stockLevel,
                        colorName: (item as { colorName: string }).colorName,
                        sizeName: (item as { sizeName: string }).sizeName,
                        cartItemId: (item as { cartItemId: number }).cartItemId,
                    }));
                    setCartItems(items);
                }
            } catch {
            }
            onClose();
            setItemToDelete(null);
        } else {
            const newItems = cartItems.filter(item => item.id !== itemId);
            updateCart(newItems);
            onClose();
            setItemToDelete(null);
        }
    };

    // Confirm delete
    const confirmDelete = (item: CartItem) => {
        setItemToDelete(item);
        onOpen();
    };

    const handleConfirmCart = async () => {
        // Kiểm tra giỏ hàng
        if (cartItems.length === 0) {
            alert('Giỏ hàng trống!');
            return;
        }

        // Chuẩn bị dữ liệu sản phẩm
        const products = cartItems
            .filter(item => item.id && item.quantity)
            .map(item => ({
                variantId: item.id,
                quantity: item.quantity
            }));

        if (products.length === 0) {
            alert('Không có sản phẩm hợp lệ trong giỏ hàng!');
            return;
        }

        // Lấy keycloakId
        let keycloakId = '';
        if (session?.user?.id) {
            keycloakId = session.user.id;
        } else {
            // Guest user - tạo hoặc lấy từ localStorage
            if (typeof window !== 'undefined') {
                keycloakId = localStorage.getItem('guestId') || '';
                if (!keycloakId) {
                    keycloakId = crypto.randomUUID();
                    localStorage.setItem('guestId', keycloakId);
                }
            }
        }

        if (!keycloakId) {
            alert('Không thể xác định người dùng!');
            return;
        }

        try {
            // Chuẩn bị request body theo đúng format
            const requestBody = {
                keycloakId: keycloakId,
                allowWaitingOrder: false,
                products: products
            };

            console.log('=== CART CONFIRM REQUEST ===');
            console.log('Sending request to /api/cart/confirm:', requestBody);
            console.log('Cart items:', cartItems);
            console.log('Products to send:', products);

            // Gọi API
            const response = await fetch('http://localhost:8080/api/cart/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                alert(errorData.message || 'Lỗi xác nhận giỏ hàng!');
                return;
            }

            const result = await response.json();
            console.log('=== API RESPONSE ===');
            console.log('API Response:', result);
            console.log('Can proceed:', result.canProceed);
            console.log('Waiting for stock:', result.waitingForStock);
            console.log('Order status:', result.orderStatus);

            // Xử lý kết quả
            if (result.canProceed) {
                // Thành công - chuyển sang trang confirm-order
                const isWaiting = result.waitingForStock;
                router.push(`/confirm-order${isWaiting ? '?waiting=true' : ''}`);
            } else {
                // Không thể tiến hành
                alert('Không thể xác nhận giỏ hàng. Vui lòng thử lại!');
            }

        } catch (error) {
            console.error('Error calling API:', error);
            alert('Có lỗi xảy ra khi xác nhận giỏ hàng!');
        }
    };

    // Calculate totals
    const productTypes = cartItems.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner label="Đang tải giỏ hàng..." size="lg" />
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto my-10 p-4 max-w-4xl">
                <Card>
                    <CardBody className="text-center py-20">
                        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
                        <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
                        <div className="space-x-4">
                            <Button 
                                color="primary" 
                                onClick={() => router.push('/products')}
                                className="font-semibold"
                            >
                                Tiếp tục mua sắm
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => router.back()}
                                startContent={<ArrowLeft className="h-4 w-4" />}
                            >
                                Quay lại
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto my-10 p-4 max-w-6xl">
            <div className="mb-6">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    startContent={<ArrowLeft className="h-4 w-4" />}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng ({productTypes} sản phẩm)</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Sản phẩm trong giỏ hàng</h2>
                        </CardHeader>
                        <CardBody className="p-0">
                            {cartItems.map((item, index) => (
                                <div key={item.id}>
                                    <div className="p-6">
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="flex-shrink-0">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <CldImage 
                                                            src={item.imageUrl} 
                                                            width={80} 
                                                            height={80} 
                                                            alt={item.productName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                            &quot;No Image&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {item.productName}
                                                </h3>
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">Màu:</span> {item.colorName} | 
                                                    <span className="font-medium ml-2">Size:</span> {item.sizeName}
                                                </div>
                                                <div className="text-sm text-gray-500 mb-2">
                                                    SKU: {item.sku}
                                                </div>
                                                <div className="text-lg font-bold text-red-600 flex items-center gap-2">
                                                    {item.salePrice != null && item.salePrice < item.price ? (
                                                        <>
                                                            <span className="line-through text-gray-400 text-base">{money(item.price)}</span>
                                                            <span>{money(item.salePrice)}</span>
                                                        </>
                                                    ) : (
                                                        <span>{money(item.price)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center border border-gray-300 rounded-lg">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => decreaseQuantity(item.id)}
                                                        disabled={item.quantity <= 1}
                                                        className="px-2 py-1"
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="px-3 py-1 text-center min-w-[40px]">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => increaseQuantity(item.id)}
                                                        disabled={item.quantity >= item.stockLevel}
                                                        className="px-2 py-1"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                <div className="text-xs text-gray-500 text-center">
                                                    Còn {item.stockLevel} sản phẩm
                                                </div>
                                            </div>

                                            {/* Remove Button */}
                                            <div className="flex flex-col items-center justify-center">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="ghost"
                                                    color="danger"
                                                    onClick={() => confirmDelete(item)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {index < cartItems.length - 1 && <Divider />}
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Tóm tắt đơn hàng</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>
                                            {item.productName} <span className="text-gray-500">x{item.quantity}</span>
                                        </span>
                                        <span className="font-semibold">
                                            {money((item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                <Divider />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Tổng cộng:</span>
                                    <span className="text-red-600">{money(cartItems.reduce((sum, item) => sum + ((item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity), 0))}</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <Button 
                                    color="success" 
                                    className="w-full font-semibold py-3"
                                    onClick={handleConfirmCart}
                                    disabled={cartItems.length === 0}
                                >
                                    Tiến hành thanh toán
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    className="w-full"
                                    onClick={() => router.push('/products')}
                                >
                                    Tiếp tục mua sắm
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>Xác nhận xóa</ModalHeader>
                    <ModalBody>
                        <p>Bạn có chắc chắn muốn xóa sản phẩm &quot;{itemToDelete?.productName}&quot; khỏi giỏ hàng?</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onPress={onClose}>
                            Hủy
                        </Button>
                        <Button 
                            color="danger" 
                            onPress={() => itemToDelete && removeItem(itemToDelete.id)}
                        >
                            Xóa
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
