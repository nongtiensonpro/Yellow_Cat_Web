'use client';

import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CldImage } from 'next-cloudinary';

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
}

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, loading]);


    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleQuantityChange = (variantId: number, newQuantity: number) => {
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === variantId) {
                    // Ensure quantity doesn't go below 1 or exceed stock
                    const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
                    return { ...item, quantity };
                }
                return item;
            });
            return updatedItems;
        });
    };

    const handleRemoveItem = (variantId: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== variantId));
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
                                    <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                                        {item.imageUrl ? (
                                            <CldImage // Use CldImage for better image optimization
                                                src={item.imageUrl}
                                                alt={item.name}
                                                width={80}
                                                height={80}
                                                crop="fill" // You might want to adjust crop/gravity
                                                className="rounded-md object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h2 className="text-lg font-semibold">{item.name}</h2>
                                            <p className="text-gray-600">Giá: {formatPrice(item.price)}</p>
                                            <div className="flex items-center mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <span className="mx-2 text-lg font-medium">{item.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stockLevel} // Disable if max stock reached
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
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
                                <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-700">Tổng phụ:</span>
                                    <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-700">Phí vận chuyển:</span>
                                    <span className="font-semibold">Miễn phí</span> {/* Placeholder */}
                                </div>
                                <Divider />
                                <div className="flex justify-between items-center mt-4 text-xl font-bold text-red-600">
                                    <span>Tổng cộng:</span>
                                    <span>{formatPrice(calculateSubtotal())}</span>
                                </div>
                                <Button color="primary" size="lg" className="w-full mt-6" onClick={() => alert('Chức năng thanh toán đang được phát triển!')}>
                                    Tiến hành thanh toán
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}