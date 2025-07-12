'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import PromotionGuide from '@/components/promotion/PromotionGuide';

interface Voucher {
    voucherId: number;
    voucherCode: string;
    voucherName: string;
    discountType: string;
    discountValue: number;
    minimumOrderValue: number;
    maximumDiscountValue: number;
    usageLimitPerUser: number;
    usageLimitTotal: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export default function VouchersPage() {
    const searchParams = useSearchParams();
    const initialPage = Number(searchParams?.get('page')) || 1;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Bộ lọc
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        discountType: '',
        discountValue: '',
    });

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const itemsPerPage = 5;
    const [totalPages, setTotalPages] = useState(1);

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated') return;
        (async () => {
            setLoading(true);
            const token = (session as { accessToken: string }).accessToken;
            const qp = new URLSearchParams();

            // Áp dụng bộ lọc
            if (filters.keyword) qp.append('keyword', filters.keyword);
            if (filters.status) qp.append('status', filters.status);
            if (filters.discountType) {
                qp.append('discountType', filters.discountType);
                if (filters.discountValue) qp.append('discountValue', filters.discountValue);
            }

            qp.append('page', String(currentPage - 1));
            qp.append('size', String(itemsPerPage));
            qp.append('sort', 'createdAt,desc');

            try {
                const res = await fetch(`${API_URL}/api/vouchers?${qp}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                const page = json.data;  // Page object trong ApiResponse.data
                console.log('API Response:', json);
                console.log('Page data:', page);
                console.log('Page structure keys:', Object.keys(page));
                console.log('Total pages:', page.totalPages || page.page?.totalPages);
                console.log('Content length:', page.content?.length);
                console.log('Page metadata:', page.page);
                setVouchers(page.content || []);
                setTotalPages(page.totalPages || page.page?.totalPages || 1);
                console.log('Set totalPages to:', page.totalPages || page.page?.totalPages || 1);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [status, session, currentPage, filters, API_URL]);

    const formatDiscount = (value: number, type: string) => {
        const t = type.toLowerCase();
        if (t === 'percentage') return `${value}%`;
        if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
        if (t === 'free_shipping') return 'Miễn phí vận chuyển';
        return String(value);
    };

    const formatDateTime = (s: string) =>
        new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(s));

    const handlePageChange = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setCurrentPage(p);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xoá voucher này?')) return;
        const token = (session as { accessToken: string }).accessToken;
        try {
            const res = await fetch(`${API_URL}/api/vouchers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Xoá không thành công');
            setVouchers(vouchers.filter(v => v.voucherId !== id));
            alert('Xóa thành công!');
        } catch (e) {
            alert('Lỗi: ' + e);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách phiếu giảm giá</h2>
                <div className="flex items-center gap-3">
                    <PromotionGuide type="VOUCHER" />
                    <Link
                        href="/admin/promotion_management/vouchers/create"
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium"
                    >
                        + THÊM MỚI
                    </Link>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white rounded border p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên..."
                        className="border rounded px-3 py-2"
                        value={filters.keyword}
                        onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
                    />
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.discountType}
                        onChange={e =>
                            setFilters(f => ({ ...f, discountType: e.target.value, discountValue: '' }))
                        }
                    >
                        <option value="">Tất cả loại giảm</option>
                        <option value="percentage">Giảm theo %</option>
                        <option value="fixed_amount">Giảm số tiền</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                    </select>
                    {/*{filters.discountType && filters.discountType !== 'free_shipping' && (*/}
                    {/*    <input*/}
                    {/*        type="number"*/}
                    {/*        placeholder={*/}
                    {/*            filters.discountType === 'percentage'*/}
                    {/*                ? 'Nhập %'*/}
                    {/*                : 'Nhập VNĐ'*/}
                    {/*        }*/}
                    {/*        className="border rounded px-3 py-2"*/}
                    {/*        value={filters.discountValue}*/}
                    {/*        onChange={e =>*/}
                    {/*            setFilters(f => ({ ...f, discountValue: e.target.value }))*/}
                    {/*        }*/}
                    {/*    />*/}
                    {/*)}*/}
                </div>
                <div className="mt-4">
                    <button
                        onClick={() =>
                            setFilters({ keyword: '', status: '', discountType: '', discountValue: '' })
                        }
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white shadow border rounded">
                <table className="min-w-full text-sm text-left border">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 border">STT</th>
                        <th className="px-4 py-3 border">Mã voucher</th>
                        <th className="px-4 py-3 border">Tên voucher</th>
                        <th className="px-4 py-3 border">Giá trị</th>
                        <th className="px-4 py-3 border">Trạng thái</th>
                        <th className="px-4 py-3 border">Bắt đầu</th>
                        <th className="px-4 py-3 border">Kết thúc</th>
                        <th className="px-4 py-3 border">Hoạt động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center">
                                Đang tải dữ liệu...
                            </td>
                        </tr>
                    ) : vouchers.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                Không có dữ liệu phù hợp
                            </td>
                        </tr>
                    ) : (
                        vouchers.map((v, idx) => (
                            <tr key={v.voucherId} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 border text-center">
                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="px-4 py-2 border font-mono text-blue-600">
                                    {v.voucherCode}
                                </td>
                                <td className="px-4 py-2 border">{v.voucherName}</td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDiscount(v.discountValue, v.discountType)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                    <span
                        className={`text-xs px-2 py-1 rounded text-white ${
                            v.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    >
                      {v.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                                </td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDateTime(v.startDate)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDateTime(v.endDate)}
                                </td>
                                <td className="px-4 py-2 border">
                                    <div className="flex items-center justify-center space-x-2">
                                        <Link
                                            href={`/admin/promotion_management/vouchers/${v.voucherId}`}
                                            className="p-1 rounded hover:bg-orange-100 transition"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={16} className="text-orange-500 hover:text-orange-600" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(v.voucherId)}
                                            className="p-1 rounded hover:bg-red-100 transition"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} className="text-red-500 hover:text-red-600" />
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {(() => {
                console.log('Render - totalPages:', totalPages, 'loading:', loading);
                return !loading && totalPages > 1 ? (
                <div className="flex justify-center items-center mt-4 gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-full text-sm border flex items-center justify-center ${
                                p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
                ) : null;
            })()}
        </div>
    );
}
