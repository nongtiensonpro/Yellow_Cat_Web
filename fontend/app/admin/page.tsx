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
import StatisticsByDay from '@/components/statistics/StatisticsByDay';


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

// Define a new interface for PromotionStats to match backend PromotionStatistics
interface PromotionStats {
    // Thống kê đợt khuyến mãi (promotions table)
    totalPromotions: number;
    activePromotions: number;
    expiredPromotions: number;
    upcomingPromotions: number;
    inactivePromotions: number;
    
    // Thống kê sản phẩm được khuyến mãi (promotion_products table)
    totalPromotionProducts: number;
    activePromotionProducts: number;
    expiredPromotionProducts: number;
    upcomingPromotionProducts: number;
    
    // Statistics by discount type
    percentageDiscounts: number;
    fixedAmountDiscounts: number;
    freeShippingDiscounts: number;
    
    // Overall value statistics (meaningful comparisons only)
    totalDiscountValue: number;
    averageDiscountValue: number;
    maxDiscountValue: number;
    minDiscountValue: number;
    
    // Detailed statistics for percentage discounts (%)
    maxPercentageDiscount?: number;
    minPercentageDiscount?: number;
    avgPercentageDiscount?: number;
    
    // Detailed statistics for fixed amount discounts (VND)
    maxFixedAmountDiscount?: number;
    minFixedAmountDiscount?: number;
    avgFixedAmountDiscount?: number;
    totalFixedAmountDiscount?: number;
    
    // Additional insights
    mostCommonDiscountValue?: number;
    mostPopularDiscountType?: string;
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

    // Các thống kê khác


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
                const accessToken = session.accessToken as string;
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
                    throw new Error(`HTTP error! Status: ${response.status}`);
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
                const accessToken = session?.accessToken;
                const response = await fetch('http://localhost:8080/api/products/management?page=0&size=1000', {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                if (!response.ok) throw new Error("Không thể lấy dữ liệu sản phẩm");
                const data = await response.json();
                const products = data?.data?.content || [];
                setProductStats({
                    total: products.length,
                    active: products.filter((p: { isActive: boolean }) => p.isActive).length,
                    inactive: products.filter((p: { isActive: boolean }) => !p.isActive).length,
                    outOfStock: products.filter((p: { totalStock: number }) => p.totalStock === 0).length,
                });
            } catch {
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
        totalPromotions: 0,
        activePromotions: 0,
        expiredPromotions: 0,
        upcomingPromotions: 0,
        inactivePromotions: 0,
        totalPromotionProducts: 0,
        activePromotionProducts: 0,
        expiredPromotionProducts: 0,
        upcomingPromotionProducts: 0,
        percentageDiscounts: 0,
        fixedAmountDiscounts: 0,
        freeShippingDiscounts: 0,
        totalDiscountValue: 0,
        averageDiscountValue: 0,
        maxDiscountValue: 0,
        minDiscountValue: 0,
        // Optional fields can be undefined initially
    });
    const [promotionLoading, setPromotionLoading] = useState(true);

