//
// "use client";
// import { Card, CardHeader, CardBody, CardFooter, Divider, Button, Spinner } from "@heroui/react";
// import { Input } from "@heroui/input";
// import { useState, useEffect } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { addToast } from "@heroui/react";
// import { useSession } from "next-auth/react";
//
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
//
// export interface Color {
//     id: number | string;
//     name: string;
//     description: string;
//     createdAt: string;
//     updatedAt: string;
// }
//
// interface ColorFormData {
//     name: string;
//     description?: string;
// }
//
// interface ApiResponse<T> {
//     timestamp: string;
//     status: number;
//     message: string;
//     data: T;
// }
//
// const fetchColorById = async (id: string, token: string): Promise<ApiResponse<Color>> => {
//     const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
//         headers: {
//             "Authorization": `Bearer ${token}`,
//             "Accept": "application/json",
//         },
//     });
//
//     const responseData = await response.json();
//     if (!response.ok) {
//         const errorMessage = responseData?.message || `Lỗi tải dữ liệu Color (Status: ${response.status})`;
//         throw new Error(errorMessage);
//     }
//     return responseData as ApiResponse<Color>;
// };
//
// const updateColor = async (id: string, data: ColorFormData, token: string): Promise<any> => {
//     const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
//         method: "PUT",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`,
//             "Accept": "application/json",
//         },
//         body: JSON.stringify(data),
//     });
//     if (!response.ok) {
//         const errorData = await response.json().catch(() => null);
//         const message = errorData?.message || `Lỗi cập nhật Color (Status: ${response.status})`;
//         throw new Error(message);
//     }
//     return response.json();
// };
//
// export default function UpdateColorPage() {
//     const router = useRouter();
//     const params = useParams();
//     const colorId = params?.colorsId as string | undefined;
//     const [colorData, setColorData] = useState<ColorFormData>({ name: '' });
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const { data: session, status } = useSession();
//     const authToken = session?.accessToken;
//     const isAuthLoading = status === "loading";
//
//     useEffect(() => {
//         if (colorId && authToken) {
//             fetchColorById(colorId, authToken)
//                 .then(res => {
//                     setColorData({
//                         name: res.data.name || '',
//                         description: res.data.description || '',
//                     });
//                 })
//                 .catch(err => {
//                     setError(err.message);
//                     addToast({ title: "Lỗi", description: err.message, color: "danger" });
//                 })
//                 .finally(() => setIsLoading(false));
//         }
//     }, [colorId, authToken]);
//
//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setColorData(prev => ({ ...prev, [name]: value }));
//     };
//
//     const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//         const { name, value } = e.target;
//         setColorData(prev => ({ ...prev, [name]: value }));
//     };
//
//     const validateForm = (): boolean => {
//         if (!colorData.name.trim()) {
//             addToast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên màu.", color: "warning" });
//             return false;
//         }
//         return true;
//     };
//
//     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();
//         if (!validateForm() || !authToken || !colorId) return;
//
//         setIsSubmitting(true);
//         try {
//             await updateColor(colorId, colorData, authToken);
//             addToast({ title: "Thành công", description: "Đã cập nhật màu sắc", color: "success" });
//             setTimeout(() => router.push("/admin/product_management/colors"), 1500);
//         } catch (err: any) {
//             setError(err.message);
//             addToast({ title: "Lỗi cập nhật", description: err.message, color: "danger" });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//
//     if (isAuthLoading || isLoading) {
//         return <div className="flex justify-center items-center min-h-screen"><Spinner label="Đang tải dữ liệu..." /></div>;
//     }
//
//     return (
//         <Card className="min-h-screen py-8 px-4 md:px-36">
//             <form onSubmit={handleSubmit}>
//                 <CardHeader>
//                     <p className="text-lg font-semibold">Cập nhật màu sắc</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody className="space-y-6">
//                     <Input
//                         label="Tên màu"
//                         placeholder="Nhập tên màu"
//                         name="name"
//                         value={colorData.name}
//                         onChange={handleInputChange}
//                         isRequired
//                     />
//                     <div className="flex flex-col gap-1">
//                         <label htmlFor="description" className="text-sm font-medium">Mô tả</label>
//                         <textarea
//                             id="description"
//                             name="description"
//                             value={colorData.description || ''}
//                             onChange={handleTextareaChange}
//                             rows={4}
//                             className="w-full p-2 border rounded-md"
//                             placeholder="Mô tả màu sắc"
//                         />
//                     </div>
//                     {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
//                 </CardBody>
//                 <Divider />
//                 <CardFooter className="flex justify-end">
//                     <Button type="submit" color="success" isLoading={isSubmitting}>
//                         {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
//                     </Button>
//                 </CardFooter>
//             </form>
//         </Card>
//     );
// }


"use client";

import {Card, CardHeader, CardBody, CardFooter, Divider, Button, Spinner} from "@heroui/react";
import {Input} from "@heroui/input";
import {useState, useEffect, useCallback} from "react";
import {useRouter, useParams} from "next/navigation";
import {addToast} from "@heroui/react";
import {useSession} from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export interface color {
    id: number | string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface colorFormData {
    name: string;
    description?: string;
}

interface ApiResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
}

