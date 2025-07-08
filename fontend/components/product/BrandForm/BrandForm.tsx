"use client";

import { Button, addToast } from "@heroui/react";
import { Input } from "@heroui/input";
import { CldUploadButton, CldImage } from 'next-cloudinary';
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

// Interface cho resource từ Cloudinary
interface CloudinaryResource {
    public_id: string;
    [key: string]: unknown;
}

// Interface cho upload result
interface UploadResult {
    event: string;
    info: CloudinaryResource;
}

export interface Brand {
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
}

interface BrandFormProps {
    onSuccess?: () => void; // Callback khi tạo thành công
    onCancel?: () => void;  // Callback khi hủy
}

const createBrand = async (data: Brand, token: string) => {
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
        } catch {
            errorBody = response.statusText;
        }
        console.error("Lỗi API:", response.status, errorBody);
        throw new Error(`Không thể tạo brand: ${errorBody} (Status: ${response.status})`);
    }

    return await response.json();
};

export default function BrandForm({ onSuccess }: BrandFormProps) {
    const { data: session, status } = useSession();
    const [resource, setResource] = useState<CloudinaryResource | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");
    const [brandInfo, setBrandInfo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUploadSuccess = (result: UploadResult) => {
        if (result.event === "success" && result.info) {
            console.log("Upload thành công:", result.info);
            setResource(result.info);
            setFormError(null);
            addToast({
                title: "Upload thành công",
                description: "Logo đã được tải lên thành công!",
                color: "success",
            });
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
            setFormError("Vui lòng nhập tên Brand.");
            return false;
        }
        if (!brandInfo.trim()) {
            setFormError("Vui lòng nhập thông tin Brand.");
            return false;
        }
        if (!resource) {
            setFormError("Vui lòng tải lên logo Brand.");
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

        if (status !== 'authenticated' || !session) {
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

            // Tạo brand data
            const brandData: Brand = {
                brandName: brandName.trim(),
                logoPublicId: resource!.public_id,
                brandInfo: brandInfo.trim()
            };

            // Gọi API để tạo brand
            await createBrand(brandData, token);

            addToast({
                title: "Thành công",
                description: "Thêm thương hiệu thành công!",
                color: "success",
            });

            // Reset form
            setBrandName("");
            setBrandInfo("");
            setResource(null);
            setFormError(null);

            // Gọi callback success
            if (onSuccess) {
                onSuccess();
            }

        } catch (err: unknown) {
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

    const handleReset = () => {
        setBrandName("");
        setBrandInfo("");
        setResource(null);
        setFormError(null);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Tên Brand"
                    placeholder="Nhập tên Brand"
                    type="text"
                    value={brandName}
                    onChange={(e) => {
                        setBrandName(e.target.value);
                        setFormError(null);
                    }}
                    isRequired
                    variant="bordered"
                />

                <Input
                    label="Thông tin Brand"
                    placeholder="Nhập thông tin chi tiết về Brand"
                    type="text"
                    value={brandInfo}
                    onChange={(e) => {
                        setBrandInfo(e.target.value);
                        setFormError(null);
                    }}
                    isRequired
                    variant="bordered"
                />

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                        Logo Brand <span className="text-danger-500">*</span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                        <CldUploadButton
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm font-medium"
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                            onSuccess={(result) => {
                                handleUploadSuccess(result as UploadResult);
                            }}
                            onError={(error) => {
                                console.error("Lỗi Cloudinary Upload:", error);
                                const uploadError = "Upload ảnh thất bại. Vui lòng thử lại.";
                                setFormError(uploadError);
                                addToast({
                                    title: "Lỗi Upload",
                                    description: uploadError,
                                    color: "danger"
                                });
                            }}
                        >
                            {resource ? "🔄 Thay đổi logo" : "📤 Chọn logo"}
                        </CldUploadButton>

                        {resource && (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-xs text-gray-600">Logo hiện tại:</p>
                                <CldImage
                                    width={100}
                                    height={100}
                                    src={resource.public_id}
                                    alt={`Logo ${brandName || 'Brand'}`}
                                    sizes="100px"
                                    className="object-cover border rounded-lg shadow-sm"
                                />
                            </div>
                        )}
                    </div>
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
                        {isSubmitting ? "Đang tạo..." : "Tạo Brand"}
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