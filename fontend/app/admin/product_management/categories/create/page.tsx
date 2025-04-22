"use client";

import { Card, CardHeader, CardBody, Divider, Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardFooter } from "@heroui/card";
import { useSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export interface Categories {
    name: string;
}

const createCategory = async (data: Categories, token: string) => {
    if (!token) {
        console.error("Lỗi: Không tìm thấy token xác thực.");
        throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
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
            throw new Error(`Không thể tạo categories: ${errorBody} (Status: ${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi gọi API tạo category:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function CreateCategoryPage() {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sử dụng NextAuth session để lấy token
    const { data: session, status } = useSession();
    const authToken = session?.accessToken;
    const isAuthenticated = status === "authenticated" && !!authToken;
    const isAuthLoading = status === "loading";

    // Kiểm tra xác thực khi component được tải
    useEffect(() => {
        if (status === "unauthenticated") {
            console.warn("Người dùng chưa đăng nhập khi vào trang tạo Category.");
            addToast({ 
                title: "Yêu cầu đăng nhập", 
                description: "Vui lòng đăng nhập để tiếp tục.", 
                color: "warning" 
            });
            router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
        }
    }, [status, router]);

    const validateForm = (): boolean => {
        if (!categoryName.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Categories.", color: "warning" });
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

        if (!authToken) {
            addToast({ 
                title: "Lỗi xác thực", 
                description: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.", 
                color: "danger" 
            });
            router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await createCategory(
                {
                    name: categoryName.trim()
                },
                authToken
            );

            addToast({
                title: "Thành công",
                description: "Thêm category thành công!",
                color: "success",
            });

            setCategoryName("");
            setFormError(null);
            setTimeout(() => {
                router.push("/admin/product_management/categories");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Category. Đã xảy ra lỗi không mong muốn.";
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

    // Hiển thị loading khi đang kiểm tra xác thực
    if (isAuthLoading) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardBody className="flex justify-center items-center p-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Đang kiểm tra thông tin xác thực...</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-semibold">Thêm mới Categories</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên Category"
                        placeholder="Nhập tên Categories"
                        type="text"
                        value={categoryName}
                        onChange={(e) => { setCategoryName(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
                        isRequired
                    />

                    {formError && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                            {formError}
                        </p>
                    )}

                </CardBody>
                <Divider />
                <CardFooter className="p-5 flex justify-end">
                    <Button
                        color="success"
                        type="submit"
                        isDisabled={isSubmitting || !isAuthenticated}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Tạo Categories"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}