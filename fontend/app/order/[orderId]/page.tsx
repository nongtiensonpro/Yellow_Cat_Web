"use client";

export default function App(){
    return(
        <section>
            Meo Meo
        </section>
    )
}


// import { useState, useEffect } from 'react';
//
// // Định nghĩa một LoadingSpinner đơn giản ngay trong file này để tránh lỗi import
// const LoadingSpinner = () => (
//     <div className="flex justify-center items-center h-48">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//         <p className="ml-4 text-gray-700 dark:text-gray-300">Đang tải...</p>
//     </div>
// );
//
// // Định nghĩa interface cho từng mặt hàng trong đơn hàng
// interface OrderItem {
//     id: number;
//     productName: string; // Tên sản phẩm
//     quantity: number;    // Số lượng
//     price: number;       // Giá đơn vị
//     totalPrice: number;  // Tổng giá cho mặt hàng này (quantity * price)
//     imageUrl?: string;   // URL hình ảnh sản phẩm (nếu có)
// }
//
// // Định nghĩa interface cho địa chỉ giao hàng
// interface AddressDetails {
//     street: string;
//     ward: string;
//     district: string;
//     province: string;
//     country: string;
//     receiverName: string; // Tên người nhận
//     phoneNumber: string;  // Số điện thoại người nhận
// }
//
// // Định nghĩa interface cho thông tin thanh toán (có thể có nhiều phương thức)
// interface PaymentDetails {
//     paymentMethod: string; // Ví dụ: "COD", "Bank Transfer", "Credit Card"
//     status: string;        // Ví dụ: "Completed", "Pending"
//     amount: number;
// }
//
// // Định nghĩa interface chính cho chi tiết đơn hàng, ánh xạ từ Java Order entity
// interface OrderDetails {
//     orderCode: string; // Mã đơn hàng (được dùng làm orderId trong URL)
//     orderDate: string; // Ngày đặt hàng (LocalDateTime sẽ được stringify từ backend)
//     expectedDeliveryDate?: string; // Ngày dự kiến nhận hàng (có thể lấy từ Shipment hoặc tính toán)
//     subTotalAmount: number; // Tổng tiền trước khi áp dụng phí ship và giảm giá
//     shippingFee: number; // Phí vận chuyển
//     discountAmount: number; // Số tiền giảm giá
//     finalAmount: number; // Tổng tiền cuối cùng
//     orderStatus: string; // Trạng thái đơn hàng (ví dụ: "Pending", "Confirmed", "Delivering", "Completed", "Cancelled")
//     customerNotes?: string; // Ghi chú của khách hàng
//     shippingMethodName?: string; // Tên phương thức vận chuyển (ví dụ: "GHTK", "GHN")
//     shippingAddress: AddressDetails; // Thông tin địa chỉ giao hàng
//     orderItems: OrderItem[]; // Danh sách các mặt hàng trong đơn hàng
//     payments: PaymentDetails[]; // Danh sách các khoản thanh toán
// }
//
// // Định nghĩa props cho trang này (dùng cho Next.js App Router)
// interface OrderDetailsPageProps {
//     params: {
//         orderId: string; // Next.js App Router sẽ truyền giá trị động từ URL vào đây.
//                          // Trong trường hợp của bạn, đây là orderCode từ backend.
//     };
// }
//
// export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
//     // Safely get orderCodeFromUrl, defaulting to empty string if params or params.orderId is undefined
//     const orderCodeFromUrl = params?.orderId || '';
//     const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//
//     useEffect(() => {
//         const fetchOrderDetails = async () => {
//             setLoading(true);
//             setError(null);
//             if (!orderCodeFromUrl) {
//                 setError("Không có mã đơn hàng để hiển thị.");
//                 setLoading(false);
//                 return;
//             }
//
//             try {
//                 // Đây là nơi bạn sẽ gọi API backend của mình.
//                 // Giả định API endpoint là /api/orders/{orderCode}
//                 const response = await fetch(`/api/orders/${orderCodeFromUrl}`);
//
//                 if (!response.ok) {
//                     // Nếu response không OK (ví dụ: 404 Not Found, 500 Internal Server Error)
//                     const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định.' }));
//                     throw new Error(`Không thể tải chi tiết đơn hàng: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
//                 }
//
//                 const data: OrderDetails = await response.json();
//                 setOrderDetails(data);
//
//             } catch (err: any) {
//                 console.error("Lỗi khi tải chi tiết đơn hàng:", err);
//                 setError(`Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau. Chi tiết: ${err.message || err}`);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchOrderDetails();
//     }, [orderCodeFromUrl]); // Re-fetch khi orderCodeFromUrl thay đổi
//
//     if (loading) {
//         return <LoadingSpinner />;
//     }
//
//     if (error) {
//         return (
//             <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mx-auto max-w-2xl mt-8">
//                 <p className="font-semibold mb-2">Đã xảy ra lỗi:</p>
//                 <p>{error}</p>
//                 <button
//                     className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//                     onClick={() => window.location.reload()}
//                 >
//                     Thử lại
//                 </button>
//             </div>
//         );
//     }
//
//     if (!orderDetails) {
//         return (
//             <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md mx-auto max-w-2xl mt-8">
//                 <p>Không tìm thấy thông tin chi tiết đơn hàng.</p>
//             </div>
//         );
//     }
//
//     return (
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-3xl mx-auto my-8 font-inter">
//             <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center">Chi tiết đơn hàng</h2>
//
//             {/* Mã đơn hàng và trạng thái */}
//             <div className="flex justify-between items-center mb-6 p-4 border-b border-gray-200 dark:border-gray-700">
//                 <p className="text-xl font-semibold text-gray-800 dark:text-white">Mã đơn hàng: {orderDetails.orderCode}</p>
//                 <span className={`px-4 py-2 rounded-full text-base font-medium
//                     ${orderDetails.orderStatus === "Chờ xác nhận" ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
//                     orderDetails.orderStatus === "Đang vận chuyển" ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
//                         orderDetails.orderStatus === "Hoàn thành" ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
//                             orderDetails.orderStatus === "Đã hủy" ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
//                                 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
//                     {orderDetails.orderStatus}
//                 </span>
//             </div>
//
//             {/* Thông tin thời gian */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                 <div>
//                     <span className="font-semibold text-gray-600 dark:text-gray-300">Ngày đặt hàng: </span>
//                     <span className="text-gray-800 dark:text-white">{orderDetails.orderDate}</span>
//                 </div>
//                 {orderDetails.expectedDeliveryDate && (
//                     <div>
//                         <span className="font-semibold text-gray-600 dark:text-gray-300">Ngày dự kiến nhận: </span>
//                         <span className="text-gray-800 dark:text-white">{orderDetails.expectedDeliveryDate}</span>
//                     </div>
//                 )}
//             </div>
//
//             {/* Chi tiết giá */}
//             <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                 <div className="flex justify-between items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300">Tiền hàng:</span>
//                     <span className="text-gray-800 dark:text-white">{orderDetails.subTotalAmount.toLocaleString('vi-VN')} VND</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300">Phí vận chuyển:</span>
//                     <span className="text-gray-800 dark:text-white">{orderDetails.shippingFee.toLocaleString('vi-VN')} VND</span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300">Giảm giá:</span>
//                     <span className="text-gray-800 dark:text-white">-{orderDetails.discountAmount.toLocaleString('vi-VN')} VND</span>
//                 </div>
//                 <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600 font-bold text-xl">
//                     <span className="text-gray-800 dark:text-white">Tổng cộng:</span>
//                     <span className="text-red-600 dark:text-red-400">{orderDetails.finalAmount.toLocaleString('vi-VN')} VND</span>
//                 </div>
//             </div>
//
//             {/* Thông tin vận chuyển và thanh toán */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Địa chỉ giao hàng</h3>
//                     <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                         <p className="text-gray-800 dark:text-white font-medium">{orderDetails.shippingAddress.receiverName} ({orderDetails.shippingAddress.phoneNumber})</p>
//                         <p className="text-gray-600 dark:text-gray-300">{orderDetails.shippingAddress.street}, {orderDetails.shippingAddress.ward}, {orderDetails.shippingAddress.district}, {orderDetails.shippingAddress.province}, {orderDetails.shippingAddress.country}</p>
//                     </div>
//                 </div>
//                 <div>
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Phương thức thanh toán</h3>
//                     {orderDetails.payments && orderDetails.payments.length > 0 ? (
//                         <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
//                             {orderDetails.payments.map((payment, index) => (
//                                 <p key={index} className="text-gray-800 dark:text-white">
//                                     <span className="font-medium">{payment.paymentMethod}</span> - <span className="text-sm text-gray-600 dark:text-gray-300">{payment.status}</span> ({payment.amount.toLocaleString('vi-VN')} VND)
//                                 </p>
//                             ))}
//                         </div>
//                     ) : (
//                         <p className="text-gray-600 dark:text-gray-300">Chưa có thông tin thanh toán.</p>
//                     )}
//                     {orderDetails.shippingMethodName && (
//                         <div className="mt-4">
//                             <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Phương thức vận chuyển</h3>
//                             <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                                 <p className="text-gray-800 dark:text-white font-medium">{orderDetails.shippingMethodName}</p>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//
//             {/* Danh sách sản phẩm */}
//             <div className="mb-6">
//                 <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Sản phẩm trong đơn hàng</h3>
//                 {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
//                     <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                         {orderDetails.orderItems.map((item, index) => (
//                             <div key={index} className="flex items-center mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0 border-gray-200 dark:border-gray-600">
//                                 {item.imageUrl && (
//                                     <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 object-cover rounded-md mr-4"
//                                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://placehold.co/64x64/E0E0E0/808080?text=No+Image`; }}/>
//                                 )}
//                                 <div className="flex-grow">
//                                     <p className="font-medium text-gray-800 dark:text-white">{item.productName}</p>
//                                     <p className="text-sm text-gray-600 dark:text-gray-300">
//                                         Giá: {item.price.toLocaleString('vi-VN')} VND x {item.quantity}
//                                     </p>
//                                 </div>
//                                 <span className="font-semibold text-gray-800 dark:text-white">
//                                     {(item.quantity * item.price).toLocaleString('vi-VN')} VND
//                                 </span>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <p className="text-gray-600 dark:text-gray-300">Không có sản phẩm nào trong đơn hàng này.</p>
//                 )}
//             </div>
//
//             {/* Ghi chú của khách hàng */}
//             {orderDetails.customerNotes && (
//                 <div className="mb-6">
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Ghi chú</h3>
//                     <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                         <p className="text-gray-600 dark:text-gray-300 italic">{orderDetails.customerNotes}</p>
//                     </div>
//                 </div>
//             )}
//
//             {/* Thanh điều hướng trạng thái (có thể là một component riêng) */}
//             <div className="flex flex-wrap justify-center border-t border-gray-200 dark:border-gray-700 pt-6 gap-2">
//                 <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-md">
//                     TẤT CẢ
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md">
//                     ĐÃ HỦY
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md">
//                     CHỜ XÁC NHẬN
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md">
//                     ĐÃ XÁC NHẬN
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md">
//                     ĐANG VẬN CHUYỂN
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md">
//                     HOÀN THÀNH
//                 </button>
//             </div>
//         </div>
//     );
// }
