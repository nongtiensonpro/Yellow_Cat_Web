'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import axios, { AxiosError } from 'axios';

interface CustomSession extends Session {
    accessToken?: string;
}

interface ProductVariant {
    variantId: number;
    sku: string;
    price: number;
    salePrice: number;
    imageUrl: string;
    productName: string;
}

interface ProductVariantDetail {
    variantId: number;
    productName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    materialName: string;
    price: number;
    salePrice: number;
}

// Di chuyển API_URL ra ngoài component để tránh lỗi dependency
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function EditPromotionProductPage() {
    /* -------------------------------------------------- State -------------------------------------------------- */
    const router = useRouter();
    const params = useParams();
    const { data: session, status } = useSession() as {
        data: CustomSession | null;
        status: string;
    };

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        promotionName: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
    });

    const [errors, setErrors] = useState<{ [k: string]: string }>({});
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
    const [details, setDetails] = useState<ProductVariantDetail[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailPage, setDetailPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const itemsPerPage = 5;
    const detailPerPage = 5;
    const id = params?.id;
    const isValidId = Boolean(id && !Array.isArray(id));

    /* ------------------------------------------- Helpers -------------------------------------------------------- */
    const formatDateTimeLocal = (d: string) =>
        new Date(d).toISOString().slice(0, 16);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSelectVariant = (vid: number) => {
        setSelectedVariants(prev =>
            prev.includes(vid) ? prev.filter(x => x !== vid) : [...prev, vid]
        );
    };

    /* ------------------------------------------- Load initial data --------------------------------------------- */
    useEffect(() => {
        if (!isValidId || status !== 'authenticated' || !session?.accessToken) return;
        setLoading(true);
        fetch(`${API_URL}/api/promotion-products/${id}/edit`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then(r => r.json())
            .then(res => {
                const data = res.data || res;
                setForm({
                    promotionName: data.promotionName,
                    description: data.description || '',
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    startDate: formatDateTimeLocal(data.startDate),
                    endDate: formatDateTimeLocal(data.endDate),
                });
                setSelectedVariants(data.variantIds || []);
            })
            .catch(err => {
                console.error(err);
                alert('Không thể tải dữ liệu đợt giảm giá');
            })
            .finally(() => setLoading(false));
    }, [session, status, id, isValidId]);

    /* variants for checkbox list */
    useEffect(() => {
        if (!isValidId || !session?.accessToken) return;
        axios
            .get(`${API_URL}/api/product-variants/for-selection`, {
                params: { page: 0, size: 100 },
                headers: { Authorization: `Bearer ${session.accessToken}` },
            })
            .then(r => setVariants(r.data.data.content || []))
            .catch(console.error);
    }, [session, isValidId]);

    /* details table */
    useEffect(() => {
        if (!isValidId || !session?.accessToken || selectedVariants.length === 0) {
            setDetails([]);
            return;
        }
        axios
            .post(`${API_URL}/api/product-variants/details`, selectedVariants, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
            .then(r => {
                setDetails(r.data);
                setDetailPage(1);
            })
            .catch(console.error);
    }, [selectedVariants, session, isValidId]);

    /* ----------------------------------------- Validation ------------------------------------------------------ */
    const validateForm = () => {
        const e: { [k: string]: string } = {};
        if (!form.promotionName) e.promotionName = 'Tên đợt giảm giá là bắt buộc.';
        if (!form.startDate) e.startDate = 'Từ ngày là bắt buộc.';
        if (!form.endDate) e.endDate = 'Đến ngày là bắt buộc.';
        const v = parseFloat(form.discountValue.toString());
        if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && v <= 0)
            e.discountValue = 'Giá trị phải lớn hơn 0.';
        if (form.discountType === 'percentage' && v > 100)
            e.discountValue = 'Phần trăm giảm không quá 100%.';
        if (form.discountType === 'fixed_amount' && v > 1_000_000)
            e.discountValue = 'Số tiền giảm không quá 1.000.000₫.';
        if (new Date(form.startDate) >= new Date(form.endDate)) {
            e.startDate = 'Từ ngày phải nhỏ hơn đến ngày.';
            e.endDate = 'Đến ngày phải lớn hơn từ ngày.';
        }
        if (!selectedVariants.length) e.variants = 'Vui lòng chọn ít nhất một sản phẩm.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ------------------------------------------ Submit --------------------------------------------------------- */
    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            await axios.put(
                `${API_URL}/api/promotion-products/${id}`,
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
            alert('✅ Cập nhật đợt giảm giá thành công!');
            router.push('/admin/promotion_products');
        } catch (err) {
            if (err instanceof AxiosError) {
                const msg = err.response?.data?.message || err.message;
                if (msg.includes('đã tồn tại')) {
                    // lỗi trùng tên → hiển thị inline
                    setErrors(prev => ({ ...prev, promotionName: 'Tên đợt giảm giá đã tồn tại!' }));
                } else {
                    alert('❌ ' + msg);
                }
            } else {
                alert('❌ Đã xảy ra lỗi không xác định');
            }
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------------------ Filtering + pagination ---------------------------------------- */
    const filtered = variants.filter(v =>
        v.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const pageCount = Math.ceil(filtered.length / itemsPerPage);
    const currentVariants = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const detailPageCount = Math.ceil(details.length / detailPerPage);
    const currentDetails = details.slice(
        (detailPage - 1) * detailPerPage,
        detailPage * detailPerPage
    );

    /* ------------------------------------------------ Render --------------------------------------------------- */
    if (!isValidId) return <div className="py-8 text-center">ID không hợp lệ</div>;
    if (status === 'loading' || loading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
            </div>
        );
    if (status !== 'authenticated')
        return (
            <div className="text-center py-8">
                <p>Bạn cần đăng nhập để truy cập trang này.</p>
            </div>
        );

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow mt-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800">
                    ← Quay lại
                </button>
                <h2 className="text-2xl font-bold">Chỉnh sửa đợt giảm giá</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* ---- LEFT COL ---- */}
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

                        {/* Description (ẩn / tuỳ) */}
                        {/* <textarea ... /> */}

                        <div>
                            <label className="block mb-1 font-medium">
                                Loại giảm <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="discountType"
                                value={form.discountType}
                                onChange={handleChange}
                                className="w-full border px-3 py-2 rounded"
                            >
                                <option value="percentage">Giảm theo %</option>
                                <option value="fixed_amount">Giảm số tiền</option>
                                <option value="free_shipping">Miễn phí vận chuyển</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">
                                Giá trị giảm <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="discountValue"
                                type="number"
                                value={
                                    form.discountType === 'free_shipping'
                                        ? ''
                                        : form.discountValue === 0
                                            ? ''
                                            : form.discountValue
                                }
                                onChange={handleChange}
                                disabled={form.discountType === 'free_shipping'}
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

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="bg-gray-500 text-white px-6 py-2 rounded"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
                            >
                                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                            </button>
                        </div>
                    </div>

                    {/* ---- RIGHT COL ---- */}
                    <div>
                        <h3 className="font-medium mb-2">Chọn sản phẩm áp dụng</h3>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border px-3 py-2 rounded mb-4"
                        />
                        {errors.variants && (
                            <p className="text-red-600 text-sm mb-2">{errors.variants}</p>
                        )}
                        <div className="border rounded overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 font-semibold">
                                <tr>
                                    <th className="px-3 py-2">Chọn</th>
                                    <th className="px-3 py-2">STT</th>
                                    <th className="px-3 py-2">SKU</th>
                                    <th className="px-3 py-2">Tên SP</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentVariants.map((v, i) => (
                                    <tr key={v.variantId} className="border-t">
                                        <td className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedVariants.includes(v.variantId)}
                                                onChange={() => handleSelectVariant(v.variantId)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {(currentPage - 1) * itemsPerPage + i + 1}
                                        </td>
                                        <td className="px-3 py-2">{v.sku}</td>
                                        <td className="px-3 py-2">{v.productName}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {pageCount > 1 && (
                            <div className="flex justify-center gap-2 mt-3">
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        className={`w-8 h-8 rounded-full border text-sm ${
                                            p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                                        }`}
                                        onClick={() => setCurrentPage(p)}
                                        type="button"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details table */}
                {details.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold mb-2">
                            Chi tiết sản phẩm đã chọn ({details.length})
                        </h4>
                        <div className="border rounded overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-200 font-semibold">
                                <tr>
                                    <th className="px-2 py-1">STT</th>
                                    <th className="px-2 py-1">Tên</th>
                                    <th className="px-2 py-1">Thương hiệu</th>
                                    <th className="px-2 py-1">Màu</th>
                                    <th className="px-2 py-1">Kích cỡ</th>
                                    <th className="px-2 py-1">Chất liệu</th>
                                    <th className="px-2 py-1">Giá gốc</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentDetails.map((d, i) => (
                                    <tr key={d.variantId}>
                                        <td className="px-2 py-1 text-center">
                                            {(detailPage - 1) * detailPerPage + i + 1}
                                        </td>
                                        <td className="px-2 py-1">{d.productName}</td>
                                        <td className="px-2 py-1">{d.brandName}</td>
                                        <td className="px-2 py-1">{d.colorName}</td>
                                        <td className="px-2 py-1">{d.sizeName}</td>
                                        <td className="px-2 py-1">{d.materialName}</td>
                                        <td className="px-2 py-1">{d.price.toLocaleString()}₫</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {detailPageCount > 1 && (
                            <div className="flex justify-center gap-2 mt-3">
                                {Array.from({ length: detailPageCount }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setDetailPage(p)}
                                        className={`w-8 h-8 rounded-full border text-sm ${
                                            p === detailPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
