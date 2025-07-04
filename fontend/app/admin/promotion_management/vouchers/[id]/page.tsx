'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
};

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();

    const idRaw = params?.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    const numericId = id ? Number(id) : NaN;

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        id: 0,
        promotionCode: '',
        promotionName: '',
        discountType: 'percentage',
        discountValue: 0,
        description: '',
        startDate: '',
        endDate: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isNaN(numericId)) return;

        const fetchVoucher = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/promotions/${numericId}`);
                const result = await res.json();
                const data = result?.data ?? result;

                setForm({
                    ...data,
                    startDate: formatDateForInput(data.startDate),
                    endDate: formatDateForInput(data.endDate),
                });
            } catch (error) {
                alert('Không lấy được dữ liệu!');
            }
        };

        fetchVoucher();
    }, [numericId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, type, value,  } = e.target;
        let checked: any;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.promotionCode) newErrors.promotionCode = 'Vui lòng nhập mã khuyến mãi.';
        if (!form.promotionName) newErrors.promotionName = 'Vui lòng nhập tên chương trình.';
        if (!form.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu.';
        if (!form.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc.';

        const value = parseFloat(form.discountValue.toString());
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
        if (!validateForm()) return;

        setLoading(true);
        const token = session?.accessToken;

        try {
            const res = await fetch(`http://localhost:8080/api/promotions/${form.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    discountValue:
                        form.discountType === 'free_shipping'
                            ? 0
                            : parseFloat(form.discountValue.toString()),
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            alert('✅ Cập nhật thành công!');
            router.push('/admin/promotion_management/vouchers');
        } catch (err: any) {
            alert('❌ Lỗi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ text, required }: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    return (
        <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl space-y-5 mt-6">
            <h2 className="text-xl font-semibold">Cập nhật Phiếu Giảm Giá</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label text="Mã khuyến mãi" required />
                    <input
                        name="promotionCode"
                        value={form.promotionCode}
                        readOnly
                        className="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
                    />
                </div>
                <div>
                    <Label text="Tên chương trình" required />
                    <input
                        name="promotionName"
                        value={form.promotionName}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.promotionName && <p className="text-red-600 text-sm">{errors.promotionName}</p>}
                </div>
                <div>
                    <Label text="Mô tả" />
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <Label text="Loại giảm" required />
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
                    <Label text="Giá trị giảm" required />
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
                    <Label text="Ngày bắt đầu" required />
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
                    <Label text="Ngày kết thúc" required />
                    <input
                        name="endDate"
                        type="datetime-local"
                        value={form.endDate}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.endDate && <p className="text-red-600 text-sm">{errors.endDate}</p>}
                </div>
                <label className="flex items-center space-x-2">
                    <input
                        name="isActive"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="w-5 h-5"
                    />
                    <span>Kích hoạt</span>
                </label>
                <div className="text-right">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow disabled:opacity-50"
                    >
                        {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
}