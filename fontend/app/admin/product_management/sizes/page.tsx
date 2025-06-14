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
// interface sizes {
//     id: number;
//     name: string;
//     description: string;
// }
//
// interface ApiResponse {
//     data: {
//         content: sizes[];
//         totalPages: number;
//     };
// }
//
// export default function Page() {
//     const {data: session, status} = useSession();
//     const [allsizesData, setAllsizesData] = useState<sizes[]>([]);
//     const [sizesData, setsizesData] = useState<sizes[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState<number>(0);
//     const [itemsPerPage] = useState<number>(3);
//     const [totalPages, setTotalPages] = useState<number>(1);
//     const [sizeToDelete, setsizeToDelete] = useState<{ id: number, name: string } | null>(null);
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
//                 console.log('Kết nối STOMP sizes đã được thiết lập');
//                 client.subscribe('/topic/sizes', (message) => {
//                     const data = JSON.parse(message.body);
//                     console.log('Nhận thông báo sizes từ server:', data);
//                     setNotification(`Hành động: ${data.action} - size: ${data.entity.name}`);
//
//                     if (data.action === 'add') {
//                         setAllsizesData((prevAll) => [data.entity, ...prevAll]);
//                     } else if (data.action === 'update') {
//                         setAllsizesData((prevAll) =>
//                             prevAll.map((c) => (c.id === data.entity.id ? data.entity : c))
//                         );
//                     } else if (data.action === 'delete') {
//                         setAllsizesData((prevAll) => prevAll.filter((c) => c.id !== data.entity.id));
//                     }
//                 });
//             },
//             onStompError: (frame) => {
//                 console.error('Lỗi STOMP sizes:', frame);
//                 setError('Lỗi kết nối STOMP sizes. Vui lòng thử lại.');
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
//                 console.log("Deactivating STOMP sizes client");
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
//         const fetchAllsizes = async () => {
//             if (status !== "authenticated") return;
//
//             setLoading(true);
//             setError(null);
//             try {
//                 const response = await fetch(`http://localhost:8080/api/sizes?page=0&size=1000`);
//                 if (!response.ok) {
//                     const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
//                     throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
//                 }
//                 const apiResponse: ApiResponse = await response.json();
//                 setAllsizesData(apiResponse.data.content);
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
//                 console.error('Lỗi khi tải tất cả dữ liệu sizes:', err);
//                 setAllsizesData([]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchAllsizes();
//     }, [status]);
//
//     useEffect(() => {
//         if (loading && !allsizesData.length) return;
//
//         let filtered = allsizesData;
//         if (finalSearchTerm) {
//             const searchTermLower = finalSearchTerm.toLowerCase();
//             filtered = allsizesData.filter(size =>
//                 size.name.toLowerCase().includes(searchTermLower) ||
//                 (size.description && size.description.toLowerCase().includes(searchTermLower))
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
//             setsizesData(filtered.slice(startIndex, endIndex));
//         }
//
//     }, [allsizesData, finalSearchTerm, currentPage, itemsPerPage, loading, status]);
//
//     useEffect(() => {
//         if (notification) {
//             const timer = setTimeout(() => {
//                 setNotification(null);
//             }, 3000);
//             return () => clearTimeout(timer);
//         }
//     }, [notification]);
//     const openDeleteConfirm = (sizeId: number, sizeName: string) => {
//         setsizeToDelete({id: sizeId, name: sizeName});
//         onOpen();
//     };
//
//     const handleDeletesize = async () => {
//         if (!sizeToDelete) return;
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
//             const response = await fetch(`http://localhost:8080/api/sizes/${sizeToDelete.id}`, {
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
//             setsizeToDelete(null);
//         } catch (err) {
//             console.error('Lỗi khi xóa size:', err);
//             setError(err instanceof Error ? err.message : 'Không thể xóa size. Vui lòng thử lại sau.');
//             onClose();
//         }
//     };
//
//     if (status === "loading" || (loading && allsizesData.length === 0)) {
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
//                     <p className="text-4xl font-bold">Quản lý size</p>
//                 </div>
//             </CardHeader>
//             <Divider />
//             <CardHeader className="flex flex-col md:flex-row justify-between items-center">
//                 <NextLink href={"/admin/product_management/sizes/create"}
//                           className="mb-4 md:mb-0 inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
//                     Thêm mới
//                 </NextLink>
//                 <div className="w-full md:w-1/3">
//                     <Input
//                         className={'p-3.5'}
//                         // label="Tìm kiếm size Name hoặc Description"
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
//                 {loading && sizesData.length === 0 ? (
//                     <LoadingSpinner/>
//                 ) : error ? (
//                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
//                         <span className="block sm:inline">{error}</span>
//                     </div>
//                 ) : (
//                     <Table aria-label="sizes table">
//                         <TableHeader>
//                             <TableColumn>ID</TableColumn>
//                             <TableColumn>Tên size</TableColumn>
//                             <TableColumn>Mô tả</TableColumn>
//                             <TableColumn>Hành động</TableColumn>
//                         </TableHeader>
//                         <TableBody>
//                             {sizesData && sizesData.length > 0 ? (
//                                 sizesData.map((size) => (
//                                     <TableRow key={size.id}>
//                                         <TableCell>{size.id}</TableCell>
//                                         <TableCell>{size.name}</TableCell>
//                                         <TableCell className="max-w-xs truncate">
//                                             {size.description ? size.description.substring(0, 100) + (size.description.length > 100 ? '...' : '') : 'N/A'}
//                                         </TableCell>
//                                         <TableCell>
//                                             <div className="flex space-x-2">
//                                                 <NextLink
//                                                     href={`/admin/product_management/sizes/update/${size.id}`}>
//                                                     <button
//                                                         className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
//                                                         Sửa
//                                                     </button>
//                                                 </NextLink>
//                                                 <button
//                                                     className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
//                                                     onClick={() => openDeleteConfirm(size.id, size.name)}
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
//                                         {finalSearchTerm ? "Không tìm thấy size nào khớp." : "Không có dữ liệu"}
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
//                             {sizeToDelete && (
//                                 <p>
//                                     Bạn có chắc chắn muốn xóa size "{sizeToDelete.name}"?
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
//                                 onPress={handleDeletesize}
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
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    addToast,
} from "@heroui/react";
import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";

