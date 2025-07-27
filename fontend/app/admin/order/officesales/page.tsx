//
// 'use client';
//
// import { useEffect, useState, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
// import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';
// import { EyeIcon } from '@heroicons/react/24/outline';
//
// interface OrderDTO {
//     orderId: number;
//     orderCode: string;
//     customerName: string | null;
//     phoneNumber: string | null;
//     orderType: string;
//     orderDate: string;
//     finalAmount: number;
//     orderStatus: string;
// }
//
// const STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ xác nhận',
//     Confirmed: 'Đã xác nhận',
//     Processing: 'Chờ vận chuyển',
//     Shipped: 'Đang vận chuyển',
//     Delivered: 'Đã hoàn thành',
//     Cancelled: 'Đã hủy',
//     Paid: 'Đã thanh toán',
// };
//
// const TABS = [
//     { label: 'Tất cả', value: '' },
//     { label: 'Chờ xác nhận', value: 'Pending' },
//     { label: 'Đã xác nhận', value: 'Confirmed' },
//     { label: 'Chờ vận chuyển', value: 'Processing' },
//     { label: 'Đang vận chuyển', value: 'Shipped' },
//     { label: 'Đã hoàn thành', value: 'Delivered' },
//     { label: 'Đã thanh toán', value: 'Paid' },
//     { label: 'Đã hủy', value: 'Cancelled' },
// ];
//
// export default function OrderListPage() {
//     const { data: session } = useSession();
//     const searchParams = useSearchParams();
//     const newOrderCode = searchParams?.get('newOrderCode') || null;
//
//     const [orders, setOrders] = useState<OrderDTO[]>([]);
//     const [status, setStatus] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [orderType, setOrderType] = useState('');
//     const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
//
//     // 👇 Phân trang
//     const [page, setPage] = useState(0);
//     const [totalPages, setTotalPages] = useState(0);
//
//     const fetchOrders = useCallback(async () => {
//         if (!session?.accessToken) return;
//
//         let url = `http://localhost:8080/api/orders?`;
//         const params: string[] = [`page=${page}`, `size=10`];
//
//         if (status) {
//             url = `http://localhost:8080/api/orders/status?`;
//             params.push(`status=${encodeURIComponent(status)}`);
//         }
//
//         if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
//         if (orderType) params.push(`orderType=${orderType}`);
//
//         if (params.length > 0) url += params.join('&');
//
//         console.log('📡 Gọi API URL:', url);
//
//         const res = await fetch(url, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setOrders(data.data?.content || []);
//         setTotalPages(data.data?.totalPages || 0);
//     }, [session, status, keyword, orderType, page]);
//
//     const fetchStatusCounts = useCallback(async () => {
//         if (!session?.accessToken) return;
//
//         const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
//             headers: {
//                 Authorization: `Bearer ${session.accessToken}`,
//             },
//         });
//
//         if (!res.ok) {
//             console.error('❌ Lỗi đếm status:', res.status);
//             return;
//         }
//
//         const data = await res.json();
//         setStatusCounts(data.data || {});
//     }, [session]);
//
//     useEffect(() => {
//         if (newOrderCode && session?.accessToken) {
//             console.log('🔍 Có newOrderCode:', newOrderCode);
//             setKeyword(newOrderCode);
//             setStatus('');
//             setPage(0);
//             fetchOrders();
//             fetchOrders();
//             fetchStatusCounts();
//         }
//     }, [newOrderCode, session, fetchOrders, fetchStatusCounts]);
//
//     const handleSearch = () => {
//         setPage(0); // reset về trang 0 khi tìm kiếm mới
//         fetchOrders();
//     };
//
//     const handleReset = () => {
//         setKeyword('');
//         setOrderType('');
//         setStatus('');
//         setPage(0);
//         fetchOrders();
//     };
//
//     const totalCount = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);
//
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Danh sách hóa đơn</h1>
//
//             <div className="bg-gray-50 p-4 rounded-md mb-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Tìm kiếm
//                         </label>
//                         <input
//                             type="text"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                             placeholder="Tìm kiếm theo mã hóa đơn..."
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 text-sm font-medium text-gray-700">
//                             Loại đơn
//                         </label>
//                         <select
//                             value={orderType}
//                             onChange={(e) => setOrderType(e.target.value)}
//                             className="w-full border border-gray-300 rounded px-3 py-2"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Retail">Tại quầy</option>
//                             <option value="Online">Online</option>
//                         </select>
//                     </div>
//                 </div>
//
//                 <div className="flex space-x-4">
//                     <button
//                         onClick={handleSearch}
//                         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     >
//                         Tìm kiếm
//                     </button>
//                     <button
//                         onClick={handleReset}
//                         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                     >
//                         Làm mới
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {TABS.map((tab) => {
//                     const count = tab.value === '' ? totalCount : statusCounts[tab.value] || 0;
//                     return (
//                         <button
//                             key={tab.value}
//                             onClick={() => {
//                                 setStatus(tab.value);
//                                 setPage(0);
//                             }}
//                             className={`px-4 py-2 rounded-full ${
//                                 status === tab.value
//                                     ? 'bg-blue-500 text-white'
//                                     : 'bg-gray-200 text-gray-800'
//                             }`}
//                         >
//                             {tab.label} ({count})
//                         </button>
//                     );
//                 })}
//             </div>
//
//             <table className="w-full border border-gray-200">
//                 <thead className="bg-gray-100">
//                 <tr>
//                     <th className="p-2 border">STT</th>
//                     <th className="p-2 border">Mã hóa đơn</th>
//                     <th className="p-2 border">Khách hàng</th>
//                     <th className="p-2 border">SĐT</th>
//                     <th className="p-2 border">Loại đơn</th>
//                     <th className="p-2 border">Ngày tạo</th>
//                     <th className="p-2 border">Tổng tiền</th>
//                     <th className="p-2 border">Trạng thái</th>
//                     <th className="p-2 border">Hành động</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {orders.length === 0 ? (
//                     <tr>
//                         <td colSpan={9} className="text-center p-4">
//                             Không có dữ liệu
//                         </td>
//                     </tr>
//                 ) : (
//                     orders.map((o, idx) => (
//                         <tr
//                             key={o.orderId}
//                             className={`border ${o.orderCode === newOrderCode ? 'bg-green-50' : ''}`}
//                         >
//                             <td className="p-2 border">{idx + 1 + page * 10}</td>
//                             <td className="p-2 border">{o.orderCode}</td>
//                             <td className="p-2 border">{o.customerName || 'Khách lẻ'}</td>
//                             <td className="p-2 border">{o.phoneNumber || 'Không có'}</td>
//                             <td className="p-2 border">{o.orderType || 'Không có'}</td>
//                             <td className="p-2 border">
//                                 {o.orderDate
//                                     ? new Date(o.orderDate).toLocaleDateString('vi-VN')
//                                     : '--'}
//                             </td>
//                             <td className="p-2 border">
//                                 {o.finalAmount.toLocaleString('vi-VN')} ₫
//                             </td>
//                             <td className="p-2 border">
//                                 {STATUS_MAP[o.orderStatus] || o.orderStatus}
//                             </td>
//                             <td className="p-2 border text-center">
//                                 <Link
//                                     href={`/admin/order/officesales/${o.orderId}`}
//                                     title="Xem chi tiết đơn hàng"
//                                     aria-label={`Xem chi tiết đơn hàng ${o.orderId}`}
//                                     className="inline-flex items-center justify-center text-gray-600 hover:text-primary transition"
//                                 >
//                                     <EyeIcon className="w-5 h-5" />
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))
//                 )}
//                 </tbody>
//             </table>
//
//             <div className="flex justify-between items-center mt-4">
//                 <button
//                     onClick={() => page > 0 && setPage(page - 1)}
//                     disabled={page === 0}
//                     className="px-4 py-2 border rounded disabled:opacity-50"
//                 >
//                     Trang trước
//                 </button>
//
//                 <span>
//           Trang {page + 1} / {totalPages}
//         </span>
//
//                 <button
//                     onClick={() => page + 1 < totalPages && setPage(page + 1)}
//                     disabled={page + 1 >= totalPages}
//                     className="px-4 py-2 border rounded disabled:opacity-50"
//                 >
//                     Trang tiếp
//                 </button>
//             </div>
//         </div>
//     );
// }
//
//
//
//

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EyeIcon } from '@heroicons/react/24/outline';

