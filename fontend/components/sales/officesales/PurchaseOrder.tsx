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
    CardHeader
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

    // State để lưu thông tin user từ backend
    const [userProfile, setUserProfile] = useState<AppUser | null>(null);
    const [userProfileLoading, setUserProfileLoading] = useState(true);
    const [userProfileError, setUserProfileError] = useState<string | null>(null);
    // Định nghĩa giới hạn tạo hóa đơn mới
    const MAX_ORDER_CREATION_LIMIT = 5;

    // State cho toast message - giờ chỉ có error hoặc warning
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);

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

    // Kiểm tra thông tin số điện thoại từ AppUser (backend)
    const hasPhoneNumber = !!userProfile?.phoneNumber;

    // Extract complex expressions for dependency arrays
    const sessionAccessToken = session?.accessToken;
    const sessionUserId = session?.user?.id;

    // Function để fetch user profile từ backend
    const fetchUserProfile = useCallback(async (keycloakId: string): Promise<AppUser | null> => {
        try {
            const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionAccessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status >= 200 && apiResponse.status < 300 && apiResponse.data) {
                return apiResponse.data;
            }

            throw new Error(apiResponse.error || 'Không có dữ liệu người dùng');
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
            throw error;
        }
    }, [sessionAccessToken]);

    // Effect để fetch user profile khi session thay đổi
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!sessionUserId || !sessionAccessToken) {
                setUserProfileLoading(false);
                return;
            }

            try {
                setUserProfileLoading(true);
                setUserProfileError(null);

                const profile = await fetchUserProfile(sessionUserId);
                setUserProfile(profile);

                console.log('✅ User profile loaded:', profile);
                console.log('📱 Phone number:', profile?.phoneNumber);
                console.log('🔓 Can access features:', !!profile?.phoneNumber);

            } catch (error: unknown) {
                console.error('❌ Failed to load user profile:', error);
                const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin người dùng';
                setUserProfileError(errorMessage);
                setUserProfile(null);
            } finally {
                setUserProfileLoading(false);
            }
        };

        loadUserProfile();
    }, [sessionUserId, sessionAccessToken, fetchUserProfile]);

    // Handler để chuyển hướng đến trang cập nhật thông tin
    const handleGoToUpdateProfile = () => {
        router.push('/user_info');
    };

    // Handler để xem chi tiết đơn hàng
    const handleViewDetails = useCallback((order: Order) => {
        if (!userProfileLoading && !userProfileError && hasPhoneNumber) {
            openEditOrder(order as Parameters<typeof openEditOrder>[0]);
        }
    }, [userProfileLoading, userProfileError, hasPhoneNumber, openEditOrder]);

    // Auto-fetch orders when dependencies change - chỉ khi có số điện thoại và đã load xong profile
    useEffect(() => {
        if (!userProfileLoading && hasPhoneNumber && sessionAccessToken) {
            fetchOrders(session);
        }
    }, [session, page, activeTab, fetchOrders, hasPhoneNumber, userProfileLoading, sessionAccessToken]);

    // Tự động mở order khi có query parameter viewOrder
    useEffect(() => {
        const viewOrderCode = searchParams.get('viewOrder');
        if (viewOrderCode && orders.length > 0 && !isEditMode && hasPhoneNumber && !userProfileLoading) {
            const orderToOpen = orders.find(order => order.orderCode === viewOrderCode);
            if (orderToOpen) {
                console.log('🎯 Auto-opening order from URL:', viewOrderCode);
                handleViewDetails(orderToOpen);
                // Xóa query parameter sau khi đã mở order
                router.replace('/staff/officesales');
            }
        }
    }, [searchParams, orders, isEditMode, router, hasPhoneNumber, userProfileLoading, handleViewDetails]);

    // Function to show a toast message (only warning/error now)
    const showToast = useCallback((message: string, type: 'error' | 'warning' = 'warning') => {
        setToastMessage({ message, type });
        const timer = setTimeout(() => {
            setToastMessage(null);
        }, 5000); // Hide after 5 seconds
        return () => clearTimeout(timer);
    }, []);

    // Handlers using store functions
    const handleTabSelectionChange = (key: string | number) => {
        setActiveTab(key);
    };

    const handleCreateOrder = async () => {
        // First, check if the user is authorized (profile loaded and has phone number)
        if (userProfileLoading || userProfileError !== null || !hasPhoneNumber) {
            showToast("Không thể tạo đơn hàng. Vui lòng kiểm tra thông tin tài khoản và số điện thoại.", 'warning');
            return;
        }

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
        if (!userProfileLoading && !userProfileError && hasPhoneNumber) {
            await deleteOrder(orderId, session);
            // No success toast for deletion as requested.
        }
    };

    // Render table content with all states handled by store
    const renderTableContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><Spinner label="Đang tải..." /></div>;
        }

        if (error) {
            return <div className="text-center text-red-500 p-4 h-64">{error}</div>;
        }

        if (orders.length === 0) {
            return (
                <div className="text-center text-gray-500 p-8 h-64 flex flex-col items-center justify-center">
                    <p className="text-lg font-medium mb-2">Chưa có đơn hàng tại quầy nào</p>
                    <p className="text-sm">Tạo đơn hàng mới để bắt đầu bán hàng trực tiếp</p>
                </div>
            );
        }

        return (
            <Table
                aria-label="Bảng danh sách đơn hàng"
                bottomContent={
                    totalPages > 1 ? (
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
                    {orders.map((order) => (
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
                                    disabled={userProfileLoading || userProfileError !== null || !hasPhoneNumber}
                                    title={
                                        userProfileLoading ? "Đang tải thông tin tài khoản..." :
                                            userProfileError ? "Có lỗi khi tải thông tin tài khoản" :
                                                !hasPhoneNumber ? "Vui lòng cập nhật số điện thoại để sử dụng tính năng này" : ""
                                    }
                                >
                                    {order.orderStatus === 'Paid' ? ' Xem chi tiết' : ' Xử lý đơn hàng'}
                                </Button>
                                {order.orderStatus!='Paid' &&<Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    onPress={() => handleDeleteOrder(order.orderId)}
                                    disabled={userProfileLoading || userProfileError !== null || !hasPhoneNumber}
                                    title={
                                        userProfileLoading ? "Đang tải thông tin tài khoản..." :
                                            userProfileError ? "Có lỗi khi tải thông tin tài khoản" :
                                                !hasPhoneNumber ? "Vui lòng cập nhật số điện thoại để sử dụng tính năng này" : ""
                                    }
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

    // Component hiển thị trạng thái loading user profile
    const renderUserProfileLoading = () => (
        <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardBody>
                <div className="flex items-center justify-center gap-3 py-4">
                    <Spinner size="md" color="primary" />
                    <span className="text-blue-700">Đang tải thông tin tài khoản...</span>
                </div>
            </CardBody>
        </Card>
    );

    // Component hiển thị lỗi khi load user profile
    const renderUserProfileError = () => (
        <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl"></span>
                    <h3 className="text-lg font-bold text-red-800">Lỗi tải thông tin tài khoản</h3>
                </div>
            </CardHeader>
            <CardBody className="pt-0">
                <div className="space-y-3">
                    <p className="text-red-700">
                        {userProfileError}
                    </p>
                    <div className="flex gap-3 mt-4">
                        <Button
                            color="danger"
                            variant="solid"
                            onPress={() => window.location.reload()}
                            startContent="🔄"
                        >
                            Thử lại
                        </Button>
                        <Button
                            color="default"
                            variant="light"
                            onPress={handleGoToUpdateProfile}
                            startContent="📝"
                        >
                            Cập nhật thông tin cá nhân
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );

    // Component cảnh báo thiếu số điện thoại
    const renderPhoneWarning = () => (
        <Card className="mb-6 border-warning-200 bg-warning-50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-bold text-warning-800">Cảnh báo: Thiếu thông tin bắt buộc</h3>
                </div>
            </CardHeader>
            <CardBody className="pt-0">
                <div className="space-y-3">
                    <p className="text-warning-700">
                        Bạn cần cập nhật số điện thoại trong hồ sơ cá nhân để có thể sử dụng tính năng bán hàng tại quầy.
                    </p>
                    <p className="text-sm text-warning-600">
                        Số điện thoại nhân viên là thông tin bắt buộc để xác định người phụ trách và liên hệ với khách hàng khi cần thiết.
                    </p>
                    <div className="flex gap-3 mt-4">
                        <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                            📋 Tài khoản hiện tại: {userProfile?.fullName || userProfile?.email || 'Không xác định'}
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button
                            color="warning"
                            variant="solid"
                            onPress={handleGoToUpdateProfile}
                            startContent="📝"
                        >
                            Cập nhật thông tin cá nhân
                        </Button>
                        <Button
                            color="default"
                            variant="light"
                            onPress={() => window.location.reload()}
                            startContent="🔄"
                        >
                            Tải lại trang
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );

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
                <Button
                    color="primary"
                    onClick={handleCreateOrder}
                    disabled={isCreating || userProfileLoading || userProfileError !== null || !hasPhoneNumber}
                    title={
                        userProfileLoading ? "Đang tải thông tin tài khoản..." :
                            userProfileError ? "Có lỗi khi tải thông tin tài khoản" :
                                !hasPhoneNumber ? "Vui lòng cập nhật số điện thoại trước khi tạo đơn hàng" : ""
                    }
                >
                    {isCreating ? <Spinner color="white" size="sm" /> : "Tạo Đơn Hàng Mới"}
                </Button>
            </div>

            {/* Hiển thị trạng thái loading user profile */}
            {userProfileLoading && renderUserProfileLoading()}

            {/* Hiển thị lỗi khi load user profile */}
            {userProfileError && renderUserProfileError()}

            {/* Hiển thị cảnh báo nếu không có số điện thoại (chỉ khi đã load xong profile) */}
            {!userProfileLoading && !userProfileError && !hasPhoneNumber && renderPhoneWarning()}

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

            {/* Tabs with store state - Disable khi không có số điện thoại hoặc đang loading */}
            <div className={userProfileLoading || userProfileError || !hasPhoneNumber ? "pointer-events-none opacity-50" : ""}>
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
                    isDisabled={userProfileLoading || userProfileError !== null || !hasPhoneNumber}
                >
                    {(item) => (
                        <Tab key={item.id} title={item.label}>
                            {(!userProfileLoading && !userProfileError && hasPhoneNumber) ? renderTableContent() : (
                                <div className="text-center py-20 text-gray-500">
                                    {userProfileLoading ? (
                                        <>
                                            <Spinner size="lg" className="mb-4" />
                                            <p>Đang tải thông tin tài khoản...</p>
                                        </>
                                    ) : userProfileError ? (
                                        <>
                                            <p className="text-lg mb-2">❌</p>
                                            <p>Có lỗi khi tải thông tin tài khoản</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg mb-2">📱</p>
                                            <p>Vui lòng cập nhật số điện thoại để sử dụng tính năng này</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </Tab>
                    )}
                </Tabs>
            </div>

            {/* Overlay cảnh báo khi không thể sử dụng tính năng */}
            {(!userProfileLoading && !userProfileError && !hasPhoneNumber) && (
                <div className="fixed inset-0 bg-black bg-opacity-20 pointer-events-none z-10 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4 border-2 border-warning-300">
                        <div className="text-center">
                            <span className="text-4xl mb-4 block">🔒</span>
                            <h3 className="text-lg font-bold text-gray-800">Tính năng bị khóa</h3>
                            <p className="text-sm text-gray-600">
                                Cập nhật số điện thoại để mở khóa tính năng bán hàng tại quầy
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}