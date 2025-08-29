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
import {CheckIcon} from "lucide-react";
import {XMarkIcon} from "@heroicons/react/24/outline";

interface Material {
    id: number;
    name: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

interface MaterialFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const validateMaterialName = (
    name: string,
    materials: Material[],
    mode: "add" | "edit",
    currentId?: number
): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Tên chất liệu không được để trống";
    if (trimmed.length > 100) return "Tên chất liệu không được vượt quá 100 ký tự";
    if (/^\d+$/.test(trimmed)) return "Tên chất liệu phải chứa ít nhất một ký tự chữ cái";

    const isDuplicate = materials.some(
        (m) =>
            m.name.trim().toLowerCase() === trimmed.toLowerCase() &&
            (mode === "add" || (mode === "edit" && m.id !== currentId))
    );
    if (isDuplicate) return `Chất liệu "${trimmed}" đã tồn tại`;

    return null;
};

export default function Page() {
    const { data: session, status } = useSession();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
    const [formData, setFormData] = useState<MaterialFormData>({ name: "" });
    const [selected, setSelected] = useState<Material | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState("");
    const [updateError, setUpdateError] = useState("");
    const itemsPerPage = 5;

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const fetchMaterials = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/materials?page=0&size=1000`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
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

    const openAddModal = () => {
        setModalMode("add");
        setFormData({ name: "" });
        setSelected(null);
        setUpdateError("");
        onOpen();
    };

    const openEditModal = (material: Material) => {
        setModalMode("edit");
        setFormData({ name: material.name });
        setSelected(material);
        setUpdateError("");
        onOpen();
    };

    const openDeleteModal = (material: Material) => {
        setModalMode("delete");
        setSelected(material);
        setUpdateError("");
        onOpen();
    };

    const handleSubmit = async () => {
        const trimmedName = formData.name.trim();

        if (!modalMode || (modalMode !== "add" && modalMode !== "edit")) {
            addToast({ title: "Lỗi", description: "Không xác định được thao tác", color: "danger" });
            return;
        }

        const validationError = validateMaterialName(trimmedName, materials, modalMode, selected?.id);
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
                ? `${API_BASE_URL}/materials/${selected?.id}`
                : `${API_BASE_URL}/materials`;

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
                description: modalMode === "add" ? "Thêm chất liệu thành công" : "Cập nhật chất liệu thành công",
                color: "success",
            });

            await fetchMaterials();
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
            const res = await fetch(`${API_BASE_URL}/materials/${selected.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
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

    const handleStatus = async () => {
        if (!selected || !session?.accessToken) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/materials/status/${selected.id}`, {
                method: "PUT",
                headers: {Authorization: `Bearer ${session.accessToken}`},
            });

            if (!res.ok) throw new Error("Lỗi khi chuyển trạng thái");

            addToast({title: "Thành công", description: "Chuyển trạng thái thành công", color: "success"});
            await fetchMaterials();
            onClose();
        } catch (err) {
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMaterials = materials.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
    const currentData = filteredMaterials.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );

    return (
        <Card className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
            <CardHeader className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý chất liệu</h1>
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
                        <TableColumn>Tên chất liệu</TableColumn>
                        <TableColumn>Ngày tạo</TableColumn>
                        <TableColumn>Ngày cập nhật</TableColumn>
                        <TableColumn>Trạng thái</TableColumn>
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
                                    <TableCell>{m.status ? "Đang hoạt động" : "Ngừng hoạt động"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button isIconOnly size="sm" color="warning" onClick={() => openEditModal(m)}>
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </Button>
                                            <Button isIconOnly size="sm" color="danger" onClick={() => openDeleteModal(m)}>
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                color={m.status ? "success" : "default"}
                                                onClick={() => {
                                                    setSelected(m);
                                                    handleStatus();
                                                }}
                                            >
                                                {m.status ? (
                                                    <CheckIcon className="h-4 w-4"/>   // trạng thái đang hoạt động
                                                ) : (
                                                    <XMarkIcon className="h-4 w-4"/>   // trạng thái ngừng
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <div className="text-center py-4 text-gray-600 dark:text-gray-400 italic">
                                        Không tìm thấy chất liệu nào phù hợp.
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
                                ? "Cập nhật chất liệu"
                                : modalMode === "delete"
                                    ? "Xác nhận xoá chất liệu"
                                    : "Thêm chất liệu"}
                        </ModalHeader>
                        <ModalBody>
                            {modalMode === "delete" ? (
                                <p className="text-gray-700 dark:text-gray-300">
                                    Bạn có chắc chắn muốn xoá chất liệu <span className="font-semibold text-red-600">{selected?.name}</span> không?
                                </p>
                            ) : (
                                <form className="space-y-4">
                                    <Input
                                        label="Tên chất liệu"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setUpdateError("");
                                            handleFormInputChange(e);
                                        }}
                                        placeholder="Nhập tên chất liệu"
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