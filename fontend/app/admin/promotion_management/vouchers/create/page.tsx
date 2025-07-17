'use client';

import {useState, useEffect, useRef, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';

export default function CreateVoucherPage() {
    const router = useRouter();
    const {data: session} = useSession();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        promotionName: '',
        voucherCode: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minimumOrderValue: 0,
        maximumDiscountValue: 0,
        usageLimitPerUser: 1,
        usageLimitTotal: 0,
        isStackable: false,
        startDate: '',
        endDate: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const {name, value, type} = e.target;
        const checked = 'checked' in e.target ? e.target.checked : false;

        let newValue: string | number | boolean = value;
        if (type === 'checkbox') newValue = checked;
        if (type === 'number') newValue = parseFloat(value);

        setForm((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        setErrors((prev) => ({...prev, [name]: ''}));
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const checkPromotionNameExists = useCallback(async (name: string) => {
        try {
            const res = await fetch(
                `${API_URL}/api/vouchers/check-name?name=${encodeURIComponent(name)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session?.accessToken}`,
                    },
                }
            );
            if (!res.ok) throw new Error('Failed to check name');
            const data = await res.json();
            return data.exists;
        } catch (error) {
            console.error('Check name error:', error);
            return false;
        }
    }, [API_URL, session?.accessToken]);

    // Debounce check name & code
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const [nameExists, setNameExists] = useState<boolean>(false);

    useEffect(() => {
        if (!form.promotionName) return;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            const exists = await checkPromotionNameExists(form.promotionName);
            setNameExists(exists);
        }, 500);
    }, [form.promotionName, checkPromotionNameExists]);

    const voucherCodePattern = /^[A-Z0-9_-]{3,50}$/;

    const validateForm = async () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.promotionName) {
            newErrors.promotionName = 'Tên khuyến mãi là bắt buộc.';
        } else if (nameExists) {
            newErrors.promotionName = 'Tên khuyến mãi đã tồn tại.';
        }

        if (!form.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
        if (!form.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc.';

        const value = parseFloat(form.discountValue.toString());

        if (!form.voucherCode) {
            newErrors.voucherCode = 'Mã voucher là bắt buộc.';
        } else if (!voucherCodePattern.test(form.voucherCode)) {
            newErrors.voucherCode = 'Mã voucher chỉ gồm A-Z, 0-9, dấu gạch và dài 3-50 ký tự.';
        }

        if (form.minimumOrderValue <= 0) newErrors.minimumOrderValue = 'Giá trị đơn tối thiểu > 0';

        if (form.maximumDiscountValue && form.maximumDiscountValue < 0)
            newErrors.maximumDiscountValue = 'Giá trị giảm tối đa không hợp lệ';

        if (form.usageLimitPerUser && form.usageLimitPerUser < 1)
            newErrors.usageLimitPerUser = 'Số lần / người ít nhất 1';

        if (form.usageLimitTotal && form.usageLimitTotal < 0)
            newErrors.usageLimitTotal = 'Giới hạn tổng không hợp lệ';

        if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && value <= 0) {
            newErrors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
        }
        if (form.discountType === 'percentage' && value > 100) {
            newErrors.discountValue = 'Phần trăm giảm không được vượt quá 100%.';
        }
        if (form.discountType === 'fixed_amount' && value > 1000000) {
            newErrors.discountValue = 'Số tiền giảm không được vượt quá 1.000.000₫.';
        }
        if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
            newErrors.startDate = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.';
            newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = await validateForm();
        if (!isValid) return;
        setLoading(true);

        const token = session?.accessToken;

        try {
            const res = await fetch(`${API_URL}/api/vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    isActive: !!form.isActive,
                    discountValue: form.discountType === 'free_shipping' ? 0 : parseFloat(form.discountValue.toString()),
                    voucherCode: form.voucherCode.trim(),
                    minimumOrderValue: form.minimumOrderValue,
                    maximumDiscountValue: form.maximumDiscountValue || null,
                    usageLimitPerUser: form.usageLimitPerUser,
                    usageLimitTotal: form.usageLimitTotal || null,
                    isStackable: form.isStackable,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            alert('✅ Tạo khuyến mãi thành công!');
            router.push('/admin/promotion_management/vouchers');
        } catch (e) {
            alert('❌ Lỗi: ' + e);
        } finally {
            setLoading(false);
        }
    };

    const Label = ({text, required}: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow border mt-6">
            <h2 className="text-2xl font-bold text-black-700 mb-6">Thêm khuyến mãi</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label text="Tên khuyến mãi" required/>
                    <input
                        name="promotionName"
                        value={form.promotionName}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.promotionName && <p className="text-red-600 text-sm">{errors.promotionName}</p>}
                </div>
                <div>
                    <Label text="Mã voucher" required/>
                    <input
                        name="voucherCode"
                        value={form.voucherCode}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.voucherCode && <p className="text-red-600 text-sm">{errors.voucherCode}</p>}
                </div>
                {/*/!* Mô tả *!/*/}
                {/*<div>*/}
                {/*    <Label text="Mô tả" />*/}
                {/*    <textarea*/}
                {/*        name="description"*/}
                {/*        value={form.description}*/}
                {/*        onChange={handleChange}*/}
                {/*        className="w-full border px-3 py-2 rounded"*/}
                {/*        placeholder="Nhập mô tả cho voucher (tùy chọn)"*/}
                {/*    />*/}
                {/*</div>*/}

                <div>
                    <Label text="Loại giảm" required/>
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
                    <Label text="Giá trị giảm" required/>
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
                    {errors.discountValue && <p className="text-red-600 text-sm">{errors.discountValue}</p>}
                </div>

                {/* Minimum Order Value */}
                <div>
                    <Label text="Giá trị đơn tối thiểu (₫)" required/>
                    <input
                        name="minimumOrderValue"
                        type="number"
                        value={form.minimumOrderValue || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.minimumOrderValue && <p className="text-red-600 text-sm">{errors.minimumOrderValue}</p>}
                </div>

                {/* Maximum Discount Value */}
                <div>
                    <Label text="Giảm tối đa (₫ - không bắt buộc)"/>
                    <input
                        name="maximumDiscountValue"
                        type="number"
                        value={form.maximumDiscountValue || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.maximumDiscountValue &&
                        <p className="text-red-600 text-sm">{errors.maximumDiscountValue}</p>}
                </div>

                {/* Usage Limit Per User */}
                <div>
                    <Label text="Số lần / người"/>
                    <input
                        name="usageLimitPerUser"
                        type="number"
                        value={form.usageLimitPerUser || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.usageLimitPerUser && <p className="text-red-600 text-sm">{errors.usageLimitPerUser}</p>}
                </div>
                <div>
                    <Label text="Ngày bắt đầu" required/>
                    <input
                        name="startDate"
                        type="datetime-local"
                        value={form.startDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.startDate && <p className="text-red-600 text-sm">{errors.startDate}</p>}
                </div>

                <div>
                    <Label text="Ngày kết thúc" required/>
                    <input
                        name="endDate"
                        type="datetime-local"
                        value={form.endDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.endDate && <p className="text-red-600 text-sm">{errors.endDate}</p>}
                </div>


                {/* Usage Limit Total */}
                <div>
                    <Label text="Số lượng"/>
                    <input
                        name="usageLimitTotal"
                        type="number"
                        value={form.usageLimitTotal || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.usageLimitTotal && <p className="text-red-600 text-sm">{errors.usageLimitTotal}</p>}
                </div>

                {/* Is Stackable */}
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        name="isStackable"
                        checked={!!form.isStackable}
                        onChange={handleChange}
                        className="w-5 h-5"
                    />
                    <label className="text-sm text-gray-700">Cho phép cộng dồn với chương trình khác</label>
                </div>

                <div className="flex items-center justify-end gap-4 pt-5 mt-5 border-t">
                    {/* Nút Hủy (thay cho link "Quay lại") */}
                    <button
                        type="button"
                        // Giả sử bạn có router từ useRouter() để xử lý việc quay lại trang trước
                        onClick={() => router.back()}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                    >
                        Hủy
                    </button>

                    {/* Nút Lưu chính */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu khuyến mãi'}
                    </button>
                </div>
            </form>
        </div>
    );
}

