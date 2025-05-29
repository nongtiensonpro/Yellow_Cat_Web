"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    addToast,
    Spinner
} from "@heroui/react";
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { useState, useEffect } from "react";
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

interface EditBrandModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    brandId: string | number;
    onSuccess?: () => void;
}

const fetchBrandById = async (id: string | number, token: string | undefined): Promise<ApiResponse<Brand>> => {
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

const updateBrand = async (id: string | number, data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>, token: string | undefined): Promise<any> => {
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

export default function EditBrandModal({ isOpen, onOpenChange, brandId, onSuccess }: EditBrandModalProps) {
    const { data: session } = useSession();
    const [brandData, setBrandData] = useState<Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'>>({
        brandName: '',
        brandInfo: '',
        logoPublicId: ''
    });
    const [initialLogoId, setInitialLogoId] = useState<string | null>(null);
    const [resource, setResource] = useState<any>(null); // Logo mới
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

    // Lấy token từ session của NextAuth
    const authToken = session?.accessToken;

    // Reset form khi modal đóng
    useEffect(() => {
        if (!isOpen) {
            setBrandData({
                brandName: '',
                brandInfo: '',
                logoPublicId: ''
            });
            setInitialLogoId(null);
            setResource(null);
            setFormError(null);
            setIsSubmitting(false);
            setDataLoaded(false); // Reset data loaded state
        }
    }, [isOpen]);

    // Fetch brand data khi modal mở
    useEffect(() => {
        if (isOpen && brandId && authToken && !dataLoaded) { // Only fetch if not already loaded
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
                    setDataLoaded(true); // Mark as loaded
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu Brand.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, brandId, authToken, dataLoaded]);

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
            setFormError("Vui lòng nhập tên Brand.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Brand.", color: "warning" });
            return false;
        }
        if (!brandData.brandInfo.trim()) {
            setFormError("Vui lòng nhập thông tin Brand.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập thông tin Brand.", color: "warning" });
            return false;
        }
        if (!brandData.logoPublicId) {
            setFormError("Logo không được để trống.");
            addToast({ title: "Thiếu thông tin", description: "Logo không được để trống (có thể dùng logo cũ).", color: "warning" });
            return false;
        }
        return true;
    };

    const handleUpdateSubmit = async () => {
        setFormError(null);

        if (!authToken) {
            const authError = "Phiên đăng nhập hết hạn.";
            setFormError(authError);
            addToast({ title: "Lỗi", description: authError, color: "danger" });
            return;
        }

        if (!validateForm() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const dataToUpdate: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'productIds'> = {
            brandName: brandData.brandName.trim(),
            brandInfo: brandData.brandInfo.trim(),
            logoPublicId: brandData.logoPublicId
        };

        try {
            console.log("Starting update process...", dataToUpdate);
            await updateBrand(brandId, dataToUpdate, authToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật thương hiệu thành công!",
                color: "success",
            });

            // Gọi callback onSuccess nếu có
            if (onSuccess) {
                onSuccess();
            }

            // Đóng modal
            onOpenChange(false);

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

    const handleClose = () => {
        if (!isSubmitting) {
            onOpenChange(false);
        }
    };

    // Prevent form submission when not ready
    const isFormReady = dataLoaded && !loading && authToken;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="3xl"
            scrollBehavior="inside"
            placement="center"
            className="max-w-[95vw] max-h-[90vh]"
            isDismissable={!isSubmitting}
            isKeyboardDismissDisabled={isSubmitting}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b">
                            <h2 className="text-xl font-semibold">Chỉnh sửa thương hiệu (ID: {brandId})</h2>
                            <p className="text-sm text-gray-600">Cập nhật thông tin thương hiệu</p>
                        </ModalHeader>
                        <ModalBody className="px-6 py-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner label="Đang tải dữ liệu Brand..." size="lg" />
                                </div>
                            ) : formError && !dataLoaded ? (
                                <div className="py-4">
                                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Brand.
                                    </p>
                                </div>
                            ) : dataLoaded ? (
                                <div className="space-y-6">
                                    <Input
                                        label="Tên Brand"
                                        placeholder="Nhập tên Brand"
                                        type="text"
                                        name="brandName"
                                        value={brandData.brandName}
                                        onChange={handleInputChange}
                                        isRequired
                                        variant="bordered"
                                        isDisabled={isSubmitting}
                                    />

                                    <Input
                                        label="Thông tin Brand"
                                        placeholder="Nhập thông tin chi tiết"
                                        type="text"
                                        name="brandInfo"
                                        value={brandData.brandInfo}
                                        onChange={handleInputChange}
                                        isRequired
                                        variant="bordered"
                                        isDisabled={isSubmitting}
                                    />

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">Logo Brand (Thay đổi nếu muốn)</p>
                                        <CldUploadButton
                                            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mb-4 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                            onSuccess={(result, { widget }) => {
                                                handleUploadSuccess(result);
                                                widget.close();
                                            }}
                                            onError={(error) => {
                                                console.error("Lỗi Cloudinary Upload:", error);
                                                const uploadError = "Upload ảnh thất bại.";
                                                setFormError(uploadError);
                                                addToast({ title: "Lỗi Upload", description: uploadError, color: "danger"});
                                            }}
                                            // disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Đang xử lý..." : "Chọn ảnh mới để upload"}
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
                                </div>
                            ) : (
                                <div className="py-4">
                                    <p className="text-gray-600">Đang khởi tạo form...</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className="px-6 py-4 border-t">
                            <Button
                                color="danger"
                                variant="light"
                                onPress={handleClose}
                                isDisabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                color="success"
                                onPress={handleUpdateSubmit}
                                isDisabled={!isFormReady || isSubmitting}
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}