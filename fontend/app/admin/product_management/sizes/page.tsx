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
import {useEffect, useState, useCallback} from "react";
import {useSession, signIn} from "next-auth/react";
import {PlusIcon, PencilSquareIcon, TrashIcon} from "@heroicons/react/20/solid";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {CheckIcon} from "lucide-react";

interface size {
    id: number;
    name: string;
    status: boolean;
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
    const {data: session, status} = useSession();
    const [sizes, setsizes] = useState<size[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
    const [formData, setFormData] = useState<sizeFormData>({name: ""});
    const [selected, setSelected] = useState<size | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [searchTerm, setSearchTerm] = useState("");
    const [updateError, setUpdateError] = useState("");
    const itemsPerPage = 5;

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    }, []);

    const fetchsizes = useCallback(async () => {
        if (!session?.accessToken) return;
        const res = await fetch(`${API_BASE_URL}/sizes?page=0&size=1000`, {
            headers: {Authorization: `Bearer ${session.accessToken}`},
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
        setFormData({name: ""});
        setSelected(null);
        setUpdateError("");
        onOpen();
    };

    const openEditModal = (size: size) => {
        setModalMode("edit");
        setFormData({name: size.name});
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
            addToast({title: "Lỗi", description: "Không xác định được thao tác", color: "danger"});
            return;
        }

        const validationError = validatesizeName(trimmedName, sizes, modalMode, selected?.id);
        if (validationError) {
            if (modalMode === "edit" || modalMode === "add") {
                setUpdateError(validationError);
            }
            addToast({title: "Lỗi", description: validationError, color: "danger"});
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
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({name: trimmedName}),
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
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
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
                headers: {Authorization: `Bearer ${session.accessToken}`},
            });

            if (!res.ok) throw new Error("Lỗi khi xoá kích cỡ");

            addToast({title: "Thành công", description: "Xoá kích cỡ thành công", color: "success"});
            await fetchsizes();
            onClose();
        } catch (err) {
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatus = async () => {
        if (!selected || !session?.accessToken) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/sizes/status/${selected.id}`, {
                method: "PUT",
                headers: {Authorization: `Bearer ${session.accessToken}`},
            });

            if (!res.ok) throw new Error("Lỗi khi cập nhật kích cỡ");

            addToast({title: "Thành công", description: "Chuyển trạng thái thành công", color: "success"});
            await fetchsizes();
            onClose();
        } catch (err) {
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
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
                <Button color="primary" onClick={openAddModal} startContent={<PlusIcon className="h-5 w-5"/>}>
                    Thêm mới
                </Button>
            </CardHeader>
            <Divider className="my-4"/>
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
                                            <Button isIconOnly size="sm" color="warning"
                                                    onClick={() => openEditModal(m)}>
                                                <PencilSquareIcon className="h-4 w-4"/>
                                            </Button>
                                            <Button isIconOnly size="sm" color="danger"
                                                    onClick={() => openDeleteModal(m)}>
                                                <TrashIcon className="h-4 w-4"/>
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
                                    Bạn có chắc chắn muốn xoá kích cỡ <span
                                    className="font-semibold text-red-600">{selected?.name}</span> không?
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