'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import HelpTooltip from '../../../../components/promotion/HelpTooltip';

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

// HÀM MỚI: Dùng để kiểm tra giá trị giảm so với giá gốc
function validateDiscountAgainstPrice(
    discountType: string,
    discountValue: number,
    details: ProductVariantDetail[]
): string {
    if (discountType !== 'fixed_amount' || details.length === 0 || discountValue === 0) {
        return ''; // Bỏ qua nếu không phải giảm tiền, không có sản phẩm, hoặc giá trị = 0
    }

    // Tìm giá gốc thấp nhất trong các sản phẩm đã chọn
    const minPrice = Math.min(...details.map(d => d.price));

    if (discountValue > minPrice) {
        return `Số tiền giảm không được lớn hơn giá gốc thấp nhất (${minPrice.toLocaleString()}₫).`;
    }

    return ''; // Hợp lệ
}

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

    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const selectAllDetailsCheckboxRef = useRef<HTMLInputElement>(null);

    const normalizeName = (name: string) => name.trim().replace(/\s{2,}/g, ' ');

    useEffect(() => {
        if (!session?.accessToken) return;
        axios
            .get('http://localhost:8080/api/product-variants/for-selection', {
                headers: { Authorization: `Bearer ${session.accessToken}` },
                params: { page: 0, size: 100 },
            })
            .then(res => setVariants(res.data.data.content || []))
            .catch(err => console.error('Error loading variants:', err));
    }, [session?.accessToken]);

    useEffect(() => {
        if (selectedVariants.length === 0) {
            setDetails([]);
            // Xóa lỗi giá nếu không còn sản phẩm nào được chọn
            setErrors(prev => ({ ...prev, discountValue: '' }));
            return;
        }
        axios
            .post(
                'http://localhost:8080/api/product-variants/details',
                selectedVariants,
                {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            .then(res => {
                const newDetails = res.data;
                setDetails(newDetails);

                // KIỂM TRA LỖI GIÁ KHI CHI TIẾT SẢN PHẨM THAY ĐỔI
                const priceError = validateDiscountAgainstPrice(form.discountType, form.discountValue, newDetails);
                setErrors(prev => ({ ...prev, discountValue: priceError || prev.discountValue }));
            })
            .catch(err => console.error('Error fetching variant details:', err));
    }, [selectedVariants, session?.accessToken, form.discountType, form.discountValue]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;

        // Create a new form state with the updated value
        const updatedForm = { ...form };

        // Explicitly handle each possible form field
        if (name === 'promotionName') updatedForm.promotionName = value;
        else if (name === 'description') updatedForm.description = value;
        else if (name === 'startDate') updatedForm.startDate = value;
        else if (name === 'endDate') updatedForm.endDate = value;
        else if (name === 'discountType') {
            updatedForm.discountType = value;
            updatedForm.discountValue = 0;
        } else if (name === 'discountValue') {
            if (!/^\d*$/.test(value)) return;
            updatedForm.discountValue = value === '' ? 0 : parseInt(value, 10);
        }

        setForm(updatedForm);

        // KIỂM TRA LỖI KHI NGƯỜI DÙNG THAY ĐỔI FORM
        const priceError = validateDiscountAgainstPrice(updatedForm.discountType, updatedForm.discountValue, details);

        // Xóa lỗi cũ và cập nhật lỗi mới nếu có
        setErrors(prev => ({ ...prev, [name]: '', discountValue: priceError }));
    };

    const handleSelectVariant = (variantId: number) => {
        const product = variants.find(v => v.variantId === variantId);
        if (!product) return;
        const groupIds = variants
            .filter(v => v.productName === product.productName)
            .map(v => v.variantId);

        setSelectedVariants(prev => {
            const isGroupSelected = groupIds.every(id => prev.includes(id));
            if (isGroupSelected) {
                return prev.filter(id => !groupIds.includes(id));
            } else {
                // Fix Set iteration issue
                const combinedArray = [...prev, ...groupIds];
                return Array.from(new Set(combinedArray));
            }
        });
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const trimmedName = form.promotionName.trim();

        if (!trimmedName) newErrors.promotionName = 'Tên đợt giảm giá là bắt buộc.';
        else if (/^\d+$/.test(trimmedName)) {
            newErrors.promotionName = 'Tên đợt giảm giá không thể chỉ chứa số.';
        }

        if (!form.startDate) newErrors.startDate = 'Từ ngày là bắt buộc.';
        if (!form.endDate) newErrors.endDate = 'Đến ngày là bắt buộc.';
        if (selectedVariants.length === 0) newErrors.variants = 'Phải chọn ít nhất 1 sản phẩm.';

        const value = Number(form.discountValue);
        if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && value <= 0) {
            newErrors.discountValue = 'Giá trị phải lớn hơn 0.';
        }
        if (form.discountType === 'percentage' && value > 100) {
            newErrors.discountValue = 'Phần trăm giảm không được vượt quá 100%.';
        }
        // if (form.discountType === 'fixed_amount' && value > 1000000) {
        //     newErrors.discountValue = 'Số tiền giảm không được vượt quá 1.000.000₫.';
        // }
        if (new Date(form.startDate) >= new Date(form.endDate)) {
            newErrors.startDate = 'Từ ngày phải nhỏ hơn đến ngày.';
            newErrors.endDate = 'Đến ngày phải lớn hơn từ ngày.';
        }

        // KIỂM TRA LẦN CUỐI VỚI GIÁ GỐC
        const priceError = validateDiscountAgainstPrice(form.discountType, form.discountValue, details);
        if (priceError) {
            newErrors.discountValue = priceError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const cleanedName = normalizeName(form.promotionName);

        setLoading(true);
        try {
            await axios.post(
                'http://localhost:8080/api/promotion-products',
                {
                    ...form,
                    promotionName: cleanedName,
                    discountValue: Number(form.discountValue),
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
            router.push('/admin/promotion_products?page=1');
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response) {
                const { status, data } = err.response;
                if ((status === 400 || status === 409) && data?.message?.includes('tồn tại')) {
                    setErrors(prev => ({ ...prev, promotionName: data.message || 'Tên đợt giảm giá đã tồn tại.' }));
                } else {
                    alert('❌ Lỗi: ' + (data?.message || err.message));
                }
            } else {
                console.error(err);
                alert('❌ Lỗi không xác định.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filtered = variants.filter(v =>
        v.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const uniqueVariants = filtered.filter(
        (v, idx, arr) => arr.findIndex(x => x.productName === v.productName) === idx
    );
    const pageCount = Math.ceil(uniqueVariants.length / itemsPerPage);
    const currentVariants = uniqueVariants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const detailPageCount = Math.ceil(details.length / detailPerPage);
    const currentDetailRows = details.slice(
        (detailPage - 1) * detailPerPage,
        detailPage * detailPerPage
    );

    const variantIdsOnCurrentPage = currentVariants.flatMap(product =>
        variants
            .filter(v => v.productName === product.productName)
            .map(v => v.variantId)
    );
    const areAllOnPageSelected = variantIdsOnCurrentPage.length > 0 && variantIdsOnCurrentPage.every(id => selectedVariants.includes(id));
    const areSomeOnPageSelected = variantIdsOnCurrentPage.some(id => selectedVariants.includes(id)) && !areAllOnPageSelected;

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate = areSomeOnPageSelected;
        }
    }, [areSomeOnPageSelected]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setSelectedVariants(prev => {
                const combinedArray = [...prev, ...variantIdsOnCurrentPage];
                return Array.from(new Set(combinedArray));
            });
        } else {
            setSelectedVariants(prev => prev.filter(id => !variantIdsOnCurrentPage.includes(id)));
        }
    };

    const handleSelectDetail = (variantId: number) => {
        setSelectedVariants(prev =>
            prev.includes(variantId)
                ? prev.filter(id => id !== variantId)
                : [...prev, variantId]
        );
    };

    const handleSelectAllDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const detailIdsOnPage = currentDetailRows.map(d => d.variantId);
        if (isChecked) {
            setSelectedVariants(prev => {
                const combinedArray = [...prev, ...detailIdsOnPage];
                return Array.from(new Set(combinedArray));
            });
        } else {
            setSelectedVariants(prev => prev.filter(id => !detailIdsOnPage.includes(id)));
        }
    };

    const detailIdsOnPage = currentDetailRows.map(d => d.variantId);
    const areAllDetailsOnPageSelected = detailIdsOnPage.length > 0 && detailIdsOnPage.every(id => selectedVariants.includes(id));
    const areSomeDetailsOnPageSelected = detailIdsOnPage.some(id => selectedVariants.includes(id)) && !areAllDetailsOnPageSelected;

    useEffect(() => {
        if (selectAllDetailsCheckboxRef.current) {
            selectAllDetailsCheckboxRef.current.indeterminate = areSomeDetailsOnPageSelected;
        }
    }, [areSomeDetailsOnPageSelected]);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow mt-6">
            <div className="mb-6 flex items-center">
                <Link
                    href="/admin/promotion_products"
                    className="flex items-center text-gray-600 hover:text-gray-800 mr-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <span className="text-2xl font-bold">Thêm đợt giảm giá</span>
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
                            <label className="block mb-1 font-medium">Mô tả</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border px-3 py-2 rounded"
                                placeholder="Nhập mô tả cho đợt giảm giá..."
                            />
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
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium flex items-center">
                                Giá trị giảm <span className="text-red-500">*</span>
                                <HelpTooltip
                                    text={
                                        form.discountType === 'percentage'
                                            ? 'Nhập % giảm'
                                            : 'Nhập số tiền giảm'
                                    }
                                />
                            </label>
                            <input
                                name="discountValue"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.discountValue || ''}
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

                    {/* Product Selector */}
                    <div>
                        <h3 className="font-medium mb-2">Chọn sản phẩm áp dụng</h3>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên sản phẩm..."
                            value={searchTerm}
                            onChange={e => {
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
                                        <th className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                ref={selectAllCheckboxRef}
                                                checked={areAllOnPageSelected}
                                                onChange={handleSelectAll}
                                                className="form-checkbox"
                                            />
                                        </th>
                                        <th className="px-3 py-2">STT</th>
                                        <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentVariants.map((v, idx) => {
                                        const productGroupIds = variants
                                            .filter(item => item.productName === v.productName)
                                            .map(item => item.variantId);
                                        const isProductGroupSelected = productGroupIds.length > 0 && productGroupIds.every(id => selectedVariants.includes(id));

                                        return (
                                            <tr key={v.variantId} className="border-t">
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isProductGroupSelected}
                                                        onChange={() => handleSelectVariant(v.variantId)}
                                                        className="form-checkbox"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                                </td>
                                                <td className="px-3 py-2">{v.productName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                                <button
                                    type="button"
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-full text-sm border ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Product Details */}
                {details.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-2">
                            Chi tiết sản phẩm đã chọn ({selectedVariants.length})
                        </h4>
                        <table className="min-w-full border text-sm">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border px-2 py-1 text-center">
                                        <input
                                            type="checkbox"
                                            ref={selectAllDetailsCheckboxRef}
                                            checked={areAllDetailsOnPageSelected}
                                            onChange={handleSelectAllDetails}
                                            className="form-checkbox"
                                        />
                                    </th>
                                    <th className="border px-2 py-1">STT</th>
                                    <th className="border px-2 py-1">Tên</th>
                                    <th className="border px-2 py-1">Thương hiệu</th>
                                    <th className="border px-2 py-1">Màu sắc</th>
                                    <th className="border px-2 py-1">Kích cỡ</th>
                                    <th className="border px-2 py-1">Giá gốc</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentDetailRows.map((d, i) => (
                                    <tr key={d.variantId}>
                                        <td className="border px-2 py-1 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedVariants.includes(d.variantId)}
                                                onChange={() => handleSelectDetail(d.variantId)}
                                                className="form-checkbox"
                                            />
                                        </td>
                                        <td className="border px-2 py-1 text-center">
                                            {(detailPage - 1) * detailPerPage + i + 1}
                                        </td>
                                        <td className="border px-2 py-1">{d.productName}</td>
                                        <td className="border px-2 py-1">{d.brandName}</td>
                                        <td className="border px-2 py-1">{d.colorName}</td>
                                        <td className="border px-2 py-1">{d.sizeName}</td>
                                        <td className="border px-2 py-1">
                                            {d.price.toLocaleString()}₫
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {Array.from({ length: detailPageCount }, (_, i) => i + 1).map(page => (
                                <button
                                    type="button"
                                    key={page}
                                    onClick={() => setDetailPage(page)}
                                    className={`w-8 h-8 rounded-full text-sm border ${page === detailPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
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