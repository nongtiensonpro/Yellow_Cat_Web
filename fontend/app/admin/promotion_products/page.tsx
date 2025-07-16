// 'use client';
//
// import { useEffect, useState, useCallback, useMemo } from 'react';
// import Link from 'next/link';
// import { Edit, Trash2 } from 'lucide-react';
// import { useSession } from 'next-auth/react';
// import { Session } from 'next-auth';
// import PromotionGuide from '../../../components/promotion/PromotionGuide';
//
// interface CustomSession extends Session {
//     accessToken?: string;
// }
//
// interface Promotion {
//     id: number;
//     promotionName: string;
//     discountValue: number;
//     discountType: string;
//     startDate: string;
//     endDate: string;
//     isActive: boolean | undefined;
// }
//
// interface APIResponse {
//     data?: Promotion[] | { content: Promotion[] };
//     content?: Promotion[];
// }
//
// interface RawPromotion {
//     promotionProductId?: number;
//     id?: number;
//     promotionName?: string;
//     discountValue?: number;
//     discountType?: string;
//     startDate?: string;
//     endDate?: string;
//     isActive?: boolean;
// }
//
// function formatDiscount(value: number, type: string): string {
//     const t = type.toLowerCase();
//     if (t === 'percentage') return `${value}%`;
//     if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
//     if (t === 'free_shipping') return 'Miễn phí vận chuyển';
//     return `${value}`;
// }
//
// export default function PromotionManagementPage() {
//     const [promotions, setPromotions] = useState<Promotion[]>([]);
//     const [filters, setFilters] = useState({
//         keyword: '',
//         status: '',
//     });
//     const { data: session, status: sessionStatus } = useSession() as { data: CustomSession | null; status: string };
//     const [loading, setLoading] = useState(true);
//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 5;
//     const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
//
//     const handleDelete = async (id: number) => {
//         if (!confirm('Bạn có chắc muốn xoá đợt giảm giá này?')) return;
//         if (sessionStatus !== 'authenticated' || !session?.accessToken) return;
//         try {
//             await fetch(`${API_URL}/api/promotion-products/${id}`, {
//                 method: 'DELETE',
//                 headers: { Authorization: `Bearer ${session.accessToken}` },
//             });
//             // Cập nhật local state
//             setPromotions(prev => prev.filter(p => p.id !== id));
//             alert('🗑️ Đã xoá thành công');
//         } catch (err) {
//             console.error(err);
//             alert('Không thể xoá. Vui lòng thử lại.');
//         }
//     };
//
//     const loadData = useCallback(async () => {
//         if (sessionStatus !== 'authenticated') return;
//         const token = session?.accessToken;
//         if (!token) return;
//
//         setLoading(true);
//         try {
//             // Tải toàn bộ dữ liệu, việc lọc sẽ được thực hiện ở client
//             const res = await fetch(`${API_URL}/api/promotion-products/summaries`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             const data: APIResponse = await res.json();
//             let arr: RawPromotion[] = [];
//             if (Array.isArray(data)) arr = data as RawPromotion[];
//             else if (Array.isArray(data.data)) arr = data.data;
//             else if (Array.isArray(data.content)) arr = data.content;
//
//             setPromotions(
//                 arr.map(item => ({
//                     id: item.promotionProductId || item.id || 0,
//                     promotionName: item.promotionName || '',
//                     discountValue: item.discountValue || 0,
//                     discountType: item.discountType || '',
//                     startDate: item.startDate || '',
//                     endDate: item.endDate || '',
//                     isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined,
//                 }))
//             );
//         } catch (e) {
//             console.error(e);
//             alert('Lỗi khi tải dữ liệu khuyến mãi.');
//             setPromotions([]);
//         } finally {
//             setLoading(false);
//         }
//     }, [session, sessionStatus, API_URL]);
//
//     useEffect(() => {
//         loadData();
//     }, [loadData]);
//
//     // Tự động về trang 1 khi filter thay đổi
//     useEffect(() => {
//         setCurrentPage(1);
//     }, [filters]);
//
//     const formatDateTime = (s: string) => {
//         const d = new Date(s);
//         return new Intl.DateTimeFormat('vi-VN', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             hour12: false,
//         }).format(d);
//     };
//
//     // **ÁP DỤNG BỘ LỌC TẠI ĐÂY**
//     const filteredPromotions = useMemo(() => {
//         return promotions.filter(promo => {
//             // Lọc theo từ khóa
//             const keywordMatch = filters.keyword
//                 ? promo.promotionName.toLowerCase().includes(filters.keyword.toLowerCase())
//                 : true;
//
//             // Lọc theo trạng thái
//             const statusMatch = (() => {
//                 if (!filters.status) return true; // Không lọc nếu không chọn
//                 const now = new Date();
//                 const withinDate = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
//                 const beforeStart = now < new Date(promo.startDate);
//
//                 const statusKey = !promo.isActive && promo.isActive !== undefined
//                     ? 'inactive'
//                     : withinDate
//                         ? 'active'
//                         : beforeStart
//                             ? 'upcoming'
//                             : 'ended';
//
//                 return filters.status === statusKey;
//             })();
//
//             return keywordMatch && statusMatch;
//         });
//     }, [promotions, filters]);
//
//     const pageCount = Math.ceil(filteredPromotions.length / itemsPerPage);
//     const currentPromotions = filteredPromotions.slice(
//         (currentPage - 1) * itemsPerPage,
//         currentPage * itemsPerPage
//     );
//
//     const handleResetFilters = () => {
//         setFilters({ keyword: '', status: '' });
//         setCurrentPage(1);
//     };
//
//     return (
//         <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//             <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-xl font-semibold text-gray-800">Danh sách Đợt giảm giá</h2>
//                 <div className="flex items-center gap-3">
//                     <PromotionGuide type="PRODUCT" />
//                     <Link
//                         href="/admin/promotion_products/create"
//                         className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium"
//                     >
//                         + THÊM MỚI
//                     </Link>
//                 </div>
//             </div>
//
//             <div className="bg-white rounded border p-4 shadow-sm">
//                 <h3 className="font-medium text-gray-800 mb-3">Bộ lọc tìm kiếm</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
//                     <input
//                         type="text"
//                         placeholder="Tìm theo tên..."
//                         className="border rounded px-3 py-2"
//                         value={filters.keyword}
//                         onChange={e => setFilters({ ...filters, keyword: e.target.value })}
//                     />
//                     <select
//                         className="border rounded px-3 py-2"
//                         value={filters.status}
//                         onChange={e => setFilters({ ...filters, status: e.target.value })}
//                     >
//                         <option value="">Tất cả trạng thái</option>
//                         <option value="active">Đang diễn ra</option>
//                         <option value="upcoming">Sắp diễn ra</option>
//                         <option value="ended">Đã kết thúc</option>
//                         <option value="inactive">Không hoạt động</option>
//                     </select>
//                 </div>
//                 <div className="mt-4">
//                     <button
//                         onClick={handleResetFilters}
//                         className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
//                     >
//                         Làm mới bộ lọc
//                     </button>
//                 </div>
//             </div>
//
//             <div className="overflow-x-auto bg-white shadow border rounded">
//                 <table className="min-w-full text-sm text-left border">
//                     <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
//                     <tr>
//                         <th className="px-4 py-3 border">STT</th>
//                         <th className="px-4 py-3 border">Tên Đợt giảm giá</th>
//                         <th className="px-4 py-3 border">Giá trị</th>
//                         <th className="px-4 py-3 border">Bắt đầu</th>
//                         <th className="px-4 py-3 border">Kết thúc</th>
//                         <th className="px-4 py-3 border">Trạng thái</th>
//                         <th className="px-4 py-3 border">Hoạt động</th>
//                     </tr>
//                     </thead>
//                     <tbody>
//                     {loading ? (
//                         <tr>
//                             <td colSpan={7} className="px-4 py-8 text-center">
//                                 <div className="flex items-center justify-center gap-2">
//                                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
//                                     <span className="text-gray-600">Đang tải dữ liệu...</span>
//                                 </div>
//                             </td>
//                         </tr>
//                     ) : currentPromotions.length === 0 ? (
//                         <tr>
//                             <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
//                                 Không có dữ liệu phù hợp
//                             </td>
//                         </tr>
//                     ) : (
//                         currentPromotions.map((promo, idx) => {
//                             const now = new Date();
//                             const withinDate = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
//                             const beforeStart = now < new Date(promo.startDate);
//
//                             const statusLabel = !promo.isActive && promo.isActive !== undefined
//                                 ? 'Không hoạt động'
//                                 : withinDate
//                                     ? 'Đang diễn ra'
//                                     : beforeStart
//                                         ? 'Sắp diễn ra'
//                                         : 'Đã kết thúc';
//                             const badgeClass = (() => {
//                                 if (statusLabel === 'Không hoạt động') return 'bg-gray-500';
//                                 if (statusLabel === 'Đang diễn ra') return 'bg-green-500';
//                                 if (statusLabel === 'Sắp diễn ra') return 'bg-yellow-500';
//                                 return 'bg-gray-400';
//                             })();
//
//                             return (
//                                 <tr key={promo.id} className="border-b hover:bg-gray-50">
//                                     <td className="px-4 py-2 border text-center">
//                                         {(currentPage - 1) * itemsPerPage + idx + 1}
//                                     </td>
//                                     <td className="px-4 py-2 border">{promo.promotionName}</td>
//                                     <td className="px-4 py-2 border text-center">
//                                         {formatDiscount(promo.discountValue, promo.discountType)}
//                                     </td>
//                                     <td className="px-4 py-2 border text-center">{formatDateTime(promo.startDate)}</td>
//                                     <td className="px-4 py-2 border text-center">{formatDateTime(promo.endDate)}</td>
//                                     <td className="px-4 py-2 border text-center">
//                                             <span
//                                                 className={`text-xs px-2 py-1 rounded text-white ${badgeClass}`}
//                                             >
//                                                 {statusLabel}
//                                             </span>
//                                     </td>
//                                     <td className="px-4 py-2 border text-center flex items-center justify-center gap-2">
//                                         <Link
//                                             href={`/admin/promotion_products/${promo.id}`}
//                                             className="text-orange-500 hover:text-orange-600 p-1"
//                                             title="Chỉnh sửa"
//                                         >
//                                             <Edit size={16} />
//                                         </Link>
//                                         <button
//                                             onClick={() => handleDelete(promo.id)}
//                                             className="text-red-500 hover:text-red-600 p-1"
//                                             aria-label="Xóa"
//                                         >
//                                             <Trash2 size={16} />
//                                         </button>
//                                     </td>
//                                 </tr>
//                             );
//                         })
//                     )}
//                     </tbody>
//                 </table>
//
//                 {pageCount > 1 && (
//                     <div className="flex items-center justify-center gap-4 py-4">
//                         <button
//                             onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
//                             disabled={currentPage === 1}
//                             className="px-4 py-1 border rounded disabled:opacity-50"
//                         >
//                             Trước
//                         </button>
//                         <span className="text-sm">
//                             Trang {currentPage} / {pageCount}
//                         </span>
//                         <button
//                             onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
//                             disabled={currentPage === pageCount}
//                             className="px-4 py-1 border rounded disabled:opacity-50"
//                         >
//                             Sau
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }


