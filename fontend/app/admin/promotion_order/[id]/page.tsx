'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Session } from 'next-auth';
import Link from 'next/link';

interface CustomSession extends Session {
    accessToken?: string;
}

interface PromotionOrder {
    promotionProgramId: number;
    promotionCode: string;
    promotionName: string;
    description: string;
    discountType: string;
    discountValue: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    minimumOrderValue: string;
    usageLimitPerUser: number;
    usageLimitTotal: number;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
}

interface PromotionOrderRequest {
    promotionName: string;
    description: string;
    discountType: string;
    discountValue: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    minimumOrderValue: string;
    usageLimitPerUser: number;
    usageLimitTotal: number;
}

export default function EditPromotionOrderPage() {
    const { data: session, status: sessionStatus } = useSession() as { data: CustomSession | null; status: string };
    const router = useRouter();
    const params = useParams();
    const promotionId = params?.id as string;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const [promotion, setPromotion] = useState<PromotionOrder | null>(null);
    const [formData, setFormData] = useState<PromotionOrderRequest>({
        promotionName: '',
        description: '',
        discountType: 'VNĐ',
        discountValue: '',
        startDate: '',
        endDate: '',
        isActive: true,
        minimumOrderValue: '',
        usageLimitPerUser: 1,
        usageLimitTotal: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Load promotion data
    useEffect(() => {
        const loadPromotionData = async () => {
            if (sessionStatus !== 'authenticated' || !session?.accessToken) return;

            try {
                const response = await fetch(`${API_URL}/api/promotion-orders/${promotionId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });

                if (!response.ok) {
                    throw new Error('Không thể tải dữ liệu chương trình khuyến mãi');
                }

                const data = await response.json();
                const promotionData = data.data || data;

                setPromotion(promotionData);
                setFormData({
                    promotionName: promotionData.promotionName || '',
                    description: promotionData.description || '',
                    discountType: promotionData.discountType || 'VNĐ',
                    discountValue: promotionData.discountValue || '',
                    startDate: promotionData.startDate ? promotionData.startDate.slice(0, 16) : '',
                    endDate: promotionData.endDate ? promotionData.endDate.slice(0, 16) : '',
                    isActive: promotionData.isActive !== undefined ? promotionData.isActive : true,
                    minimumOrderValue: promotionData.minimumOrderValue || '',
                    usageLimitPerUser: promotionData.usageLimitPerUser || 1,
                    usageLimitTotal: promotionData.usageLimitTotal || 0
                });
            } catch (error) {
                console.error('Error loading promotion data:', error);
                alert('Không thể tải dữ liệu chương trình khuyến mãi');
                router.push('/admin/promotion_order');
            } finally {
                setDataLoading(false);
            }
        };

        if (promotionId && promotionId !== 'undefined') {
            loadPromotionData();
        } else {
            setDataLoading(false);
            alert('ID chương trình khuyến mãi không hợp lệ');
            router.push('/admin/promotion_order');
        }
    }, [promotionId, session, sessionStatus, API_URL, router]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.promotionName.trim()) {
            newErrors.promotionName = 'Tên chương trình khuyến mãi là bắt buộc';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc';
        }

        if (!formData.discountType) {
            newErrors.discountType = 'Loại giảm giá là bắt buộc';
        }

        if (formData.discountType !== 'free_shipping' && !formData.discountValue.trim()) {
            newErrors.discountValue = 'Giá trị giảm giá là bắt buộc';
        }

        if (formData.discountType === 'VNĐ' || formData.discountType === 'fixed_amount') {
            const value = parseFloat(formData.discountValue);
            if (isNaN(value) || value <= 0) {
                newErrors.discountValue = 'Giá trị giảm giá phải là số dương';
            }
        }

        if (formData.discountType === 'percentage' || formData.discountType === '%') {
            const value = parseFloat(formData.discountValue);
            if (isNaN(value) || value <= 0 || value > 100) {
                newErrors.discountValue = 'Phần trăm giảm giá phải từ 1-100%';
            }
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (startDate >= endDate) {
                newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
            }
        }

        if (!formData.minimumOrderValue.trim()) {
            newErrors.minimumOrderValue = 'Giá trị đơn hàng tối thiểu là bắt buộc';
        } else {
            const value = parseFloat(formData.minimumOrderValue);
            if (isNaN(value) || value < 0) {
                newErrors.minimumOrderValue = 'Giá trị đơn hàng tối thiểu phải là số không âm';
            }
        }
        // **QUY TẮC VALIDATION MỚI**
        if ((formData.discountType === 'VNĐ' || formData.discountType === 'fixed_amount') && !newErrors.discountValue && !newErrors.minimumOrderValue) {
            const discount = parseFloat(formData.discountValue);
            const minOrder = parseFloat(formData.minimumOrderValue);
            if (!isNaN(discount) && !isNaN(minOrder) && discount >= minOrder) {
                newErrors.discountValue = 'Giá trị giảm phải nhỏ hơn đơn hàng tối thiểu.';
            }
        }

        if (formData.usageLimitPerUser < 1) {
            newErrors.usageLimitPerUser = 'Giới hạn sử dụng mỗi người phải >= 1';
        }

        if (formData.usageLimitTotal < 0) {
            newErrors.usageLimitTotal = 'Giới hạn tổng phải >= 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (sessionStatus !== 'authenticated' || !session?.accessToken) {
            alert('Vui lòng đăng nhập để cập nhật chương trình khuyến mãi');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/promotion-orders/${promotionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Có lỗi xảy ra khi cập nhật chương trình khuyến mãi');
            }

            alert('✅ Cập nhật chương trình khuyến mãi thành công!');
            router.push('/admin/promotion_order');
        } catch (error) {
            console.error('Error updating promotion order:', error);
            alert(`❌ Lỗi: ${error instanceof Error ? error.message : 'Có lỗi xảy ra'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof PromotionOrderRequest, value: string | number | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const isExpired = () => {
        if (!promotion) return false;
        const now = new Date();
        const endDate = new Date(promotion.endDate);
        return now > endDate;
    };

    if (dataLoading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    <span className="text-gray-600">Đang tải dữ liệu...</span>
                </div>
            </div>
        );
    }

    if (!promotionId || promotionId === 'undefined') {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="text-center">
                    <p className="text-gray-500">ID chương trình khuyến mãi không hợp lệ</p>
                    <Link href="/admin/promotion_order" className="text-blue-500 hover:underline">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    if (!promotion) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="text-center">
                    <p className="text-gray-500">Không tìm thấy chương trình khuyến mãi</p>
                    <Link href="/admin/promotion_order" className="text-blue-500 hover:underline">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Chỉnh sửa Chương trình Khuyến mãi</h1>
                    <Link
                        href="/admin/promotion_order"
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        ← Quay lại
                    </Link>
                </div>

                {/* Thông tin cơ bản */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cơ bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-600">Mã khuyến mãi:</span>
                            <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                                {promotion.promotionCode}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">Người tạo:</span>
                            <span className="ml-2">{promotion.createdBy}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">Người cập nhật:</span>
                            <span className="ml-2">{promotion.updatedBy}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">Ngày tạo:</span>
                            <span className="ml-2">
                                {new Date(promotion.createdAt).toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tên chương trình */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên chương trình khuyến mãi *
                                </label>
                                <input
                                    type="text"
                                    value={formData.promotionName}
                                    onChange={(e) => handleInputChange('promotionName', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.promotionName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Nhập tên chương trình khuyến mãi"
                                />
                                {errors.promotionName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.promotionName}</p>
                                )}
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả *
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Mô tả chương trình khuyến mãi"
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Loại giảm giá */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại giảm giá *
                                </label>
                                <select
                                    value={formData.discountType}
                                    onChange={(e) => handleInputChange('discountType', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.discountType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                >
                                    <option value="VNĐ">Giảm giá cố định (VNĐ)</option>
                                    <option value="percentage">Giảm giá theo phần trăm (%)</option>
                                    <option value="free_shipping">Miễn phí vận chuyển</option>
                                </select>
                                {errors.discountType && (
                                    <p className="text-red-500 text-sm mt-1">{errors.discountType}</p>
                                )}
                            </div>

                            {/* Giá trị giảm giá */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá trị giảm giá *
                                </label>
                                <input
                                    type="number"
                                    value={formData.discountValue}
                                    onChange={(e) => handleInputChange('discountValue', e.target.value)}
                                    disabled={formData.discountType === 'free_shipping'}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.discountValue ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    } ${formData.discountType === 'free_shipping' ? 'bg-gray-100' : ''}`}
                                    placeholder={formData.discountType === 'percentage' ? 'Nhập phần trăm (1-100)' : 'Nhập giá trị'}
                                    min={formData.discountType === 'percentage' ? '1' : '0'}
                                    max={formData.discountType === 'percentage' ? '100' : undefined}
                                />
                                {errors.discountValue && (
                                    <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>
                                )}
                            </div>

                            {/* Giá trị đơn hàng tối thiểu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá trị đơn hàng tối thiểu (VNĐ) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.minimumOrderValue}
                                    onChange={(e) => handleInputChange('minimumOrderValue', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.minimumOrderValue ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Nhập giá trị tối thiểu"
                                    min="0"
                                />
                                {errors.minimumOrderValue && (
                                    <p className="text-red-500 text-sm mt-1">{errors.minimumOrderValue}</p>
                                )}
                            </div>

                            {/* Giới hạn sử dụng mỗi người */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giới hạn sử dụng mỗi người
                                </label>
                                <input
                                    type="number"
                                    value={formData.usageLimitPerUser}
                                    onChange={(e) => handleInputChange('usageLimitPerUser', parseInt(e.target.value) || 1)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.usageLimitPerUser ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Số lần sử dụng tối đa mỗi người"
                                    min="1"
                                />
                                {errors.usageLimitPerUser && (
                                    <p className="text-red-500 text-sm mt-1">{errors.usageLimitPerUser}</p>
                                )}
                            </div>

                            {/* Giới hạn tổng */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giới hạn tổng (0 = không giới hạn)
                                </label>
                                <input
                                    type="number"
                                    value={formData.usageLimitTotal}
                                    onChange={(e) => handleInputChange('usageLimitTotal', parseInt(e.target.value) || 0)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.usageLimitTotal ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    placeholder="Tổng số lần sử dụng tối đa"
                                    min="0"
                                />
                                {errors.usageLimitTotal && (
                                    <p className="text-red-500 text-sm mt-1">{errors.usageLimitTotal}</p>
                                )}
                            </div>

                            {/* Ngày bắt đầu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày bắt đầu *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.startDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                                )}
                            </div>

                            {/* Ngày kết thúc */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    min={formData.startDate}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        errors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                />
                                {errors.endDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                                )}
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={formData.isActive ? 'true' : 'false'}
                                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                                    disabled={isExpired()}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                        isExpired() ? 'bg-gray-100' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                >
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Không hoạt động</option>
                                </select>
                                {isExpired() && (
                                    <p className="text-yellow-600 text-sm mt-1">
                                        Không thể thay đổi trạng thái của chương trình đã hết hạn
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Nút submit */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Link
                                href="/admin/promotion_order"
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}