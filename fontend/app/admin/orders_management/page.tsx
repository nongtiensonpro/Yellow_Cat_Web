'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
// import Link from 'next/link';
import { EyeIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface OrderOnline {
    orderId: number;
    orderCode: string | null;
    customerName: string | null;
    orderStatus: string;
    finalAmount: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}

// STATUS_MAP cho bộ lọc - hiển thị ngắn gọn
const STATUS_MAP: Record<string, string> = {
    Pending: 'Chờ xác nhận',
    WaitingForStock: 'Chờ hàng',
    Confirmed: 'Đã xác nhận',
    Shipping: 'Đang vận chuyển',
    Delivered: 'Đã giao hàng',
    DeliveryFailed: 'Giao hàng thất bại',
    ReturnedToSeller: 'Đã trả về người bán',
    CustomerReceived: 'Khách đã nhận hàng',
    ReturnRequested: 'Yêu cầu trả hàng',
    ReturnApproved: 'Trả hàng được chấp nhận',
    ReturnRejected: 'Trả hàng bị từ chối',
    Refunded: 'Đã hoàn tiền',
    Completed: 'Hoàn tất',
    Cancelled: 'Đã hủy',
};

// STATUS_MAP cho timeline - hiển thị chi tiết hơn
const TIMELINE_STATUS_MAP: Record<string, string> = {
    Pending: 'Đơn hàng đang chờ xác nhận',
    WaitingForStock: 'Sản phẩm hiện chưa có sẵn. Đơn hàng được thêm vào danh sách chờ',
    Confirmed: 'Đơn hàng đã được xác nhận',
    Shipping: 'Đơn hàng đang được vận chuyển',
    Delivered: 'Đơn hàng đã được giao thành công',
    DeliveryFailed: 'Giao hàng không thành công',
    ReturnedToSeller: 'Đơn hàng đã được trả về người bán',
    CustomerReceived: 'Khách hàng đã xác nhận nhận hàng',
    ReturnRequested: 'Khách hàng yêu cầu trả hàng',
    ReturnApproved: 'Yêu cầu trả hàng đã được chấp nhận',
    ReturnRejected: 'Yêu cầu trả hàng đã bị từ chối',
    Refunded: 'Đơn hàng đã được hoàn tiền',
    Completed: 'Đơn hàng đã hoàn tất',
    Cancelled: 'Đơn hàng đã bị hủy',
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

// Thêm interface cho chi tiết đơn hàng
interface OrderItem {
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderTimeline {
    id: number;
    orderId: number;
    fromStatus: string;
    toStatus: string;
    note: string;
    changedAt: string;
    updatedBy: string | null;
    emailUserUpdate: string | null;
}

interface OrderOnlineDetail {
    orderId: number;
    orderCode: string;
    orderStatus: string;
    customerName: string;
    phoneNumber: string;
    wardCommune: string;
    streetAddress: string;
    district: string;
    cityProvince: string;
    country: string;
    orderDate: string;
    subTotal: number;
    shippingFee: number;
    voucherDiscount?: number;
    voucherCode?: string;
    finalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    items: OrderItem[];
    customerNotes?: string; // Added for customer notes
    note?: string; // Added for general notes
}
// const PAYMENT_STATUS_MAP: Record<string, string> = {
//     Pending: 'Chờ thanh toán',
//     Paid: 'Đã thanh toán',
//     Failed: 'Thanh toán thất bại',
//     Refunded: 'Đã hoàn tiền',
// };

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

    // State để lưu orderId đang mở và chi tiết đơn hàng
    const [openDetailOrderId, setOpenDetailOrderId] = useState<number | null>(null);
    const [detailOrderCache, setDetailOrderCache] = useState<Record<number, OrderOnlineDetail>>({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    // Thêm state cache transitions cho từng trạng thái
    const [transitionsCache, setTransitionsCache] = useState<Record<string, string[]>>({});

    // State cho popup
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{orderId: number, newStatus: string} | null>(null);
    const [statusNote, setStatusNote] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // State lưu lịch sử trạng thái đơn hàng
    const [orderTimeline, setOrderTimeline] = useState<Record<number, OrderTimeline[]>>({});
    const [timelineLoading, setTimelineLoading] = useState<Record<number, boolean>>({});

    // Hàm lấy transitions cho trạng thái (có cache)
    const fetchTransitions = useCallback(async (status: string) => {
        if (transitionsCache[status]) return transitionsCache[status];
        try {
            const res = await fetch(`http://localhost:8080/api/order-timelines/transitions/${status}`);
            if (!res.ok) return [];
            let data = await res.json();
            // Nếu trả về object có trường transitions hoặc data, lấy trường đó
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if (Array.isArray(data.transitions)) data = data.transitions;
                else if (Array.isArray(data.data)) data = data.data;
                else {
                    // Nếu object, lấy giá trị đầu tiên là mảng
                    const arr = Object.values(data).find(v => Array.isArray(v));
                    if (arr) data = arr;
                    else data = Object.values(data).flat();
                }
            }
            // Đảm bảo là mảng string
            if (!Array.isArray(data)) data = [];
            setTransitionsCache(prev => ({ ...prev, [status]: data }));
            return data;
        } catch {
            return [];
        }
    }, [transitionsCache]);

    // Map trạng thái chuyển tiếp sang tên nút
    const TRANSITION_LABELS: Record<string, string> = {
        Confirmed: 'Xác nhận',
        Cancelled: 'Hủy đơn hàng',
        Delivered: 'Đã giao hàng',
        DeliveryFailed: 'Giao thất bại',
        CustomerReceived: 'Khách đã nhận',
        ReturnRequested: 'Yêu cầu trả hàng',
        ReturnApproved: 'Chấp nhận trả hàng',
        ReturnRejected: 'Từ chối trả hàng',
        ReturnedToWarehouse: 'Trả về kho',
        Refunded: 'Hoàn tiền',
        Completed: 'Hoàn thành',
        // ... bổ sung nếu cần ...
    };

    // Hàm fetch chi tiết đơn hàng
    const fetchOrderDetail = useCallback(async (orderId: number) => {
        if (!session?.accessToken) return;
        setDetailLoading(true);
        setDetailError(null);
        // Nếu đã có trong cache thì không fetch lại
        if (detailOrderCache[orderId]) {
            setDetailLoading(false);
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/orders/detail-online/${orderId}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` },
            });
            if (!response.ok) throw new Error('Không tìm thấy đơn hàng');
            const data = await response.json();
            const detail = data.data || data;
            setDetailOrderCache(prev => ({ ...prev, [orderId]: detail }));
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
        } finally {
            setDetailLoading(false);
        }
    }, [session?.accessToken, detailOrderCache]);

    // Hàm fetch order timeline
    const fetchOrderTimeline = useCallback(async (orderId: number) => {
        if (!session?.accessToken || orderTimeline[orderId]) return;

        try {
            setTimelineLoading(prev => ({ ...prev, [orderId]: true }));
            
            const response = await fetch(`http://localhost:8080/api/order-timelines/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    setOrderTimeline(prev => ({
                        ...prev,
                        [orderId]: data.data
                    }));
                } else {
                    setOrderTimeline(prev => ({
                        ...prev,
                        [orderId]: []
                    }));
                }
            } else {
                console.error('Failed to fetch order timeline');
                setOrderTimeline(prev => ({
                    ...prev,
                    [orderId]: []
                }));
            }
        } catch (err) {
            console.error('Error fetching order timeline:', err);
            setOrderTimeline(prev => ({
                ...prev,
                [orderId]: []
            }));
        } finally {
            setTimelineLoading(prev => ({ ...prev, [orderId]: false }));
        }
    }, [session?.accessToken, orderTimeline]);

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

            // Tự động fetch chi tiết cho các đơn cần auto update
            (data || []).forEach((order: OrderOnline) => {
                if (
                    ['ReturnedToSeller', 'ReturnApproved', 'ReturnRejected', 'CustomerReceived'].includes(order.orderStatus)
                    && !detailOrderCache[order.orderId]
                ) {
                    fetchOrderDetail(order.orderId);
                }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session?.accessToken, statusFilter, statusGroupFilter, detailOrderCache, fetchOrderDetail]);

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

    // useEffect toàn cục để fetch transitions cho các trạng thái mới
    useEffect(() => {
        const uniqueStatuses = Array.from(new Set(orders.map(o => o.orderStatus)));
        uniqueStatuses.forEach(status => {
            if (!transitionsCache[status]) {
                fetchTransitions(status);
            }
        });
        // ////////eslint-disable-next-line
    }, [orders, transitionsCache, fetchTransitions]);

    // Khi openDetailOrderId thay đổi, fetch chi tiết nếu chưa có trong cache
    useEffect(() => {
        if (openDetailOrderId) {
            fetchOrderDetail(openDetailOrderId);
        } else {
            setDetailError(null);
        }
    }, [openDetailOrderId, fetchOrderDetail]);

    // Fetch timeline khi có detail order và chưa có timeline
    useEffect(() => {
        if (openDetailOrderId && detailOrderCache[openDetailOrderId] && !orderTimeline[openDetailOrderId]) {
            fetchOrderTimeline(openDetailOrderId);
        }
    }, [openDetailOrderId, detailOrderCache, orderTimeline, fetchOrderTimeline]);

    // Danh sách trạng thái sẽ auto update không cần popup
    const AUTO_UPDATE_STATES = [
        'CustomerReceived',
        'ReturnRejected',
        'ReturnedToSeller',
    ];

    //lấy ra id keycloak để nhận diện người xử lí đơn hàng
    let keycloakid = '';
    if (session?.user?.id) {
        keycloakid = session.user.id;
    }
    // Hàm gọi API update trạng thái trực tiếp, không popup
    const updateStatusDirectly = async (orderId: number, newStatus: string) => {
        setActionLoading(orderId);
        try {
            const body = {
                orderId,
                newStatus,
                note: 'Tự động chuyển trạng thái',
                imageUrls: [],
                keycloakid,
            };
            const response = await fetch('http://localhost:8080/api/order-timelines/admin/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(body),
            });
            if (response.ok) {
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

    // Hàm cho user thao tác (có popup nếu không phải auto)
    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        if (AUTO_UPDATE_STATES.includes(newStatus)) {
            // Nếu là trạng thái auto update, chỉ gọi API trực tiếp (dùng cho click thủ công)
            await updateStatusDirectly(orderId, newStatus);
            return;
        }
        // Nếu không phải auto update thì hiển thị popup
        setPendingStatusUpdate({ orderId, newStatus });
        setStatusNote('');
        setImageUrls([]);
        setSelectedFiles([]);
        setShowStatusPopup(true);
    };

    const handleStatusUpdateConfirm = async () => {
        if (!session?.accessToken || !pendingStatusUpdate) return;
        
        setActionLoading(pendingStatusUpdate.orderId);
        setShowStatusPopup(false);
        
        // Chuyển đổi file thành đường dẫn local
        const filePaths = selectedFiles.map(file => file.name);
        const allImageUrls = [...imageUrls, ...filePaths];
        
        const body = {
            orderId: pendingStatusUpdate.orderId,
            newStatus: pendingStatusUpdate.newStatus,
            note: statusNote || 'Admin xác nhận đơn',
            imageUrls: allImageUrls,
            keycloakid,
        };
        
        console.log('Body gửi lên cập nhật trạng thái:', body);
        
        try {
            const response = await fetch('http://localhost:8080/api/order-timelines/admin/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify(body),
            });
            if (response.ok) {
                fetchOrders(true);
            } else {
                alert('Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            alert('Lỗi khi cập nhật trạng thái' + error);
        } finally {
            setActionLoading(null);
            setPendingStatusUpdate(null);
        }
    };

    const handleStatusUpdateCancel = () => {
        setShowStatusPopup(false);
        setPendingStatusUpdate(null);
        setStatusNote('');
        setImageUrls([]);
        setSelectedFiles([]);
    };

    const handleImageUrlAdd = () => {
        const url = prompt('Nhập URL ảnh:');
        if (url && url.trim()) {
            setImageUrls(prev => [...prev, url.trim()]);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeImageUrl = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // const handleCancelOrder = async (orderId: number) => {
    //     if (!session?.accessToken) return;
    //
    //     // Confirm before canceling
    //     if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.')) {
    //         return;
    //     }
    //
    //     setActionLoading(orderId);
    //     try {
    //         const body = {
    //             orderId,
    //             newStatus: 'Cancelled',
    //             note: 'Admin hủy đơn hàng',
    //             imageUrls: [],
    //         };
    //         const response = await fetch('http://localhost:8080/api/order-timelines/admin/update', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${session.accessToken}`,
    //             },
    //             body: JSON.stringify(body),
    //         });
    //
    //         if (response.ok) {
    //             fetchOrders(true);
    //         } else {
    //             const errorData = await response.json();
    //             alert(`Hủy đơn hàng thất bại: ${errorData.message || 'Lỗi không xác định'}`);
    //         }
    //     } catch (error) {
    //         alert('Lỗi khi hủy đơn hàng' +  error);
    //     } finally {
    //         setActionLoading(null);
    //     }
    // };

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

    // State lưu các orderId đã tự động update để tránh lặp
    const [autoUpdatedOrders, setAutoUpdatedOrders] = useState<number[]>([]);
    // const [autoCancelledOrders, setAutoCancelledOrders] = useState<number[]>([]);

    useEffect(() => {
        orders.forEach(order => {
            const detail = detailOrderCache[order.orderId];
            if (
                [
                    'CustomerReceived',
                    'ReturnApproved',
                    'ReturnRejected',
                    'ReturnedToSeller',
                ].includes(order.orderStatus) &&
                !autoUpdatedOrders.includes(order.orderId) &&
                detail // Đảm bảo đã có detail
            ) {
                const transitions = Array.isArray(transitionsCache[order.orderStatus])
                    ? transitionsCache[order.orderStatus]
                    : [];
                if (transitions.length > 0) {
                    // Nếu là COD và chưa thanh toán thành công thì không update Refunded
                    const isCOD = detail.paymentMethod?.toUpperCase() === 'COD';
                    const isRefunded = transitions[0] === 'Refunded';
                    const isPaid = detail.paymentStatus?.toUpperCase() === 'SUCCESS';
                    if (!(isCOD && isRefunded && !isPaid)) {
                        updateStatusDirectly(order.orderId, transitions[0]);
                    setAutoUpdatedOrders(prev => [...prev, order.orderId]);
                    console.log('Tự động cập nhật trạng thái cho orderId', order.orderId, '->', transitions[0]);
                }
            }
            }
        });
        // eslint-disable-next-line
    }, [orders, transitionsCache, detailOrderCache]);

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

    const detailOrder = openDetailOrderId ? detailOrderCache[openDetailOrderId] : null;
    const isPaid = detailOrder && detailOrder.paymentStatus && ['paid', 'success'].includes(detailOrder.paymentStatus.toLowerCase());

    if (detailOrder) {
        console.log('Ghi chú đơn hàng (customerNotes):', detailOrder.customerNotes);
    }

    const formatTimelineNote = (timeline: OrderTimeline) => {
        const toStatus = TIMELINE_STATUS_MAP[timeline.toStatus] || timeline.toStatus;
        
        return toStatus;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

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
                                <strong>💡 Hướng dẫn sử dụng:</strong> Bạn có thể lọc đơn hàng theo nhóm trạng thái 
                                hoặc theo trạng thái cụ thể. 
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
                                    <React.Fragment key={`order-row-${order.orderId}`}>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {(Array.isArray(transitionsCache[order.orderStatus]) ? transitionsCache[order.orderStatus] : []).length > 0 &&
                                                        (Array.isArray(transitionsCache[order.orderStatus]) ? transitionsCache[order.orderStatus] : []).map((t: string) => {
                                                            // Ẩn nút Refunded nếu là COD và đang ở trạng thái ReturnedToSeller
                                                            const isCODReturnedToSeller =
                                                                t === 'Refunded' &&
                                                                order.orderStatus === 'ReturnedToSeller' &&
                                                                detailOrderCache[order.orderId]?.paymentMethod?.toUpperCase() === 'COD';
                                                            if (isCODReturnedToSeller) return null;

                                                            const detail = detailOrderCache[order.orderId];
                                                            const isZaloPay = detail?.paymentMethod?.toUpperCase() === 'ZALOPAY';
                                                            const isZaloPayPaid = ['PAID', 'SUCCESS'].includes((detail?.paymentStatus || '').toUpperCase());

                                                            // Nếu là nút Confirmed và chưa có detail, disable luôn
                                                            if (t === 'Confirmed' && order.orderStatus === 'Pending' && !detail) {
                                                                return (
                                                                    <button
                                                                        key={t}
                                                                        className="px-3 py-1 bg-blue-300 text-white rounded text-sm opacity-50 cursor-not-allowed"
                                                                        disabled
                                                                    >
                                                                        {TRANSITION_LABELS[t] || t}
                                                                    </button>
                                                                );
                                                            }

                                                            // Nếu có detail và là ZaloPay chưa thanh toán, ẩn nút
                                                            if (t === 'Confirmed' && order.orderStatus === 'Pending' && detail && isZaloPay && !isZaloPayPaid) {
                                                                return null;
                                                            }

                                                            // Ẩn nút CustomerReceived nếu là ZALOPAY và chưa thanh toán thành công
                                                            if (t === 'CustomerReceived' && detail && isZaloPay && !isZaloPayPaid) return null;

                                                            return (
                                                                <button
                                                                    key={t}
                                                                    className={
                                                                        t === 'Cancelled' ?
                                                                            'px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50'
                                                                        : t === 'Confirmed' ?
                                                                            'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50'
                                                                        : t === 'Delivered' ?
                                                                            'px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50'
                                                                        : t === 'ReturnApproved' ?
                                                                            'px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm disabled:opacity-50'
                                                                        : t === 'ReturnRejected' ?
                                                                            'px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm disabled:opacity-50'
                                                                        : 'px-3 py-1 bg-gray-400 text-white rounded text-sm disabled:opacity-50'
                                                                    }
                                                                    onClick={() => handleStatusUpdate(order.orderId, t)}
                                                                    disabled={actionLoading === order.orderId}
                                                                >
                                                                    {actionLoading === order.orderId ? 'Đang xử lý...' : (TRANSITION_LABELS[t] || t)}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900 flex items-center"
                                                        onClick={() => setOpenDetailOrderId(openDetailOrderId === order.orderId ? null : order.orderId)}
                                                    >
                                                        <EyeIcon className="w-4 h-4 mr-1" />
                                                        {openDetailOrderId === order.orderId ? 'Đóng' : 'Chi tiết'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Hiển thị tab chi tiết nếu openDetailOrderId === order.orderId */}
                                        {openDetailOrderId === order.orderId && (
                                            <tr>
                                                <td colSpan={7} className="bg-gray-50 p-6 border-t">
                                                    {detailLoading ? (
                                                        <div className="text-center py-8">Đang tải chi tiết đơn hàng...</div>
                                                    ) : detailError ? (
                                                        <div className="text-center text-red-600 py-8">{detailError}</div>
                                                    ) : detailOrder ? (
                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                            {/* Main Content */}
                                                            <div className="lg:col-span-2 space-y-6">
                                                                {/* Order Information */}
                                                                <div className="bg-white rounded-lg shadow p-6">
                                                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
                                                                                <p className="text-lg font-semibold text-gray-900">{detailOrder.orderCode}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Ngày đặt hàng</label>
                                                                                <p className="text-gray-900">
                                                                                    {new Date(detailOrder.orderDate).toLocaleDateString('vi-VN')} - {new Date(detailOrder.orderDate).toLocaleTimeString('vi-VN')}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Đơn vị giao hàng</label>
                                                                                <p className="text-gray-900">Giao hàng tiết kiệm</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                                                                                <p className="text-gray-900">{detailOrder.paymentMethod || 'Chưa xác định'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Trạng thái thanh toán</label>
                                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                    isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                                }`}>
                                                                                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                                                                                <p className="text-gray-900">{detailOrder.customerNotes ? detailOrder.customerNotes : 'Không có ghi chú'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Customer Information */}
                                                                <div className="bg-white rounded-lg shadow p-6">
                                                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                                                        <EyeIcon className="w-5 h-5 mr-2" />
                                                                        Thông tin khách hàng
                                                                    </h2>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center">
                                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                                                    <span className="text-blue-600 font-semibold">
                                                                                        {detailOrder.customerName.charAt(0).toUpperCase()}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-semibold text-gray-900">{detailOrder.customerName}</p>
                                                                                    <p className="text-sm text-gray-500">Khách hàng</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center text-gray-600">
                                                                                <PhoneIcon className="w-4 h-4 mr-2" />
                                                                                {detailOrder.phoneNumber}
                                                                            </div>
                                                                            <div className="flex items-center text-gray-600">
                                                                                <EnvelopeIcon className="w-4 h-4 mr-2" />
                                                                                Không có email
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Người nhận</label>
                                                                                <p className="text-gray-900">{detailOrder.customerName}</p>
                                                                            </div>
                                                                            <div>
                                                                                <label className="text-sm font-medium text-gray-500">Địa chỉ giao hàng</label>
                                                                                <div className="flex items-start text-gray-900">
                                                                                    <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                                                    <p>{detailOrder.streetAddress}, {detailOrder.wardCommune}, {detailOrder.district}, {detailOrder.cityProvince}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Order Items */}
                                                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                                                    <div className="px-6 py-4 border-b border-gray-200">
                                                                        <h2 className="text-xl font-semibold text-gray-900">Sản phẩm đã đặt</h2>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-gray-50">
                                                                                <tr>
                                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Sản phẩm
                                                                                    </th>
                                                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Thông tin
                                                                                    </th>
                                                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Số lượng
                                                                                    </th>
                                                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Đơn giá
                                                                                    </th>
                                                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Thành tiền
                                                                                    </th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                                {detailOrder.items.map((item: OrderItem, index: number) => (
                                                                                    <tr key={index} className="hover:bg-gray-50">
                                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                                            <div className="flex items-center">
                                                                                                <div className="flex-shrink-0 h-16 w-16">
                                                                                                    <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                                                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="ml-4">
                                                                                                    <div className="text-sm font-medium text-gray-900">
                                                                                                        {item.productName}
                                                                                                    </div>
                                                                                                    <div className="text-sm text-gray-500">
                                                                                                        {item.variantName}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                                            <div>
                                                                                                <span className="text-gray-500">Sản phẩm</span>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                                                            {item.quantity}
                                                                                        </td>
                                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                                                            {item.unitPrice.toLocaleString('vi-VN')} ₫
                                                                                        </td>
                                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                                                            {item.totalPrice.toLocaleString('vi-VN')} ₫
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Sidebar */}
                                                            <div className="space-y-6">
                                                                {/* Order Summary */}
                                                                <div className="bg-white rounded-lg shadow p-6">
                                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600">Tổng tiền hàng:</span>
                                                                            <span className="text-gray-900">{detailOrder.subTotal.toLocaleString('vi-VN')} ₫</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-gray-600">Phí vận chuyển:</span>
                                                                            <span className="text-gray-900">{detailOrder.shippingFee.toLocaleString('vi-VN')} ₫</span>
                                                                        </div>
                                                                        {(detailOrder.voucherDiscount || 0) > 0 && (
                                                                            <div className="flex justify-between text-sm">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-green-600">Giảm giá từ voucher:</span>
                                                                                    {detailOrder.voucherCode && (
                                                                                        <span className="text-sm font-medium text-green-500">Mã: {detailOrder.voucherCode}</span>
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-green-600 font-semibold">-{(detailOrder.voucherDiscount || 0).toLocaleString('vi-VN')} ₫</span>
                                                                            </div>
                                                                        )}
                                                                        <hr className="border-gray-200" />
                                                                        <div className="flex justify-between text-lg font-semibold">
                                                                            <span className="text-gray-900">Tổng thanh toán:</span>
                                                                            <span className="text-blue-600">{detailOrder.finalAmount.toLocaleString('vi-VN')} ₫</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Order Timeline */}
                                                                <div className="bg-white rounded-lg shadow p-6">
                                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử trạng thái đơn hàng</h3>
                                                                    <div className="max-h-96 overflow-y-auto">
                                                                        {timelineLoading[detailOrder.orderId] ? (
                                                                            <div className="text-center py-4">
                                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                                                                <p className="text-sm text-gray-500 mt-2">Đang tải lịch sử...</p>
                                                                            </div>
                                                                        ) : orderTimeline[detailOrder.orderId]?.length > 0 ? (
                                                                            <div className="space-y-4">
                                                                                {orderTimeline[detailOrder.orderId].slice().reverse().map((timeline, index) => (
                                                                                    <div key={timeline.id} className="relative">
                                                                                        {/* Timeline line */}
                                                                                        {index < orderTimeline[detailOrder.orderId].length - 1 && (
                                                                                            <div className="absolute left-3 top-6 w-0.5 h-8 bg-gray-200"></div>
                                                                                        )}
                                                                                        
                                                                                        <div className="flex items-start space-x-3">
                                                                                                                                                                                    {/* Timeline dot */}
                                                                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                                                                                            index === 0 ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                                                        }`}></div>
                                                                                            
                                                                                            {/* Timeline content */}
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="text-sm text-gray-900 font-medium">
                                                                                                    {formatTimelineNote(timeline)}
                                                                                                </p>
                                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                                    {formatDateTime(timeline.changedAt)}
                                                                                                </p>
                                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                                    <span className="font-medium">Cập nhật bởi:</span> {timeline.updatedBy || 'Không xác định'}
                                                                                                </p>
                                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                                    <span className="font-medium">Email:</span> {timeline.emailUserUpdate || 'Không có email'}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-gray-500 text-sm">Chưa có lịch sử trạng thái</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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

            {/* Status Update Popup */}
            {showStatusPopup && pendingStatusUpdate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Cập nhật trạng thái đơn hàng
                            </h3>
                            <button
                                onClick={handleStatusUpdateCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái mới
                                </label>
                                <div className="px-3 py-2 bg-gray-100 rounded border">
                                    {TRANSITION_LABELS[pendingStatusUpdate.newStatus] || pendingStatusUpdate.newStatus}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú <span className="text-gray-500">(tùy chọn)</span>
                                </label>
                                <textarea
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    placeholder="Nhập ghi chú cho việc cập nhật trạng thái..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ảnh <span className="text-gray-500">(tùy chọn)</span>
                                </label>
                                
                                {/* Chọn file từ máy tính */}
                                <div className="mb-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>

                                {/* Thêm URL ảnh */}
                                <div className="mb-3">
                                    <button
                                        type="button"
                                        onClick={handleImageUrlAdd}
                                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        + Thêm URL ảnh
                                    </button>
                                </div>

                                {/* Hiển thị file đã chọn */}
                                {selectedFiles.length > 0 && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            File ảnh đã chọn:
                                        </label>
                                        <div className="space-y-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm text-gray-600 truncate">{file.name}</span>
                                                    <button
                                                        onClick={() => removeSelectedFile(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị URL ảnh đã thêm */}
                                {imageUrls.length > 0 && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            URL ảnh đã thêm:
                                        </label>
                                        <div className="space-y-2">
                                            {imageUrls.map((url, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm text-gray-600 truncate">{url}</span>
                                                    <button
                                                        onClick={() => removeImageUrl(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={handleStatusUpdateCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleStatusUpdateConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}