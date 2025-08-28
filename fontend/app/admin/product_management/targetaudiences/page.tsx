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
import {useEffect, useState, useCallback} from "react";
import {useSession, signIn} from "next-auth/react";
import {addToast} from "@heroui/react";
import {PlusIcon, PencilSquareIcon, TrashIcon} from "@heroicons/react/20/solid";
import {CheckIcon} from "lucide-react";
import {XMarkIcon} from "@heroicons/react/24/outline";

interface targetaudience {
    id: number;
    name: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}

interface targetaudienceFormData {
    name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export default function Page() {
    const {data: session, status} = useSession();
    const [targetaudiences, settargetaudiences] = useState<targetaudience[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
    const [formData, setFormData] = useState<targetaudienceFormData>({name: ''});
    const [selected, setSelected] = useState<targetaudience | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [searchTerm, setSearchTerm] = useState('');

    const handleFormInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    }, []);

    const openAddModal = () => {
        setModalMode("add");
        setFormData({name: ''});
        setSelected(null);
        onOpen();
    };

    const openEditModal = (targetaudience: targetaudience) => {
        setModalMode("edit");
        setFormData({name: targetaudience.name});
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
            headers: {Authorization: `Bearer ${session.accessToken}`}
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
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
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

            addToast({title: "Thành công", description: "Xoá đối tượng thành công", color: "success"});
            await fetchtargetaudiences();
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
            const res = await fetch(`${API_BASE_URL}/target-audiences/status/${selected.id}`, {
                method: "PUT",
                headers: {Authorization: `Bearer ${session.accessToken}`},
            });

            if (!res.ok) throw new Error("Lỗi khi chuyển trạng thái");

            addToast({title: "Thành công", description: "Chuyển trạng thái thành công", color: "success"});
            await fetchtargetaudiences();
            onClose();
        } catch (err) {
            addToast({title: "Lỗi", description: (err as Error).message, color: "danger"});
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
                    startContent={<PlusIcon className="h-5 w-5"/>}
                >
                    Thêm mới
                </Button>
            </CardHeader>
            <Divider className="my-4"/>
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
                        <TableColumn>Trạng thái</TableColumn>
                        <TableColumn>Hành động</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentData.map((m, idx) => (
                            <TableRow key={m.id}>
                                <TableCell>{currentPage * itemsPerPage + idx + 1}</TableCell>
                                <TableCell>{m.name}</TableCell>
                                <TableCell>{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(m.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell>{m.status ? "Đang hoạt động" : "Ngừng hoạt động"}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button isIconOnly size="sm" color="warning" onClick={() => openEditModal(m)}>
                                            <PencilSquareIcon className="h-4 w-4"/>
                                        </Button>
                                        <Button isIconOnly size="sm" color="danger" onClick={() => openDeleteModal(m)}>
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
                                Bạn có chắc chắn muốn xoá đối tượng <span
                                className="font-semibold text-red-600">{selected?.name}</span> không?
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