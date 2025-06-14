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
// interface colors {
//     id: number;
//     name: string;
//     description: string;
// }
//
// interface ApiResponse {
//     data: {
//         content: colors[];
//         totalPages: number;
//     };
// }
//
// export default function Page() {
//     const {data: session, status} = useSession();
//     const [allcolorsData, setAllcolorsData] = useState<colors[]>([]);
//     const [colorsData, setcolorsData] = useState<colors[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState<number>(0);
//     const [itemsPerPage] = useState<number>(3);
//     const [totalPages, setTotalPages] = useState<number>(1);
//     const [colorToDelete, setcolorToDelete] = useState<{ id: number, name: string } | null>(null);
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
//                 console.log('Kết nối STOMP colors đã được thiết lập');
//                 client.subscribe('/topic/colors', (message) => {
//                     const data = JSON.parse(message.body);
//                     console.log('Nhận thông báo colors từ server:', data);
//                     setNotification(`Hành động: ${data.action} - color: ${data.entity.name}`);
//
//                     if (data.action === 'add') {
//                         setAllcolorsData((prevAll) => [data.entity, ...prevAll]);
//                     } else if (data.action === 'update') {
//                         setAllcolorsData((prevAll) =>
//                             prevAll.map((c) => (c.id === data.entity.id ? data.entity : c))
//                         );
//                     } else if (data.action === 'delete') {
//                         setAllcolorsData((prevAll) => prevAll.filter((c) => c.id !== data.entity.id));
//                     }
//                 });
//             },
//             onStompError: (frame) => {
//                 console.error('Lỗi STOMP colors:', frame);
//                 setError('Lỗi kết nối STOMP colors. Vui lòng thử lại.');
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
//                 console.log("Deactivating STOMP colors client");
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
//         const fetchAllcolors = async () => {
//             if (status !== "authenticated") return;
//
//             setLoading(true);
//             setError(null);
//             try {
//                 const response = await fetch(`http://localhost:8080/api/colors?page=0&size=1000`);
//                 if (!response.ok) {
//                     const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
//                     throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
//                 }
//                 const apiResponse: ApiResponse = await response.json();
//                 setAllcolorsData(apiResponse.data.content);
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
//                 console.error('Lỗi khi tải tất cả dữ liệu colors:', err);
//                 setAllcolorsData([]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchAllcolors();
//     }, [status]);
//
//     useEffect(() => {
//         if (loading && !allcolorsData.length) return;
//
//         let filtered = allcolorsData;
//         if (finalSearchTerm) {
//             const searchTermLower = finalSearchTerm.toLowerCase();
//             filtered = allcolorsData.filter(color =>
//                 color.name.toLowerCase().includes(searchTermLower) ||
//                 (color.description && color.description.toLowerCase().includes(searchTermLower))
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
//             setcolorsData(filtered.slice(startIndex, endIndex));
//         }
//
//     }, [allcolorsData, finalSearchTerm, currentPage, itemsPerPage, loading, status]);
//
//     useEffect(() => {
//         if (notification) {
//             const timer = setTimeout(() => {
//                 setNotification(null);
//             }, 3000);
//             return () => clearTimeout(timer);
//         }
//     }, [notification]);
//     const openDeleteConfirm = (colorId: number, colorName: string) => {
//         setcolorToDelete({id: colorId, name: colorName});
//         onOpen();
//     };
//
//     const handleDeletecolor = async () => {
//         if (!colorToDelete) return;
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
//             const response = await fetch(`http://localhost:8080/api/colors/${colorToDelete.id}`, {
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
//             setcolorToDelete(null);
//         } catch (err) {
//             console.error('Lỗi khi xóa color:', err);
//             setError(err instanceof Error ? err.message : 'Không thể xóa color. Vui lòng thử lại sau.');
//             onClose();
//         }
//     };
//
//     if (status === "loading" || (loading && allcolorsData.length === 0)) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <LoadingSpinner />
//             </div>
//         );
//     }
//
//     return (
//         <Card className="min-h-screen py-8 px-4 md:px-36 bg-white dark:bg-gray-900">
//             <CardHeader className="flex justify-between items-center mb-4">
//                 <div>
//                     <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Quản lý màu sắc</h2>
//                 </div>
//                 <NextLink
//                     href="/admin/product_management/colors/create"
//                     className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
//                 >
//                     Thêm mới
//                 </NextLink>
//             </CardHeader>
//             <Divider />
//             <CardBody>
//                 <div className="flex justify-end mb-4">
//                     <div className="w-full md:w-1/3">
//                         <Input
//                             label="Tìm kiếm theo tên hoặc mô tả"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             isClearable
//                             onClear={() => setSearchTerm("")}
//                             // placeholder="Tìm kiếm theo tên hoặc mô tả"
//                         />
//                     </div>
//                 </div>
//
//                 {notification && (
//                     <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md relative">
//                         {notification}
//                         <button
//                             className="absolute top-1 right-2 text-lg font-bold"
//                             onClick={() => setNotification(null)}
//                         >×</button>
//                     </div>
//                 )}
//
//                 {loading && colorsData.length === 0 ? (
//                     <LoadingSpinner />
//                 ) : error ? (
//                     <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>
//                 ) : (
//                     <Table>
//                         <TableHeader>
//                             <TableColumn>ID</TableColumn>
//                             <TableColumn>Tên màu</TableColumn>
//                             <TableColumn>Mô tả</TableColumn>
//                             <TableColumn className="text-center">Hành động</TableColumn>
//                         </TableHeader>
//                         <TableBody>
//                             {colorsData.length > 0 ? (
//                                 colorsData.map((color) => (
//                                     <TableRow key={color.id}>
//                                         <TableCell>{color.id}</TableCell>
//                                         <TableCell>{color.name}</TableCell>
//                                         <TableCell>{color.description?.slice(0, 100) || "N/A"}</TableCell>
//                                         <TableCell>
//                                             <div className="flex justify-center gap-3">
//                                                 <NextLink
//                                                     href={`/admin/product_management/colors/update/${color.id}`}
//                                                     className="px-4 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
//                                                 >
//                                                     Sửa
//                                                 </NextLink>
//                                                 <button
//                                                     onClick={() => openDeleteConfirm(color.id, color.name)}
//                                                     className="px-4 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition"
//                                                 >
//                                                     Xoá
//                                                 </button>
//                                             </div>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={4} className="text-center py-4 text-gray-500">
//                                         {finalSearchTerm ? "Không tìm thấy kết quả." : "Không có dữ liệu."}
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 )}
//
//                 {totalPages > 1 && (
//                     <div className="flex justify-center items-center mt-6 gap-4">
//                         <Button
//                             onClick={() => setCurrentPage((prev) => prev - 1)}
//                             disabled={currentPage === 0}
//                             // variant="outline"
//                         >
//                             Trước
//                         </Button>
//                         <span className="text-sm text-gray-600 dark:text-gray-300">
//           Trang {currentPage + 1} / {totalPages}
//         </span>
//                         <Button
//                             onClick={() => setCurrentPage((prev) => prev + 1)}
//                             disabled={currentPage >= totalPages - 1}
//                             // variant="outline"
//                         >
//                             Sau
//                         </Button>
//                     </div>
//                 )}
//
//                 <Modal isOpen={isOpen} onClose={onClose}>
//                     <ModalContent>
//                         <ModalHeader>Xác nhận xoá</ModalHeader>
//                         <ModalBody>
//                             {colorToDelete && (
//                                 <p>
//                                     Bạn có chắc chắn muốn xoá màu "{colorToDelete.name}"?
//                                     <br /> Hành động này không thể hoàn tác.
//                                 </p>
//                             )}
//                         </ModalBody>
//                         <ModalFooter>
//                             <Button variant="light" onPress={onClose}>
//                                 Huỷ
//                             </Button>
//                             <Button color="danger" onPress={handleDeletecolor}>
//                                 Xoá
//                             </Button>
//                         </ModalFooter>
//                     </ModalContent>
//                 </Modal>
//             </CardBody>
//         </Card>
//
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