    // New useEffect for fetching promotion stats
    useEffect(() => {
        const fetchPromotionStats = async () => {
            if (status === "loading") return;
            
            setPromotionLoading(true);
            try {
                const accessToken = session?.accessToken;
                // Use the new promotion statistics API
                const response = await fetch('http://localhost:8080/api/promotion-statistics/overview', {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                if (!response.ok) throw new Error("Không thể lấy dữ liệu khuyến mãi");
                const data: PromotionStats = await response.json();
                
                // Use the data directly from the new API
                setPromotionStats(data);
            } catch (e) {
                console.error("Lỗi khi lấy thống kê khuyến mãi:", e);
                setPromotionStats({
                    totalPromotions: 0,
                    activePromotions: 0,
                    expiredPromotions: 0,
                    upcomingPromotions: 0,
                    inactivePromotions: 0,
                    totalPromotionProducts: 0,
                    activePromotionProducts: 0,
                    expiredPromotionProducts: 0,
                    upcomingPromotionProducts: 0,
                    percentageDiscounts: 0,
                    fixedAmountDiscounts: 0,
                    freeShippingDiscounts: 0,
                    totalDiscountValue: 0,
                    averageDiscountValue: 0,
                    maxDiscountValue: 0,
                    minDiscountValue: 0,
                    // Optional fields remain undefined on error
                });
            } finally {
                setPromotionLoading(false);
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
                        <Avatar icon={<Percent size={24} />} />
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-700 dark:text-white">Quản lý Khuyến mãi</p>
                            {promotionLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
                                    <span className="text-sm text-gray-500">Đang tải...</span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500">
                                    Tổng quan hệ thống khuyến mãi
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody>

                    </CardBody>
                    <CardFooter className="pt-2">
                        <div className="flex gap-2 w-full">
                            <Button as={Link} href="/admin/promotion_management/vouchers" variant="flat" size="sm" className="flex-1">
                                KM chung
                            </Button>
                            <Button as={Link} href="/admin/promotion_products" color="primary" size="sm" className="flex-1">
                                KM theo sản phẩm
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <Divider className="mb-8" />

            {/* Promotion Insights Section */}
            {!promotionLoading && promotionStats.totalPromotions > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📈Khuyến mãi chi tiết</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Card className="shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-500">
                            <CardHeader className="pb-2">
                                <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                    📋 Khuyến mãi chung
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        Campaigns
                                    </span>
                                </h3>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm">Đang chạy</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">{promotionStats.activePromotions}</div>
                                            <div className="text-xs text-gray-500">
                                                {promotionStats.totalPromotions > 0 
                                                    ? Math.round((promotionStats.activePromotions / promotionStats.totalPromotions) * 100)
                                                    : 0}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span className="text-sm">Sắp tới</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-orange-600">{promotionStats.upcomingPromotions}</div>
                                            <div className="text-xs text-gray-500">
                                                {promotionStats.totalPromotions > 0 
                                                    ? Math.round((promotionStats.upcomingPromotions / promotionStats.totalPromotions) * 100)
                                                    : 0}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-sm">Đã kết thúc</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-red-600">{promotionStats.expiredPromotions}</div>
                                            <div className="text-xs text-gray-500">
                                                {promotionStats.totalPromotions > 0 
                                                    ? Math.round((promotionStats.expiredPromotions / promotionStats.totalPromotions) * 100)
                                                    : 0}%
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardBody>
                            <CardFooter>
                                <div className="w-full text-center border-t border-blue-200">
                                    <div className="text-2xl font-bold text-blue-600">{promotionStats.totalPromotions}</div>
                                    <div className="text-xs text-gray-500">Tổng đợt KM</div>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card className="shadow-md bg-gradient-to-br from-emerald-50 to-green-50 border-l-4 border-emerald-500">
                            <CardHeader className="pb-2">
                                <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                    🛍️ Sản phẩm khuyến mãi
                                    <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
                                        Products
                                    </span>
                                </h3>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm">Đang giảm giá</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">{promotionStats.activePromotionProducts}</div>
                                            <div className="text-xs text-gray-500">sản phẩm</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm">Sắp giảm giá</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-600">{promotionStats.upcomingPromotionProducts}</div>
                                            <div className="text-xs text-gray-500">sản phẩm</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                            <span className="text-sm">Đã hết giảm</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-600">{promotionStats.expiredPromotionProducts}</div>
                                            <div className="text-xs text-gray-500">sản phẩm</div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                            <CardFooter>
                                <div className="w-full text-center pt-2 border-t border-emerald-200">
                                    <div className="text-2xl font-bold text-emerald-600">{promotionStats.totalPromotionProducts}</div>
                                    <div className="text-xs text-gray-500">Tổng SP được KM</div>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card className="shadow-md bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500">
                            <CardHeader className="pb-2">
                                <h3 className="text-sm font-semibold text-purple-700">🎯 Phân loại giảm giá</h3>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Percent size={16} className="text-blue-500" />
                                            <span className="text-sm">Giảm %</span>
                                        </div>
                                        <div className="text-lg font-bold text-blue-600">{promotionStats.percentageDiscounts}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-500 font-bold text-sm">₫</span>
                                            <span className="text-sm">Giảm tiền</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">{promotionStats.fixedAmountDiscounts}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package size={16} className="text-orange-500" />
                                            <span className="text-sm">Free ship</span>
                                        </div>
                                        <div className="text-lg font-bold text-orange-600">{promotionStats.freeShippingDiscounts}</div>
                                    </div>

                                </div>
                            </CardBody>
                            <CardFooter>
                                {promotionStats.totalPromotions > 0 && (
                                    <div className="w-full text-center pt-2 border-t border-purple-200">
                                        <div className="text-lg font-bold text-purple-600">
                                            {Math.round((promotionStats.totalPromotionProducts / promotionStats.totalPromotions) * 10) / 10}
                                        </div>
                                        <div className="text-xs text-gray-500">SP/Đợt</div>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                        <Card className="shadow-md bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-indigo-500">
                            <CardHeader className="pb-2">
                                <h3 className="text-sm font-semibold text-indigo-700">💰 Giá trị khuyến mãi</h3>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-4">
                                    {/* Percentage Discounts Section */}
                                    {promotionStats.percentageDiscounts > 0 && (
                                        <div className="border-l-3 border-blue-500 pl-3">
                                            <div className="text-xs font-semibold text-blue-600 mb-2">
                                                📊 Giảm % ({promotionStats.percentageDiscounts})
                                            </div>
                                            <div className="space-y-2">
                                                {promotionStats.maxPercentageDiscount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Max</span>
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {promotionStats.maxPercentageDiscount}%
                                                        </span>
                                                    </div>
                                                )}
                                                {promotionStats.minPercentageDiscount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Min</span>
                                                        <span className="text-sm font-medium text-blue-500">
                                                            {promotionStats.minPercentageDiscount}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fixed Amount Discounts Section */}
                                    {promotionStats.fixedAmountDiscounts > 0 && (
                                        <div className="border-l-3 border-green-500 pl-3">
                                            <div className="text-xs font-semibold text-green-600 mb-2">
                                                💸 Giảm tiền ({promotionStats.fixedAmountDiscounts})
                                            </div>
                                            <div className="space-y-2">
                                                {promotionStats.maxFixedAmountDiscount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Max</span>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(promotionStats.maxFixedAmountDiscount)}₫
                                                        </span>
                                                    </div>
                                                )}
                                                {promotionStats.minFixedAmountDiscount && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Min</span>
                                                        <span className="text-sm font-medium text-green-500">
                                                            {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(promotionStats.minFixedAmountDiscount)}₫
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {promotionStats.percentageDiscounts === 0 && promotionStats.fixedAmountDiscounts === 0 && (
                                        <div className="text-center py-2">
                                            <div className="text-gray-400 text-xs">
                                                Chỉ có khuyến mãi miễn phí ship
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}