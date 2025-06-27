//
// 'use client'
//
// import { useEffect, useState } from 'react'
// import { useSession } from 'next-auth/react'
//
// type Product = {
//     variantId: number
//     productName: string
//     sku: string
// }
//
// export default function AddPromotionPage() {
//     const { data: session } = useSession()
//     const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
//
//     const [form, setForm] = useState({
//         promotionName: '',
//         discountValue: '',
//         startDate: '',
//         endDate: '',
//     })
//
//     const [products, setProducts] = useState<Product[]>([])
//     const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
//     const [productSearch, setProductSearch] = useState('')
//     const [page, setPage] = useState(0)
//     const [totalPages, setTotalPages] = useState(0)
//     const [loading, setLoading] = useState(false)
//
//     useEffect(() => {
//         const token = session?.accessToken
//         if (!token) return
//
//         const query = new URLSearchParams()
//         query.append('keyword', productSearch)
//         query.append('page', page.toString())
//         query.append('size', '5')
//
//         setLoading(true)
//         fetch(`${API_URL}/api/product-variants/for-selection?${query}`, {
//             headers: { Authorization: `Bearer ${token}` },
//         })
//             .then(res => res.json())
//             .then(data => {
//                 const pageData = data.data
//                 setProducts(pageData.content || [])
//                 setTotalPages(pageData.totalPages || 1)
//             })
//             .catch(console.error)
//             .finally(() => setLoading(false))
//     }, [productSearch, page, session])
//
//     const handleCheckboxChange = (productId: number) => {
//         setSelectedProductIds(prev =>
//             prev.includes(productId)
//                 ? prev.filter(id => id !== productId)
//                 : [...prev, productId]
//         )
//     }
//
//     const handleSubmit = async () => {
//         const token = session?.accessToken
//         if (!token) return alert('Bạn chưa đăng nhập')
//
//         try {
//             const res = await fetch(`${API_URL}/api/promotion-products`, {
//                 method: 'POST',
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     ...form,
//                     productIds: selectedProductIds,
//                 }),
//             })
//
//             if (!res.ok) throw new Error('Tạo đợt giảm giá thất bại')
//             alert('Tạo đợt giảm giá thành công!')
//         } catch (err) {
//             alert(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
//         }
//     }
//
//     const isFormValid =
//         form.promotionName.trim() !== '' &&
//         +form.discountValue > 0 &&
//         form.startDate &&
//         form.endDate &&
//         selectedProductIds.length > 0
//
//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             <h2 className="text-xl font-semibold mb-4">Thêm đợt giảm giá</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Form bên trái */}
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block mb-1 font-medium text-sm">*Tên đợt giảm giá</label>
//                         <input
//                             className="w-full border px-3 py-2 rounded"
//                             value={form.promotionName}
//                             onChange={e => setForm({ ...form, promotionName: e.target.value })}
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 font-medium text-sm">*Giá trị (%)</label>
//                         <input
//                             type="number"
//                             className="w-full border px-3 py-2 rounded"
//                             value={form.discountValue}
//                             onChange={e => setForm({ ...form, discountValue: e.target.value })}
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 font-medium text-sm">*Từ ngày</label>
//                         <input
//                             type="datetime-local"
//                             className="w-full border px-3 py-2 rounded"
//                             value={form.startDate}
//                             onChange={e => setForm({ ...form, startDate: e.target.value })}
//                         />
//                     </div>
//                     <div>
//                         <label className="block mb-1 font-medium text-sm">*Đến ngày</label>
//                         <input
//                             type="datetime-local"
//                             className="w-full border px-3 py-2 rounded"
//                             value={form.endDate}
//                             onChange={e => setForm({ ...form, endDate: e.target.value })}
//                         />
//                     </div>
//                     <button
//                         onClick={handleSubmit}
//                         disabled={!isFormValid}
//                         className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
//                     >
//                         TẠO MỚI
//                     </button>
//                 </div>
//
//                 {/* Danh sách sản phẩm bên phải */}
//                 <div>
//                     <label className="block mb-2 font-medium">Chọn sản phẩm áp dụng</label>
//                     <input
//                         type="text"
//                         placeholder="Tìm tên sản phẩm"
//                         className="w-full mb-3 px-3 py-2 border rounded"
//                         value={productSearch}
//                         onChange={e => {
//                             setProductSearch(e.target.value)
//                             setPage(0)
//                         }}
//                     />
//                     {loading ? (
//                         <div className="text-center py-4">Đang tải sản phẩm...</div>
//                     ) : (
//                         <table className="w-full text-sm border">
//                             <thead className="bg-gray-100 text-left">
//                             <tr>
//                                 <th className="px-3 py-2 text-center"><input type="checkbox" disabled /></th>
//                                 <th className="px-3 py-2">STT</th>
//                                 <th className="px-3 py-2">Tên sản phẩm</th>
//                             </tr>
//                             </thead>
//                             <tbody>
//                             {products.map((prod, index) => (
//                                 <tr key={prod.variantId} className="border-t">
//                                     <td className="px-3 py-2 text-center">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedProductIds.includes(prod.variantId)}
//                                             onChange={() => handleCheckboxChange(prod.variantId)}
//                                         />
//                                     </td>
//                                     <td className="px-3 py-2">{page * 5 + index + 1}</td>
//                                     <td className="px-3 py-2">{prod.productName} ({prod.sku})</td>
//                                 </tr>
//                             ))}
//                             </tbody>
//                         </table>
//                     )}
//
//                     {/* Pagination */}
//                     <div className="flex justify-center mt-4 gap-2">
//                         <button
//                             onClick={() => setPage(p => Math.max(p - 1, 0))}
//                             className="px-2 py-1 border rounded disabled:opacity-50"
//                             disabled={page === 0}
//                         >
//                             {'<'}
//                         </button>
//                         {[...Array(totalPages)].map((_, idx) => (
//                             <button
//                                 key={idx}
//                                 onClick={() => setPage(idx)}
//                                 className={`px-3 py-1 border rounded ${
//                                     idx === page ? 'bg-orange-500 text-white' : ''
//                                 }`}
//                             >
//                                 {idx + 1}
//                             </button>
//                         ))}
//                         <button
//                             onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
//                             className="px-2 py-1 border rounded disabled:opacity-50"
//                             disabled={page >= totalPages - 1}
//                         >
//                             {'>'}
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }



