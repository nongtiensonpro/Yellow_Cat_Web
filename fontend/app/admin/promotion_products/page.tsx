'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import PromotionGuide from '../../../components/promotion/PromotionGuide';

interface CustomSession extends Session {
    accessToken?: string;
}

interface Promotion {
    id: number;
    promotionName: string;
    discountValue: number;
    discountType: string;
    startDate: string;
    endDate: string;
}

interface APIResponse {
    data?: Promotion[] | { content: Promotion[] };
    content?: Promotion[];
}

interface RawPromotion {
    promotionProductId?: number;
    id?: number;
    promotionName?: string;
    discountValue?: number;
    discountType?: string;
    startDate?: string;
    endDate?: string;
}

function formatDiscount(value: number, type: string): string {
    const t = type.toLowerCase();
    if (t === 'percentage') return `${value}%`;
    if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
    if (t === 'free_shipping') return 'Miễn phí vận chuyển';
    return `${value}`;
}

export default function PromotionManagementPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
    });
    const { data: session, status: sessionStatus } = useSession() as { data: CustomSession | null; status: string };
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const loadData = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        const token = session?.accessToken;
        if (!token) return;

        setLoading(true);
        try {
            // Tải toàn bộ dữ liệu, việc lọc sẽ được thực hiện ở client
            const res = await fetch(`${API_URL}/api/promotion-products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data: APIResponse = await res.json();
            let arr: RawPromotion[] = [];
            if (Array.isArray(data.data)) arr = data.data;
            else if (Array.isArray(data.content)) arr = data.content;
            else if (Array.isArray(data as unknown)) arr = data as RawPromotion[];

            setPromotions(
                arr.map(item => ({
                    id: item.promotionProductId || item.id || 0,
                    promotionName: item.promotionName || '',
                    discountValue: item.discountValue || 0,
                    discountType: item.discountType || '',
                    startDate: item.startDate || '',
                    endDate: item.endDate || '',
                }))
            );
        } catch (e) {
            console.error(e);
            alert('Lỗi khi tải dữ liệu khuyến mãi.');
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    }, [session, sessionStatus, API_URL]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Tự động về trang 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const formatDateTime = (s: string) => {
        const d = new Date(s);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(d);
    };

    // **ÁP DỤNG BỘ LỌC TẠI ĐÂY**
    const filteredPromotions = useMemo(() => {
        return promotions.filter(promo => {
            // Lọc theo từ khóa
            const keywordMatch = filters.keyword
                ? promo.promotionName.toLowerCase().includes(filters.keyword.toLowerCase())
                : true;

            // Lọc theo trạng thái
            const statusMatch = (() => {
                if (!filters.status) return true; // Không lọc nếu không chọn trạng thái
                const now = new Date();
                const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
                if (filters.status === 'active') return isActive;
                if (filters.status === 'inactive') return !isActive;
                return true;
            })();

            return keywordMatch && statusMatch;
        });
    }, [promotions, filters]);

    const pageCount = Math.ceil(filteredPromotions.length / itemsPerPage);
    const currentPromotions = filteredPromotions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleResetFilters = () => {
        setFilters({ keyword: '', status: '' });
        setCurrentPage(1);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách Đợt giảm giá</h2>
                <div className="flex items-center gap-3">
                    <PromotionGuide type="PRODUCT" />
                    <Link
                        href="/admin/promotion_products/create"
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium"
                    >
                        + THÊM MỚI
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded border p-4 shadow-sm">
                <h3 className="font-medium text-gray-800 mb-3">Bộ lọc tìm kiếm</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm theo tên..."
                        className="border rounded px-3 py-2"
                        value={filters.keyword}
                        onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                    />
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleResetFilters}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white shadow border rounded">
                <table className="min-w-full text-sm text-left border">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 border">STT</th>
                        <th className="px-4 py-3 border">Tên Đợt giảm giá</th>
                        <th className="px-4 py-3 border">Giá trị</th>
                        <th className="px-4 py-3 border">Bắt đầu</th>
                        <th className="px-4 py-3 border">Kết thúc</th>
                        <th className="px-4 py-3 border">Trạng thái</th>
                        <th className="px-4 py-3 border">Hoạt động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                                    <span className="text-gray-600">Đang tải dữ liệu...</span>
                                </div>
                            </td>
                        </tr>
                    ) : currentPromotions.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                Không có dữ liệu phù hợp
                            </td>
                        </tr>
                    ) : (
                        currentPromotions.map((promo, idx) => {
                            const now = new Date();
                            const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);

                            return (
                                <tr key={promo.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 border text-center">
                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="px-4 py-2 border">{promo.promotionName}</td>
                                    <td className="px-4 py-2 border text-center">
                                        {formatDiscount(promo.discountValue, promo.discountType)}
                                    </td>
                                    <td className="px-4 py-2 border text-center">{formatDateTime(promo.startDate)}</td>
                                    <td className="px-4 py-2 border text-center">{formatDateTime(promo.endDate)}</td>
                                    <td className="px-4 py-2 border text-center">
                                            <span
                                                className={`text-xs px-2 py-1 rounded text-white ${
                                                    isActive ? 'bg-green-500' : 'bg-gray-400'
                                                }`}
                                            >
                                                {isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                                            </span>
                                    </td>
                                    <td className="px-4 py-2 border text-center">
                                        <Link
                                            href={`/admin/promotion_products/${promo.id}`}
                                            className="text-orange-500 hover:text-orange-600 p-1"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>

                {pageCount > 1 && (
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-1 border rounded disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <span className="text-sm">
                            Trang {currentPage} / {pageCount}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
                            disabled={currentPage === pageCount}
                            className="px-4 py-1 border rounded disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}