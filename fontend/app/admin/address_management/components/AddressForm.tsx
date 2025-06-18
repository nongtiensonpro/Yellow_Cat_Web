'use client';

import React, { useState, useEffect } from 'react';
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
} from "@nextui-org/react";

interface Province {
    code: string;
    name: string;
    name_with_type: string;
    type: string;
}

interface District {
    code: string;
    name: string;
    name_with_type: string;
    type: string;
    province_code: string;
}

interface Ward {
    code: string;
    name: string;
    name_with_type: string;
    type: string;
    district_code: string;
}

interface AddressFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    mode: 'create' | 'edit';
}

const ADDRESS_TYPES = [
    { value: 'HOME', label: 'Nhà riêng' },
    { value: 'OFFICE', label: 'Văn phòng' },
    { value: 'OTHER', label: 'Khác' },
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
            const response = await fetch('http://localhost:8080/api/address/provinces');
            const data = await response.json();
            console.log('Provinces data:', data);
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

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceCode = e.target.value;
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

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtCode = e.target.value;
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

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const wardCode = e.target.value;
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
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>
                        {mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
                    </ModalHeader>
                    <ModalBody>
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
                                placeholder="VD: 0123456789"
                                required
                            />
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
                                required
                            />
                            <Input
                                label="Quốc gia"
                                value={formData.country}
                                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                required
                                isReadOnly
                            />
                            <Select
                                label="Tỉnh/Thành phố"
                                selectedKeys={formData.province ? [formData.province] : []}
                                onChange={handleProvinceChange}
                                isInvalid={!!errors.province}
                                errorMessage={errors.province}
                                required
                            >
                                {provinces.map((province) => (
                                    <SelectItem key={province.code} value={province.code}>
                                        {province.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Quận/Huyện"
                                selectedKeys={formData.district ? [formData.district] : []}
                                onChange={handleDistrictChange}
                                isInvalid={!!errors.district}
                                errorMessage={errors.district}
                                required
                                isDisabled={!formData.province}
                            >
                                {districts.map((district) => (
                                    <SelectItem key={district.code} value={district.code}>
                                        {district.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Phường/Xã"
                                selectedKeys={formData.ward ? [formData.ward] : []}
                                onChange={handleWardChange}
                                isInvalid={!!errors.ward}
                                errorMessage={errors.ward}
                                required
                                isDisabled={!formData.district}
                            >
                                {wards.map((ward) => (
                                    <SelectItem key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                label="Loại địa chỉ"
                                selectedKeys={[formData.addressType]}
                                onChange={(e) => setFormData(prev => ({ ...prev, addressType: e.target.value }))}
                                required
                            >
                                {ADDRESS_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </Select>
                            <div className="flex items-center">
                                <Checkbox
                                    isSelected={formData.isDefault}
                                    onValueChange={handleDefaultChange}
                                >
                                    Đặt làm địa chỉ mặc định
                                </Checkbox>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            Hủy
                        </Button>
                        <Button color="primary" type="submit">
                            {mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 