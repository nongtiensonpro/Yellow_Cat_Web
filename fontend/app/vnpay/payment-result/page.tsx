'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (!searchParams) return;
        
        const responseCode = searchParams.get('vnp_ResponseCode');
        const amount = searchParams.get('vnp_Amount');
        const orderInfo = searchParams.get('vnp_OrderInfo');
        const transactionNo = searchParams.get('vnp_TransactionNo');

        setResult({
            success: responseCode === '00',
            amount: amount ? parseInt(amount) / 100 : 0,
            orderInfo,
            transactionNo,
        });
    }, [searchParams]);

    if (!result) return null;

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className={`p-4 rounded-lg shadow-md text-center ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <div className="flex items-center justify-center">
                        {result.success ? (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    <h2 className={`text-2xl font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
                    </h2>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số tiền:</span>
                            <span className="font-medium">{result.amount.toLocaleString('vi-VN')} VND</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã giao dịch:</span>
                            <span className="font-medium">{result.transactionNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Nội dung:</span>
                            <span className="font-medium">{result.orderInfo}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <Link
                            href="/staff/officesales"
                            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${result.success ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            Quay lại trang thanh toán
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}