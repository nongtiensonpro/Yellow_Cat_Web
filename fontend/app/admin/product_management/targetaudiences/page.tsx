// "use client";
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     Divider,
//     TableRow,
//     TableCell,
//     TableColumn,
//     TableHeader,
//     Table,
//     TableBody,
//     Modal,
//     ModalContent,
//     ModalHeader,
//     ModalBody,
//     ModalFooter,
//     Button,
//     useDisclosure,
//     Input
// } from "@heroui/react";
// import NextLink from "next/link";
// import {useEffect, useState} from "react";
// import LoadingSpinner from "@/components/LoadingSpinner";
// import {Client} from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import {useSession, signIn} from "next-auth/react";
//
// interface targetaudiences {
//     id: number;
//     name: string;
//     description: string;
// }
//
// interface ApiResponse {
//     data: {
//         content: targetaudiences[];
//         totalPages: number;
//     };
// }
//
// export default function Page() {
//     const {data: session, status} = useSession();
//     const [alltargetaudiencesData, setAlltargetaudiencesData] = useState<targetaudiences[]>([]);
//     const [targetaudiencesData, settargetaudiencesData] = useState<targetaudiences[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState<number>(0);
//     const [itemsPerPage] = useState<number>(3);
//     const [totalPages, setTotalPages] = useState<number>(1);
//     const [targetaudienceToDelete, settargetaudienceToDelete] = useState<{ id: number, name: string } | null>(null);
//     const [notification, setNotification] = useState<string | null>(null);
//     const {isOpen, onOpen, onClose} = useDisclosure();
//     const [stompClient, setStompClient] = useState<Client | null>(null);
//     const [searchTerm, setSearchTerm] = useState<string>("");
//     const [finalSearchTerm, setFinalSearchTerm] = useState<string>("");
//
//     const initializeStompClient = () => {
//         const socket = new SockJS('http://localhost:8080/ws');
//         const client = new Client({
//             webSocketFactory: () => socket,
//             reconnectDelay: 5000,
//             onConnect: () => {
//                 console.log('Kết nối STOMP targetaudiences đã được thiết lập');
//                 client.subscribe('/topic/targetaudiences', (message) => {
//                     const data = JSON.parse(message.body);
//                     console.log('Nhận thông báo targetaudiences từ server:', data);
//                     setNotification(`Hành động: ${data.action} - targetaudience: ${data.entity.name}`);
//
//                     if (data.action === 'add') {
//                         setAlltargetaudiencesData((prevAll) => [data.entity, ...prevAll]);
//                     } else if (data.action === 'update') {
//                         setAlltargetaudiencesData((prevAll) =>
//                             prevAll.map((c) => (c.id === data.entity.id ? data.entity : c))
//                         );
//                     } else if (data.action === 'delete') {
//                         setAlltargetaudiencesData((prevAll) => prevAll.filter((c) => c.id !== data.entity.id));
//                     }
//                 });
//             },
//             onStompError: (frame) => {
//                 console.error('Lỗi STOMP targetaudiences:', frame);
//                 setError('Lỗi kết nối STOMP targetaudiences. Vui lòng thử lại.');
//             },
//         });
//
//         client.activate();
//         setStompClient(client);
//     };
//
//     useEffect(() => {
//         if (status === "unauthenticated") {
//             signIn();
//         }
//     }, [status]);
//
//     useEffect(() => {
//         initializeStompClient();
//     }, []);
//
//     useEffect(() => {
//         return () => {
//             if (stompClient && stompClient.active) {
//                 console.log("Deactivating STOMP targetaudiences client");
//                 stompClient.deactivate();
//             }
//         };
//     }, [stompClient]);
//
//     useEffect(() => {
//         const handler = setTimeout(() => {
//             setFinalSearchTerm(searchTerm);
//             setCurrentPage(0);
//         }, 500);
//
//         return () => {
//             clearTimeout(handler);
//         };
//     }, [searchTerm]);
//
//     useEffect(() => {
//         const fetchAlltargetaudiences = async () => {
//             if (status !== "authenticated") return;
//
//             setLoading(true);
//             setError(null);
//             try {
//                 const response = await fetch(`http://localhost:8080/api/target-audiences?page=0&size=10`);
//                 if (!response.ok) {
//                     const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
//                     throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
//                 }
//                 const apiResponse: ApiResponse = await response.json();
//                 setAlltargetaudiencesData(apiResponse.data.content);
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
//                 console.error('Lỗi khi tải tất cả dữ liệu targetaudiences:', err);
//                 setAlltargetaudiencesData([]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchAlltargetaudiences();
//     }, [status]);
//
//     useEffect(() => {
//         if (loading && !alltargetaudiencesData.length) return;
//
//         let filtered = alltargetaudiencesData;
//         if (finalSearchTerm) {
//             const searchTermLower = finalSearchTerm.toLowerCase();
//             filtered = alltargetaudiencesData.filter(targetaudience =>
//                 targetaudience.name.toLowerCase().includes(searchTermLower) ||
//                 (targetaudience.description && targetaudience.description.toLowerCase().includes(searchTermLower))
//             );
//         }
//
//         const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
//         setTotalPages(Math.max(1, newTotalPages));
//
//         const newCurrentPage = Math.min(currentPage, Math.max(0, newTotalPages - 1));
//         if (currentPage !== newCurrentPage && !loading) {
//             setCurrentPage(newCurrentPage);
//         } else {
//             const startIndex = newCurrentPage * itemsPerPage;
//             const endIndex = startIndex + itemsPerPage;
//             settargetaudiencesData(filtered.slice(startIndex, endIndex));
//         }
//
//     }, [alltargetaudiencesData, finalSearchTerm, currentPage, itemsPerPage, loading, status]);
//
//     useEffect(() => {
//         if (notification) {
//             const timer = setTimeout(() => {
//                 setNotification(null);
//             }, 3000);
//             return () => clearTimeout(timer);
//         }
//     }, [notification]);
//     const openDeleteConfirm = (targetaudienceId: number, targetaudienceName: string) => {
//         settargetaudienceToDelete({id: targetaudienceId, name: targetaudienceName});
//         onOpen();
//     };
//
//     const handleDeletetargetaudience = async () => {
//         if (!targetaudienceToDelete) return;
//
//         try {
//             if (status !== "authenticated" || !session) {
//                 setError("Bạn cần đăng nhập để thực hiện hành động này");
//                 signIn();
//                 return;
//             }
//
//             const token = session.accessToken;
//
//             if (!token) {
//                 setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
//                 return;
//             }
//
//             const response = await fetch(`http://localhost:8080/api/target-audiences/${targetaudienceToDelete.id}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             });
//
//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => null);
//                 throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
//             }
//
//             onClose();
//             settargetaudienceToDelete(null);
//         } catch (err) {
//             console.error('Lỗi khi xóa targetaudience:', err);
//             setError(err instanceof Error ? err.message : 'Không thể xóa targetaudience. Vui lòng thử lại sau.');
//             onClose();
//         }
//     };
//
//     if (status === "loading" || (loading && alltargetaudiencesData.length === 0)) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <LoadingSpinner />
//             </div>
//         );
//     }
//
//     return (
//         <Card className={`min-h-screen py-8 px-4 md:px-36`}>
//             <CardHeader className="flex gap-3">
//                 <div className="flex flex-col">
//                     <p className="text-4xl font-bold">Quản lý đối tượng</p>
//                 </div>
//             </CardHeader>
//             <Divider />
//             <CardHeader className="flex flex-col md:flex-row justify-between items-center">
//                 <NextLink href={"/admin/product_management/targetaudiences/create"}
//                           className="mb-4 md:mb-0 inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
//                     Thêm mới
//                 </NextLink>
//                 <div className="w-full md:w-1/3">
//                     <Input
//                         className={'p-3.5'}
//                         type="text"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         placeholder="Tìm kiếm theo tên..."
//                         isClearable
//                         onClear={() => setSearchTerm("")}
//                     />
//                 </div>
//             </CardHeader>
//             <CardBody>
//                 {notification && (
//                     <div
//                         className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
//                         <span className="block sm:inline">{notification}</span>
//                         <button
//                             className="absolute top-0 right-0 px-2 py-1"
//                             onClick={() => setNotification(null)}
//                         >
//                             ×
//                         </button>
//                     </div>
//                 )}
//
//                 {loading && targetaudiencesData.length === 0 ? (
//                     <LoadingSpinner/>
//                 ) : error ? (
//                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
//                         <span className="block sm:inline">{error}</span>
//                     </div>
//                 ) : (
//                     <Table aria-label="targetaudiences table">
//                         <TableHeader>
//                             <TableColumn>ID</TableColumn>
//                             <TableColumn>Tên đối tượng</TableColumn>
//                             <TableColumn>Mô tả</TableColumn>
//                             <TableColumn>Hành động</TableColumn>
//                         </TableHeader>
//                         <TableBody>
//                             {targetaudiencesData && targetaudiencesData.length > 0 ? (
//                                 targetaudiencesData.map((targetaudience) => (
//                                     <TableRow key={targetaudience.id}>
//                                         <TableCell>{targetaudience.id}</TableCell>
//                                         <TableCell>{targetaudience.name}</TableCell>
//                                         <TableCell className="max-w-xs truncate">
//                                             {targetaudience.description ? targetaudience.description.substring(0, 100) + (targetaudience.description.length > 100 ? '...' : '') : 'N/A'}
//                                         </TableCell>
//                                         <TableCell>
//                                             <div className="flex space-x-2">
//                                                 <NextLink
//                                                     href={`/admin/product_management/targetaudiences/update/${targetaudience.id}`}>
//                                                     <button
//                                                         className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
//                                                         Sửa
//                                                     </button>
//                                                 </NextLink>
//                                                 <button
//                                                     className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
//                                                     onClick={() => openDeleteConfirm(targetaudience.id, targetaudience.name)}
//                                                 >
//                                                     Xóa
//                                                 </button>
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={4} className="text-center py-4">
//                                         {finalSearchTerm ? "Không tìm thấy targetaudience nào khớp." : "Không có dữ liệu"}
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 )}
//
//                 {!loading && !error && totalPages > 0 && (
//                     <div className="flex justify-center mt-4">
//                         <button
//                             onClick={() => setCurrentPage(currentPage - 1)}
//                             disabled={currentPage === 0}
//                             className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
//                         >
//                             Trước
//                         </button>
//                         <span className="px-3 py-1">Trang {currentPage + 1}/{totalPages}</span>
//                         <button
//                             onClick={() => setCurrentPage(currentPage + 1)}
//                             disabled={currentPage >= totalPages - 1}
//                             className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
//                         >
//                             Sau
//                         </button>
//                     </div>
//                 )}
//
//                 <Modal isOpen={isOpen} onClose={onClose}>
//                     <ModalContent>
//                         <ModalHeader className="flex flex-col gap-1">
//                             Xác nhận xóa
//                         </ModalHeader>
//                         <ModalBody>
//                             {targetaudienceToDelete && (
//                                 <p>
//                                     Bạn có chắc chắn muốn xóa targetaudience "{targetaudienceToDelete.name}"?
//                                     <br/>
//                                     Hành động này không thể hoàn tác.
//                                 </p>
//                             )}
//                         </ModalBody>
//                         <ModalFooter>
//                             <Button color="danger" variant="light" onPress={onClose}>
//                                 Hủy
//                             </Button>
//                             <Button
//                                 color="danger"
//                                 onPress={handleDeletetargetaudience}
//                                 className="bg-red-500 text-white"
//                             >
//                                 Xóa
//                             </Button>
//                         </ModalFooter>
//                     </ModalContent>
//                 </Modal>
//             </CardBody>
//         </Card>
//     );
// }



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
import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { addToast } from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";

