'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Tabs,
    Tab,
    Button,
    Spinner,
    Pagination,
    Card,
    CardBody,
    CardHeader,
    Input
} from "@heroui/react";
import EditFromOrder from './EditFromOrder';
import { useOrderStore } from './orderStore';

const statusMap: { [key: string]: string } = {
    all: 'Tất cả đơn hàng',
    Pending: 'Chờ thanh toán',
    Paid: 'Đã thanh toán',
};

interface AppUser {
    appUserId: number;
    keycloakId: string;
    username: string;
    email: string;
    roles: string[];
    enabled: boolean;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
}

interface Order {
    orderId: number;
    orderCode: string;
    customerName?: string;
    phoneNumber?: string;
    orderStatus: string;
    finalAmount: number;
    subTotalAmount: number;
    discountAmount: number;
}

interface ApiResponse {
    status: number;
    message: string;
    data: AppUser;
    error?: string;
}

export default function PurchaseOrder() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();


    // Định nghĩa giới hạn tạo hóa đơn mới
    const MAX_ORDER_CREATION_LIMIT = 5;

    // State cho toast message - giờ chỉ có error hoặc warning
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);

    // State cho tìm kiếm
    const [searchForm, setSearchForm] = useState({
        orderCode: '',
        customerName: '',
        phoneNumber: ''
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Order[]>([]);
    const [isSearchMode, setIsSearchMode] = useState(false);

    // Zustand store - Tất cả state và logic từ store
    const {
        // States
        orders,
        loading,
        error,
        isCreating,
        page,
        totalPages,
        activeTab,
        isEditMode,

        // Actions
        setPage,
        setActiveTab,
        resetError,

        // API Actions
        fetchOrders,
        createOrder,
        deleteOrder,
        openEditOrder,
    } = useOrderStore();



    // Extract complex expressions for dependency arrays
    const sessionAccessToken = session?.accessToken;
    const sessionUserId = session?.user?.id;







    // Handler để xem chi tiết đơn hàng
    const handleViewDetails = useCallback((order: Order) => {
        openEditOrder(order as Parameters<typeof openEditOrder>[0]);
    }, [openEditOrder]);

    // Auto-fetch orders when dependencies change
    useEffect(() => {
        if (sessionAccessToken) {
            fetchOrders(session);
        }
    }, [session, page, activeTab, fetchOrders, sessionAccessToken]);

    // Tự động mở order khi có query parameter viewOrder
    useEffect(() => {
        if (!searchParams) return;
        
        const viewOrderCode = searchParams.get('viewOrder');
        if (viewOrderCode && orders.length > 0 && !isEditMode) {
            const orderToOpen = orders.find(order => order.orderCode === viewOrderCode);
            if (orderToOpen) {
                console.log('🎯 Auto-opening order from URL:', viewOrderCode);
                handleViewDetails(orderToOpen);
                // Xóa query parameter sau khi đã mở order
                router.replace('/staff/officesales');
            }
        }
    }, [searchParams, orders, isEditMode, router, handleViewDetails]);

    // Function to show a toast message (only warning/error now)
    const showToast = useCallback((message: string, type: 'error' | 'warning' = 'warning') => {
        setToastMessage({ message, type });
        const timer = setTimeout(() => {
            setToastMessage(null);
        }, 5000); // Hide after 5 seconds
        return () => clearTimeout(timer);
    }, []);

    // Handler cho tìm kiếm
    const handleSearch = useCallback(async () => {
        if (!session?.accessToken) return;

        const { orderCode, customerName, phoneNumber } = searchForm;
        
        // Kiểm tra ít nhất một trường có dữ liệu
        if (!orderCode.trim() && !customerName.trim() && !phoneNumber.trim()) {
            showToast('Vui lòng nhập ít nhất một thông tin để tìm kiếm', 'warning');
            return;
        }

        setIsSearching(true);
        try {
            const url = new URL('http://localhost:8080/api/orders/search/simple');
            url.searchParams.append('page', '0');
            url.searchParams.append('size', '50'); // Tăng size để hiển thị nhiều kết quả hơn
            
            if (orderCode.trim()) url.searchParams.append('orderCode', orderCode.trim());
            if (customerName.trim()) url.searchParams.append('customerName', customerName.trim());
            if (phoneNumber.trim()) url.searchParams.append('phoneNumber', phoneNumber.trim());

            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Lỗi ${res.status}: Không thể tìm kiếm đơn hàng.`);
            }

            const responseData = await res.json();
            const results = responseData?.data?.content || [];
            
            setSearchResults(results);
            setIsSearchMode(true);
            
            if (results.length === 0) {
                showToast('Không tìm thấy đơn hàng nào phù hợp với thông tin tìm kiếm', 'warning');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định khi tìm kiếm';
            showToast(errorMessage, 'error');
        } finally {
            setIsSearching(false);
        }
    }, [searchForm, session, showToast]);

    // Handler để xóa kết quả tìm kiếm và quay lại danh sách ban đầu
    const handleClearSearch = useCallback(() => {
        setSearchForm({
            orderCode: '',
            customerName: '',
            phoneNumber: ''
        });
        setSearchResults([]);
        setIsSearchMode(false);
        // Tải lại danh sách đơn hàng ban đầu
        if (session?.accessToken) {
            fetchOrders(session);
        }
    }, [session, fetchOrders]);

    // Handler để làm mới toàn bộ trang (reset state)
    const handleRefresh = useCallback(() => {
        // Reset search state
        setSearchForm({
            orderCode: '',
            customerName: '',
            phoneNumber: ''
        });
        setSearchResults([]);
        setIsSearchMode(false);
        setIsSearching(false);
        
        // Reset toast message
        setToastMessage(null);
        
        // Fetch lại dữ liệu từ đầu
        if (session?.accessToken) {
            fetchOrders(session);
        }
    }, [session, fetchOrders]);

    // Handler cho thay đổi input tìm kiếm
    const handleSearchInputChange = useCallback((field: keyof typeof searchForm, value: string) => {
        setSearchForm(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Handler cho phím Enter
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSearching) {
            handleSearch();
        }
    }, [handleSearch, isSearching]);

    // Handlers using store functions
    const handleTabSelectionChange = (key: string | number) => {
        setActiveTab(key);
    };

    const handleCreateOrder = async () => {
        // --- MODIFICATION START ---
        // Filter for "Pending" orders only
        const pendingOrders = orders.filter(order => order.orderStatus === 'Pending');

        // Check if the maximum order creation limit has been reached for PENDING orders
        if (pendingOrders.length >= MAX_ORDER_CREATION_LIMIT) {
            showToast(`Bạn chỉ được phép tạo tối đa ${MAX_ORDER_CREATION_LIMIT} đơn hàng ở trạng thái 'Chờ thanh toán'. Vui lòng hoàn tất hoặc xóa các đơn hàng đang chờ trước khi tạo mới.`, 'warning');
            return; // Stop the function execution
        }
        // --- MODIFICATION END ---

        // If limits are not met, proceed to create the order
        // No success toast for creation as requested.
        await createOrder(session);
    };

    const handleDeleteOrder = async (orderId: number) => {
        await deleteOrder(orderId, session);
        // No success toast for deletion as requested.
    };

    // Render table content với hỗ trợ tìm kiếm
    const renderTableContent = () => {
        // Hiển thị loading cho tìm kiếm
        if (isSearching) {
            return <div className="flex justify-center items-center h-64"><Spinner label="Đang tìm kiếm..." /></div>;
        }

        if (loading && !isSearchMode) {
            return <div className="flex justify-center items-center h-64"><Spinner label="Đang tải..." /></div>;
        }

        if (error && !isSearchMode) {
            return <div className="text-center text-red-500 p-4 h-64">{error}</div>;
        }

        // Sử dụng kết quả tìm kiếm nếu đang ở chế độ tìm kiếm, ngược lại dùng orders từ store
        const currentOrders = isSearchMode ? searchResults : orders;

        if (currentOrders.length === 0) {
            return (
                <div className="text-center text-gray-500 p-8 h-64 flex flex-col items-center justify-center">
                    <p className="text-lg font-medium mb-2">
                        {isSearchMode ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng tại quầy nào'}
                    </p>
                    <p className="text-sm">
                        {isSearchMode ? 'Thử thay đổi từ khóa tìm kiếm' : 'Tạo đơn hàng mới để bắt đầu bán hàng trực tiếp'}
                    </p>
                </div>
            );
        }

        return (
            <Table
                aria-label="Bảng danh sách đơn hàng"
                bottomContent={
                    // Ẩn pagination khi đang ở chế độ tìm kiếm
                    !isSearchMode && totalPages > 1 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={totalPages}
                                onChange={setPage}
                            />
                        </div>
                    ) : null
                }
            >
                <TableHeader>
                    <TableColumn>MÃ ĐƠN HÀNG</TableColumn>
                    <TableColumn>KHÁCH HÀNG</TableColumn>
                    <TableColumn>SỐ ĐIỆN THOẠI</TableColumn>
                    <TableColumn>TRẠNG THÁI</TableColumn>
                    <TableColumn className="text-right">TỔNG TIỀN</TableColumn>
                    <TableColumn>HÀNH ĐỘNG</TableColumn>
                </TableHeader>
                <TableBody emptyContent={" Không có đơn hàng tại quầy nào."}>
                    {currentOrders.map((order) => (
                        <TableRow key={order.orderId}>
                            <TableCell>{order.orderCode}</TableCell>
                            <TableCell>{order.customerName || 'Khách lẻ'}</TableCell>
                            <TableCell>{order.phoneNumber || 'Không có thông tin'}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.orderStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {order.orderStatus === 'Paid' ? '' : ''}
                                        {' '}
                                        {statusMap[order.orderStatus as keyof typeof statusMap] || order.orderStatus}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{order.finalAmount.toLocaleString('vi-VN')} VND</TableCell>
                            <TableCell className="flex gap-2">
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => handleViewDetails(order)}
                                >
                                    {order.orderStatus === 'Paid' ? ' Xem chi tiết' : ' Xử lý đơn hàng'}
                                </Button>
                                {order.orderStatus!='Paid' &&<Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    onPress={() => handleDeleteOrder(order.orderId)}
                                >
                                    Xóa
                                </Button>}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    };



    // Conditional rendering based on store state
    if (isEditMode) {
        return <EditFromOrder />;
    }

    return (
        <div className="flex w-full flex-col gap-4 p-4">
            {/* Toast Message Display */}
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 p-4 pr-6 rounded-lg border-l-4 shadow-lg flex items-center gap-3 transform transition-transform duration-300 ease-out translate-x-0
                    ${toastMessage.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                    'bg-yellow-50 border-yellow-500 text-yellow-700'}`}
                >
                    <span className="text-xl">
                        {toastMessage.type === 'error' ? '❌' : '⚠️'}
                    </span>
                    <p className="font-semibold">{toastMessage.message}</p>
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => setToastMessage(null)}
                        className="ml-auto text-current" // Use current text color for button icon
                    >
                        &times;
                    </Button>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Quản lý Đơn hàng</h1>
                <div className="flex gap-2">
                    <Button
                        variant="flat"
                        color="default"
                        onClick={handleRefresh}
                        disabled={isCreating || isSearching}
                        startContent={
                            <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                />
                            </svg>
                        }
                    >
                        Làm mới
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleCreateOrder}
                        disabled={isCreating}
                    >
                        {isCreating ? <Spinner color="white" size="sm" /> : "Tạo Đơn Hàng Mới"}
                    </Button>
                </div>
            </div>

            {/* Giao diện tìm kiếm */}
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center w-full">
                        <h3 className="text-lg font-semibold">Tìm kiếm đơn hàng</h3>
                        {isSearchMode && (
                            <Button
                                variant="flat"
                                color="warning"
                                size="sm"
                                onPress={handleClearSearch}
                                startContent={
                                    <svg 
                                        className="w-4 h-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M6 18L18 6M6 6l12 12" 
                                        />
                                    </svg>
                                }
                            >
                                Xóa tìm kiếm
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Mã đơn hàng"
                            placeholder="Nhập mã đơn hàng..."
                            value={searchForm.orderCode}
                            onValueChange={(value) => handleSearchInputChange('orderCode', value)}
                            onKeyDown={handleKeyPress}
                            variant="bordered"
                            size="sm"
                        />
                        <Input
                            label="Tên khách hàng"
                            placeholder="Nhập tên khách hàng..."
                            value={searchForm.customerName}
                            onValueChange={(value) => handleSearchInputChange('customerName', value)}
                            onKeyDown={handleKeyPress}
                            variant="bordered"
                            size="sm"
                        />
                        <Input
                            label="Số điện thoại"
                            placeholder="Nhập số điện thoại..."
                            value={searchForm.phoneNumber}
                            onValueChange={(value) => handleSearchInputChange('phoneNumber', value)}
                            onKeyDown={handleKeyPress}
                            variant="bordered"
                            size="sm"
                        />
                    </div>
                    <div className="flex justify-end mt-4 gap-2">
                        <Button
                            color="primary"
                            onPress={handleSearch}
                            disabled={isSearching}
                            startContent={isSearching ? <Spinner color="white" size="sm" /> : null}
                        >
                            {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => {
                                setSearchForm({
                                    orderCode: '',
                                    customerName: '',
                                    phoneNumber: ''
                                });
                            }}
                            disabled={isSearching}
                        >
                            Xóa form
                        </Button>
                    </div>
                    {isSearchMode && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-blue-700">
                                    📋 Đang hiển thị kết quả tìm kiếm ({searchResults.length} đơn hàng)
                                </p>
                                <p className="text-xs text-blue-600">
                                    💡 Dùng nút "Làm mới" hoặc "Xóa tìm kiếm" để quay lại danh sách đầy đủ
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Thông báo khi không có kết quả tìm kiếm */}
                    {isSearchMode && searchResults.length === 0 && !isSearching && (
                        <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">
                                        Không tìm thấy đơn hàng phù hợp
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Thử tìm kiếm với từ khóa khác hoặc nhấn "Làm mới" để xem tất cả đơn hàng
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>



            {/* Error handling from store */}
            {error && !isCreating && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                    <span className="font-medium">Lỗi!</span> {error}
                    <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        className="ml-2"
                        onPress={resetError}
                    >
                        Đóng
                    </Button>
                </div>
            )}

            {/* Tabs with store state - Ẩn khi đang tìm kiếm */}
            <div>
                {!isSearchMode ? (
                    <Tabs
                        aria-label="Lọc đơn hàng theo trạng thái"
                        items={Object.keys(statusMap).map(statusKey => ({
                            id: statusKey,
                            label: statusMap[statusKey as keyof typeof statusMap]
                        }))}
                        selectedKey={activeTab}
                        onSelectionChange={handleTabSelectionChange}
                        color="primary"
                        variant="underlined"
                    >
                        {(item) => (
                            <Tab key={item.id} title={item.label}>
                                {renderTableContent()}
                            </Tab>
                        )}
                    </Tabs>
                ) : (
                    // Hiển thị trực tiếp bảng khi đang tìm kiếm
                    <div className="mt-4">
                        {renderTableContent()}
                    </div>
                )}
            </div>


        </div>
    );
}