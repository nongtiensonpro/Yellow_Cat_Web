// "use client"
//
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     CardFooter,
//     Button,
//     Divider,
//     Chip,
//     Avatar,
// } from "@heroui/react";
// import { Users, Package, BarChart2, Moon, Sun, UserCheck, UserX, Shield, User } from "lucide-react";
// import Link from "next/link";
// import { useState, useEffect } from "react";
// import { useSession } from 'next-auth/react';
// import LoadingSpinner from '@/components/LoadingSpinner';
// import { jwtDecode } from 'jwt-decode';
//
// interface DecodedToken {
//     sub?: string;
//     preferred_username?: string;
//     email?: string;
//     given_name?: string;
//     family_name?: string;
//     realm_access?: {
//         roles: string[];
//     };
//     resource_access?: {
//         [clientId: string]: {
//             roles: string[];
//         };
//     };
//     [key: string]: any;
// }
//
// interface UserStats {
//     total: number;
//     active: number;
//     inactive: number;
//     adminWeb: number;
//     staffWeb: number;
//     defaultUsers: number;
// }
//
// interface Users {
//     id: string;
//     username: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     roles: string[];
//     realmRoles: string[];
//     clientRoles: string[];
//     enabled: boolean;
// }
//
// interface ProductStats {
//     total: number;
//     active: number;
//     inactive: number;
//     outOfStock: number;
// }
//
// export default function AdminDashboard() {
//     const { data: session, status } = useSession();
//
//     // Thống kê người dùng chi tiết
//     const [userStats, setUserStats] = useState<UserStats>({
//         total: 0,
//         active: 0,
//         inactive: 0,
//         adminWeb: 0,
//         staffWeb: 0,
//         defaultUsers: 0,
//     });
//
//     // Các thống kê khác
//     const [stats] = useState({
//         products: 342,
//         orders: 55555555555,
//         revenue: 55555555555,
//     });
//
//     // Dark mode toggle
//     const [darkMode, setDarkMode] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//
//     // Lấy thống kê người dùng từ API thực tế
//     useEffect(() => {
//         const getUserStats = async () => {
//             if (status === 'loading') {
//                 return;
//             }
//
//             if (status === 'unauthenticated' || !session) {
//                 setError("Người dùng chưa đăng nhập");
//                 setLoading(false);
//                 return;
//             }
//
//             try {
//                 const accessToken = session.accessToken as string;
//                 if (!accessToken) {
//                     throw new Error("Không tìm thấy access token hợp lệ");
//                 }
//
//                 const tokenData = jwtDecode<DecodedToken>(accessToken);
//                 const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
//
//                 // Kiểm tra quyền admin
//                 if (!clientRoles.includes('Admin_Web')) {
//                     setError("Bạn không có quyền truy cập trang này");
//                     setLoading(false);
//                     return;
//                 }
//
//                 // Fetch dữ liệu người dùng từ API
//                 const response = await fetch('http://localhost:8080/api/admin/users', {
//                     headers: {
//                         Authorization: `Bearer ${accessToken}`,
//                     },
//                 });
//
//                 if (!response.ok) {
//                     throw new Error(`HTTP error! Status: ${response.status}`);
//                 }
//
//                 const users: Users[] = await response.json();
//
//                 // Tính toán thống kê từ dữ liệu thực tế
//                 const statistics: UserStats = {
//                     total: users.length,
//                     active: users.filter(user => user.enabled).length,
//                     inactive: users.filter(user => !user.enabled).length,
//                     adminWeb: users.filter(user =>
//                         user.roles.includes('Admin_Web') ||
//                         user.clientRoles.includes('Admin_Web')
//                     ).length,
//                     staffWeb: users.filter(user =>
//                         user.roles.includes('Staff_Web') ||
//                         user.clientRoles.includes('Staff_Web')
//                     ).length,
//                     defaultUsers: users.filter(user => {
//                         const hasOnlyDefaultRole = user.roles.length === 1 &&
//                             user.roles.includes('default-roles-yellow cat company');
//                         const hasNoSpecialRoles = !user.roles.includes('Admin_Web') &&
//                             !user.roles.includes('Staff_Web') &&
//                             !user.clientRoles.includes('Admin_Web') &&
//                             !user.clientRoles.includes('Staff_Web');
//                         return hasOnlyDefaultRole || hasNoSpecialRoles;
//                     }).length,
//                 };
//
//                 setUserStats(statistics);
//             } catch (err) {
//                 console.error("Lỗi khi lấy thống kê người dùng:", err);
//                 setError("Không thể lấy thống kê người dùng. Vui lòng thử lại sau.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         getUserStats();
//     }, [session, status]);
//
//     const [productStats, setProductStats] = useState<ProductStats>({
//         total: 0,
//         active: 0,
//         inactive: 0,
//         outOfStock: 0,
//     });
//
//     useEffect(() => {
//         const fetchProductStats = async () => {
//             try {
//                 const accessToken = session?.accessToken;
//                 const response = await fetch('http://localhost:8080/api/products/management?page=0&size=1000', {
//                     headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
//                 });
//                 if (!response.ok) throw new Error("Không thể lấy dữ liệu sản phẩm");
//                 const data = await response.json();
//                 const products = data?.data?.content || [];
//                 setProductStats({
//                     total: products.length,
//                     active: products.filter((p: any) => p.isActive).length,
//                     inactive: products.filter((p: any) => !p.isActive).length,
//                     outOfStock: products.filter((p: any) => p.totalStock === 0).length,
//                 });
//             } catch (e) {
//                 setProductStats({
//                     total: 0,
//                     active: 0,
//                     inactive: 0,
//                     outOfStock: 0,
//                 });
//             }
//         };
//         if (status === "authenticated") fetchProductStats();
//     }, [session, status]);
//
//     if (status === 'loading' || loading) {
//         return <LoadingSpinner />;
//     }
//
//     if (error) {
//         return (
//             <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
//                 <p>{error}</p>
//                 <button
//                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     onClick={() => window.location.reload()}
//                 >
//                     Thử lại
//                 </button>
//             </div>
//         );
//     }
//
//     return (
//         <div className={`min-h-screen py-8 px-4 md:px-36 transition-colors ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
//             <div className="flex justify-between items-center mb-8">
//                 <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bảng điều khiển Admin</h1>
//             </div>
//
//             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
//                 <Card className="shadow-lg">
//                     <CardHeader className="flex items-center gap-3">
//                         <Avatar icon={<Users size={24} />} color="primary" />
//                         <div className="flex-1">
//                             <p className="text-lg font-semibold text-gray-700 dark:text-white">Người dùng</p>
//                             <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{userStats.total}</p>
//                         </div>
//                     </CardHeader>
//                     <CardBody className="pt-0">
//                         <div className="space-y-2">
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <UserCheck size={16} className="text-green-500" />
//                                     <span className="text-sm text-gray-600 dark:text-gray-300">Đang hoạt động</span>
//                                 </div>
//                                 <Chip size="sm" color="success" variant="flat">
//                                     {userStats.active} ({userStats.total > 0 ? Math.round((userStats.active / userStats.total) * 100) : 0}%)
//                                 </Chip>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <UserX size={16} className="text-red-500" />
//                                     <span className="text-sm text-gray-600 dark:text-gray-300">Không hoạt động</span>
//                                 </div>
//                                 <Chip size="sm" color="danger" variant="flat">
//                                     {userStats.inactive} ({userStats.total > 0 ? Math.round((userStats.inactive / userStats.total) * 100) : 0}%)
//                                 </Chip>
//                             </div>
//                             <Divider className="my-2" />
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <Shield size={16} className="text-purple-500" />
//                                     <span className="text-sm text-gray-600 dark:text-gray-300">Admin trang web</span>
//                                 </div>
//                                 <Chip size="sm" color="secondary" variant="flat">
//                                     {userStats.adminWeb}
//                                 </Chip>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <User size={16} className="text-yellow-500" />
//                                     <span className="text-sm text-gray-600 dark:text-gray-300">Nhân viên</span>
//                                 </div>
//                                 <Chip size="sm" color="warning" variant="flat">
//                                     {userStats.staffWeb}
//                                 </Chip>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                     <Users size={16} className="text-gray-500" />
//                                     <span className="text-sm text-gray-600 dark:text-gray-300">Khách hàng</span>
//                                 </div>
//                                 <Chip size="sm" color="default" variant="flat">
//                                     {userStats.defaultUsers}
//                                 </Chip>
//                             </div>
//                         </div>
//                     </CardBody>
//                     <CardFooter>
//                         <Button as={Link} href="/admin/account_management" color="primary" variant="flat" size="sm" className="w-full">
//                             Quản lý tài khoản
//                         </Button>
//                     </CardFooter>
//                 </Card>
//                 <Card className="shadow-lg">
//                     <CardHeader className="flex items-center gap-3">
//                         <Avatar icon={<Package size={24} />} color="success" />
//                         <div className="flex-1">
//                             <p className="text-lg font-semibold text-gray-700 dark:text-white">Sản phẩm</p>
//                             <p className="text-2xl font-bold text-green-600 dark:text-green-300">{productStats.total}</p>
//                         </div>
//                     </CardHeader>
//                     <CardBody className="pt-0">
//                         <div className="space-y-2">
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600 dark:text-gray-300">Đang bán</span>
//                                 <Chip size="sm" color="success" variant="flat">
//                                     {productStats.active}
//                                 </Chip>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600 dark:text-gray-300">Ngừng bán</span>
//                                 <Chip size="sm" color="danger" variant="flat">
//                                     {productStats.inactive}
//                                 </Chip>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600 dark:text-gray-300">Hết hàng</span>
//                                 <Chip size="sm" color="warning" variant="flat">
//                                     {productStats.outOfStock}
//                                 </Chip>
//                             </div>
//                         </div>
//                     </CardBody>
//                     <CardFooter>
//                         <Button as={Link} href="/admin/product_management" color="success" variant="flat" size="sm">
//                             Quản lý sản phẩm
//                         </Button>
//                     </CardFooter>
//                 </Card>
//                 <Card className="shadow-lg">
//                     <CardHeader className="flex items-center gap-3">
//                         <Avatar icon={<BarChart2 size={24} />} color="warning" />
//                         <div>
//                             <p className="text-lg font-semibold text-gray-700 dark:text-white">Đơn hàng</p>
//                             <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.orders}</p>
//                         </div>
//                     </CardHeader>
//                     <CardFooter>
//                         <Button as={Link} href="/admin/order_management" color="warning" variant="flat" size="sm">
//                             Quản lý đơn hàng
//                         </Button>
//                     </CardFooter>
//                 </Card>
//                 <Card className="shadow-lg">
//                     <CardHeader className="flex items-center gap-3">
//                         <Avatar icon={<BarChart2 size={24} />} color="danger" />
//                         <div>
//                             <p className="text-lg font-semibold text-gray-700 dark:text-white">Doanh thu</p>
//                             <p className="text-2xl font-bold text-red-600 dark:text-red-300">
//                                 {stats.revenue.toLocaleString("vi-VN")}₫
//                             </p>
//                         </div>
//                     </CardHeader>
//                     <CardFooter>
//                         <Button as={Link} href="/admin/revenue" color="danger" variant="flat" size="sm">
//                             Xem chi tiết
//                         </Button>
//                     </CardFooter>
//                 </Card>
//             </div>
//
//             <Divider className="mb-8" />
//
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <Card className="shadow-lg">
//                     <CardHeader>
//                         <p className="text-lg font-semibold text-gray-700 dark:text-white">Thống kê truy cập</p>
//                     </CardHeader>
//                     <CardBody>
//                         {/* Placeholder cho biểu đồ */}
//                         <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
//                             (Biểu đồ truy cập sẽ hiển thị ở đây)
//                         </div>
//                     </CardBody>
//                 </Card>
//                 <Card className="shadow-lg">
//                     <CardHeader>
//                         <p className="text-lg font-semibold text-gray-700 dark:text-white">Hoạt động gần đây</p>
//                     </CardHeader>
//                     <CardBody>
//                         {/* Placeholder cho hoạt động gần đây */}
//                         <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
//                             <li>• Người dùng <b>admin</b> vừa thêm sản phẩm mới.</li>
//                             <li>• Đơn hàng #1234 vừa được xác nhận.</li>
//                             <li>• Người dùng <b>user01</b> vừa đăng ký tài khoản.</li>
//                             <li>• Sản phẩm <b>Áo thun nam</b> vừa được cập nhật tồn kho.</li>
//                         </ul>
//                     </CardBody>
//                 </Card>
//             </div>
//         </div>
//     );
// }


