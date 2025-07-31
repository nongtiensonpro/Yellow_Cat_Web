'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { X } from 'lucide-react';

interface Voucher {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    discountValue?: number;
    isActive?: boolean;
}

interface VoucherDetail {
    id: number;
    code: string;
    name: string;
    description: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    maxUsage: number;
    usageCount: number;
    minOrderValue: number;
    maxDiscountAmount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
    scopes: Array<{
        scopeType: string;
        targetNames: string[];
    }>;
}

// Component AddVoucherModal
function AddVoucherModal({ isOpen, onClose, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'users'>('products');
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);

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

    // Reset form function
    const resetForm = () => {
        setForm({
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
        setSelectedProducts([]);
        setSelectedCategories([]);
        setSelectedUsers([]);
        setErrors({});
        setActiveTab('products');
    };

    // Fetch target data
    const fetchTargetData = async () => {
        if (!session?.accessToken) return;
        setLoadingTargets(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        try {
            // Fetch products
            const productsRes = await fetch(`${API_URL}/api/products?page=0&size=100`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                console.log('Products API response:', productsData);
                setProducts(productsData.data?.content || []);
            }

            // Fetch categories
            const categoriesRes = await fetch(`${API_URL}/api/categories?page=0&size=100`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                console.log('Categories API response:', categoriesData);
                setCategories(categoriesData.data?.content || []);
            }

            // Fetch users
            const usersRes = await fetch(`${API_URL}/api/users/app-users`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                console.log('Users API response:', usersData);
                setUsers(usersData.data || []);
            }
        } catch (error) {
            console.error('Error fetching target data:', error);
        } finally {
            setLoadingTargets(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTargetData();
        } else {
            // Reset form when modal is closed
            resetForm();
        }
    }, [isOpen, session?.accessToken]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Chặn việc nhập ký tự không phải số và dấu chấm
        const char = String.fromCharCode(e.which);
        if (!/[0-9.]/.test(char)) {
            e.preventDefault();
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = 'checked' in e.target ? e.target.checked : false;

        // Log để debug format datetime
        if (name === 'startDate' || name === 'endDate') {
            console.log(`=== ${name} Change ===`);
            console.log('Raw value from input:', value);
            console.log('Value type:', typeof value);
            console.log('Value length:', value.length);
            console.log('Is valid date:', !isNaN(Date.parse(value)));
            if (value) {
                const date = new Date(value);
                console.log('Parsed date:', date);
                console.log('ISO string:', date.toISOString());
                console.log('Locale string:', date.toLocaleString('vi-VN'));
                console.log('=== End ===');
            }
        }

        // Validation cho input số - chỉ cho phép số và dấu chấm
        if (type === 'number') {
            // Kiểm tra nếu có ký tự không phải số hoặc dấu chấm
            if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
                return; // Không cập nhật nếu có ký tự không hợp lệ
            }
        }

        let newValue: string | number | boolean = value;
        if (type === 'checkbox') newValue = checked;
        if (type === 'number') newValue = parseFloat(value) || '';

        setForm((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.promotionName) {
            newErrors.promotionName = 'Tên khuyến mãi là bắt buộc.';
        }

        // Validation cho ngày bắt đầu
        if (!form.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
        } else {
            const startDate = new Date(form.startDate);
            // Lấy thời gian hiện tại (đã là giờ local)
            const now = new Date();

            // So sánh theo ngày, không theo thời gian chính xác
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            console.log('=== AddVoucherModal Date Validation Debug ===');
            console.log('form.startDate:', form.startDate);
            console.log('startDate:', startDate);
            console.log('startDateOnly:', startDateOnly);
            console.log('now:', now);
            console.log('todayOnly:', todayOnly);
            console.log('startDateOnly < todayOnly:', startDateOnly < todayOnly);
            console.log('startDateOnly.getTime():', startDateOnly.getTime());
            console.log('todayOnly.getTime():', todayOnly.getTime());

            if (startDateOnly < todayOnly) {
                newErrors.startDate = 'Ngày bắt đầu phải là ngày hôm nay hoặc trong tương lai.';
            }
        }

        // Validation cho ngày kết thúc
        if (!form.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc.';
        } else if (form.startDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);
            if (endDate <= startDate) {
                newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
            }
        }

        // Mã voucher không bắt buộc, nếu không nhập sẽ tự động generate

        // Validation cho giá trị giảm
        if (form.discountType === 'percentage') {
            if (!form.discountValue || form.discountValue <= 0) {
                newErrors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
            } else if (form.discountValue > 100) {
                newErrors.discountValue = 'Giá trị giảm không được vượt quá 100%.';
            }
        } else if (form.discountType !== 'free_shipping' && form.discountValue <= 0) {
            newErrors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
        }

        if ((form.discountType === 'percentage' || form.discountType === 'free_shipping') && (!form.maximumDiscountValue || (typeof form.maximumDiscountValue === 'string' ? parseFloat(form.maximumDiscountValue) : form.maximumDiscountValue) <= 0)) {
            newErrors.maximumDiscountValue = 'Giảm tối đa là bắt buộc và phải lớn hơn 0 khi chọn giảm theo % hoặc miễn phí vận chuyển.';
        }

        if (form.minimumOrderValue < 0) {
            newErrors.minimumOrderValue = 'Giá trị đơn tối thiểu không được âm.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        try {
            // Tạo scopes array từ các đối tượng được chọn
            const scopes: Array<{scopeType: string, targetId: number}> = [];

            // Thêm products được chọn
            selectedProducts.forEach(productId => {
                scopes.push({
                    scopeType: "SPECIFIC_PRODUCTS",
                    targetId: productId
                });
            });

            // Thêm categories được chọn
            selectedCategories.forEach(categoryId => {
                scopes.push({
                    scopeType: "PRODUCT_CATEGORY",
                    targetId: categoryId
                });
            });

            // Thêm users được chọn
            selectedUsers.forEach(userId => {
                scopes.push({
                    scopeType: "SPECIFIC_USERS",
                    targetId: parseInt(userId)
                });
            });

            // Nếu không chọn gì thì áp dụng cho tất cả sản phẩm
            if (scopes.length === 0) {
                scopes.push({
                    scopeType: "ALL_PRODUCTS",
                    targetId: 0 // Không cần targetId cho ALL_PRODUCTS
                });
            }

            const voucherData = {
                name: form.promotionName,
                code: (form.voucherCode || '').trim() || null, // Gửi null nếu không nhập
                description: form.description,
                discountType: form.discountType === 'percentage' ? 'PERCENT' :
                    form.discountType === 'fixed_amount' ? 'FIXED_AMOUNT' : 'FREE_SHIPPING',
                discountValue: form.discountType === 'free_shipping' ? 0 : form.discountValue,
                startDate: form.startDate,
                endDate: form.endDate,
                maxUsage: form.usageLimitTotal,
                minOrderValue: form.minimumOrderValue,
                maxDiscountAmount: form.maximumDiscountValue,
                isActive: true,
                scopes: scopes
            };

            console.log('Submitting voucher data:', voucherData);
            console.log('Voucher code being sent:', voucherData.code);
            console.log('Original form.voucherCode:', form.voucherCode);

            const res = await fetch(`${API_URL}/api/admin/vouchers/creat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(voucherData),
            });

            if (res.ok) {
                alert('Tạo voucher thành công!');
                resetForm(); // Reset form khi thành công
                onSuccess();
                onClose();
            } else {
                const errorData = await res.json();
                console.error('Backend error:', errorData);
                
                // Parse error message từ backend
                let errorMessage = errorData.message || 'Không thể tạo voucher';
                console.log('Error message from backend:', errorMessage);
                console.log('Error message length:', errorMessage.length);
                console.log('Error message bytes:', Array.from(errorMessage).map((c: any) => c.charCodeAt(0)));
                
                // Map backend errors to form fields
                if (errorMessage.includes('Tên đợt giảm giá đã tồn tại')) {
                    console.log('Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi đã tồn tại' }));
                } else if (errorMessage.includes('Mã giảm giá đã tồn tại')) {
                    console.log('Mapping to voucherCode error');
                    setErrors(prev => ({ ...prev, voucherCode: 'Mã voucher đã tồn tại' }));
                } else if (errorMessage.includes('Tên đợt giảm giá không được để trống')) {
                    console.log('Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi không được để trống' }));
                } else if (errorMessage.includes('Tên đợt giảm giá không được vượt quá 50 ký tự')) {
                    console.log('Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi không được vượt quá 50 ký tự' }));
                } else if (errorMessage.includes('Mã giảm giá không được vượt quá 50 ký tự')) {
                    console.log('Mapping to voucherCode error');
                    setErrors(prev => ({ ...prev, voucherCode: 'Mã voucher không được vượt quá 50 ký tự' }));
                } else if (errorMessage.includes('Giá trị giảm giá phải lớn hơn 0')) {
                    console.log('Mapping to discountValue error');
                    setErrors(prev => ({ ...prev, discountValue: 'Giá trị giảm phải lớn hơn 0' }));
                } else if (errorMessage.includes('Ngày kết thúc không được trước ngày bắt đầu')) {
                    console.log('Mapping to endDate error');
                    setErrors(prev => ({ ...prev, endDate: 'Ngày kết thúc không được trước ngày bắt đầu' }));
                } else {
                    // Hiển thị lỗi chung nếu không map được
                    console.log('No mapping found, showing alert');
                    alert(`Lỗi: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Error creating voucher:', error);
            alert('Có lỗi xảy ra khi tạo voucher');
        } finally {
            setLoading(false);
        }
    };

    const Label = ({ text, required }: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    const handleTargetToggle = (type: 'products' | 'categories' | 'users', id: number | string) => {
        if (type === 'products') {
            setSelectedProducts(prev =>
                prev.includes(id as number)
                    ? prev.filter(p => p !== id)
                    : [...prev, id as number]
            );
        } else if (type === 'categories') {
            setSelectedCategories(prev =>
                prev.includes(id as number)
                    ? prev.filter(c => c !== id)
                    : [...prev, id as number]
            );
        } else if (type === 'users') {
            setSelectedUsers(prev =>
                prev.includes(id as string)
                    ? prev.filter(u => u !== id)
                    : [...prev, id as string]
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex">
                {/* Main Form */}
                <div className="flex-2 overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Thêm voucher mới</h2>
                            <p className="text-sm text-gray-600 mt-1">Tạo phiếu giảm giá mới cho khách hàng</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                Thông tin cơ bản
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label text="Tên khuyến mãi" required />
                                    <input
                                        name="promotionName"
                                        value={form.promotionName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Nhập tên chương trình khuyến mãi"
                                    />
                                    {errors.promotionName && <p className="text-red-600 text-sm mt-1">{errors.promotionName}</p>}
                                </div>
                                <div>
                                    <Label text="Mã voucher" />
                                    <input
                                        name="voucherCode"
                                        value={form.voucherCode}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                                        placeholder="Để trống để tự động tạo mã"
                                    />
                                    {errors.voucherCode && <p className="text-red-600 text-sm mt-1">{errors.voucherCode}</p>}
                                </div>
                            </div>
                            <div className="mt-4">
                                <Label text="Mô tả" />
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Cấu hình giảm giá */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                Cấu hình giảm giá
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <Label text="Loại giảm" required />
                                    <select
                                        name="discountType"
                                        value={form.discountType}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    >
                                        <option value="percentage">Giảm theo %</option>
                                        <option value="fixed_amount">Giảm số tiền</option>
                                        <option value="free_shipping">Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div>
                                    <Label text={
                                        form.discountType === 'percentage' ? "Giá trị giảm (%)" :
                                            form.discountType === 'fixed_amount' ? "Giá trị giảm (₫)" :
                                                "Giá trị giảm (%)"
                                    } required={form.discountType !== 'free_shipping'} />
                                    <input
                                        name="discountValue"
                                        type="number"
                                        value={form.discountType === 'free_shipping' ? 100 : (form.discountValue || '')}
                                        onChange={handleChange}
                                        onKeyPress={handleKeyPress}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={form.discountType === 'free_shipping'}
                                        placeholder={form.discountType === 'percentage' ? 'VD: 10' : 'VD: 50000'}
                                    />
                                    {errors.discountValue && <p className="text-red-600 text-sm mt-1">{errors.discountValue}</p>}
                                </div>
                                <div>
                                    <Label text="Giảm tối đa (₫)" required={form.discountType === 'percentage' || form.discountType === 'free_shipping'} />
                                    <input
                                        name="maximumDiscountValue"
                                        type="number"
                                        value={form.maximumDiscountValue || ''}
                                        onChange={handleChange}
                                        onKeyPress={handleKeyPress}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={form.discountType === 'fixed_amount'}
                                        placeholder="VD: 100000"
                                    />
                                    {(form.discountType === 'percentage' || form.discountType === 'free_shipping') && errors.maximumDiscountValue && <p className="text-red-600 text-sm mt-1">{errors.maximumDiscountValue}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Điều kiện áp dụng */}
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                                Điều kiện áp dụng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label text="Giá trị đơn tối thiểu (₫)" required />
                                    <input
                                        name="minimumOrderValue"
                                        type="number"
                                        value={form.minimumOrderValue || ''}
                                        onChange={handleChange}
                                        onKeyPress={handleKeyPress}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        placeholder="VD: 200000"
                                    />
                                    {errors.minimumOrderValue && <p className="text-red-600 text-sm mt-1">{errors.minimumOrderValue}</p>}
                                </div>
                                <div>
                                    <Label text="Số lượng voucher" />
                                    <input
                                        name="usageLimitTotal"
                                        type="number"
                                        value={form.usageLimitTotal || ''}
                                        onChange={handleChange}
                                        onKeyPress={handleKeyPress}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        placeholder="VD: 100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Thời gian hiệu lực */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                Thời gian hiệu lực
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label text="Ngày bắt đầu" required />
                                    <input
                                        name="startDate"
                                        type="datetime-local"
                                        value={form.startDate}
                                        onChange={handleChange}
                                        step="60"
                                        min="2024-01-01T00:00"
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        style={{ 
                                            '--webkit-calendar-picker-indicator': 'none',
                                            '--moz-calendar-picker-indicator': 'none'
                                        } as React.CSSProperties}
                                    />
                                    {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <Label text="Ngày kết thúc" required />
                                    <input
                                        name="endDate"
                                        type="datetime-local"
                                        value={form.endDate}
                                        onChange={handleChange}
                                        step="60"
                                        min="2024-01-01T00:00"
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                    {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Đang lưu...
                                    </div>
                                ) : (
                                    'Lưu voucher'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar - Đối tượng áp dụng */}
                <div className="flex-1 flex-shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900">Đối tượng áp dụng</h3>
                        <p className="text-sm text-gray-600 mt-1">Chọn sản phẩm, danh mục hoặc người dùng</p>
                        <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                            💡 <strong>Lưu ý:</strong> Nếu không chọn gì, voucher sẽ áp dụng cho tất cả sản phẩm
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-white">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'products'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Sản phẩm
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'categories'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Danh mục
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'users'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Người dùng
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loadingTargets ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <>
                                {/* Products Tab */}
                                {activeTab === 'products' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Đã chọn: {selectedProducts.length}
                                            </span>
                                            {selectedProducts.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedProducts([])}
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                >
                                                    Bỏ chọn tất cả
                                                </button>
                                            )}
                                        </div>
                                        {products.map((product) => {
                                            const isSelected = selectedProducts.includes(product.productId);
                                            console.log(`Rendering product ${product.productId}:`, {
                                                productId: product.productId,
                                                name: product.displayName || product.name,
                                                isSelected,
                                                selectedProducts
                                            });
                                            return (
                                                <div
                                                    key={product.productId}
                                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-blue-50 border-blue-200'
                                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => handleTargetToggle('products', product.productId)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.productId)}
                                                        onChange={() => {}}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        data-product-id={product.productId}
                                                        data-product-name={product.displayName || product.name}
                                                        data-selected-products={JSON.stringify(selectedProducts)}
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{product.displayName || product.name || product.productName || 'Unnamed Product'}</p>
                                                        <p className="text-xs text-gray-500">{product.description || ''}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Categories Tab */}
                                {activeTab === 'categories' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Đã chọn: {selectedCategories.length}
                                            </span>
                                            {selectedCategories.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedCategories([])}
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                >
                                                    Bỏ chọn tất cả
                                                </button>
                                            )}
                                        </div>
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    selectedCategories.includes(category.id)
                                                        ? 'bg-blue-50 border-blue-200'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleTargetToggle('categories', category.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category.id)}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                                    <p className="text-xs text-gray-500">{category.description || 'N/A'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Users Tab */}
                                {activeTab === 'users' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Đã chọn: {selectedUsers.length}
                                            </span>
                                            {selectedUsers.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedUsers([])}
                                                    className="text-xs text-red-600 hover:text-red-800"
                                                >
                                                    Bỏ chọn tất cả
                                                </button>
                                            )}
                                        </div>
                                        {users.map((user) => (
                                            <div
                                                key={user.appUserId}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    selectedUsers.includes(user.appUserId.toString())
                                                        ? 'bg-blue-50 border-blue-200'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleTargetToggle('users', user.appUserId.toString())}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.appUserId.toString())}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Component EditVoucherModal
function EditVoucherModal({ isOpen, onClose, onSuccess, voucher }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    voucher: VoucherDetail | null;
}) {
    const { data: session } = useSession();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Component Label
    const Label = ({ text, required }: { text: string; required?: boolean }) => (
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {text} {required && <span className="text-red-500">*</span>}
        </label>
    );

    const [form, setForm] = useState({
        promotionName: '',
        voucherCode: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        maximumDiscountValue: '',
        minimumOrderValue: '',
        usageLimitTotal: '',
        startDate: '',
        endDate: '',
        isStackable: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Target selection states
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'users'>('products');
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingTargets, setLoadingTargets] = useState(false);

    // Load voucher data when modal opens
    useEffect(() => {
        if (voucher && isOpen) {
            console.log('Filling form with voucher data:', voucher);

            // Map discount type from backend to frontend format
            let mappedDiscountType = 'percentage';
            if (voucher.discountType) {
                switch (voucher.discountType.toLowerCase()) {
                    case 'percent':
                        mappedDiscountType = 'percentage';
                        break;
                    case 'fixed_amount':
                        mappedDiscountType = 'fixed_amount';
                        break;
                    case 'free_shipping':
                        mappedDiscountType = 'free_shipping';
                        break;
                    default:
                        mappedDiscountType = 'percentage';
                }
            }

            // Cập nhật form
            setForm({
                promotionName: voucher.name || '',
                voucherCode: voucher.code || '',
                description: voucher.description || '',
                discountType: mappedDiscountType,
                discountValue: voucher.discountValue?.toString() || '',
                maximumDiscountValue: voucher.maxDiscountAmount?.toString() || '',
                minimumOrderValue: voucher.minOrderValue?.toString() || '',
                usageLimitTotal: voucher.maxUsage?.toString() || '',
                startDate: voucher.startDate ? voucher.startDate.slice(0, 16) : '',
                endDate: voucher.endDate ? voucher.endDate.slice(0, 16) : '',
                isStackable: false,
            });

            console.log('Voucher scopes:', voucher.scopes);

            // Reset hoàn toàn scope selection
            setSelectedProducts([]);
            setSelectedCategories([]);
            setSelectedUsers([]);

            // Tạo bản sao của scope để mapping sau khi fetch dữ liệu
            const voucherScopes = voucher.scopes ? [...voucher.scopes] : [];

            // Fetch target data và mapping scope sau khi có dữ liệu
            const fetchAndMapScopes = async () => {
                try {
                    await fetchTargetData();

                    // Chờ cho state products/categories/users được cập nhật
                    setTimeout(() => {
                        // Map scopes sử dụng dữ liệu mới nhất
                        const tempProducts: number[] = [];
                        const tempCategories: number[] = [];
                        const tempUsers: string[] = [];

                        voucherScopes.forEach(scope => {
                            if (scope.scopeType === 'SPECIFIC_PRODUCTS') {
                                scope.targetNames.forEach(productName => {
                                    const product = products.find(p =>
                                        (p.displayName === productName) ||
                                        (p.name === productName) ||
                                        (p.productName === productName)
                                    );
                                    if (product) {
                                        tempProducts.push(product.productId);
                                    }
                                });
                            }
                            else if (scope.scopeType === 'PRODUCT_CATEGORY') {
                                scope.targetNames.forEach(categoryName => {
                                    const category = categories.find(c => c.name === categoryName);
                                    if (category) {
                                        tempCategories.push(category.id);
                                    }
                                });
                            }
                            else if (scope.scopeType === 'SPECIFIC_USERS') {
                                scope.targetNames.forEach(userEmail => {
                                    const user = users.find(u => u.email === userEmail);
                                    if (user) {
                                        tempUsers.push(user.appUserId.toString());
                                    }
                                });
                            }
                        });

                        // Cập nhật state scope
                        setSelectedProducts(tempProducts);
                        setSelectedCategories(tempCategories);
                        setSelectedUsers(tempUsers);

                        console.log('Mapped scopes:', {
                            products: tempProducts,
                            categories: tempCategories,
                            users: tempUsers
                        });
                    }, 100);
                } catch (error) {
                    console.error('Error fetching or mapping scopes:', error);
                }
            };

            fetchAndMapScopes();
        }
    }, [voucher, isOpen]);

    // Separate useEffect to map scopes after data is loaded
    useEffect(() => {
        if (voucher && products.length > 0 && categories.length > 0 && users.length > 0) {
            console.log('Mapping scopes with loaded data:', {
                products: products.length,
                categories: categories.length,
                users: users.length,
                scopes: voucher.scopes
            });

            if (voucher.scopes && voucher.scopes.length > 0) {
                voucher.scopes.forEach(scope => {
                    if (scope.scopeType === 'SPECIFIC_PRODUCTS') {
                        // Map product names to IDs
                        scope.targetNames.forEach(productName => {
                            console.log('Looking for product:', productName);
                            console.log('Available products:', products.map(p => ({ productId: p.productId, name: p.name })));

                            // Try exact match first
                            let product = products.find(p => p.displayName && p.displayName === productName);
                            console.log('Exact match result:', product ? 'found' : 'not found');

                            // If not found, try partial match
                            if (!product) {
                                product = products.find(p => p.displayName && (p.displayName.includes(productName) || productName.includes(p.displayName)));
                                console.log('Partial match result:', product ? 'found' : 'not found');
                            }

                            // If still not found, try case-insensitive match
                            if (!product) {
                                product = products.find(p => p.displayName && p.displayName.toLowerCase() === productName.toLowerCase());
                                console.log('Case-insensitive match result:', product ? 'found' : 'not found');
                            }

                            // If still not found, try fuzzy match (remove extra spaces, punctuation)
                            if (!product) {
                                const cleanProductName = productName.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                                product = products.find(p => {
                                    if (!p.displayName) return false;
                                    const cleanName = p.displayName.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                                    return cleanName.toLowerCase() === cleanProductName.toLowerCase();
                                });
                                console.log('Fuzzy match result:', product ? 'found' : 'not found');
                            }

                            if (product) {
                                console.log('Mapping product:', productName, 'to ID:', product.productId);
                                console.log('Product details:', {
                                    productId: product.productId,
                                    name: product.name,
                                    displayName: product.displayName,
                                    productName: product.productName
                                });
                                setSelectedProducts(prev => {
                                    const newSelection = [...prev, product.productId];
                                    console.log('Updated selectedProducts:', newSelection);
                                    return newSelection;
                                });
                            } else {
                                console.log('Product not found:', productName);
                            }
                        });
                    } else if (scope.scopeType === 'PRODUCT_CATEGORY') {
                        // Map category names to IDs
                        scope.targetNames.forEach(categoryName => {
                            console.log('Looking for category:', categoryName);
                            console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name })));

                            // Try exact match first
                            let category = categories.find(c => c.name && c.name === categoryName);
                            console.log('Exact match result:', category ? 'found' : 'not found');

                            // If not found, try case-insensitive match
                            if (!category) {
                                category = categories.find(c => c.name && c.name.toLowerCase() === categoryName.toLowerCase());
                                console.log('Case-insensitive match result:', category ? 'found' : 'not found');
                            }

                            // If still not found, try fuzzy match
                            if (!category) {
                                const cleanCategoryName = categoryName.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                                category = categories.find(c => {
                                    if (!c.name) return false;
                                    const cleanName = c.name.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                                    return cleanName.toLowerCase() === cleanCategoryName.toLowerCase();
                                });
                                console.log('Fuzzy match result:', category ? 'found' : 'not found');
                            }

                            if (category) {
                                console.log('Mapping category:', categoryName, 'to ID:', category.id);
                                setSelectedCategories(prev => {
                                    const newSelection = [...prev, category.id];
                                    console.log('Updated selectedCategories:', newSelection);
                                    return newSelection;
                                });
                            } else {
                                console.log('Category not found:', categoryName);
                            }
                        });
                    } else if (scope.scopeType === 'SPECIFIC_USERS') {
                        // Map user emails to IDs
                        scope.targetNames.forEach(userEmail => {
                            console.log('Looking for user:', userEmail);
                            console.log('Available users:', users.map(u => ({ appUserId: u.appUserId, email: u.email })));

                            // Try exact match first
                            let user = users.find(u => u.email && u.email === userEmail);
                            console.log('Exact match result:', user ? 'found' : 'not found');

                            // If not found, try case-insensitive match
                            if (!user) {
                                user = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());
                                console.log('Case-insensitive match result:', user ? 'found' : 'not found');
                            }

                            // If still not found, try partial match
                            if (!user) {
                                user = users.find(u => u.email && (u.email.includes(userEmail) || userEmail.includes(u.email)));
                                console.log('Partial match result:', user ? 'found' : 'not found');
                            }

                            if (user) {
                                console.log('Mapping user:', userEmail, 'to ID:', user.appUserId);
                                setSelectedUsers(prev => {
                                    const newSelection = [...prev, user.appUserId.toString()];
                                    console.log('Updated selectedUsers:', newSelection);
                                    return newSelection;
                                });
                            } else {
                                console.log('User not found:', userEmail);
                            }
                        });
                    }
                });
            }
        }
    }, [voucher, products, categories, users]);

    // Log when products change
    useEffect(() => {
        console.log('Products state changed:', products.length, 'items');
        if (products.length > 0) {
            console.log('First few products:', products.slice(0, 3).map(p => ({ id: p.productId, name: p.name })));
        }
    }, [products]);

    // Log render state
    useEffect(() => {
        console.log('Render state:', {
            loadingTargets,
            productsLength: products.length,
            activeTab,
            selectedProducts: selectedProducts.length,
            selectedCategories: selectedCategories.length,
            selectedUsers: selectedUsers.length
        });
    }, [loadingTargets, products.length, activeTab, selectedProducts.length, selectedCategories.length, selectedUsers.length]);

    // Fetch target data
    const fetchTargetData = async () => {
        if (!session?.accessToken) return;
        console.log('Fetching target data for edit modal...');
        setLoadingTargets(true);

        try {
            // Fetch products
            console.log('Fetching products...');
            const productsRes = await fetch(`${API_URL}/api/products?page=0&size=100`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                console.log('Products API response:', productsData);

                // Check different possible data structures
                const productsArray = productsData.data?.content || productsData.content || productsData.data || productsData;
                console.log('Raw products array:', productsArray);

                // Log detailed product structure
                console.log('Raw product objects:', productsArray.slice(0, 3).map((p: any) => ({
                    keys: Object.keys(p),
                    values: Object.values(p),
                    name: p.name,
                    productName: p.productName,
                    productId: p.productId,
                    id: p.id
                })));

                // Filter out products with undefined names and validate structure
                const validProducts = productsArray.filter((product: any) => {
                    if (!product || typeof product !== 'object') {
                        console.log('Invalid product object:', product);
                        return false;
                    }

                    // Check for different possible name fields
                    const hasName = product.name || product.productName || product.title || product.productTitle;
                    if (!hasName) {
                        console.log('Product missing name:', product);
                        return false;
                    }

                    // Normalize the name field
                    if (product.name) {
                        product.displayName = product.name;
                    } else if (product.productName) {
                        product.displayName = product.productName;
                    } else if (product.title) {
                        product.displayName = product.title;
                    } else if (product.productTitle) {
                        product.displayName = product.productTitle;
                    }

                    return true;
                });

                console.log('Valid products:', validProducts.length, 'items');
                console.log('Valid products structure:', validProducts.slice(0, 2));
                setProducts(validProducts);
            } else {
                console.error('Failed to fetch products:', productsRes.status, productsRes.statusText);
            }

            // Fetch categories
            console.log('Fetching categories...');
            const categoriesRes = await fetch(`${API_URL}/api/categories?page=0&size=100`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                console.log('Categories loaded:', categoriesData.data?.content?.length || 0, 'items');
                setCategories(categoriesData.data?.content || []);
            } else {
                console.error('Failed to fetch categories:', categoriesRes.status, categoriesRes.statusText);
            }

            // Fetch users
            console.log('Fetching users...');
            const usersRes = await fetch(`${API_URL}/api/users/app-users`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                console.log('Users loaded:', usersData.data?.length || 0, 'items');
                setUsers(usersData.data || []);
            } else {
                console.error('Failed to fetch users:', usersRes.status, usersRes.statusText);
            }
        } catch (error) {
            console.error('Error fetching target data:', error);
        } finally {
            setLoadingTargets(false);
            console.log('Target data fetching completed');
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTargetData();
        }
    }, [isOpen, session?.accessToken]);

    const handleTargetToggle = (type: 'products' | 'categories' | 'users', id: number | string) => {
        if (type === 'products') {
            setSelectedProducts(prev =>
                prev.includes(id as number)
                    ? prev.filter(p => p !== id)
                    : [...prev, id as number]
            );
        } else if (type === 'categories') {
            setSelectedCategories(prev =>
                prev.includes(id as number)
                    ? prev.filter(c => c !== id)
                    : [...prev, id as number]
            );
        } else if (type === 'users') {
            setSelectedUsers(prev =>
                prev.includes(id as string)
                    ? prev.filter(u => u !== id)
                    : [...prev, id as string]
            );
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Chặn việc nhập ký tự không phải số và dấu chấm
        const char = String.fromCharCode(e.which);
        if (!/[0-9.]/.test(char)) {
            e.preventDefault();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Log để debug format datetime
        if (name === 'startDate' || name === 'endDate') {
            console.log(`=== EditVoucherModal ${name} Change ===`);
            console.log('Raw value from input:', value);
            console.log('Value type:', typeof value);
            console.log('Value length:', value.length);
            console.log('Is valid date:', !isNaN(Date.parse(value)));
            if (value) {
                const date = new Date(value);
                console.log('Parsed date:', date);
                console.log('ISO string:', date.toISOString());
                console.log('Locale string:', date.toLocaleString('vi-VN'));
                console.log('=== End ===');
            }
        }

        // Validation cho input số - chỉ cho phép số và dấu chấm
        if (type === 'number') {
            // Kiểm tra nếu có ký tự không phải số hoặc dấu chấm
            if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
                return; // Không cập nhật nếu có ký tự không hợp lệ
            }
        }
        
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!form.promotionName.trim()) newErrors.promotionName = 'Tên khuyến mãi là bắt buộc';
        // Mã voucher không bắt buộc, nếu không nhập sẽ tự động generate

        // Validation cho ngày bắt đầu
        if (!form.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
        } else {
            const startDate = new Date(form.startDate);
            // Lấy thời gian hiện tại (đã là giờ local)
            const now = new Date();

            // So sánh theo ngày, không theo thời gian chính xác
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            console.log('=== EditVoucherModal Date Validation Debug ===');
            console.log('form.startDate:', form.startDate);
            console.log('startDate:', startDate);
            console.log('startDateOnly:', startDateOnly);
            console.log('now:', now);
            console.log('todayOnly:', todayOnly);
            console.log('startDateOnly < todayOnly:', startDateOnly < todayOnly);
            console.log('startDateOnly.getTime():', startDateOnly.getTime());
            console.log('todayOnly.getTime():', todayOnly.getTime());

            if (startDateOnly < todayOnly) {
                newErrors.startDate = 'Ngày bắt đầu phải là ngày hôm nay hoặc trong tương lai.';
            }
        }

        // Validation cho ngày kết thúc
        if (!form.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc.';
        } else if (form.startDate) {
            const startDate = new Date(form.startDate);
            const endDate = new Date(form.endDate);
            if (endDate <= startDate) {
                newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
            }
        }

        // Validation cho giá trị giảm
        if (form.discountType === 'percentage') {
            const discountValue = typeof form.discountValue === 'string' ? parseFloat(form.discountValue) : form.discountValue;
            if (!discountValue || discountValue <= 0) {
                newErrors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
            } else if (discountValue > 100) {
                newErrors.discountValue = 'Giá trị giảm không được vượt quá 100%.';
            }
        } else if (form.discountType !== 'free_shipping' && !form.discountValue) {
            newErrors.discountValue = 'Giá trị giảm là bắt buộc';
        }

        if (!form.minimumOrderValue) newErrors.minimumOrderValue = 'Giá trị đơn tối thiểu là bắt buộc';

        if ((form.discountType === 'percentage' || form.discountType === 'free_shipping') && (!form.maximumDiscountValue || (typeof form.maximumDiscountValue === 'string' ? parseFloat(form.maximumDiscountValue) : form.maximumDiscountValue) <= 0)) {
            newErrors.maximumDiscountValue = 'Giảm tối đa là bắt buộc và phải lớn hơn 0 khi chọn giảm theo % hoặc miễn phí vận chuyển.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        const token = (session as { accessToken: string }).accessToken;

        try {
            // Tạo scopes array từ các đối tượng được chọn
            const scopes: Array<{scopeType: string, targetId: number}> = [];

            // Thêm products được chọn
            selectedProducts.forEach(productId => {
                scopes.push({
                    scopeType: "SPECIFIC_PRODUCTS",
                    targetId: productId
                });
            });

            // Thêm categories được chọn
            selectedCategories.forEach(categoryId => {
                scopes.push({
                    scopeType: "PRODUCT_CATEGORY",
                    targetId: categoryId
                });
            });

            // Thêm users được chọn
            selectedUsers.forEach(userId => {
                scopes.push({
                    scopeType: "SPECIFIC_USERS",
                    targetId: parseInt(userId)
                });
            });

            // Nếu không chọn gì thì áp dụng cho tất cả sản phẩm
            if (scopes.length === 0) {
                scopes.push({
                    scopeType: "ALL_PRODUCTS",
                    targetId: 0 // Không cần targetId cho ALL_PRODUCTS
                });
            }

            const voucherData = {
                id: voucher?.id,
                name: form.promotionName,
                code: (form.voucherCode || '').trim() || null, // Gửi null nếu không nhập
                description: form.description,
                discountType: form.discountType === 'percentage' ? 'PERCENT' :
                    form.discountType === 'fixed_amount' ? 'FIXED_AMOUNT' : 'FREE_SHIPPING',
                discountValue: form.discountType === 'free_shipping' ? 0 : parseFloat(form.discountValue),
                maxDiscountAmount: form.maximumDiscountValue ? parseFloat(form.maximumDiscountValue) : null,
                minOrderValue: parseFloat(form.minimumOrderValue),
                maxUsage: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
                startDate: form.startDate,
                endDate: form.endDate,
                isActive: true,
                scopes: scopes
            };

            console.log('Sending update data:', voucherData);

            const res = await fetch(`${API_URL}/api/admin/vouchers/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(voucherData),
            });

            if (res.ok) {
                alert('Cập nhật voucher thành công!');
                onSuccess();
                onClose();
            } else {
                const errorData = await res.text();
                console.error('Update error:', res.status, errorData);
                
                // Parse error message từ backend
                let errorMessage = errorData || 'Không thể cập nhật voucher';
                console.log('EditVoucherModal - Error message from backend:', errorMessage);
                console.log('EditVoucherModal - Error message length:', errorMessage.length);
                console.log('EditVoucherModal - Error message bytes:', Array.from(errorMessage).map((c: any) => c.charCodeAt(0)));
                
                // Map backend errors to form fields
                if (errorMessage.includes('Tên đợt giảm giá đã tồn tại')) {
                    console.log('EditVoucherModal - Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi đã tồn tại' }));
                } else if (errorMessage.includes('Mã giảm giá đã tồn tại')) {
                    console.log('EditVoucherModal - Mapping to voucherCode error');
                    setErrors(prev => ({ ...prev, voucherCode: 'Mã voucher đã tồn tại' }));
                } else if (errorMessage.includes('Tên đợt giảm giá không được để trống')) {
                    console.log('EditVoucherModal - Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi không được để trống' }));
                } else if (errorMessage.includes('Tên đợt giảm giá không được vượt quá 50 ký tự')) {
                    console.log('EditVoucherModal - Mapping to promotionName error');
                    setErrors(prev => ({ ...prev, promotionName: 'Tên khuyến mãi không được vượt quá 50 ký tự' }));
                } else if (errorMessage.includes('Mã giảm giá không được vượt quá 50 ký tự')) {
                    console.log('EditVoucherModal - Mapping to voucherCode error');
                    setErrors(prev => ({ ...prev, voucherCode: 'Mã voucher không được vượt quá 50 ký tự' }));
                } else if (errorMessage.includes('Giá trị giảm giá phải lớn hơn 0')) {
                    console.log('EditVoucherModal - Mapping to discountValue error');
                    setErrors(prev => ({ ...prev, discountValue: 'Giá trị giảm phải lớn hơn 0' }));
                } else if (errorMessage.includes('Ngày kết thúc không được trước ngày bắt đầu')) {
                    console.log('EditVoucherModal - Mapping to endDate error');
                    setErrors(prev => ({ ...prev, endDate: 'Ngày kết thúc không được trước ngày bắt đầu' }));
                } else if (errorMessage.includes('Không thể cập nhật vì voucher đang hoạt động')) {
                    console.log('EditVoucherModal - Showing alert for active voucher');
                    alert('Không thể cập nhật voucher đang hoạt động');
                } else {
                    // Hiển thị lỗi chung nếu không map được
                    console.log('EditVoucherModal - No mapping found, showing alert');
                    alert(`Lỗi: ${errorMessage}`);
                }
            }
        } catch (e) {
            console.error('Error updating voucher:', e);
            alert('Có lỗi xảy ra khi cập nhật voucher');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Sửa voucher</h2>
                        <p className="text-sm text-gray-600 mt-1">Cập nhật thông tin phiếu giảm giá</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form - 2/3 width */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Thông tin cơ bản */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label text="Tên khuyến mãi" required />
                                        <input
                                            name="promotionName"
                                            value={form.promotionName}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Nhập tên chương trình khuyến mãi"
                                        />
                                        {errors.promotionName && <p className="text-red-600 text-sm mt-1">{errors.promotionName}</p>}
                                    </div>
                                    <div>
                                        <Label text="Mã voucher" />
                                        <input
                                            name="voucherCode"
                                            value={form.voucherCode}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                                            placeholder="Để trống để tự động tạo mã"
                                        />
                                        {errors.voucherCode && <p className="text-red-600 text-sm mt-1">{errors.voucherCode}</p>}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Label text="Mô tả" />
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Cấu hình giảm giá */}
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                    Cấu hình giảm giá
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="Loại giảm" required />
                                        <select
                                            name="discountType"
                                            value={form.discountType}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        >
                                            <option value="percentage">Giảm theo %</option>
                                            <option value="fixed_amount">Giảm số tiền</option>
                                            <option value="free_shipping">Miễn phí vận chuyển</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label text={
                                            form.discountType === 'percentage' ? "Giá trị giảm (%)" :
                                                form.discountType === 'fixed_amount' ? "Giá trị giảm (₫)" :
                                                    "Giá trị giảm (%)"
                                        } required={form.discountType !== 'free_shipping'} />
                                        <input
                                            name="discountValue"
                                            type="number"
                                            value={form.discountType === 'free_shipping' ? 100 : form.discountValue}
                                            onChange={handleChange}
                                            onKeyPress={handleKeyPress}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={form.discountType === 'free_shipping'}
                                            placeholder={form.discountType === 'percentage' ? 'VD: 10' : 'VD: 50000'}
                                        />
                                        {errors.discountValue && <p className="text-red-600 text-sm mt-1">{errors.discountValue}</p>}
                                    </div>
                                    <div>
                                        <Label text="Giảm giá tối đa" required={form.discountType === 'percentage' || form.discountType === 'free_shipping'} />
                                        <input
                                            name="maximumDiscountValue"
                                            type="number"
                                            value={form.maximumDiscountValue}
                                            onChange={handleChange}
                                            onKeyPress={handleKeyPress}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            disabled={form.discountType === 'fixed_amount'}
                                            placeholder="VD: 100000"
                                        />
                                        {(form.discountType === 'percentage' || form.discountType === 'free_shipping') && errors.maximumDiscountValue && <p className="text-red-600 text-sm mt-1">{errors.maximumDiscountValue}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Điều kiện áp dụng */}
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                                    Điều kiện áp dụng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label text="Giá trị đơn tối thiểu (₫)" required />
                                        <input
                                            name="minimumOrderValue"
                                            type="number"
                                            value={form.minimumOrderValue}
                                            onChange={handleChange}
                                            onKeyPress={handleKeyPress}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="VD: 200000"
                                        />
                                        {errors.minimumOrderValue && <p className="text-red-600 text-sm mt-1">{errors.minimumOrderValue}</p>}
                                    </div>
                                    <div>
                                        <Label text="Số lượng voucher" />
                                        <input
                                            name="usageLimitTotal"
                                            type="number"
                                            value={form.usageLimitTotal}
                                            onChange={handleChange}
                                            onKeyPress={handleKeyPress}
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                            placeholder="VD: 100 (0 = không giới hạn)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thời gian hiệu lực */}
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                                    Thời gian hiệu lực
                                </h3>
                                <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                                    ⏰ <strong>Lưu ý:</strong> Vui lòng sử dụng định dạng 24 giờ (VD: 14:30 thay vì 2:30 PM)
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label text="Ngày bắt đầu" required />
                                        <input
                                            name="startDate"
                                            type="datetime-local"
                                            value={form.startDate}
                                            onChange={handleChange}
                                            step="60"
                                            min="2024-01-01T00:00"
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        />
                                        {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
                                    </div>
                                    <div>
                                        <Label text="Ngày kết thúc" required />
                                        <input
                                            name="endDate"
                                            type="datetime-local"
                                            value={form.endDate}
                                            onChange={handleChange}
                                            step="60"
                                            min="2024-01-01T00:00"
                                            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        />
                                        {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Đối tượng áp dụng - 1/3 width */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                                    Đối tượng áp dụng
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">Chọn sản phẩm, danh mục hoặc người dùng</p>
                                <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                                    💡 <strong>Lưu ý:</strong> Nếu không chọn gì, voucher sẽ áp dụng cho tất cả sản phẩm
                                </p>

                                {/* Existing scopes info */}
                                {voucher?.scopes && voucher.scopes.length > 0 && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
                                        <h4 className="font-medium text-yellow-800 mb-2 text-sm">Phạm vi hiện tại:</h4>
                                        <div className="space-y-2">
                                            {voucher.scopes.map((scope, index) => (
                                                <div key={index} className="text-xs">
                                                    <span className="font-medium text-yellow-700">
                                                        {scope.scopeType === 'PRODUCT_CATEGORY' ? 'Danh mục:' :
                                                            scope.scopeType === 'SPECIFIC_PRODUCTS' ? 'Sản phẩm:' :
                                                                scope.scopeType === 'SPECIFIC_USERS' ? 'Người dùng:' :
                                                                    scope.scopeType}
                                                    </span>
                                                    <div className="text-yellow-600 ml-2">
                                                        {scope.targetNames.join(', ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tabs */}
                                <div className="flex space-x-1 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('products')}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            activeTab === 'products'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Sản phẩm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('categories')}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            activeTab === 'categories'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Danh mục
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('users')}
                                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                                            activeTab === 'users'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        Người dùng
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-h-0">
                                    {loadingTargets ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Products Tab */}
                                            {activeTab === 'products' && (
                                                <div className="h-full flex flex-col">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Đã chọn: {selectedProducts.length}
                                                        </span>
                                                        {selectedProducts.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedProducts([])}
                                                                className="text-xs text-red-600 hover:text-red-800"
                                                            >
                                                                Bỏ chọn tất cả
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 flex-1 overflow-y-auto">
                                                        {products.map((product) => (
                                                            <div
                                                                key={product.productId}
                                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                    selectedProducts.includes(product.productId)
                                                                        ? 'bg-blue-50 border-blue-200'
                                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => handleTargetToggle('products', product.productId)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedProducts.includes(product.productId)}
                                                                    onChange={() => {}}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="ml-3 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{product.displayName || product.name || product.productName || 'Unnamed Product'}</p>
                                                                    <p className="text-xs text-gray-500">{product.description || ''}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Categories Tab */}
                                            {activeTab === 'categories' && (
                                                <div className="h-full flex flex-col">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Đã chọn: {selectedCategories.length}
                                                        </span>
                                                        {selectedCategories.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedCategories([])}
                                                                className="text-xs text-red-600 hover:text-red-800"
                                                            >
                                                                Bỏ chọn tất cả
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 flex-1 overflow-y-auto">
                                                        {categories.map((category) => (
                                                            <div
                                                                key={category.id}
                                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                    selectedCategories.includes(category.id)
                                                                        ? 'bg-blue-50 border-blue-200'
                                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => handleTargetToggle('categories', category.id)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCategories.includes(category.id)}
                                                                    onChange={() => {}}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="ml-3 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                                                    <p className="text-xs text-gray-500">{category.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Users Tab */}
                                            {activeTab === 'users' && (
                                                <div className="h-full flex flex-col">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Đã chọn: {selectedUsers.length}
                                                        </span>
                                                        {selectedUsers.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedUsers([])}
                                                                className="text-xs text-red-600 hover:text-red-800"
                                                            >
                                                                Bỏ chọn tất cả
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 flex-1 overflow-y-auto">
                                                        {users.map((user) => (
                                                            <div
                                                                key={user.appUserId}
                                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                    selectedUsers.includes(user.appUserId.toString())
                                                                        ? 'bg-blue-50 border-blue-200'
                                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => handleTargetToggle('users', user.appUserId.toString())}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUsers.includes(user.appUserId.toString())}
                                                                    onChange={() => {}}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="ml-3 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập nhật voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function VouchersPage() {
    const searchParams = useSearchParams();
    const initialPage = Number(searchParams?.get('page')) || 1;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    // Bộ lọc
    const [filters, setFilters] = useState({
        keyword: '',
        status: '',
        discountType: '',
        scopeType: '', // Thêm bộ lọc theo phạm vi áp dụng
        discountValue: '',
        startDate: '',
        endDate: '',
    });

    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [dateError, setDateError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<VoucherDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<VoucherDetail | null>(null);

    const { data: session, status } = useSession();

    const fetchVouchers = async () => {
        if (status !== 'authenticated') return;
            setLoading(true);
            const token = (session as { accessToken: string }).accessToken;

        try {
            let url = `${API_URL}/api/admin/vouchers`;

            // Xử lý bộ lọc
            const queryParams = new URLSearchParams();

            // Xử lý các bộ lọc
            let hasFilter = false;

            // Bộ lọc theo thời gian
            if (filters.startDate && filters.endDate) {
                url = `${API_URL}/api/admin/vouchers/period`;
                // Chuyển đổi từ ngày sang datetime (00:00:00 cho startDate, 23:59:59 cho endDate)
                const startDateTime = filters.startDate + 'T00:00:00';
                const endDateTime = filters.endDate + 'T23:59:59';
                queryParams.append('startDate', startDateTime);
                queryParams.append('endDate', endDateTime);
                console.log('Date filter applied:', startDateTime, 'to', endDateTime);
                console.log('Query params:', queryParams.toString());
                hasFilter = true;
            }

            // Bộ lọc theo loại giảm giá (chỉ khi không có filter ngày)
            if (!hasFilter && filters.discountType) {
                url = `${API_URL}/api/admin/vouchers/discount-type`;
                queryParams.append('discountType', filters.discountType);
                console.log('Discount type filter applied:', filters.discountType);
                hasFilter = true;
            }

            // Bộ lọc theo phạm vi áp dụng (chỉ khi không có filter ngày)
            if (!hasFilter && filters.scopeType) {
                url = `${API_URL}/api/admin/vouchers/scope-type`;
                queryParams.append('scopeType', filters.scopeType);
                console.log('Scope filter applied:', filters.scopeType);
                hasFilter = true;
            }

            // Bộ lọc theo trạng thái (chỉ khi không có filter ngày)
            if (!hasFilter && filters.status) {
                url = `${API_URL}/api/admin/vouchers/status-filter`;
                queryParams.append('status', filters.status);
                console.log('Status filter applied:', filters.status);
                hasFilter = true;
            }

            // Thêm query params nếu có
            if (queryParams.toString()) {
                url += '?' + queryParams.toString();
            }

            console.log('Fetching vouchers with URL:', url);

            const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

            if (res.ok) {
                const data = await res.json();
                console.log('Vouchers API response:', data);

                // Xử lý dữ liệu trả về
                let voucherList = Array.isArray(data) ? data : [];
                console.log('Raw voucher data:', voucherList);

                // Bộ lọc theo keyword (xử lý ở frontend)
                if (filters.keyword) {
                    const keyword = filters.keyword.toLowerCase();
                    voucherList = voucherList.filter(voucher =>
                        voucher.code?.toLowerCase().includes(keyword) ||
                        voucher.name?.toLowerCase().includes(keyword)
                    );
                }

                setVouchers(voucherList);
                // Tính toán phân trang
                const total = voucherList.length;
                setTotalPages(Math.ceil(total / itemsPerPage));
            } else {
                console.error('Failed to fetch vouchers:', res.status);

                if (res.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    signOut({ callbackUrl: '/login' });
                    return;
                }

                setVouchers([]);
            }
            } catch (e) {
            console.error('Error fetching vouchers:', e);
            setVouchers([]);
            } finally {
                setLoading(false);
            }
    };

    const fetchVoucherDetail = async (voucherId: number) => {
        if (status !== 'authenticated') return;
        setLoadingDetail(true);
        const token = (session as { accessToken: string }).accessToken;

        try {
            console.log('Fetching voucher detail for ID:', voucherId);
            const res = await fetch(`${API_URL}/api/admin/vouchers/detail_admin/${voucherId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            console.log('Voucher detail response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Voucher detail data:', data);
                setSelectedVoucherDetail(data);
            } else {
                const errorText = await res.text();
                console.error('Failed to fetch voucher detail:', res.status, errorText);

                if (res.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    signOut({ callbackUrl: '/login' });
                    return;
                } else if (res.status === 404) {
                    alert('Không tìm thấy voucher với ID: ' + voucherId);
                } else {
                    alert('Không thể tải thông tin chi tiết voucher. Lỗi: ' + res.status);
                }
            }
        } catch (e) {
            console.error('Error fetching voucher detail:', e);
            alert('Lỗi khi tải thông tin chi tiết voucher: ' + e);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchVouchers();
        }
    }, [status]);

    // Tự động áp dụng bộ lọc khi thay đổi filters
    useEffect(() => {
        if (status === 'authenticated') {
            const timeoutId = setTimeout(() => {
                fetchVouchers();
                setCurrentPage(1);
            }, 500); // Delay 500ms để tránh gọi API quá nhiều

            return () => clearTimeout(timeoutId);
        }
    }, [filters.keyword, filters.status, filters.discountType, filters.scopeType]);

    // Hàm tính toán trạng thái voucher
    const getVoucherStatus = (voucher: Voucher) => {
        // Ưu tiên sử dụng status từ backend (đã được tính toán chính xác)
        if (voucher.status) {
            switch (voucher.status) {
                case 'Đang diễn ra':
                    return { status: 'Đang diễn ra', color: 'bg-green-500' };
                case 'Đã kết thúc':
                    return { status: 'Đã kết thúc', color: 'bg-red-500' };
                case 'Hết lượt sử dụng':
                    return { status: 'Hết lượt sử dụng', color: 'bg-orange-500' };
                case 'Chưa bắt đầu':
                    return { status: 'Chưa bắt đầu', color: 'bg-gray-400' };
                default:
                    return { status: voucher.status, color: 'bg-blue-500' };
            }
        }

        // Fallback: tính toán dựa trên thời gian (chỉ khi backend không trả về status)
        const now = new Date();
        const startDate = new Date(voucher.startDate);
        const endDate = new Date(voucher.endDate);

        if (now < startDate) {
            return { status: 'Chưa bắt đầu', color: 'bg-gray-400' };
        }

        if (now > endDate) {
            return { status: 'Đã kết thúc', color: 'bg-red-500' };
        }

        return { status: 'Đang diễn ra', color: 'bg-green-500' };
    };

    // Lọc dữ liệu theo filters
    const filteredVouchers = useMemo(() => {
        console.log('Filtering vouchers:', vouchers.length, 'items');
        let filtered = vouchers;

        // Chỉ lọc theo keyword ở frontend, các filter khác đã được xử lý ở backend
        if (filters.keyword) {
            filtered = filtered.filter(v =>
                v.code.toLowerCase().includes(filters.keyword.toLowerCase()) ||
                v.name.toLowerCase().includes(filters.keyword.toLowerCase())
            );
        }

        console.log('Filtered vouchers:', filtered.length, 'items');
        return filtered;
    }, [vouchers, filters]);

    // Tính toán dữ liệu cho trang hiện tại
    const paginatedVouchers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVouchers.slice(startIndex, endIndex);
    }, [filteredVouchers, currentPage, itemsPerPage]);

    // Cập nhật totalPages khi filteredVouchers thay đổi
    useEffect(() => {
        setTotalPages(Math.ceil(filteredVouchers.length / itemsPerPage));
        if (currentPage > Math.ceil(filteredVouchers.length / itemsPerPage)) {
            setCurrentPage(1);
        }
    }, [filteredVouchers, itemsPerPage]);

    const formatDateTime = (s: string) =>
        new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(s));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDiscount = (value: number, type: string) => {
        const t = type.toLowerCase();
        if (t === 'percentage' || t === 'percent') return `${value}%`;
        if (t === 'fixed' || t === 'fixed_amount') return formatCurrency(value);
        if (t === 'free_shipping') return 'Miễn phí vận chuyển';
        return String(value);
    };

    const handlePageChange = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setCurrentPage(p);
    };

    const handleDeactivate = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn vô hiệu hóa voucher này?')) return;
        const token = (session as { accessToken: string }).accessToken;
        try {
            const res = await fetch(`${API_URL}/api/admin/vouchers/deactivate/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!res.ok) {
                const errorData = await res.json();

                if (res.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    signOut({ callbackUrl: '/login' });
                    return;
                }

                throw new Error(errorData.message || 'Vô hiệu hóa không thành công');
            }
            alert('Vô hiệu hóa voucher thành công!');
            fetchVouchers(); // Reload danh sách
        } catch (e) {
            console.error('Error deactivating voucher:', e);
            alert('Lỗi: ' + e);
        }
    };

    const handleEdit = async (voucherId: number) => {
        if (status !== 'authenticated') return;
        const token = (session as { accessToken: string }).accessToken;

        try {
            console.log('Fetching voucher detail for edit, ID:', voucherId);
            const res = await fetch(`${API_URL}/api/admin/vouchers/detail_admin/${voucherId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Voucher detail data:', data);
                setEditingVoucher(data);
                setShowEditModal(true);
            } else {
                console.error('Failed to fetch voucher detail:', res.status, res.statusText);
                alert('Không thể tải thông tin voucher để sửa');
            }
        } catch (e) {
            console.error('Error fetching voucher for edit:', e);
            alert('Lỗi khi tải thông tin voucher');
        }
    };

    const getVoucherDetailStatus = (voucher: VoucherDetail) => {
        const now = new Date();
        const startDate = new Date(voucher.startDate);
        const endDate = new Date(voucher.endDate);

        // Kiểm tra thời gian hiệu lực trước
        if (now < startDate) {
            return { status: 'Chưa bắt đầu', color: 'bg-gray-400' };
        }

        if (now > endDate) {
            return { status: 'Đã kết thúc', color: 'bg-red-500' };
        }

        // Kiểm tra lượt sử dụng
        if (voucher.usageCount >= voucher.maxUsage) {
            return { status: 'Hết lượt sử dụng', color: 'bg-orange-500' };
        }

        // Kiểm tra trạng thái active - nếu bị vô hiệu hóa thì thành "Đã kết thúc"
        if (!voucher.isActive) {
            return { status: 'Đã kết thúc', color: 'bg-red-500' };
        }

        // Đang diễn ra
        return { status: 'Đang diễn ra', color: 'bg-green-500' };
    };

    const getDiscountTypeName = (discountType: string) => {
        switch (discountType) {
            case 'PERCENT':
                return 'Giảm theo %';
            case 'FIXED_AMOUNT':
                return 'Giảm số tiền cố định';
            case 'FREE_SHIPPING':
                return 'Miễn phí vận chuyển';
            default:
                return discountType;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách phiếu giảm giá</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            fetchVouchers();
                            setCurrentPage(1);
                            setSelectedVoucherDetail(null);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        LÀM MỚI
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm font-medium"
                    >
                        + THÊM MỚI
                    </button>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white rounded border p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên..."
                        className="border rounded px-3 py-2"
                        value={filters.keyword}
                        onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
                    />
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Đang diễn ra">Đang diễn ra</option>
                        <option value="Đã kết thúc">Đã kết thúc</option>
                        <option value="Hết lượt sử dụng">Hết lượt sử dụng</option>
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                    </select>
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.discountType}
                        onChange={e => setFilters(f => ({ ...f, discountType: e.target.value, discountValue: '' }))}
                    >
                        <option value="">Tất cả loại giảm</option>
                        <option value="percentage">Giảm theo %</option>
                        <option value="fixed_amount">Giảm số tiền</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                    </select>
                    <select
                        className="border rounded px-3 py-2"
                        value={filters.scopeType}
                        onChange={e => setFilters(f => ({ ...f, scopeType: e.target.value }))}
                    >
                        <option value="">Tất cả phạm vi</option>
                        <option value="specific_category">Theo danh mục</option>
                        <option value="specific_product">Theo sản phẩm</option>
                        <option value="specific_user">Theo người dùng</option>
                    </select>
                </div>

                {/* Bộ lọc ngày riêng */}
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Bộ lọc theo ngày</h4>
                    <div className="flex flex-row items-end gap-3 flex-wrap">
                        <div className="flex flex-col" style={{ minWidth: 200, maxWidth: 250 }}>
                            <label htmlFor="startDate" className="text-xs text-gray-600 mb-1">Từ ngày</label>
                            <input
                                id="startDate"
                                type="date"
                                className="border rounded px-3 py-2"
                                value={filters.startDate}
                                onChange={e => {
                                    setFilters(f => ({ ...f, startDate: e.target.value }));
                                    if (filters.endDate && e.target.value && filters.endDate < e.target.value) {
                                        setDateError('Ngày kết thúc phải sau ngày bắt đầu');
                                    } else {
                                        setDateError('');
                                    }
                                }}
                                placeholder="Từ ngày"
                            />
                        </div>
                        <div className="flex flex-col" style={{ minWidth: 200, maxWidth: 250 }}>
                            <label htmlFor="endDate" className="text-xs text-gray-600 mb-1">Đến ngày</label>
                            <input
                                id="endDate"
                                type="date"
                                className="border rounded px-3 py-2"
                                value={filters.endDate}
                                onChange={e => {
                                    setFilters(f => ({ ...f, endDate: e.target.value }));
                                    if (filters.startDate && e.target.value && e.target.value < filters.startDate) {
                                        setDateError('Ngày kết thúc phải sau ngày bắt đầu');
                                    } else {
                                        setDateError('');
                                    }
                                }}
                                placeholder="Đến ngày"
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                    <button
                                onClick={() => {
                                    if (filters.startDate && filters.endDate) {
                                        fetchVouchers();
                                        setCurrentPage(1);
                                    } else {
                                        alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc');
                                    }
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            >
                                Áp dụng bộ lọc
                            </button>
                        </div>
                    </div>
                    {dateError && (
                        <div className="text-red-500 text-xs mt-2">{dateError}</div>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => {
                            setFilters({ keyword: '', status: '', discountType: '', scopeType: '', discountValue: '', startDate: '', endDate: '' });
                            setDateError('');
                            fetchVouchers();
                            setCurrentPage(1);
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                    >
                        Làm mới bộ lọc
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white shadow border rounded">
                <table className="min-w-full text-sm text-left border">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 border">STT</th>
                        <th className="px-4 py-3 border">Mã voucher</th>
                        <th className="px-4 py-3 border">Tên voucher</th>
                        <th className="px-4 py-3 border">Ngày bắt đầu</th>
                        <th className="px-4 py-3 border">Ngày kết thúc</th>
                        <th className="px-4 py-3 border">Trạng thái</th>
                        <th className="px-4 py-3 border text-center">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center">
                                Đang tải dữ liệu...
                            </td>
                        </tr>
                    ) : paginatedVouchers.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                Không có dữ liệu phù hợp
                            </td>
                        </tr>
                    ) : (
                        paginatedVouchers.map((v, idx) => (
                            <>
                                <tr key={`voucher-${v.id}`} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 border text-center">
                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="px-4 py-2 border font-mono text-blue-600">
                                        {v.code}
                                </td>
                                    <td className="px-4 py-2 border">{v.name}</td>
                                <td className="px-4 py-2 border text-center">
                                        {formatDateTime(v.startDate)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                        {formatDateTime(v.endDate)}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                        {(() => {
                                            const voucherStatus = getVoucherStatus(v);
                                            return (
                                                <span className={`text-xs px-2 py-1 rounded text-white ${voucherStatus.color}`}>
                                                    {voucherStatus.status}
                                    </span>
                                            );
                                        })()}
                                </td>
                                <td className="px-4 py-2 border text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (selectedVoucherDetail && selectedVoucherDetail.id === v.id) {
                                                        setSelectedVoucherDetail(null);
                                                    } else {
                                                        fetchVoucherDetail(v.id);
                                                    }
                                                }}
                                                disabled={loadingDetail}
                                                className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
                                                    selectedVoucherDetail && selectedVoucherDetail.id === v.id
                                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                }`}
                                            >
                                                {loadingDetail ? 'Đang tải...' :
                                                    selectedVoucherDetail && selectedVoucherDetail.id === v.id ? 'Đóng' : 'Xem chi tiết'}
                                            </button>
                                        <button
                                                onClick={() => handleEdit(v.id)}
                                                disabled={getVoucherStatus(v).status === 'Đang diễn ra' || getVoucherStatus(v).status === 'Đã kết thúc'}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${
                                                    getVoucherStatus(v).status === 'Đang diễn ra' || getVoucherStatus(v).status === 'Đã kết thúc'
                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDeactivate(v.id)}
                                                disabled={getVoucherStatus(v).status === 'Đã kết thúc' || getVoucherStatus(v).status === 'Hết lượt sử dụng'}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${
                                                    getVoucherStatus(v).status === 'Đã kết thúc' || getVoucherStatus(v).status === 'Hết lượt sử dụng'
                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                }`}
                                            >
                                                Vô hiệu hóa
                                        </button>
                                    </div>
                                </td>
                                </tr>
                                {/* Voucher Detail Row */}
                                {selectedVoucherDetail && selectedVoucherDetail.id === v.id && (
                                    <tr key={`detail-${v.id}`} className="bg-gray-50">
                                        <td colSpan={7} className="px-4 py-4">
                                            <div className="bg-white rounded border shadow-sm p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        Chi tiết voucher: {selectedVoucherDetail.code}
                                                    </h3>
                                                    <button
                                                        onClick={() => setSelectedVoucherDetail(null)}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {/* Thông tin cơ bản */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-medium text-gray-700 border-b pb-2">Thông tin cơ bản</h4>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Tên voucher:</span>
                                                            <p className="font-medium">{selectedVoucherDetail.name}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Mô tả:</span>
                                                            <p className="text-sm">{selectedVoucherDetail.description || 'Không có mô tả'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Trạng thái:</span>
                                                            {(() => {
                                                                const voucherStatus = getVoucherDetailStatus(selectedVoucherDetail);
                                                                return (
                                                                    <span className={`ml-2 px-2 py-1 rounded text-xs text-white ${voucherStatus.color}`}>
                                                                        {voucherStatus.status}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Thông tin giảm giá */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-medium text-gray-700 border-b pb-2">Thông tin giảm giá</h4>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Loại giảm:</span>
                                                            <p className="font-medium">{getDiscountTypeName(selectedVoucherDetail.discountType)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Giá trị giảm:</span>
                                                            <p className="font-medium text-green-600">
                                                                {formatDiscount(selectedVoucherDetail.discountValue, selectedVoucherDetail.discountType)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Giá trị đơn tối thiểu:</span>
                                                            {selectedVoucherDetail.minOrderValue > 0 && (
                                                                <p className="font-medium">{formatCurrency(selectedVoucherDetail.minOrderValue)}</p>
                                                            )}
                                                        </div>
                                                        {selectedVoucherDetail.discountType !== 'FIXED_AMOUNT' && selectedVoucherDetail.maxDiscountAmount && (
                                                            <div>
                                                                <span className="text-sm text-gray-600">Giảm giá tối đa:</span>
                                                                <p className="font-medium">{formatCurrency(selectedVoucherDetail.maxDiscountAmount)}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Thông tin sử dụng */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-medium text-gray-700 border-b pb-2">Thông tin sử dụng</h4>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Số lượt tối đa:</span>
                                                            <p className="font-medium">{selectedVoucherDetail.maxUsage.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Đã sử dụng:</span>
                                                            <p className="font-medium">{selectedVoucherDetail.usageCount.toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Còn lại:</span>
                                                            <p className="font-medium text-blue-600">
                                                                {(selectedVoucherDetail.maxUsage - selectedVoucherDetail.usageCount).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Thời gian hiệu lực */}
                                                    <div className="space-y-3">
                                                        <h4 className="font-medium text-gray-700 border-b pb-2">Thời gian hiệu lực</h4>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Ngày bắt đầu:</span>
                                                            <p className="font-medium">{formatDateTime(selectedVoucherDetail.startDate)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Ngày kết thúc:</span>
                                                            <p className="font-medium">{formatDateTime(selectedVoucherDetail.endDate)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-600">Ngày tạo:</span>
                                                            <p className="font-medium">{formatDateTime(selectedVoucherDetail.createdAt)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Phạm vi áp dụng */}
                                                    <div className="space-y-3 md:col-span-2 lg:col-span-3">
                                                        <h4 className="font-medium text-gray-700 border-b pb-2">Phạm vi áp dụng</h4>
                                                        {selectedVoucherDetail.scopes && selectedVoucherDetail.scopes.length > 0 ? (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {selectedVoucherDetail.scopes.map((scope, index) => (
                                                                    <div key={index} className="bg-gray-50 p-3 rounded border">
                                                                        <div className="font-medium text-sm text-gray-700 mb-2">
                                                                            {scope.scopeType === 'PRODUCT_CATEGORY' ? 'Danh mục sản phẩm:' :
                                                                                scope.scopeType === 'SPECIFIC_PRODUCTS' ? 'Sản phẩm cụ thể:' :
                                                                                    scope.scopeType === 'SPECIFIC_USERS' ? 'Người dùng cụ thể:' :
                                                                                        scope.scopeType}
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {scope.targetNames.map((name, nameIndex) => (
                                                                                <div key={nameIndex} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                                                                    {name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">Áp dụng cho tất cả sản phẩm</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                            </tr>
                                )}
                            </>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage + 1;
                const endIndex = Math.min(currentPage * itemsPerPage, vouchers.length);
                const totalItems = vouchers.length;

                return !loading ? (
                    <div className="bg-white rounded border p-4 shadow-sm">
                        {/* Thông tin phân trang */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-gray-600">
                                Hiển thị {startIndex}-{endIndex} trong tổng số {totalItems} voucher
                            </div>
                            <div className="text-sm text-gray-600">
                                Trang {currentPage} / {totalPages}
                            </div>
                        </div>

                        {/* Nút phân trang */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                                >
                                    Đầu
                                </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                        >
                            Trước
                        </button>

                                {/* Hiển thị số trang */}
                                {(() => {
                                    const pages = [];
                                    const maxVisiblePages = 5;
                                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                    if (endPage - startPage + 1 < maxVisiblePages) {
                                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                    }

                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(i);
                                    }

                                    return pages.map(p => (
                            <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 rounded-full text-sm border flex items-center justify-center ${
                                                p === currentPage
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'hover:bg-gray-200 border-gray-300'
                                }`}
                            >
                                {p}
                            </button>
                                    ));
                                })()}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                        >
                            Sau
                        </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                                >
                                    Cuối
                        </button>
                            </div>
                        )}
                    </div>
                ) : null;
            })()}

            {/* Add Voucher Modal */}
            <AddVoucherModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchVouchers}
            />

            {/* Edit Voucher Modal */}
            <EditVoucherModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={() => {
                    fetchVouchers();
                    setShowEditModal(false);
                    setEditingVoucher(null);
                    setSelectedVoucherDetail(null);
                }}
                voucher={editingVoucher}
            />
        </div>
    );
}