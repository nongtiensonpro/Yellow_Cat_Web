"use client";

import { Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState } from "react";
import { useSession } from "next-auth/react";

// Extend Session type để có accessToken
interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export interface Color {
    name: string;
    description: string;
}

interface ColorsFormProps {
    onSuccess?: () => void;
}

const createColor = async (data: Color, token: string) => {
    const response = await fetch("http://localhost:8080/api/colors", {
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
        } catch { 
            errorBody = response.statusText; 
        }
        throw new Error(`Không thể tạo Màu: ${errorBody} (Status: ${response.status})`);
    }
    return await response.json();
};

export default function ColorsForm({ onSuccess }: ColorsFormProps) {
    const { data: session, status } = useSession();
    const [formError, setFormError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        if (!name.trim()) {
            setFormError("Vui lòng nhập tên Màu.");
            return false;
        }
        if (!description.trim()) {
            setFormError("Vui lòng nhập mô tả Màu.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        if (!validateForm() || isSubmitting) return;
        if (status !== "authenticated" || !session) {
            setFormError("Bạn cần đăng nhập để thực hiện hành động này.");
            return;
        }
        setIsSubmitting(true);
        try {
            const extendedSession = session as unknown as ExtendedSession;
            const token = extendedSession.accessToken;
            if (!token) {
                throw new Error("Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
            }
            await createColor(
                { name: name.trim(), description: description.trim() },
                token
            );
            addToast({
                title: "Thành công",
                description: "Thêm Màu thành công!",
                color: "success",
            });
            setName("");
            setDescription("");
            setFormError(null);
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Màu. Đã xảy ra lỗi không mong muốn.";
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
                    label="Tên Màu"
                    placeholder="Nhập tên Màu"
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setFormError(null); }}
                    isRequired
                    variant="bordered"
                />
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Mô tả Màu <span className="text-danger-500">*</span>
                    </label>
                    <textarea
                        placeholder="Nhập mô tả chi tiết về Màu"
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
                        {isSubmitting ? "Đang tạo..." : "Tạo Màu"}
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
