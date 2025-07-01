'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Calendar, Package, Tag, Users, Edit } from 'lucide-react';

interface PromotionProductDetail {
    promotionProductId: number;
    promotionCode: string;
    promotionName: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    variantId: number;
    sku: string;
    price: number;
    salePrice: number;
    imageUrl: string;
    productName: string;
}

export default function PromotionProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    
    const idRaw = params?.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    const numericId = id ? Number(id) : NaN;
    
    const [detail, setDetail] = useState<PromotionProductDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isNaN(numericId) || !session?.accessToken) return;

        const fetchDetail = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/promotion-products/${numericId}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });
                
                if (!res.ok) throw new Error('Không thể tải thông tin');
                
                const result = await res.json();
                setDetail(result.data);
            } catch (error) {
                console.error('Lỗi khi tải chi tiết:', error);
                alert('Không thể tải thông tin đợt giảm giá!');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [numericId, session?.accessToken]);

    const formatDateTime = (dateStr: string) => {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(dateStr));
    };

    const formatDiscount = (value: number, type: string) => {
        const t = type.toLowerCase();
        if (t === 'percentage') return `${value}%`;
        if (t === 'fixed_amount') return `${value.toLocaleString()}₫`;
        if (t === 'free_shipping') return 'Miễn phí vận chuyển';
        return `${value}`;
    };

    const getDiscountTypeLabel = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'percentage') return 'Giảm theo %';
        if (t === 'fixed_amount') return 'Giảm số tiền';
        if (t === 'free_shipping') return 'Miễn phí vận chuyển';
        return type;
    };

    const isActive = detail ? 
        new Date() >= new Date(detail.startDate) && new Date() <= new Date(detail.endDate) : false;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Không tìm thấy thông tin đợt giảm giá</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Chi tiết đợt giảm giá</h1>
                </div>
                
                <button
                    onClick={() => router.push(`/admin/promotion_products/${id}/edit`)}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                    <Edit size={16} />
                    Chỉnh sửa
                </button>
            </div>

            {/* Promotion Info Card */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{detail.promotionName}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Tag className="text-blue-600" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Mã khuyến mãi</p>
                                <p className="font-semibold">{detail.promotionCode}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Users className="text-purple-600" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Loại giảm</p>
                                <p className="font-semibold">{getDiscountTypeLabel(detail.discountType)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Package className="text-orange-600" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Giá trị giảm</p>
                                <p className="font-semibold text-lg text-red-600">
                                    {formatDiscount(detail.discountValue, detail.discountType)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-green-600" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Thời gian bắt đầu</p>
                                <p className="font-semibold">{formatDateTime(detail.startDate)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="text-red-600" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Thời gian kết thúc</p>
                                <p className="font-semibold">{formatDateTime(detail.endDate)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Info Card */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sản phẩm áp dụng</h3>
                
                <div className="flex items-start gap-4">
                    {detail.imageUrl && (
                        <img
                            src={detail.imageUrl}
                            alt={detail.productName}
                            className="w-20 h-20 object-cover rounded-lg border"
                        />
                    )}
                    
                    <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-gray-800">{detail.productName}</h4>
                        <p className="text-sm text-gray-600">SKU: {detail.sku}</p>
                        
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Giá gốc</p>
                                <p className="font-semibold">{detail.price?.toLocaleString()}₫</p>
                            </div>
                            
                            {detail.salePrice && detail.salePrice < detail.price && (
                                <div>
                                    <p className="text-sm text-gray-600">Giá sale</p>
                                    <p className="font-semibold text-red-600">{detail.salePrice.toLocaleString()}₫</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => router.push('/admin/promotion_products')}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                    Trở về danh sách
                </button>
            </div>
        </div>
    );
} 