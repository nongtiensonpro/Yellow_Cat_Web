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

interface category {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface categoryFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const validatecategoryName = (
    name: string,
    categories: category[],
    mode: "add" | "edit",
    currentId?: number
): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Tên danh mục không được để trống";
    if (trimmed.length > 100) return "Tên danh mục không được vượt quá 100 ký tự";
    if (/^\d+$/.test(trimmed)) return "Tên danh mục phải chứa ít nhất một ký tự chữ cái";

    const isDuplicate = categories.some(
        (m) =>
            m.name.trim().toLowerCase() === trimmed.toLowerCase() &&
            (mode === "add" || (mode === "edit" && m.id !== currentId))
    );
    if (isDuplicate) return `danh mục "${trimmed}" đã tồn tại`;

    return null;
};

export default function Page() {
    const { data: session, status } = useSession();
    const [categories, setcategories] = useState<category[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
    const [formData, setFormData] = useState<categoryFormData>({ name: "" });
    const [selected, setSelected] = useState<category | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState("");
    const [updateError, setUpdateError] = useState("");
    const itemsPerPage = 5;

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const fetchcategories = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/categories?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const json = await res.json();
        setcategories(json.data.content || []);
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchcategories();
        } else if (status === "unauthenticated") {
            signIn();
        }
    }, [status, fetchcategories]);

    const openAddModal = () => {
        setModalMode("add");
        setFormData({ name: "" });
        setSelected(null);
        setUpdateError("");
        onOpen();
    };

    const openEditModal = (category: category) => {
        setModalMode("edit");
        setFormData({ name: category.name });
        setSelected(category);
        setUpdateError("");
        onOpen();
    };

    const openDeleteModal = (category: category) => {
        setModalMode("delete");
        setSelected(category);
        setUpdateError("");
        onOpen();
    };

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();

        if (!modalMode || (modalMode !== "add" && modalMode !== "edit")) {
            addToast({ title: "Lỗi", description: "Không xác định được thao tác", color: "danger" });
            return;
        }

        const validationError = validatecategoryName(trimmedName, categories, modalMode, selected?.id);
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
                ? `${API_BASE_URL}/categories/${selected?.id}`
                : `${API_BASE_URL}/categories`;

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
                description: modalMode === "add" ? "Thêm danh mục thành công" : "Cập nhật danh mục thành công",
                color: "success",
            });

            await fetchcategories();
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
            const res = await fetch(`${API_BASE_URL}/categories/${selected.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });

            if (!res.ok) throw new Error("Lỗi khi xoá danh mục");

            addToast({ title: "Thành công", description: "Xoá danh mục thành công", color: "success" });
            await fetchcategories();
            onClose();
        } catch (err) {
            addToast({ title: "Lỗi", description: (err as Error).message, color: "danger" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredcategories = categories.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredcategories.length / itemsPerPage);
    const currentData = filteredcategories.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý danh mục</h1>
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
                        <TableColumn>Tên danh mục</TableColumn>
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
                                        Không tìm thấy danh mục nào phù hợp.
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
                                ? "Cập nhật danh mục"
                                : modalMode === "delete"
                                    ? "Xác nhận xoá danh mục"
                                    : "Thêm danh mục"}
                        </ModalHeader>
                        <ModalBody>
                            {modalMode === "delete" ? (
                                <p className="text-gray-700 dark:text-gray-300">
                                    Bạn có chắc chắn muốn xoá danh mục <span className="font-semibold text-red-600">{selected?.name}</span> không?
                                </p>
                            ) : (
                                <form className="space-y-4">
                                    <Input
                                        label="Tên danh mục"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setUpdateError("");
                                            handleFormInputChange(e);
                                        }}
                                        placeholder="Nhập tên danh mục"
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