interface size {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface sizeFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const validatesizeName = (
    name: string,
    sizes: size[],
    mode: "add" | "edit",
    currentId?: number
): string | null => {
    const trimmed = name.trim();

    if (!trimmed) return "Kích cỡ không được để trống";
    if (!/^\d+$/.test(trimmed)) return "Kích cỡ chỉ được nhập số";

    const numberValue = parseInt(trimmed, 10);
    if (isNaN(numberValue) || numberValue < 39 || numberValue > 45) {
        return "Kích cỡ phải là số từ 39 đến 45";
    }

    const isDuplicate = sizes.some(
        (m) =>
            m.name.trim() === trimmed &&
            (mode === "add" || (mode === "edit" && m.id !== currentId))
    );
    if (isDuplicate) return `Kích cỡ "${trimmed}" đã tồn tại`;

    return null;
};

export default function Page() {
    const { data: session, status } = useSession();
    const [sizes, setsizes] = useState<size[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
    const [formData, setFormData] = useState<sizeFormData>({ name: "" });
    const [selected, setSelected] = useState<size | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState("");
    const [updateError, setUpdateError] = useState("");
    const itemsPerPage = 5;

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const fetchsizes = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/sizes?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const json = await res.json();
        setsizes(json.data.content || []);
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchsizes();
        } else if (status === "unauthenticated") {
            signIn();
        }
    }, [status, fetchsizes]);

    const openAddModal = () => {
        setModalMode("add");
        setFormData({ name: "" });
        setSelected(null);
        setUpdateError("");
        onOpen();
    };

    const openEditModal = (size: size) => {
        setModalMode("edit");
        setFormData({ name: size.name });
        setSelected(size);
        setUpdateError("");
        onOpen();
    };

    const openDeleteModal = (size: size) => {
        setModalMode("delete");
        setSelected(size);
        setUpdateError("");
        onOpen();
    };

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();

        if (!modalMode || (modalMode !== "add" && modalMode !== "edit")) {
            addToast({ title: "Lỗi", description: "Không xác định được thao tác", color: "danger" });
            return;
        }

        const validationError = validatesizeName(trimmedName, sizes, modalMode, selected?.id);
        if (validationError) {
            if (modalMode === "edit" || modalMode === "add") {
                setUpdateError(validationError);
            }
            addToast({ title: "Lỗi", description: validationError, color: "danger" });
            return;
        }

        setIsSubmitting(true);
        try {
            const method = modalMode === "edit" ? "PUT" : "POST";
            const url = modalMode === "edit"
                ? `${API_BASE_URL}/sizes/${selected?.id}`
                : `${API_BASE_URL}/sizes`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}` },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");

            addToast({
                title: "Thành công",
                description: modalMode === "add" ? "Thêm kích cỡ thành công" : "Cập nhật kích cỡ thành công",
                color: "success",
            });

            await fetchsizes();
            setUpdateError("");
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
            const res = await fetch(`${API_BASE_URL}/sizes/${selected.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            if (!res.ok) throw new Error("Lỗi khi xoá kích cỡ");

            addToast({ title: "Thành công", description: "Xoá kích cỡ thành công", color: "success" });
            await fetchsizes();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredsizes = sizes.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredsizes.length / itemsPerPage);
    const currentData = filteredsizes.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý kích cỡ</h1>
                <Button color="primary" onClick={openAddModal} startContent={<PlusIcon className="h-5 w-5" />}>
                    Thêm mới
                </Button>
            </CardHeader>
            <Divider className="my-4" />
            <CardBody>
                <Input
                    placeholder="Tìm kiếm theo kích cỡ"
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
                        <TableColumn>Kích cỡ</TableColumn>
                        <TableColumn>Ngày tạo</TableColumn>
                        <TableColumn>Ngày cập nhật</TableColumn>
                        <TableColumn>Hành động</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((m, idx) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <div className="text-center py-4 text-gray-600 dark:text-gray-400 italic">
                                        Không tìm thấy kích cỡ nào phù hợp.
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
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

            {(modalMode === "edit" || modalMode === "delete" || modalMode === "add") && (
                <Modal isOpen={isOpen} onClose={onClose} placement="center">
                    <ModalContent>
                        <ModalHeader>
                            {modalMode === "edit"
                                ? "Cập nhật kích cỡ"
                                : modalMode === "delete"
                                    ? "Xác nhận xoá kích cỡ"
                                    : "Thêm kích cỡ"}
                        </ModalHeader>
                        <ModalBody>
                            {modalMode === "delete" ? (
                                <p className="text-gray-700 dark:text-gray-300">
                                    Bạn có chắc chắn muốn xoá kích cỡ <span className="font-semibold text-red-600">"{selected?.name}"</span> không?
                                </p>
                            ) : (
                                <form className="space-y-4">
                                    <Input
                                        label="Tên kích cỡ"
                                        name="name"
                                        type="number"
                                        min={39}
                                        max={45}
                                        value={formData.name}
                                        onChange={(e) => {
                                            setUpdateError("");
                                            handleFormInputChange(e);
                                        }}
                                        placeholder="Nhập kích cỡ (39 - 45)"
                                        isRequired
                                    />
                                    {updateError && (
                                        <p className="text-sm text-red-600 mt-1 italic">{updateError}</p>
                                    )}
                                </form>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onClick={onClose}>Huỷ</Button>
                            {modalMode === "delete" ? (
                                <Button color="danger" onClick={handleDelete} isLoading={isSubmitting}>Xoá</Button>
                            ) : (
                                <Button color="primary" onClick={handleSubmit} isLoading={isSubmitting}>
                                    {modalMode === "add" ? "Thêm mới" : "Cập nhật"}
                                </Button>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </Card>
    );
}
