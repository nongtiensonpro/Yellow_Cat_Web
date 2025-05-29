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
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Category {
    id: number | string;
    name: string;
    description: string;
    createdAt?: string | null;
    updatedAt?: string | null;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

interface EditCategoryModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    categoryId: string | number;
    onSuccess?: () => void;
}

const fetchCategoryById = async (id: string | number, token: string | undefined): Promise<ApiResponse<Category>> => {
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        const response = await fetch(`http://localhost:8080/api/categories/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Category.");
            const errorData = await response.json().catch(() => ({ message: `Lỗi không xác định (Status: ${response.status})` }));
            throw new Error(errorData.message || `Failed to fetch category (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching category by ID:", error);
        throw error;
    }
};

const updateCategory = async (id: string | number, data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, token: string | undefined): Promise<any> => {
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        console.log("Sending update data:", JSON.stringify(data));
        const response = await fetch(`http://localhost:8080/api/categories/${id}`, {
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
        console.error("Error updating category:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi cập nhật.");
    }
};

export default function EditCategoryModal({ isOpen, onOpenChange, categoryId, onSuccess }: EditCategoryModalProps) {
    const { data: session } = useSession();
    const [categoryData, setCategoryData] = useState<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

    // Lấy token từ session của NextAuth
    const authToken = session?.accessToken;

    // Reset form khi modal đóng
    useEffect(() => {
        if (!isOpen) {
            setCategoryData({
                name: '',
                description: ''
            });
            setFormError(null);
            setIsSubmitting(false);
            setDataLoaded(false); // Reset data loaded state
        }
    }, [isOpen]);

    // Fetch category data khi modal mở
    useEffect(() => {
        if (isOpen && categoryId && authToken && !dataLoaded) { // Only fetch if not already loaded
            setLoading(true);
            setFormError(null);
            console.log(`Fetching data for category ID: ${categoryId}`);
            fetchCategoryById(categoryId, authToken)
                .then(response => {
                    const fetchedCategory = response.data;
                    console.log("Fetched category data:", fetchedCategory);

                    if (!fetchedCategory) {
                        throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    }

                    setCategoryData({
                        name: fetchedCategory.name || '',
                        description: fetchedCategory.description || ''
                    });
                    setDataLoaded(true); // Mark as loaded
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu Category.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, categoryId, authToken, dataLoaded]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCategoryData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCategoryData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const validateForm = (): boolean => {
        if (!categoryData.name.trim()) {
            setFormError("Vui lòng nhập tên Category.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Category.", color: "warning" });
            return false;
        }
        if (!categoryData.description.trim()) {
            setFormError("Vui lòng nhập mô tả Category.");
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập mô tả Category.", color: "warning" });
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

        const dataToUpdate: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
            name: categoryData.name.trim(),
            description: categoryData.description.trim()
        };

        try {
            console.log("Starting update process...", dataToUpdate);
            await updateCategory(categoryId, dataToUpdate, authToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật danh mục thành công!",
                color: "success",
            });

            // Gọi callback onSuccess nếu có
            if (onSuccess) {
                onSuccess();
            }

            // Đóng modal
            onOpenChange(false);

        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật Category.";
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
                            <h2 className="text-xl font-semibold">Chỉnh sửa danh mục (ID: {categoryId})</h2>
                            <p className="text-sm text-gray-600">Cập nhật thông tin danh mục</p>
                        </ModalHeader>
                        <ModalBody className="px-6 py-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner label="Đang tải dữ liệu Category..." size="lg" />
                                </div>
                            ) : formError && !dataLoaded ? (
                                <div className="py-4">
                                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Category.
                                    </p>
                                </div>
                            ) : dataLoaded ? (
                                <div className="space-y-6">
                                    <Input
                                        label="Tên Category"
                                        placeholder="Nhập tên Category"
                                        type="text"
                                        name="name"
                                        value={categoryData.name}
                                        onChange={handleInputChange}
                                        isRequired
                                        variant="bordered"
                                        isDisabled={isSubmitting}
                                    />

                                    <div>
                                        <label htmlFor="description" className="mb-2 text-sm font-medium text-gray-700 block">
                                            Mô tả Category
                                        </label>
                                        <textarea
                                            id="description"
                                            placeholder="Nhập mô tả chi tiết"
                                            name="description"
                                            value={categoryData.description}
                                            onChange={handleTextareaChange}
                                            required
                                            rows={4}
                                            disabled={isSubmitting}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
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