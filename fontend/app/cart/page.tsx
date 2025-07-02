'use client';

import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CldImage } from 'next-cloudinary';
import { useSession } from "next-auth/react";

interface CartItem {
    id: number;
    productId: number;
    productName: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    cartItemId?: number;
    colorName?: string;
    sizeName?: string;
}

export default function CartPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Hàm fetchCart để reload cart khi đã đăng nhập
    const fetchCart = async () => {
        if (session?.user) {
            const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${session.user.id}`);
            const data = await res.json();
            setCartItems((data.items || []).map((item: any) => ({
                ...item,
                id: item.id || item.variantId
            })));
        }
    };

    useEffect(() => {
        const fetchInitialCart = async () => {
            if (session?.user) {
                await fetchCart();
            } else if (typeof window !== 'undefined') {
                const storedCart = localStorage.getItem('cart');
                if (storedCart) {
                    setCartItems(JSON.parse(storedCart));
                }
            }
            setLoading(false);
        };
        fetchInitialCart();
    }, [session]);

    // Log ra thông tin sản phẩm trong giỏ hàng (bao gồm cả màu và size)
    useEffect(() => {
        if (!loading && cartItems.length > 0) {
            console.log('Cart items:', cartItems.map((item: CartItem) => ({
                id: item.id,
                name: item.name,
                color: item.colorName,
                size: item.sizeName,
                quantity: item.quantity,
                price: item.price
            })));
        }
    }, [loading, cartItems]);

    useEffect(() => {
        if (!loading && typeof window !== 'undefined' && !session?.user) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, loading, session]);

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Sửa handleQuantityChange
    const handleQuantityChange = async (itemKey: number, newQuantity: number) => {
        if (session?.user) {
            // Đã đăng nhập: tìm theo cartItemId
            const cartItem = cartItems.find((item: any) => item.cartItemId === itemKey);
            if (!cartItem || !cartItem.cartItemId) return;
            await fetch('http://localhost:8080/api/cart-items/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItemId: cartItem.cartItemId,
                    quantity: newQuantity
                })
            });
            await fetchCart();
        } else {
            // Chưa đăng nhập: tìm theo id (variantId)
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                    if (item.id === itemKey) {
                    const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
                    return { ...item, quantity };
                }
                return item;
            });
            return updatedItems;
        });
        }
    };

    // Sửa handleRemoveItem
    const handleRemoveItem = async (itemKey: number) => {
        if (session?.user) {
            // Đã đăng nhập: tìm theo cartItemId
            const cartItem = cartItems.find((item: any) => item.cartItemId === itemKey);
            if (!cartItem || !cartItem.cartItemId) return;
            await fetch(`http://localhost:8080/api/cart-items/remove/${cartItem.cartItemId}`, {
                method: 'DELETE'
            });
            await fetchCart();
        } else {
            // Chưa đăng nhập: xóa khỏi localStorage như cũ
            setCartItems(prevItems => prevItems.filter(item => item.id !== itemKey));
        }
    };

    // Function to handle proceeding to checkout
    const handleProceedToCheckout = async () => {
        if (session?.user) {
            if (!session.user.id) {
                alert('Không tìm thấy thông tin người dùng!');
                return;
            }
            // Chỉ lấy sản phẩm có id và quantity hợp lệ
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
            try {
                const res = await fetch('http://localhost:8080/api/cart/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keycloakId: session.user.id,
                        products
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert(err.message || 'Lỗi xác nhận giỏ hàng!');
                    return;
                }
                // Nếu thành công, chuyển sang trang checkout
        router.push('/checkout');
            } catch (err) {
                alert('Lỗi xác nhận giỏ hàng!');
            }
        } else {
            // Chưa đăng nhập: chuyển sang trang đăng nhập
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Đang tải giỏ hàng...</p> {/* Simple loading indicator */}
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 px-4 md:px-36`}>
            <Card className="w-full">
                <CardHeader className="flex flex-col items-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-gray-500 mb-4"
                    >
                        &larr; Tiếp tục mua sắm
                    </Button>
                    <h1 className="text-3xl font-bold">Giỏ hàng của bạn</h1>
                    <p className="text-gray-600 mt-2">Bạn có {cartItems.length} sản phẩm trong giỏ hàng.</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    {cartItems.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống.</p>
                            <Button className="mt-4" onClick={() => router.push('/')}>
                                Quay lại trang chủ
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Cart Items List */}
                            <div className="md:col-span-2 space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.cartItemId || item.id} className="flex items-center space-x-4 border-b pb-4">
                                        {item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '' ? (
                                            item.imageUrl.startsWith('http') ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    className="rounded-md object-cover"
                                                />
                                            ) : (
                                                <CldImage
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    crop="fill"
                                                    className="rounded-md object-cover"
                                                />
                                            )
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h2 className="text-lg font-semibold">{item.productName || item.name || "Không có tên"}</h2>
                                            <div className="flex gap-4 text-sm text-gray-700 mt-1">
                                                <span>Màu sắc: <span className="font-semibold">{item.colorName || '-'}</span></span>
                                                <span>Size: <span className="font-semibold">{item.sizeName || '-'}</span></span>
                                            </div>
                                            <p className="text-gray-600 mt-1">Giá: {formatPrice(item.price)}</p>
                                            <div className="flex items-center mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleQuantityChange(session?.user ? (item.cartItemId ?? item.id) : item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <span className="mx-2 text-lg font-medium">{item.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleQuantityChange(session?.user ? (item.cartItemId ?? item.id) : item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stockLevel}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            {item.quantity >= item.stockLevel && (
                                                <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold">{formatPrice(item.price * item.quantity)}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                color="danger"
                                                className="mt-2"
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                                                        handleRemoveItem(session?.user ? (item.cartItemId ?? item.id) : item.id);
                                                    }
                                                }}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
                                <div className="mb-6">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800">Tóm tắt đơn hàng</h3>
                                    <div className="overflow-x-auto rounded-xl shadow-md bg-white">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Tên sản phẩm</th>
                                                    <th className="text-center px-2 py-2 font-semibold text-gray-700">Số lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cartItems.map(item => (
                                                    <tr key={item.cartItemId || item.id} className="hover:bg-gray-50 transition">
                                                        <td className="pr-2 pl-4 py-2 font-bold text-base md:text-lg text-gray-900">{item.name || item.productName || "Không có tên"}</td>
                                                        <td className="text-center px-2 py-2 text-gray-700">{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                </div>
                                    <div className="flex justify-between items-center mt-6 mb-2">
                                        <span className="text-lg text-gray-700 font-medium">Tổng cộng:</span>
                                        <span className="text-2xl font-extrabold text-primary-600">{formatPrice(calculateSubtotal())}</span>
                                </div>
                                    <Button color="primary" size="lg" className="w-full mt-6 shadow-lg text-base font-semibold py-3 rounded-xl" onClick={handleProceedToCheckout}>
                                        Tiến hành thanh toán
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}