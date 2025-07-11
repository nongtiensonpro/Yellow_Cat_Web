// 'use client';
//
// import { useEffect, useState, useCallback, useMemo } from 'react';
// import Link from 'next/link';
// import { Edit } from 'lucide-react';
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
//     const loadData = useCallback(async () => {
//         if (sessionStatus !== 'authenticated') return;
//         const token = session?.accessToken;
//         if (!token) return;
//
//         setLoading(true);
//         try {
//             // Tải toàn bộ dữ liệu, việc lọc sẽ được thực hiện ở client
//             const res = await fetch(`${API_URL}/api/promotion-products`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             const data: APIResponse = await res.json();
//             let arr: RawPromotion[] = [];
//             if (Array.isArray(data.data)) arr = data.data;
//             else if (Array.isArray(data.content)) arr = data.content;
//             else if (Array.isArray(data as unknown)) arr = data as RawPromotion[];
//
//             setPromotions(
//                 arr.map(item => ({
//                     id: item.promotionProductId || item.id || 0,
//                     promotionName: item.promotionName || '',
//                     discountValue: item.discountValue || 0,
//                     discountType: item.discountType || '',
//                     startDate: item.startDate || '',
//                     endDate: item.endDate || '',
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
//                 if (!filters.status) return true; // Không lọc nếu không chọn trạng thái
//                 const now = new Date();
//                 const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
//                 if (filters.status === 'active') return isActive;
//                 if (filters.status === 'inactive') return !isActive;
//                 return true;
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
//                         <option value="inactive">Đã kết thúc</option>
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
//                             const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
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
//                                                 className={`text-xs px-2 py-1 rounded text-white ${
//                                                     isActive ? 'bg-green-500' : 'bg-gray-400'
//                                                 }`}
//                                             >
//                                                 {isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
//                                             </span>
//                                     </td>
//                                     <td className="px-4 py-2 border text-center">
//                                         <Link
//                                             href={`/admin/promotion_products/${promo.id}`}
//                                             className="text-orange-500 hover:text-orange-600 p-1"
//                                             title="Chỉnh sửa"
//                                         >
//                                             <Edit size={16} />
//                                         </Link>
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
import { Edit, Search, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import PromotionGuide from '../../../components/promotion/PromotionGuide';

// --- Các interface không thay đổi ---
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

// --- Các hàm tiện ích không thay đổi ---
function formatDiscount(value: number, type: string): string {
    const t = type.toLowerCase();
    if (t === 'percentage') return `${value}%`;
    if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
    if (t === 'free_shipping') return 'Miễn phí vận chuyển';
    return `${value}`;
}

const formatDateTime = (s: string) => {
    if (!s) return 'N/A';
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


export default function PromotionManagementPage() {
    // --- Các state và hooks không thay đổi về logic ---
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
        if (!token) {
            setLoading(false);
            return;
        };

        setLoading(true);
        try {
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

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // --- Logic lọc và phân trang không thay đổi ---
    const filteredPromotions = useMemo(() => {
        return promotions.filter(promo => {
            const keywordMatch = filters.keyword
                ? promo.promotionName.toLowerCase().includes(filters.keyword.toLowerCase())
                : true;

            const statusMatch = (() => {
                if (!filters.status) return true;
                const now = new Date();
                const startDate = new Date(promo.startDate);
                const endDate = new Date(promo.endDate);
                const isActive = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && now >= startDate && now <= endDate;
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

    // ===== PHẦN GIAO DIỆN ĐƯỢC LÀM MỚI =====
    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý đợt giảm giá</h1>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    {/*<PromotionGuide type="PRODUCT" />*/}
                    <Link
                        href="/admin/promotion_products/create"
                        className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm font-medium"
                    >
                        + Tạo khuyến mãi
                    </Link>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
                <h3 className="font-semibold text-slate-800 mb-4 text-base">Bộ lọc tìm kiếm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Search Input with Icon */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tên chương trình..."
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            value={filters.keyword}
                            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                        />
                    </div>
                    {/* Status Select */}
                    <select
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetFilters}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content: Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">STT</th>
                            <th className="px-6 py-4">Tên chương trình</th>
                            <th className="px-6 py-4 text-center">Giá trị giảm</th>
                            <th className="px-6 py-4 text-center">Bắt đầu</th>
                            <th className="px-6 py-4 text-center">Kết thúc</th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                                        <span>Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : currentPromotions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                        <Inbox size={40} />
                                        <span className="font-medium">Không tìm thấy khuyến mãi</span>
                                        <p className="text-xs">Hãy thử thay đổi bộ lọc hoặc tạo một khuyến mãi mới.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            currentPromotions.map((promo, idx) => {
                                const now = new Date();
                                const startDate = new Date(promo.startDate);
                                const endDate = new Date(promo.endDate);
                                const isActive = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && now >= startDate && now <= endDate;

                                return (
                                    <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{promo.promotionName}</td>
                                        <td className="px-6 py-4 text-center font-mono text-indigo-600">
                                            {formatDiscount(promo.discountValue, promo.discountType)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">{formatDateTime(promo.startDate)}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{formatDateTime(promo.endDate)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    isActive
                                                        ? 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200'
                                                        : 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200'
                                                }`}
                                            >
                                                {isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={`/admin/promotion_products/${promo.id}`}
                                                className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-all"
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
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200">
                         <span className="text-sm text-slate-600">
                            Trang <span className="font-bold">{currentPage}</span> trên <span className="font-bold">{pageCount}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="inline-flex items-center justify-center w-9 h-9 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))}
                                disabled={currentPage === pageCount}
                                className="inline-flex items-center justify-center w-9 h-9 border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