interface color {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface colorFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const validatecolorName = (
    name: string,
    colors: color[],
    mode: "add" | "edit",
    currentId?: number
): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Tên màu sắc không được để trống";
    if (trimmed.length > 100) return "Tên màu sắc không được vượt quá 100 ký tự";
    if (/^\d+$/.test(trimmed)) return "Tên màu sắc phải chứa ít nhất một ký tự chữ cái";

    const isDuplicate = colors.some(
        (m) =>
            m.name.trim().toLowerCase() === trimmed.toLowerCase() &&
            (mode === "add" || (mode === "edit" && m.id !== currentId))
    );
    if (isDuplicate) return `màu sắc "${trimmed}" đã tồn tại`;

    return null;
};

export default function Page() {
    const { data: session, status } = useSession();
    const [colors, setcolors] = useState<color[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
    const [formData, setFormData] = useState<colorFormData>({ name: "" });
    const [selected, setSelected] = useState<color | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState("");
    const [updateError, setUpdateError] = useState("");
    const itemsPerPage = 5;

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const fetchcolors = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/colors?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const json = await res.json();
        setcolors(json.data.content || []);
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchcolors();
        } else if (status === "unauthenticated") {
            signIn();
        }
    }, [status, fetchcolors]);

    const openAddModal = () => {
        setModalMode("add");
        setFormData({ name: "" });
        setSelected(null);
        setUpdateError("");
        onOpen();
    };

    const openEditModal = (color: color) => {
        setModalMode("edit");
        setFormData({ name: color.name });
        setSelected(color);
        setUpdateError("");
        onOpen();
    };

    const openDeleteModal = (color: color) => {
        setModalMode("delete");
        setSelected(color);
        setUpdateError("");
        onOpen();
    };

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();

        if (!modalMode || (modalMode !== "add" && modalMode !== "edit")) {
            addToast({ title: "Lỗi", description: "Không xác định được thao tác", color: "danger" });
            return;
        }

        const validationError = validatecolorName(trimmedName, colors, modalMode, selected?.id);
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
                ? `${API_BASE_URL}/colors/${selected?.id}`
                : `${API_BASE_URL}/colors`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");

            addToast({
                title: "Thành công",
                description: modalMode === "add" ? "Thêm màu sắc thành công" : "Cập nhật màu sắc thành công",
                color: "success",
            });

            await fetchcolors();
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
            const res = await fetch(`${API_BASE_URL}/colors/${selected.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            if (!res.ok) throw new Error("Lỗi khi xoá màu sắc");

            addToast({ title: "Thành công", description: "Xoá màu sắc thành công", color: "success" });
            await fetchcolors();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredcolors = colors.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredcolors.length / itemsPerPage);
    const currentData = filteredcolors.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý màu sắc</h1>
                <Button color="primary" onClick={openAddModal} startContent={<PlusIcon className="h-5 w-5" />}>
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
                        <TableColumn>Tên màu sắc</TableColumn>
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
                                        Không tìm thấy màu sắc nào phù hợp.
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
                                ? "Cập nhật màu sắc"
                                : modalMode === "delete"
                                    ? "Xác nhận xoá màu sắc"
                                    : "Thêm màu sắc"}
                        </ModalHeader>
                        <ModalBody>
                            {modalMode === "delete" ? (
                                <p className="text-gray-700 dark:text-gray-300">
                                    Bạn có chắc chắn muốn xoá màu sắc <span className="font-semibold text-red-600">"{selected?.name}"</span> không?
                                </p>
                            ) : (
                                <form className="space-y-4">
                                    <Input
                                        label="Tên màu sắc"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setUpdateError("");
                                            handleFormInputChange(e);
                                        }}
                                        placeholder="Nhập tên màu sắc"
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