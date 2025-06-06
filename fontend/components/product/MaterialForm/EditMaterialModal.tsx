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

export interface Material {
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

interface EditMaterialModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    materialId: string | number;
    onSuccess?: () => void;
}

// Fetch material by ID
const fetchMaterialById = async (id: string | number, token: string | undefined): Promise<ApiResponse<Material>> => {
    if (!token) throw new Error("Chưa xác thực.");
    try {
        const response = await fetch(`http://localhost:8080/api/materials/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Material.");
            const errorData = await response.json().catch(() => ({ message: `Lỗi không xác định (Status: ${response.status})` }));
            throw new Error(errorData.message || `Failed to fetch material (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching material by ID:", error);
        throw error;
    }
};

// Update material
const updateMaterial = async (
    id: string | number,
    data: Omit<Material, "id" | "createdAt" | "updatedAt">,
    token: string | undefined
): Promise<any> => {
    if (!token) throw new Error("Chưa xác thực.");
    try {
        const nowISO = new Date().toISOString();
        // Gửi đủ các trường theo API, chỉ dùng name và description, id, createdAt, updatedAt
        const fullData = {
            id,
            ...data,
            createdAt: nowISO,
            updatedAt: nowISO,
        };
        const response = await fetch(`http://localhost:8080/api/materials/${id}`, {
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
            } catch (e) { /* Ignore parsing error */ }
            console.error("API Update Error:", response.status, errorBody);
            throw new Error(errorBody);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error updating material:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi cập nhật.");
    }
};

export default function EditMaterialModal({ isOpen, onOpenChange, materialId, onSuccess }: EditMaterialModalProps) {
    const { data: session } = useSession();
    const [materialData, setMaterialData] = useState<Omit<Material, "id" | "createdAt" | "updatedAt">>({
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
            setMaterialData({
                name: "",
                description: ""
            });
            setFormError(null);
            setIsSubmitting(false);
            setDataLoaded(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && materialId && authToken && !dataLoaded) {
            setLoading(true);
            setFormError(null);
            fetchMaterialById(materialId, authToken)
                .then(response => {
                    const fetchedMaterial = response.data;
                    if (!fetchedMaterial) throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    setMaterialData({
                        name: fetchedMaterial.name || "",
                        description: fetchedMaterial.description || ""
                    });
                    setDataLoaded(true);
                })
                .catch(err => {
                    const errorMsg = err.message || "Không thể tải dữ liệu Material.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, materialId, authToken, dataLoaded]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMaterialData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMaterialData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const validateForm = (): boolean => {
        if (!materialData.name.trim()) {
            setFormError("Vui lòng nhập tên Material.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Material.", color: "warning" });
            return false;
        }
        if (!materialData.description.trim()) {
            setFormError("Vui lòng nhập mô tả Material.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập mô tả Material.", color: "warning" });
            return false;
        }
        return true;
    };

    const handleUpdateSubmit = async () => {
        setFormError(null);

        if (!authToken) {
            const authError = "Phiên đăng nhập hết hạn.";
            setFormError(authError);
            addToast({ title: "Lỗi", description: authError, color: "danger" });
            return;
        }

        if (!validateForm() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const dataToUpdate: Omit<Material, "id" | "createdAt" | "updatedAt"> = {
            name: materialData.name.trim(),
            description: materialData.description.trim()
        };

        try {
            await updateMaterial(materialId, dataToUpdate, authToken);
            addToast({
                title: "Thành công",
                description: "Cập nhật Material thành công!",
                color: "success",
            });

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật Material.";
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
        if (!isSubmitting) {
            onOpenChange(false);
        }
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
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b">
                            <h2 className="text-xl font-semibold">Chỉnh sửa Material (ID: {materialId})</h2>
                            <p className="text-sm text-gray-600">Cập nhật thông tin Material</p>
                        </ModalHeader>
                        <ModalBody className="px-6 py-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner label="Đang tải dữ liệu Material..." size="lg" />
                                </div>
                            ) : formError && !dataLoaded ? (
                                <div className="py-4">
                                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Material.
                                    </p>
                                </div>
                            ) : dataLoaded ? (
                                <div className="space-y-6">
                                    <Input
                                        label="Tên Material"
                                        placeholder="Nhập tên Material"
                                        type="text"
                                        name="name"
                                        value={materialData.name}
                                        onChange={handleInputChange}
                                        isRequired
                                        variant="bordered"
                                        isDisabled={isSubmitting}
                                    />

                                    <div>
                                        <label htmlFor="description" className="mb-2 text-sm font-medium text-gray-700 block">
                                            Mô tả Material
                                        </label>
                                        <textarea
                                            id="description"
                                            placeholder="Nhập mô tả chi tiết"
                                            name="description"
                                            value={materialData.description}
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
