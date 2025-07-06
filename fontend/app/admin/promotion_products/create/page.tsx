

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import HelpTooltip from '../../../../components/promotion/HelpTooltip';

type ProductVariant = {
    variantId: number;
    productName: string;
};

type ProductVariantDetail ={
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
        description: '',
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
                setDetailPage(1);
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
            }
        };

        fetchDetails();
    }, [selectedVariants]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSelectVariant = (variantId: number) => {
        setSelectedVariants((prev) =>
            prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId]
        );
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.promotionName) newErrors.promotionName = 'Tên đợt giảm giá là bắt buộc.';
        if (!form.startDate) newErrors.startDate = 'Từ ngày là bắt buộc.';
        if (!form.endDate) newErrors.endDate = 'Đến ngày là bắt buộc.';
        if (selectedVariants.length === 0) newErrors.variants = 'Phải chọn ít nhất 1 sản phẩm.';

        const value = parseFloat(form.discountValue.toString());
        if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && value <= 0) {
            newErrors.discountValue = 'Giá trị phải lớn hơn 0.';
        }
        if (form.discountType === 'percentage' && value > 100) {
            newErrors.discountValue = 'Phần trăm giảm không được vượt quá 100%.';
        }
        if (form.discountType === 'fixed_amount' && value > 1000000) {
            newErrors.discountValue = 'Số tiền giảm không được vượt quá 1.000.000₫.';
        }
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
            router.push('/admin/promotion_products');
        } catch (err: any) {
            alert('❌ Lỗi: ' + (err?.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

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
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Thêm đợt giảm giá</h2>
            </div>
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
                            <label className="block mb-1 font-medium flex items-center">
                                Giá trị giảm <span className="text-red-500">*</span>
                                <HelpTooltip
                                    text={
                                        form.discountType === 'percentage'
                                            ? 'Nhập % giảm'
                                            : form.discountType === 'fixed_amount'
                                                ? 'Nhập số tiền giảm'
                                                : 'Tự động miễn phí ship'
                                    }
                                />
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
                                className="w-full border px-3 py-2 rounded"
                                disabled={form.discountType === 'free_shipping'}
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

                        <input
                            type="text"
                            placeholder="Tìm kiếm tên sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border px-3 py-2 rounded mb-2"
                        />

                        {errors.variants && (
                            <p className="text-red-600 text-sm mb-2">{errors.variants}</p>
                        )}

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
                                {/*<th className="border px-2 py-1">Giá sau giảm</th>*/}
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
                                    <td className="border px-2 py-1">{d.price?.toLocaleString()}₫</td>
                                    {/*<td className="border px-2 py-1">{d.salePrice?.toLocaleString()}₫</td>*/}
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
