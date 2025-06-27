'use client';
import { Card, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"; // Simplified imports
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react"; // Import useCallback for memoization
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { CldImage } from 'next-cloudinary';

interface CartItem {
    variantId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
}

interface ConfirmedOrder {
    items: CartItem[];
    subTotal: number;
}

// Interfaces for administrative divisions
interface Province {
    code: number;
    name: string;
    codename: string;
    division_type: string;
    phone_code: number;
}

interface District {
    code: number;
    name: string;
    parent_code: number;
    codename: string;
    division_type: string;
    short_codename: string;
}

interface Ward {
    code: number;
    name: string;
    parent_code: number;
    codename: string;
    division_type: string;
    short_codename: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
    const [loadingCart, setLoadingCart] = useState(true);

    // --- State for Address Form ---
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [note, setNote] = useState('');

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
    const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);

    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const { data: session } = useSession();

    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [userAddresses, setUserAddresses] = useState<any[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    const [pendingProvinceName, setPendingProvinceName] = useState<string | null>(null);
    const [pendingDistrictName, setPendingDistrictName] = useState<string | null>(null);
    const [pendingWardName, setPendingWardName] = useState<string | null>(null);

    // Lấy dữ liệu đơn hàng đã xác nhận từ sessionStorage
    useEffect(() => {
        const storedOrder = sessionStorage.getItem('confirmedOrder');
        if (storedOrder) {
            try {
                const orderData = JSON.parse(storedOrder);
                setConfirmedOrder(orderData);
            } catch (error) {
                console.error('Error parsing confirmed order:', error);
                // Nếu không có dữ liệu hợp lệ, chuyển về cart
                router.push('/cart');
                return;
            }
        } else {
            // Nếu không có dữ liệu xác nhận, chuyển về cart
            router.push('/cart');
            return;
        }
        setLoadingCart(false);
    }, [router]);

    // --- API Calls for Provinces, Districts, Wards ---

    // Fetch Provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const response = await fetch('http://localhost:8080/api/address/provinces');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setProvinces(data);
            } catch (error) {
                console.error("Error fetching provinces:", error);
                setProvinces([]);
            } finally {
                setLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch Districts based on selected Province
    useEffect(() => {
        if (selectedProvinceCode) {
            setLoadingDistricts(true);
            setDistricts([]);
            setSelectedDistrictCode(null);
            setWards([]);
            setSelectedWardCode(null);

            const fetchDistricts = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/address/districts/${selectedProvinceCode}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setDistricts(data);
                } catch (error) {
                    console.error("Error fetching districts:", error);
                    setDistricts([]);
                } finally {
                    setLoadingDistricts(false);
                }
            };
            fetchDistricts();
        } else {
            setDistricts([]);
            setSelectedDistrictCode(null);
            setWards([]);
            setSelectedWardCode(null);
        }
    }, [selectedProvinceCode]);

    // Fetch Wards based on selected District
    useEffect(() => {
        if (selectedDistrictCode) {
            setLoadingWards(true);
            setWards([]);
            setSelectedWardCode(null);

            const fetchWards = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/address/wards/${selectedDistrictCode}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setWards(data);
                } catch (error) {
                    console.error("Error fetching wards:", error);
                    setWards([]);
                } finally {
                    setLoadingWards(false);
                }
            };
            fetchWards();
        } else {
            setWards([]);
            setSelectedWardCode(null);
        }
    }, [selectedDistrictCode]);

    // --- Handlers for select changes ---
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedProvinceCode(isNaN(code) ? null : code);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedDistrictCode(isNaN(code) ? null : code);
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedWardCode(isNaN(code) ? null : code);
    };

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }, []); // Memoize this function

    // Hoàn lại kho khi rời khỏi trang checkout (chỉ khi người dùng bấm quay lại hoặc đóng tab)
    const handleRevertStock = async () => {
        if (!session || !session.accessToken) return;
        let keycloakId = null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch {
            return;
        }
        try {
            await fetch(`http://localhost:8080/api/cart/revert?keycloakId=${keycloakId}`, {
                method: 'POST',
            });
            // Xóa dữ liệu đã xác nhận khỏi sessionStorage
            sessionStorage.removeItem('confirmedOrder');
        } catch (error) {
            console.error('Error reverting stock:', error);
        }
    };

    // Xử lý khi người dùng bấm nút quay lại
    const handleGoBack = () => {
        handleRevertStock();
        router.push('/cart');
    };

    // Chỉ revert khi đóng tab/trình duyệt hoặc quay lại (popstate)
    useEffect(() => {
        const handleBeforeUnload = () => {
            handleRevertStock();
        };
        const handlePopState = () => {
            handleRevertStock();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [session]);

    useEffect(() => {
        // Lấy tên người dùng từ backend nếu chưa có
        const fetchUserFullName = async () => {
            if (fullName) return; // Đã có thì không gọi lại
            if (!session || !session.accessToken) return;
            let keycloakId = null;
            try {
                const tokenData = jwtDecode(session.accessToken);
                keycloakId = tokenData.sub;
            } catch {
                return;
            }
            try {
                const res = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.data && data.data.fullName) {
                    setFullName(data.data.fullName);
                }
            } catch {}
        };
        fetchUserFullName();
        // eslint-disable-next-line
    }, [session]);

    // Hàm lấy danh sách địa chỉ
    const fetchUserAddresses = async () => {
        if (!session || !session.accessToken) return;
        let keycloakId = null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch {
            return;
        }
        setLoadingAddresses(true);
        try {
            const res = await fetch(`http://localhost:8080/api/addresses/user/${keycloakId}?page=0&size=100`);
            if (!res.ok) throw new Error('Không thể lấy địa chỉ');
            const data = await res.json();
            if (data && data.data && data.data.content) {
                setUserAddresses(data.data.content);
            } else {
                setUserAddresses([]);
            }
        } catch {
            setUserAddresses([]);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleOpenAddressModal = () => {
        fetchUserAddresses();
        setAddressModalOpen(true);
    };
    const handleCloseAddressModal = () => setAddressModalOpen(false);

    // Hàm chuẩn hóa chuỗi: bỏ dấu, chuyển thường, trim
    function normalizeString(str: string) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .toLowerCase().trim();
    }

    const handleSelectAddress = (address: any) => {
        setFullName(address.recipientName || '');
        setPhone(address.phoneNumber || '');
        setAddressDetail(address.streetAddress || '');

        // Reset select về null trước khi set lại (đảm bảo trigger useEffect)
        setSelectedProvinceCode(null);
        setSelectedDistrictCode(null);
        setSelectedWardCode(null);

        setTimeout(() => {
            // Ưu tiên fill bằng code nếu có
            if (address.provinceCode) {
                setSelectedProvinceCode(Number(address.provinceCode));
            } else if (address.province || address.cityProvince) {
                setPendingProvinceName(address.province || address.cityProvince);
            }

            if (address.districtCode) {
                setPendingDistrictName(null);
                setSelectedDistrictCode(Number(address.districtCode));
            } else if (address.district) {
                setPendingDistrictName(address.district);
            }

            if (address.wardCode) {
                setPendingWardName(null);
                setSelectedWardCode(Number(address.wardCode));
            } else if (address.wardCommune) {
                setPendingWardName(address.wardCommune);
            }
        }, 0);

        handleCloseAddressModal();
    };

    useEffect(() => {
        if (pendingProvinceName && provinces.length > 0) {
            const p = provinces.find(v => normalizeString(v.name) === normalizeString(pendingProvinceName));
            if (p) {
                setSelectedProvinceCode(p.code);
            }
            setPendingProvinceName(null);
        }
        // eslint-disable-next-line
    }, [provinces]);

    useEffect(() => {
        if (pendingDistrictName && districts.length > 0) {
            const d = districts.find(v => normalizeString(v.name) === normalizeString(pendingDistrictName));
            if (d) {
                setSelectedDistrictCode(d.code);
            }
            setPendingDistrictName(null);
        }
        // eslint-disable-next-line
    }, [districts]);

    useEffect(() => {
        if (pendingWardName && wards.length > 0) {
            const w = wards.find(v => normalizeString(v.name) === normalizeString(pendingWardName));
            if (w) {
                setSelectedWardCode(w.code);
            }
            setPendingWardName(null);
        }
        // eslint-disable-next-line
    }, [wards]);

    if (loadingCart || loadingProvinces) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    if (!confirmedOrder) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Không tìm thấy thông tin đơn hàng. Đang chuyển về giỏ hàng...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white">
            <div className="mx-auto max-w-6xl p-0">
                <div className="bg-gradient-to-tr from-green-50 via-white to-blue-50 rounded-3xl p-6 md:p-12 my-10">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh toán đơn hàng</h1>
                        <Button 
                            variant="light" 
                            onClick={handleGoBack}
                            className="text-gray-600 hover:text-gray-800 font-medium"
                        >
                            ← Quay lại giỏ hàng
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Section: Information Form */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="p-8 rounded-3xl shadow-2xl border border-green-200 bg-white transition-all duration-200 hover:shadow-3xl">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                                    <span>1</span> Thông tin giao hàng
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                            placeholder="Nhập họ và tên"
                                />
                            </div>
                            <div>
                                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                                <input
                                    type="text"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                            placeholder="Nhập số điện thoại"
                                />
                            </div>
                            <div>
                                        <label htmlFor="province" className="block text-sm font-semibold text-gray-700 mb-2">Tỉnh/Thành phố</label>
                                <select
                                    id="province"
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                    onChange={handleProvinceChange}
                                    value={selectedProvinceCode || ''}
                                    disabled={loadingProvinces}
                                >
                                    <option value="">Chọn Tỉnh/Thành phố</option>
                                    {provinces.map(province => (
                                        <option key={province.code} value={province.code}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                                        {loadingProvinces && <p className="text-sm text-gray-400 mt-1">Đang tải tỉnh/thành phố...</p>}
                            </div>
                            <div>
                                        <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-2">Quận/Huyện</label>
                                <select
                                    id="district"
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                    onChange={handleDistrictChange}
                                    value={selectedDistrictCode || ''}
                                    disabled={!selectedProvinceCode || loadingDistricts}
                                >
                                    <option value="">Chọn Quận/Huyện</option>
                                    {districts.map(district => (
                                        <option key={district.code} value={district.code}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                                        {loadingDistricts && <p className="text-sm text-gray-400 mt-1">Đang tải quận/huyện...</p>}
                            </div>
                            <div>
                                        <label htmlFor="ward" className="block text-sm font-semibold text-gray-700 mb-2">Xã/Phường</label>
                                <select
                                    id="ward"
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                    onChange={handleWardChange}
                                    value={selectedWardCode || ''}
                                    disabled={!selectedDistrictCode || loadingWards}
                                >
                                    <option value="">Chọn Xã/Phường</option>
                                    {wards.map(ward => (
                                        <option key={ward.code} value={ward.code}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                                        {loadingWards && <p className="text-sm text-gray-400 mt-1">Đang tải xã/phường...</p>}
                            </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="addressDetail" className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ cụ thể</label>
                                <input
                                    type="text"
                                    id="addressDetail"
                                            placeholder="Số nhà, tên đường..."
                                    value={addressDetail}
                                    onChange={(e) => setAddressDetail(e.target.value)}
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                />
                            </div>
                            <div className="md:col-span-2">
                                        <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
                                <textarea
                                    id="note"
                                    placeholder="Ví dụ: Giao hàng vào buổi tối..."
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                            className="p-4 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                                ></textarea>
                            </div>
                        </div>
                                <div className="flex justify-end mt-6">
                                    <Button
                                        className="bg-white text-green-600 border border-green-600 hover:bg-green-50 text-base py-2 px-6 rounded-lg font-semibold shadow-sm"
                                        onClick={handleOpenAddressModal}
                                    >
                                        Chọn địa chỉ giao hàng
                                    </Button>
                                </div>
                                {/* Modal chọn địa chỉ */}
                                <Modal isOpen={addressModalOpen} onOpenChange={setAddressModalOpen} size="lg">
                                    <ModalContent>
                                        <ModalHeader>Chọn địa chỉ giao hàng</ModalHeader>
                                        <ModalBody>
                                            {loadingAddresses ? (
                                                <div className="text-center py-8 text-gray-500">Đang tải địa chỉ...</div>
                                            ) : userAddresses.length === 0 ? (
                                                <div className="text-center py-8 text-gray-400">Bạn chưa có địa chỉ nào.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {userAddresses.map((address, idx) => (
                                                        <div
                                                            key={address.addressId || idx}
                                                            className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:border-green-500 transition-all"
                                                            onClick={() => handleSelectAddress(address)}
                                                        >
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{address.recipientName}</div>
                                                                <div className="text-sm text-gray-500">{address.phoneNumber}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    {address.streetAddress}
                                                                    {address.wardCommune ? `, ${address.wardCommune}` : ''}
                                                                    {address.district ? `, ${address.district}` : ''}
                                                                    {address.province || address.cityProvince ? `, ${address.province || address.cityProvince}` : ''}
                                                                </div>
                                                            </div>
                                                            <Button size="sm" className="mt-2 md:mt-0" onClick={() => handleSelectAddress(address)}>
                                                                Chọn
                            </Button>
                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ModalBody>
                                        <ModalFooter>
                                            <Button variant="light" onClick={handleCloseAddressModal}>Đóng</Button>
                                        </ModalFooter>
                                    </ModalContent>
                                </Modal>
                    </Card>

                            <Card className="p-8 rounded-3xl shadow-2xl border border-green-200 bg-white transition-all duration-200 hover:shadow-3xl">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                                    <span>2</span> Phương thức thanh toán
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label
                                        className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                            paymentMethod === 'cod' ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                                            className="h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <div className="ml-3 text-gray-700 font-medium flex items-center">
                                            <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs font-semibold mr-2">COD</span>
                                Thanh toán khi nhận hàng
                            </div>
                        </label>
                        <label
                                        className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                            paymentMethod === 'online' ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="online"
                                checked={paymentMethod === 'online'}
                                onChange={() => setPaymentMethod('online')}
                                            className="h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <div className="ml-3 text-gray-700 font-medium flex items-center">
                                <img src="/images/vnpay.png" alt="VNPay" className="h-6 w-auto mr-2" />
                                Thanh toán qua VNPay
                            </div>
                        </label>
                    </div>
                                <Button color="primary" size="lg" className="w-full mt-8 py-3 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200">
                        XÁC NHẬN ĐẶT HÀNG
                    </Button>
                            </Card>
                </div>

                {/* Right Section: Order Summary */}
                        <div className="lg:col-span-1 bg-white p-10 min-w-[340px] max-w-[420px] rounded-3xl border border-green-200 shadow-2xl flex flex-col gap-6 sticky top-8 h-fit transition-all duration-200 hover:shadow-3xl">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Tóm tắt đơn hàng</h2>
                            {confirmedOrder.items.length === 0 ? (
                                <p className="text-gray-500 text-center">Không có sản phẩm nào trong đơn hàng.</p>
                    ) : (
                        <>
                                    <div className="space-y-4 mb-4">
                                        {confirmedOrder.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                    {item.imageUrl ? (
                                                    item.imageUrl.startsWith('http') ? (
                                        <img
                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            width={56}
                                                            height={56}
                                                            className="rounded-lg object-cover border border-gray-200 bg-white w-14 h-14"
                                        />
                                    ) : (
                                                        <CldImage
                                                            width={56}
                                                            height={56}
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            className="rounded-lg object-cover border border-gray-200 bg-white w-14 h-14"
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-gray-100">
                                            No Image
                                        </div>
                                    )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{item.productName}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">Số lượng: <span className="font-semibold text-gray-700">{item.quantity}</span> x <span>{formatPrice(item.unitPrice)}</span></p>
                                                </div>
                                                <div className="text-right min-w-[80px]">
                                                    <span className="font-bold text-green-700 text-base">{formatPrice(item.totalPrice)}</span>
                                    </div>
                                </div>
                            ))}
                                </div>
                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <div className="flex justify-between text-base text-gray-700">
                                            <span>Đơn vị vận chuyển:</span>
                                            <span>GHTK</span>
                                        </div>
                                        <div className="flex justify-between text-base text-gray-700">
                                            <span>Phí giao hàng:</span>
                                            <span>{formatPrice(0)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-green-700">
                                            <span>Tổng cộng:</span>
                                            <span>{formatPrice(confirmedOrder.subTotal)}</span>
                                        </div>
                                    </div>
                        </>
                    )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}