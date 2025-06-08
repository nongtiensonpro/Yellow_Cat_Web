"use client";

import React, { useState, useEffect } from 'react';



interface Province {
    code: number;
    name: string;
}

interface District {
    code: number;
    name: string;
    parent_code: number;
}

interface Ward {
    code: number;
    name: string;
    parent_code: number;
}

interface Address {
    address_id: string;
    app_user_id: number;
    recipient_name: string;
    phone_number: string;
    street_address: string;
    ward_commune: string;
    district: string;
    city_province: string;
    country: string;
    is_default: boolean;
    address_type: string;
    created_at: string;
    updated_at: string;
}

export default function AddressPage() {

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);


    const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('');
    const [selectedWardCode, setSelectedWardCode] = useState<string>('');


    const [formData, setFormData] = useState({
        recipient_name: '',
        phone_number: '',
        street_address: '',
        address_type: '',
        is_default: false,
    });

    const [addresses, setAddresses] = useState<Address[]>([]); // Danh sách tất cả địa chỉ
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // ID của địa chỉ đang được chỉnh sửa (null nếu đang thêm mới)

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null); // Thông báo thành công/lỗi
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Trạng thái hiển thị modal xác nhận xóa
    const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null); // ID của địa chỉ cần xóa


    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false); // Đang tải tỉnh/thành phố
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false); // Đang tải quận/huyện
    const [isLoadingWards, setIsLoadingWards] = useState(false); // Đang tải phường/xã
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false); // Đang tải danh sách địa chỉ
    const [isSubmitting, setIsSubmitting] = useState(false); // Đang gửi form (thêm/cập nhật/xóa)


    const VN_API_BASE_URL = 'https://provinces.open-api.vn/api';


    const BACKEND_API_BASE_URL = '/api/addresses';

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        // Tự động xóa thông báo sau 5 giây
        setTimeout(() => setMessage(null), 5000);
    };


    useEffect(() => {
        const fetchProvinces = async () => {
            setIsLoadingProvinces(true);
            try {
                const response = await fetch(`${VN_API_BASE_URL}/p/`);
                if (!response.ok) {
                    throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                }
                const data: Province[] = await response.json();
                setProvinces(data);
            } catch (e: any) {
                showMessage('error', `Không thể tải tỉnh/thành phố: ${e.message}`);
                console.error("Lỗi khi tải tỉnh/thành phố:", e);
            } finally {
                setIsLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, []); // [] đảm bảo hàm này chỉ chạy một lần khi component mount
    useEffect(() => {
        if (selectedProvinceCode) {
            const fetchDistricts = async () => {
                setIsLoadingDistricts(true);
                setDistricts([]); // Xóa dữ liệu quận/huyện cũ
                setSelectedDistrictCode(''); // Đặt lại lựa chọn quận/huyện
                setWards([]); // Xóa dữ liệu phường/xã cũ
                setSelectedWardCode(''); // Đặt lại lựa chọn phường/xã
                try {
                    // Tải quận/huyện của tỉnh đã chọn, với depth=2 để lấy cả phường/xã
                    const response = await fetch(`${VN_API_BASE_URL}/p/${selectedProvinceCode}?depth=2`);
                    if (!response.ok) {
                        throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                    }
                    const data = await response.json();
                    setDistricts(data.districts || []); // Giả định quận/huyện nằm trong khóa 'districts'
                } catch (e: any) {
                    showMessage('error', `Không thể tải quận/huyện: ${e.message}`);
                    console.error("Lỗi khi tải quận/huyện:", e);
                } finally {
                    setIsLoadingDistricts(false);
                }
            };
            fetchDistricts();
        }
    }, [selectedProvinceCode]); // Chạy lại khi selectedProvinceCode thay đổi
    useEffect(() => {
        if (selectedDistrictCode) {
            const fetchWards = async () => {
                setIsLoadingWards(true);
                setWards([]); // Xóa dữ liệu phường/xã cũ
                setSelectedWardCode(''); // Đặt lại lựa chọn phường/xã
                try {
                    // Tải phường/xã của huyện đã chọn, với depth=2
                    const response = await fetch(`${VN_API_BASE_URL}/d/${selectedDistrictCode}?depth=2`);
                    if (!response.ok) {
                        throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                    }
                    const data = await response.json();
                    setWards(data.wards || []); // Giả định phường/xã nằm trong khóa 'wards'
                } catch (e: any) {
                    showMessage('error', `Không thể tải phường/xã: ${e.message}`);
                    console.error("Lỗi khi tải phường/xã:", e);
                } finally {
                    setIsLoadingWards(false);
                }
            };
            fetchWards();
        }
    }, [selectedDistrictCode]); // Chạy lại khi selectedDistrictCode thay đổi

    useEffect(() => {
        fetchAddresses();
    }, []); // [] đảm bảo hàm này chỉ chạy một lần khi component mount

    const fetchAddresses = async () => {
        setIsLoadingAddresses(true);
        try {
            const response = await fetch(BACKEND_API_BASE_URL);
            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
            }
            const data: Address[] = await response.json();
            setAddresses(data);
        } catch (e: any) {
            showMessage('error', `Không thể tải danh sách địa chỉ: ${e.message}`);
            console.error("Lỗi khi tải địa chỉ:", e);
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            // Xử lý riêng cho checkbox, các loại khác giữ nguyên giá trị
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };


    const handleProvinceSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvinceCode(e.target.value);
    };


    const handleDistrictSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDistrictCode(e.target.value);
    };

    const handleWardSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedWardCode(e.target.value);
    };


    const resetForm = () => {
        setFormData({
            recipient_name: '',
            phone_number: '',
            street_address: '',
            address_type: '',
            is_default: false,
        });
        setSelectedProvinceCode('');
        setSelectedDistrictCode('');
        setSelectedWardCode('');
        setEditingAddressId(null); // Xóa trạng thái chỉnh sửa
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Lấy tên đầy đủ của tỉnh/huyện/xã từ mã đã chọn
        const selectedProvinceName = provinces.find(p => p.code.toString() === selectedProvinceCode)?.name || '';
        const selectedDistrictName = districts.find(d => d.code.toString() === selectedDistrictCode)?.name || '';
        const selectedWardName = wards.find(w => w.code.toString() === selectedWardCode)?.name || '';

        // Tạo payload dữ liệu để gửi đến backend API
        const addressPayload = {
            ...formData, // Các trường từ form
            city_province: selectedProvinceName,
            district: selectedDistrictName,
            ward_commune: selectedWardName,
            country: 'Việt Nam', // Quốc gia mặc định theo schema SQL
            // app_user_id thường được backend tự động thêm vào dựa trên xác thực người dùng
        };

        try {
            let response;
            if (editingAddressId) {
                // Nếu đang chỉnh sửa, gửi yêu cầu PUT để cập nhật
                response = await fetch(`${BACKEND_API_BASE_URL}/${editingAddressId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addressPayload),
                });
                if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                showMessage('success', 'Địa chỉ đã được cập nhật thành công!');
            } else {
                // Nếu thêm mới, gửi yêu cầu POST
                response = await fetch(BACKEND_API_BASE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(addressPayload),
                });
                if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
                showMessage('success', 'Địa chỉ đã được thêm thành công!');
            }
            resetForm(); // Xóa form sau khi gửi thành công
            fetchAddresses(); // Tải lại danh sách địa chỉ để hiển thị thay đổi mới nhất
        } catch (e: any) {
            showMessage('error', `Thao tác thất bại: ${e.message}`);
            console.error("Lỗi khi gửi địa chỉ:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Đổ dữ liệu của địa chỉ vào form khi người dùng nhấn "Chỉnh Sửa"
    const handleEdit = (address: Address) => {
        setEditingAddressId(address.address_id); // Đặt ID địa chỉ đang chỉnh sửa
        setFormData({ // Đổ dữ liệu vào các trường của form
            recipient_name: address.recipient_name,
            phone_number: address.phone_number,
            street_address: address.street_address,
            address_type: address.address_type,
            is_default: address.is_default,
        });

        // Tìm mã tỉnh/thành phố từ tên và đặt vào state
        const province = provinces.find(p => p.name === address.city_province);
        setSelectedProvinceCode(province ? province.code.toString() : '');

        // Đặt mã quận/huyện và phường/xã trực tiếp.
        // Các useEffect sẽ tự động tải dữ liệu dropdown tương ứng sau khi province/district được chọn.
        const district = districts.find(d => d.name === address.district);
        setSelectedDistrictCode(district ? district.code.toString() : '');

        const ward = wards.find(w => w.name === address.ward_commune);
        setSelectedWardCode(ward ? ward.code.toString() : '');
    };

    // Chuẩn bị xóa địa chỉ bằng cách hiển thị modal xác nhận
    const handleDeleteClick = (id: string) => {
        setAddressToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    // Thực hiện thao tác xóa sau khi người dùng xác nhận
    const confirmDelete = async () => {
        if (!addressToDeleteId) return; // Đảm bảo có ID để xóa
        setIsSubmitting(true);
        try {
            const response = await fetch(`${BACKEND_API_BASE_URL}/${addressToDeleteId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
            showMessage('success', 'Địa chỉ đã được xóa thành công!');
            fetchAddresses(); // Tải lại danh sách sau khi xóa
            setAddressToDeleteId(null); // Xóa ID địa chỉ cần xóa
            setShowDeleteConfirm(false); // Ẩn modal
        } catch (e: any) {
            showMessage('error', `Xóa địa chỉ thất bại: ${e.message}`);
            console.error("Lỗi khi xóa địa chỉ:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hủy thao tác xóa và ẩn modal
    const cancelDelete = () => {
        setAddressToDeleteId(null);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter antialiased">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Quản Lý Địa Chỉ</h1>

                {/* Khu vực hiển thị thông báo (thành công/lỗi) */}
                {message && (
                    <div
                        className={`p-3 mb-4 rounded-md text-sm ${
                            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                        role="alert"
                    >
                        {message.text}
                    </div>
                )}

                {/* Form thêm/chỉnh sửa địa chỉ */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                        {editingAddressId ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
                    </h2>

                    {/* Tên người nhận */}
                    <div>
                        <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-1">Tên người nhận:</label>
                        <input
                            type="text"
                            id="recipient_name"
                            name="recipient_name"
                            value={formData.recipient_name}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại:</label>
                        <input
                            type="tel"
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Địa chỉ đường */}
                    <div>
                        <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ đường:</label>
                        <input
                            type="text"
                            id="street_address"
                            name="street_address"
                            value={formData.street_address}
                            onChange={handleFormChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Dropdown Tỉnh/Thành phố */}
                    <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố:</label>
                        <select
                            id="province"
                            name="city_province"
                            value={selectedProvinceCode}
                            onChange={handleProvinceSelectChange}
                            disabled={isLoadingProvinces || isSubmitting}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                            {provinces.map((province) => (
                                <option key={province.code} value={province.code}>
                                    {province.name}
                                </option>
                            ))}
                        </select>
                        {isLoadingProvinces && <p className="text-sm text-gray-500 mt-1">Đang tải tỉnh/thành phố...</p>}
                    </div>

                    {/* Dropdown Quận/Huyện */}
                    <div>
                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện:</label>
                        <select
                            id="district"
                            name="district"
                            value={selectedDistrictCode}
                            onChange={handleDistrictSelectChange}
                            disabled={!selectedProvinceCode || isLoadingDistricts || isSubmitting}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {districts.map((district) => (
                                <option key={district.code} value={district.code}>
                                    {district.name}
                                </option>
                            ))}
                        </select>
                        {isLoadingDistricts && <p className="text-sm text-gray-500 mt-1">Đang tải quận/huyện...</p>}
                    </div>

                    {/* Dropdown Phường/Xã */}
                    <div>
                        <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã:</label>
                        <select
                            id="ward"
                            name="ward_commune"
                            value={selectedWardCode}
                            onChange={handleWardSelectChange}
                            disabled={!selectedDistrictCode || isLoadingWards || isSubmitting}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Chọn Phường/Xã --</option>
                            {wards.map((ward) => (
                                <option key={ward.code} value={ward.code}>
                                    {ward.name}
                                </option>
                            ))}
                        </select>
                        {isLoadingWards && <p className="text-sm text-gray-500 mt-1">Đang tải phường/xã...</p>}
                    </div>

                    {/* Loại địa chỉ */}
                    <div>
                        <label htmlFor="address_type" className="block text-sm font-medium text-gray-700 mb-1">Loại địa chỉ:</label>
                        <select
                            id="address_type"
                            name="address_type"
                            value={formData.address_type}
                            onChange={handleFormChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Chọn loại --</option>
                            <option value="Nhà riêng">Nhà riêng</option>
                            <option value="Công ty">Công ty</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>

                    {/* Địa chỉ mặc định checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_default"
                            name="is_default"
                            checked={formData.is_default}
                            onChange={handleFormChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">Đặt làm địa chỉ mặc định</label>
                    </div>

                    {/* Nút Lưu/Cập nhật và Hủy */}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Đang xử lý...' : (editingAddressId ? 'Cập Nhật Địa Chỉ' : 'Lưu Địa Chỉ')}
                        </button>
                        {editingAddressId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={isSubmitting}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Hủy Chỉnh Sửa
                            </button>
                        )}
                    </div>
                </form>

                {/* Danh sách địa chỉ đã lưu */}
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Danh Sách Địa Chỉ Của Bạn</h2>
                {isLoadingAddresses ? (
                    <p className="text-center text-gray-500">Đang tải địa chỉ...</p>
                ) : addresses.length === 0 ? (
                    <p className="text-center text-gray-500">Bạn chưa có địa chỉ nào. Hãy thêm một địa chỉ mới!</p>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address) => (
                            <div key={address.address_id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                                <p className="text-lg font-medium text-gray-800">{address.recipient_name} - {address.phone_number}</p>
                                <p className="text-gray-600">{address.street_address}, {address.ward_commune}, {address.district}, {address.city_province}, {address.country}</p>
                                <p className="text-sm text-gray-500">Loại: {address.address_type} {address.is_default && '(Mặc định)'}</p>
                                <div className="mt-3 flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(address)}
                                        className="py-1 px-3 text-sm rounded-md bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                    >
                                        Chỉnh Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(address.address_id)}
                                        className="py-1 px-3 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal xác nhận xóa */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa địa chỉ</h3>
                            <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSubmitting}
                                    className="py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    disabled={isSubmitting}
                                    className="py-2 px-4 rounded-md bg-gray-300 text-gray-800 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
