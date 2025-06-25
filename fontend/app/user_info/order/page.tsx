"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jwtDecode } from 'jwt-decode';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    useDisclosure
} from "@heroui/react";
import { 
    ShoppingCart, 
    Calendar, 
    Phone,
    CreditCard, 
    Package,
} from "lucide-react";
import {CldImage} from "next-cloudinary";

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

interface OrderDetail {
    orderId: number;
    orderCode: string;
    orderDate: string;
    orderStatus: string;
    customerName: string;
    phoneNumber: string;
    finalAmount: number;
    subTotalAmount: number;
    shippingFee: number;
    discountAmount: number;
    shippingMethod: string;
    recipientName: string;
    fullAddress: string;
    email: string;
    fullName: string;
    customerNotes: string;
}

interface DecodedToken {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [clientId: string]: {
            roles: string[];
        };
    };
    [key: string]: any;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
    error?: string;
    path?: string;
}

export default function OrderPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<AppUser | null>(null);
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Hàm lấy thông tin user
    const fetchUserByKeycloakId = async (keycloakId: string): Promise<AppUser> => {
        const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse<AppUser> = await response.json();
        
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy thông tin người dùng');
        }

        if (apiResponse.error) {
            throw new Error(apiResponse.error);
        }

        if (!apiResponse.data) {
            throw new Error('Không có dữ liệu người dùng trong response');
        }
        
        return apiResponse.data;
    };

    // Hàm lấy đơn hàng theo số điện thoại hoặc email
    const fetchOrdersByContact = async (searchValue: string): Promise<OrderDetail[]> => {
        const response = await fetch(`http://localhost:8080/api/orders/search?searchValue=${encodeURIComponent(searchValue)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return []; // Không có đơn hàng nào
            }
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse<OrderDetail[]> = await response.json();
        
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            if (apiResponse.status === 404) {
                return [];
            }
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy đơn hàng');
        }

        if (apiResponse.error) {
            throw new Error(apiResponse.error);
        }

        return apiResponse.data || [];
    };

    // Lấy thông tin user và orders
    useEffect(() => {
        const getUserAndOrders = async () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                const keycloakId = tokenData.sub;
                if (!keycloakId) {
                    throw new Error("Không tìm thấy keycloakId trong token");
                }

                // Lấy thông tin user
                const userData = await fetchUserByKeycloakId(keycloakId);
                setUser(userData);

                // Lấy đơn hàng theo số điện thoại hoặc email
                setLoadingOrders(true);
                const searchValue = userData.phoneNumber || userData.email;
                if (searchValue) {
                    const ordersData = await fetchOrdersByContact(searchValue);
                    setOrders(ordersData);
                }

            } catch (err: any) {
                console.error("Lỗi khi lấy thông tin:", err);
                setError(err.message || "Không thể lấy thông tin. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
                setLoadingOrders(false);
            }
        };

        getUserAndOrders();
    }, [session, status]);

    // Hàm format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Hàm format ngày
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Hàm lấy màu status chip
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'warning';
            case 'paid': return 'success';
            case 'partial': return 'secondary';
            case 'completed': return 'success';
            case 'cancelled': return 'danger';
            default: return 'default';
        }
    };

    // Hàm mở modal chi tiết (giữ lại cho backward compatibility)
    const handleViewDetails = (order: OrderDetail) => {
        setSelectedOrder(order);
        onOpen();
    };

    // Hàm điều hướng đến trang chi tiết mới
    const handleViewDetailsPage = (orderCode: string) => {
        router.push(`/user_info/order/${orderCode}`);
    };

    if (status === 'loading' || loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardBody className="text-center">
                    <p className="text-danger mb-4">{error}</p>
                    <Button color="primary" onClick={() => window.location.reload()}>
                        Thử lại
                    </Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="flex gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {user?.avatarUrl ? (
                            <CldImage
                                width={64}
                                height={64}
                                src={user.avatarUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-default-200 flex items-center justify-center">
                                <span className="text-default-500 text-lg font-medium">
                                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xl font-bold">Đơn hàng của tôi</p>
                        <p className="text-small text-default-500">
                            {user?.fullName || user?.username} • {user?.email}
                        </p>
                        {user?.phoneNumber && (
                            <p className="text-small text-default-500 flex items-center gap-1">
                                <Phone size={12} />
                                {user.phoneNumber}
                            </p>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <ShoppingCart className="text-primary" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.length}</p>
                        <p className="text-small text-default-500">Tổng đơn hàng</p>
                    </CardBody>
                </Card>
                
                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Package className="text-success" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus.toLowerCase() === 'paid').length}</p>
                        <p className="text-small text-default-500">Đã thanh toán</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Calendar className="text-warning" size={24} />
                        </div>
                        <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus.toLowerCase() === 'pending').length}</p>
                        <p className="text-small text-default-500">Chờ thanh toán</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            <CreditCard className="text-secondary" size={24} />
                        </div>
                        <p className="text-2xl font-bold">
                            {formatCurrency(orders.reduce((sum, order) => sum + order.finalAmount, 0))}
                        </p>
                        <p className="text-small text-default-500">Tổng giá trị</p>
                    </CardBody>
                </Card>
            </div>

            {/* Danh sách đơn hàng */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Danh sách đơn hàng</h3>
                </CardHeader>
                <CardBody>
                    {loadingOrders ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart size={48} className="text-default-400 mx-auto mb-4" />
                            <p className="text-default-500">Bạn chưa có đơn hàng nào</p>
                        </div>
                    ) : (
                        <Table aria-label="Bảng đơn hàng">
                            <TableHeader>
                                <TableColumn>MÃ ĐƠN HÀNG</TableColumn>
                                <TableColumn>NGÀY ĐẶT</TableColumn>
                                <TableColumn>TRẠNG THÁI</TableColumn>
                                <TableColumn>TỔNG TIỀN</TableColumn>
                                <TableColumn>HÀNH ĐỘNG</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.orderId}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.orderCode}</p>
                                                <p className="text-small text-default-500">{order.customerName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-default-400" />
                                                {formatDate(order.orderDate)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                color={getStatusColor(order.orderStatus)} 
                                                variant="flat"
                                                size="sm"
                                            >
                                                {order.orderStatus}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{formatCurrency(order.finalAmount)}</p>
                                                {order.discountAmount > 0 && (
                                                    <p className="text-small text-success">
                                                        Giảm: {formatCurrency(order.discountAmount)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    onClick={() => handleViewDetailsPage(order.orderCode)}
                                                >
                                                    Chi tiết đầy đủ
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
