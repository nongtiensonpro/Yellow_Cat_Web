"use client"
import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image, addToast, Button } from "@heroui/react";
import { Input } from "@heroui/input";
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState } from "react";
import keycloak from '@/keycloak/keycloak';
import { useRouter } from "next/navigation"; // Sử dụng useRouter từ next/navigation

export interface Brand {
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
}

const createBrand = async (data: Brand) => {
    try {
        const token = keycloak.token;

        const response = await fetch("http://localhost:8080/api/brands", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error("Failed to create brand");
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating brand:", error);
        throw error;
    }
};

export default function Page() {
    const router = useRouter(); // Khởi tạo router
    const [resource, setResource] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");
    const [brandInfo, setBrandInfo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // Thêm state để kiểm soát trạng thái submit

    const handleUpload = (result: any) => {
        if (result.event === "success") {
            console.log("Upload thành công:", result.info);
            setResource(result.info);
            setError(null);
        } else {
            setError("Có lỗi xảy ra trong quá trình upload");
            console.error("Lỗi upload:", result);
        }
    };

    const handleSubmit = async () => {
        // Kiểm tra dữ liệu đầu vào
        if (!brandName.trim()) {
            setError("Vui lòng nhập tên Brand");
            addToast({
                title: "Lỗi",
                description: "Vui lòng nhập tên Brand",
                color: "danger",
            });
            return;
        }

        if (!brandInfo.trim()) {
            setError("Vui lòng nhập thông tin Brand");
            addToast({
                title: "Lỗi",
                description: "Vui lòng nhập thông tin Brand",
                color: "danger",
            });
            return;
        }

        if (!resource) {
            setError("Vui lòng tải lên logo Brand");
            addToast({
                title: "Lỗi",
                description: "Vui lòng tải lên logo Brand",
                color: "danger",
            });
            return;
        }

        // Ngăn chặn submit nhiều lần
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await createBrand({
                brandName: brandName.trim(),
                brandInfo: brandInfo.trim(),
                logoPublicId: resource.public_id
            });

            // Hiển thị toast thành công
            addToast({
                title: "Thành công",
                description: "Thêm thương hiệu thành công!",
                color: "success",
            });

            // Delay chuyển trang để người dùng nhìn thấy thông báo
            setTimeout(() => {
                router.push("/admin/product_management/brands");
            }, 1500);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tạo Brand";
            setError(errorMessage);
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
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-md">Thêm mới Brand</p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <Input
                        label="Tên Brand"
                        placeholder="Vui lòng nhập tên Brand"
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        isRequired
                    />
                </div>
                <Divider />
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <Input
                        label="Thông tin Brand"
                        placeholder="Vui lòng nhập thông tin Brand"
                        type="text"
                        value={brandInfo}
                        onChange={(e) => setBrandInfo(e.target.value)}
                        isRequired
                    />
                </div>
                <Divider />
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4 p-5">
                    <div className="w-full">
                        <p className="mb-2">Logo Brand <span className="text-red-500">*</span></p>
                        <Button
                            color="primary"
                            className="mb-4"
                        >
                            <CldUploadButton
                                uploadPreset="YellowCatWeb"
                                onSuccess={(result, {widget}) => {
                                    handleUpload(result);
                                    widget.close();
                                }}
                            >
                                Chọn ảnh để upload
                            </CldUploadButton>
                        </Button>

                        {error && (
                            <p className="text-red-500 my-2">{error}</p>
                        )}

                        {resource && (
                            <div className="mt-4">
                                <p className="mb-2">Ảnh đã được upload:</p>
                                <CldImage
                                    width={150}
                                    height={150}
                                    src={resource.public_id}
                                    alt="Ảnh đã upload"
                                    sizes="150px"
                                    className="object-cover border rounded-md"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <Divider />
                <div className="p-5">
                    <Button
                        color="success"
                        className="mt-4"
                        onClick={handleSubmit}
                        isDisabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Tạo Brand"}
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}