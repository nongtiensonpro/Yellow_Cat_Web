"use client";

import { Card, CardHeader, CardBody, Divider, Button, addToast, Spinner } from "@heroui/react";
import { Input } from "@heroui/input";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CardFooter } from "@heroui/card";
import { useSession } from "next-auth/react";

export interface Attribute {
    id: number | string;
    attributeName: string;
    dataType: string;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

const fetchAttributeById = async (id: string | string[] | undefined, token: string | undefined): Promise<ApiResponse<Attribute>> => {
    if (!id || Array.isArray(id)) {
        throw new Error("Attribute ID không hợp lệ.");
    }
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        const response = await fetch(`http://localhost:8080/api/attributes/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Không tìm thấy Attribute.");
            const errorData = await response.json().catch(() => ({ message: `Lỗi không xác định (Status: ${response.status})` }));
            throw new Error(errorData.message || `Failed to fetch Attribute (Status: ${response.status})`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching Attribute by ID:", error);
        throw error;
    }
};

const updateAttribute = async (id: string | string[] | undefined, data: Attribute, token: string | undefined): Promise<any> => {
    if (!id || Array.isArray(id)) {
        throw new Error("Attribute ID không hợp lệ.");
    }
    if (!token) {
        throw new Error("Chưa xác thực.");
    }
    try {
        console.log("Sending update data:", JSON.stringify(data));
        const response = await fetch(`http://localhost:8080/api/attributes/${id}`, {
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
        console.error("Error updating Attribute:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi cập nhật.");
    }
};

export default function UpdateAttributePage() {
    const router = useRouter();
    const params = useParams();
    const AttributeId = params?.attributesId as string | undefined;
    const { data: session, status } = useSession();
    const [AttributeData, setAttributeData] = useState<Attribute>({
        id: '',
        attributeName: '',
        dataType: '',
    });

    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
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

    // Tải dữ liệu Attribute khi đã xác thực
    useEffect(() => {
        if (AttributeId && session?.accessToken && status === 'authenticated') {
            setLoading(true);
            setFormError(null);
            console.log(`Fetching data for Attribute ID: ${AttributeId}`);
            fetchAttributeById(AttributeId, session.accessToken)
                .then(response => {
                    const fetchedAttribute = response.data;
                    console.log("Fetched Attribute data:", fetchedAttribute);

                    if (!fetchedAttribute) {
                        throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    }

                    setAttributeData({
                        id: fetchedAttribute.id,
                        attributeName: fetchedAttribute.attributeName || '',
                        dataType: fetchedAttribute.dataType || '',
                    });
                    console.log('State updated:', {
                        id: fetchedAttribute.id,
                        attributeName: fetchedAttribute.attributeName,
                        dataType: fetchedAttribute.dataType,
                    });
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu Attribute.";
                    setFormError(errorMsg);
                    addToast({ title: "Lỗi", description: errorMsg, color: "danger" });
                })
                .finally(() => {
                    setLoading(false);
                    console.log("Loading finished.");
                });
        } else {
            if (!AttributeId) console.log("Attribute ID is missing.");
            if (!session?.accessToken) console.log("Access token is missing.");
            if (status !== 'loading') setLoading(false);
        }
    }, [AttributeId, session?.accessToken, status]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAttributeData(prev => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const validateForm = (): boolean => {
        if (!AttributeData.attributeName.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên Attribute.", color: "warning" });
            return false;
        }
        if (!AttributeData.dataType.trim()) {
            addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập thông tin Attribute.", color: "warning" });
            return false;
        }
        return true;
    };

    const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        if (!validateForm() || isSubmitting || !session?.accessToken) {
            if (!session?.accessToken) addToast({ title: "Lỗi", description: "Phiên đăng nhập hết hạn.", color: "danger" });
            return;
        }

        setIsSubmitting(true);

        try {
            await updateAttribute(AttributeId, AttributeData, session.accessToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật thuộc tính thành công!",
                color: "success",
            });

            setTimeout(() => {
                router.push("/admin/product_management/attributes");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật Attribute.";
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

    // Hiển thị trạng thái loading khi đang xác thực hoặc tải dữ liệu
    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải dữ liệu Attribute..." size="lg" />
            </div>
        );
    }

    // Hiển thị lỗi nếu có
    if (formError && !loading) {
        return (
            <Card className="w-full max-w-2xl mx-auto my-10">
                <CardHeader><p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p></CardHeader>
                <Divider />
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại hoặc kiểm tra ID Attribute.
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    // Hiển thị form cập nhật
    return (
        <Card className="w-full max-w-2xl mx-auto my-10">
            <form onSubmit={handleUpdateSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-semibold">Cập nhật Attribute (ID: {AttributeId})</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên Attribute"
                        placeholder="Nhập tên Attribute"
                        type="text"
                        name="attributeName"
                        value={AttributeData.attributeName}
                        onChange={handleInputChange}
                        isRequired
                    />

                    <Input
                        label="Kiểu dữ liệu"
                        placeholder="Nhập kiểu dữ liệu"
                        type="text"
                        name="dataType"
                        value={AttributeData.dataType}
                        onChange={handleInputChange}
                        isRequired
                    />

                    <div>
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
                        isDisabled={isSubmitting || !session?.accessToken}
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}