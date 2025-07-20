//
// 'use client';
//
// import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
// import { useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import { CldImage } from 'next-cloudinary';
//
// interface CartItem {
//     id: number;
//     productId: number;
//     productName: string;
//     name: string;
//     price: number;
//     quantity: number;
//     imageUrl: string;
//     sku: string;
//     stockLevel: number;
// }
//
// export default function CartPage() {
//     const router = useRouter();
//     const [cartItems, setCartItems] = useState<CartItem[]>([]);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             const storedCart = localStorage.getItem('cart');
//             if (storedCart) {
//                 setCartItems(JSON.parse(storedCart));
//             }
//         }
//         setLoading(false);
//     }, []);
//
//     useEffect(() => {
//         if (!loading && typeof window !== 'undefined') {
//             localStorage.setItem('cart', JSON.stringify(cartItems));
//         }
//     }, [cartItems, loading]);
//
//
//     const calculateSubtotal = () => {
//         return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
//     };
//
//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('vi-VN', {
//             style: 'currency',
//             currency: 'VND'
//         }).format(price);
//     };
//
//     const handleQuantityChange = (variantId: number, newQuantity: number) => {
//         setCartItems(prevItems => {
//             const updatedItems = prevItems.map(item => {
//                 if (item.id === variantId) {
//                     // Ensure quantity doesn't go below 1 or exceed stock
//                     const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
//                     return { ...item, quantity };
//                 }
//                 return item;
//             });
//             return updatedItems;
//         });
//     };
//
//     const handleRemoveItem = (variantId: number) => {
//         setCartItems(prevItems => prevItems.filter(item => item.id !== variantId));
//     };
//
//     // Function to handle proceeding to checkout
//     const handleProceedToCheckout = () => {
//         // Navigate to the checkout page.
//         // Assuming your checkout page is at the route /checkout
//         router.push('/checkout');
//     };
//
//
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <p>Đang tải giỏ hàng...</p> {/* Simple loading indicator */}
//             </div>
//         );
//     }
//
//     return (
//         <div className={`min-h-screen py-8 px-4 md:px-36`}>
//             <Card className="w-full">
//                 <CardHeader className="flex flex-col items-start">
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => router.back()}
//                         className="text-gray-500 mb-4"
//                     >
//                         &larr; Tiếp tục mua sắm
//                     </Button>
//                     <h1 className="text-3xl font-bold">Giỏ hàng của bạn</h1>
//                     <p className="text-gray-600 mt-2">Bạn có {cartItems.length} sản phẩm trong giỏ hàng.</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     {cartItems.length === 0 ? (
//                         <div className="text-center py-10">
//                             <p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống.</p>
//                             <Button className="mt-4" onClick={() => router.push('/')}>
//                                 Quay lại trang chủ
//                             </Button>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                             {/* Cart Items List */}
//                             <div className="md:col-span-2 space-y-4">
//                                 {cartItems.map(item => (
//                                     <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
//                                         {item.imageUrl ? (
//                                             <CldImage // Use CldImage for better image optimization
//                                                 src={item.imageUrl}
//                                                 alt={item.name}
//                                                 width={80}
//                                                 height={80}
//                                                 crop="fill" // You might want to adjust crop/gravity
//                                                 className="rounded-md object-cover"
//                                             />
//                                         ) : (
//                                             <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
//                                                 No Image
//                                             </div>
//                                         )}
//                                         <div className="flex-1">
//                                             <h2 className="text-lg font-semibold">{item.name}</h2>
//                                             <p className="text-gray-600">Giá: {formatPrice(item.price)}</p>
//                                             <div className="flex items-center mt-2">
//                                                 <Button
//                                                     size="sm"
//                                                     variant="ghost"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
//                                                     disabled={item.quantity <= 1}
//                                                 >
//                                                     -
//                                                 </Button>
//                                                 <span className="mx-2 text-lg font-medium">{item.quantity}</span>
//                                                 <Button
//                                                     size="sm"
//                                                     variant="ghost"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
//                                                     disabled={item.quantity >= item.stockLevel} // Disable if max stock reached
//                                                 >
//                                                     +
//                                                 </Button>
//                                             </div>
//                                             {item.quantity >= item.stockLevel && (
//                                                 <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
//                                             )}
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="text-lg font-bold">{formatPrice(item.price * item.quantity)}</p>
//                                             <Button
//                                                 variant="ghost"
//                                                 size="sm"
//                                                 color="danger"
//                                                 className="mt-2"
//                                                 onClick={() => handleRemoveItem(item.id)}
//                                             >
//                                                 Xóa
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//
//                             {/* Order Summary */}
//                             <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
//                                 <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
//                                 <div className="flex justify-between items-center mb-2">
//                                     <span className="text-gray-700">Tổng phụ:</span>
//                                     <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
//                                 </div>
//                                 <div className="flex justify-between items-center mb-4">
//                                     <span className="text-gray-700">Phí vận chuyển:</span>
//                                     <span className="font-semibold">Miễn phí</span> {/* Placeholder */}
//                                 </div>
//                                 <Divider />
//                                 <div className="flex justify-between items-center mt-4 text-xl font-bold text-red-600">
//                                     <span>Tổng cộng:</span>
//                                     <span>{formatPrice(calculateSubtotal())}</span>
//                                 </div>
//                                 {/* Modified button for checkout */}
//                                 <Button
//                                     color="primary"
//                                     size="lg"
//                                     className="w-full mt-6"
//                                     onClick={handleProceedToCheckout} // Call the new handler
//                                 >
//                                     Tiến hành thanh toán
//                                 </Button>
//                             </div>
//                         </div>
//                     )}
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }
//