interface targetaudience {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface targetaudienceFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export default function Page() {
    const { data: session, status } = useSession();
    const [targetaudiences, settargetaudiences] = useState<targetaudience[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [formData, setFormData] = useState<targetaudienceFormData>({ name: '' });
    const [selected, setSelected] = useState<targetaudience | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState('');

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const openAddModal = () => {
        setModalMode("add");
        setFormData({ name: '' });
        setSelected(null);
        onOpen();
    };

    const openEditModal = (targetaudience: targetaudience) => {
        setModalMode("edit");
        setFormData({ name: targetaudience.name });
        setSelected(targetaudience);
        onOpen();
    };

    const openDeleteModal = (targetaudience: targetaudience) => {
        setModalMode("delete");
        setSelected(targetaudience);
        onOpen();
    };

    const fetchtargetaudiences = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/target-audiences?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const json = await res.json();
        settargetaudiences(json.data.content || []);
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchtargetaudiences();
        } else if (status === "unauthenticated") {
            signIn();
        }
    }, [status, fetchtargetaudiences]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const method = modalMode === "edit" ? "PUT" : "POST";
            const url = modalMode === "edit"
                ? `${API_BASE_URL}/target-audiences/${selected?.id}`
                : `${API_BASE_URL}/target-audiences`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");

