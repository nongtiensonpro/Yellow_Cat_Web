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

    // Role management states
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [roleManagementUser, setRoleManagementUser] = useState<EnhancedUser | null>(null);
    const [roleLoading, setRoleLoading] = useState<boolean>(false);

    // Role confirmation states
    const [pendingRoleAction, setPendingRoleAction] = useState<{action: 'assign' | 'remove', roleName: string} | null>(null);

    // Edit profile states
    const [editProfileUser, setEditProfileUser] = useState<EnhancedUser | null>(null);
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [editForm, setEditForm] = useState<{fullName: string, phoneNumber: string}>({fullName: '', phoneNumber: ''});

    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const {isOpen, onOpen, onClose} = useDisclosure();
    const {isOpen: isRoleModalOpen, onOpen: onRoleModalOpen, onClose: onRoleModalClose} = useDisclosure();
    const {isOpen: isRoleConfirmModalOpen, onOpen: onRoleConfirmModalOpen, onClose: onRoleConfirmModalClose} = useDisclosure();
    const {isOpen: isEditProfileModalOpen, onOpen: onEditProfileModalOpen, onClose: onEditProfileModalClose} = useDisclosure();

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
                console.log('Không có token xác thực');
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
                console.log(errorMessage);
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
                console.log('Không có token xác thực');
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
                console.log(errorMessage);
            }

            // Update local state immediately
            setDemoData(prevData => 
                prevData.map(user => 
                    user.id === selectedUser.id 
                        ? { 
                            ...user, 
                            enabled: isEnable,
                            profileData: user.profileData 
                                ? { ...user.profileData, enabled: isEnable }
                                : user.profileData
                        }
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

    // Fetch available roles
    const fetchAvailableRoles = async () => {
        try {
            const token = session?.accessToken;
            if (!token) {
                console.log('Không có token xác thực');
            }

            const response = await fetch('http://localhost:8080/api/admin/users/available-roles', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.log(`HTTP error! Status: ${response.status}`);
            }

            const roles: string[] = await response.json();
            setAvailableRoles(roles);
        } catch (err) {
            console.error('Lỗi khi tải danh sách vai trò:', err);
            setNotification({
                type: 'error',
                message: 'Không thể tải danh sách vai trò có sẵn'
            });
        }
    };

    // Handle role management
    const handleRoleManagement = async (user: EnhancedUser) => {
        setRoleManagementUser(user);
        await fetchAvailableRoles();
        onRoleModalOpen();
    };

    // Show confirmation before assign role
    const handleAssignRole = (roleName: string) => {
        setPendingRoleAction({ action: 'assign', roleName });
        onRoleConfirmModalOpen();
    };

    // Show confirmation before remove role
    const handleRemoveRole = (roleName: string) => {
        setPendingRoleAction({ action: 'remove', roleName });
        onRoleConfirmModalOpen();
    };

    // Execute the confirmed role action
    const executeRoleAction = async () => {
        if (!roleManagementUser || !pendingRoleAction) return;
        
        const isAssign = pendingRoleAction.action === 'assign';
        const roleName = pendingRoleAction.roleName;
        
        try {
            setRoleLoading(true);
            const token = session?.accessToken;
            if (!token) {
                console.log('Không có token xác thực');
            }

            const response = await fetch(`http://localhost:8080/api/admin/users/${roleManagementUser.id}/roles`, {
                method: isAssign ? 'PUT' : 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roles: [roleName]
                }),
            });

            if (!response.ok) {
                console.log(`HTTP error! Status: ${response.status}`);
            }

            // Update local user data
            setDemoData(prevData => 
                prevData.map(user => 
                    user.id === roleManagementUser.id 
                        ? { 
                            ...user, 
                            clientRoles: isAssign 
                                ? [...(user.clientRoles || []), roleName].filter((role, index, self) => self.indexOf(role) === index)
                                : (user.clientRoles || []).filter(role => role !== roleName)
                        }
                        : user
                )
            );

            setNotification({
                type: 'success',
                message: `Đã ${isAssign ? 'gán' : 'xóa'} vai trò "${roleName}" ${isAssign ? 'cho' : 'của'} ${roleManagementUser.username}`
            });

            // Refresh data
            await fetchDemoData();

            // Auto close modals after success
            onRoleConfirmModalClose();
            onRoleModalClose();

        } catch (err) {
            console.error(`Lỗi khi ${isAssign ? 'gán' : 'xóa'} vai trò:`, err);
            setNotification({
                type: 'error',
                message: `Không thể ${isAssign ? 'gán' : 'xóa'} vai trò "${roleName}"`
            });
        } finally {
            setRoleLoading(false);
            setPendingRoleAction(null);
        }
    };

    // Handle edit profile
    const handleEditProfile = (user: EnhancedUser) => {
        setEditProfileUser(user);
        setEditForm({
            fullName: user.profileData?.fullName || `${user.firstName} ${user.lastName}` || '',
            phoneNumber: user.profileData?.phoneNumber || ''
        });
        onEditProfileModalOpen();
    };

    // Update profile
    const handleUpdateProfile = async () => {
        if (!editProfileUser) return;

        try {
            setEditLoading(true);
            const token = session?.accessToken;
            if (!token) {
                console.log('Không có token xác thực');
            }

            // Nếu user đã có profileData, update existing profile
            if (editProfileUser.profileData?.appUserId) {
                const response = await fetch(`http://localhost:8080/api/users/update-profile/${editProfileUser.profileData.appUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        appUserId: editProfileUser.profileData.appUserId,
                        keycloakId: editProfileUser.id,
                        email: editProfileUser.profileData.email || editProfileUser.email,
                        roles: editProfileUser.profileData.roles || editProfileUser.clientRoles,
                        enabled: editProfileUser.profileData.enabled !== undefined ? editProfileUser.profileData.enabled : editProfileUser.enabled,
                        fullName: editForm.fullName.trim(),
                        phoneNumber: editForm.phoneNumber.trim(),
                        avatarUrl: editProfileUser.profileData.avatarUrl || ''
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = `HTTP error! Status: ${response.status}`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
                    } catch {
                        errorMessage += errorText ? ` - ${errorText}` : '';
                    }
                    console.log(errorMessage);
                }
            } else {
                // Nếu user chưa có profileData, tạo mới profile
                const newUserData = {
                    id: editProfileUser.id,
                    name: editForm.fullName.trim(),
                    email: editProfileUser.email,
                    roles: editProfileUser.clientRoles || []
                };

                const createResponse = await fetch('http://localhost:8080/api/users/me', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newUserData),
                });

                if (!createResponse.ok) {
                   console.log(`Không thể tạo profile: ${createResponse.status}`);
                }

                // Sau khi tạo xong, lấy profile mới và update
                const profileResponse = await fetch(`http://localhost:8080/api/users/keycloak-user/${editProfileUser.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.data?.appUserId) {
                        // Update với phone number
                        await fetch(`http://localhost:8080/api/users/update-profile/${profileData.data.appUserId}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                appUserId: profileData.data.appUserId,
                                keycloakId: editProfileUser.id,
                                email: editProfileUser.email,
                                roles: editProfileUser.clientRoles || [],
                                enabled: editProfileUser.enabled,
                                fullName: editForm.fullName.trim(),
                                phoneNumber: editForm.phoneNumber.trim(),
                                avatarUrl: ''
                            }),
                        });
                    }
                }
            }

            // Update local user data
            setDemoData(prevData => 
                prevData.map(user => 
                    user.id === editProfileUser.id 
                        ? { 
                            ...user, 
                            profileData: user.profileData ? {
                                ...user.profileData,
                                fullName: editForm.fullName.trim(),
                                phoneNumber: editForm.phoneNumber.trim()
                            } : {
                                appUserId: 0, // Sẽ được cập nhật sau khi refresh
                                keycloakId: editProfileUser.id,
                                username: editProfileUser.username,
                                email: editProfileUser.email,
                                roles: editProfileUser.clientRoles || [],
                                enabled: editProfileUser.enabled,
                                fullName: editForm.fullName.trim(),
                                phoneNumber: editForm.phoneNumber.trim(),
                                avatarUrl: '',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        }
                        : user
                )
            );

            setNotification({
                type: 'success',
                message: `Đã cập nhật thông tin của ${editProfileUser.username} thành công!`
            });

            // Refresh data to ensure consistency
            await fetchDemoData();

            // Close modal
            onEditProfileModalClose();

        } catch (err) {
            console.error('Lỗi khi cập nhật thông tin:', err);
            setNotification({
                type: 'error',
                message: `Không thể cập nhật thông tin: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`
            });
        } finally {
            setEditLoading(false);
        }
    };

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
                            onPress={login}
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
                    onPress={fetchDemoData}
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
                                                color={item.enabled ? "success" : "danger"}
                                                variant="flat"
                                                startContent={item.enabled ? <UserCheck size={14} /> : <UserX size={14} />}
                                            >
                                                {item.enabled ? 'Hoạt động' : 'Không hoạt động'}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Tooltip content="Xem chi tiết">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => console.log('View', item.id)}
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Chỉnh sửa">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => console.log('Edit', item.id)}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Quản lý địa chỉ">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => router.push(`/admin/address_management?userId=${item.id}`)}
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
                                                            key="edit"
                                                            onPress={() => handleEditProfile(item)}
                                                            isDisabled={editLoading}
                                                        >
                                                            Chỉnh sửa thông tin
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="roles"
                                                            onPress={() => handleRoleManagement(item)}
                                                            isDisabled={roleLoading}
                                                        >
                                                            Quản lý vai trò
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="enable"
                                                            color={item.enabled ? "danger" : "success"}
                                                            onPress={() => handleUserAction(item, item.enabled ? 'disable' : 'enable')}
                                                            isDisabled={actionLoading === item.id}
                                                        >
                                                            {item.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                        </DropdownItem>
                                                        {/*<DropdownItem*/}
                                                        {/*    key="delete"*/}
                                                        {/*    color="danger"*/}
                                                        {/*    onPress={() => console.log('Delete', item.id)}*/}
                                                        {/*    isDisabled={actionLoading === item.id}*/}
                                                        {/*>*/}
                                                        {/*    Xóa tài khoản*/}
                                                        {/*</DropdownItem>*/}
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
                            onPress={() => setNotification(null)}
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

            {/* Role Management Modal */}
            <Modal 
                isOpen={isRoleModalOpen} 
                onClose={onRoleModalClose}
                placement="center"
                size="2xl"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Quản lý vai trò người dùng
                            </ModalHeader>
                            <ModalBody>
                                {roleManagementUser && (
                                    <div className="space-y-6">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            {roleManagementUser.profileData?.avatarUrl ? (
                                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                                    <CldImage
                                                        width={48}
                                                        height={48}
                                                        src={roleManagementUser.profileData.avatarUrl}
                                                        alt={roleManagementUser.profileData.fullName || roleManagementUser.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar 
                                                    icon={getUserTypeIcon(roleManagementUser)}
                                                    size="lg"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold text-lg">
                                                    {roleManagementUser.profileData?.fullName || `${roleManagementUser.firstName} ${roleManagementUser.lastName}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {roleManagementUser.profileData?.email || roleManagementUser.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Current Roles */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Vai trò hiện tại</h3>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {roleManagementUser.clientRoles && roleManagementUser.clientRoles.length > 0 ? (
                                                    roleManagementUser.clientRoles.map((role) => (
                                                        <div key={role} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Chip 
                                                                    size="sm" 
                                                                    color="primary" 
                                                                    variant="flat"
                                                                >
                                                                    {role}
                                                                </Chip>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                color="danger"
                                                                variant="light"
                                                                onPress={() => handleRemoveRole(role)}
                                                                isLoading={roleLoading}
                                                                isDisabled={roleLoading}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-500 italic">Chưa có vai trò nào được gán</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Available Roles */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3">Vai trò có sẵn</h3>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {availableRoles.length > 0 ? (
                                                    availableRoles
                                                        .filter(role => !roleManagementUser.clientRoles?.includes(role))
                                                        .map((role) => (
                                                            <div key={role} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <Chip 
                                                                        size="sm" 
                                                                        color="default" 
                                                                        variant="flat"
                                                                    >
                                                                        {role}
                                                                    </Chip>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    color="success"
                                                                    variant="light"
                                                                    onPress={() => handleAssignRole(role)}
                                                                    isLoading={roleLoading}
                                                                    isDisabled={roleLoading}
                                                                >
                                                                    Thêm
                                                                </Button>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <p className="text-gray-500 italic">Đang tải danh sách vai trò...</p>
                                                )}
                                                
                                                {availableRoles.length > 0 && 
                                                 availableRoles.filter(role => !roleManagementUser.clientRoles?.includes(role)).length === 0 && (
                                                    <p className="text-gray-500 italic">Người dùng đã có tất cả vai trò có sẵn</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="primary" 
                                    onPress={onClose}
                                    isDisabled={roleLoading}
                                >
                                    Đóng
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Role Confirmation Modal */}
            <Modal 
                isOpen={isRoleConfirmModalOpen} 
                onClose={onRoleConfirmModalClose}
                placement="center"
                size="md"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Xác nhận thay đổi vai trò
                            </ModalHeader>
                            <ModalBody>
                                {roleManagementUser && pendingRoleAction && (
                                    <div className="space-y-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            {roleManagementUser.profileData?.avatarUrl ? (
                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                    <CldImage
                                                        width={40}
                                                        height={40}
                                                        src={roleManagementUser.profileData.avatarUrl}
                                                        alt={roleManagementUser.profileData.fullName || roleManagementUser.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar 
                                                    icon={getUserTypeIcon(roleManagementUser)}
                                                    size="md"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold">
                                                    {roleManagementUser.profileData?.fullName || `${roleManagementUser.firstName} ${roleManagementUser.lastName}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {roleManagementUser.profileData?.email || roleManagementUser.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Confirmation Message */}
                                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                                    Xác nhận thao tác
                                                </p>
                                            </div>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                Bạn có chắc chắn muốn <strong>
                                                    {pendingRoleAction.action === 'assign' ? 'gán vai trò' : 'xóa vai trò'}
                                                </strong> <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded text-yellow-900 dark:text-yellow-100 font-medium">
                                                    {pendingRoleAction.roleName}
                                                </span> {pendingRoleAction.action === 'assign' ? 'cho' : 'của'} người dùng này không?
                                            </p>
                                            {pendingRoleAction.action === 'remove' && (
                                                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                                    💡 Người dùng sẽ mất quyền truy cập liên quan đến vai trò này.
                                                </p>
                                            )}
                                            {pendingRoleAction.action === 'assign' && (
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                                    💡 Người dùng sẽ có thêm quyền truy cập từ vai trò này.
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
                                    onPress={() => {
                                        onClose();
                                        setPendingRoleAction(null);
                                    }}
                                    isDisabled={roleLoading}
                                >
                                    Hủy
                                </Button>
                                <Button 
                                    color={pendingRoleAction?.action === 'assign' ? 'success' : 'danger'}
                                    onPress={executeRoleAction}
                                    isLoading={roleLoading}
                                >
                                    {pendingRoleAction?.action === 'assign' ? 'Gán vai trò' : 'Xóa vai trò'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal 
                isOpen={isEditProfileModalOpen} 
                onClose={onEditProfileModalClose}
                placement="center"
                size="lg"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Chỉnh sửa thông tin người dùng
                            </ModalHeader>
                            <ModalBody>
                                {editProfileUser && (
                                    <div className="space-y-6">
                                        {/* User Info */}
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            {editProfileUser.profileData?.avatarUrl ? (
                                                <div className="w-16 h-16 rounded-full overflow-hidden">
                                                    <CldImage
                                                        width={64}
                                                        height={64}
                                                        src={editProfileUser.profileData.avatarUrl}
                                                        alt={editProfileUser.profileData.fullName || editProfileUser.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar 
                                                    icon={getUserTypeIcon(editProfileUser)}
                                                    size="lg"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold text-lg">
                                                    {editProfileUser.profileData?.fullName || `${editProfileUser.firstName} ${editProfileUser.lastName}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {editProfileUser.profileData?.email || editProfileUser.email}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Username: {editProfileUser.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Edit Form */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                    Họ và tên <span className="text-red-500">*</span>
                                                </label>
                                                <Input
                                                    placeholder="Nhập họ và tên đầy đủ"
                                                    value={editForm.fullName}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                                                    isRequired
                                                    isDisabled={editLoading}
                                                    variant="bordered"
                                                    classNames={{
                                                        input: "text-sm",
                                                        inputWrapper: "h-12"
                                                    }}
                                                />
                                                {editForm.fullName.trim().length === 0 && (
                                                    <p className="text-xs text-red-500 mt-1">Họ và tên không được để trống</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                    Số điện thoại
                                                </label>
                                                <Input
                                                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                                                    value={editForm.phoneNumber}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                    isDisabled={editLoading}
                                                    variant="bordered"
                                                    classNames={{
                                                        input: "text-sm",
                                                        inputWrapper: "h-12"
                                                    }}
                                                />
                                                {editForm.phoneNumber && !/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(editForm.phoneNumber.replace(/\s/g, '')) && (
                                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                                        Định dạng số điện thoại không hợp lệ
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                                                                 {/* User Status */}
                                        {!editProfileUser.profileData?.appUserId && (
                                            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">ℹ️</span>
                                                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                                        Người dùng chưa có thông tin trong hệ thống
                                                    </p>
                                                </div>
                                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                    Thông tin sẽ được tạo mới trong database sau khi cập nhật.
                                                </p>
                                            </div>
                                        )}

                                        {/* Current vs New Comparison */}
                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                📝 Thông tin sẽ được {editProfileUser.profileData?.appUserId ? 'cập nhật' : 'tạo mới'}:
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Họ và tên hiện tại:</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                                            {editProfileUser.profileData?.fullName || `${editProfileUser.firstName || ''} ${editProfileUser.lastName || ''}`.trim() || 'Chưa có'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-600 dark:text-blue-400">Họ và tên mới:</span>
                                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                                            {editForm.fullName.trim() || 'Chưa nhập'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">SĐT hiện tại:</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                                            {editProfileUser.profileData?.phoneNumber || 'Chưa có'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-600 dark:text-blue-400">SĐT mới:</span>
                                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                                            {editForm.phoneNumber.trim() || 'Chưa nhập'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                                            {editProfileUser.profileData?.email || editProfileUser.email}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Username:</span>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                                            {editProfileUser.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={onClose}
                                    isDisabled={editLoading}
                                >
                                    Hủy
                                </Button>
                                <Button 
                                    color="primary"
                                    onPress={handleUpdateProfile}
                                    isLoading={editLoading}
                                    isDisabled={!editForm.fullName.trim() || editLoading}
                                >
                                    {editProfileUser?.profileData?.appUserId ? 'Cập nhật thông tin' : 'Tạo thông tin'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}