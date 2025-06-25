// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSession, signIn } from "next-auth/react";
//
// interface Voucher {
//     id: number;
//     promotionCode: string;
//     promotionName: string;
//     discountType: string;
//     discountValue: number;
//     description: string;
//     startDate: string;
//     endDate: string;
//     isActive: boolean;
// }
//
// export default function VouchersPage() {
//     const [vouchers, setVouchers] = useState<Voucher[]>([]);
//     const [loading, setLoading] = useState(true);
//     const router = useRouter();
//     const { data: session, status } = useSession();
//     useEffect(() => {
//         const fetchVouchers = async () => {
//             try {
//                 const res = await fetch('http://localhost:8080/api/promotions');
//                 const data = await res.json();
//                 setVouchers(data.data.content);
//             } catch (error) {
//                 console.error('Lỗi khi tải danh sách khuyến mãi:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchVouchers();
//     }, []);
//
//     const handleDelete = async (id: number) => {
//         console.log('Deleting voucher ID:', id);
//
//         if (!confirm('Bạn có chắc chắn muốn xoá phiếu này?')) return;
//
//         const token = session?.accessToken;
//         if (!token) {
//             alert('Bạn chưa đăng nhập hoặc token không tồn tại!');
//             return;
//         }
//
//         try {
//             const res = await fetch(`http://localhost:8080/api/promotions/${id}`, {//Chưa truyền iD đúng định dạng
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//             });
//
//             if (!res.ok) {
//                 const errorText = await res.text();
//                 console.error('Xoá thất bại:', errorText);
//                 alert(`Xoá thất bại: ${errorText} IDIDIDID ${id}`);
//                 return;
//             }
//
//             const result = await res.json();
//             if (result === true) {
//                 setVouchers((prev) => prev.filter((v) => v.id !== id));
//             } else {
//                 alert('Xoá không thành công (backend trả về false)');
//             }
//         } catch (err) {
//             console.error('Lỗi hệ thống khi xoá:', err);
//             alert('Có lỗi xảy ra khi xoá phiếu giảm giá.');
//         }
//     };
//
//     return (
//         <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//             <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold text-gray-800">📋 Danh sách Phiếu giảm giá</h2>
//                 <button
//                     onClick={() => router.push('/admin/promotion_management/vouchers/create')}
//                     className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow"
//                 >
//                     + Thêm phiếu giảm giá
//                 </button>
//             </div>
//
//             <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
//                 {loading ? (
//                     <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
//                 ) : (
//                     <table className="w-full table-auto text-sm">
//                         <thead className="bg-gray-100 text-gray-700">
//                         <tr>
//                             <th className="px-3 py-2 border">STT</th>
//                             <th className="px-3 py-2 border">Mã</th>
//                             <th className="px-3 py-2 border">Tên</th>
//                             <th className="px-3 py-2 border">Loại</th>
//                             <th className="px-3 py-2 border">Giảm</th>
//                             <th className="px-3 py-2 border">Ngày bắt đầu</th>
//                             <th className="px-3 py-2 border">Ngày kết thúc</th>
//                             <th className="px-3 py-2 border">Trạng thái</th>
//                             <th className="px-3 py-2 border text-center">Thao tác</th>
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {vouchers.length > 0 ? (
//                             vouchers.map((v, index) => (
//                                 <tr key={v.id} className="hover:bg-gray-50">
//                                     <td className="px-3 py-2 border text-center">{index + 1}</td>
//                                     <td className="px-3 py-2 border">{v.promotionCode}</td>
//                                     <td className="px-3 py-2 border">{v.promotionName}</td>
//                                     <td className="px-3 py-2 border text-center">
//                                         {v.discountType === 'percentage'
//                                             ? 'Giảm theo %'
//                                             : v.discountType === 'fixed_amount'
//                                                 ? 'Giảm số tiền'
//                                                 : v.discountType === 'free_shipping'
//                                                     ? 'Miễn phí vận chuyển'
//                                                     : 'Khác'}
//                                     </td>
//                                     <td className="px-3 py-2 border text-center">
//                                         {v.discountType === 'percentage'
//                                             ? `${v.discountValue}%`
//                                             : `${v.discountValue.toLocaleString()} ₫`}
//                                     </td>
//                                     <td className="px-3 py-2 border text-center">
//                                         {new Date(v.startDate).toLocaleString()}
//                                     </td>
//                                     <td className="px-3 py-2 border text-center">
//                                         {new Date(v.endDate).toLocaleString()}
//                                     </td>
//                                     <td className="px-3 py-2 border text-center">
//                                         {v.isActive ? (
//                                             <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Đang diễn ra</span>
//                                         ) : (
//                                             <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Đã kết thúc</span>
//                                         )}
//                                     </td>
//                                     <td className="px-3 py-2 border text-center">
//                                         <button
//                                             onClick={() =>
//                                                 router.push(`/admin/promotion_management/vouchers/${v.id}`)
//                                             }
//                                             className="text-blue-500 hover:underline mr-2"
//                                         >
//                                             ✏️
//                                         </button>
//                                         <button
//                                             onClick={() => handleDelete(v.id)}
//                                             className="text-red-500 hover:underline"
//                                         >
//                                             🗑️
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))
//                         ) : (
//                             <tr>
//                                 <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
//                                     Không có dữ liệu phiếu giảm giá.
//                                 </td>
//                             </tr>
//                         )}
//                         </tbody>
//                     </table>
//                 )}
//             </div>
//         </div>
//     );
// }
//
//
//
//