            addToast({
                title: "Thành công",
                description: modalMode === "add" ? "Thêm đối tượng thành công" : "Cập nhật đối tượng thành công",
                color: "success"
            });

            await fetchtargetaudiences();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selected || !session?.accessToken) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/target-audiences/${selected.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                }
            });

            if (!res.ok) throw new Error("Lỗi khi xoá đối tượng");

            addToast({ title: "Thành công", description: "Xoá đối tượng thành công", color: "success" });
            await fetchtargetaudiences();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredtargetaudiences = targetaudiences.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredtargetaudiences.length / itemsPerPage);
    const currentData = filteredtargetaudiences.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý đối tượng</h1>
                <Button
                    color="primary"
                    onClick={openAddModal}
                    startContent={<PlusIcon className="h-5 w-5" />}
                >
                    Thêm mới
                </Button>
            </CardHeader>
            <Divider className="my-4" />
            <CardBody>
                <Input
                    placeholder="Tìm kiếm theo tên"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(0);
                    }}
                    className="mb-4 max-w-sm"
                />

                <Table>
                    <TableHeader>
                        <TableColumn>STT</TableColumn>
                        <TableColumn>Tên đối tượng</TableColumn>
                        <TableColumn>Ngày tạo</TableColumn>
                        <TableColumn>Ngày cập nhật</TableColumn>
                        <TableColumn>Hành động</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentData.map((m, idx) => (
                            <TableRow key={m.id}>
                                <TableCell>{currentPage * itemsPerPage + idx + 1}</TableCell>
                                <TableCell>{m.name}</TableCell>
                                <TableCell>{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(m.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button isIconOnly size="sm" color="warning" onClick={() => openEditModal(m)}>
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </Button>
                                        <Button isIconOnly size="sm" color="danger" onClick={() => openDeleteModal(m)}>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                        isDisabled={currentPage === 0}
                        variant="flat"
                    >
                        Trước
                    </Button>
                    <span className="text-gray-700 dark:text-gray-300">
            Trang {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
          </span>
                    <Button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                        isDisabled={currentPage >= totalPages - 1}
                        variant="flat"
                    >
                        Sau
                    </Button>
                </div>
            </CardBody>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>
                        {modalMode === 'add' && 'Thêm đối tượng'}
                        {modalMode === 'edit' && 'Cập nhật đối tượng'}
                        {modalMode === 'delete' && 'Xác nhận xoá đối tượng'}
                    </ModalHeader>
                    <ModalBody>
                        {modalMode === 'delete' ? (
                            <p className="text-gray-700 dark:text-gray-300">
                                Bạn có chắc chắn muốn xoá đối tượng <span className="font-semibold text-red-600">"{selected?.name}"</span> không?
                            </p>
                        ) : (
                            <form className="space-y-4">
                                <Input
                                    label="Tên đối tượng"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormInputChange}
                                    placeholder="Nhập tên đối tượng"
                                    isRequired
                                />
                            </form>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onClick={onClose}>Huỷ</Button>
                        {modalMode === 'delete' ? (
                            <Button color="danger" onClick={handleDelete} isLoading={isSubmitting}>
                                Xoá
                            </Button>
                        ) : (
                            <Button color="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                                {modalMode === 'add' ? "Thêm mới" : "Cập nhật"}
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
}