'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

type ProductVariant = {
    variantId: number;
    productName: string;
};

type ProductVariantDetail = {
    variantId: number;
    productName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    materialName: string;
    price: number;
    salePrice: number;
};

export default function CreatePromotionPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        promotionName: '',
        discountValue: 0,
        discountType: 'percentage',
        startDate: '',
        endDate: '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
    const [details, setDetails] = useState<ProductVariantDetail[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [detailPage, setDetailPage] = useState(1);
    const detailPerPage = 5;

    // ✅ Thêm state search FE
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchVariants = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/product-variants/for-selection', {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                    params: {
                        page: 0,
                        size: 100,
                    },
                });
                setVariants(res.data.data.content || []);
            } catch (err) {
                console.error('Lỗi khi tải sản phẩm:', err);
            }
        };

        if (session?.accessToken) {
            fetchVariants();
        }
    }, [session?.accessToken]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (selectedVariants.length === 0) {
                setDetails([]);
                return;
            }
            try {
                const res = await axios.post(
                    'http://localhost:8080/api/product-variants/details',
                    selectedVariants,
                    {
                        headers: {
                            Authorization: `Bearer ${session?.accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setDetails(res.data);
                setDetailPage(1); // reset về trang đầu khi đổi variant
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
            }
        };

        fetchDetails();
    }, [selectedVariants]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSelectVariant = (variantId: number) => {
        setSelectedVariants((prev) =>
            prev.includes(variantId)
                ? prev.filter((id) => id !== variantId)
                : [...prev, variantId]
        );
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.promotionName) newErrors.promotionName = 'Tên đợt giảm giá là bắt buộc.';
        if (!form.startDate) newErrors.startDate = 'Từ ngày là bắt buộc.';
        if (!form.endDate) newErrors.endDate = 'Đến ngày là bắt buộc.';
        const value = parseFloat(form.discountValue.toString());
        if (value <= 0) newErrors.discountValue = 'Giá trị phải lớn hơn 0.';
        if (form.discountType === 'percentage' && value > 100)
            newErrors.discountValue = 'Không vượt quá 100%.';
        if (new Date(form.startDate) >= new Date(form.endDate)) {
            newErrors.startDate = 'Từ ngày phải nhỏ hơn đến ngày.';
            newErrors.endDate = 'Đến ngày phải lớn hơn từ ngày.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            await axios.post(
                'http://localhost:8080/api/promotion-products',
                {
                    ...form,
                    discountValue: form.discountType === 'free_shipping' ? 0 : Number(form.discountValue),
                    variantIds: selectedVariants,
                },
                {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            alert('✅ Tạo đợt giảm giá thành công!');
            router.push('/admin/promotion_management/vouchers');
        } catch (err: any) {
            alert('❌ Lỗi: ' + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ✅ Lọc theo searchTerm FE
    const filteredVariants = variants.filter((v) =>
        v.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pageCount = Math.ceil(filteredVariants.length / itemsPerPage);
    const currentVariants = filteredVariants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const detailPageCount = Math.ceil(details.length / detailPerPage);
    const currentDetailRows = details.slice(
        (detailPage - 1) * detailPerPage,
        detailPage * detailPerPage
    );

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow mt-6">
            <h2 className="text-2xl font-bold mb-6">Thêm đợt giảm giá</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 font-medium">
                                Tên đợt giảm giá <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="promotionName"
                                value={form.promotionName}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                            />
                            {errors.promotionName && (
                                <p className="text-red-600 text-sm">{errors.promotionName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">
                                Giá trị (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="discountValue"
                                type="number"
                                value={form.discountValue}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                            />
                            {errors.discountValue && (
                                <p className="text-red-600 text-sm">{errors.discountValue}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">
                                Từ ngày <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="startDate"
                                type="datetime-local"
                                value={form.startDate}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                            />
                            {errors.startDate && (
                                <p className="text-red-600 text-sm">{errors.startDate}</p>
                            )}
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">
                                Đến ngày <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="endDate"
                                type="datetime-local"
                                value={form.endDate}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                            />
                            {errors.endDate && (
                                <p className="text-red-600 text-sm">{errors.endDate}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang tạo...' : 'Tạo đợt giảm giá'}
                        </button>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Chọn sản phẩm áp dụng</h3>

                        {/* ✅ Search input */}
                        <input
                            type="text"
                            placeholder=" Tìm kiếm tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // reset về trang 1
                            }}
                            className="w-full border px-3 py-2 rounded mb-4"
                        />

                        <div className="border rounded overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-700 font-semibold">
                                <tr>
                                    <th className="px-3 py-2">Chọn</th>
                                    <th className="px-3 py-2">STT</th>
                                    <th className="px-3 py-2">Tên sản phẩm</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentVariants.map((v, idx) => (
                                    <tr key={v.variantId} className="border-t">
                                        <td className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedVariants.includes(v.variantId)}
                                                onChange={() => handleSelectVariant(v.variantId)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {(currentPage - 1) * itemsPerPage + idx + 1}
                                        </td>
                                        <td className="px-3 py-2">{v.productName}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ✅ Pagination */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-full text-sm border ${
                                        page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {details.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-2">Chi tiết sản phẩm đã chọn</h4>
                        <table className="min-w-full border text-sm">
                            <thead className="bg-gray-200">
                            <tr>
                                <th className="border px-2 py-1">STT</th>
                                <th className="border px-2 py-1">Tên</th>
                                <th className="border px-2 py-1">Thương hiệu</th>
                                <th className="border px-2 py-1">Màu sắc</th>
                                <th className="border px-2 py-1">Kích cỡ</th>
                                <th className="border px-2 py-1">Chất liệu</th>
                                <th className="border px-2 py-1">Giá gốc</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentDetailRows.map((d, index) => (
                                <tr key={d.variantId}>
                                    <td className="border px-2 py-1 text-center">
                                        {(detailPage - 1) * detailPerPage + index + 1}
                                    </td>
                                    <td className="border px-2 py-1">{d.productName}</td>
                                    <td className="border px-2 py-1">{d.brandName}</td>
                                    <td className="border px-2 py-1">{d.colorName}</td>
                                    <td className="border px-2 py-1">{d.sizeName}</td>
                                    <td className="border px-2 py-1">{d.materialName}</td>
                                    <td className="border px-2 py-1">{d.price?.toLocaleString()}đ</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="flex items-center justify-center gap-2 mt-3">
                            {Array.from({ length: detailPageCount }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setDetailPage(page)}
                                    className={`w-8 h-8 rounded-full text-sm border ${
                                        page === detailPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}


