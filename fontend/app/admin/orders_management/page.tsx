'use client'

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { EyeIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface OrderOnline {
    orderId: number;
    orderCode: string | null;
    customerName: string | null;
    orderStatus: string;
    finalAmount: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}

const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    Confirmed: 'Đã xác nhận',
    Processing: 'Chờ vận chuyển',
    Shipping: 'Đang vận chuyển',
    Delivered: 'Đã giao hàng',
    Completed: 'Đã hoàn thành',
    Cancelled: 'Đã hủy',
    ReturnRequested: 'Yêu cầu trả hàng',
    NotReceivedReported: 'Báo không nhận được',
    Dispute: 'Tranh chấp',
    CustomerReceived: 'Khách đã nhận',
    Investigation: 'Đang điều tra',
    DeliveryFailed1: 'Giao hàng thất bại lần 1',
    DeliveryFailed2: 'Giao hàng thất bại lần 2',
    DeliveryFailed3: 'Giao hàng thất bại lần 3',
    IncidentReported: 'Báo sự cố',
    LostOrDamaged: 'Mất hoặc hư hỏng',
    CustomerDecisionPending: 'Chờ quyết định khách hàng',
    ReturnApproved: 'Chấp nhận trả hàng',
    ReturnRejected: 'Từ chối trả hàng',
    ReturnedToWarehouse: 'Đã trả về kho',
    ReturnedToSeller: 'Đã trả về người bán',
    Refunded: 'Đã hoàn tiền',
    FinalRejected: 'Từ chối cuối cùng',
    ReturningInProgress: 'Đang trả hàng',
};

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Processing: 'bg-orange-100 text-orange-800',
    Shipping: 'bg-purple-100 text-purple-800',
    Delivered: 'bg-green-100 text-green-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    ReturnRequested: 'bg-orange-100 text-orange-800',
    NotReceivedReported: 'bg-red-100 text-red-800',
    Dispute: 'bg-red-100 text-red-800',
    CustomerReceived: 'bg-green-100 text-green-800',
    Investigation: 'bg-yellow-100 text-yellow-800',
    DeliveryFailed1: 'bg-red-100 text-red-800',
    DeliveryFailed2: 'bg-red-100 text-red-800',
    DeliveryFailed3: 'bg-red-100 text-red-800',
    IncidentReported: 'bg-red-100 text-red-800',
    LostOrDamaged: 'bg-red-100 text-red-800',
    CustomerDecisionPending: 'bg-yellow-100 text-yellow-800',
    ReturnApproved: 'bg-blue-100 text-blue-800',
    ReturnRejected: 'bg-red-100 text-red-800',
    ReturnedToWarehouse: 'bg-gray-100 text-gray-800',
    ReturnedToSeller: 'bg-gray-100 text-gray-800',
    Refunded: 'bg-green-100 text-green-800',
    FinalRejected: 'bg-red-100 text-red-800',
    ReturningInProgress: 'bg-orange-100 text-orange-800',
};

