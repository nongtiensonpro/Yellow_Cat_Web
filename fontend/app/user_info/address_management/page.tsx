'use client';

import React, { useState, useEffect } from 'react';

import { useTheme } from "next-themes";
import { useSearchParams } from 'next/navigation';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    ArrowLeft,
} from "lucide-react";
import LoadingSpinner from '@/components/LoadingSpinner';
import AddressForm from './components/AddressForm';
import {
    Button,
    Checkbox,
    Chip,
    Input,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow, Tooltip, useDisclosure
} from '@heroui/react';

interface Address {
    addressId: number;
    appUserId: number;
    recipientName: string;
    phoneNumber: string;
    streetAddress: string;
    wardCommune: string;
    district: string;
    cityProvince: string;
    country: string;
    isDefault: boolean;
    addressType: string;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: {
        content: Address[];
        currentPage: number;
        totalItems: number;
        totalPages: number;
        size: number;
        first: boolean;
        last: boolean;
    };
}

export default function AddressManagement() {
    const searchParams = useSearchParams();
    const userId = searchParams?.get('userId') || '';
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [filteredData, setFilteredData] = useState<Address[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { theme, setTheme } = useTheme();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [selectedAddresses, setSelectedAddresses] = useState<number[]>([]);

    const fetchAddresses = async () => {
        if (!userId) {
            console.log('No userId provided');
            return;
        }
        
        try {
            setLoading(true);
            const apiUrl = `http://localhost:8080/api/addresses/user/${userId}?page=${currentPage - 1}&size=${itemsPerPage}`;
            console.log('Calling API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
            console.log('API Response Status:', response.status);
            
            const apiResponse: ApiResponse = await response.json();
            console.log('Raw API Response:', apiResponse);

            if (apiResponse.data && Array.isArray(apiResponse.data.content)) {
                console.log('API Content:', apiResponse.data.content);
                const formattedData = apiResponse.data.content.map(address => {
                    // Decode Vietnamese characters
                    const decodeVietnamese = (str: string) => {
                        try {
                            return decodeURIComponent(escape(str));
                        } catch (e) {
                            console.error('Error decoding string:', str, e);
                            return str;
                        }
                    };

                    const decodedAddress = {
                        addressId: address.addressId,
                        appUserId: address.appUserId,
                        recipientName: decodeVietnamese(address.recipientName),
                        phoneNumber: address.phoneNumber,
                        streetAddress: decodeVietnamese(address.streetAddress),
                        wardCommune: decodeVietnamese(address.wardCommune),
                        district: decodeVietnamese(address.district),
                        cityProvince: decodeVietnamese(address.cityProvince),
                        country: decodeVietnamese(address.country),
                        isDefault: address.isDefault,
                        addressType: address.addressType
                    };
                    console.log('Decoded address:', decodedAddress);
                    return decodedAddress;
                });
                console.log('Formatted Data:', formattedData);
                setAddresses(formattedData);
                setFilteredData(formattedData);
                setTotalPages(apiResponse.data.totalPages);
                setTotalItems(apiResponse.data.totalItems);
            } else {
                console.error('Invalid API response format:', apiResponse);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            setError('Không thể tải dữ liệu địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchAddresses();
        }
    }, [userId, currentPage, itemsPerPage]);

    useEffect(() => {
        let filtered = [...addresses];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(address =>
                address.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                address.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                address.streetAddress.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        console.log('Filtered data:', filtered);
        setFilteredData(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [addresses, searchQuery]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    console.log('Current items to display:', currentItems);

    const handleBack = () => {
        window.history.back();
    };

    const handleAddNew = () => {
        setFormMode('create');
        setSelectedAddress(null);
        onOpen();
    };

    const handleEdit = (address: Address) => {
        setFormMode('edit');
        setSelectedAddress(address);
        onOpen();
    };

    const handleDelete = async (addressId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            try {
                const response = await fetch(`http://localhost:8080/api/addresses/${addressId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchAddresses();
                } else {
                    console.error('Error deleting address:', response);
                }
            } catch (error) {
                console.error('Error deleting address:', error);
            }
        }
    };

    const handleSubmit = async (formData: any) => {
        try {
            const url = formMode === 'create' 
                ? `http://localhost:8080/api/addresses/user/create/${userId}`
                : `http://localhost:8080/api/addresses/user/update/${userId}`;
            
            const method = formMode === 'create' ? 'POST' : 'PUT';

            // If setting as default, update all other addresses first
            if (formData.isDefault) {
                try {
                    // Update all other addresses to non-default
                    const updatePromises = addresses
                        .filter(addr => addr.addressId !== formData.addressId)
                        .map(addr => 
                            fetch(`http://localhost:8080/api/addresses/user/update/${userId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify({
                                    addressId: addr.addressId,
                                    recipientName: addr.recipientName,
                                    phoneNumber: addr.phoneNumber,
                                    streetAddress: addr.streetAddress,
                                    cityProvince: addr.cityProvince,
                                    district: addr.district,
                                    wardCommune: addr.wardCommune,
                                    addressType: addr.addressType,
                                    isDefault: false
                                })
                            })
                        );

                    await Promise.all(updatePromises);
                    console.log('Updated other addresses to non-default');
                } catch (error) {
                    console.error('Error updating other addresses:', error);
                }
            }
            
            console.log('Submitting address data:', formData);
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    addressId: formData.addressId,
                    recipientName: formData.recipientName,
                    phoneNumber: formData.phoneNumber,
                    streetAddress: formData.streetAddress,
                    cityProvince: formData.cityProvince,
                    district: formData.district,
                    wardCommune: formData.wardCommune,
                    addressType: formData.addressType,
                    isDefault: formData.isDefault
                }),
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (result.status === 200) {
                console.log('Address saved successfully:', result.data);
                onClose();
                fetchAddresses();
            } else {
                console.error('Error saving address:', result);
                alert('Có lỗi xảy ra khi lưu địa chỉ: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Có lỗi xảy ra khi lưu địa chỉ');
        }
    };

    const handleSelectAddress = (addressId: number) => {
        setSelectedAddresses(prev => {
            if (prev.includes(addressId)) {
                return prev.filter(id => id !== addressId);
            } else {
                return [...prev, addressId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedAddresses.length === currentItems.length) {
            setSelectedAddresses([]);
        } else {
            setSelectedAddresses(currentItems.map(item => item.addressId));
        }
    };

    const handleDeleteSelected = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/addresses/user/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(selectedAddresses)
            });

            const result = await response.json();
            console.log('Delete response:', result);

            if (response.ok) {
                console.log('Successfully deleted addresses:', selectedAddresses);
                setSelectedAddresses([]);
                fetchAddresses();
            } else {
                console.error('Error deleting addresses:', result);
                alert(result.message || 'Có lỗi xảy ra khi xóa địa chỉ');
            }
        } catch (error) {
            console.error('Error deleting addresses:', error);
            alert('Có lỗi xảy ra khi xóa địa chỉ');
        }
    };

    const handleDeleteSingle = async (addressId: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/addresses/user/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify([addressId])
            });

            const result = await response.json();
            console.log('Delete response:', result);

            if (response.ok) {
                console.log('Successfully deleted address:', addressId);
                fetchAddresses();
            } else {
                console.error('Error deleting address:', result);
                alert(result.message || 'Có lỗi xảy ra khi xóa địa chỉ');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Có lỗi xảy ra khi xóa địa chỉ');
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onClick={handleBack}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-bold">Quản lý địa chỉ</h1>
                </div>
                <div className="flex gap-4">
                    <Input
                        placeholder="Tìm kiếm theo tên, số điện thoại..."
                        startContent={<Search size={18} />}
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="md:max-w-xs"
                    />
                    <Button
                        color="primary"
                        startContent={<Plus size={18} />}
                        onClick={handleAddNew}
                    >
                        Thêm địa chỉ
                    </Button>
                </div>
            </div>

            <Table
                aria-label="Danh sách địa chỉ"
                bottomContent={
                    <div className="flex w-full justify-center">
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={currentPage}
                            total={totalPages}
                            onChange={(page: number) => setCurrentPage(page)}
                        />
                    </div>
                }
            >
                <TableHeader>
                    <TableColumn>
                        <Checkbox
                            isSelected={selectedAddresses.length === currentItems.length}
                            isIndeterminate={selectedAddresses.length > 0 && selectedAddresses.length < currentItems.length}
                            onValueChange={handleSelectAll}
                        />
                    </TableColumn>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>Họ và tên</TableColumn>
                    <TableColumn>Số điện thoại</TableColumn>
                    <TableColumn>Địa chỉ</TableColumn>
                    <TableColumn>Mặc định</TableColumn>
                    <TableColumn>Hành động</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Không có dữ liệu">
                    {currentItems.map((address) => {
                        console.log('Rendering address row:', address);
                        return (
                            <TableRow key={address.addressId}>
                                <TableCell>
                                    <Checkbox
                                        isSelected={selectedAddresses.includes(address.addressId)}
                                        onValueChange={() => handleSelectAddress(address.addressId)}
                                    />
                                </TableCell>
                                <TableCell>{address.addressId}</TableCell>
                                <TableCell>{address.recipientName}</TableCell>
                                <TableCell>{address.phoneNumber}</TableCell>
                                <TableCell>
                                    {`${address.streetAddress}, ${address.wardCommune}, ${address.district}, ${address.cityProvince}`}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        color={address.isDefault ? "success" : "default"}
                                        variant="flat"
                                    >
                                        {address.isDefault ? 'Mặc định' : 'Không mặc định'}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Tooltip content="Chỉnh sửa">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onClick={() => handleEdit(address)}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Xóa">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onClick={() => handleDeleteSingle(address.addressId)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <AddressForm
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={handleSubmit}
                initialData={selectedAddress}
                mode={formMode}
            />

            {/*<div className="flex justify-center mt-4">*/}
            {/*    <Pagination*/}
            {/*        total={totalPages}*/}
            {/*        page={currentPage}*/}
            {/*        onChange={setCurrentPage}*/}
            {/*    />*/}
            {/*</div>*/}

            <div className="flex justify-center mt-4">
                <Button 
                    color="danger" 
                    variant="flat"
                    onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedAddresses.length} địa chỉ đã chọn?`)) {
                            handleDeleteSelected();
                        }
                    }}
                >
                    Xóa đã chọn ({selectedAddresses.length})
                </Button>
            </div>
        </div>
    );
}