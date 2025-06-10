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
} from "lucide-react";
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTheme } from "next-themes";

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

export default function Page() {
    const { data: session, status } = useSession();
    const [demoData, setDemoData] = useState<Users[]>([]);
    const [filteredData, setFilteredData] = useState<Users[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // Filter states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const { theme, setTheme } = useTheme();

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
            filtered = filtered.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user =>
                statusFilter === 'active' ? user.enabled : !user.enabled
            );
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

            const data = await response.json();
            setDemoData(data);
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Admin_Web': return 'secondary';
            case 'Staff_Web': return 'warning';
            default: return 'default';
        }
    };

    const getUserTypeIcon = (user: Users) => {
        if (user.roles.includes('Admin_Web') || user.clientRoles.includes('Admin_Web')) {
            return <Shield size={16} className="text-purple-500" />;
        } else if (user.roles.includes('Staff_Web') || user.clientRoles.includes('Staff_Web')) {
            return <UserIcon size={16} className="text-yellow-500" />;
        }
        return <Users size={16} className="text-gray-500" />;
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
                                {demoData.filter(u => u.enabled).length}
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
                                {demoData.filter(u => u.roles.includes('Admin_Web') || u.clientRoles.includes('Admin_Web')).length}
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
                                {demoData.filter(u => u.roles.includes('Staff_Web') || u.clientRoles.includes('Staff_Web')).length}
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
                                <TableColumn>ID</TableColumn>
                                <TableColumn>NGƯỜI DÙNG</TableColumn>
                                <TableColumn>EMAIL</TableColumn>
                                <TableColumn>VAI TRÒ</TableColumn>
                                <TableColumn>TRẠNG THÁI</TableColumn>
                                <TableColumn>HÀNH ĐỘNG</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="Không có dữ liệu">
                                {currentItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.id}</TableCell>
                                        <TableCell>
                                            <User
                                                avatarProps={{
                                                    icon: getUserTypeIcon(item),
                                                    color: item.enabled ? "default" : "default"
                                                }}
                                                description={item.username}
                                                name={`${item.firstName} ${item.lastName}`}
                                            />
                                        </TableCell>
                                        <TableCell>{item.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(
                                                    item.roles.length === 0 ||
                                                    (item.roles.length === 1 && item.roles[0] === 'default-roles-yellow cat company') &&
                                                    item.clientRoles.length === 0
                                                ) ? (
                                                    <Chip size="sm" color="default" variant="flat">
                                                        Khách hàng
                                                    </Chip>
                                                ) : (
                                                    Array.from(new Set([
                                                        ...item.roles.filter(role => role !== 'default-roles-yellow cat company'),
                                                        ...item.clientRoles
                                                    ])).map((role, index) => (
                                                        <Chip
                                                            key={role}
                                                            size="sm"
                                                            color={getRoleColor(role)}
                                                            variant="flat"
                                                        >
                                                            {role === 'Admin_Web'
                                                                ? 'Quản lý cửa hàng'
                                                                : role === 'Staff_Web'
                                                                    ? 'Nhân viên cửa hàng'
                                                                    : role.replace(/_/g, ' ')}
                                                        </Chip>
                                                    ))
                                                )}
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
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Actions">
                                                        <DropdownItem
                                                            key="enable"
                                                            color={item.enabled ? "danger" : "success"}
                                                            onClick={() => console.log('Toggle status', item.id)}
                                                        >
                                                            {item.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            key="delete"
                                                            color="danger"
                                                            onClick={() => console.log('Delete', item.id)}
                                                        >
                                                            Xóa tài khoản
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
        </div>
    );
}