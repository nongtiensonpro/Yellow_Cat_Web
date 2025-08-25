"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { CldImage, CldUploadButton } from 'next-cloudinary';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Spinner,
    Alert
} from "@heroui/react";

interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        id?: string | null;
    };
}

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
    [key: string]: unknown;
}

interface ApiResponse {
    timestamp: string;
    status: number;
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

interface UploadResult {
    event: string;
    info: {
        public_id: string;
        [key: string]: unknown;
    };
}

export default function ProfileRequiredPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    
    // Form data
    const [formData, setFormData] = useState<{
        fullName: string;
        phoneNumber: string;
        avatarUrl: string;
    }>({
        fullName: '',
        phoneNumber: '',
        avatarUrl: ''
    });

    // Regex pattern cho số điện thoại Việt Nam
    const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

    // Get return URL from search params
    const returnUrl = (searchParams?.get('returnUrl') as string | null) || '/staff/officesales';

    const fetchUserByKeycloakId = useCallback(async (keycloakId: string, accessToken: string): Promise<AppUser> => {
        const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        const apiResponse: ApiResponse = await response.json();
        
        if (apiResponse.status < 200 || apiResponse.status >= 300) {
            throw new Error(apiResponse.message || apiResponse.error || 'Có lỗi xảy ra khi lấy thông tin người dùng');
        }

        if (apiResponse.error) {
            throw new Error(apiResponse.error);
        }

        if (!apiResponse.data) {
            throw new Error('Không có dữ liệu người dùng trong response');
        }
        
        return apiResponse.data;
    }, []);

