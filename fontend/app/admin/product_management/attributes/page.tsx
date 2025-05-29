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
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSession } from "next-auth/react";

interface Attributes {
    id: number;
    attributeName: string;
    dataType: string;
}

interface ApiResponse {
    data: {
        content: Attributes[];
        page: {
            size: number;
            number: number;
            totalElements: number;
            totalPages: number;
        };
    };
}

export default function Page() {
    const { data: session, status } = useSession();
    const [attributesData, setAttributesData] = useState<Attributes[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(5);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [attributeToDelete, setAttributeToDelete] = useState<{ id: number, attributeName: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [stompClient, setStompClient] = useState<Client | null>(null);

    const initializeStompClient = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // Tự động reconnect sau 5s nếu mất kết nối
            onConnect: () => {
                console.log('Kết nối STOMP đã được thiết lập');
                client.subscribe('/topic/attributes', (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Nhận thông báo từ server:', data);
                    setNotification(`Hành động: ${data.action} - Attribute: ${data.entity.attributeName}`);

                    if (data.action === 'add') {
                        setAttributesData((prev) => [...prev, data.entity]);
                    } else if (data.action === 'update') {
                        setAttributesData((prev) =>
                            prev.map((b) => (b.id === data.entity.id ? data.entity : b))
                        );
                    } else if (data.action === 'delete') {
                        setAttributesData((prev) => prev.filter((b) => b.id !== data.entity.id));
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

    const fetchAttributesData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/attributes?page=${currentPage}&size=${itemsPerPage}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiResponse = await response.json();
            setAttributesData(apiResponse.data.content);
            setTotalPages(apiResponse.data.page.totalPages);
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            console.error('Lỗi khi tải dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributesData();
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

    const openDeleteConfirm = (attributeId: number, attributeName: string) => {
        setAttributeToDelete({ id: attributeId, attributeName: attributeName });
        onOpen();
    };

    const handleDeleteAttribute = async () => {
        if (!attributeToDelete) return;

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

            const response = await fetch(`http://localhost:8080/api/attributes/${attributeToDelete.id}`, {
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
            setAttributeToDelete(null);
            // Không cần gọi fetchAttributesData vì WebSocket sẽ cập nhật dữ liệu

        } catch (err) {
            console.error('Lỗi khi xóa attribute:', err);
            setError(err instanceof Error ? err.message : 'Không thể xóa attribute. Vui lòng thử lại sau.');
            onClose();
        }
    };

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý Danh Mục</p>
                </div>
            </CardHeader>
            <Divider />
            <CardHeader>
                <NextLink href={"/admin/product_management/attributes/create"} className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                    Thêm mới
                </NextLink>
            </CardHeader>
            <CardBody>
                {notification && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
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
                    <LoadingSpinner />
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                ) : (
                    <Table aria-label="Attributes table">
                        <TableHeader>
                            <TableColumn>Attribute Id</TableColumn>
                            <TableColumn>Attribute Name</TableColumn>
                            <TableColumn>Data Type</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {attributesData && attributesData.length > 0 ? (
                                attributesData.map((attribute) => (
                                    <TableRow key={attribute.id}>
                                        <TableCell>{attribute.id}</TableCell>
                                        <TableCell>{attribute.attributeName}</TableCell>
                                        <TableCell>{attribute.dataType}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <NextLink href={`/admin/product_management/attributes/update/${attribute.id}`}>
                                                    <button className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                                        Sửa
                                                    </button>
                                                </NextLink>
                                                <button
                                                    className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                                                    onClick={() => openDeleteConfirm(attribute.id, attribute.attributeName)}
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

                {!loading && !error && attributesData.length > 0 && (
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
                            {attributeToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xóa attribute "{attributeToDelete.attributeName}"?
                                    <br />
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
                                onPress={handleDeleteAttribute}
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