//
//
//
// 'use client';
//
// import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
// import { useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import { CldImage } from 'next-cloudinary';
//
// interface CartItem {
//     id: number;
//     productId: number;
//     productName: string;
//     name: string;
//     price: number;
//     quantity: number;
//     imageUrl: string;
//     sku: string;
//     stockLevel: number;
// }
//
// export default function CartPage() {
//     const router = useRouter();
//     const [cartItems, setCartItems] = useState<CartItem[]>([]);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             const storedCart = localStorage.getItem('cart');
//             if (storedCart) {
//                 setCartItems(JSON.parse(storedCart));
//             }
//         }
//         setLoading(false);
//     }, []);
//
//     useEffect(() => {
//         if (!loading && typeof window !== 'undefined') {
//             localStorage.setItem('cart', JSON.stringify(cartItems));
//         }
//     }, [cartItems, loading]);
//
//
//     const calculateSubtotal = () => {
//         return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
//     };
//
//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('vi-VN', {
//             style: 'currency',
//             currency: 'VND'
//         }).format(price);
//     };
//
//     const handleQuantityChange = (variantId: number, newQuantity: number) => {
//         setCartItems(prevItems => {
//             const updatedItems = prevItems.map(item => {
//                 if (item.id === variantId) {
//                     // Ensure quantity doesn't go below 1 or exceed stock
//                     const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
//                     return { ...item, quantity };
//                 }
//                 return item;
//             });
//             return updatedItems;
//         });
//     };
//
//     const handleRemoveItem = (variantId: number) => {
//         setCartItems(prevItems => prevItems.filter(item => item.id !== variantId));
//     };
//
//     // Function to handle proceeding to checkout
//     const handleProceedToCheckout = () => {
//         // Navigate to the checkout page.
//         // Assuming your checkout page is at the route /checkout
//         router.push('/checkout');
//     };
//
//
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <p>Đang tải giỏ hàng...</p> {/* Simple loading indicator */}
//             </div>
//         );
//     }
//
//     return (
//         <div className={`min-h-screen py-8 px-4 md:px-36`}>
//             <Card className="w-full">
//                 <CardHeader className="flex flex-col items-start">
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => router.back()}
//                         className="text-gray-500 mb-4"
//                     >
//                         &larr; Tiếp tục mua sắm
//                     </Button>
//                     <h1 className="text-3xl font-bold">Giỏ hàng của bạn</h1>
//                     <p className="text-gray-600 mt-2">Bạn có {cartItems.length} sản phẩm trong giỏ hàng.</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     {cartItems.length === 0 ? (
//                         <div className="text-center py-10">
//                             <p className="text-gray-500 text-lg">Giỏ hàng của bạn đang trống.</p>
//                             <Button className="mt-4" onClick={() => router.push('/')}>
//                                 Quay lại trang chủ
//                             </Button>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                             {/* Cart Items List */}
//                             <div className="md:col-span-2 space-y-4">
//                                 {cartItems.map(item => (
//                                     <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
//                                         {item.imageUrl ? (
//                                             <CldImage // Use CldImage for better image optimization
//                                                 src={item.imageUrl}
//                                                 alt={item.name}
//                                                 width={80}
//                                                 height={80}
//                                                 crop="fill" // You might want to adjust crop/gravity
//                                                 className="rounded-md object-cover"
//                                             />
//                                         ) : (
//                                             <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
//                                                 No Image
//                                             </div>
//                                         )}
//                                         <div className="flex-1">
//                                             <h2 className="text-lg font-semibold">{item.name}</h2>
//                                             <p className="text-gray-600">Giá: {formatPrice(item.price)}</p>
//                                             <div className="flex items-center mt-2">
//                                                 <Button
//                                                     size="sm"
//                                                     variant="ghost"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
//                                                     disabled={item.quantity <= 1}
//                                                 >
//                                                     -
//                                                 </Button>
//                                                 <span className="mx-2 text-lg font-medium">{item.quantity}</span>
//                                                 <Button
//                                                     size="sm"
//                                                     variant="ghost"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
//                                                     disabled={item.quantity >= item.stockLevel} // Disable if max stock reached
//                                                 >
//                                                     +
//                                                 </Button>
//                                             </div>
//                                             {item.quantity >= item.stockLevel && (
//                                                 <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
//                                             )}
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="text-lg font-bold">{formatPrice(item.price * item.quantity)}</p>
//                                             <Button
//                                                 variant="ghost"
//                                                 size="sm"
//                                                 color="danger"
//                                                 className="mt-2"
//                                                 onClick={() => handleRemoveItem(item.id)}
//                                             >
//                                                 Xóa
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//
//                             {/* Order Summary */}
//                             <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
//                                 <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
//                                 <div className="flex justify-between items-center mb-2">
//                                     <span className="text-gray-700">Tổng phụ:</span>
//                                     <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
//                                 </div>
//                                 <div className="flex justify-between items-center mb-4">
//                                     <span className="text-gray-700">Phí vận chuyển:</span>
//                                     <span className="font-semibold">Miễn phí</span> {/* Placeholder */}
//                                 </div>
//                                 <Divider />
//                                 <div className="flex justify-between items-center mt-4 text-xl font-bold text-red-600">
//                                     <span>Tổng cộng:</span>
//                                     <span>{formatPrice(calculateSubtotal())}</span>
//                                 </div>
//                                 {/* Modified button for checkout */}
//                                 <Button
//                                     color="primary"
//                                     size="lg"
//                                     className="w-full mt-6"
//                                     onClick={handleProceedToCheckout} // Call the new handler
//                                 >
//                                     Tiến hành thanh toán
//                                 </Button>
//                             </div>
//                         </div>
//                     )}
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }
//

