"use client";

import { Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState } from "react";
import { useSession } from "next-auth/react";

export interface Material {
    name: string;
    description: string;
}

interface MaterialFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Hàm tạo mới Material (đổi đường dẫn API, tên biến...)
const createMaterial = async (data: Material, token: string | undefined) => {
    if (!token) {
        console.error("Lỗi: Không tìm thấy token xác thực.");
        throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    }

    try {
        const response = await fetch("http://localhost:8080/api/materials", { // đổi endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            let errorBody = "Lỗi không xác định từ máy chủ.";
            try {
                const errorData = await response.json();
                errorBody = errorData.message || errorData.error || JSON.stringify(errorData);
            } catch (e) {
                errorBody = response.statusText;
            }
            console.error("Lỗi API:", response.status, errorBody);
            throw new Error(`Không thể tạo Material: ${errorBody} (Status: ${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi gọi API tạo material:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function MaterialForm({ onSuccess, onCancel }: MaterialFormProps) {
    const { data: session, status } = useSession();
    const [formError, setFormError] = useState<string | null>(null);
    const [materialName, setMaterialName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        if (!materialName.trim()) {
            setFormError("Vui lòng nhập tên Material.");
            return false;
        }
        if (!description.trim()) {
            setFormError("Vui lòng nhập mô tả Material.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        if (!validateForm() || isSubmitting) {
            return;
        }

        if (status !== 'authenticated') {
            setFormError("Bạn cần đăng nhập để thực hiện hành động này.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = session?.accessToken;
            if (!token) {
                throw new Error("Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
            }

            const response = await createMaterial(
                {
                    name: materialName.trim(),
                    description: description.trim()
                },
                token
            );

            addToast({
                title: "Thành công",
                description: "Thêm Material thành công!",
                color: "success",
            });

            setMaterialName("");
            setDescription("");
            setFormError(null);

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Material. Đã xảy ra lỗi không mong muốn.";
            console.error("Lỗi khi submit:", err);
            setFormError(errorMessage);
            addToast({
                title: "Lỗi",
                description: `Có lỗi xảy ra: ${errorMessage}`,
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setMaterialName("");
        setDescription("");
        setFormError(null);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tên Material"
                    placeholder="Nhập tên Material"
                    type="text"
                    value={materialName}
                    onChange={(e) => {
                        setMaterialName(e.target.value);
                        setFormError(null);
                    }}
                    isRequired
                    variant="bordered"
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Mô tả Material <span className="text-danger-500">*</span>
                    </label>
                    <textarea
                        placeholder="Nhập mô tả chi tiết về Material"
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setFormError(null);
                        }}
                        required
                        rows={4}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
                    />
                </div>

                {formError && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-700 px-3 py-2 rounded-lg text-sm">
                        {formError}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        variant="bordered"
                        color="default"
                        onClick={handleReset}
                        className="flex-1"
                        isDisabled={isSubmitting}
                    >
                        Xóa form
                    </Button>
                    <Button
                        color="primary"
                        type="submit"
                        isDisabled={isSubmitting || status !== 'authenticated'}
                        className="flex-1"
                        isLoading={isSubmitting}
                    >
                        {isSubmitting ? "Đang tạo..." : "Tạo Material"}
                    </Button>
                </div>

                {status !== 'authenticated' && (
                    <div className="bg-warning-50 border border-warning-200 text-warning-700 px-3 py-2 rounded-lg text-sm text-center">
                        Bạn cần đăng nhập để thực hiện hành động này.
                    </div>
                )}
            </form>
        </div>
    );
}
