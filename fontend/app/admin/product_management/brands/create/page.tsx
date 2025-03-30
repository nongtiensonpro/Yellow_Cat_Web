"use client";

import { Card, CardHeader, CardBody, Divider,  Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState, useEffect } from "react";
import keycloak from '@/keycloak/keycloak';
import { useRouter } from "next/navigation";
import {CardFooter} from "@heroui/card";

export interface Brand {
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
}

const createBrand = async (data: Brand, token: string | undefined) => {
    if (!token) {
        console.error("Lỗi: Không tìm thấy token Keycloak.");
        throw new Error("Yêu cầu chưa được xác thực. Vui lòng đăng nhập lại.");
    }

    try {
        const response = await fetch("http://localhost:8080/api/brands", {
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
            throw new Error(`Không thể tạo brand: ${errorBody} (Status: ${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi khi gọi API tạo brand:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc hệ thống.");
    }
};

export default function CreateBrandPage() {
    const router = useRouter();
    const [resource, setResource] = useState<any>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");
    const [brandInfo, setBrandInfo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authToken, setAuthToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (keycloak.authenticated) {
            setAuthToken(keycloak.token);
        } else {
            console.warn("Keycloak chưa được xác thực khi vào trang tạo Brand.");
        }
    }, [router]);

    const handleUploadSuccess = (result: any) => {
        if (result.event === "success" && result.info) {
            console.log("Upload thành công:", result.info);
            setResource(result.info);
            setFormError(null);
        } else {
            console.error("Lỗi upload:", result);
            const uploadError = "Có lỗi xảy ra trong quá trình upload ảnh.";
            setFormError(uploadError);
            addToast({
                title: "Lỗi Upload",
                description: uploadError,
                color: "danger",
            });
        }
    };

    const validateForm = (): boolean => {
        if (!brandName.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Brand.", color: "warning" });
            return false;
        }
        if (!brandInfo.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập thông tin Brand.", color: "warning" });
            return false;
        }
        if (!resource) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng tải lên logo Brand.", color: "warning" });
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
                    brandName: brandName.trim(),
                    brandInfo: brandInfo.trim(),
                    logoPublicId: resource.public_id
                },
                currentToken
            );

            addToast({
                title: "Thành công",
                description: "Thêm thương hiệu thành công!",
                color: "success",
            });

            setBrandName("");
            setBrandInfo("");
            setResource(null);
            setFormError(null);
            setTimeout(() => {
                router.push("/admin/product_management/brands");
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
                        <p className="text-lg font-semibold">Thêm mới Brand</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên Brand"
                        placeholder="Nhập tên Brand"
                        type="text"
                        value={brandName}
                        onChange={(e) => { setBrandName(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
                        isRequired
                    />

                    <Input
                        label="Thông tin Brand"
                        placeholder="Nhập thông tin chi tiết về Brand"
                        type="text"
                        value={brandInfo}
                        onChange={(e) => { setBrandInfo(e.target.value); setFormError(null); }} // Xóa lỗi khi nhập
                        isRequired
                    />

                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Logo Brand <span className="text-red-500">*</span></p>
                        <CldUploadButton
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                            onSuccess={(result, { widget }) => {
                                handleUploadSuccess(result);
                                widget.close();
                            }}
                            onError={(error) => {
                                console.error("Lỗi Cloudinary Upload:", error);
                                const uploadError = "Upload ảnh thất bại. Vui lòng thử lại.";
                                setFormError(uploadError);
                                addToast({ title: "Lỗi Upload", description: uploadError, color: "danger"});
                            }}
                        >
                            Chọn ảnh để upload
                        </CldUploadButton>

                        {resource && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm text-gray-600">Ảnh xem trước:</p>
                                <CldImage
                                    width={150}
                                    height={150}
                                    src={resource.public_id}
                                    alt={`Logo ${brandName || 'Brand'}`}
                                    sizes="150px"
                                    className="object-cover border rounded-md shadow-sm"
                                />
                            </div>
                        )}
                    </div>
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
                        {isSubmitting ? "Đang xử lý..." : "Tạo Brand"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}