// Interface for the order data received from the API
interface OrderDTO {
    orderId: number;
    orderCode: string;
    customerName: string | null;
    phoneNumber: string | null;
    orderType: string;
    orderDate: string; // Ensure your backend sends this as a valid date string
    finalAmount: number; // This value is displayed directly from backend
    orderStatus: string;
}

// Mapping of API status codes to Vietnamese display names
const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipped: 'Đang vận chuyển',
    Delivered: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
    Paid: 'Đã thanh toán',
};

// Defines the tabs available for filtering orders.
// Currently set to only show the 'Đã thanh toán' (Paid) tab.
const TABS = [
    { label: 'Đã thanh toán', value: 'Paid' },
];

export default function OrderListPage() {
    const { data: session } = useSession(); // Get user session for authentication
    const searchParams = useSearchParams(); // Hook to access URL query parameters
    const newOrderCode = searchParams?.get('newOrderCode') || null; // Check for a new order code in URL

    // State variables for managing order data and UI filters
    const [orders, setOrders] = useState<OrderDTO[]>([]);
    const [status, setStatus] = useState('Paid'); // Default filter status: 'Paid'
    const [keyword, setKeyword] = useState(''); // Search keyword for order code, customer name, phone
    const [orderType, setOrderType] = useState('Retail'); // Default order type: 'Retail' (at counter sales)
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({}); // Counts of orders by status

    // Pagination state
    const [page, setPage] = useState(0); // Current page (0-indexed)
    const [totalPages, setTotalPages] = useState(0); // Total number of pages

    /**
     * Fetches order data from the backend API based on current filters and pagination.
     */
    const fetchOrders = useCallback(async () => {
        // Ensure user is authenticated before making API call
        if (!session?.accessToken) {
            console.warn('No access token found. User might not be logged in.');
            return;
        }

        // Construct API URL and parameters
        let url = `http://localhost:8080/api/orders/status`; // Base URL for status filtered orders
        const params: string[] = [`page=${page}`, `size=10`]; // Pagination parameters

        // Add status and orderType parameters (always included as they have default values)
        params.push(`status=${encodeURIComponent(status)}`);
        params.push(`orderType=${orderType}`);

        // Add keyword parameter if present
        if (keyword) {
            params.push(`keyword=${encodeURIComponent(keyword)}`);
        }

        const finalUrl = `${url}?${params.join('&')}`; // Combine URL and parameters

        console.log('📡 Calling API URL:', finalUrl);

        try {
            const res = await fetch(finalUrl, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`, // Attach authorization token
                },
            });

            // Handle non-OK HTTP responses
            if (!res.ok) {
                console.error('❌ Error fetching orders:', res.status, res.statusText);
                setOrders([]); // Clear orders on error
                setTotalPages(0);
                return;
            }

            const data = await res.json();
            setOrders(data.data?.content || []); // Update orders state
            setTotalPages(data.data?.totalPages || 0); // Update total pages state
        } catch (error) {
            console.error('❌ Error loading order list:', error);
            setOrders([]); // Clear orders on network/parsing error
            setTotalPages(0);
        }
    }, [session, status, keyword, orderType, page]); // Dependencies for useCallback

    /**
     * Fetches counts of orders by status from the backend API.
     */
    const fetchStatusCounts = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            const res = await fetch(`http://localhost:8080/api/orders/status-counts`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!res.ok) {
                console.error('❌ Error fetching status counts:', res.status, res.statusText);
                return;
            }

            const data = await res.json();
            setStatusCounts(data.data || {}); // Update status counts state
        } catch (error) {
            console.error('❌ Error loading status counts:', error);
        }
    }, [session]); // Dependencies for useCallback

    // Effect hook to fetch status counts on component mount and session change
    useEffect(() => {
        fetchStatusCounts();
    }, [fetchStatusCounts]);

    // Effect hook to fetch orders. Runs on component mount, newOrderCode change,
    // session change, and when `fetchOrders` (due to its dependencies) changes.
    useEffect(() => {
        if (session?.accessToken) {
            // If a new order code is present in the URL, apply it as a keyword and set status to 'Paid'
            if (newOrderCode) {
                console.log('🔍 New order code detected:', newOrderCode);
                setKeyword(newOrderCode);
                setStatus('Paid'); // Ensure 'Paid' status is maintained for new orders
                setPage(0); // Reset to first page
            }
            fetchOrders(); // Fetch orders based on current state
        }
    }, [newOrderCode, session, fetchOrders]);

    /**
     * Handles the search action: resets page to 0 and refetches data.
     */
    const handleSearch = () => {
        setPage(0); // Reset to page 0 for new search results
        fetchOrders(); // Refetch orders with new keyword/filters
        fetchStatusCounts(); // Refetch counts to ensure they're accurate for the new search
    };

    /**
     * Handles the reset action: clears keyword, resets order type and status to defaults, and resets page.
     */
    const handleReset = () => {
        setKeyword('');
        setOrderType('Retail'); // Reset orderType to 'Retail'
        setStatus('Paid'); // Reset status to 'Paid'
        setPage(0);
        // `fetchOrders` will automatically be triggered by the `useEffect` hook due to state changes
    };

    // Calculate the total count for the single 'Paid' tab
    const totalCount = statusCounts['Paid'] || 0;

    return (
        <main className="p-6 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 border-blue-200 pb-3">
                Danh Sách Hóa Đơn
            </h1>

            {/* Filter and Search Section */}
            <section className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Bộ Lọc Tìm Kiếm</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> {/* Two columns for layout */}
                    <div>
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2 text-gray-700"
                            placeholder="Mã hóa đơn, tên khách hàng, SĐT..."
                        />
                    </div>

                    {/* Search and Reset Buttons */}
                    <div className="flex items-end gap-4 mt-auto"> {/* Aligns buttons to the bottom */}
                        <button
                            onClick={handleSearch}
                            className="flex-1 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                        >
                            Tìm kiếm
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex-1 px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition duration-150 ease-in-out"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            </section>

            {/* Order Status Tabs and Table */}
            <section className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Trạng Thái Đơn Hàng</h2>
                <div className="flex flex-wrap gap-3 mb-6">
                    {/* Render the single 'Paid' tab */}
                    {TABS.map((tab) => {
                        const count = statusCounts[tab.value] || 0; // Get count for the current tab
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatus(tab.value); // Set selected status
                                    setPage(0); // Reset pagination
                                }}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out
                                    ${status === tab.value
                                    ? 'bg-blue-600 text-white shadow-md' // Active tab styles
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} // Inactive tab styles
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
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                            {/* The 'Loại Đơn' (Order Type) column is removed as orderType is fixed to 'Retail' */}
                            {/*<th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Tạo</th>*/}
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành Động</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {orders.length === 0 ? (
                            <tr>
                                {/* colSpan adjusted to 7 because 'Order Type' column is removed */}
                                <td colSpan={7} className="text-center py-6 text-gray-500 text-base">
                                    Không có dữ liệu đơn hàng
                                </td>
                            </tr>
                        ) : (
                            orders.map((o, idx) => (
                                <tr
                                    key={o.orderId}
                                    // Highlight row if it matches a new order code from URL
                                    className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${o.orderCode === newOrderCode ? 'bg-green-50' : ''}`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{idx + 1 + page * 10}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">{o.orderCode}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{o.customerName || 'Khách lẻ'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{o.phoneNumber || 'Không có'}</td>
                                    {/*<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">*/}
                                    {/*    {o.orderDate*/}
                                    {/*        ? new Date(o.orderDate).toLocaleDateString('vi-VN') // Using toLocaleDateString*/}
                                    {/*        : '--'}*/}
                                    {/*</td>*/}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                                        {o.finalAmount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                                                ${o.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                ${o.orderStatus === 'Confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                                                ${o.orderStatus === 'Processing' ? 'bg-purple-100 text-purple-800' : ''}
                                                ${o.orderStatus === 'Shipped' ? 'bg-indigo-100 text-indigo-800' : ''}
                                                ${o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                                                ${o.orderStatus === 'Paid' ? 'bg-teal-100 text-teal-800' : ''}
                                            `}>
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
                        onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        Trang trước
                    </button>

                    <span className="text-sm text-gray-700">
                        Trang <span className="font-semibold">{page + 1}</span> / <span className="font-semibold">{totalPages}</span>
                    </span>

                    <button
                        onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={page + 1 >= totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        Trang tiếp
                    </button>
                </nav>
            </section>
        </main>
    );
}