"use client";

import { Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState } from "react";
import { useSession } from "next-auth/react";

export interface Size {
    name: string;
    description: string;
}

interface SizeFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const createSize = async (data: Size, token: string | undefined) => {
    if (!token) throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    try {
        const response = await fetch("http://localhost:8080/api/sizes", {
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
            } catch (e) { errorBody = response.statusText; }
            throw new Error(`Không thể tạo Kích cỡ: ${errorBody} (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function SizeForm({ onSuccess, onCancel }: SizeFormProps) {
    const { data: session, status } = useSession();
    const [formError, setFormError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        if (!name.trim()) {
            setFormError("Vui lòng nhập tên Kích cỡ.");
            return false;
        }
        if (!description.trim()) {
            setFormError("Vui lòng nhập mô tả Kích cỡ.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        if (!validateForm() || isSubmitting) return;
        if (status !== "authenticated") {
            setFormError("Bạn cần đăng nhập để thực hiện hành động này.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = session?.accessToken;
            await createSize(
                { name: name.trim(), description: description.trim() },
                token
            );
            addToast({
                title: "Thành công",
                description: "Thêm Kích cỡ thành công!",
                color: "success",
            });
            setName("");
            setDescription("");
            setFormError(null);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Kích cỡ. Đã xảy ra lỗi không mong muốn.";
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
        setName("");
        setDescription("");
        setFormError(null);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tên Kích cỡ"
                    placeholder="Nhập tên Kích cỡ"
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setFormError(null); }}
                    isRequired
                    variant="bordered"
                />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Mô tả Kích cỡ <span className="text-danger-500">*</span>
                    </label>
                    <textarea
                        placeholder="Nhập mô tả chi tiết về Kích cỡ"
                        value={description}
                        onChange={e => { setDescription(e.target.value); setFormError(null); }}
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
                        isDisabled={isSubmitting || status !== "authenticated"}
                        className="flex-1"
                        isLoading={isSubmitting}
                    >
                        {isSubmitting ? "Đang tạo..." : "Tạo Kích cỡ"}
                    </Button>
                </div>
                {status !== "authenticated" && (
                    <div className="bg-warning-50 border border-warning-200 text-warning-700 px-3 py-2 rounded-lg text-sm text-center">
                        Bạn cần đăng nhập để thực hiện hành động này.
                    </div>
                )}
            </form>
        </div>
    );
}
