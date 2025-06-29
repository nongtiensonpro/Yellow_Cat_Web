
'use client';

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Promotion {
    id: number
    promotionName: string
    discountValue: number
    discountType: string
    startDate: string
    endDate: string
}

// Hàm format discount chuẩn
function formatDiscount(value: number, type: string): string {
    const t = type.toLowerCase()
    if (t === 'percentage') return `${value}%`
    if (t === 'fixed' || t === 'fixed_amount') return `${value.toLocaleString()} ₫`
    if (t === 'free_shipping') return 'Miễn phí vận chuyển'
    return `${value}`
}

export default function PromotionManagementPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([])
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        discountType: '',
        discountValue: '',
    })
    const { data: session, status } = useSession()

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    useEffect(() => {
        if (status !== 'authenticated') return

        const token = session?.accessToken
        if (!token) {
            alert('Bạn cần đăng nhập để xem danh sách khuyến mãi.')
            return
        }

        const queryParams = new URLSearchParams()
        if (filters.keyword) queryParams.append('keyword', filters.keyword)
        if (filters.status) queryParams.append('status', filters.status)
        if (filters.discountType) queryParams.append('discountType', filters.discountType)
        if (filters.discountValue) queryParams.append('discountValue', filters.discountValue)

        fetch(`${API_URL}/api/promotion-products?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                const mapped: Promotion[] = data.map((item: any) => ({
                    id: item.promotionProductId,
                    promotionName: item.promotionName,
                    discountValue: item.discountValue,
                    discountType: item.discountType,
                    startDate: item.startDate,
                    endDate: item.endDate,
                }))
                setPromotions(mapped)
            })
            .catch((error) => {
                console.error('Không thể tải khuyến mãi:', error)
                alert('Lỗi khi tải dữ liệu khuyến mãi.')
            })
    }, [filters, session, status])

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date)
    }

    const pageCount = Math.ceil(promotions.length / itemsPerPage)
    const currentPromotions = promotions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách Đợt giảm giá</h2>
                <Link
                    href="/admin/promotion_products/create"
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium"
                >
                    + THÊM MỚI
                </Link>
            </div>

            <div className="bg-white rounded border p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm theo tên đợt giảm giá"
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
                        <option value="">Trạng thái</option>
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
                        <option value="">Loại giảm</option>
                        <option value="percentage">Giảm theo %</option>
                        <option value="fixed_amount">Giảm số tiền</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                    </select>
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => {
                            setFilters({
                                keyword: '',
                                status: '',
                                discountType: '',
                                discountValue: '',
                            })
                            setCurrentPage(1)
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
                        <th className="px-4 py-3 border">Tên Đợt giảm giá</th>
                        <th className="px-4 py-3 border">Giá trị</th>
                        <th className="px-4 py-3 border">Trạng thái</th>
                        <th className="px-4 py-3 border">Bắt đầu</th>
                        <th className="px-4 py-3 border">Kết thúc</th>
                        <th className="px-4 py-3 border">Hoạt động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentPromotions.map((promo, index) => {
                        const now = new Date()
                        const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate)

                        return (
                            <tr key={promo.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 border text-center">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td className="px-4 py-2 border">{promo.promotionName}</td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDiscount(promo.discountValue, promo.discountType)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                    <span className={`text-xs px-2 py-1 rounded text-white ${
                        isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {isActive ? 'Đang diễn ra' : 'Hết hạn'}
                    </span>
                                </td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDateTime(promo.startDate)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                    {formatDateTime(promo.endDate)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                    <Link
                                        href={`/admin/promotion-products/${promo.id}`}
                                        className="text-orange-500 hover:text-orange-600"
                                    >
                                        <Eye size={18} />
                                    </Link>
                                </td>
                            </tr>
                        )
                    })}
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
    )
}