'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PencilSquareIcon, TrashIcon, PlusIcon } from "@heroicons/react/20/solid";

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

export default function VouchersPage() {
    const searchParams = useSearchParams();
    const initialPage = Number(searchParams.get('page')) || 0;

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(initialPage);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        discountType: ''
    });

    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        const fetchVouchers = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                if (filters.keyword) query.append('keyword', filters.keyword);
                if (filters.status) query.append('status', filters.status);
                if (filters.discountType) query.append('discountType', filters.discountType);
                query.append('page', page.toString());
                query.append('size', size.toString());

                const res = await fetch(`http://localhost:8080/api/promotions?${query.toString()}`);
                const data = await res.json();
                setVouchers(data.data.content);
                setTotalPages(data.data.totalPages);
            } catch (error) {
                console.error('Lỗi khi tải danh sách khuyến mãi:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVouchers();
    }, [filters, page, size]);

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xoá phiếu này?')) return;
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

            const result = await res.json();
            if (result === true) {
                setVouchers((prev) => prev.filter((v) => v.id !== id));
            } else {
                alert('Xoá không thành công.');
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi xoá phiếu giảm giá.');
        }
    };

    const getVoucherStatus = (endDate: string) => {
        return new Date(endDate) > new Date();
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách phiếu giảm giá</h2>
                <button
                    onClick={() => router.push('/admin/promotion_management/vouchers/create')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow flex items-center gap-1"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Thêm mới</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border space-y-4">
                <div className="font-semibold text-lg flex items-center gap-2">
                    <span>Bộ lọc</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tìm theo mã hoặc tên:</label>
                        <input
                            type="text"
                            className="w-full mt-1 border rounded px-3 py-2"
                            value={filters.keyword}
                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái:</label>
                        <select
                            className="w-full mt-1 border rounded px-3 py-2"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            <option value="active">Đang diễn ra</option>
                            <option value="inactive">Đã kết thúc</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kiểu giảm:</label>
                        <select
                            className="w-full mt-1 border rounded px-3 py-2"
                            value={filters.discountType}
                            onChange={(e) => setFilters({ ...filters, discountType: e.target.value })}
                        >
                            <option value="">Tất cả</option>
                            <option value="percentage">Giảm theo %</option>
                            <option value="fixed_amount">Giảm số tiền</option>
                            <option value="free_shipping">Miễn phí vận chuyển</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            setFilters({ keyword: '', status: '', discountType: '' });
                            setPage(0);
                        }}
                        className="bg-gray-300 hover:bg-gray-300 text-sm px-4 py-2 rounded"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border">
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : (
                    <table className="w-full table-auto text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-3 py-2 border">STT</th>
                            <th className="px-3 py-2 border">Mã</th>
                            <th className="px-3 py-2 border">Tên</th>
                            <th className="px-3 py-2 border">Loại</th>
                            <th className="px-3 py-2 border">Giảm</th>
                            <th className="px-3 py-2 border">Bắt đầu</th>
                            <th className="px-3 py-2 border">Kết thúc</th>
                            <th className="px-3 py-2 border">Trạng thái</th>
                            <th className="px-3 py-2 border text-center">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {vouchers.length > 0 ? (
                            vouchers.map((v, index) => {
                                const stt = index + 1 + page * size;
                                return (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 border text-center">{stt}</td>
                                        <td className="px-3 py-2 border">{v.promotionCode}</td>
                                        <td className="px-3 py-2 border">{v.promotionName}</td>
                                        <td className="px-3 py-2 border text-center">
                                            {v.discountType === 'percentage'
                                                ? 'Giảm theo %'
                                                : v.discountType === 'fixed_amount'
                                                    ? 'Giảm số tiền'
                                                    : v.discountType === 'free_shipping'
                                                        ? 'Miễn phí vận chuyển'
                                                        : 'Khác'}
                                        </td>
                                        <td className="px-3 py-2 border text-center">
                                            {v.discountType === 'percentage'
                                                ? `${v.discountValue}%`
                                                : `${v.discountValue.toLocaleString()} ₫`}
                                        </td>
                                        <td className="px-3 py-2 border text-center">{new Date(v.startDate).toLocaleString()}</td>
                                        <td className="px-3 py-2 border text-center">{new Date(v.endDate).toLocaleString()}</td>
                                        <td className="px-3 py-2 border text-center">
                                                <span className={`text-xs px-2 py-1 rounded text-white ${getVoucherStatus(v.endDate) ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {getVoucherStatus(v.endDate) ? 'Đang diễn ra' : 'Đã kết thúc'}
                                                </span>
                                        </td>
                                        <td className="px-3 py-2 border text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/promotion_management/vouchers/${v.id}`)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-md"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                                    Không có dữ liệu phiếu giảm giá.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <label className="mr-2 text-sm">Số dòng/trang:</label>
                    <select
                        className="border rounded px-2 py-1 text-sm"
                        value={size}
                        onChange={(e) => {
                            const newSize = Number(e.target.value);
                            setSize(Number.isNaN(newSize) ? 5 : newSize);
                            setPage(0);
                        }}
                    >
                        {[5, 10, 20, 50].map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}