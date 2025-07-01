'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Eye, Edit, Trash2, Info } from 'lucide-react';
import PromotionGuide from '../../../../components/promotion/PromotionGuide';

interface Voucher {
    id: number;
    promotionCode: string;
    promotionName: string;
    discountType: string;
    discountValue: number;
    description: string;
    startDate: string;
    endDate: string;
}

// Hàm format discount chuẩn (giống promotion products)
function formatDiscount(value: number, type: string): string {
    const t = type.toLowerCase();
    if (t === 'percentage') return `${value}%`;
    if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`;
    if (t === 'free_shipping') return 'Miễn phí vận chuyển';
    return `${value}`;
}

export default function VouchersPage() {
    const searchParams = useSearchParams();
    const initialPage = Number(searchParams?.get('page')) || 1;

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const itemsPerPage = 5;
    const [totalPages, setTotalPages] = useState(1);
    
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        discountType: '',
        discountValue: '',
    });

    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated') return;

        const token = session?.accessToken;
        if (!token) {
            alert('Bạn cần đăng nhập để xem danh sách voucher.');
            return;
        }

        const queryParams = new URLSearchParams();
        if (filters.keyword) queryParams.append('keyword', filters.keyword);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.discountType) queryParams.append('discountType', filters.discountType);
        if (filters.discountValue) queryParams.append('discountValue', filters.discountValue);
        
        // Convert currentPage to zero-based for API
        queryParams.append('page', (currentPage - 1).toString());
        queryParams.append('size', itemsPerPage.toString());
        queryParams.append('sort', 'createdAt,desc');

        setLoading(true);
        fetch(`http://localhost:8080/api/promotions?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setVouchers(data.data.content || []);
                setTotalPages(data.data.totalPages || 1);
            })
            .catch((error) => {
                console.error('Không thể tải vouchers:', error);
                alert('Lỗi khi tải dữ liệu vouchers.');
            })
            .finally(() => setLoading(false));
    }, [filters, currentPage, session, status]);

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xoá voucher này?')) return;
        
        const token = session?.accessToken;
        if (!token) {
            alert('Bạn chưa đăng nhập hoặc token không tồn tại!');
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/promotions/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                setVouchers((prev) => prev.filter((v) => v.id !== id));
                alert('✅ Xóa voucher thành công!');
            } else {
                throw new Error('Xoá không thành công.');
            }
        } catch (err: any) {
            alert('❌ Lỗi: ' + (err.message || 'Có lỗi xảy ra khi xoá voucher.'));
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    };

    const pageCount = totalPages;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Danh sách Voucher (Mã giảm giá)</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý mã giảm giá cho đơn hàng tại checkout</p>
                </div>
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

            {/* Info Card */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-orange-800 mb-1">🎫 Voucher hoạt động như thế nào?</h3>
                        <p className="text-sm text-orange-700 mb-2">
                            Tạo mã giảm giá → Customer nhập mã tại checkout → Giảm giá áp dụng cho toàn bộ đơn hàng
                        </p>
                        <div className="text-xs text-orange-600 space-y-1">
                            <p><strong>Ví dụ:</strong> Mã "FREESHIP50" → Đơn từ 300k → Giảm 50k phí ship</p>
                            <p><strong>Phù hợp:</strong> Email marketing, Tặng VIP, Khuyến khích đơn hàng lớn</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded border p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên voucher"
                        className="border rounded px-3 py-2"
                        value={filters.keyword}
                        onChange={(e) =>
                            setFilters({ ...filters, keyword: e.target.value })
                        }
                    />
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.status}
                        onChange={(e) =>
                            setFilters({ ...filters, status: e.target.value })
                        }
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang diễn ra</option>
                        <option value="inactive">Đã kết thúc</option>
                    </select>
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.discountType}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                discountType: e.target.value,
                                discountValue: '',
                            })
                        }
                    >
                        <option value="">Tất cả loại giảm</option>
                        <option value="percentage">Giảm theo %</option>
                        <option value="fixed_amount">Giảm số tiền</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                    </select>
                    
                    {filters.discountType && filters.discountType !== 'free_shipping' && (
                        <input
                            type="number"
                            placeholder={`Nhập giá trị ${filters.discountType === 'percentage' ? '(%)' : '(VNĐ)'}`}
                            className="border rounded px-3 py-2"
                            value={filters.discountValue}
                            onChange={(e) =>
                                setFilters({ ...filters, discountValue: e.target.value })
                            }
                        />
                    )}
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => {
                            setFilters({
                                keyword: '',
                                status: '',
                                discountType: '',
                                discountValue: '',
                            });
                            setCurrentPage(1);
                        }}
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
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        <span className="text-gray-600">Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : vouchers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                    Không có dữ liệu phù hợp
                                </td>
                            </tr>
                        ) : (
                            vouchers.map((voucher, index) => {
                                const now = new Date();
                                const isActive = now >= new Date(voucher.startDate) && now <= new Date(voucher.endDate);

                                return (
                                    <tr key={voucher.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2 border text-center">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-4 py-2 border font-mono text-blue-600">
                                            {voucher.promotionCode}
                                        </td>
                                        <td className="px-4 py-2 border">{voucher.promotionName}</td>
                                        <td className="px-4 py-2 border text-center">
                                            {formatDiscount(voucher.discountValue, voucher.discountType)}
                                        </td>
                                        <td className="px-4 py-2 border text-center">
                                            <span className={`text-xs px-2 py-1 rounded text-white ${
                                                isActive ? 'bg-green-500' : 'bg-gray-400'
                                            }`}>
                                                {isActive ? 'Đang diễn ra' : 'Hết hạn'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 border text-center">
                                            {formatDateTime(voucher.startDate)}
                                        </td>
                                        <td className="px-4 py-2 border text-center">
                                            {formatDateTime(voucher.endDate)}
                                        </td>
                                        <td className="px-4 py-2 border text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={`/admin/promotion_management/vouchers/${voucher.id}`}
                                                    className="text-blue-500 hover:text-blue-600 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <Link
                                                    href={`/admin/promotion_management/vouchers/${voucher.id}/edit`}
                                                    className="text-orange-500 hover:text-orange-600 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(voucher.id)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                    title="Xóa"
                                                >
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

                {pageCount > 1 && (
                    <div className="flex justify-center items-center mt-4 gap-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Trước
                        </button>
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded-full text-sm border ${
                                    page === currentPage
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, pageCount))
                            }
                            disabled={currentPage === pageCount}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
