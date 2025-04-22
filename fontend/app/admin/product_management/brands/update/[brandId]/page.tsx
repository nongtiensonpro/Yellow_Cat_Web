"use client";

import { Card, CardHeader, CardBody, Divider, Button, addToast, Spinner } from "@heroui/react";
import { Input } from "@heroui/input";
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CardFooter } from "@heroui/card";
import { useSession } from "next-auth/react";

export interface Brand {
    id: number | string;
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    productIds?: any[];
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

const fetchBrandById = async (id: string | string[] | undefined, token: string | undefined): Promise<ApiResponse<Brand>> => {
    if (!id || Array.isArray(id)) {
        throw new Error("Brand ID không hợp lệ.");
    }
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        const response = await fetch(`http://localhost:8080/api/brands/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Brand.");
            const errorData = await response.json().catch(() => ({ message: `Lỗi không xác định (Status: ${response.status})` }));
            throw new Error(errorData.message || `Failed to fetch brand (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching brand by ID:", error);
        throw error;
    }
};

const updateBrand = async (id: string | string[] | undefined, data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>, token: string | undefined): Promise<any> => {
    if (!id || Array.isArray(id)) {
        throw new Error("Brand ID không hợp lệ.");
    }
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        console.log("Sending update data:", JSON.stringify(data));
        const response = await fetch(`http://localhost:8080/api/brands/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
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
        console.error("Error updating brand:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi cập nhật.");
    }
};

export default function UpdateBrandPage() {
    const router = useRouter();
    const params = useParams();
    const brandId = params.brandId;
    const { data: session, status } = useSession();
    const [brandData, setBrandData] = useState<Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>>({
        brandName: '',
        brandInfo: '',
        logoPublicId: ''
    });
    const [initialLogoId, setInitialLogoId] = useState<string | null>(null);
    const [resource, setResource] = useState<any>(null); // Logo mới
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Lấy token từ session của NextAuth
    const authToken = session?.accessToken;

    useEffect(() => {
        if (status === 'unauthenticated') {
            console.warn("Người dùng chưa đăng nhập.");
            addToast({ title: "Lỗi", description: "Bạn cần đăng nhập.", color: "danger" });
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (brandId && authToken) {
            setLoading(true);
            setFormError(null);
            console.log(`Fetching data for brand ID: ${brandId}`);
            fetchBrandById(brandId, authToken)
                .then(response => {
                    const fetchedBrand = response.data;
                    console.log("Fetched brand data:", fetchedBrand);

                    if (!fetchedBrand) {
                        throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    }

                    setBrandData({
                        brandName: fetchedBrand.brandName || '',
                        brandInfo: fetchedBrand.brandInfo || '',
                        logoPublicId: fetchedBrand.logoPublicId || ''
                    });
                    setInitialLogoId(fetchedBrand.logoPublicId || null);
                    console.log('State updated:', {
                        brandName: fetchedBrand.brandName,
                        brandInfo: fetchedBrand.brandInfo,
                        logoPublicId: fetchedBrand.logoPublicId,
                        initialLogoId: fetchedBrand.logoPublicId
                    });
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu Brand.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => {
                    setLoading(false);
                    console.log("Loading finished.");
                });
        } else {
            if (!brandId) console.log("Brand ID is missing.");
            if (!authToken) console.log("Auth token is missing.");
            setLoading(false);
        }
    }, [brandId, authToken]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBrandData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleUploadSuccess = (result: any) => {
        if (result.event === "success" && result.info) {
            console.log("Upload mới thành công:", result.info);
            setResource(result.info);
            setBrandData(prev => ({ ...prev, logoPublicId: result.info.public_id }));
            setFormError(null);
        } else {
            console.error("Lỗi upload:", result);
            const uploadError = "Có lỗi xảy ra trong quá trình upload ảnh.";
            setFormError(uploadError);
            addToast({ title: "Lỗi Upload", description: uploadError, color: "danger"});
        }
    };

    const validateForm = (): boolean => {
        if (!brandData.brandName.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Brand.", color: "warning" });
            return false;
        }
        if (!brandData.brandInfo.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập thông tin Brand.", color: "warning" });
            return false;
        }
        if (!brandData.logoPublicId) {
            addToast({ title: "Thiếu thông tin", description: "Logo không được để trống (có thể dùng logo cũ).", color: "warning" });
            return false;
        }
        return true;
    };

    const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        if (!validateForm() || isSubmitting || !authToken) {
            if (!authToken) addToast({ title: "Lỗi", description: "Phiên đăng nhập hết hạn.", color: "danger" });
            return;
        }

        setIsSubmitting(true);

        const dataToUpdate: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'> = {
            brandName: brandData.brandName.trim(),
            brandInfo: brandData.brandInfo.trim(),
            logoPublicId: brandData.logoPublicId
        };

        try {
            await updateBrand(brandId, dataToUpdate, authToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật thương hiệu thành công!",
                color: "success",
            });

            setTimeout(() => {
                router.push("/admin/product_management/brands");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật Brand.";
            console.error("Lỗi khi submit update:", err);
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

    // ----- JSX Rendering -----

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải dữ liệu Brand..." size="lg" />
            </div>
        );
    }

    if (formError && !initialLogoId && !loading) {
        return (
            <Card className="w-full max-w-2xl mx-auto my-10">
                <CardHeader><p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p></CardHeader>
                <Divider />
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Brand.
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }
   return (
        <Card className="w-full max-w-2xl mx-auto my-10">
            <form onSubmit={handleUpdateSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-semibold">Cập nhật Brand (ID: {brandId})</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên Brand"
                        placeholder="Nhập tên Brand"
                        type="text"
                        name="brandName"
                        value={brandData.brandName}
                        onChange={handleInputChange}
                        isRequired
                    />

                    <Input
                        label="Thông tin Brand"
                        placeholder="Nhập thông tin chi tiết"
                        type="text"
                        name="brandInfo"
                        value={brandData.brandInfo}
                        onChange={handleInputChange}
                        isRequired
                    />

                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Logo Brand (Thay đổi nếu muốn)</p>
                        <CldUploadButton
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mb-4"
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                            onSuccess={(result, { widget }) => {
                                handleUploadSuccess(result);
                                widget.close();
                            }}
                            onError={(error) => {
                                console.error("Lỗi Cloudinary Upload:", error);
                                addToast({ title: "Lỗi Upload", description: "Upload ảnh thất bại.", color: "danger"});
                            }}
                        >
                            Chọn ảnh mới để upload
                        </CldUploadButton>

                        {/* Display Image */}
                        <div className="mt-4">
                            <p className="mb-2 text-sm text-gray-600">
                                {resource ? "Ảnh mới xem trước:" : "Ảnh hiện tại:"}
                            </p>
                            {(resource || brandData.logoPublicId) ? (
                                <CldImage
                                    width={150}
                                    height={150}
                                    src={resource ? resource.public_id : brandData.logoPublicId}
                                    alt={`Logo ${brandData.brandName || 'Brand'}`}
                                    sizes="150px"
                                    className="object-cover border rounded-md shadow-sm"
                                />
                            ) : (
                                <p className="text-gray-500 italic">Chưa có logo.</p>
                            )}
                        </div>
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
                        {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}