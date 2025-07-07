"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    addToast,
    Spinner
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Size {
    id: number | string;
    name: string;
    description: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

interface EditSizeModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sizeId: string | number;
    onSuccess?: () => void;
}

const fetchSizeById = async (id: string | number, token: string | undefined): Promise<ApiResponse<Size>> => {
    if (!token) throw new Error("Chưa xác thực.");
    try {
        const response = await fetch(`http://localhost:8080/api/sizes/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Kích cỡ.");
            const errorData = await response.json().catch(() => ({ message: `Lỗi không xác định (Status: ${response.status})` }));
            throw new Error(errorData.message || `Failed to fetch size (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

const updateSize = async (
    id: string | number,
    data: Omit<Size, "id" | "createdAt" | "updatedAt">,
    token: string | undefined
): Promise<ApiResponse<Size> | null> => {
    if (!token) throw new Error("Chưa xác thực.");
    try {
        const nowISO = new Date().toISOString();
        const fullData = { id, ...data, createdAt: nowISO, updatedAt: nowISO };
        const response = await fetch(`http://localhost:8080/api/sizes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(fullData)
        });
        if (!response.ok) {
            let errorBody = `Lỗi cập nhật (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorBody = errorData.message || errorData.error || JSON.stringify(errorData);
            } catch { }
            throw new Error(errorBody);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
        return null;
    } catch (error) {
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi cập nhật.");
    }
};

export default function EditSizeModal({
                                          isOpen,
                                          onOpenChange,
                                          sizeId,
                                          onSuccess
                                      }: EditSizeModalProps) {
    const { data: session } = useSession();
    const [sizeData, setSizeData] = useState<Omit<Size, "id" | "createdAt" | "updatedAt">>({
        name: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const authToken = session?.accessToken;

    useEffect(() => {
        if (!isOpen) {
            setSizeData({ name: "", description: "" });
            setFormError(null);
            setIsSubmitting(false);
            setDataLoaded(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && sizeId && authToken && !dataLoaded) {
            setLoading(true);
            setFormError(null);
            fetchSizeById(sizeId, authToken)
                .then(response => {
                    const fetched = response.data;
                    if (!fetched) throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    setSizeData({
                        name: fetched.name || "",
                        description: fetched.description || ""
                    });
                    setDataLoaded(true);
                })
                .catch(err => {
                    const errorMsg = err.message || "Không thể tải dữ liệu Kích cỡ.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, sizeId, authToken, dataLoaded]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSizeData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSizeData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const validateForm = (): boolean => {
        if (!sizeData.name.trim()) {
            setFormError("Vui lòng nhập tên Kích cỡ.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Kích cỡ.", color: "warning" });
            return false;
        }
        
        // Kiểm tra có chứa dấu chấm thập phân không
        if (sizeData.name.trim().includes('.') || sizeData.name.trim().includes(',')) {
            setFormError("Tên Kích cỡ không được chứa số thập phân.");
            addToast({ title: "Dữ liệu không hợp lệ", description: "Tên Kích cỡ không được chứa số thập phân.", color: "warning" });
            return false;
        }
        
        const nameNumber = parseInt(sizeData.name.trim());
        if (isNaN(nameNumber) || !Number.isInteger(Number(sizeData.name.trim()))) {
            setFormError("Tên Kích cỡ phải là một số nguyên.");
            addToast({ title: "Dữ liệu không hợp lệ", description: "Tên Kích cỡ phải là một số nguyên.", color: "warning" });
            return false;
        }
        
        if (nameNumber < 15 || nameNumber > 49) {
            setFormError("Tên Kích cỡ phải là số nguyên từ 15 đến 49.");
            addToast({ title: "Dữ liệu không hợp lệ", description: "Tên Kích cỡ phải là số nguyên từ 15 đến 49.", color: "warning" });
            return false;
        }
        
        if (!sizeData.description.trim()) {
            setFormError("Vui lòng nhập mô tả Kích cỡ.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập mô tả Kích cỡ.", color: "warning" });
            return false;
        }
        return true;
    };

    const handleUpdateSubmit = async () => {
        setFormError(null);
        if (!authToken) {
            setFormError("Phiên đăng nhập hết hạn.");
            addToast({ title: "Lỗi", description: "Phiên đăng nhập hết hạn.", color: "danger" });
            return;
        }
        if (!validateForm() || isSubmitting) return;
        setIsSubmitting(true);

        const dataToUpdate: Omit<Size, "id" | "createdAt" | "updatedAt"> = {
            name: sizeData.name.trim(),
            description: sizeData.description.trim()
        };

        try {
            await updateSize(sizeId, dataToUpdate, authToken);
            addToast({
                title: "Thành công",
                description: "Cập nhật Kích cỡ thành công!",
                color: "success",
            });
            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật Kích cỡ.";
            setFormError(errorMessage);
            addToast({
                title: "Lỗi Cập Nhật",
                description: `Có lỗi xảy ra: ${errorMessage}`,
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) onOpenChange(false);
    };

    const isFormReady = dataLoaded && !loading && authToken;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
            placement="center"
            className="max-w-[95vw] max-h-[90vh]"
            isDismissable={!isSubmitting}
            isKeyboardDismissDisabled={isSubmitting}
        >
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b">
                            <h2 className="text-xl font-semibold">Chỉnh sửa Kích cỡ (ID: {sizeId})</h2>
                            <p className="text-sm text-gray-600">Cập nhật thông tin Kích cỡ</p>
                        </ModalHeader>
                        <ModalBody className="px-6 py-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner label="Đang tải dữ liệu Kích cỡ..." size="lg" />
                                </div>
                            ) : formError && !dataLoaded ? (
                                <div className="py-4">
                                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Kích cỡ.
                                    </p>
                                </div>
                            ) : dataLoaded ? (
                                <div className="space-y-6">
                                    <Input
                                        label="Tên Kích cỡ"
                                        placeholder="Nhập số từ 15 đến 49"
                                        type="number"
                                        min="15"
                                        max="49"
                                        step="1"
                                        name="name"
                                        value={sizeData.name}
                                        onChange={handleInputChange}
                                        isRequired
                                        variant="bordered"
                                        isDisabled={isSubmitting}
                                    />
                                    <div>
                                        <label htmlFor="description" className="mb-2 text-sm font-medium text-gray-700 block">
                                            Mô tả Kích cỡ
                                        </label>
                                        <textarea
                                            id="description"
                                            placeholder="Nhập mô tả chi tiết"
                                            name="description"
                                            value={sizeData.description}
                                            onChange={handleTextareaChange}
                                            required
                                            rows={4}
                                            disabled={isSubmitting}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    {formError && (
                                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                                            {formError}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4">
                                    <p className="text-gray-600">Đang khởi tạo form...</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="px-6 py-4 border-t">
                            <Button
                                color="danger"
                                variant="light"
                                onPress={handleClose}
                                isDisabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                color="success"
                                onPress={handleUpdateSubmit}
                                isDisabled={!isFormReady || isSubmitting}
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
