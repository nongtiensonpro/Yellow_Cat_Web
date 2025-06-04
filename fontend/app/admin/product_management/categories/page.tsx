"use client";
import {
    Card,
    CardHeader,
    CardBody,
    Divider,
    TableRow,
    TableCell,
    TableColumn,
    TableHeader,
    Table,
    TableBody,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input
} from "@heroui/react";
import NextLink from "next/link";
import {useEffect, useState} from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {useSession, signIn} from "next-auth/react";
import {useSession} from "next-auth/react";

interface Categories {
    id: number;
    name: string;
    description: string;
}

interface ApiResponse {
    data: {
        content: Categories[];
        totalPages: number;
    };
}

export default function Page() {
    const {data: session, status} = useSession();
    const [allCategoriesData, setAllCategoriesData] = useState<Categories[]>([]);
    const [categoriesData, setCategoriesData] = useState<Categories[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(3);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [categoryToDelete, setCategoryToDelete] = useState<{ id: number, name: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [finalSearchTerm, setFinalSearchTerm] = useState<string>("");

    const initializeStompClient = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Kết nối STOMP Categories đã được thiết lập');
                client.subscribe('/topic/categories', (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Nhận thông báo Categories từ server:', data);
                    setNotification(`Hành động: ${data.action} - Category: ${data.entity.name}`);

                    if (data.action === 'add') {
                        setAllCategoriesData((prevAll) => [data.entity, ...prevAll]);
                    } else if (data.action === 'update') {
                        setAllCategoriesData((prevAll) =>
                            prevAll.map((c) => (c.id === data.entity.id ? data.entity : c))
                        );
                    } else if (data.action === 'delete') {
                        setAllCategoriesData((prevAll) => prevAll.filter((c) => c.id !== data.entity.id));
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Lỗi STOMP Categories:', frame);
                setError('Lỗi kết nối STOMP Categories. Vui lòng thử lại.');
            },
        });

        client.activate();
        setStompClient(client);
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            signIn();
        }
    }, [status]);

    useEffect(() => {
        initializeStompClient();
    }, []);

    useEffect(() => {
        return () => {
            if (stompClient && stompClient.active) {
                console.log("Deactivating STOMP Categories client");
                stompClient.deactivate();
            }
        };
    }, [stompClient]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setFinalSearchTerm(searchTerm);
            setCurrentPage(0);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    useEffect(() => {
        const fetchAllCategories = async () => {
            if (status !== "authenticated") return;

            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://localhost:8080/api/categories?page=0&size=1000`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }
                const apiResponse: ApiResponse = await response.json();
                setAllCategoriesData(apiResponse.data.content);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
                console.error('Lỗi khi tải tất cả dữ liệu categories:', err);
                setAllCategoriesData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCategories();
    }, [status]);

    useEffect(() => {
        if (loading && !allCategoriesData.length) return;

        let filtered = allCategoriesData;
        if (finalSearchTerm) {
            const searchTermLower = finalSearchTerm.toLowerCase();
            filtered = allCategoriesData.filter(category =>
                category.name.toLowerCase().includes(searchTermLower) ||
                (category.description && category.description.toLowerCase().includes(searchTermLower))
            );
        }

        const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
        setTotalPages(Math.max(1, newTotalPages));

        const newCurrentPage = Math.min(currentPage, Math.max(0, newTotalPages - 1));
        if (currentPage !== newCurrentPage && !loading) {
            setCurrentPage(newCurrentPage);
        } else {
            const startIndex = newCurrentPage * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            setCategoriesData(filtered.slice(startIndex, endIndex));
        }

    }, [allCategoriesData, finalSearchTerm, currentPage, itemsPerPage, loading, status]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);
    const openDeleteConfirm = (categoryId: number, categoryName: string) => {
        setCategoryToDelete({id: categoryId, name: categoryName});
        onOpen();
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            if (status !== "authenticated" || !session) {
                setError("Bạn cần đăng nhập để thực hiện hành động này");
                signIn();
                return;
            }

            const token = session.accessToken;

            if (!token) {
                setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/categories/${categoryToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            onClose();
            setCategoryToDelete(null);
        } catch (err) {
            console.error('Lỗi khi xóa category:', err);
            setError(err instanceof Error ? err.message : 'Không thể xóa category. Vui lòng thử lại sau.');
            onClose();
        }
    };

    if (status === "loading" || (loading && allCategoriesData.length === 0)) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <Card className={`min-h-screen py-8 px-4 md:px-36`}>
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý Category</p>
                </div>
            </CardHeader>
            <Divider />
            <CardHeader>
                <NextLink href={"/admin/product_management/categories/create"} className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
            <Divider/>
            <CardHeader className="flex flex-col md:flex-row justify-between items-center">
                <NextLink href={"/admin/product_management/categories/create"}
                          className="mb-4 md:mb-0 inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                    Thêm mới
                </NextLink>
                <div className="w-full md:w-1/3">
                    <Input
                        className={'p-3.5'}
                        label="Tìm kiếm Category Name hoặc Description"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập để tìm kiếm..."
                        isClearable
                        onClear={() => setSearchTerm("")}
                    />
                </div>
            </CardHeader>
            <CardBody>
                {notification && (
                    <div
                        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                        <span className="block sm:inline">{notification}</span>
                        <button
                            className="absolute top-0 right-0 px-2 py-1"
                            onClick={() => setNotification(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {loading && categoriesData.length === 0 ? (
                    <LoadingSpinner/>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                ) : (
                    <Table aria-label="Categories table">
                        <TableHeader>
                            <TableColumn>Categories Id</TableColumn>
                            <TableColumn>Categories Name</TableColumn>
                            <TableColumn>Category Id</TableColumn>
                            <TableColumn>Category Name</TableColumn>
                            <TableColumn>Description</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {categoriesData && categoriesData.length > 0 ? (
                                categoriesData.map((categories) => (
                                    <TableRow key={categories.id}>
                                        <TableCell>{categories.id}</TableCell>
                                        <TableCell>{categories.name}</TableCell>
                                        <TableCell>{categories.description}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <NextLink href={`/admin/product_management/categories/update/${categories.id}`}>
                                                    <button className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                categoriesData.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>{category.id}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {category.description ? category.description.substring(0, 100) + (category.description.length > 100 ? '...' : '') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <NextLink
                                                    href={`/admin/product_management/categories/update/${category.id}`}>
                                                    <button
                                                        className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                                        Sửa
                                                    </button>
                                                </NextLink>
                                                <button
                                                    className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                                                    onClick={() => openDeleteConfirm(category.id, category.name)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">
                                        {finalSearchTerm ? "Không tìm thấy category nào khớp." : "Không có dữ liệu"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {!loading && !error && totalPages > 0 && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                            Trước
                        </button>
                        <span className="px-3 py-1">Trang {currentPage + 1}/{totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                            Sau
                        </button>
                    </div>
                )}

                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            Xác nhận xóa
                        </ModalHeader>
                        <ModalBody>
                            {categoryToDelete && (
                                <p>

                                    Bạn có chắc chắn muốn xóa category "{categoryToDelete.name}"?
                                    <br/>
                                    Hành động này không thể hoàn tác.
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Hủy
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteCategory}
                                className="bg-red-500 text-white"
                            >
                                Xóa
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </CardBody>
        </Card>
    );
}