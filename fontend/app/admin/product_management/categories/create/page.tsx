"use client";

import { Card, CardHeader, CardBody, Divider,  Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState, useEffect } from "react";
import keycloak from '@/keycloak/keycloak';
import { useRouter } from "next/navigation";
import {CardFooter} from "@heroui/card";

export interface Categories {
    name: string;
}

const createBrand = async (data: Categories, token: string | undefined) => {
    if (!token) {
        console.error("Lỗi: Không tìm thấy token Keycloak.");
        throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    }

    try {
        const response = await fetch("http://localhost:8080/api/categories", {
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
        console.error("Lỗi khi gọi API tạo brand:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function CreateBrandPage() {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authToken, setAuthToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (keycloak.authenticated) {
            setAuthToken(keycloak.token);
        } else {
            console.warn("Keycloak chưa được xác thực khi vào trang tạo Brand.");
        }
    }, [router]);
    const validateForm = (): boolean => {
        if (!brandName.trim()) {
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

        setIsSubmitting(true);

        try {
            const currentToken = keycloak.token;
            if (!currentToken) {
                throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
            }

            const response = await createBrand(
                {
                    name: brandName.trim()
                },
                currentToken
            );

            addToast({
                title: "Thành công",
                description: "Thêm thương hiệu thành công!",
                color: "success",
            });

            setBrandName("");
            setFormError(null);
            setTimeout(() => {
                router.push("/admin/product_management/categories");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Brand. Đã xảy ra lỗi không mong muốn.";
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
                        label="Tên Brand"
                        placeholder="Nhập tên Categories"
                        type="text"
                        value={brandName}
                        onChange={(e) => { setBrandName(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
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
                        isDisabled={isSubmitting || !authToken}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Tạo Categories"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}