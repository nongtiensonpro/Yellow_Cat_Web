'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Autocomplete,
    AutocompleteItem,
    Checkbox,
    Divider,
    Alert,
} from '@heroui/react';
import {
    User,
    Phone,
    MapPin,
    Globe,
    Building,
    Home,
    Briefcase,
    Star,
    Plus,
    Edit,
    X,
} from 'lucide-react';

interface Province {
    code: string;
    name: string;
}

interface District {
    code: string;
    name: string;
}

interface Ward {
    code: string;
    name: string;
}

interface AddressFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    mode: 'create' | 'edit';
}

const ADDRESS_TYPES = [
    { value: 'HOME', label: 'Nhà riêng', icon: <Home size={16} /> },
    { value: 'OFFICE', label: 'Văn phòng', icon: <Briefcase size={16} /> },
    { value: 'OTHER', label: 'Khác', icon: <Building size={16} /> },
];

// Vietnamese phone number regex
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

export default function AddressForm({ isOpen, onClose, onSubmit, initialData, mode }: AddressFormProps) {
    const [formData, setFormData] = useState({
        recipientName: '',
        phoneNumber: '',
        streetAddress: '',
        province: '',
        district: '',
        ward: '',
        addressType: 'HOME',
        isDefault: false,
        country: 'Việt Nam',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.recipientName.trim()) newErrors.recipientName = 'Họ và tên không được để trống';
        else if (formData.recipientName.trim().length < 2) newErrors.recipientName = 'Họ và tên phải có ít nhất 2 ký tự';

        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Số điện thoại không được để trống';
        else if (!PHONE_REGEX.test(formData.phoneNumber.trim())) newErrors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam';

        if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Địa chỉ chi tiết không được để trống';

        if (!formData.province) newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        if (!formData.district) newErrors.district = 'Vui lòng chọn quận/huyện';
        if (!formData.ward) newErrors.ward = 'Vui lòng chọn phường/xã';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const fetchProvinces = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8080/api/address/provinces');
            if (!res.ok) console.log(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setProvinces(data);
        } catch (err) {
            console.error('Error fetching provinces', err);
        }
    }, []);

    const fetchDistricts = useCallback(async (provinceCode: string) => {
        if (!provinceCode) return;
        try {
            const res = await fetch(`http://localhost:8080/api/address/districts/${provinceCode}`);
            const data = await res.json();
            setDistricts(data);
        } catch (err) {
            console.error('Error fetching districts', err);
        }
    }, []);

    const fetchWards = useCallback(async (districtCode: string) => {
        if (!districtCode) return;
        try {
            const res = await fetch(`http://localhost:8080/api/address/wards/${districtCode}`);
            const data = await res.json();
            setWards(data);
        } catch (err) {
            console.error('Error fetching wards', err);
        }
    }, []);
    useEffect(() => {
        if (!isOpen) return;

        // Load provinces on open
        fetchProvinces();

        // Clear state for new open
        setErrors({});
        setSubmitAttempted(false);

        if (initialData && mode === 'edit') {
            const addressTypeUpper = (initialData.addressType?.toUpperCase() ?? 'HOME') as 'HOME' | 'OFFICE' | 'OTHER';
            setFormData({
                recipientName: initialData.recipientName ?? '',
                phoneNumber: initialData.phoneNumber ?? '',
                streetAddress: initialData.streetAddress ?? '',
                province: '',
                district: '',
                ward: '',
                addressType: addressTypeUpper,
                isDefault: initialData.isDefault ?? false,
                country: initialData.country?.trim() || 'Việt Nam',
            });
        } else {
            setFormData({
                recipientName: '',
                phoneNumber: '',
                streetAddress: '',
                province: '',
                district: '',
                ward: '',
                addressType: 'HOME',
                isDefault: false,
                country: 'Việt Nam',
            });
        }
    }, [isOpen, initialData, mode, fetchProvinces]);

    // Handle province pre‑select for edit mode once provinces loaded
    useEffect(() => {
        if (mode !== 'edit' || !initialData || !provinces.length || formData.province) return;
        const p = provinces.find((v) => v.name === initialData.cityProvince);
        if (p) {
            setFormData((prev) => ({ ...prev, province: p.code }));
            fetchDistricts(p.code);
        }
    }, [provinces, initialData, mode, formData.province, fetchDistricts]);

    // Handle district pre‑select
    useEffect(() => {
        if (mode !== 'edit' || !initialData || !districts.length || formData.district) return;
        const d = districts.find((v) => v.name === initialData.district);
        if (d) {
            setFormData((prev) => ({ ...prev, district: d.code }));
            fetchWards(d.code);
        }
    }, [districts, initialData, mode, formData.district, fetchWards]);

    // Handle ward pre‑select
    useEffect(() => {
        if (mode !== 'edit' || !initialData || !wards.length || formData.ward) return;
        const w = wards.find((v) => v.name === initialData.wardCommune);
        if (w) setFormData((prev) => ({ ...prev, ward: w.code }));
    }, [wards, initialData, mode, formData.ward]);

    /* -------------------------------- Handlers ------------------------------- */
    const handleProvinceSelect = (key: React.Key | null) => {
        const provinceCode = key ? String(key) : '';
        setFormData((prev) => ({ ...prev, province: provinceCode, district: '', ward: '' }));
        setDistricts([]);
        setWards([]);
        setErrors((prev) => ({ ...prev, province: '', district: '', ward: '' }));
        if (provinceCode) fetchDistricts(provinceCode);
    };

    const handleDistrictSelect = (key: React.Key | null) => {
        const districtCode = key ? String(key) : '';
        setFormData((prev) => ({ ...prev, district: districtCode, ward: '' }));
        setWards([]);
        setErrors((prev) => ({ ...prev, district: '', ward: '' }));
        if (districtCode) fetchWards(districtCode);
    };

    const handleWardSelect = (key: React.Key | null) => {
        const wardCode = key ? String(key) : '';
        setFormData((prev) => ({ ...prev, ward: wardCode }));
        setErrors((prev) => ({ ...prev, ward: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        if (!validateForm()) return;

        const sp = provinces.find((p) => p.code === formData.province);
        const sd = districts.find((d) => d.code === formData.district);
        const sw = wards.find((w) => w.code === formData.ward);

        const payload = {
            ...(mode === 'edit' && initialData ? { addressId: initialData.addressId } : {}),
            recipientName: formData.recipientName.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            streetAddress: formData.streetAddress.trim(),
            cityProvince: sp?.name ?? '',
            district: sd?.name ?? '',
            wardCommune: sw?.name ?? '',
            addressType: formData.addressType.toLowerCase(),
            isDefault: formData.isDefault,
            country: formData.country,
        };

        onSubmit(payload);
        // reset attempt flag & close modal (optional)
        setSubmitAttempted(false);
    };

    /* --------------------------------- Render -------------------------------- */
    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            isDismissable={false}
            shouldCloseOnInteractOutside={(element) => {
                const htmlElement = element as HTMLElement;
                return !htmlElement?.closest('[role="listbox"]');
            }}
            classNames={{
                base: 'border-0 bg-white/80 backdrop-blur-md',
                header: 'border-b-1 border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100',
                body: 'py-6',
                footer: 'border-t-1 border-gray-200 bg-gray-50/50',
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit} noValidate>
                    {/* ----------------------------- Header ----------------------------- */}
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {mode === 'create' ? (
                                <Plus className="w-5 h-5 text-orange-600" />
                            ) : (
                                <Edit className="w-5 h-5 text-orange-600" />
                            )}
                            <span className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
              </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            {mode === 'create'
                                ? 'Nhập thông tin địa chỉ giao hàng mới'
                                : 'Cập nhật thông tin địa chỉ giao hàng'}
                        </p>
                    </ModalHeader>
                    
                    <ModalBody>
                        {/* Global error summary */}
                        {submitAttempted && hasErrors && (
                            <Alert
                                color="danger"
                                variant="flat"
                                title="Thông tin chưa hợp lệ"
                                isClosable
                                onClose={() => setSubmitAttempted(false)}
                                className="mb-4"
                            >
                                <ul className="list-disc list-inside text-sm leading-relaxed">
                                    {Object.values(errors).map((msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Thông tin người nhận</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Họ và tên người nhận"
                                        value={formData.recipientName}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, recipientName: e.target.value }));
                                            if (errors.recipientName) setErrors((prev) => ({ ...prev, recipientName: '' }));
                                        }}
                                        isInvalid={!!errors.recipientName}
                                        errorMessage={errors.recipientName}
                                        startContent={<User className="w-4 h-4 text-gray-400" />}
                                        placeholder="Nhập họ và tên"
                                        classNames={{
                                            input: 'text-sm',
                                            inputWrapper: 'h-12',
                                            errorMessage: 'text-xs text-danger-500',
                                        }}
                                        required
                                    />
                                    <Input
                                        label="Số điện thoại"
                                        value={formData.phoneNumber}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }));
                                            if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                                        }}
                                        isInvalid={!!errors.phoneNumber}
                                        errorMessage={errors.phoneNumber}
                                        startContent={<Phone className="w-4 h-4 text-gray-400" />}
                                        placeholder="VD: 0123456789"
                                        classNames={{
                                            input: 'text-sm',
                                            inputWrapper: 'h-12',
                                            errorMessage: 'text-xs text-danger-500',
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                            <Divider />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Địa chỉ chi tiết</h3>
                                </div>
                                <Input
                                    label="Địa chỉ chi tiết"
                                    value={formData.streetAddress}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, streetAddress: e.target.value }));
                                        if (errors.streetAddress) setErrors((prev) => ({ ...prev, streetAddress: '' }));
                                    }}
                                    isInvalid={!!errors.streetAddress}
                                    errorMessage={errors.streetAddress}
                                    startContent={<MapPin className="w-4 h-4 text-gray-400" />}
                                    placeholder="Số nhà, tên đường, phường/xã..."
                                    classNames={{
                                        input: 'text-sm',
                                        inputWrapper: 'h-12',
                                        errorMessage: 'text-xs text-danger-500',
                                    }}
                                    required
                                />
                            </div>
                            <Divider />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Thông tin hành chính</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Province */}
                                    <Autocomplete
                                        label="Tỉnh/Thành phố"
                                        selectedKey={formData.province || undefined}
                                        onSelectionChange={handleProvinceSelect}
                                        isInvalid={!!errors.province}
                                        errorMessage={errors.province}
                                        placeholder="Chọn tỉnh/thành phố"
                                        isLoading={!provinces.length}
                                        startContent={<Building className="w-4 h-4 text-gray-400" />}
                                        classNames={{
                                            base: 'h-12',
                                            listbox: 'text-sm',
                                        }}
                                        isRequired
                                    >
                                        {provinces.map((p) => (
                                            <AutocompleteItem key={p.code}>{p.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>

                                    {/* District */}
                                    <Autocomplete
                                        label="Quận/Huyện"
                                        selectedKey={formData.district || undefined}
                                        onSelectionChange={handleDistrictSelect}
                                        isInvalid={!!errors.district}
                                        errorMessage={errors.district}
                                        placeholder="Chọn quận/huyện"
                                        isLoading={!!formData.province && !districts.length}
                                        isDisabled={!formData.province}
                                        startContent={<Building className="w-4 h-4 text-gray-400" />}
                                        classNames={{
                                            base: 'h-12',
                                            listbox: 'text-sm',
                                        }}
                                        isRequired
                                    >
                                        {districts.map((d) => (
                                            <AutocompleteItem key={d.code}>{d.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>

                                    {/* Ward */}
                                    <Autocomplete
                                        label="Phường/Xã"
                                        selectedKey={formData.ward || undefined}
                                        onSelectionChange={handleWardSelect}
                                        isInvalid={!!errors.ward}
                                        errorMessage={errors.ward}
                                        placeholder="Chọn phường/xã"
                                        isLoading={!!formData.district && !wards.length}
                                        isDisabled={!formData.district}
                                        startContent={<Building className="w-4 h-4 text-gray-400" />}
                                        classNames={{
                                            base: 'h-12',
                                            listbox: 'text-sm',
                                        }}
                                        isRequired
                                    >
                                        {wards.map((w) => (
                                            <AutocompleteItem key={w.code}>{w.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>

                                {/* Country (read‑only) */}
                                <Input
                                    label="Quốc gia"
                                    value={formData.country}
                                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                                    classNames={{ input: 'text-sm', inputWrapper: 'h-12' }}
                                    isReadOnly
                                    required
                                />
                            </div>
                            <Divider />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Cài đặt bổ sung</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Address type */}
                                    <Autocomplete
                                        label="Loại địa chỉ"
                                        selectedKey={formData.addressType}
                                        onSelectionChange={(key) => setFormData((prev) => ({ ...prev, addressType: String(key) }))}
                                        startContent={ADDRESS_TYPES.find((t) => t.value === formData.addressType)?.icon}
                                        classNames={{
                                            base: 'h-12',
                                            listbox: 'text-sm'
                                        }}
                                        isRequired
                                    >
                                        {ADDRESS_TYPES.map((t) => (
                                            <AutocompleteItem key={t.value} startContent={t.icon}>
                                                {t.label}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>

                                    {/* Default checkbox */}
                                    <div className="flex items-center justify-center h-12">
                                        <Checkbox
                                            isSelected={formData.isDefault}
                                            onValueChange={(val) => setFormData((prev) => ({ ...prev, isDefault: val }))}
                                            classNames={{ base: 'w-full', label: 'text-sm font-medium' }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-orange-500" />
                                                <span>Đặt làm địa chỉ mặc định</span>
                                            </div>
                                        </Checkbox>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="flex gap-2">
                        <Button
                            color="danger"
                            variant="light"
                            onPress={onClose}
                            startContent={<X className="w-4 h-4" />}
                            className="font-medium"
                        >
                            Hủy
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            startContent={mode === 'create' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            {mode === 'create' ? 'Thêm địa chỉ' : 'Cập nhật địa chỉ'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}