//
// 'use client';
//
// import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
// import { useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import { CldImage } from 'next-cloudinary';
// import Link from 'next/link';
//
// interface CartItem {
//     id: number; // Đây là variantId
//     productId: number; // ID của sản phẩm chính
//     productName: string;
//     name: string;
//     price: number;
//     quantity: number;
//     imageUrl: string;
//     sku: string;
//     stockLevel: number;
// }
//
// export default function CartPage() {
//     const router = useRouter();
//     const [cartItems, setCartItems] = useState<CartItem[]>([]);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             const storedCart = localStorage.getItem('cart');
//             if (storedCart) {
//                 setCartItems(JSON.parse(storedCart));
//             }
//         }
//         setLoading(false);
//     }, []);
//
//     useEffect(() => {
//         if (!loading && typeof window !== 'undefined') {
//             localStorage.setItem('cart', JSON.stringify(cartItems));
//         }
//     }, [cartItems, loading]);
//
//     const calculateSubtotal = () => {
//         return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
//     };
//
//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('vi-VN', {
//             style: 'currency',
//             currency: 'VND'
//         }).format(price);
//     };
//
//     const handleQuantityChange = (variantId: number, newQuantity: number) => {
//         setCartItems(prevItems => {
//             const updatedItems = prevItems.map(item => {
//                 if (item.id === variantId) {
//                     const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
//                     return { ...item, quantity };
//                 }
//                 return item;
//             });
//             return updatedItems;
//         });
//     };
//
//     const handleRemoveItem = (variantId: number) => {
//         if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
//             setCartItems(prevItems => prevItems.filter(item => item.id !== variantId));
//         }
//     };
//
//     const handleProceedToCheckout = () => {
//         router.push('/checkout');
//     };
//
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <p>Đang tải giỏ hàng...</p>
//             </div>
//         );
//     }
//
//     return (
//         <div className={`min-h-screen bg-gray-50 py-8 px-4 md:px-36`}>
//             <Card className="w-full shadow-lg rounded-xl">
//                 <CardHeader className="flex flex-col items-start p-6">
//                     {/* THAY ĐỔI Ở ĐÂY: Dùng Link để quay về trang chủ */}
//                     <Link
//                         href="/"
//                         className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 text-sm font-medium"
//                     >
//                         &larr; Tiếp tục mua sắm
//                     </Link>
//                     <h1 className="text-3xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
//                     <p className="text-gray-500 mt-2">Bạn có {cartItems.length} sản phẩm trong giỏ hàng.</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody className="p-0 md:p-6">
//                     {cartItems.length === 0 ? (
//                         <div className="text-center py-20 px-6">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
//                             </svg>
//                             <p className="text-gray-600 text-lg mt-4">Giỏ hàng của bạn đang trống.</p>
//                             <Button className="mt-6" color="primary" onClick={() => router.push('/')}>
//                                 Bắt đầu mua sắm
//                             </Button>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                             {/* Cart Items List */}
//                             <div className="lg:col-span-2 space-y-6">
//                                 {cartItems.map(item => (
//                                     <div key={item.id} className="flex space-x-4 border-b border-gray-200 pb-6 last:border-b-0">
//                                         <Link href={`/products/${item.productId}`} className="flex-shrink-0">
//                                             {item.imageUrl ? (
//                                                 <CldImage
//                                                     src={item.imageUrl}
//                                                     alt={item.name}
//                                                     width={100}
//                                                     height={100}
//                                                     crop="fill"
//                                                     className="rounded-md object-cover hover:opacity-80 transition-opacity"
//                                                 />
//                                             ) : (
//                                                 <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
//                                                     No Image
//                                                 </div>
//                                             )}
//                                         </Link>
//                                         <div className="flex-1 flex flex-col justify-between">
//                                             <div>
//                                                 <Link href={`/products/${item.productId}`}>
//                                                     <h2 className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors">{item.name}</h2>
//                                                 </Link>
//                                                 <p className="text-gray-600 text-sm mt-1">Giá: {formatPrice(item.price)}</p>
//                                                 {item.quantity >= item.stockLevel && (
//                                                     <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
//                                                 )}
//                                             </div>
//                                             <div className="flex items-center mt-2">
//                                                 <Button
//                                                     size="sm"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
//                                                     disabled={item.quantity <= 1}
//                                                 >
//                                                     -
//                                                 </Button>
//                                                 <span className="mx-3 text-base font-medium">{item.quantity}</span>
//                                                 <Button
//                                                     size="sm"
//                                                     onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
//                                                     disabled={item.quantity >= item.stockLevel}
//                                                 >
//                                                     +
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                         <div className="text-right flex flex-col justify-between items-end">
//                                             <p className="text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
//                                             <Button
//                                                 variant="ghost"
//                                                 size="sm"
//                                                 color="danger"
//                                                 className="mt-2 text-xs"
//                                                 onClick={() => handleRemoveItem(item.id)}
//                                             >
//                                                 Xóa
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//
//                             {/* Order Summary */}
//                             <div className="lg:col-span-1 bg-white lg:bg-gray-100 p-6 rounded-lg lg:shadow-sm">
//                                 <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>
//                                 <div className="space-y-4">
//                                     <div className="flex justify-between items-center text-gray-700">
//                                         <span>Tạm tính:</span>
//                                         <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
//                                     </div>
//                                     <div className="flex justify-between items-center text-gray-700">
//                                         <span>Phí vận chuyển:</span>
//                                         <span className="font-semibold text-sm">Sẽ được tính ở bước sau</span>
//                                     </div>
//                                     <Divider className="my-4"/>
//                                     <div className="flex justify-between items-center mt-4 text-xl font-bold">
//                                         <span className="text-gray-800">Tổng cộng:</span>
//                                         <span className="text-primary-600">{formatPrice(calculateSubtotal())}</span>
//                                     </div>
//                                     <Button
//                                         color="primary"
//                                         size="lg"
//                                         className="w-full mt-6"
//                                         onClick={handleProceedToCheckout}
//                                     >
//                                         Tiến hành thanh toán
//                                     </Button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }

