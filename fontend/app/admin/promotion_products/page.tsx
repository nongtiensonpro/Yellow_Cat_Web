'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

interface CustomSession extends Session {
    accessToken?: string;
}
interface Promotion {
    id: number;
    promotionCode: string;
    promotionName: string;
    discountValue: number;
    discountType: string;
    startDate: string;
    endDate: string;
    isActive: boolean | undefined;
}
interface APIResponse {
    data?: Promotion[] | { content: Promotion[] };
    content?: Promotion[];
}
interface RawPromotion {
    promotionProductId?: number;
    id?: number;
    promotionCode?: string;
    promotionName?: string;
    discountValue?: number;
    discountType?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}

// --- Không thay đổi các hàm logic helper ---
function formatDiscount(value: number, type: string): string {
    const t = type.toLowerCase();
    if (t === 'percentage') return `${value}%`;
    if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
    if (t === 'free_shipping') return 'Miễn phí vận chuyển';
    return `${value}`;
}

// --- Bắt đầu component chính ---
export default function PromotionManagementPage() {
    // --- Toàn bộ state và logic được giữ nguyên ---
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [filters, setFilters] = useState({ keyword: '', status: '' });
    const { data: session, status: sessionStatus } = useSession() as { data: CustomSession | null; status: string };
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xoá đợt giảm giá này?')) return;
        if (sessionStatus !== 'authenticated' || !session?.accessToken) return;
        try {
            await fetch(`${API_URL}/api/promotion-products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            setPromotions(prev => prev.filter(p => p.id !== id));
            alert(' Đã xoá thành công');
        } catch (err) {
            console.error(err);
            alert('Không thể xoá. Vui lòng thử lại.');
        }
    };

    const loadData = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        const token = session?.accessToken;
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/promotion-products/summaries`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data: APIResponse = await res.json();
            let arr: RawPromotion[] = [];
            if (Array.isArray(data)) arr = data as RawPromotion[];
            else if (Array.isArray(data.data)) arr = data.data;
            else if (Array.isArray(data.content)) arr = data.content;
            setPromotions(arr.map(item => ({
                id: item.promotionProductId || item.id || 0,
                promotionCode : item.promotionCode || '',
                promotionName: item.promotionName || '',
                discountValue: item.discountValue || 0,
                discountType: item.discountType || '',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
                isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined,
            })));
        } catch (e) {
            console.error(e);
            alert('Lỗi khi tải dữ liệu khuyến mãi.');
            setPromotions([]);
        } finally {
            setLoading(false);
        }
    }, [session, sessionStatus, API_URL]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { setCurrentPage(1); }, [filters]);

    const formatDateTime = (s: string) => {
        const d = new Date(s);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(d);
    };

    const filteredPromotions = useMemo(() => {
        return promotions.filter(promo => {
            const keywordMatch = filters.keyword ? promo.promotionName.toLowerCase().includes(filters.keyword.toLowerCase()) : true;
            const statusMatch = (() => {
                if (!filters.status) return true;
                const now = new Date();
                const withinDate = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
                const beforeStart = now < new Date(promo.startDate);
                // SỬA LỖI #1: Thay 'ended' bằng 'inactive' để logic bộ lọc hoạt động đúng
                const statusKey = !promo.isActive && promo.isActive !== undefined ? 'inactive' : withinDate ? 'active' : beforeStart ? 'upcoming' : 'inactive';
                return filters.status === statusKey;
            })();
            return keywordMatch && statusMatch;
        });
    }, [promotions, filters]);

    const pageCount = Math.ceil(filteredPromotions.length / itemsPerPage);
    const currentPromotions = filteredPromotions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleResetFilters = () => {
        setFilters({ keyword: '', status: '' });
        setCurrentPage(1);
    };

    // Cấu hình cho badge trạng thái để code sạch hơn
    const statusConfig: { [key: string]: { label: string; className: string } } = {
        inactive: { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-800' },
        active: { label: 'Đang diễn ra', className: 'bg-green-100 text-green-800' },
        upcoming: { label: 'Sắp diễn ra', className: 'bg-yellow-100 text-yellow-800' },
        // Key 'ended' đã bị bình luận (comment out) nên gây ra lỗi
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h4 className="text-xl font-semibold text-slate-700">
                    Quản lý đợt giảm giá
                </h4>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/promotion_products/create"
                        className="inline-flex items-center justify-center bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-sm font-semibold"
                    >
                        + Tạo Khuyến Mãi Mới
                    </Link>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên..."
                            className="w-full border-gray-300 rounded-lg bg-gray-50 pl-10 pr-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            value={filters.keyword}
                            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                        />
                    </div>
                    <select
                        className="w-full border-gray-300 rounded-lg bg-gray-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="upcoming">Sắp diễn ra</option>
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                    <button
                        onClick={handleResetFilters}
                        className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg transition-colors font-medium"
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-6 py-4 font-semibold">STT</th>
                            <th className="px-6 py-4 font-semibold">Mã</th>
                            <th className="px-6 py-4 font-semibold">Tên đợt giảm</th>
                            <th className="px-6 py-4 font-semibold text-center">Giá trị giảm</th>
                            <th className="px-6 py-4 font-semibold text-center">Bắt đầu</th>
                            <th className="px-6 py-4 font-semibold text-center">Kết thúc</th>
                            <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
                                    <div className="flex items-center justify-center gap-3 text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                                        <span>Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : currentPromotions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-gray-500 italic">
                                    Không tìm thấy chương trình khuyến mãi nào.
                                </td>
                            </tr>
                        ) : (
                            currentPromotions.map((promo, idx) => {
                                const now = new Date();
                                const withinDate = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
                                const beforeStart = now < new Date(promo.startDate);
                                // SỬA LỖI #2: Thay 'ended' bằng 'inactive' để không bị crash khi truy cập statusConfig
                                const statusKey = !promo.isActive && promo.isActive !== undefined ? 'inactive' : withinDate ? 'active' : beforeStart ? 'upcoming' : 'inactive';
                                const { label, className } = statusConfig[statusKey];

                                return (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{promo.promotionCode}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{promo.promotionName}</td>
                                        <td className="px-6 py-4 text-center font-mono">{formatDiscount(promo.discountValue, promo.discountType)}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{formatDateTime(promo.startDate)}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{formatDateTime(promo.endDate)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${className}`}>
                                                {label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/admin/promotion_products/${promo.id}`} className="p-2 rounded-full text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 transition-colors" title="Chỉnh sửa">
                                                    <Edit size={16} />
                                                </Link>
                                                <button onClick={() => handleDelete(promo.id)} className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors" title="Xóa">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {pageCount > 1 && !loading && (
                    <div className="flex items-center justify-between gap-4 p-4 border-t border-gray-200">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={16} />
                            Trang trước
                        </button>
                        <span className="text-sm text-gray-700">
                            Trang <span className="font-bold">{currentPage}</span> / <span className="font-bold">{pageCount}</span>
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
                            disabled={currentPage === pageCount}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Trang sau
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}