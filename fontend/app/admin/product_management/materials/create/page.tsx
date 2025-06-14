// "use client";
//
// import {Card, CardHeader, CardBody, Divider, Button, addToast} from "@heroui/react";
// import {Input} from "@heroui/input";
// import {useState, useEffect} from "react";
// import {useRouter} from "next/navigation";
// import {CardFooter} from "@heroui/card";
// import {useSession} from "next-auth/react";
//
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
//
// export interface Materials {
//     name: string;
//     description: string;
// }
//
// const creatematerial = async (data: Materials, token: string) => {
//     if (!token) {
//         console.error("Lỗi: Không tìm thấy token xác thực.");
//         throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
//     }
//
//     try {
//         const response = await fetch(`${API_BASE_URL}/materials`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             },
//             body: JSON.stringify(data)
//         });
//
//         if (!response.ok) {
//             let errorBody = "Lỗi không xác định từ máy chủ.";
//             try {
//                 const errorData = await response.json();
//                 errorBody = errorData.message || errorData.error || JSON.stringify(errorData);
//             } catch (e) {
//                 errorBody = response.statusText;
//             }
//             console.error("Lỗi API:", response.status, errorBody);
//             throw new Error(`Không thể tạo materials: ${errorBody} (Status: ${response.status})`);
//         }
//
//         return await response.json();
//     } catch (error) {
//         console.error("Lỗi khi gọi API tạo material:", error);
//         throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
//     }
// };
//
// export default function CreatematerialPage() {
//     const router = useRouter();
//     const [formError, setFormError] = useState<string | null>(null);
//     const [materialName, setmaterialName] = useState("");
//     const [description, setDescription] = useState("");
//     const [isSubmitting, setIsSubmitting] = useState(false);
//
//     // Sử dụng NextAuth session để lấy token
//     const {data: session, status} = useSession();
//     const authToken = session?.accessToken;
//     const isAuthenticated = status === "authenticated" && !!authToken;
//     const isAuthLoading = status === "loading";
//
//     // Kiểm tra xác thực khi component được tải
//     useEffect(() => {
//         if (status === "unauthenticated") {
//             console.warn("Người dùng chưa đăng nhập khi vào trang tạo material.");
//             addToast({
//                 title: "Yêu cầu đăng nhập",
//                 description: "Vui lòng đăng nhập để tiếp tục.",
//                 color: "warning"
//             });
//             router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
//         }
//     }, [status, router]);
//
//     const validateForm = (): boolean => {
//         if (!materialName.trim()) {
//             addToast({title: "Thiếu thông tin", description: "Vui lòng nhập tên materials.", color: "warning"});
//             return false;
//         }
//         return true;
//     };
//
//     const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//         event.preventDefault();
//         setFormError(null);
//
//         if (!validateForm() || isSubmitting) {
//             return;
//         }
//
//         if (!authToken) {
//             addToast({
//                 title: "Lỗi xác thực",
//                 description: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
//                 color: "danger"
//             });
//             router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
//             return;
//         }
//
//         setIsSubmitting(true);
//
//         try {
//             const response = await creatematerial(
//                 {
//                     name: materialName.trim(),
//                     description: description.trim()
//                 },
//                 authToken
//             );
//
//             addToast({
//                 title: "Thành công",
//                 description: "Thêm chất liệu thành công!",
//                 color: "success",
//             });
//
//             setmaterialName("");
//             setFormError(null);
//             setTimeout(() => {
//                 router.push("/admin/product_management/materials");
//             }, 1500);
//
//         } catch (err: any) {
//             const errorMessage = err instanceof Error ? err.message : "Không thể tạo material. Đã xảy ra lỗi không mong muốn.";
//             console.error("Lỗi khi submit:", err);
//             setFormError(errorMessage);
//             addToast({
//                 title: "Lỗi",
//                 description: `Có lỗi xảy ra: ${errorMessage}`,
//                 color: "danger",
//             });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//
//     // Hiển thị loading khi đang kiểm tra xác thực
//     if (isAuthLoading) {
//         return (
//             <Card className="w-full max-w-2xl mx-auto">
//                 <CardBody className="flex justify-center items-center p-10">
//                     <div className="text-center">
//                         <div
//                             className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
//                         <p>Đang kiểm tra thông tin xác thực...</p>
//                     </div>
//                 </CardBody>
//             </Card>
//         );
//     }
//
//     return (
//         <Card className={`min-h-screen py-8 px-4 md:px-36`}>
//             <form onSubmit={handleSubmit}>
//                 <CardHeader className="flex gap-3">
//                     <div className="flex flex-col">
//                         <p className="text-lg font-semibold">Thêm mới chất liệu</p>
//                     </div>
//                 </CardHeader>
//                 <Divider/>
//                 <CardBody className="space-y-6 p-5">
//                     <Input
//                         label="Tên chất liệu"
//                         placeholder="Nhập tên chất liệu"
//                         type="text"
//                         value={materialName}
//                         onChange={(e) => {
//                             setmaterialName(e.target.value);
//                             setFormError(null);
//                         }} // Xóa lỗi khi nhập
//                         isRequired
//                     />
//                     <div className="flex flex-col gap-1">
//                         <label htmlFor="description" className="text-sm font-medium text-gray-700">
//                             Mô tả
//                         </label>
//                         <textarea
//                             id="description"
//                             placeholder="Nhập mô tả"
//                             value={description}
//                             onChange={(e) => {
//                                 setDescription(e.target.value);
//                                 setFormError(null);
//                             }}
//                             required
//                             rows={4}
//                             className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
//                         />
//                     </div>
//                     {formError && (
//                         <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md"
//                            role="alert">
//                             {formError}
//                         </p>
//                     )}
//
//                 </CardBody>
//                 <Divider/>
//                 <CardFooter className="p-5 flex justify-end">
//                     <Button
//                         color="success"
//                         type="submit"
//                         isDisabled={isSubmitting || !isAuthenticated}
//                     >
//                         {isSubmitting ? "Đang xử lý..." : "Tạo mới"}
//                     </Button>
//                 </CardFooter>
//             </form>
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
    Input,
    addToast
} from "@heroui/react";
import { useEffect, useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";

interface Material {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface MaterialFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export default function Page() {
    const { data: session, status } = useSession();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [formData, setFormData] = useState<MaterialFormData>({ name: '' });
    const [selected, setSelected] = useState<Material | null>(null);
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

    const openEditModal = (material: Material) => {
        setModalMode("edit");
        setFormData({ name: material.name });
        setSelected(material);
        onOpen();
    };

    const openDeleteModal = (material: Material) => {
        setModalMode("delete");
        setSelected(material);
        onOpen();
    };

    const fetchMaterials = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/materials?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const json = await res.json();
        setMaterials(json.data.content || []);
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchMaterials();
        } else if (status === "unauthenticated") {
            signIn();
        }
    }, [status, fetchMaterials]);

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();

        if (!trimmedName) {
            addToast({ title: "Lỗi", description: "Vui lòng nhập tên chất liệu hợp lệ.", color: "danger" });
            return;
        }

        if (trimmedName.length > 50) {
            addToast({ title: "Lỗi", description: "Tên chất liệu không được vượt quá 50 ký tự.", color: "danger" });
            return;
        }

        if (!/^(?=.*[a-zA-ZÀ-ỹ])[a-zA-Z\dÀ-ỹ\s\-_]*$/.test(trimmedName)) {
            addToast({ title: "Lỗi", description: "Tên chất liệu phải chứa chữ cái và không có ký tự đặc biệt.", color: "danger" });
            return;
        }

        const isDuplicate = materials.some((m) =>
            modalMode === "edit"
                ? m.name.toLowerCase() === trimmedName.toLowerCase() && m.id !== selected?.id
                : m.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
            addToast({ title: "Lỗi", description: `Chất liệu \"${trimmedName}\" đã tồn tại.`, color: "danger" });
            return;
        }

        setIsSubmitting(true);
        try {
            const method = modalMode === "edit" ? "PUT" : "POST";
            const url = modalMode === "edit"
                ? `${API_BASE_URL}/materials/${selected?.id}`
                : `${API_BASE_URL}/materials`;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ name: trimmedName })
            });

            if (!res.ok) throw new Error("Lỗi khi lưu dữ liệu");

            addToast({
                title: "Thành công",
                description: modalMode === "add" ? "Thêm chất liệu thành công" : "Cập nhật chất liệu thành công",
                color: "success"
            });

            await fetchMaterials();
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
            const res = await fetch(`${API_BASE_URL}/materials/${selected.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                }
            });

            if (!res.ok) throw new Error("Lỗi khi xoá chất liệu");

            addToast({ title: "Thành công", description: "Xoá chất liệu thành công", color: "success" });
            await fetchMaterials();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMaterials = materials.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
    const currentData = filteredMaterials.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý chất liệu</h1>
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
                        <TableColumn>Tên chất liệu</TableColumn>
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

            <Modal isOpen={isOpen} onClose={onClose} placement="center">
                <ModalContent>
                    <ModalHeader>
                        {modalMode === 'add' && 'Thêm chất liệu'}
                        {modalMode === 'edit' && 'Cập nhật chất liệu'}
                        {modalMode === 'delete' && 'Xác nhận xoá chất liệu'}
                    </ModalHeader>
                    <ModalBody>
                        {modalMode === 'delete' ? (
                            <p className="text-gray-700 dark:text-gray-300">
                                Bạn có chắc chắn muốn xoá chất liệu <span className="font-semibold text-red-600">"{selected?.name}"</span> không?
                            </p>
                        ) : (
                            <form className="space-y-4">
                                <Input
                                    label="Tên chất liệu"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormInputChange}
                                    placeholder="Nhập tên chất liệu"
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