'use client';

import { Card, CardHeader, CardBody, Divider, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';

interface CartItem {
    id: number; // Đây là variantId
    productId: number; // ID của sản phẩm chính
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

    // --- THAY ĐỔI 1: THÊM HÀM TÍNH TỔNG SỐ LƯỢNG SẢN PHẨM ---
    // Hàm này sẽ tính tổng số lượng của tất cả các mặt hàng cộng lại.
    // Ví dụ: 2 áo + 1 quần = 3 sản phẩm.
    const calculateTotalQuantity = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
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
                    const quantity = Math.max(1, Math.min(newQuantity, item.stockLevel));
                    return { ...item, quantity };
                }
                return item;
            });
            return updatedItems;
        });
    };

    const handleRemoveItem = (variantId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== variantId));
        }
    };

    const handleProceedToCheckout = () => {
        router.push('/checkout');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Đang tải giỏ hàng...</p>
            </div>
        );
    }

    // Lấy tổng số lượng để hiển thị
    const totalQuantity = calculateTotalQuantity();

    return (
        <div className={`min-h-screen bg-gray-50 py-8 px-4 md:px-36`}>
            <Card className="w-full shadow-lg rounded-xl">
                <CardHeader className="flex flex-col items-start p-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4 text-sm font-medium"
                    >
                        &larr; Tiếp tục mua sắm
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
                    {/* --- THAY ĐỔI 2: CẬP NHẬT LẠI CÁCH HIỂN THỊ --- */}
                    {/* Hiển thị cả số loại sản phẩm (items.length) và tổng số lượng (totalQuantity) */}
                    <p className="text-gray-500 mt-2">
                        {cartItems.length > 0
                            ? `Bạn có ${cartItems.length} loại sản phẩm trong giỏ (tổng cộng ${totalQuantity} sản phẩm).`
                            : "Giỏ hàng của bạn đang trống."
                        }
                    </p>
                </CardHeader>
                <Divider />
                <CardBody className="p-0 md:p-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-gray-600 text-lg mt-4">Giỏ hàng của bạn đang trống.</p>
                            <Button className="mt-6" color="primary" onClick={() => router.push('/')}>
                                Bắt đầu mua sắm
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items List */}
                            <div className="lg:col-span-2 space-y-6">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex space-x-4 border-b border-gray-200 pb-6 last:border-b-0">
                                        <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                                            {item.imageUrl ? (
                                                <CldImage
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    width={100}
                                                    height={100}
                                                    crop="fill"
                                                    className="rounded-md object-cover hover:opacity-80 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                    No Image
                                                </div>
                                            )}
                                        </Link>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <Link href={`/products/${item.productId}`}>
                                                    <h2 className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors">{item.name}</h2>
                                                </Link>
                                                <p className="text-gray-600 text-sm mt-1">Giá: {formatPrice(item.price)}</p>
                                                {item.quantity >= item.stockLevel && (
                                                    <p className="text-red-500 text-xs mt-1">Đã đạt số lượng tối đa trong kho!</p>
                                                )}
                                            </div>
                                            <div className="flex items-center mt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </Button>
                                                <span className="mx-3 text-base font-medium">{item.quantity}</span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stockLevel}
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-between items-end">
                                            <p className="text-lg font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                color="danger"
                                                className="mt-2 text-xs"
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1 bg-white lg:bg-gray-100 p-6 rounded-lg lg:shadow-sm">
                                <h2 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Tạm tính:</span>
                                        <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Phí vận chuyển:</span>
                                        <span className="font-semibold text-sm">Sẽ được tính ở bước sau</span>
                                    </div>
                                    <Divider className="my-4"/>
                                    <div className="flex justify-between items-center mt-4 text-xl font-bold">
                                        <span className="text-gray-800">Tổng cộng:</span>
                                        <span className="text-primary-600">{formatPrice(calculateSubtotal())}</span>
                                    </div>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="w-full mt-6"
                                        onClick={handleProceedToCheckout}
                                    >
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