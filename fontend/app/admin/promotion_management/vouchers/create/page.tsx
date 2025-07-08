// 'use client';
//
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useSession } from 'next-auth/react';
//
// export default function CreateVoucherPage() {
//     const router = useRouter();
//     const { data: session } = useSession();
//     const [loading, setLoading] = useState(false);
//
//     const [form, setForm] = useState({
//         promotionName: '',
//         description: '',
//         discountType: 'percentage',
//         discountValue: 0,
//         startDate: '',
//         endDate: '',
//         isActive: true,
//     });
//
//     const [errors, setErrors] = useState<{ [key: string]: string }>({});
//
//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//     ) => {
//         const { name, value, type } = e.target;
//         const checked = 'checked' in e.target ? e.target.checked : false;
//         setForm((prev) => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value,
//         }));
//         setErrors((prev) => ({ ...prev, [name]: '' }));
//     };
//
//     const validateForm = () => {
//         const newErrors: { [key: string]: string } = {};
//
//         if (!form.promotionName) newErrors.promotionName = 'Tên khuyến mãi là bắt buộc.';
//         if (!form.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
//         if (!form.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc.';
//
//         const value = parseFloat(form.discountValue.toString());
//         if ((form.discountType === 'percentage' || form.discountType === 'fixed_amount') && value <= 0) {
//             newErrors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
//         }
//         if (form.discountType === 'percentage' && value > 100) {
//             newErrors.discountValue = 'Phần trăm giảm không được vượt quá 100%.';
//         }
//         if (form.discountType === 'fixed_amount' && value > 1000000) {
//             newErrors.discountValue = 'Số tiền giảm không được vượt quá 1.000.000₫.';
//         }
//         if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
//             newErrors.startDate = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc.';
//             newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
//         }
//
//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!validateForm()) return;
//         setLoading(true);
//
//         const token = session?.accessToken;
//
//         try {
//             const res = await fetch('http://localhost:8080/api/promotions', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     ...form,
//                     isActive: !!form.isActive, // ✅ Luôn boolean
//                     discountValue: form.discountType === 'free_shipping' ? 0 : parseFloat(form.discountValue.toString()),
//                 }),
//             });
//
//             if (!res.ok) throw new Error(await res.text());
//
//             alert('✅ Tạo khuyến mãi thành công!');
//             router.push('/admin/promotion_management/vouchers');
//         } catch (e) {
//             alert('❌ Lỗi: ' + e);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const Label = ({ text, required }: { text: string; required?: boolean }) => (
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//             {text} {required && <span className="text-red-500">*</span>}
//         </label>
//     );
//
//     return (
//         <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow border mt-6">
//             <h2 className="text-2xl font-bold text-black-700 mb-6">Thêm khuyến mãi</h2>
//             <form onSubmit={handleSubmit} className="space-y-5">
//                 <div>
//                     <Label text="Tên khuyến mãi" required />
//                     <input
//                         name="promotionName"
//                         value={form.promotionName}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.promotionName && <p className="text-red-600 text-sm">{errors.promotionName}</p>}
//                 </div>
//
//                 <div>
//                     <Label text="Loại giảm" required />
//                     <select
//                         name="discountType"
//                         value={form.discountType}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     >
//                         <option value="percentage">Giảm theo %</option>
//                         <option value="fixed_amount">Giảm số tiền</option>
//                         <option value="free_shipping">Miễn phí vận chuyển</option>
//                     </select>
//                 </div>
//
//                 <div>
//                     <Label text="Giá trị giảm" required />
//                     <input
//                         name="discountValue"
//                         type="number"
//                         value={
//                             form.discountType === 'free_shipping'
//                                 ? ''
//                                 : form.discountValue === 0
//                                     ? ''
//                                     : form.discountValue
//                         }
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                         disabled={form.discountType === 'free_shipping'}
//                     />
//                     {errors.discountValue && <p className="text-red-600 text-sm">{errors.discountValue}</p>}
//                 </div>
//
//                 <div>
//                     <Label text="Ngày bắt đầu" required />
//                     <input
//                         name="startDate"
//                         type="datetime-local"
//                         value={form.startDate}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.startDate && <p className="text-red-600 text-sm">{errors.startDate}</p>}
//                 </div>
//
//                 <div>
//                     <Label text="Ngày kết thúc" required />
//                     <input
//                         name="endDate"
//                         type="datetime-local"
//                         value={form.endDate}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.endDate && <p className="text-red-600 text-sm">{errors.endDate}</p>}
//                 </div>
//
//                 <div className="flex items-center space-x-3">
//                     <input
//                         type="checkbox"
//                         name="isActive"
//                         checked={!!form.isActive}
//                         onChange={handleChange}
//                         className="w-5 h-5"
//                     />
//                     <label className="text-sm text-gray-700">
//                         {form.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
//                     </label>
//                 </div>
//
//                 <div className="flex justify-end">
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50"
//                     >
//                         {loading ? 'Đang lưu...' : 'Lưu khuyến mãi'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreateVoucherPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        promotionName: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
        isActive: true,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = 'checked' in e.target ? e.target.checked : false;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const checkPromotionNameExists = async (name: string) => {
        try {
            const res = await fetch(
                `http://localhost:8080/api/promotions/check-name?name=${encodeURIComponent(name)}`
            );
            if (!res.ok) throw new Error('Failed to check name');
            const data = await res.json();
            return data.exists;
        } catch (error) {
            console.error('Check name error:', error);
            return false;
        }
    };

    const validateForm = async () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.promotionName) {
            newErrors.promotionName = 'Tên khuyến mãi là bắt buộc.';
        } else {
            const exists = await checkPromotionNameExists(form.promotionName);
            if (exists) {
                newErrors.promotionName = 'Tên khuyến mãi đã tồn tại.';
            }
        }

        if (!form.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
        if (!form.endDate) newErrors.endDate = 'Ngày kết thúc là bắt buộc.';

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
        const isValid = await validateForm();
        if (!isValid) return;
        setLoading(true);

        const token = session?.accessToken;

        try {
            const res = await fetch('http://localhost:8080/api/promotions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    isActive: !!form.isActive,
                    discountValue: form.discountType === 'free_shipping' ? 0 : parseFloat(form.discountValue.toString()),
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

    const Label = ({ text, required }: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow border mt-6">
            <h2 className="text-2xl font-bold text-black-700 mb-6">Thêm khuyến mãi</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label text="Tên khuyến mãi" required />
                    <input
                        name="promotionName"
                        value={form.promotionName}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.promotionName && <p className="text-red-600 text-sm">{errors.promotionName}</p>}
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
                    {errors.discountValue && <p className="text-red-600 text-sm">{errors.discountValue}</p>}
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

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={!!form.isActive}
                        onChange={handleChange}
                        className="w-5 h-5"
                    />
                    <label className="text-sm text-gray-700">
                        {form.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </label>
                </div>

                <div className="flex justify-end">
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

