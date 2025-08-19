
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/outline';

interface OrderDTO {
    orderId: number;
    orderCode: string;
    customerName: string | null;
    phoneNumber: string | null;
    orderType?: string;
    orderDate?: string;
    finalAmount: number;
    orderStatus: string;
}

const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipped: 'Đang vận chuyển',
    Delivered: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
    Paid: 'Đã thanh toán',
};

const TABS = [{ label: 'Đã thanh toán', value: 'Paid' }];
const DEBOUNCE_MS = 400;

// Bạn có thể thay base URL bằng biến môi trường nếu muốn
const BASE_API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export default function OrderListPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const newOrderCode = searchParams?.get('newOrderCode') || null;

    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [status, setStatus] = useState('Paid');
    const [keyword, setKeyword] = useState('');
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<number | null>(null);
    const latestFetchRef = useRef<AbortController | null>(null);

    const buildUrl = (targetPage: number, kw: string, st: string) => {
        const params = new URLSearchParams({
            page: targetPage.toString(),
            size: '10',
        });

        if (kw) {
            params.append('orderCode', kw);
            params.append('customerName', kw);
            params.append('phoneNumber', kw);
            return `${BASE_API}/api/orders/search/simple?${params.toString()}`;
        } else {
            params.append('status', st);
            return `${BASE_API}/api/orders/status?${params.toString()}`;
        }
    };

    const loadOrders = useCallback(
        async (targetPage: number, kw: string, st: string) => {
            if (!session?.accessToken) return;
            if (latestFetchRef.current) {
                latestFetchRef.current.abort();
            }
            const controller = new AbortController();
            latestFetchRef.current = controller;

            setIsLoadingOrders(true);
            setError(null);

            try {
                const url = buildUrl(targetPage, kw, st);
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    console.error('❌ Error fetching orders:', res.status, res.statusText);
                    setOrders([]);
                    setTotalPages(0);
                    setError(`Lỗi khi tải đơn hàng: ${res.statusText}`);
                    return;
                }

                const data = await res.json();
                const content: OrderDTO[] = data.data?.content || [];
                const total: number = data.data?.totalPages ?? 0;
                setOrders(content);
                setTotalPages(total);
                setPage(targetPage);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('❌ Error loading order list:', err);
                setOrders([]);
                setTotalPages(0);
                setError('Không thể kết nối đến server');
            } finally {
                setIsLoadingOrders(false);
            }
        },
        [session]
    );

    const fetchStatusCounts = useCallback(async () => {
        if (!session?.accessToken) return;
        setIsLoadingCounts(true);
        try {
            const res = await fetch(`${BASE_API}/api/orders/status-counts`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });
            if (!res.ok) {
                console.error('❌ Error fetching status counts:', res.status, res.statusText);
                return;
            }
            const data = await res.json();
            setStatusCounts(data.data || {});
        } catch (err) {
            console.error('❌ Error loading status counts:', err);
        } finally {
            setIsLoadingCounts(false);
        }
    }, [session]);

    // Khi session thay đổi hoặc lần đầu load
    useEffect(() => {
        fetchStatusCounts();
        loadOrders(0, keyword, status);
    }, [fetchStatusCounts, loadOrders]);

    // xử lý newOrderCode từ URL
    useEffect(() => {
        if (newOrderCode) {
            setKeyword(newOrderCode);
            setStatus('Paid');
            loadOrders(0, newOrderCode, 'Paid');
            fetchStatusCounts();
        }
    }, [newOrderCode, loadOrders, fetchStatusCounts]);

    // debounce khi thay đổi keyword hoặc status
    useEffect(() => {
        if (!session?.accessToken) return;

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
            loadOrders(0, keyword, status);
            fetchStatusCounts();
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [keyword, status, session, loadOrders, fetchStatusCounts]);

    const handleSearch = () => {
        loadOrders(0, keyword, status);
        fetchStatusCounts();
    };

    const handleReset = () => {
        setKeyword('');
        setStatus('Paid');
        loadOrders(0, '', 'Paid');
    };

    const goPrev = () => {
        if (page > 0) loadOrders(page - 1, keyword, status);
    };
    const goNext = () => {
        if (page + 1 < totalPages) loadOrders(page + 1, keyword, status);
    };

    return (
        <main className="p-6 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 border-blue-200 pb-3">
                Danh Sách Hóa Đơn
            </h1>

            {/* Filter and Search Section */}
            <section className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Bộ Lọc Tìm Kiếm</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 text-gray-700"
                            placeholder="Nhập mã hóa đơn, tên khách hàng, số điện thoại..."
                        />
                    </div>

                    <div className="flex items-end gap-4 mt-auto">
                        <button
                            onClick={handleSearch}
                            className="flex-1 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                            disabled={isLoadingOrders}
                        >
                            {isLoadingOrders ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
                {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            </section>

            {/* Order Status Tabs and Table */}
            <section className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Trạng Thái Đơn Hàng</h2>
                <div className="flex flex-wrap gap-3 mb-6">
                    {TABS.map((tab) => {
                        const count = statusCounts[tab.value] || 0;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatus(tab.value);
                                    loadOrders(0, keyword, tab.value);
                                }}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out
                  ${status === tab.value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
                            >
                                {tab.label} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                STT
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Mã HĐ
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Khách Hàng
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                SĐT
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Tổng Tiền
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Trạng Thái
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Hành Động
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingOrders ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500 text-base">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500 text-base">
                                    Không có dữ liệu đơn hàng
                                </td>
                            </tr>
                        ) : (
                            orders.map((o, idx) => (
                                <tr
                                    key={o.orderId}
                                    className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${
                                        o.orderCode === newOrderCode ? 'bg-green-50' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {idx + 1 + page * 10}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {o.orderCode}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {o.customerName || 'Khách lẻ'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {o.phoneNumber || 'Không có'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                                        {o.finalAmount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${o.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${o.orderStatus === 'Confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${o.orderStatus === 'Processing' ? 'bg-purple-100 text-purple-800' : ''}
                          ${o.orderStatus === 'Shipped' ? 'bg-indigo-100 text-indigo-800' : ''}
                          ${o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${o.orderStatus === 'Paid' ? 'bg-teal-100 text-teal-800' : ''}
                        `}
                      >
                        {STATUS_MAP[o.orderStatus] || o.orderStatus}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                        <Link
                                            href={`/admin/order/officesales/${o.orderId}`}
                                            title="Xem chi tiết đơn hàng"
                                            aria-label={`Xem chi tiết đơn hàng ${o.orderCode}`}
                                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 ease-in-out inline-flex items-center justify-center p-2 rounded-full hover:bg-blue-100"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <nav className="flex items-center justify-between pt-6">
                    <button
                        onClick={goPrev}
                        disabled={page === 0 || isLoadingOrders}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        Trang trước
                    </button>

                    <span className="text-sm text-gray-700">
            Trang <span className="font-semibold">{page + 1}</span> /{' '}
                        <span className="font-semibold">{totalPages}</span>
          </span>

                    <button
                        onClick={goNext}
                        disabled={page + 1 >= totalPages || isLoadingOrders}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        Trang tiếp
                    </button>
                </nav>
            </section>
        </main>
    );
}
