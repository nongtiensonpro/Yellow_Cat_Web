'use client';

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Eye, Edit, Info, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import PromotionGuide from '../../../components/promotion/PromotionGuide'

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
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

    const loadData = useCallback(async () => {
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

        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/promotion-products?${queryParams.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await response.json()
            
            console.log('API Response:', data) // Debug log
            
            // Kiểm tra và xử lý response structure
            let dataArray = data
            if (data && typeof data === 'object') {
                // Nếu data có structure { data: [...] } hoặc { content: [...] }
                if (data.data && Array.isArray(data.data)) {
                    dataArray = data.data
                } else if (data.content && Array.isArray(data.content)) {
                    dataArray = data.content
                } else if (!Array.isArray(data)) {
                    dataArray = []
                }
            }
            
            // Đảm bảo dataArray là array
            if (!Array.isArray(dataArray)) {
                console.warn('API response is not an array:', dataArray)
                dataArray = []
            }
            
            const mapped: Promotion[] = dataArray.map((item: any) => ({
                id: item.promotionProductId || item.id,
                promotionName: item.promotionName || '',
                discountValue: item.discountValue || 0,
                discountType: item.discountType || '',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
            }))
            setPromotions(mapped)
        } catch (error) {
            console.error('Không thể tải khuyến mãi:', error)
            alert('Lỗi khi tải dữ liệu khuyến mãi.')
            setPromotions([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }, [filters, session, status, API_URL])

    const handleDelete = async (promotion: Promotion) => {
        const now = new Date()
        const isActive = now >= new Date(promotion.startDate) && now <= new Date(promotion.endDate)
        
        if (isActive) {
            alert('❌ Không thể xóa đợt giảm giá đang hoạt động!')
            return
        }

        const confirmMessage = `⚠️ BẠN CHẮC CHẮN MUỐN XÓA ĐỢT GIẢM GIÁ NÀY?

📋 Tên: ${promotion.promotionName}
💰 Giảm: ${formatDiscount(promotion.discountValue, promotion.discountType)}
📅 Từ: ${formatDateTime(promotion.startDate)}
📅 Đến: ${formatDateTime(promotion.endDate)}

❗ CẢNH BÁO: 
• Toàn bộ đợt giảm giá sẽ bị xóa vĩnh viễn
• Tất cả sản phẩm trong đợt này sẽ không còn giảm giá
• Hành động này KHÔNG THỂ HOÀN TÁC

Nhấn OK để xác nhận xóa, Cancel để hủy bỏ.`

        if (!window.confirm(confirmMessage)) {
            return
        }

        setDeletingId(promotion.id)

        try {
            await axios.delete(`${API_URL}/api/promotion-products/${promotion.id}`, {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            })

            alert('✅ Xóa đợt giảm giá thành công!')
            
            // Reload data
            await loadData()
            
            // Reset page if current page becomes empty
            const newTotalItems = promotions.length - 1
            const newPageCount = Math.ceil(newTotalItems / itemsPerPage)
            if (currentPage > newPageCount && newPageCount > 0) {
                setCurrentPage(newPageCount)
            }
        } catch (err: any) {
            console.error('Lỗi khi xóa:', err)
            
            const errorMessage = err?.response?.data?.message || 
                               err?.response?.data?.error ||
                               err?.response?.data ||
                               err.message ||
                               'Lỗi không xác định'
                               
            if (errorMessage.includes('không có quyền') || errorMessage.includes('unauthorized')) {
                alert('❌ Lỗi quyền truy cập: Bạn không có quyền xóa đợt giảm giá này. Chỉ người tạo ra đợt giảm giá mới có quyền xóa.')
            } else if (err?.response?.status === 404) {
                alert('❌ Không tìm thấy đợt giảm giá cần xóa.')
            } else if (err?.response?.status === 401) {
                alert('❌ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            } else {
                alert('❌ Lỗi khi xóa: ' + errorMessage)
            }
        } finally {
            setDeletingId(null)
        }
    }

    useEffect(() => {
        loadData()
    }, [loadData])

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

    // Statistics
    const now = new Date()
    const activePromotions = promotions.filter(p => 
        now >= new Date(p.startDate) && now <= new Date(p.endDate)
    ).length
    const expiredPromotions = promotions.filter(p => 
        now > new Date(p.endDate)
    ).length

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Danh sách Đợt giảm giá</h2>
                    <p className="text-sm text-gray-600 mt-1">Quản lý giảm giá áp dụng trực tiếp lên sản phẩm cụ thể</p>
                </div>
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

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-blue-800 mb-1">💡 Giảm giá Sản phẩm hoạt động như thế nào?</h3>
                        <p className="text-sm text-blue-700 mb-2">
                            Chọn sản phẩm cụ thể → Đặt % hoặc số tiền giảm → Giá sản phẩm tự động cập nhật trên website
                        </p>
                        <div className="text-xs text-blue-600 space-y-1">
                            <p><strong>Ví dụ:</strong> Áo thun 500k → Giảm 20% → Customer thấy 400k ngay trên web</p>
                            <p><strong>Phù hợp:</strong> Flash Sale, Sale thanh lý, Sale theo danh mục sản phẩm</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-orange-800 mb-1">⚠️ Lưu ý về việc xóa đợt giảm giá</h3>
                        <div className="text-sm text-orange-700 space-y-1">
                            <p>• <strong>Không thể xóa</strong> đợt giảm giá đang hoạt động (trạng thái "Đang diễn ra")</p>
                            <p>• <strong>Chỉ người tạo</strong> mới có quyền xóa đợt giảm giá của mình</p>
                            <p>• <strong>Xóa vĩnh viễn:</strong> Toàn bộ dữ liệu sẽ mất và không thể khôi phục</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded border p-3 shadow-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{promotions.length}</div>
                        <div className="text-sm text-gray-600">Tổng đợt giảm giá</div>
                    </div>
                </div>
                <div className="bg-white rounded border p-3 shadow-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{activePromotions}</div>
                        <div className="text-sm text-gray-600">Đang hoạt động</div>
                    </div>
                </div>
                <div className="bg-white rounded border p-3 shadow-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{expiredPromotions}</div>
                        <div className="text-sm text-gray-600">Đã hết hạn</div>
                    </div>
                </div>
                <div className="bg-white rounded border p-3 shadow-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{deletingId ? '1' : '0'}</div>
                        <div className="text-sm text-gray-600">Đang xóa</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded border p-4 shadow-sm">
                <h3 className="font-medium text-gray-800 mb-3">🔍 Bộ lọc tìm kiếm</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
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
                        currentPromotions.map((promo, index) => {
                        const now = new Date()
                        const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate)
                        const isDeleting = deletingId === promo.id

                        return (
                            <tr 
                                key={promo.id} 
                                className={`border-b ${
                                    isDeleting 
                                        ? 'bg-red-50 opacity-60' 
                                        : 'hover:bg-gray-50'
                                }`}
                            >
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
                                    <div className="flex items-center justify-center gap-2">
                                        <Link
                                            href={`/admin/promotion_products/${promo.id}`}
                                            className="text-orange-500 hover:text-orange-600 p-1"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(promo)}
                                            disabled={isActive || deletingId === promo.id}
                                            className={`p-1 relative ${
                                                isActive || deletingId === promo.id
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-red-500 hover:text-red-600'
                                            }`}
                                            title={
                                                isActive
                                                    ? 'Không thể xóa đợt giảm giá đang hoạt động'
                                                    : deletingId === promo.id
                                                    ? 'Đang xóa...'
                                                    : 'Xóa đợt giảm giá'
                                            }
                                        >
                                            {deletingId === promo.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    }))}
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