'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
// Thêm các icon mới để giao diện đẹp hơn
import { Edit, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import PromotionGuide from '../../../components/promotion/PromotionGuide';

// --- Không thay đổi các interface ---
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
    isActive: boolean | undefined;
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
                const statusKey = !promo.isActive && promo.isActive !== undefined ? 'inactive' : withinDate ? 'active' : beforeStart ? 'upcoming' : 'ended';
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
        // ended: { label: 'Đã kết thúc', className: 'bg-red-100 text-red-800' },
    };

    return (
        // --- BẮT ĐẦU PHẦN THAY ĐỔI GIAO DIỆN ---
        <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h4 className="text-xl font-semibold text-slate-700">
                    Quản lý đợt giảm giá
                </h4>
                <div className="flex items-center gap-3">
                    {/*<PromotionGuide type="PRODUCT" />*/}
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
                    {/* Input tìm kiếm với icon */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên khuyến mãi..."
                            className="w-full border-gray-300 rounded-lg bg-gray-50 pl-10 pr-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                            value={filters.keyword}
                            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                        />
                    </div>
                    {/* Select box */}
                    <select
                        className="w-full border-gray-300 rounded-lg bg-gray-50 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="upcoming">Sắp diễn ra</option>
                        {/*<option value="ended">Đã kết thúc</option>*/}
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                    {/* Nút làm mới */}
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
                            <th className="px-6 py-4 font-semibold">Tên Khuyến Mãi</th>
                            <th className="px-6 py-4 font-semibold text-center">Giá trị</th>
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
                                const statusKey = !promo.isActive && promo.isActive !== undefined ? 'inactive' : withinDate ? 'active' : beforeStart ? 'upcoming' : 'ended';
                                const { label, className } = statusConfig[statusKey];

                                return (
                                    <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
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