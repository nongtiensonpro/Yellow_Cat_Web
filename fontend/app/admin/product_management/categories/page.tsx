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
    useDisclosure
} from "@heroui/react";
import NextLink from "next/link";
import {useEffect, useState} from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
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
    const [categoriesData, setcategoriesData] = useState<Categories[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(3);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [brandToDelete, setBrandToDelete] = useState<{ id: number, name: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [stompClient, setStompClient] = useState<Client | null>(null);

    const initializeStompClient = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // Tự động reconnect sau 5s nếu mất kết nối
            onConnect: () => {
                console.log('Kết nối STOMP đã được thiết lập');
                client.subscribe('/topic/categories', (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Nhận thông báo từ server:', data);
                    setNotification(`Hành động: ${data.action} - Categories: ${data.entity.name}`);

                    if (data.action === 'add') {
                        setcategoriesData((prev) => [...prev, data.entity]);
                    } else if (data.action === 'update') {
                        setcategoriesData((prev) =>
                            prev.map((b) => (b.id === data.entity.id ? data.entity : b))
                        );
                    } else if (data.action === 'delete') {
                        setcategoriesData((prev) => prev.filter((b) => b.id !== data.entity.id));
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Lỗi STOMP:', frame);
                setError('Lỗi kết nối STOMP. Vui lòng thử lại.');
            },
        });

        client.activate();
        setStompClient(client);
    };

    const fetchcategoriesData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/categories?page=${currentPage}&size=${itemsPerPage}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiResponse = await response.json();
            setcategoriesData(apiResponse.data.content);
            setTotalPages(apiResponse.data.totalPages);
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            console.error('Lỗi khi tải dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcategoriesData();
        initializeStompClient();
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);

            return () => clearTimeout(timer);
        }
        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
        };
    }, [currentPage, itemsPerPage, notification]);

    const openDeleteConfirm = (brandId: number, brandName: string) => {
        setBrandToDelete({id: brandId, name: brandName});
        onOpen();
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return;

        try {
            // Kiểm tra trạng thái đăng nhập với NextAuth
            if (status !== "authenticated" || !session) {
                setError("Bạn cần đăng nhập để thực hiện hành động này");
                return;
            }

            // Lấy token từ session NextAuth
            const token = session.accessToken;

            if (!token) {
                setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/categories/${brandToDelete.id}`, {
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
            setBrandToDelete(null);
            // Không cần gọi fetchcategoriesData vì WebSocket sẽ cập nhật dữ liệu

        } catch (err) {
            console.error('Lỗi khi xóa category:', err);
            setError(err instanceof Error ? err.message : 'Không thể xóa category. Vui lòng thử lại sau.');
            onClose();
        }
    };

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý Category</p>
                </div>
            </CardHeader>
            <Divider/>
            <CardHeader>
                <NextLink href={"/admin/product_management/categories/create"}
                          className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                    Thêm mới
                </NextLink>
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

                {loading ? (
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
                                                <NextLink
                                                    href={`/admin/product_management/categories/update/${categories.id}`}>
                                                    <button
                                                        className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                                        Sửa
                                                    </button>
                                                </NextLink>
                                                <button
                                                    className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                                                    onClick={() => openDeleteConfirm(categories.id, categories.name)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {!loading && !error && categoriesData.length > 0 && (
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
                            disabled={currentPage === totalPages - 1}
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
                            {brandToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xóa brand "{brandToDelete.name}"?
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
                                onPress={handleDeleteBrand}
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