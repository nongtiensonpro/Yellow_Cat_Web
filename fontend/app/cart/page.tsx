'use client';

import { Card, CardHeader, CardBody, Divider, Button, addToast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { CldImage } from 'next-cloudinary';

interface CartItem {
    cartItemId: number; // lấy từ backend
    id: number; // variantId
    productId: number;
    productName: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
}

export default function CartPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [confirmingOrder, setConfirmingOrder] = useState(false);

    // Lấy keycloakId từ accessToken
    const getKeycloakId = () => {
        if (!session || !session.accessToken) return null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            return tokenData.sub;
        } catch {
            return null;
        }
    };

    // Lấy cart từ backend
    const fetchCart = async () => {
        const keycloakId = getKeycloakId();
        if (!keycloakId) {
            setCartItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${keycloakId}`);
            if (!res.ok) throw new Error('Không thể lấy giỏ hàng');
            const data = await res.json();
            // data.items là mảng các item
            if (data.items) {
                // Map về đúng định dạng CartItem
                setCartItems(data.items.map((item: any) => ({
                    cartItemId: item.cartItemId,
                    id: item.variantId,
                    productId: item.productId || 0,
                    productName: item.productName || '',
                    name: item.productName || '',
                    price: Number(item.price) || 0,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl || '',
                    sku: item.sku || '',
                    stockLevel: item.stockLevel || 99,
                    colorName: item.colorName,
                    sizeName: item.sizeName,
                })));
            } else {
                setCartItems([]);
            }
        } catch (err: any) {
            addToast({ title: 'Lỗi', description: err.message || 'Không thể lấy giỏ hàng', color: 'danger' });
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchCart();
        } else {
            setCartItems([]);
            setLoading(false);
        }
        // eslint-disable-next-line
    }, [status]);

    const handleRemoveItem = async (cartItemId: number) => {
        if (!cartItemId) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
        try {
            const res = await fetch(`http://localhost:8080/api/cart-items/remove/${cartItemId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Lỗi khi xóa sản phẩm');
            }
            addToast({ title: 'Thành công', description: 'Đã xóa sản phẩm khỏi giỏ hàng', color: 'success' });
            fetchCart();
        } catch (err: any) {
            addToast({ title: 'Lỗi', description: err.message || 'Không thể xóa sản phẩm', color: 'danger' });
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Cập nhật số lượng sản phẩm trong giỏ hàng (gọi backend, chỉ loading cho item đó, optimistic update)
    const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
        if (!session || !session.accessToken) return;
        const item = cartItems.find(i => i.cartItemId === cartItemId);
        if (!item) return;
        let keycloakId = null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch {
            return;
        }
        setUpdatingItemId(cartItemId);
        if (newQuantity <= 0) {
            await handleRemoveItem(cartItemId);
            setUpdatingItemId(null);
            return;
        }
        try {
            const res = await fetch('http://localhost:8080/api/cart-items/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keycloakId,
                    cartItemId,
                    variantId: item.id,
                    quantity: newQuantity
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Lỗi cập nhật số lượng');
            }
            // Optimistic update: chỉ update item vừa đổi số lượng
            setCartItems(prev =>
                prev.map(i =>
                    i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i
                )
            );
        } catch (err: any) {
            addToast({ title: 'Lỗi', description: err.message || 'Không thể cập nhật số lượng', color: 'danger' });
        } finally {
            setUpdatingItemId(null);
        }
    };

    // Xác nhận đơn hàng (trừ tạm kho) - Cải thiện với loading state và validation
    const handleConfirmOrder = async () => {
        if (!session || !session.accessToken) {
            addToast({ title: 'Chưa đăng nhập', description: 'Vui lòng đăng nhập để tiếp tục.', color: 'warning' });
            return;
        }

        if (cartItems.length === 0) {
            addToast({ title: 'Giỏ hàng trống', description: 'Vui lòng thêm sản phẩm vào giỏ hàng.', color: 'warning' });
            return;
        }

        let keycloakId = null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch {
            addToast({ title: 'Lỗi xác thực', description: 'Không lấy được thông tin người dùng.', color: 'danger' });
            return;
        }

        setConfirmingOrder(true);
        try {
            const res = await fetch('http://localhost:8080/api/cart/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keycloakId,
                    products: cartItems.map(item => ({ 
                        variantId: item.id, 
                        quantity: item.quantity 
                    }))
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Lỗi xác nhận đơn hàng');
            }

            const confirmData = await res.json();
            addToast({ 
                title: 'Thành công', 
                description: 'Đã xác nhận đơn hàng và trừ tạm kho. Chuyển đến trang thanh toán...', 
                color: 'success' 
            });

            // Lưu thông tin xác nhận vào sessionStorage để checkout page có thể sử dụng
            sessionStorage.setItem('confirmedOrder', JSON.stringify(confirmData));
            
            // Chuyển sang trang checkout
            router.push('/checkout');
        } catch (err: any) {
            addToast({ 
                title: 'Lỗi', 
                description: err.message || 'Không thể xác nhận đơn hàng. Vui lòng thử lại.', 
                color: 'danger' 
            });
        } finally {
            setConfirmingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Đang tải giỏ hàng...</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto my-10 p-4 max-w-5xl">
            <Card className="w-full rounded-xl border border-gray-200 bg-white">
                <CardHeader className="flex flex-col items-start gap-2 pb-0">
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-gray-500 rounded-full hover:bg-gray-100 mb-4"
                        isIconOnly
                    >
                        <span className="text-lg">&larr;</span>
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Giỏ hàng của bạn</h1>
                    <p className="text-gray-500 mt-1 text-sm">Bạn có <span className="font-semibold text-gray-900">{cartItems.length}</span> sản phẩm trong giỏ hàng.</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    {cartItems.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-400 text-lg">Giỏ hàng của bạn đang trống.</p>
                            <Button className="mt-6" onClick={() => router.push('/')}>Quay lại trang chủ</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {/* Cart Items List */}
                            <div className="md:col-span-2 space-y-6">
                                {cartItems.map(item => (
                                    <div key={item.cartItemId} className="flex items-center gap-4 border border-gray-100 rounded-lg p-4 bg-gray-50">
                                        {item.imageUrl ? (
                                            <CldImage
                                                src={item.imageUrl}
                                                alt={item.name}
                                                width={80}
                                                height={80}
                                                crop="fill"
                                                className="rounded-md object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs border border-gray-100">
                                                No Image
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-semibold truncate">{item.name}</h2>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                                                {item.colorName && <span>Màu: {item.colorName}</span>}
                                                {item.sizeName && <span>Kích cỡ: {item.sizeName}</span>}
                                                <span>SKU: {item.sku}</span>
                                            </div>
                                            <p className="text-gray-700 mt-1 text-sm">Giá: <span className="font-semibold">{formatPrice(item.price)}</span></p>
                                            <div className="flex items-center mt-2 gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                                                    disabled={item.quantity <= 1 || updatingItemId === item.cartItemId}
                                                    className="rounded-full border border-gray-200"
                                                >
                                                    {updatingItemId === item.cartItemId ? <span className="animate-spin">-</span> : '-'}
                                                </Button>
                                                <span className="mx-2 text-base font-medium">{item.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stockLevel || updatingItemId === item.cartItemId}
                                                    className="rounded-full border border-gray-200"
                                                >
                                                    {updatingItemId === item.cartItemId ? <span className="animate-spin">+</span> : '+'}
                                                </Button>
                                            </div>
                                            {item.quantity >= item.stockLevel && (
                                                <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
                                            )}
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <p className="text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                color="danger"
                                                className="mt-2 rounded-full border border-gray-200"
                                                onClick={() => handleRemoveItem(item.cartItemId)}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Order Summary */}
                            <div className="md:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">
                                <h2 className="text-lg font-bold mb-2 text-gray-900">Tóm tắt đơn hàng</h2>
                                <Divider />
                                <div className="flex justify-between items-center mt-2 text-base font-bold text-green-700">
                                    <span>Tổng cộng:</span>
                                    <span>{formatPrice(calculateSubtotal())}</span>
                                </div>
                                <Button 
                                    color="success" 
                                    size="lg" 
                                    className="w-full mt-4 rounded-lg font-semibold text-base" 
                                    onClick={handleConfirmOrder}
                                    disabled={confirmingOrder || cartItems.length === 0}
                                    isLoading={confirmingOrder}
                                >
                                    {confirmingOrder ? 'Đang xác nhận...' : 'Tiến hành thanh toán'}
                                </Button>
                                {confirmingOrder && (
                                    <p className="text-xs text-gray-500 text-center">
                                        Đang trừ tạm kho và chuẩn bị đơn hàng...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}