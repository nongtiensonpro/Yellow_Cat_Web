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
import keycloak from '@/keycloak/keycloak';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Attributes {
    id: number;
    attributeName: string;
    dataType: string;
}

interface ApiResponse {
    data: {
        content: Attributes[];
        totalPages: number;
    };
}

export default function Page() {
    const [AttributesData, setAttributesData] = useState<Attributes[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(5);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [AttributesToDelete, setAttributesToDelete] = useState<{ id: number, name: string } | null>(null);
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
                    setNotification(`Hành động: ${data.action} - Attributes: ${data.entity.attributeName}`);

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
            setTotalPages(apiResponse.data.totalPages);
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
    }, [currentPage, itemsPerPage,notification]);

    const openDeleteConfirm = (attributesId: number, attributeName: string) => {
        setAttributesToDelete({ id: attributesId, name: attributeName });
        onOpen();
    };

    const handleDeleteAttributes = async () => {
        if (!AttributesToDelete) return;

        try {
            if (!keycloak.authenticated) {
                await keycloak.login();
                return;
            }

            const token = keycloak.token;

            const response = await fetch(`http://localhost:8080/api/attributes/${AttributesToDelete.id}`, {
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
            setAttributesToDelete(null);
            await fetchAttributesData();
        } catch (err) {
            console.error('Lỗi khi xóa attributes:', err);
            setError(err instanceof Error ? err.message : 'Không thể xóa attributes. Vui lòng thử lại sau.');
            onClose();
        }
    };

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý Attributes</p>
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
                            <TableColumn>Attributes Id</TableColumn>
                            <TableColumn>Attributes Name</TableColumn>
                            <TableColumn>Data Type</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {AttributesData && AttributesData.length > 0 ? (
                                AttributesData.map((attributes) => (
                                    <TableRow key={attributes.id}>
                                        <TableCell>{attributes.id}</TableCell>
                                        <TableCell>{attributes.attributeName}</TableCell>
                                        <TableCell>{attributes.dataType}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <NextLink href={`/admin/product_management/attributes/update/${attributes.id}`}>
                                                    <button className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                                        Sửa
                                                    </button>
                                                </NextLink>
                                                <button
                                                    className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                                                    onClick={() => openDeleteConfirm(attributes.id, attributes.attributeName)}
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

                {!loading && !error && AttributesData.length > 0 && (
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
                            {AttributesToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xóa attributes "{AttributesToDelete.name}"?
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
                                onPress={handleDeleteAttributes}
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