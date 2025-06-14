"use client";

import {Card, CardHeader, CardBody, CardFooter, Divider, Button, Spinner} from "@heroui/react";
import {Input} from "@heroui/input";
import {useState, useEffect, useCallback} from "react";
import {useRouter, useParams} from "next/navigation";
import {addToast} from "@heroui/react";
import {useSession} from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export interface material {
    id: number | string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface materialFormData {
    name: string;
    description?: string;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

const fetchmaterialById = async (id: string, token: string): Promise<ApiResponse<material>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            },
        });

        const responseData = await response.json(); // Luôn thử parse JSON

        if (!response.ok) {
            const errorMessage = responseData?.message || `Lỗi tải dữ liệu material (Status: ${response.status})`;
            console.error("API Fetch Error:", response.status, responseData);
            if (response.status === 404) throw new Error("Không tìm thấy material.");
            throw new Error(errorMessage);
        }
        if (!responseData || typeof responseData !== 'object' || !responseData.data) {
            console.error("Invalid API response structure:", responseData);
            throw new Error("API trả về dữ liệu không hợp lệ.");
        }

        console.log("Fetched material by ID:", response.status, responseData);
        return responseData as ApiResponse<material>;

    } catch (error) {
        console.error("Error fetching material by ID:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc không thể kết nối đến server.");
    }
};

const updatematerial = async (id: string, data: materialFormData, token: string): Promise<any> => {
    try {
        console.log("Sending update data:", JSON.stringify(data));
        const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (response.status === 204) {
            console.log("material updated successfully (No Content)");
            return null;
        }

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || `Lỗi cập nhật chất liệu (Status: ${response.status})`;
            console.error("API Update Error:", response.status, responseData);
            throw new Error(errorMessage);
        }

        console.log("material updated successfully:", response.status, responseData);
        return responseData

    } catch (error) {
        console.error("Error updating material:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi gửi yêu cầu cập nhật.");
    }
};

export default function UpdatematerialPage() {
    const router = useRouter();
    const params = useParams();
    const materialId = params?.materialsId as string | undefined;
    const [materialData, setmaterialData] = useState<materialFormData>({name: ''});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sử dụng NextAuth session để lấy token
    const {data: session, status} = useSession();
    const authToken = session?.accessToken;
    const isAuthenticated = status === "authenticated" && !!authToken;
    const isAuthLoading = status === "loading";

    useEffect(() => {
        if (materialId && authToken) {
            setIsLoading(true);
            setError(null);
            console.log(`Fetching data for material ID: ${materialId}`);

            fetchmaterialById(materialId, authToken)
                .then(response => {
                    const fetchedmaterial = response.data;
                    if (!fetchedmaterial) {
                        throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    }
                    setmaterialData({
                        name: fetchedmaterial.name || '',
                        description: fetchedmaterial.description || '',
                    });
                    console.log('material data loaded into state:', {name: fetchedmaterial.name});
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu material.";
                    setError(errorMsg);
                    addToast({title: "Lỗi Tải Dữ Liệu", description: errorMsg, color: "danger"});
                })
                .finally(() => {
                    setIsLoading(false);
                    console.log("Loading finished.");
                });
        } else {
            if (!materialId) {
                console.error("material ID is missing from URL parameters.");
                setError("Không tìm thấy ID của material trong đường dẫn.");
                addToast({title: "Lỗi", description: "ID material không hợp lệ.", color: "danger"});
            }
            if (!authToken && !isAuthLoading) {
                console.log("Auth token is not available.");
                setError("Người dùng chưa được xác thực.");
                addToast({title: "Lỗi Xác Thực", description: "Vui lòng đăng nhập.", color: "danger"});
                // Chuyển hướng đến trang đăng nhập nếu không có token
                router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
            }
            if (!isAuthLoading) {
                setIsLoading(false);
            }
        }
    }, [materialId, authToken, isAuthLoading, router]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setmaterialData(prev => ({...prev, [name]: value}));
        if (error) setError(null);
    }, [error]);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setmaterialData(prev => ({...prev, [name]: value}));
        if (error) setError(null);
    }, [error]);

    const validateForm = useCallback((): boolean => {
        if (!materialData.name.trim()) {
            addToast({title: "Thiếu thông tin", description: "Vui lòng nhập tên material.", color: "warning"});
            return false;
        }
        return true;
    }, [materialData.name]);

    const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!validateForm() || isSubmitting || !authToken || !materialId) {
            if (!authToken) {
                addToast({title: "Lỗi", description: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", color: "danger"});
                router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
            }
            if (!materialId) {
                addToast({title: "Lỗi", description: "Không xác định được chất liệu cần cập nhật.", color: "danger"});
            }
            return;
        }

        setIsSubmitting(true); // Bắt đầu trạng thái submitting
        const dataToUpdate: materialFormData = {
            name: materialData.name.trim(),
            description: materialData.description ? materialData.description.trim() : '',
        };

        try {
            await updatematerial(materialId, dataToUpdate, authToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật chất liệu thành công!",
                color: "success",
            });

            setTimeout(() => {
                router.push("/admin/product_management/materials");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật chất liệu.";
            console.error("Lỗi khi submit update:", err);
            setError(errorMessage);
            addToast({
                title: "Lỗi Cập Nhật",
                description: `Có lỗi xảy ra: ${errorMessage}`,
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hiển thị loading khi đang kiểm tra xác thực hoặc đang tải dữ liệu
    if (isAuthLoading || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải dữ liệu material..." size="lg"/>
            </div>
        );
    }

    // Hiển thị lỗi nếu có
    if (error && !isLoading && !materialData.name && !materialId) {
        return (
            <Card className="w-full max-w-2xl mx-auto my-10">
                <CardHeader>
                    <p className="text-lg font-semibold text-red-600">Lỗi Tải Dữ Liệu</p>
                </CardHeader>
                <Divider/>
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {error}. Không thể hiển thị form cập nhật. Vui lòng kiểm tra lại đường dẫn hoặc thử lại sau.
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className={`min-h-screen py-8 px-4 md:px-36`}>
            <form onSubmit={handleUpdateSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-lg font-semibold">
                            {/*Cập nhật chất liệu {materialId ? `(ID: ${materialId})` : ''}*/}
                            Cập nhật chất liệu
                        </p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên material"
                        placeholder="Nhập tên material"
                        type="text"
                        name="name"
                        value={materialData.name}
                        onChange={handleInputChange}
                        isRequired
                    />
                    <div className="flex flex-col gap-1">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Mô tả
                        </label>
                        <textarea
                            id="description"
                            placeholder="Nhập description materials"
                            name="description"
                            value={materialData.description || ''}
                            onChange={handleTextareaChange}
                            required
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {error && !isLoading && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md"
                           role="alert">
                            {error}
                        </p>
                    )}
                </CardBody>
                <Divider/>
                <CardFooter className="p-5 flex justify-end space-x-3">
                    <Button
                        color="success"
                        type="submit"
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting || !authToken || !materialId}
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}