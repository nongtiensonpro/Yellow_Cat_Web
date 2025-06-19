"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Avatar,
    Input,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    User,
    Tooltip,
    Select,
    SelectItem,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Shield,
    User as UserIcon,
    MoreVertical,
    Edit,
    Eye,
    RefreshCw,
    MapPin,
} from "lucide-react";
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';

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

interface EnhancedUser extends Users {
    profileData?: AppUser | null;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: AppUser;
    error?: string;
    path?: string;
}

export default function Page() {
    const { data: session, status } = useSession();
    const [demoData, setDemoData] = useState<EnhancedUser[]>([]);
    const [filteredData, setFilteredData] = useState<EnhancedUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // Filter states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Action states
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
    const [actionType, setActionType] = useState<'enable' | 'disable' | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const {isOpen, onOpen, onClose} = useDisclosure();

    useEffect(() => {
        if (status === 'authenticated' && session) {
            fetchDemoData();
        } else if (status !== 'loading') {
            setLoading(false);
        }
    }, [status, session]);

    // Filter data based on search and filters
    useEffect(() => {
        let filtered = demoData;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user => {
                const searchFields = [
                    user.username,
                    user.email,
                    `${user.firstName} ${user.lastName}`,
                    user.profileData?.fullName || '',
                    user.profileData?.username || '',
                    user.profileData?.email || ''
                ].join(' ').toLowerCase();
                
                return searchFields.includes(searchTerm.toLowerCase());
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => {
                const enabled = user.profileData?.enabled !== undefined ? user.profileData.enabled : user.enabled;
                return statusFilter === 'active' ? enabled : !enabled;
            });
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => 
                user.roles.includes(roleFilter) || user.clientRoles.includes(roleFilter)
            );
        }

        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [demoData, searchTerm, statusFilter, roleFilter]);

    const login = () => {
        signIn('keycloak');
    };

    const fetchDemoData = async () => {
        try {
            setLoading(true);

            const token = session?.accessToken;

            if (!token) {
                throw new Error('Không có token xác thực');
            }

            const response = await fetch('http://localhost:8080/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Lỗi HTTP! Trạng thái: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
                } catch {
                    errorMessage += errorText ? ` - ${errorText}` : '';
                }
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            const keycloakUsers: Users[] = await response.json();
            
            // Fetch profile data from database for each user
            const enhancedUsers: EnhancedUser[] = await Promise.all(
                keycloakUsers.map(async (user) => {
                    const profileData = await fetchUserProfile(user.id);
                    return {
                        ...user,
                        profileData
                    };
                })
            );

            setDemoData(enhancedUsers);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? `Không thể tải dữ liệu: ${err.message}`
                : 'Không thể tải dữ liệu. Vui lòng thử lại sau.';
            setError(errorMessage);
            console.error('Lỗi khi tải dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get current items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const getUserTypeIcon = (user: Users) => {
        if (user.roles.includes('Admin_Web') || user.clientRoles.includes('Admin_Web')) {
            return <Shield size={16} className="text-purple-500" />;
        } else if (user.roles.includes('Staff_Web') || user.clientRoles.includes('Staff_Web')) {
            return <UserIcon size={16} className="text-yellow-500" />;
        }
        return <Users size={16} className="text-gray-500" />;
    };

    // Function to fetch user profile from database
    const fetchUserProfile = async (keycloakId: string): Promise<AppUser | null> => {
        try {
            const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                return null;
            }

            const apiResponse: ApiResponse = await response.json();
            
            if (apiResponse.status >= 200 && apiResponse.status < 300 && apiResponse.data) {
                return apiResponse.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile for', keycloakId, error);
            return null;
        }
    };

    // Handle enable/disable user actions
    const handleUserAction = (user: EnhancedUser, action: 'enable' | 'disable') => {
        setSelectedUser(user);
        setActionType(action);
        onOpen();
    };

    const confirmUserAction = async () => {
        if (!selectedUser || !actionType) return;

        const isEnable = actionType === 'enable';
        const endpoint = isEnable ? 'enable' : 'disable';
        
        try {
            setActionLoading(selectedUser.id);
            
            const token = session?.accessToken;
            if (!token) {
                throw new Error('Không có token xác thực');
            }

            const response = await fetch(`http://localhost:8080/api/admin/users/${selectedUser.id}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Lỗi HTTP! Trạng thái: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
                } catch {
                    errorMessage += errorText ? ` - ${errorText}` : '';
                }
                throw new Error(errorMessage);
            }

            // Update local state immediately
            setDemoData(prevData => 
                prevData.map(user => 
                    user.id === selectedUser.id 
                        ? { ...user, enabled: isEnable }
                        : user
                )
            );

            setNotification({
                type: 'success',
                message: `Đã ${isEnable ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${selectedUser.username} thành công!`
            });

            // Refresh data to ensure consistency
            await fetchDemoData();

        } catch (err) {
            const errorMessage = err instanceof Error
                ? `Không thể ${isEnable ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản: ${err.message}`
                : `Không thể ${isEnable ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản. Vui lòng thử lại sau.`;
            
            setNotification({
                type: 'error',
                message: errorMessage
            });
            console.error('Lỗi khi thay đổi trạng thái tài khoản:', err);
        } finally {
            setActionLoading(null);
            onClose();
            setSelectedUser(null);
            setActionType(null);
        }
    };

    // Auto hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Check if user is authenticated
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="max-w-md w-full mx-4">
                    <CardHeader className="text-center">
                        <Users className="mx-auto mb-4 text-gray-400" size={48} />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Quản lý tài khoản
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Bạn cần đăng nhập để xem trang này.
                        </p>
                    </CardHeader>
                    <CardBody className="text-center">
                        <Button
                            onClick={login}
                            color="primary"
                            size="lg"
                            className="w-full"
                        >
                            Đăng nhập
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 px-4 md:px-12 transition-colors ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-50"}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <Avatar icon={<Users size={24} />} color="primary" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                            Quản lý tài khoản
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Quản lý và theo dõi tài khoản người dùng
                        </p>
                    </div>
                </div>
                <Button
                    color="default"
                    startContent={<RefreshCw size={16} />}
                    onClick={fetchDemoData}
                    isLoading={loading}
                >
                    Làm mới
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="shadow-lg">
                    <CardBody className="flex flex-row items-center gap-3">
                        <Avatar icon={<Users size={20} />} color="primary" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tổng số</p>
                            <p className="text-2xl font-bold text-blue-600">{demoData.length}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="shadow-lg">
                    <CardBody className="flex flex-row items-center gap-3">
                        <Avatar icon={<UserCheck size={20} />} color="success" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-green-600">
                                {demoData.filter(u => u.profileData?.enabled !== undefined ? u.profileData.enabled : u.enabled).length}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="shadow-lg">
                    <CardBody className="flex flex-row items-center gap-3">
                        <Avatar icon={<Shield size={20} />} color="secondary" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Admin</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {demoData.filter(u => 
                                    u.clientRoles.includes('Admin_Web') || u.roles.includes('Admin_Web')
                                ).length}
                            </p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="shadow-lg">
                    <CardBody className="flex flex-row items-center gap-3">
                        <Avatar icon={<UserIcon size={20} />} color="warning" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Nhân viên</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {demoData.filter(u => 
                                    u.clientRoles.includes('Staff_Web') || u.roles.includes('Staff_Web')
                                ).length}
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="shadow-lg mb-6">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <Input
                            placeholder="Tìm kiếm theo tên, email..."
                            startContent={<Search size={18} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="md:max-w-xs"
                        />
                        <Select
                            placeholder="Trạng thái"
                            selectedKeys={[statusFilter]}
                            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                            className="md:max-w-xs"
                        >
                            <SelectItem key="all">Tất cả trạng thái</SelectItem>
                            <SelectItem key="active">Đang hoạt động</SelectItem>
                            <SelectItem key="inactive">Không hoạt động</SelectItem>
                        </Select>
                        <Select
                            placeholder="Vai trò"
                            selectedKeys={[roleFilter]}
                            onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string)}
                            className="md:max-w-xs"
                        >
                            <SelectItem key="all">Tất cả vai trò</SelectItem>
                            <SelectItem key="Admin_Web">Admin Web</SelectItem>
                            <SelectItem key="Staff_Web">Nhân viên</SelectItem>
                        </Select>
                        <Select
                            placeholder="Hiển thị"
                            selectedKeys={[itemsPerPage.toString()]}
                            onSelectionChange={(keys) => setItemsPerPage(Number(Array.from(keys)[0]))}
                            className="md:max-w-xs"
                        >
                            <SelectItem key="5">5 mục</SelectItem>
                            <SelectItem key="10">10 mục</SelectItem>
                            <SelectItem key="20">20 mục</SelectItem>
                            <SelectItem key="50">50 mục</SelectItem>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {/* Main Content */}
            <Card className="shadow-lg">
                <CardBody className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        </div>
                    ) : (
                        <Table
                            aria-label="Bảng quản lý tài khoản"
                            classNames={{
                                wrapper: "min-h-[400px]",
                            }}
                        >
                            <TableHeader>
                                <TableColumn>NGƯỜI DÙNG</TableColumn>
                                <TableColumn>EMAIL</TableColumn>
                                <TableColumn>Số điện thoại</TableColumn>
                                <TableColumn>VAI TRÒ</TableColumn>
                                <TableColumn>TRẠNG THÁI</TableColumn>
                                <TableColumn>HÀNH ĐỘNG</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="Không có dữ liệu">
                                {currentItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.profileData?.avatarUrl ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                                        <CldImage
                                                            width={40}
                                                            height={40}
                                                            src={item.profileData.avatarUrl}
                                                            alt={item.profileData.fullName || item.username}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">
                                                            {item.profileData.fullName || `${item.firstName} ${item.lastName}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.profileData.username || item.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <User
                                                    avatarProps={{
                                                        icon: getUserTypeIcon(item),
                                                        color: item.enabled ? "default" : "default"
                                                    }}
                                                    description={item.profileData?.username || item.username}
                                                    name={item.profileData?.fullName || `${item.firstName} ${item.lastName}`}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{item.profileData?.email || item.email}</TableCell>
                                        <TableCell>{item.profileData?.phoneNumber || 'Chưa cập nhật'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    // Lấy roles từ Keycloak (như UserManagementController)
                                                    const clientRoles = item.clientRoles || [];
                                                    const realmRoles = item.roles || [];
                                                    
                                                    // Lọc bỏ default roles
                                                    const filteredClientRoles = clientRoles.filter(role => 
                                                        role !== 'default-roles-yellow cat company'
                                                    );
                                                    const filteredRealmRoles = realmRoles.filter(role => 
                                                        role !== 'default-roles-yellow cat company' && 
                                                        role !== 'offline_access' && 
                                                        role !== 'uma_authorization'
                                                    );
                                                    
                                                    const allRoles = [...filteredClientRoles, ...filteredRealmRoles];
                                                    
                                                    // Xác định vai trò có quyền hạn cao nhất
                                                    let highestRole = '';
                                                    let roleColor: "default" | "primary" | "secondary" | "success" | "warning" | "danger" = 'default';
                                                    
                                                    if (allRoles.includes('Admin_Web')) {
                                                        highestRole = 'Admin';
                                                        roleColor = 'secondary';
                                                    } else if (allRoles.includes('Staff_Web')) {
                                                        highestRole = 'Nhân viên';
                                                        roleColor = 'warning';
                                                    } else {
                                                        highestRole = 'Khách hàng';
                                                        roleColor = 'default';
                                                    }
                                                    
                                                    return (
                                                        <Chip
                                                            size="sm"
                                                            color={roleColor}
                                                            variant="flat"
                                                        >
                                                            {highestRole}
                                                        </Chip>
                                                    );
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={(item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? "success" : "danger"}
                                                variant="flat"
                                                startContent={(item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? <UserCheck size={14} /> : <UserX size={14} />}
                                            >
                                                {(item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? 'Hoạt động' : 'Không hoạt động'}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Xem chi tiết">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onClick={() => console.log('View', item.id)}
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Chỉnh sửa">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onClick={() => console.log('Edit', item.id)}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Quản lý địa chỉ">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onClick={() => router.push(`/admin/address_management?userId=${item.id}`)}
                                                    >
                                                        <MapPin size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            isLoading={actionLoading === item.id}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Actions">
                                                        <DropdownItem
                                                            key="enable"
                                                            color={(item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? "danger" : "success"}
                                                            onClick={() => handleUserAction(item, (item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? 'disable' : 'enable')}
                                                            isDisabled={actionLoading === item.id}
                                                        >
                                                            {(item.profileData?.enabled !== undefined ? item.profileData.enabled : item.enabled) ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardBody className="flex justify-between items-center border-t">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} của {filteredData.length} kết quả
                        </span>
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            color="primary"
                            showControls
                            showShadow
                        />
                    </CardBody>
                )}
            </Card>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 ${
                    notification.type === 'success' 
                        ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-200' 
                        : 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200'
                }`}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="font-medium">
                                {notification.type === 'success' ? '✅ Thành công' : '❌ Lỗi'}
                            </p>
                            <p className="text-sm mt-1">{notification.message}</p>
                        </div>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={() => setNotification(null)}
                            className="ml-2"
                        >
                            ×
                        </Button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal 
                isOpen={isOpen} 
                onClose={onClose}
                placement="center"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Xác nhận thay đổi trạng thái
                            </ModalHeader>
                            <ModalBody>
                                {selectedUser && actionType && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {selectedUser.profileData?.avatarUrl ? (
                                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                                    <CldImage
                                                        width={48}
                                                        height={48}
                                                        src={selectedUser.profileData.avatarUrl}
                                                        alt={selectedUser.profileData.fullName || selectedUser.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar 
                                                    icon={getUserTypeIcon(selectedUser)}
                                                    size="lg"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold">
                                                    {selectedUser.profileData?.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {selectedUser.profileData?.email || selectedUser.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                            <p className="text-sm">
                                                Bạn có chắc chắn muốn <strong>
                                                    {actionType === 'enable' ? 'kích hoạt' : 'vô hiệu hóa'}
                                                </strong> tài khoản này không?
                                            </p>
                                            {actionType === 'disable' && (
                                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                                                    ⚠️ Người dùng sẽ không thể đăng nhập sau khi bị vô hiệu hóa.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={onClose}
                                    isDisabled={!!actionLoading}
                                >
                                    Hủy
                                </Button>
                                <Button 
                                    color={actionType === 'enable' ? 'success' : 'danger'}
                                    onPress={confirmUserAction}
                                    isLoading={!!actionLoading}
                                >
                                    {actionType === 'enable' ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}