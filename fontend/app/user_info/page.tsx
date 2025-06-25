"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jwtDecode } from 'jwt-decode';
import { CldImage, CldUploadButton } from 'next-cloudinary';
import {MapPin} from "lucide-react";
import {Button} from "@heroui/react";
import { useRouter } from 'next/navigation';



interface AppUser {
    appUserId: number;
    keycloakId: string;
    username: string;
    email: string;
    roles: string[];
    enabled: boolean;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
}

interface DecodedToken {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [clientId: string]: {
            roles: string[];
        };
    };
    [key: string]: any;
}

interface ApiResponse {
    timestamp: string;
    status: number;  // HTTP status code (200, 404, etc.)
    message: string;
    data: AppUser;
    error?: string;
    path?: string;
}

interface UserUpdateData {
    appUserId: number;
    keycloakId: string;
    email: string;
    roles: string[];
    enabled: boolean;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string;
}

export default function Page() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [decodedAccessToken, setDecodedAccessToken] = useState<any>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editData, setEditData] = useState<UserUpdateData | null>(null);
    const [updating, setUpdating] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Regex pattern cho số điện thoại Việt Nam
    const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

    const fetchUserByKeycloakId = async (keycloakId: string): Promise<AppUser> => {
        const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse = await response.json();
        console.log('API Response:', apiResponse); // Debug log
        
        // Kiểm tra HTTP status code (200 = thành công)
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy thông tin người dùng');
        }

        // Kiểm tra có error trong response không
        if (apiResponse.error) {
            throw new Error(apiResponse.error);
        }

        // Trả về data (AppUser object)
        if (!apiResponse.data) {
            throw new Error('Không có dữ liệu người dùng trong response');
        }
        
        return apiResponse.data;
    };

    const updateUserProfile = async (updateData: UserUpdateData): Promise<AppUser> => {
        const response = await fetch(`http://localhost:8080/api/users/update-profile/${updateData.appUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.accessToken}`,
            },
            body: JSON.stringify(updateData),
        });

        let apiResponse: ApiResponse;
        
        try {
            apiResponse = await response.json();
        } catch (parseError) {
            // Nếu không parse được JSON, tạo response lỗi
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        if (!response.ok) {
            // Xử lý các loại lỗi cụ thể
            if (response.status === 409 || (apiResponse.message && apiResponse.message.toLowerCase().includes('phone'))) {
                throw new Error('Số điện thoại này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng số điện thoại khác.');
            } else if (response.status === 404) {
                throw new Error('Không tìm thấy người dùng để cập nhật.');
            } else if (response.status === 400) {
                throw new Error(apiResponse.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
            } else {
                throw new Error(apiResponse.message || apiResponse.error || `Lỗi API: ${response.status} - ${response.statusText}`);
            }
        }
        
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            if (apiResponse.message && apiResponse.message.toLowerCase().includes('phone')) {
                throw new Error('Số điện thoại này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng số điện thoại khác.');
            }
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi cập nhật thông tin');
        }

        if (apiResponse.error) {
            if (apiResponse.error.toLowerCase().includes('phone')) {
                throw new Error('Số điện thoại này đã được sử dụng bởi tài khoản khác. Vui lòng sử dụng số điện thoại khác.');
            }
            throw new Error(apiResponse.error);
        }

        if (!apiResponse.data) {
            throw new Error('Không có dữ liệu trong response');
        }
        
        return apiResponse.data;
    };

    useEffect(() => {
        const getUserInfo = async () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                setDecodedAccessToken(tokenData);

                const keycloakId = tokenData.sub;
                if (!keycloakId) {
                    throw new Error("Không tìm thấy keycloakId trong token");
                }

                // Gọi API để lấy thông tin user từ backend
                const userData = await fetchUserByKeycloakId(keycloakId);
                setUser(userData);

            } catch (err: any) {
                console.error("Lỗi khi lấy thông tin người dùng:", err);
                setError(err.message || "Không thể lấy thông tin người dùng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        getUserInfo();
    }, [session, status]);

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        window.location.reload();
    };

    const handleStartEdit = () => {
        if (user) {
            setEditData({
                appUserId: user.appUserId,
                keycloakId: user.keycloakId,
                email: user.email,
                roles: user.roles || [],
                enabled: user.enabled,
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                avatarUrl: user.avatarUrl || '',
            });
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData(null);
        setUploadError(null);
        setPhoneError(null);
        setUpdateError(null);
    };

    const handleSaveEdit = async () => {
        if (!editData) return;

        // Validate số điện thoại trước khi lưu
        if (editData.phoneNumber && editData.phoneNumber.trim() !== '' && !validatePhoneNumber(editData.phoneNumber)) {
            setPhoneError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng.');
            return;
        }

        setUpdating(true);
        setUpdateError(null);
        try {
            const updatedUser = await updateUserProfile(editData);
            setUser(updatedUser);
            setIsEditing(false);
            setEditData(null);
            setUploadError(null);
            setPhoneError(null);
            setUpdateError(null);
        } catch (err: any) {
            console.error("Lỗi khi cập nhật:", err);
            setUpdateError(err.message || "Không thể cập nhật thông tin. Vui lòng thử lại.");
        } finally {
            setUpdating(false);
        }
    };

    const handleInputChange = (field: keyof UserUpdateData, value: string | boolean) => {
        if (editData) {
            setEditData(prev => prev ? { ...prev, [field]: value } : null);
            
            // Xóa thông báo lỗi cập nhật khi người dùng thay đổi dữ liệu
            if (updateError) {
                setUpdateError(null);
            }
            
            // Validate số điện thoại real-time
            if (field === 'phoneNumber' && typeof value === 'string') {
                if (value.trim() === '') {
                    setPhoneError(null);
                } else if (!validatePhoneNumber(value)) {
                    setPhoneError('Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx');
                } else {
                    setPhoneError(null);
                }
            }
        }
    };

    const handleAvatarUpload = (result: any) => {
        if (result.event === "success") {
            console.log("Upload thành công:", result.info);
            const newAvatarUrl = result.info.public_id;
            handleInputChange('avatarUrl', newAvatarUrl);
            setUploadError(null);
        } else {
            setUploadError("Có lỗi xảy ra trong quá trình upload ảnh");
            console.error("Lỗi upload:", result);
        }
    };

    const validatePhoneNumber = (phone: string): boolean => {
        return PHONE_REGEX.test(phone);
    };

    const handleViewOrders = () => {
        if (!user?.phoneNumber || user.phoneNumber.trim() === '') {
            alert('Bạn cần cập nhật số điện thoại trước khi có thể xem đơn hàng!');
            return;
        }
        
        if (!validatePhoneNumber(user.phoneNumber)) {
            alert('Số điện thoại không hợp lệ! Vui lòng cập nhật số điện thoại đúng định dạng.');
            return;
        }
        
        router.push('/user_info/order');
    };

    if (status === 'loading' || loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={handleRetry}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                <p>Không tìm thấy thông tin người dùng.</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={handleRetry}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Header với nút Edit/Save/Cancel */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center">Thông tin người dùng</h2>

                <div className="flex gap-2">
                    {!isEditing ? (
                        <button
                            onClick={handleStartEdit}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Chỉnh sửa
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updating}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                            >
                                {updating ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={updating}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
                            >
                                Hủy
                            </button>
                        </>
                    )}
                    <Button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={() => router.push(`/user_info/address_management?userId=${user.keycloakId}`)}
                    >
                        Quản lý địa chỉ giao hàng
                    </Button>
                    <Button
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            !user?.phoneNumber || user.phoneNumber.trim() === '' || !validatePhoneNumber(user.phoneNumber)
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        onClick={handleViewOrders}
                        disabled={!user?.phoneNumber || user.phoneNumber.trim() === '' || !validatePhoneNumber(user.phoneNumber)}
                    >
                        Đơn hàng của tôi
                    </Button>
                </div>
                
                {/* Hiển thị lỗi cập nhật */}
                {updateError && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p><strong>Lỗi:</strong> {updateError}</p>
                        </div>
                    </div>
                )}
                
                {/* Thông báo yêu cầu số điện thoại */}
                {(!user?.phoneNumber || user.phoneNumber.trim() === '' || !validatePhoneNumber(user.phoneNumber)) && (
                    <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p>
                                <strong>Lưu ý:</strong> 
                                {!user?.phoneNumber || user.phoneNumber.trim() === '' 
                                    ? ' Bạn cần cập nhật số điện thoại để có thể xem đơn hàng của mình.'
                                    : ' Số điện thoại hiện tại không hợp lệ. Vui lòng cập nhật số điện thoại đúng định dạng để có thể xem đơn hàng.'
                                }
                            </p>
                        </div>
                        <div className="mt-2 text-sm">
                            <p><strong>Định dạng hợp lệ:</strong> 0xxxxxxxxx hoặc +84xxxxxxxxx</p>
                            <p><strong>Ví dụ:</strong> 0912345678, +84912345678</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center lg:w-1/3">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 mb-4">
                        {(isEditing ? editData?.avatarUrl : user.avatarUrl) ? (
                            <CldImage
                                width={128}
                                height={128}
                                src={isEditing ? editData?.avatarUrl || '' : user.avatarUrl}
                                alt={`Avatar của ${user.fullName || user.username}`}
                                sizes="128px"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <svg
                                    className="w-16 h-16 text-gray-500 dark:text-gray-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                    
                    {isEditing && (
                        <div className="text-center">
                            <div className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-4 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px] mb-2">
                                <CldUploadButton
                                    uploadPreset="YellowCatWeb"
                                    onSuccess={(result, {widget}) => {
                                        handleAvatarUpload(result);
                                        widget.close();
                                    }}
                                >
                                    Cập nhật ảnh đại diện
                                </CldUploadButton>
                            </div>
                            {uploadError && (
                                <p className="text-red-500 text-sm mt-1">{uploadError}</p>
                            )}
                        </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
                        {isEditing ? editData?.fullName || user.username : user.fullName || user.username}
                    </h3>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
                        { user.email}
                    </h3>
                </div>

                {/* User Information Section */}
                <div className="lg:w-2/3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">Họ và tên:</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData?.fullName || ''}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                    placeholder="Nhập họ và tên"
                                />
                            ) : (
                                <span className="text-gray-800 dark:text-white">{user.fullName || 'Chưa cập nhật'}</span>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">Số điện thoại:</span>
                            {isEditing ? (
                                <div>
                                    <input
                                        type="tel"
                                        value={editData?.phoneNumber || ''}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-600 dark:text-white ${
                                            phoneError 
                                                ? 'border-red-500 focus:ring-red-500 dark:border-red-400' 
                                                : 'border-gray-300 focus:ring-blue-500 dark:border-gray-500'
                                        }`}
                                        placeholder="Nhập số điện thoại (VD: 0123456789)"
                                    />
                                    {phoneError && (
                                        <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        Định dạng hợp lệ: 0xxxxxxxxx hoặc +84xxxxxxxxx
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <span className={`text-gray-800 dark:text-white ${
                                        user.phoneNumber && !validatePhoneNumber(user.phoneNumber) 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : ''
                                    }`}>
                                        {user.phoneNumber || 'Chưa cập nhật'}
                                    </span>
                                    {user.phoneNumber && !validatePhoneNumber(user.phoneNumber) && (
                                        <p className="text-red-500 text-xs mt-1">
                                            Số điện thoại không hợp lệ
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/*{user.roles && user.roles.length > 0 && (*/}
                    {/*    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">*/}
                    {/*        <span className="font-semibold text-gray-600 dark:text-gray-300 block mb-3">Vai trò:</span>*/}
                    {/*        <div className="flex flex-wrap gap-2">*/}
                    {/*            {user.roles.map((role, index) => (*/}
                    {/*                <span*/}
                    {/*                    key={index}*/}
                    {/*                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium"*/}
                    {/*                >*/}
                    {/*                    {role}*/}
                    {/*                </span>*/}
                    {/*            ))}*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </div>
        </div>
    );
}