    const updateUserProfile = useCallback(async (updateData: UserUpdateData, accessToken: string): Promise<AppUser> => {
        const response = await fetch(`http://localhost:8080/api/users/update-profile/${updateData.appUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updateData),
        });

        let apiResponse: ApiResponse;
        
        try {
            apiResponse = await response.json();
        } catch {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }

        if (!response.ok) {
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
    }, []);

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
                const extendedSession = session as unknown as ExtendedSession;
                const accessToken = extendedSession.accessToken;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                const keycloakId = tokenData.sub;
                if (!keycloakId) {
                    throw new Error("Không tìm thấy keycloakId trong token");
                }

                const userData = await fetchUserByKeycloakId(keycloakId, accessToken);
                setUser(userData);
                
                // Populate form data
                setFormData({
                    fullName: userData.fullName || '',
                    phoneNumber: userData.phoneNumber || '',
                    avatarUrl: userData.avatarUrl || ''
                });

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Không thể lấy thông tin người dùng. Vui lòng thử lại sau.";
                console.error("Lỗi khi lấy thông tin người dùng:", err);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        getUserInfo();
    }, [session, status, fetchUserByKeycloakId]);

    const validatePhoneNumber = (phone: string): boolean => {
        return PHONE_REGEX.test(phone);
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear update error when user changes data
        if (updateError) {
            setUpdateError(null);
        }
        
        // Validate phone number real-time
        if (field === 'phoneNumber') {
            if (value.trim() === '') {
                setPhoneError('Số điện thoại là bắt buộc');
            } else if (!validatePhoneNumber(value)) {
                setPhoneError('Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx');
            } else {
                setPhoneError(null);
            }
        }
    };

    const handleAvatarUpload = (result: UploadResult) => {
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

    const handleSubmit = async () => {
        if (!user || !session) return;

        // Validate required fields
        if (!formData.fullName.trim()) {
            setUpdateError('Vui lòng nhập họ và tên');
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setPhoneError('Số điện thoại là bắt buộc');
            return;
        }

        if (!validatePhoneNumber(formData.phoneNumber)) {
            setPhoneError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng.');
            return;
        }

        setUpdating(true);
        setUpdateError(null);
        
        try {
            const extendedSession = session as unknown as ExtendedSession;
            const updateData: UserUpdateData = {
                appUserId: user.appUserId,
                keycloakId: user.keycloakId,
                email: user.email,
                roles: user.roles || [],
                enabled: user.enabled,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                avatarUrl: formData.avatarUrl,
            };

            await updateUserProfile(updateData, extendedSession.accessToken);
            
            // Redirect to return URL after successful update
            router.push(returnUrl);
            
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật thông tin. Vui lòng thử lại.";
            console.error("Lỗi khi cập nhật:", err);
            setUpdateError(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        router.push('/staff');
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" label="Đang tải thông tin..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardBody>
                        <Alert color="danger" title="Lỗi">
                            {error}
                        </Alert>
                        <div className="flex gap-3 mt-4">
                            <Button
                                color="danger"
                                variant="solid"
                                onPress={() => window.location.reload()}
                            >
                                Thử lại
                            </Button>
                            <Button
                                color="default"
                                variant="light"
                                onPress={handleCancel}
                            >
                                Quay lại
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardBody>
                        <Alert color="warning" title="Không tìm thấy thông tin">
                            Không tìm thấy thông tin người dùng.
                        </Alert>
                        <div className="flex gap-3 mt-4">
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={() => window.location.reload()}
                            >
                                Thử lại
                            </Button>
                            <Button
                                color="default"
                                variant="light"
                                onPress={handleCancel}
                            >
                                Quay lại
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="pb-6">
                        <div className="w-full text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📝</span>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Cập nhật thông tin cá nhân
                            </h1>
                            <p className="text-gray-600">
                                Vui lòng cập nhật đầy đủ thông tin cá nhân để có thể sử dụng tính năng bán hàng tại quầy
                            </p>
                        </div>
                    </CardHeader>

                    <CardBody className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
                                {formData.avatarUrl ? (
                                    <CldImage
                                        width={128}
                                        height={128}
                                        src={formData.avatarUrl}
                                        alt={`Avatar của ${formData.fullName || user.username}`}
                                        sizes="128px"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                        <svg
                                            className="w-16 h-16 text-gray-500"
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
                            
                            <div className="text-center">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    className="mb-2"
                                >
                                    <CldUploadButton
                                        uploadPreset="YellowCatWeb"
                                        onSuccess={(result) => {
                                            handleAvatarUpload(result as UploadResult);
                                        }}
                                    >
                                        Cập nhật ảnh đại diện
                                    </CldUploadButton>
                                </Button>
                                {uploadError && (
                                    <p className="text-red-500 text-sm mt-1">{uploadError}</p>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <Input
                                    label="Họ và tên *"
                                    placeholder="Nhập họ và tên đầy đủ"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    isRequired
                                    variant="bordered"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Số điện thoại *"
                                    placeholder="Nhập số điện thoại (VD: 0123456789)"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                    isRequired
                                    variant="bordered"
                                    color={phoneError ? "danger" : "default"}
                                    description="Định dạng hợp lệ: 0xxxxxxxxx hoặc +84xxxxxxxxx"
                                    errorMessage={phoneError}
                                />
                            </div>

                            <div className="p-4 bg-gray-100 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Email:</strong> {user.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Email không thể thay đổi và được đồng bộ từ hệ thống xác thực
                                </p>
                            </div>
                        </div>

                        {/* Error Messages */}
                        {updateError && (
                            <Alert color="danger" title="Lỗi cập nhật">
                                {updateError}
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                color="primary"
                                className="flex-1"
                                onPress={handleSubmit}
                                isLoading={updating}
                                disabled={updating || !!phoneError || !formData.fullName.trim() || !formData.phoneNumber.trim()}
                            >
                                {updating ? 'Đang cập nhật...' : 'Cập nhật và tiếp tục'}
                            </Button>
                            <Button
                                color="default"
                                variant="light"
                                onPress={handleCancel}
                                disabled={updating}
                            >
                                Hủy
                            </Button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-500">
                                Sau khi cập nhật thành công, bạn sẽ được chuyển đến trang bán hàng tại quầy
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