// Nhóm trạng thái cho API lọc theo nhóm
const STATUS_GROUPS = [
    { 
        label: 'Tất cả', 
        value: '', 
        description: 'Hiển thị tất cả đơn hàng' 
    },
    { 
        label: 'Yêu cầu từ khách hàng', 
        value: 'userRequestStatuses', 
        description: 'Cancelled, ReturnRequested, NotReceivedReported, Dispute, CustomerReceived' 
    },
    { 
        label: 'Đang xử lý bởi Admin', 
        value: 'adminProcessingStatuses', 
        description: 'Pending, Confirmed, Processing, Investigation, DeliveryFailed, IncidentReported, LostOrDamaged, CustomerDecisionPending, ReturnApproved, ReturnRejected, ReturnedToWarehouse, ReturnedToSeller, Refunded, FinalRejected' 
    },
    { 
        label: 'Theo dõi bởi khách hàng', 
        value: 'userTrackingStatuses', 
        description: 'Confirmed, Processing, Shipping, Delivered, ReturningInProgress' 
    },
    { 
        label: 'Đã hoàn thành', 
        value: 'completedStatuses', 
        description: 'Completed, Refunded, FinalRejected, ReturnedToSeller, Cancelled' 
    }
];

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function OrdersManagementPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<OrderOnline[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderOnline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filter states
    const [statusFilter, setStatusFilter] = useState('');
    const [statusGroupFilter, setStatusGroupFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    
    // Debounced search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Fetch orders
    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (!session?.accessToken) return;

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            let url = 'http://localhost:8080/api/orders/online';
            
            // Nếu có filter theo nhóm trạng thái
            if (statusGroupFilter) {
                url = `http://localhost:8080/api/orders/by-status-group?group=${statusGroupFilter}`;
            }
            // Nếu có filter theo trạng thái cụ thể
            else if (statusFilter) {
                url = `http://localhost:8080/api/orders/online/status/${statusFilter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setOrders(data || []);
            setFilteredOrders(data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session?.accessToken, statusFilter, statusGroupFilter]);

    // Apply filters
    useEffect(() => {
        let filtered = orders;

        // Date filter (client-side only)
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(order => {
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                return orderDate.toDateString() === filterDate.toDateString();
            });
        }

        setFilteredOrders(filtered);
        setCurrentPage(1);
    }, [orders, dateFilter]);


    useEffect(() => {
        if (debouncedSearchTerm) {

            const term = debouncedSearchTerm.toLowerCase();
            const filtered = orders.filter(order => {
                const orderCode = order.orderCode?.toLowerCase() || '';
                const customerName = order.customerName?.toLowerCase() || '';
                return orderCode.includes(term) || customerName.includes(term);
            });
            setFilteredOrders(filtered);
            setCurrentPage(1);
        } else {
            // If no search term, show all orders (after date filter)
            let filtered = orders;
            if (dateFilter) {
                const filterDate = new Date(dateFilter);
                filtered = filtered.filter(order => {
                    if (!order.createdAt) return false;
                    const orderDate = new Date(order.createdAt);
                    return orderDate.toDateString() === filterDate.toDateString();
                });
            }
            setFilteredOrders(filtered);
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, orders, dateFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        if (!session?.accessToken) return;

        setActionLoading(orderId);
        try {
            const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Refresh orders
                fetchOrders(true);
            } else {
                alert('Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            alert('Lỗi khi cập nhật trạng thái' + error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!session?.accessToken) return;

        // Confirm before canceling
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.')) {
            return;
        }

        setActionLoading(orderId);
        try {
            const response = await fetch(`http://localhost:8080/api/orders/cancel/${orderId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                const result = await response.text();
                alert(result);
                // Refresh orders
                fetchOrders(true);
            } else {
                const errorData = await response.json();
                alert(`Hủy đơn hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            alert('Lỗi khi hủy đơn hàng' +  error);
        } finally {
            setActionLoading(null);
        }
    };

    // Memoized calculations
    const getTotalRevenue = useMemo(() => {
        return filteredOrders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
    }, [filteredOrders]);

    const getOrderCount = useMemo(() => filteredOrders.length, [filteredOrders]);

    const getTodayOrderCount = useMemo(() => {
        return filteredOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt);
            const today = new Date();
            return orderDate.toDateString() === today.toDateString();
        }).length;
    }, [filteredOrders]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Handle refresh
    const handleRefresh = () => {
        fetchOrders(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => fetchOrders()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đơn hàng Online</h1>
                        <p className="text-gray-600">Quản lý và theo dõi các đơn hàng bán online</p>
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>💡 Hướng dẫn sử dụng:</strong> Bạn có thể lọc đơn hàng theo nhóm trạng thái (sử dụng API /by-status-group) 
                                hoặc theo trạng thái cụ thể (sử dụng API /online/status/{status}). 
                                Hai loại filter này không thể sử dụng đồng thời.
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                                <strong>⚠️ Lưu ý:</strong> Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận (Pending).
                                Khi hủy đơn hàng, hệ thống sẽ tự động hoàn kho.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                            <p className="text-2xl font-bold text-gray-900">{getOrderCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {getTotalRevenue.toLocaleString('vi-VN')} ₫
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Đơn hàng hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {getTodayOrderCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FunnelIcon className="w-5 h-5 mr-2" />
                        Bộ lọc tìm kiếm
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                                {debouncedSearchTerm && debouncedSearchTerm !== searchTerm && (
                                    <span className="text-xs text-gray-500 ml-1">(Đang tìm...)</span>
                                )}
                            </label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Mã đơn hàng, tên khách hàng..."
                                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {searchTerm && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Tìm kiếm: {searchTerm} - {debouncedSearchTerm ? 'Đang áp dụng...' : 'Chờ nhập...'}
                                </p>
                            )}
                        </div>

                        {/* Status Group Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nhóm trạng thái
                                <span className="text-xs text-gray-500 ml-1">(Hover để xem chi tiết)</span>
                            </label>
                            <select
                                value={statusGroupFilter}
                                onChange={(e) => {
                                    setStatusGroupFilter(e.target.value);
                                    setStatusFilter(''); // Reset status filter when group is selected
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {STATUS_GROUPS.map((group) => (
                                    <option key={group.value} value={group.value} title={group.description}>
                                        {group.label}
                                    </option>
                                ))}
                            </select>
                            {statusGroupFilter && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {STATUS_GROUPS.find(g => g.value === statusGroupFilter)?.description}
                                </p>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái cụ thể
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setStatusGroupFilter(''); // Reset group filter when status is selected
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={statusGroupFilter !== ''}
                            >
                                <option value="">Tất cả trạng thái</option>
                                {Object.entries(STATUS_MAP).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày đặt hàng
                            </label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                setStatusFilter('');
                                setStatusGroupFilter('');
                                setSearchTerm('');
                                setDateFilter('');
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách đơn hàng ({filteredOrders.length})
                            {orders.length !== filteredOrders.length && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    (trong tổng số {orders.length})
                                </span>
                            )}
                        </h3>
                        <div className="text-sm text-gray-500 space-y-1">
                            {(statusFilter || statusGroupFilter) && (
                                <div>
                                    {statusGroupFilter ? (
                                        <span>Đang lọc theo nhóm: <strong>{STATUS_GROUPS.find(g => g.value === statusGroupFilter)?.label}</strong></span>
                                    ) : (
                                        <span>Đang lọc theo trạng thái: <strong>{STATUS_MAP[statusFilter]}</strong></span>
                                    )}
                                </div>
                            )}
                            {debouncedSearchTerm && (
                                <div>
                                    Kết quả tìm kiếm cho: <strong>{debouncedSearchTerm} </strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mã đơn hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày đặt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổng tiền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thanh toán
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">
                                                {debouncedSearchTerm 
                                                    ? `Không tìm thấy đơn hàng nào cho "${debouncedSearchTerm}"`
                                                    : 'Không có đơn hàng nào'
                                                }
                                            </p>
                                            <p className="text-sm">
                                                {debouncedSearchTerm 
                                                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                                                    : 'Thử thay đổi bộ lọc tìm kiếm'
                                                }
                                            </p>
                                            {(debouncedSearchTerm || statusFilter || statusGroupFilter || dateFilter) && (
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setStatusFilter('');
                                                        setStatusGroupFilter('');
                                                        setDateFilter('');
                                                    }}
                                                    className="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Xóa tất cả bộ lọc
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr key={order.orderId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.orderCode || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Online
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.customerName || 'Khách hàng không tên'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Khách hàng online
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            <br />
                                            <span className="text-gray-500">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN') : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {(order.finalAmount || 0).toLocaleString('vi-VN')} ₫
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                {STATUS_MAP[order.orderStatus] || order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Chưa xác định
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/admin/orders_management/${order.orderId}`}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                                >
                                                    <EyeIcon className="w-4 h-4 mr-1" />
                                                    Chi tiết
                                                </Link>
                                                <select
                                                    value={order.orderStatus}
                                                    onChange={(e) => handleStatusUpdate(order.orderId, e.target.value)}
                                                    disabled={actionLoading === order.orderId}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    {Object.entries(STATUS_MAP).map(([key, value]) => (
                                                        <option key={key} value={key}>{value}</option>
                                                    ))}
                                                </select>
                                                {order.orderStatus === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.orderId)}
                                                        disabled={actionLoading === order.orderId}
                                                        className="text-red-600 hover:text-red-900 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Hủy đơn hàng"
                                                    >
                                                        {actionLoading === order.orderId ? 'Đang xử lý...' : 'Hủy'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn hàng
                                </span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-700">đơn hàng/trang</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 text-sm border rounded ${
                                                    currentPage === pageNum
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}