const fetchcolorById = async (id: string, token: string): Promise<ApiResponse<color>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            },
        });

        const responseData = await response.json(); // Luôn thử parse JSON

        if (!response.ok) {
            const errorMessage = responseData?.message || `Lỗi tải dữ liệu color (Status: ${response.status})`;
            console.error("API Fetch Error:", response.status, responseData);
            if (response.status === 404) throw new Error("Không tìm thấy color.");
            throw new Error(errorMessage);
        }
        if (!responseData || typeof responseData !== 'object' || !responseData.data) {
            console.error("Invalid API response structure:", responseData);
            throw new Error("API trả về dữ liệu không hợp lệ.");
        }

        console.log("Fetched color by ID:", response.status, responseData);
        return responseData as ApiResponse<color>;

    } catch (error) {
        console.error("Error fetching color by ID:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi mạng hoặc không thể kết nối đến server.");
    }
};

const updatecolor = async (id: string, data: colorFormData, token: string): Promise<any> => {
    try {
        console.log("Sending update data:", JSON.stringify(data));
        const response = await fetch(`${API_BASE_URL}/colors/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (response.status === 204) {
            console.log("color updated successfully (No Content)");
            return null;
        }

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || `Lỗi cập nhật color (Status: ${response.status})`;
            console.error("API Update Error:", response.status, responseData);
            throw new Error(errorMessage);
        }

        console.log("color updated successfully:", response.status, responseData);
        return responseData

    } catch (error) {
        console.error("Error updating color:", error);
        throw error instanceof Error ? error : new Error("Đã xảy ra lỗi khi gửi yêu cầu cập nhật.");
    }
};

export default function UpdatecolorPage() {
    const router = useRouter();
    const params = useParams();
    const colorId = params?.colorsId as string | undefined;
    const [colorData, setcolorData] = useState<colorFormData>({name: ''});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sử dụng NextAuth session để lấy token
    const {data: session, status} = useSession();
    const authToken = session?.accessToken;
    const isAuthenticated = status === "authenticated" && !!authToken;
    const isAuthLoading = status === "loading";

    useEffect(() => {
        if (colorId && authToken) {
            setIsLoading(true);
            setError(null);
            console.log(`Fetching data for color ID: ${colorId}`);

            fetchcolorById(colorId, authToken)
                .then(response => {
                    const fetchedcolor = response.data;
                    if (!fetchedcolor) {
                        throw new Error("API trả về dữ liệu không hợp lệ (thiếu trường 'data').");
                    }
                    setcolorData({
                        name: fetchedcolor.name || '',
                        description: fetchedcolor.description || '',
                    });
                    console.log('color data loaded into state:', {name: fetchedcolor.name});
                })
                .catch(err => {
                    console.error("Error in fetch useEffect:", err);
                    const errorMsg = err.message || "Không thể tải dữ liệu color.";
                    setError(errorMsg);
                    addToast({title: "Lỗi Tải Dữ Liệu", description: errorMsg, color: "danger"});
                })
                .finally(() => {
                    setIsLoading(false);
                    console.log("Loading finished.");
                });
        } else {
            if (!colorId) {
                console.error("color ID is missing from URL parameters.");
                setError("Không tìm thấy ID của color trong đường dẫn.");
                addToast({title: "Lỗi", description: "ID color không hợp lệ.", color: "danger"});
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
    }, [colorId, authToken, isAuthLoading, router]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setcolorData(prev => ({...prev, [name]: value}));
        if (error) setError(null);
    }, [error]);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setcolorData(prev => ({...prev, [name]: value}));
        if (error) setError(null);
    }, [error]);

    const validateForm = useCallback((): boolean => {
        if (!colorData.name.trim()) {
            addToast({title: "Thiếu thông tin", description: "Vui lòng nhập tên color.", color: "warning"});
            return false;
        }
        return true;
    }, [colorData.name]);

    const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!validateForm() || isSubmitting || !authToken || !colorId) {
            if (!authToken) {
                addToast({title: "Lỗi", description: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", color: "danger"});
                router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.href));
            }
            if (!colorId) {
                addToast({title: "Lỗi", description: "Không xác định được color cần cập nhật.", color: "danger"});
            }
            return;
        }

        setIsSubmitting(true); // Bắt đầu trạng thái submitting
        const dataToUpdate: colorFormData = {
            name: colorData.name.trim(),
            description: colorData.description ? colorData.description.trim() : '',
        };

        try {
            await updatecolor(colorId, dataToUpdate, authToken);

            addToast({
                title: "Thành công",
                description: "Cập nhật color thành công!",
                color: "success",
            });

            setTimeout(() => {
                router.push("/admin/product_management/colors");
            }, 1500);

        } catch (err: any) {
            const errorMessage = err.message || "Không thể cập nhật color.";
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
                <Spinner label="Đang tải dữ liệu color..." size="lg"/>
            </div>
        );
    }

    // Hiển thị lỗi nếu có
    if (error && !isLoading && !colorData.name && !colorId) {
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
                            {/*Cập nhật color {colorId ? `(ID: ${colorId})` : ''}*/}
                            Cập nhật màu sắc

                        </p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="space-y-6 p-5">
                    <Input
                        label="Tên color"
                        placeholder="Nhập tên color"
                        type="text"
                        name="name"
                        value={colorData.name}
                        onChange={handleInputChange}
                        isRequired
                    />
                    <div className="flex flex-col gap-1">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Mô tả
                        </label>
                        <textarea
                            id="description"
                            placeholder="Nhập description colors"
                            name="description"
                            value={colorData.description || ''}
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
                        isDisabled={isSubmitting || !authToken || !colorId}
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}