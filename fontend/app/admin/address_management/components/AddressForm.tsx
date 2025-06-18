'use client';

import React, { useState, useEffect } from 'react';
import { Selection } from '@react-types/shared';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Checkbox,
    Divider,
    Chip,
} from "@heroui/react";
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
} from "lucide-react";

interface Province {
    code: string;
    name: string;
    districts?: any[];
}

interface District {
    code: string;
    name: string;
    wards?: any[];
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

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        // Validate recipient name
        if (!formData.recipientName.trim()) {
            newErrors.recipientName = 'Họ và tên không được để trống';
        } else if (formData.recipientName.trim().length < 2) {
            newErrors.recipientName = 'Họ và tên phải có ít nhất 2 ký tự';
        }

        // Validate phone number
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Số điện thoại không được để trống';
        } else if (!PHONE_REGEX.test(formData.phoneNumber.trim())) {
            newErrors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam';
        }

        // Validate street address
        if (!formData.streetAddress.trim()) {
            newErrors.streetAddress = 'Địa chỉ chi tiết không được để trống';
        }

        // Validate province
        if (!formData.province) {
            newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        }

        // Validate district
        if (!formData.district) {
            newErrors.district = 'Vui lòng chọn quận/huyện';
        }

        // Validate ward
        if (!formData.ward) {
            newErrors.ward = 'Vui lòng chọn phường/xã';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (isOpen) {
            console.log('Form opened, fetching provinces...');
            fetchProvinces();
            setErrors({}); // Clear errors when opening form
            if (initialData && mode === 'edit') {
                console.log('Initial data for edit:', initialData);
                
                // Convert addressType from lowercase to uppercase for form
                const addressTypeUpper = initialData.addressType?.toUpperCase() || 'HOME';
                
                setFormData({
                    recipientName: initialData.recipientName || '',
                    phoneNumber: initialData.phoneNumber || '',
                    streetAddress: initialData.streetAddress || '',
                    province: '',  // Will be set after finding matching province
                    district: '',  // Will be set after finding matching district
                    ward: '',      // Will be set after finding matching ward
                    addressType: addressTypeUpper,
                    isDefault: initialData.isDefault || false,
                    country: initialData.country && initialData.country.trim() !== '' ? initialData.country : 'Việt Nam',
                });

                // Find matching province by name
                const matchingProvince = provinces.find(p => p.name === initialData.cityProvince);
                if (matchingProvince) {
                    setFormData(prev => ({ ...prev, province: matchingProvince.code }));
                    fetchDistricts(matchingProvince.code);
                }
            } else {
                // Reset form for new address
                console.log('Resetting form for new address');
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
        }
    }, [isOpen, initialData, mode]);

    // Add effect to log form data changes
    useEffect(() => {
        console.log('Form data changed:', formData);
        console.log('Provinces count:', provinces.length);
        console.log('Districts count:', districts.length);
        console.log('Wards count:', wards.length);
    }, [formData, provinces, districts, wards]);

    // Add effect to handle district selection when provinces are loaded
    useEffect(() => {
        if (initialData && mode === 'edit' && provinces.length > 0) {
            const matchingProvince = provinces.find(p => p.name === initialData.cityProvince);
            if (matchingProvince) {
                setFormData(prev => ({ ...prev, province: matchingProvince.code }));
                fetchDistricts(matchingProvince.code);
            }
        }
    }, [provinces, initialData, mode]);

    // Add effect to handle ward selection when districts are loaded
    useEffect(() => {
        if (initialData && mode === 'edit' && districts.length > 0) {
            const matchingDistrict = districts.find(d => d.name === initialData.district);
            if (matchingDistrict) {
                setFormData(prev => ({ ...prev, district: matchingDistrict.code }));
                fetchWards(matchingDistrict.code);
            }
        }
    }, [districts, initialData, mode]);

    // Add effect to handle ward selection when wards are loaded
    useEffect(() => {
        if (initialData && mode === 'edit' && wards.length > 0) {
            const matchingWard = wards.find(w => w.name === initialData.wardCommune);
            if (matchingWard) {
                setFormData(prev => ({ ...prev, ward: matchingWard.code }));
            }
        }
    }, [wards, initialData, mode]);

    const fetchProvinces = async () => {
        try {
            console.log('Fetching provinces...');
            const response = await fetch('http://localhost:8080/api/address/provinces');
            console.log('Provinces response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Provinces data:', data);
            console.log('Number of provinces:', data.length);
            setProvinces(data);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    const fetchDistricts = async (provinceCode: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/address/districts/${provinceCode}`);
            const data = await response.json();
            console.log('Districts data:', data);
            setDistricts(data);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const fetchWards = async (districtCode: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/address/wards/${districtCode}`);
            const data = await response.json();
            console.log('Wards data:', data);
            setWards(data);
        } catch (error) {
            console.error('Error fetching wards:', error);
        }
    };

    const handleProvinceChange = (e: any) => {
        const provinceCode = e.target.value;
        console.log('Province changed to:', provinceCode);
        setFormData(prev => ({
            ...prev,
            province: provinceCode,
            district: '',
            ward: ''
        }));
        setDistricts([]);
        setWards([]);
        // Clear related errors
        setErrors(prev => ({
            ...prev,
            province: '',
            district: '',
            ward: ''
        }));
        if (provinceCode) {
            fetchDistricts(provinceCode);
        }
    };

    const handleDistrictChange = (e: any) => {
        const districtCode = e.target.value;
        console.log('District changed to:', districtCode);
        setFormData(prev => ({
            ...prev,
            district: districtCode,
            ward: ''
        }));
        setWards([]);
        // Clear related errors
        setErrors(prev => ({
            ...prev,
            district: '',
            ward: ''
        }));
        if (districtCode) {
            fetchWards(districtCode);
        }
    };

    const handleWardChange = (e: any) => {
        const wardCode = e.target.value;
        console.log('Ward changed to:', wardCode);
        setFormData(prev => ({ ...prev, ward: wardCode }));
        // Clear ward error
        setErrors(prev => ({ ...prev, ward: '' }));
    };

    const handleDefaultChange = (value: boolean) => {
        setFormData(prev => ({ ...prev, isDefault: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const selectedProvince = provinces.find(p => p.code === formData.province);
        const selectedDistrict = districts.find(d => d.code === formData.district);
        const selectedWard = wards.find(w => w.code === formData.ward);

        const addressData = {
            ...(mode === 'edit' && initialData ? { addressId: initialData.addressId } : {}),
            recipientName: formData.recipientName.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            streetAddress: formData.streetAddress.trim(),
            cityProvince: selectedProvince?.name || '',
            district: selectedDistrict?.name || '',
            wardCommune: selectedWard?.name || '',
            addressType: formData.addressType.toLowerCase(),
            isDefault: formData.isDefault,
            country: formData.country || 'Việt Nam'
        };

        console.log('Submitting form data:', addressData);
        onSubmit(addressData);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="3xl"
            classNames={{
                base: "border-0 bg-white/80 backdrop-blur-md",
                header: "border-b-1 border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100",
                body: "py-6",
                footer: "border-t-1 border-gray-200 bg-gray-50/50",
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {mode === 'create' ? (
                                <>
                                    <Plus className="w-5 h-5 text-orange-600" />
                                    <span className="text-lg font-semibold text-gray-800">Thêm địa chỉ mới</span>
                                </>
                            ) : (
                                <>
                                    <Edit className="w-5 h-5 text-orange-600" />
                                    <span className="text-lg font-semibold text-gray-800">Chỉnh sửa địa chỉ</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {mode === 'create' 
                                ? 'Nhập thông tin địa chỉ giao hàng mới' 
                                : 'Cập nhật thông tin địa chỉ giao hàng'
                            }
                        </p>
                    </ModalHeader>
                    
                    <ModalBody>
                        <div className="space-y-6">
                            {/* Thông tin người nhận */}
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
                                            setFormData(prev => ({ ...prev, recipientName: e.target.value }));
                                            if (errors.recipientName) {
                                                setErrors(prev => ({ ...prev, recipientName: '' }));
                                            }
                                        }}
                                        isInvalid={!!errors.recipientName}
                                        errorMessage={errors.recipientName}
                                        startContent={<User className="w-4 h-4 text-gray-400" />}
                                        placeholder="Nhập họ và tên"
                                        classNames={{
                                            input: "text-sm",
                                            inputWrapper: "h-12",
                                        }}
                                        required
                                    />
                                    <Input
                                        label="Số điện thoại"
                                        value={formData.phoneNumber}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, phoneNumber: e.target.value }));
                                            if (errors.phoneNumber) {
                                                setErrors(prev => ({ ...prev, phoneNumber: '' }));
                                            }
                                        }}
                                        isInvalid={!!errors.phoneNumber}
                                        errorMessage={errors.phoneNumber}
                                        startContent={<Phone className="w-4 h-4 text-gray-400" />}
                                        placeholder="VD: 0123456789"
                                        classNames={{
                                            input: "text-sm",
                                            inputWrapper: "h-12",
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <Divider />

                            {/* Địa chỉ chi tiết */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Địa chỉ chi tiết</h3>
                                </div>
                                <Input
                                    label="Địa chỉ chi tiết"
                                    value={formData.streetAddress}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, streetAddress: e.target.value }));
                                        if (errors.streetAddress) {
                                            setErrors(prev => ({ ...prev, streetAddress: '' }));
                                        }
                                    }}
                                    isInvalid={!!errors.streetAddress}
                                    errorMessage={errors.streetAddress}
                                    startContent={<MapPin className="w-4 h-4 text-gray-400" />}
                                    placeholder="Số nhà, tên đường, phường/xã..."
                                    classNames={{
                                        input: "text-sm",
                                        inputWrapper: "h-12",
                                    }}
                                    required
                                />
                            </div>

                            <Divider />

                            {/* Thông tin hành chính */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Thông tin hành chính</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                        label="Tỉnh/Thành phố"
                                        selectedKeys={formData.province ? [formData.province] : []}
                                        onSelectionChange={(keys: Selection) => {
                                            const provinceCode = Array.from(keys)[0] as string;
                                            handleProvinceChange({ target: { value: provinceCode } });
                                        }}
                                        isInvalid={!!errors.province}
                                        errorMessage={errors.province}
                                        startContent={<Building className="w-4 h-4 text-gray-400" />}
                                        placeholder="Chọn tỉnh/thành phố"
                                        isLoading={provinces.length === 0}
                                        classNames={{
                                            trigger: "h-12",
                                            listbox: "text-sm",
                                        }}
                                        required
                                    >
                                        {provinces.length === 0 ? (
                                            <SelectItem key="loading">Đang tải...</SelectItem>
                                        ) : (
                                            provinces.map((province) => (
                                                <SelectItem key={province.code}>
                                                    {province.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                    <Select
                                        label="Quận/Huyện"
                                        selectedKeys={formData.district ? [formData.district] : []}
                                        onSelectionChange={(keys: Selection) => {
                                            const districtCode = Array.from(keys)[0] as string;
                                            handleDistrictChange({ target: { value: districtCode } });
                                        }}
                                        isInvalid={!!errors.district}
                                        errorMessage={errors.district}
                                        placeholder="Chọn quận/huyện"
                                        isLoading={districts.length === 0 && !!formData.province}
                                        isDisabled={!formData.province}
                                        classNames={{
                                            trigger: "h-12",
                                            listbox: "text-sm",
                                        }}
                                        required
                                    >
                                        {districts.length === 0 && formData.province ? (
                                            <SelectItem key="loading">Đang tải...</SelectItem>
                                        ) : (
                                            districts.map((district) => (
                                                <SelectItem key={district.code}>
                                                    {district.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                    <Select
                                        label="Phường/Xã"
                                        selectedKeys={formData.ward ? [formData.ward] : []}
                                        onSelectionChange={(keys: Selection) => {
                                            const wardCode = Array.from(keys)[0] as string;
                                            handleWardChange({ target: { value: wardCode } });
                                        }}
                                        isInvalid={!!errors.ward}
                                        errorMessage={errors.ward}
                                        placeholder="Chọn phường/xã"
                                        isLoading={wards.length === 0 && !!formData.district}
                                        isDisabled={!formData.district}
                                        classNames={{
                                            trigger: "h-12",
                                            listbox: "text-sm",
                                        }}
                                        required
                                    >
                                        {wards.length === 0 && formData.district ? (
                                            <SelectItem key="loading">Đang tải...</SelectItem>
                                        ) : (
                                            wards.map((ward) => (
                                                <SelectItem key={ward.code}>
                                                    {ward.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </Select>
                                </div>
                                <Input
                                    label="Quốc gia"
                                    value={formData.country}
                                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                    startContent={<Globe className="w-4 h-4 text-gray-400" />}
                                    classNames={{
                                        input: "text-sm",
                                        inputWrapper: "h-12",
                                    }}
                                    isReadOnly
                                    required
                                />
                            </div>

                            <Divider />

                            {/* Cài đặt bổ sung */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Cài đặt bổ sung</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Loại địa chỉ"
                                        selectedKeys={[formData.addressType]}
                                        onSelectionChange={(keys: Selection) => {
                                            const addressType = Array.from(keys)[0] as string;
                                            setFormData(prev => ({ ...prev, addressType }));
                                        }}
                                        startContent={ADDRESS_TYPES.find(t => t.value === formData.addressType)?.icon}
                                        classNames={{
                                            trigger: "h-12",
                                            listbox: "text-sm",
                                        }}
                                        required
                                    >
                                        {ADDRESS_TYPES.map((type) => (
                                            <SelectItem key={type.value} startContent={type.icon}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <div className="flex items-center justify-center h-12">
                                        <Checkbox
                                            isSelected={formData.isDefault}
                                            onValueChange={handleDefaultChange}
                                            classNames={{
                                                base: "w-full",
                                                label: "text-sm font-medium",
                                            }}
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