// src/app/admin/page.tsx
"use client"

<<<<<<< Updated upstream
export default function page(){
    return (
        <div>
            <h1>Welcome to the Next.js App</h1>
            <p>This is a sample page.</p>
=======
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
import { Users, Package, BarChart2, Moon, Sun, UserCheck, UserX, Shield, User } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from 'next-auth/react'; // Import signOut
import LoadingSpinner from '@/components/LoadingSpinner';
import { jwtDecode } from 'jwt-decode';
import { AdminSidebar } from '@/components/admin/AdminSlidebar'; // Import the new sidebar component

// Placeholder components for different admin sections
const DashboardOverview = ({ userStats, productStats, stats }: any) => (
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
                <Avatar icon={<BarChart2 size={24} />} color="warning" />
                <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-white">Đơn hàng</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{stats.orders}</p>
                </div>
            </CardHeader>
            <CardFooter>
                <Button as={Link} href="/admin/order_management" color="warning" variant="flat" size="sm">
                    Quản lý đơn hàng
                </Button>
            </CardFooter>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="flex items-center gap-3">
                <Avatar icon={<BarChart2 size={24} />} color="danger" />
                <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-white">Doanh thu</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-300">
                        {stats.revenue.toLocaleString("vi-VN")}₫
                    </p>
                </div>
            </CardHeader>
            <CardFooter>
                <Button as={Link} href="/admin/revenue" color="danger" variant="flat" size="sm">
                    Xem chi tiết
                </Button>
            </CardFooter>
        </Card>
    </div>
);

const MessagesSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Kênh tin nhắn</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý tin nhắn sẽ hiển thị ở đây.</p>
            {/* Add your message management UI here */}
        </Card>
    </div>
);

const AtCounterSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Tại Quầy</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý bán hàng tại quầy sẽ hiển thị ở đây.</p>
            {/* Add your in-store sales UI here */}
        </Card>
    </div>
);

const OrdersSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Hóa Đơn</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý hóa đơn sẽ hiển thị ở đây.</p>
            {/* Add your invoice management UI here */}
        </Card>
    </div>
);

const ProductManagementSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Quản Lý Sản Phẩm</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý sản phẩm chi tiết sẽ hiển thị ở đây.</p>
            {/* Add your product management UI here */}
        </Card>
    </div>
);

const CustomerManagementSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Khách Hàng</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý khách hàng sẽ hiển thị ở đây.</p>
            {/* Add your customer management UI here */}
        </Card>
    </div>
);

const StaffManagementSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Nhân Viên</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý nhân viên sẽ hiển thị ở đây.</p>
            {/* Add your staff management UI here */}
        </Card>
    </div>
);

const DiscountManagementSection = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Phiếu Giảm Giá</h2>
        <Card className="shadow-lg p-6">
            <p>Nội dung quản lý phiếu giảm giá sẽ hiển thị ở đây.</p>
            {/* Add your discount management UI here */}
        </Card>
    </div>
);


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

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [activeSection, setActiveSection] = useState('dashboard'); // State to manage active sidebar section

    // Thống kê người dùng chi tiết
    const [userStats, setUserStats] = useState<UserStats>({
        total: 0,
        active: 0,
        inactive: 0,
        adminWeb: 0,
        staffWeb: 0,
        defaultUsers: 0,
    });

    // Các thống kê khác (mock data for now)
    const [stats] = useState({
        products: 342,
        orders: 55555555555,
        revenue: 55555555555,
    });

    // Dark mode toggle (consider moving this to a global context if used elsewhere)
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Lấy thống kê người dùng từ API thực tế
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
                    active: products.filter((p: any) => p.isActive).length,
                    inactive: products.filter((p: any) => !p.isActive).length,
                    outOfStock: products.filter((p: any) => p.totalStock === 0).length,
                });
            } catch (e) {
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

    // Function to handle logout
    const handleLogout = async () => {
        try {
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

            if (!issuer || !clientId) {
                console.error("Lỗi: Biến môi trường Keycloak cho logout chưa được cấu hình.");
                await signOut({ redirect: false });
                window.location.href = homeUrl; // Fallback redirect
                return;
            }

            const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;
            await signOut({ redirect: false });
            window.location.href = keycloakLogoutUrl;
        } catch (error) {
            console.error("Logout error:", error);
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            window.location.href = homeUrl; // Fallback redirect
        }
    };


    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardOverview userStats={userStats} productStats={productStats} stats={stats} />;
            case 'messages':
                return <MessagesSection />;
            case 'at-counter':
                return <AtCounterSection />;
            case 'orders':
                return <OrdersSection />;
            case 'products':
                return <ProductManagementSection />;
            case 'customers':
                return <CustomerManagementSection />;
            case 'staff':
                return <StaffManagementSection />;
            case 'discounts':
                return <DiscountManagementSection />;
            default:
                return <DashboardOverview userStats={userStats} productStats={productStats} stats={stats} />;
        }
    };

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
        <div className={`flex min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
            {/* Admin Sidebar */}
            <AdminSidebar onLinkClick={setActiveSection} activeSection={activeSection} />

            {/* Main Content Area */}
            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bảng điều khiển Admin</h1>
                    {/* Dark mode toggle - you can keep it here or move it to a Navbar */}
                    <Button
                        isIconOnly
                        onClick={() => setDarkMode(!darkMode)}
                        className="ml-4"
                        variant="flat"
                        color="default"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                </div>

                {renderContent()}

                {/*/!* Optional: Logout button outside of sidebar for clarity *!/*/}
                {/*<div className="mt-8 text-right">*/}
                {/*    <Button*/}
                {/*        onClick={handleLogout}*/}
                {/*        color="danger"*/}
                {/*        variant="ghost"*/}
                {/*        startContent={<LogOut size={20} />}*/}
                {/*    >*/}
                {/*        Đăng xuất*/}
                {/*    </Button>*/}
                {/*</div>*/}
            </div>
>>>>>>> Stashed changes
        </div>
    )
}