// 'use client';
//
// import { useEffect, useState } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { useSession } from 'next-auth/react';
// import { Session } from 'next-auth';
//
// const formatDateForInput = (dateString: string) =>
//     dateString ? new Date(dateString).toISOString().slice(0, 16) : '';
//
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
//
// interface CustomSession extends Session {
//     accessToken?: string;
// }
//
// export default function EditVoucherPage() {
//     const router = useRouter();
//     const params = useParams();
//     const idRaw = params?.id;
//     const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
//     const numericId = id ? Number(id) : NaN;
//
//     const { data: session, status } = useSession() as { data: CustomSession | null; status: 'authenticated' | 'unauthenticated' | 'loading' };
//
//     const [loading, setLoading] = useState(false);
//     const [originalName, setOriginalName] = useState('');
//     const [errors, setErrors] = useState<Record<string,string>>({});
//     const [form, setForm] = useState({
//         id: 0,
//         voucherCode: '',
//         promotionName: '',
//         discountType: 'percentage',
//         discountValue: 0,
//         description: '',
//         minimumOrderValue: 0,
//         maximumDiscountValue: 0,
//         usageLimitPerUser: 1,
//         usageLimitTotal: 0,
//         isStackable: false,
//         startDate: '',
//         endDate: '',
//         isActive: true,
//     });
//
//     // Voucher đã hết hạn?
//     const isExpired = !!form.endDate && new Date(form.endDate) < new Date();
//
//     useEffect(() => {
//         if (isNaN(numericId) || status !== 'authenticated' || !session?.accessToken) return;
//         (async () => {
//             try {
//                 console.log('Fetching voucher with ID:', numericId);
//                 const res = await fetch(`${API_URL}/api/vouchers/${numericId}`, {
//                     headers: {
//                         'Authorization': `Bearer ${session?.accessToken}`,
//                     },
//                 });
//                 console.log('Response status:', res.status);
//                 console.log('Response headers:', res.headers);
//
//                 if (!res.ok) {
//                     const errorText = await res.text();
//                     console.log('Error response text:', errorText);
//                     throw new Error(`HTTP ${res.status}: ${errorText}`);
//                 }
//
//                 const responseText = await res.text();
//                 console.log('Response text:', responseText);
//
//                 if (!responseText) {
//                     throw new Error('Empty response from server');
//                 }
//
//                 const json = JSON.parse(responseText);
//                 const data = json.data ?? json;
//                 console.log('Parsed data:', data);
//                 setForm({
//                     id: data.voucherId,
//                     voucherCode: data.voucherCode,
//                     promotionName: data.voucherName,
//                     discountType: data.discountType,
//                     discountValue: data.discountValue,
//                     description: data.description ?? '',
//                     minimumOrderValue: data.minimumOrderValue,
//                     maximumDiscountValue: data.maximumDiscountValue ?? 0,
//                     usageLimitPerUser: data.usageLimitPerUser,
//                     usageLimitTotal: data.usageLimitTotal ?? 0,
//                     isStackable: data.isStackable,
//                     startDate: formatDateForInput(data.startDate),
//                     endDate: formatDateForInput(data.endDate),
//                     isActive: data.isActive,
//                 });
//                 setOriginalName(data.voucherName || data.promotionName);
//                             } catch (e: Error | unknown) {
//                 console.error('Full error:', e);
//                 const errorMessage = e instanceof Error ? e.message : 'Unknown error';
//                 alert('Không tải được voucher: ' + errorMessage);
//                 router.push('/admin/promotion_management/vouchers');
//             }
//         })();
//     }, [numericId, router, status, session?.accessToken]);
//
//     const handleChange = (
//         e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>
//     ) => {
//         const { name, type, value } = e.target;
//         let v: string | number | boolean = value;
//         if (type === 'number') v = Number(value);
//         if (name === 'isActive') v = value === 'active';
//         setForm(f => ({ ...f, [name]: v }));
//         setErrors(err => ({ ...err, [name]: '' }));
//     };
//
//     const checkDuplicateName = async (name: string): Promise<boolean> => {
//         if (name === originalName) return false;
//         const res = await fetch(
//             `${API_URL}/api/vouchers/check-name?name=${encodeURIComponent(name)}`,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${session?.accessToken}`,
//                 },
//             }
//         );
//         const { exists } = await res.json();
//         return exists;
//     };
//
//     const validateForm = async () => {
//         const err: Record<string,string> = {};
//         if (!form.promotionName) err.promotionName = 'Vui lòng nhập tên.';
//         else if (await checkDuplicateName(form.promotionName))
//             err.promotionName = 'Tên đã tồn tại.';
//         if (!form.startDate) err.startDate = 'Chọn ngày bắt đầu.';
//         if (!form.endDate) err.endDate = 'Chọn ngày kết thúc.';
//         if (
//             form.startDate &&
//             form.endDate &&
//             new Date(form.startDate) >= new Date(form.endDate)
//         ) {
//             err.startDate = 'Bắt đầu phải trước kết thúc.';
//             err.endDate = 'Kết thúc phải sau bắt đầu.';
//         }
//         if (
//             (form.discountType === 'percentage' || form.discountType === 'fixed_amount') &&
//             form.discountValue <= 0
//         ) {
//             err.discountValue = 'Giá trị phải lớn hơn 0.';
//         }
//         if (form.discountType === 'percentage' && form.discountValue > 100)
//             err.discountValue = 'Không vượt quá 100%';
//         if (form.discountType === 'fixed_amount' && form.discountValue > 1_000_000)
//             err.discountValue = 'Không vượt quá 1.000.000₫';
//
//         const voucherCodePattern = /^[A-Z0-9_-]{3,50}$/;
//
//         if (!form.voucherCode) err.voucherCode = 'Mã voucher bắt buộc.';
//         else if (!voucherCodePattern.test(form.voucherCode))
//             err.voucherCode = 'Mã chỉ gồm A-Z, 0-9, _, - (3-50 ký tự)';
//
//         if (form.minimumOrderValue <= 0) err.minimumOrderValue = 'Giá trị tối thiểu > 0';
//
//         if (form.maximumDiscountValue && form.maximumDiscountValue < 0)
//             err.maximumDiscountValue = 'Giảm tối đa không hợp lệ';
//
//         if (form.usageLimitPerUser && form.usageLimitPerUser < 1)
//             err.usageLimitPerUser = 'Số lần / người tối thiểu 1';
//
//         if (form.usageLimitTotal && form.usageLimitTotal < 0)
//             err.usageLimitTotal = 'Giới hạn tổng không hợp lệ';
//         setErrors(err);
//         return Object.keys(err).length === 0;
//     };
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!(await validateForm())) return;
//         setLoading(true);
//         try {
//             const res = await fetch(`${API_URL}/api/vouchers/${form.id}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${session?.accessToken}`,
//                 },
//                 body: JSON.stringify({
//                     ...form,
//                     voucherCode: form.voucherCode,
//                     promotionName: form.promotionName,
//                 }),
//             });
//             if (!res.ok) throw new Error(await res.text());
//             alert('Cập nhật thành công!');
//             router.push('/admin/promotion_management/vouchers');
//         } catch (e: Error | unknown) {
//             const errorMessage = e instanceof Error ? e.message : 'Unknown error';
//             alert('Lỗi: ' + errorMessage);
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
//     if (isNaN(numericId)) {
//         return <p className="text-center text-red-600 mt-10">❌ ID không hợp lệ</p>;
//     }
//
//     return (
//         <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-xl space-y-5 mt-6">
//             <h2 className="text-xl font-semibold">Cập nhật Phiếu Giảm Giá</h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 {/* Mã voucher */}
//                 <div>
//                     <Label text="Mã voucher" required />
//                     <input
//                         name="voucherCode"
//                         value={form.voucherCode}
//                         readOnly
//                         className="w-full border bg-gray-100 px-3 py-2 rounded cursor-not-allowed"
//                     />
//                 </div>
//
//                 {/* Tên chương trình */}
//                 <div>
//                     <Label text="Tên chương trình" required />
//                     <input
//                         name="promotionName"
//                         value={form.promotionName}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.promotionName && (
//                         <p className="text-red-600 text-sm">{errors.promotionName}</p>
//                     )}
//                 </div>
//
//                 {/* Mô tả */}
//                 <div>
//                     <Label text="Mô tả" />
//                     <textarea
//                         name="description"
//                         value={form.description}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                 </div>
//
//                 {/* Loại giảm */}
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
//                 {/* Giá trị giảm */}
//                 <div>
//                     <Label text="Giá trị giảm" required />
//                     <input
//                         name="discountValue"
//                         type="number"
//                         min={0}
//                         value={
//                             form.discountType === 'free_shipping'
//                                 ? ''
//                                 : form.discountValue || ''
//                         }
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                         disabled={form.discountType === 'free_shipping'}
//                     />
//                     {errors.discountValue && (
//                         <p className="text-red-600 text-sm">{errors.discountValue}</p>
//                     )}
//                 </div>
//
//                 {/* Minimum order value */}
//                 <div>
//                     <Label text="Giá trị đơn tối thiểu (₫)" required />
//                     <input
//                         name="minimumOrderValue"
//                         type="number"
//                         value={form.minimumOrderValue}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.minimumOrderValue && (
//                         <p className="text-red-600 text-sm">{errors.minimumOrderValue}</p>
//                     )}
//                 </div>
//
//                 {/* Maximum discount value */}
//                 <div>
//                     <Label text="Giảm tối đa (đ – có thể bỏ trống)" />
//                     <input
//                         name="maximumDiscountValue"
//                         type="number"
//                         value={form.maximumDiscountValue}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.maximumDiscountValue && (
//                         <p className="text-red-600 text-sm">{errors.maximumDiscountValue}</p>
//                     )}
//                 </div>
//
//                 {/* Usage limit per user */}
//                 <div>
//                     <Label text="Số lần / người" />
//                     <input
//                         name="usageLimitPerUser"
//                         type="number"
//                         value={form.usageLimitPerUser}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.usageLimitPerUser && (
//                         <p className="text-red-600 text-sm">{errors.usageLimitPerUser}</p>
//                     )}
//                 </div>
//
//                 {/* Usage limit total */}
//                 <div>
//                     <Label text="Giới hạn tổng" />
//                     <input
//                         name="usageLimitTotal"
//                         type="number"
//                         value={form.usageLimitTotal}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.usageLimitTotal && (
//                         <p className="text-red-600 text-sm">{errors.usageLimitTotal}</p>
//                     )}
//                 </div>
//
//                 {/* Is stackable */}
//                 <div className="flex items-center space-x-3">
//                     <input
//                         type="checkbox"
//                         name="isStackable"
//                         checked={!!form.isStackable}
//                         onChange={handleChange}
//                         className="w-5 h-5"
//                     />
//                     <label className="text-sm">Cho phép cộng dồn</label>
//                 </div>
//
//                 {/* Ngày bắt đầu */}
//                 <div>
//                     <Label text="Ngày bắt đầu" required />
//                     <input
//                         name="startDate"
//                         type="datetime-local"
//                         value={form.startDate}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.startDate && (
//                         <p className="text-red-600 text-sm">{errors.startDate}</p>
//                     )}
//                 </div>
//
//                 {/* Ngày kết thúc */}
//                 <div>
//                     <Label text="Ngày kết thúc" required />
//                     <input
//                         name="endDate"
//                         type="datetime-local"
//                         value={form.endDate}
//                         onChange={handleChange}
//                         className="w-full border px-3 py-2 rounded"
//                     />
//                     {errors.endDate && (
//                         <p className="text-red-600 text-sm">{errors.endDate}</p>
//                     )}
//                 </div>
//
//                 {/* Combobox Trạng thái */}
//                 <div>
//                     <Label text="Trạng thái" required />
//                     <select
//                         name="isActive"
//                         value={form.isActive ? 'active' : 'inactive'}
//                         onChange={handleChange}
//                         disabled={isExpired}
//                         className="w-full border px-3 py-2 rounded bg-white"
//                     >
//                         <option value="active">Đang hoạt động</option>
//                         <option value="inactive">Không hoạt động</option>
//                     </select>
//                     {isExpired && (
//                         <p className="text-sm text-gray-500 mt-1">
//                             Voucher đã hết hạn, không thể thay đổi trạng thái.
//                         </p>
//                     )}
//                 </div>
//
//                 {/* Submit */}
//                 <div className="text-right">
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow disabled:opacity-50"
//                     >
//                         {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }
//


