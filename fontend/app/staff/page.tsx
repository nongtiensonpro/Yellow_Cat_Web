"use client"

import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Divider,
    Chip,
    Avatar,
} from "@heroui/react";
import {Users, Package, UserCheck, UserX, Shield, User, Percent} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatisticsByDay from '@/components/statistics/StatisticsByDay'

import { jwtDecode } from 'jwt-decode';
import {IconBasket} from "@tabler/icons-react";

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
    [key: string]: unknown;
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

interface UserStats {
    total: number;
    active: number;
    inactive: number;
    adminWeb: number;
    staffWeb: number;
    defaultUsers: number;
}

interface Users {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    realmRoles: string[];
    clientRoles: string[];
    enabled: boolean;
}

interface ProductStats {
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
}

// Interface cho Product từ API
interface Product {
    id: string;
    name: string;
    isActive: boolean;
    totalStock: number;
    price: number;
    description?: string;
}

// Interface cho Promotion từ API  
interface Promotion {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    discountPercentage?: number;
    isActive: boolean;
}

// Define a new interface for PromotionStats
interface PromotionStats {
    total: number;
    active: number;
    expired: number;
    upcoming: number;
}


export default function AdminDashboard() {
    const { data: session, status } = useSession();

    // Thống kê người dùng chi tiết
    const [userStats, setUserStats] = useState<UserStats>({
        total: 0,
        active: 0,
        inactive: 0,
        adminWeb: 0,
        staffWeb: 0,
        defaultUsers: 0,
    });


    // Dark mode toggle
    const [darkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getUserStats = async () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const extendedSession = session as unknown as ExtendedSession;
                const accessToken = extendedSession.accessToken;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];

                // Kiểm tra quyền admin
                if (!clientRoles.includes('Admin_Web')) {
                    setError("Bạn không có quyền truy cập trang này");
                    setLoading(false);
                    return;
                }

                // Fetch dữ liệu người dùng từ API
                const response = await fetch('http://localhost:8080/api/admin/users', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    console.log(`HTTP error! Status: ${response.status}`);
                }

                const users: Users[] = await response.json();

                // Tính toán thống kê từ dữ liệu thực tế
                const statistics: UserStats = {
                    total: users.length,
                    active: users.filter(user => user.enabled).length,
                    inactive: users.filter(user => !user.enabled).length,
                    adminWeb: users.filter(user =>
                        user.roles.includes('Admin_Web') ||
                        user.clientRoles.includes('Admin_Web')
                    ).length,
                    staffWeb: users.filter(user =>
                        user.roles.includes('Staff_Web') ||
                        user.clientRoles.includes('Staff_Web')
                    ).length,
                    defaultUsers: users.filter(user => {
                        const hasOnlyDefaultRole = user.roles.length === 1 &&
                            user.roles.includes('default-roles-yellow cat company');
                        const hasNoSpecialRoles = !user.roles.includes('Admin_Web') &&
                            !user.roles.includes('Staff_Web') &&
                            !user.clientRoles.includes('Admin_Web') &&
                            !user.clientRoles.includes('Staff_Web');
                        return hasOnlyDefaultRole || hasNoSpecialRoles;
                    }).length,
                };

                setUserStats(statistics);
            } catch (err) {
                console.error("Lỗi khi lấy thống kê người dùng:", err);
                setError("Không thể lấy thống kê người dùng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        getUserStats();
    }, [session, status]);

    const [productStats, setProductStats] = useState<ProductStats>({
        total: 0,
        active: 0,
        inactive: 0,
        outOfStock: 0,
    });

    useEffect(() => {
        const fetchProductStats = async () => {
            try {
                const extendedSession = session as unknown as ExtendedSession | null;
                const accessToken = extendedSession?.accessToken;
                const response = await fetch('http://localhost:8080/api/products/management?page=0&size=1000', {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                if (!response.ok) throw new Error("Không thể lấy dữ liệu sản phẩm");
                const data = await response.json();
                const products: Product[] = data?.data?.content || [];
                setProductStats({
                    total: products.length,
                    active: products.filter((p: Product) => p.isActive).length,
                    inactive: products.filter((p: Product) => !p.isActive).length,
                    outOfStock: products.filter((p: Product) => p.totalStock === 0).length,
                });
            } catch (error) {
                console.error("Lỗi khi lấy thống kê sản phẩm:", error);
                setProductStats({
                    total: 0,
                    active: 0,
                    inactive: 0,
                    outOfStock: 0,
                });
            }
        };
        if (status === "authenticated") fetchProductStats();
    }, [session, status]);

    // New state for promotion stats
    const [promotionStats, setPromotionStats] = useState<PromotionStats>({
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0,
    });

    // New useEffect for fetching promotion stats
    useEffect(() => {
        const fetchPromotionStats = async () => {
            try {
                const extendedSession = session as unknown as ExtendedSession | null;
                const accessToken = extendedSession?.accessToken;
                // Assuming an API endpoint for promotions, adjust as needed
                const response = await fetch('http://localhost:8080/api/promotions', {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                if (!response.ok) throw new Error("Không thể lấy dữ liệu khuyến mãi");
                const data = await response.json();
                const promotions: Promotion[] = data || []; // Assuming the API returns an array of promotions

                const now = new Date();
                setPromotionStats({
                    total: promotions.length,
                    active: promotions.filter((p: Promotion) => new Date(p.startDate) <= now && new Date(p.endDate) >= now).length,
                    expired: promotions.filter((p: Promotion) => new Date(p.endDate) < now).length,
                    upcoming: promotions.filter((p: Promotion) => new Date(p.startDate) > now).length,
                });
            } catch (error) {
                console.error("Lỗi khi lấy thống kê khuyến mãi:", error);
                setPromotionStats({
                    total: 0,
                    active: 0,
                    expired: 0,
                    upcoming: 0,
                });
            }
        };
        if (status === "authenticated") fetchPromotionStats();
    }, [session, status]);


    if (status === 'loading' || loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => window.location.reload()}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 px-4 md:px-36 transition-colors ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-primary">📊 Bảng điều khiển Admin</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <Card className="shadow-lg">
                    <CardHeader className="flex items-center gap-3">
                        <Avatar icon={<Users size={24} />} color="primary" />
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-700 dark:text-white">Người dùng</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{userStats.total}</p>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <UserCheck size={16} className="text-green-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Đang hoạt động</span>
                                </div>
                                <Chip size="sm" color="success" variant="flat">
                                    {userStats.active} ({userStats.total > 0 ? Math.round((userStats.active / userStats.total) * 100) : 0}%)
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <UserX size={16} className="text-red-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Không hoạt động</span>
                                </div>
                                <Chip size="sm" color="danger" variant="flat">
                                    {userStats.inactive} ({userStats.total > 0 ? Math.round((userStats.inactive / userStats.total) * 100) : 0}%)
                                </Chip>
                            </div>
                            <Divider className="my-2" />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-purple-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Admin trang web</span>
                                </div>
                                <Chip size="sm" color="secondary" variant="flat">
                                    {userStats.adminWeb}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-yellow-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Nhân viên</span>
                                </div>
                                <Chip size="sm" color="warning" variant="flat">
                                    {userStats.staffWeb}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Khách hàng</span>
                                </div>
                                <Chip size="sm" color="default" variant="flat">
                                    {userStats.defaultUsers}
                                </Chip>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Button as={Link} href="/admin/account_management" color="primary" variant="flat" size="sm" className="w-full">
                            Quản lý tài khoản
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex items-center gap-3">
                        <Avatar icon={<Package size={24} />} color="success" />
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-700 dark:text-white">Sản phẩm</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-300">{productStats.total}</p>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Đang bán</span>
                                <Chip size="sm" color="success" variant="flat">
                                    {productStats.active}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Ngừng bán</span>
                                <Chip size="sm" color="danger" variant="flat">
                                    {productStats.inactive}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Hết hàng</span>
                                <Chip size="sm" color="warning" variant="flat">
                                    {productStats.outOfStock}
                                </Chip>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Button as={Link} href="/admin/product_management" color="success" variant="flat" size="sm">
                            Quản lý sản phẩm
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex items-center gap-3">
                        <Avatar icon={<IconBasket size={24} />} color="default" />
                        <div>
                            <p className="text-lg font-semibold text-gray-700 dark:text-white">Bán hàng</p>
                        </div>
                    </CardHeader>
                    <CardBody>
                    </CardBody>
                    <CardFooter>
                        <Button className={"m-1"} as={Link} href="/staff/officesales" color="warning" variant="flat" size="sm">
                            Bán hàng tại quầy
                        </Button>
                        <Button className={"m-1"} as={Link} href="/staff/page.tsx" color="warning" variant="flat" size="sm">
                            Bán hàng online
                        </Button>
                    </CardFooter>
                </Card>
                {/* New Card for Promotion Management */}
                <Card className="shadow-lg">
                    <CardHeader className="flex items-center gap-3">
                        <Avatar icon={<Percent size={24} />} /> {/* Using Percent icon */}
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-700 dark:text-white">Khuyến mãi</p>
                            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{promotionStats.total}</p>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Đang hoạt động</span>
                                <Chip size="sm" color="success" variant="flat">
                                    {promotionStats.active}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Đã kết thúc</span>
                                <Chip size="sm" color="danger" variant="flat">
                                    {promotionStats.expired}
                                </Chip>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Sắp diễn ra</span>
                                <Chip size="sm" color="warning" variant="flat">
                                    {promotionStats.upcoming}
                                </Chip>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter>
                        <Button as={Link} href="/admin/promotion_management"  variant="flat" size="sm">
                            Quản lý khuyến mãi
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Divider className="mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <StatisticsByDay/>
            </div>
        </div>
    );
}