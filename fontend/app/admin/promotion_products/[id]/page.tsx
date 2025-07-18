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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function validateDiscountAgainstPrice(
    discountType: string,
    discountValue: number,
    details: ProductVariantDetail[]
): string {
    if (discountType !== 'fixed_amount' || details.length === 0 || discountValue === 0) {
        return '';
    }
    const minPrice = Math.min(...details.map(d => d.price));
    if (discountValue > minPrice) {
        return `Số tiền giảm không được lớn hơn giá gốc thấp nhất (${minPrice.toLocaleString()}₫).`;
    }
    return '';
}

export default function EditPromotionProductPage() {
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
        isActive: true,
    });

    const [errors, setErrors] = useState<{ [k: string]: string }>({});
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
    const [details, setDetails] = useState<ProductVariantDetail[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const itemsPerPage = 5;

    const id = params?.id;
    const isValidId = Boolean(id && !Array.isArray(id));

    const formatDateTimeLocal = (d: string) =>
        new Date(d).toISOString().slice(0, 16);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        let newFormState = { ...form };
        let basicErrorMsg = '';

        if (name === 'discountValue') {
            if (!/^\d*$/.test(value)) return;

            const numValue = value === '' ? 0 : parseInt(value, 10);
            newFormState.discountValue = numValue;

            if (numValue <= 0 && value !== '') {
                basicErrorMsg = 'Giá trị phải lớn hơn 0.';
            } else if (form.discountType === 'percentage' && numValue > 100) {
                basicErrorMsg = 'Phần trăm không quá 100%.';
            }
        } else if (name === 'discountType') {
            newFormState.discountType = value;
            newFormState.discountValue = 0;
        } else if (name === 'isActive') {
            newFormState.isActive = value === 'active';
        } else {
            newFormState = { ...newFormState, [name]: value };
        }

        setForm(newFormState);

        const priceError = validateDiscountAgainstPrice(
            newFormState.discountType,
            newFormState.discountValue,
            details
        );

        setErrors(p => ({
            ...p,
            [name]: '',
            discountValue: priceError || basicErrorMsg
        }));
    };

    const handleToggleVariant = (vid: number) => {
        setSelectedVariants((prev) =>
            prev.includes(vid) ? prev.filter((x) => x !== vid) : [...prev, vid]
        );
    };

    const handleSelectProductGroup = (productName: string) => {
        const groupVariantIds = variants
            .filter(v => v.productName === productName)
            .map(v => v.variantId);

        const isAnySelected = groupVariantIds.some(id => selectedVariants.includes(id));

        if (isAnySelected) {
            setSelectedVariants(prev => prev.filter(id => !groupVariantIds.includes(id)));
        } else {
            // Fix Set iteration issue by using Array.from with a Set to remove duplicates
            setSelectedVariants(prev => {
                const combinedArray = [...prev, ...groupVariantIds];
                return Array.from(new Set(combinedArray));
            });
        }
    };


    useEffect(() => {
        if (!isValidId || status !== 'authenticated' || !session?.accessToken) return;
        setLoading(true);
        fetch(`${API_URL}/api/promotion-products/${id}/edit`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((r) => r.json())
            .then((res) => {
                const data = res.data || res;
                setForm({
                    promotionName: data.promotionName,
                    description: data.description || '',
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    startDate: formatDateTimeLocal(data.startDate),
                    endDate: formatDateTimeLocal(data.endDate),
                    isActive: data.isActive,
                });
                setSelectedVariants(data.variantIds || []);
            })
            .catch(() => {
                alert('Không thể tải dữ liệu đợt giảm giá');
                router.push('/admin/promotion_products');
            })
            .finally(() => setLoading(false));
    }, [id, isValidId, session, status, router]);

    useEffect(() => {
        if (!isValidId || !session?.accessToken) return;
        axios
            .get(`${API_URL}/api/product-variants/for-selection`, {
                params: { page: 0, size: 500 },
                headers: { Authorization: `Bearer ${session.accessToken}` },
            })
            .then((r) => setVariants(r.data.data.content || []))
            .catch(console.error);
    }, [isValidId, session]);

    useEffect(() => {
        if (!isValidId || !session?.accessToken) return;
        if (selectedVariants.length === 0) {
            setDetails([]);
            setErrors(p => ({ ...p, discountValue: '' }));
            return;
        }

        axios
            .post(
                `${API_URL}/api/product-variants/details`,
                selectedVariants,
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )
            .then((r) => {
                const newDetails = r.data;
                setDetails(newDetails);

                const priceError = validateDiscountAgainstPrice(
                    form.discountType,
                    form.discountValue,
                    newDetails
                );
                if (!errors.discountValue || errors.discountValue.includes('giá gốc')) {
                    setErrors(p => ({ ...p, discountValue: priceError }));
                }
            })
            .catch(console.error);
    }, [selectedVariants, isValidId, session, form.discountType, form.discountValue, errors.discountValue]);


    const validateForm = () => {
        const e: { [k: string]: string } = {};
        const trimmedName = form.promotionName.trim();

        if (!trimmedName) e.promotionName = 'Tên đợt giảm giá là bắt buộc.';
        else if (/^\d+$/.test(trimmedName)) e.promotionName = 'Tên đợt giảm giá không thể chỉ chứa số.';

        if (!form.startDate) e.startDate = 'Từ ngày là bắt buộc.';
        if (!form.endDate) e.endDate = 'Đến ngày là bắt buộc.';
        if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
            e.endDate = 'Đến ngày phải sau Từ ngày.';
        }

        // *** BẮT ĐẦU THAY ĐỔI: Thêm logic xác thực trạng thái ***
        // Không cho phép kích hoạt một chương trình khuyến mãi đã hết hạn
        if (form.isActive && form.endDate && new Date(form.endDate) < new Date()) {
            e.isActive = 'Không thể kích hoạt đợt giảm giá đã hết hạn.';
        }
        // *** KẾT THÚC THAY ĐỔI ***

        const v = form.discountValue;
        if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && v <= 0) {
            e.discountValue = 'Giá trị phải lớn hơn 0.';
        }
        if (form.discountType === 'percentage' && v > 100) {
            e.discountValue = 'Phần trăm không quá 100%.';
        }

        const priceError = validateDiscountAgainstPrice(form.discountType, form.discountValue, details);
        if (priceError) {
            e.discountValue = priceError;
        }

        if (selectedVariants.length === 0) e.variants = 'Chọn ít nhất 1 sản phẩm.';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            await axios.put(
                `${API_URL}/api/promotion-products/${id}`,
                {
                    ...form,
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
            alert('✅ Cập nhật thành công!');
            router.push('/admin/promotion_products');
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                const msg = err.response?.data?.message || err.message;
                if (msg.toLowerCase().includes('tồn tại')) {
                    setErrors((p) => ({ ...p, promotionName: 'Tên đã tồn tại.' }));
                } else {
                    alert('❌ ' + msg);
                }
            } else {
                alert('❌ Lỗi không xác định');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const uniqueProducts = variants
        .filter(v => v.productName.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((v, i, a) => a.findIndex(p => p.productName === v.productName) === i);

    const pageCount = Math.ceil(uniqueProducts.length / itemsPerPage);
    const currentProductGroups = uniqueProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (!isValidId) return <div className="p-8 text-center">ID không hợp lệ</div>;
    if (status === 'loading' || loading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
            </div>
        );
    if (status !== 'authenticated')
        return <div className="p-8 text-center">Bạn cần đăng nhập để truy cập trang này.</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow mt-6">
            <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800 mb-4"
            >
                ← Quay lại
            </button>
            <h2 className="text-2xl font-bold mb-6">Chỉnh sửa đợt giảm giá</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 font-medium">Tên đợt giảm giá <span className="text-red-500">*</span></label>
                            <input name="promotionName" value={form.promotionName} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                            {errors.promotionName && <p className="text-red-600 text-sm">{errors.promotionName}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Loại giảm <span className="text-red-500">*</span></label>
                            <select name="discountType" value={form.discountType} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                                <option value="percentage">Giảm %</option>
                                <option value="fixed_amount">Giảm số tiền</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Giá trị giảm <span className="text-red-500">*</span></label>
                            <input name="discountValue" type="text" inputMode="numeric" pattern="[0-9]*" value={form.discountValue || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                            {errors.discountValue && <p className="text-red-600 text-sm">{errors.discountValue}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Từ ngày <span className="text-red-500">*</span></label>
                            <input name="startDate" type="datetime-local" value={form.startDate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                            {errors.startDate && <p className="text-red-600 text-sm">{errors.startDate}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Đến ngày <span className="text-red-500">*</span></label>
                            <input name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                            {errors.endDate && <p className="text-red-600 text-sm">{errors.endDate}</p>}
                        </div>
                        {/*<div>*/}
                        {/*    <label className="block mb-1 font-medium">Trạng thái <span className="text-red-500">*</span></label>*/}
                        {/*    <select name="isActive" value={form.isActive ? 'active' : 'inactive'} onChange={handleChange} className="w-full border px-3 py-2 rounded">*/}
                        {/*        <option value="active">Đang hoạt động</option>*/}
                        {/*        <option value="inactive">Không hoạt động</option>*/}
                        {/*    </select>*/}
                        {/*    /!* *** BẮT ĐẦU THAY ĐỔI: Thêm hiển thị lỗi cho trạng thái *** *!/*/}
                        {/*    {errors.isActive && <p className="text-red-600 text-sm">{errors.isActive}</p>}*/}
                        {/*    /!* *** KẾT THÚC THAY ĐỔI *** *!/*/}
                        {/*</div>*/}
                        <div className="flex gap-4">
                            <button type="button" onClick={() => router.back()} className="bg-gray-500 text-white px-6 py-2 rounded">Hủy</button>
                            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50">{submitting ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Chọn sản phẩm áp dụng</h3>
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => {
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
                                        <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProductGroups.map((product, i) => {
                                        const groupVariantIds = variants
                                            .filter(v => v.productName === product.productName)
                                            .map(v => v.variantId);

                                        const areAllSelected = groupVariantIds.length > 0 && groupVariantIds.every(id => selectedVariants.includes(id));

                                        return (
                                            <tr key={product.variantId} className="border-t">
                                                <td className="px-3 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={areAllSelected}
                                                        onChange={() => handleSelectProductGroup(product.productName)}
                                                        className="form-checkbox"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {(currentPage - 1) * itemsPerPage + i + 1}
                                                </td>
                                                <td className="px-3 py-2">{product.productName}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {pageCount > 1 && (
                            <div className="flex justify-center gap-2 mt-3">
                                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 rounded-full border text-sm ${p === currentPage
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-gray-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {details.length > 0 && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-2">
                            Chi tiết sản phẩm đã chọn ({details.length})
                        </h4>
                        <div className="border rounded overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-200 font-semibold">
                                    <tr>
                                        <th className="px-3 py-2">Bỏ chọn</th>
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
                                    {details.map((d, i) => (
                                        <tr key={d.variantId}>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVariants.includes(d.variantId)}
                                                    onChange={() => handleToggleVariant(d.variantId)}
                                                    className="form-checkbox"
                                                />
                                            </td>
                                            <td className="px-2 py-1 text-center">{i + 1}</td>
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
                    </div>
                )}
            </form>
        </div>
    );
}