'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

const formatDateForInput = (dateString: string) =>
    dateString ? new Date(dateString).toISOString().slice(0, 16) : '';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface CustomSession extends Session {
    accessToken?: string;
}

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const idRaw = params?.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    const numericId = id ? Number(id) : NaN;

    const { data: session, status } = useSession() as { data: CustomSession | null; status: 'authenticated' | 'unauthenticated' | 'loading' };

    const [loading, setLoading] = useState(true);
    const [originalName, setOriginalName] = useState('');
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [form, setForm] = useState({
        id: 0,
        voucherCode: '',
        promotionName: '',
        discountType: 'percentage',
        discountValue: 0,
        description: '',
        minimumOrderValue: 0,
        maximumDiscountValue: 0,
        usageLimitPerUser: 1,
        usageLimitTotal: 0,
        isStackable: false,
        startDate: '',
        endDate: '',
        isActive: true,
    });

    useEffect(() => {
        if (isNaN(numericId) || status !== 'authenticated' || !session?.accessToken) return;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/vouchers/${numericId}`, {
                    headers: { 'Authorization': `Bearer ${session?.accessToken}` },
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                }

                const json = await res.json();
                const data = json.data ?? json;
                setForm({
                    id: data.voucherId,
                    voucherCode: data.voucherCode,
                    promotionName: data.voucherName,
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    description: data.description ?? '',
                    minimumOrderValue: data.minimumOrderValue,
                    maximumDiscountValue: data.maximumDiscountValue ?? 0,
                    usageLimitPerUser: data.usageLimitPerUser,
                    usageLimitTotal: data.usageLimitTotal ?? 0,
                    isStackable: data.isStackable,
                    startDate: formatDateForInput(data.startDate),
                    endDate: formatDateForInput(data.endDate),
                    isActive: data.isActive,
                });
                setOriginalName(data.voucherName || data.promotionName);
                setLoading(false);
            } catch (e: Error | unknown) {
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                alert('Không tải được voucher: ' + errorMessage);
                router.push('/admin/promotion_management/vouchers');
            }
        })();
    }, [numericId, router, status, session?.accessToken]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>
    ) => {
        const { name, type, value } = e.target;
        const checked = 'checked' in e.target ? e.target.checked : false;

        let v: string | number | boolean = value;
        if (type === 'checkbox') v = checked;
        else if (type === 'number') v = parseFloat(value);

        setForm(f => ({ ...f, [name]: v }));
        setErrors(err => ({ ...err, [name]: '' }));
    };

    const checkDuplicateName = async (name: string): Promise<boolean> => {
        if (name === originalName) return false;
        const res = await fetch(
            `${API_URL}/api/vouchers/check-name?name=${encodeURIComponent(name)}`,
            { headers: { 'Authorization': `Bearer ${session?.accessToken}` } }
        );
        const { exists } = await res.json();
        return exists;
    };

    const validateForm = async () => {
        const err: Record<string,string> = {};
        if (!form.promotionName) err.promotionName = 'Vui lòng nhập tên.';
        else if (await checkDuplicateName(form.promotionName))
            err.promotionName = 'Tên đã tồn tại.';
        if (!form.startDate) err.startDate = 'Chọn ngày bắt đầu.';
        if (!form.endDate) err.endDate = 'Chọn ngày kết thúc.';
        if (
            form.startDate &&
            form.endDate &&
            new Date(form.startDate) >= new Date(form.endDate)
        ) {
            err.endDate = 'Kết thúc phải sau bắt đầu.';
        }
        if (
            (form.discountType === 'percentage' || form.discountType === 'fixed_amount') &&
            (form.discountValue <= 0)
        ) {
            err.discountValue = 'Giá trị phải lớn hơn 0.';
        }
        if (form.discountType === 'percentage' && form.discountValue > 100)
            err.discountValue = 'Không vượt quá 100%';
        if (form.discountType === 'fixed_amount' && form.discountValue > 1_000_000)
            err.discountValue = 'Không vượt quá 1.000.000₫';

        const voucherCodePattern = /^[A-Z0-9_-]{3,50}$/;
        if (!form.voucherCode) err.voucherCode = 'Mã voucher bắt buộc.';
        else if (!voucherCodePattern.test(form.voucherCode))
            err.voucherCode = 'Mã chỉ gồm A-Z, 0-9, _, - (3-50 ký tự)';

        if (form.minimumOrderValue <= 0) err.minimumOrderValue = 'Giá trị tối thiểu > 0';

        if (form.maximumDiscountValue && form.maximumDiscountValue < 0)
            err.maximumDiscountValue = 'Giảm tối đa không hợp lệ';

        if (form.usageLimitPerUser && form.usageLimitPerUser < 1)
            err.usageLimitPerUser = 'Số lần / người tối thiểu 1';

        if (form.usageLimitTotal && form.usageLimitTotal < 0)
            err.usageLimitTotal = 'Giới hạn tổng không hợp lệ';

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(await validateForm())) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/vouchers/${form.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(await res.text());
            alert('Cập nhật thành công!');
            router.push('/admin/promotion_management/vouchers');
        } catch (e: Error | unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            alert('Lỗi: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ text, required }: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    if (isNaN(numericId)) {
        return <p className="text-center text-red-600 mt-10">❌ ID không hợp lệ</p>;
    }

    if (loading && !form.id) {
        return <div className="text-center p-10">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow border mt-6">
            <h2 className="text-2xl font-bold text-black-700 mb-6">Chỉnh sửa khuyến mãi</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <Label text="Tên khuyến mãi" required />
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
                    <Label text="Mã voucher" required />
                    <input
                        name="voucherCode"
                        value={form.voucherCode}
                        readOnly
                        className="w-full border bg-gray-100 px-3 py-2 rounded cursor-not-allowed"
                    />
                    {errors.voucherCode && (
                        <p className="text-red-600 text-sm">{errors.voucherCode}</p>
                    )}
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
                        min={0}
                        value={form.discountType === 'free_shipping' ? '' : form.discountValue || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        disabled={form.discountType === 'free_shipping'}
                    />
                    {errors.discountValue && (
                        <p className="text-red-600 text-sm">{errors.discountValue}</p>
                    )}
                </div>
                <div>
                    <Label text="Giá trị đơn tối thiểu (₫)" required />
                    <input
                        name="minimumOrderValue"
                        type="number"
                        min="0"
                        value={form.minimumOrderValue || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.minimumOrderValue && (
                        <p className="text-red-600 text-sm">{errors.minimumOrderValue}</p>
                    )}
                </div>
                <div>
                    <Label text="Giảm tối đa (₫ - không bắt buộc)" />
                    <input
                        name="maximumDiscountValue"
                        type="number"
                        min="0"
                        value={form.maximumDiscountValue || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.maximumDiscountValue && (
                        <p className="text-red-600 text-sm">{errors.maximumDiscountValue}</p>
                    )}
                </div>
                <div>
                    <Label text="Số lần / người" />
                    <input
                        name="usageLimitPerUser"
                        type="number"
                        min="0"
                        value={form.usageLimitPerUser || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.usageLimitPerUser && (
                        <p className="text-red-600 text-sm">{errors.usageLimitPerUser}</p>
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
                    {errors.startDate && (
                        <p className="text-red-600 text-sm">{errors.startDate}</p>
                    )}
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
                    {errors.endDate && (
                        <p className="text-red-600 text-sm">{errors.endDate}</p>
                    )}
                </div>
                <div>
                    <Label text="Số lượng" />
                    <input
                        name="usageLimitTotal"
                        type="number"
                        min="0"
                        value={form.usageLimitTotal || ''}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                    {errors.usageLimitTotal && (
                        <p className="text-red-600 text-sm">{errors.usageLimitTotal}</p>
                    )}
                </div>
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
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50"
                    >
                        {loading ? 'Đang cập nhật...' : 'Lưu khuyến mãi'}
                    </button>
                </div>
            </form>
        </div>
    );
}
