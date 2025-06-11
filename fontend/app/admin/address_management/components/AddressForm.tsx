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
    });

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProvinces();
            if (initialData && mode === 'edit') {
                console.log('Initial data for edit:', initialData);
                setFormData({
                    recipientName: initialData.recipientName || '',
                    phoneNumber: initialData.phoneNumber || '',
                    streetAddress: initialData.streetAddress || '',
                    province: '',  // Will be set after finding matching province
                    district: '',  // Will be set after finding matching district
                    ward: '',      // Will be set after finding matching ward
                    addressType: initialData.addressType || 'HOME',
                    isDefault: initialData.isDefault || false,
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
        if (districtCode) {
            fetchWards(districtCode);
        }
    };

    const handleDefaultChange = (value: boolean) => {
        setFormData(prev => ({ ...prev, isDefault: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProvince = provinces.find(p => p.code === formData.province);
        const selectedDistrict = districts.find(d => d.code === formData.district);
        const selectedWard = wards.find(w => w.code === formData.ward);

        const addressData = {
            ...(mode === 'edit' && initialData ? { addressId: initialData.addressId } : {}),
            recipientName: formData.recipientName,
            phoneNumber: formData.phoneNumber,
            streetAddress: formData.streetAddress,
            cityProvince: selectedProvince?.name || '',
            district: selectedDistrict?.name || '',
            wardCommune: selectedWard?.name || '',
            addressType: formData.addressType,
            isDefault: formData.isDefault
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
                                onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                                required
                            />
                            <Input
                                label="Số điện thoại"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                required
                            />
                            <Input
                                label="Địa chỉ chi tiết"
                                value={formData.streetAddress}
                                onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                                required
                            />
                            <Select
                                label="Tỉnh/Thành phố"
                                selectedKeys={formData.province ? [formData.province] : []}
                                onChange={handleProvinceChange}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
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