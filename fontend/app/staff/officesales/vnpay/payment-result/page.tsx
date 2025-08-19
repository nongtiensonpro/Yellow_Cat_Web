'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PaymentResponse {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paymentStatus: string;
}

interface OrderDetailResponse {
    orderId: number;
    orderCode: string;
    phoneNumber: string;
    customerName: string;
    subTotalAmount: number;
    discountAmount: number;
    finalAmount: number;
    orderStatus: string;
    payments: PaymentResponse[];
}

interface OrderItem {
    orderItemId: number | string;
    productVariantId?: number;
    productName?: string;
    variantInfo?: string;
    quantity: number;
    priceAtPurchase: number;
    totalPrice: number;
    bestPromo?: {
        promotionCode: string;
        promotionName: string;
        discountAmount: number;
    };
    originalPrice?: number;
}

// Interface cho VNPay payment result
interface VNPayResult {
    success: boolean;
    amount: number;
    orderInfo: string | null;
    transactionNo: string | null;
}

// Extend Session type để có accessToken
interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const POLLING_INTERVAL = 2000;
const MAX_POLLING_ATTEMPTS = 6;

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [result, setResult] = useState<VNPayResult | null>(null);
    const [orderData, setOrderData] = useState<OrderDetailResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State quản lý luồng
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationComplete, setConfirmationComplete] = useState(false);
    const [hasInitiated, setHasInitiated] = useState(false);
    const [countdown, setCountdown] = useState(10);

    // Hàm confirm payment với backend (chỉ gọi một lần)**
    const confirmPaymentWithBackend = async (orderCode: string, transactionId: string, token: string): Promise<boolean> => {
        try {
            console.log('🚀 Confirming payment with backend:', { orderCode, transactionId });
            
            const response = await fetch(`http://localhost:8080/api/orders/vnpay-confirm/${orderCode}?transactionId=${transactionId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            console.log('📥 Confirm response status:', response.status);
            console.log('📥 Confirm response OK:', response.ok);
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Payment confirmation error:", errorBody);
                throw new Error(`Lỗi xác nhận thanh toán: ${response.status} - ${errorBody}`);
            }
            
            const data = await response.json();
            console.log('✅ Payment confirmed successfully:', data);
            console.log('📊 Confirmed order status:', data.data?.orderStatus);
            return true;
        } catch (err) {
            console.error('❌ Lỗi khi xác nhận thanh toán:', err);
            throw err;
        }
    };

    // Hàm check status đơn hàng (dùng cho polling)**
    const getOrderStatus = async (orderCode: string, token: string): Promise<OrderDetailResponse | null> => {
        try {
            const response = await fetch(`http://localhost:8080/api/orders/status/${orderCode}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (!response.ok) {
                const errorBody = await response.text();
                console.error("API Error Response:", errorBody);
                throw new Error(`Lỗi từ máy chủ: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🔍 Full API Response:', data);
            console.log('📊 Order Data:', data.data);
            console.log('📈 Order Status:', data.data?.orderStatus);
            console.log('💳 Payments:', data.data?.payments);

            return data.data as OrderDetailResponse;
        } catch (err) {
            console.error('Lỗi khi lấy trạng thái đơn hàng:', err);
            throw err;
        }
    };



    // Logic xác nhận và polling trạng thái**
    const handlePaymentConfirmation = useCallback(async (orderCode: string, transactionId: string, token: string) => {
        setIsConfirming(true);
        setError(null);

        try {
            // Bước 1: Confirm payment với backend (chỉ một lần)
            console.log('Bước 1: Xác nhận thanh toán với backend...');
            await confirmPaymentWithBackend(orderCode, transactionId, token);
            
            // Bước 2: Polling để check status cập nhật
            console.log('Bước 2: Bắt đầu polling để kiểm tra trạng thái...');
            for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
                console.log(`Đang kiểm tra trạng thái đơn hàng... Lần thử ${attempt}`);
                
                const order = await getOrderStatus(orderCode, token);
                console.log(`🎯 Attempt ${attempt} - Order received:`, order);
                console.log(`🎯 Order Status: "${order?.orderStatus}" (type: ${typeof order?.orderStatus})`);
                console.log(`🎯 Status check: Paid=${order?.orderStatus === 'Paid'}`);
                
                setOrderData(order); // Cập nhật UI ngay cả khi đang chờ

                // Điều kiện thành công: trạng thái là 'Paid'
                if (order && order.orderStatus === 'Paid') {
                    console.log('✅ Xác nhận thành công! Trạng thái:', order.orderStatus);
                    
                    setIsConfirming(false);
                    setConfirmationComplete(true);
                    
                    // Chuyển hướng đến InvoiceView sau 3 giây để người dùng có thể đọc thông tin
                    setTimeout(() => {
                        console.log('🚀 Chuyển hướng đến InvoiceView với order:', order.orderCode);
                        router.push(`/staff/officesales?viewOrder=${order.orderCode}`);
                    }, 3000);
                    
                    return; // Thoát khỏi hàm
                } else {
                    console.log(`❌ Attempt ${attempt} failed - Status: "${order?.orderStatus}", Order exists: ${!!order}`);
                }

                // Nếu chưa phải lần thử cuối, đợi và thử lại
                if (attempt < MAX_POLLING_ATTEMPTS) {
                    console.log(`⏰ Waiting ${POLLING_INTERVAL/1000}s before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                }
            }

            // Nếu thoát khỏi vòng lặp mà chưa return, nghĩa là đã hết số lần thử
            console.log('💥 All polling attempts failed - throwing timeout error');
            throw new Error('Hệ thống chưa cập nhật trạng thái thanh toán. Vui lòng kiểm tra lại sau hoặc liên hệ hỗ trợ.');

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý thanh toán với hệ thống.';
            console.error('❌ Lỗi trong quá trình xử lý thanh toán:', err);
            console.error('❌ Error type:', typeof err);
            console.error('❌ Error message:', errorMessage);
            setError(errorMessage);
        } finally {
            // Dù thành công hay thất bại, đều phải kết thúc luồng xác nhận
            console.log('🏁 Payment confirmation process finished');
            setIsConfirming(false);
            setConfirmationComplete(true);
        }
    }, []);

    // **FIXED: useEffect chính để khởi chạy logic**
    useEffect(() => {
        const extendedSession = session as ExtendedSession | null;
        
        if (hasInitiated || !searchParams || !extendedSession?.accessToken) {
            if (!session) setIsLoading(true);
            else setIsLoading(false);
            return;
        }
        setHasInitiated(true);

        const responseCode = searchParams.get('vnp_ResponseCode');
        const amount = searchParams.get('vnp_Amount');
        const orderInfo = searchParams.get('vnp_OrderInfo'); // orderCode
        const transactionNo = searchParams.get('vnp_TransactionNo'); // transactionId from VNPay

        console.log('VNPay callback params:', { responseCode, amount, orderInfo, transactionNo });

        const paymentResult: VNPayResult = {
            success: responseCode === '00',
            amount: amount ? parseInt(amount) / 100 : 0,
            orderInfo,
            transactionNo,
        };
        setResult(paymentResult);

        if (paymentResult.success && orderInfo && transactionNo) {
            // Giao dịch VNPay thành công → Bắt đầu quá trình xác nhận với backend
            console.log('✅ VNPay callback thành công, bắt đầu xác nhận với backend...');
            handlePaymentConfirmation(orderInfo, transactionNo, extendedSession.accessToken);
        } else {
            // Giao dịch tại VNPay thất bại hoặc thiếu thông tin
            console.log('❌ VNPay callback thất bại hoặc thiếu thông tin');
            const errorMsg = paymentResult.success 
                ? 'Thiếu thông tin giao dịch từ VNPay (orderInfo hoặc transactionNo)'
                : (searchParams.get('vnp_Message') || 'Giao dịch tại cổng VNPay đã bị hủy hoặc thất bại.');
            setError(errorMsg);
            setConfirmationComplete(true); // Cho phép chuyển trang
        }

        setIsLoading(false);
    }, [searchParams, session, hasInitiated, handlePaymentConfirmation]);

    // useEffect cho countdown và chuyển trang
    useEffect(() => {
        if (confirmationComplete && !(result?.success && !error && orderData)) {
            const timer = setInterval(() => {
                setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
            }, 1000);

            // Tự động chuyển trang khi countdown về 0
            if (countdown === 0) {
                clearInterval(timer);
                router.push('/staff/officesales');
            }

            return () => clearInterval(timer);
        }
    }, [confirmationComplete, countdown, router, result, error, orderData]);

    // Cảnh báo người dùng không đóng tab khi đang xác nhận
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isConfirming) {
                e.preventDefault();
                e.returnValue = 'Đang xác nhận thanh toán, việc đóng trang có thể làm bạn không nhận được kết quả cuối cùng. Vui lòng chờ!';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isConfirming]);


    // ----- PHẦN RENDER -----

    if (isLoading && !result) {
        return <div className="min-h-screen flex items-center justify-center"><p>Đang tải thông tin thanh toán...</p></div>;
    }

    if (!result) {
        return <div className="min-h-screen flex items-center justify-center"><p>Không tìm thấy thông tin thanh toán.</p></div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
            <div className="max-w-2xl w-full space-y-8">
                <div className={`p-6 rounded-lg shadow-md ${result.success && !error ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-center mb-6">
                        {/* Icon thành công / thất bại */}
                        <div className="flex items-center justify-center mb-4">
                            {result.success && !error ? (
                                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>

                        {/* Tiêu đề chính */}
                        <h2 className={`text-3xl font-bold mb-2 ${result.success && !error ? 'text-green-800' : 'text-red-800'}`}>
                            {result.success && !error ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
                        </h2>

                        {/* Trạng thái xử lý & countdown */}
                        {isConfirming ? (
                            <p className="text-lg text-yellow-800 mb-6">Đang xác nhận với hệ thống, vui lòng chờ...</p>
                        ) : result.success && !error && orderData ? (
                            <div className="text-center">
                                <p className="text-lg text-green-600 mb-2">🎉 Thanh toán hoàn tất!</p>
                                <p className="text-sm text-gray-500 mb-4">Sẽ tự động chuyển đến trang chi tiết đơn hàng trong vài giây...</p>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-center mb-2">
                                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-green-800 font-medium">Đơn hàng #{orderData.orderCode}</span>
                                    </div>
                                    <p className="text-sm text-green-700">Bạn có thể xem chi tiết và in hóa đơn ở trang tiếp theo</p>
                                </div>
                                <div className="flex justify-center items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-gray-600">Đang chuyển hướng...</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-lg text-gray-600 mb-6">Tự động chuyển hướng sau {countdown} giây</p>
                        )}
                    </div>

                    {/* Thông tin giao dịch VNPay */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Thông tin giao dịch</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Mã đơn hàng:</span>
                                <span className="font-medium">{result.orderInfo || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số giao dịch:</span>
                                <span className="font-medium">{result.transactionNo || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số tiền:</span>
                                <span className="font-medium">{result.amount?.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phương thức:</span>
                                <span className="font-medium">VNPay</span>
                            </div>
                        </div>
                    </div>

                    {/* Hiển thị lỗi nếu có */}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                            <p className="font-bold">Đã xảy ra lỗi</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Thông tin đơn hàng (hiển thị trạng thái mới nhất) */}
                    {orderData && (
                        <div className="bg-white rounded-lg p-4 mb-6 border">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Thông tin đơn hàng cập nhật</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã đơn hàng:</span>
                                    <span className="font-medium">{orderData.orderCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Khách hàng:</span>
                                    <span className="font-medium">{orderData.customerName || 'Khách lẻ'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Số điện thoại:</span>
                                    <span className="font-medium">{orderData.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tổng tiền:</span>
                                    <span className="font-medium">{orderData.finalAmount?.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            </div>
                            
                            {/* Trạng thái đơn hàng */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Trạng thái đơn hàng:</span>
                                <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                                    orderData.orderStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                        orderData.orderStatus === 'Pending' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                    {
                                        orderData.orderStatus === 'Paid' ? 'Đã thanh toán' :
                                            orderData.orderStatus === 'Pending' ? 'Chờ thanh toán' : orderData.orderStatus
                                    }
                                </span>
                            </div>

                            {/* Thông tin thanh toán */}
                            {orderData.payments && orderData.payments.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-800 mb-3">Chi tiết thanh toán:</h4>
                                    <div className="space-y-2">
                                        {orderData.payments.map((payment, index) => (
                                            <div key={payment.paymentId || index} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-600">{payment.paymentMethod}:</span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        payment.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                            payment.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {payment.paymentStatus === 'COMPLETED' ? 'Hoàn thành' :
                                                         payment.paymentStatus === 'PENDING' ? 'Chờ xử lý' : payment.paymentStatus}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{payment.amount?.toLocaleString('vi-VN')} VNĐ</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Nút bấm */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {/* Nút chuyển ngay đến InvoiceView khi thanh toán thành công */}
                        {result.success && !error && orderData && (
                            <button
                                onClick={() => router.push(`/staff/officesales?viewOrder=${orderData.orderCode}`)}
                                className="px-8 py-3 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                            >
                                📋 Xem chi tiết đơn hàng
                            </button>
                        )}

                        <button
                            onClick={() => router.push('/staff/officesales')}
                            className="px-8 py-3 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 transition-colors duration-200"
                            disabled={isConfirming} // Vô hiệu hóa khi đang xác nhận
                        >
                            {isConfirming ? 'Đang xử lý...' : 
                             result.success && !error && orderData ? 
                             'Quay về trang bán hàng' : 
                             `Quay về ngay (${countdown}s)`}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}