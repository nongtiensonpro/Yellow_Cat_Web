"use client";

import { Card, CardHeader, CardBody, Divider, Button, addToast, Spinner } from "@heroui/react";
import { Input } from "@heroui/input";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardFooter } from "@heroui/card";
import { useSession } from "next-auth/react";

export interface Attributes {
    attributeName: string;
    dataType: string;
}

const createAttributes = async (data: Attributes, token: string | undefined) => {
    if (!token) {
        console.error("Lỗi: Không tìm thấy token xác thực.");
        throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    }

    try {
        const response = await fetch("http://localhost:8080/api/attributes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            let errorBody ;
            try {
                const errorData = await response.json();
                errorBody = errorData.message || errorData.error || JSON.stringify(errorData);
            } catch (e) {
                errorBody = response.statusText;
            }
            console.error("Lỗi API:", response.status, errorBody);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi gọi API tạo Attributes:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function CreateAttributesPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [ setResource] = useState<any>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [attributeName, setattributeName] = useState("");
    const [dataType, setdataType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Kiểm tra trạng thái xác thực khi component được tải
    useEffect(() => {
        if (status === 'unauthenticated') {
            console.warn("Người dùng chưa đăng nhập.");
            addToast({
                title: "Cần đăng nhập",
                description: "Vui lòng đăng nhập để tiếp tục.",
                color: "danger"
            });
            router.push('/login');
        }
    }, [status, router]);

    const validateForm = (): boolean => {
        if (!attributeName.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Attributes.", color: "warning" });
            return false;
        }
        if (!dataType.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập thông tin loại dữ liệu Attributes.", color: "warning" });
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

        if (!session?.accessToken) {
            addToast({
                title: "Lỗi xác thực",
                description: "Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
                color: "danger"
            });
            router.push('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            await createAttributes(
                {
                    attributeName: attributeName.trim(),
                    dataType: dataType.trim(),
                },
                session.accessToken
            );
            addToast({
                title: "Thành công",
                description: "Thêm Attributes thành công!",
                color: "success",
            });

            setattributeName("");
            setdataType("");
            setResource(null);
            setFormError(null);
            setTimeout(() => {
                router.push("/admin/product_management/attributes");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Attributes. Đã xảy ra lỗi không mong muốn.";
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

    // Hiển thị trạng thái loading khi đang xác thực
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang xác thực..." size="lg" />
            </div>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-semibold">Thêm mới Attributes</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên Attributes"
                        placeholder="Nhập tên Attributes"
                        type="text"
                        value={attributeName}
                        onChange={(e) => { setattributeName(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
                        isRequired
                    />

                    <Input
                        label="Thông tin Attributes"
                        placeholder="Nhập thông tin chi tiết về Attributes"
                        type="text"
                        value={dataType}
                        onChange={(e) => { setdataType(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
                        isRequired
                    />

                    {formError && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md">
                            {formError}
                        </p>
                    )}
                </CardBody>
                <Divider />
                <CardFooter className="p-5 flex justify-end">
                    <Button
                        color="success"
                        type="submit"
                        isDisabled={isSubmitting || status !== 'authenticated'}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Tạo Attributes"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}