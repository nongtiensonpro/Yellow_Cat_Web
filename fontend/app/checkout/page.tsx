'use client';

import { Card, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { CldImage } from "next-cloudinary";
import Image from "next/image";

// --- Interfaces ---
interface CartItem {
    id: number;
    productId: number;
    productName: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
}
interface Province {
    code: number;
    name: string;
}
interface District {
    code: number;
    name: string;
}
interface Ward {
    code: number;
    name:string;
}
interface Address {
    addressId?: string;
    recipientName: string;
    phoneNumber: string;
    streetAddress: string;
    wardCommune?: string;
    district?: string;
    province?: string;
    cityProvince?: string;
    country?: string;
    isDefault?: boolean;
    addressType?: string;
}
interface CartResponse {
    items: CartItem[];
}
interface AddressResponse {
    data: {
        content: Address[];
    };
}
interface ExtendedSession {
    user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    accessToken?: string;
}
interface JWTTokenData {
    sub: string;
    [key: string]: unknown;
}


export default function CheckoutPage() {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loadingCart, setLoadingCart] = useState(true);

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

    const { data: session } = useSession() as { data: ExtendedSession | null };
    const revertedRef = useRef(false);

    const [shippingFee, setShippingFee] = useState<number>(0);
    const [loadingShippingFee, setLoadingShippingFee] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);

    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const [targetDistrictName, setTargetDistrictName] = useState<string | null>(null);
    const [targetWardName, setTargetWardName] = useState<string | null>(null);

    const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({ recipientName: '', phoneNumber: '', streetAddress: '', wardCommune: '', district: '', province: '' });
    const [addProvinceCode, setAddProvinceCode] = useState<number | null>(null);
    const [addDistrictCode, setAddDistrictCode] = useState<number | null>(null);
    const [addWardCode, setAddWardCode] = useState<number | null>(null);
    const [addDistricts, setAddDistricts] = useState<District[]>([]);
    const [addWards, setAddWards] = useState<Ward[]>([]);
    const [addLoadingDistricts, setAddLoadingDistricts] = useState(false);
    const [addLoadingWards, setAddLoadingWards] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleRevertStock = useCallback(async () => {
        if (revertedRef.current) return;
        revertedRef.current = true;
        let keycloakId: string | null = null;
        if (session?.user && session.accessToken) {
            try {
                const tokenData: JWTTokenData = jwtDecode(session.accessToken);
                keycloakId = tokenData.sub;
            } catch { return; }
        } else if (typeof window !== 'undefined') {
            keycloakId = localStorage.getItem('guestId') || null;
        }
        if (!keycloakId) return;
        try {
            await fetch(`http://localhost:8080/api/cart/revert?keycloakId=${keycloakId}`, {
                method: 'POST',
                keepalive: true
            });
        } catch (error) {
            console.error('Error reverting stock:', error);
        }
    }, [session]);

    const handleSelectAddress = useCallback((address: Address, closeModal = true) => {
        setSelectedAddress(address);
        setFullName(address.recipientName || '');
        setPhone(address.phoneNumber || '');
        setAddressDetail(address.streetAddress || '');

        const province = provinces.find(p => p.name === (address.province || address.cityProvince));
        if (province) {
            setTargetDistrictName(address.district || null);
            setTargetWardName(address.wardCommune || null);
            setSelectedProvinceCode(province.code);
        } else {
            setSelectedProvinceCode(null);
            setSelectedDistrictCode(null);
            setSelectedWardCode(null);
        }

        if (closeModal) {
            setAddressModalOpen(false);
        }
    }, [provinces]);

    const fetchUserAddresses = useCallback(async (): Promise<Address[] | undefined> => {
        if (!session || !session.accessToken) return;
        let keycloakId: string | null = null;
        try {
            const tokenData: JWTTokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch { return; }
        try {
            const res = await fetch(`http://localhost:8080/api/addresses/user/${keycloakId}?page=0&size=100`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (!res.ok) throw new Error('Không thể lấy địa chỉ');
            const data: AddressResponse = await res.json();
            const addresses = data?.data?.content || [];
            setUserAddresses(addresses);
            return addresses;
        } catch {
            setUserAddresses([]);
            return [];
        }
    }, [session]);

    const fetchProvinces = useCallback(async () => {
        if (provinces.length > 0) return;
        setLoadingProvinces(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
            const data: Province[] = await response.json();
            setProvinces(data);
        } catch (error) {
            console.error("Error fetching provinces:", error);
        } finally {
            setLoadingProvinces(false);
        }
    }, [provinces.length]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingCart(true);
            await fetchProvinces();
            if (session?.user) {
                fetch(`http://localhost:8080/api/cart?keycloakId=${session.user.id}`)
                    .then(res => res.json())
                    .then((data: CartResponse) => setCartItems((data.items || []).map(item => ({ ...item, id: item.id || item.productId }))))
                    .catch(() => setCartItems([]));

                const addresses = await fetchUserAddresses();
                if (addresses && addresses.length > 0) {
                    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
                    if(defaultAddress) {
                        handleSelectAddress(defaultAddress, false);
                    }
                }
            } else if (typeof window !== 'undefined') {
                const storedCart = localStorage.getItem('cart');
                if (storedCart) setCartItems(JSON.parse(storedCart));
            }
            setLoadingCart(false);
        };
        loadInitialData();
    }, [session, fetchUserAddresses, handleSelectAddress, fetchProvinces]);

    useEffect(() => {
        if (!selectedProvinceCode) {
            setDistricts([]);
            setSelectedDistrictCode(null);
            return;
        }
        setLoadingDistricts(true);
        setDistricts([]);
        setSelectedDistrictCode(null);
        fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`).then(res => res.json()).then(data => setDistricts(data.districts || [])).catch(err => console.error(err)).finally(() => setLoadingDistricts(false));
    }, [selectedProvinceCode]);

    useEffect(() => {
        if (targetDistrictName && districts.length > 0) {
            const district = districts.find(d => d.name === targetDistrictName);
            if (district) {
                setSelectedDistrictCode(district.code);
                setTargetDistrictName(null);
            }
        }
    }, [districts, targetDistrictName]);

    useEffect(() => {
        if (!selectedDistrictCode) {
            setWards([]);
            setSelectedWardCode(null);
            return;
        }
        setLoadingWards(true);
        setWards([]);
        setSelectedWardCode(null);
        fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`).then(res => res.json()).then(data => setWards(data.wards || [])).catch(err => console.error(err)).finally(() => setLoadingWards(false));
    }, [selectedDistrictCode]);

    useEffect(() => {
        if (targetWardName && wards.length > 0) {
            const ward = wards.find(w => w.name === targetWardName);
            if (ward) { setSelectedWardCode(ward.code); setTargetWardName(null); }
        }
    }, [wards, targetWardName]);

    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFullName(e.target.value); setSelectedAddress(null); };
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPhone(e.target.value); setSelectedAddress(null); };
    const handleAddressDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => { setAddressDetail(e.target.value); setSelectedAddress(null); };
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const code = parseInt(e.target.value); setSelectedProvinceCode(isNaN(code) ? null : code); setSelectedDistrictCode(null); setSelectedWardCode(null); setSelectedAddress(null); };
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const code = parseInt(e.target.value); setSelectedDistrictCode(isNaN(code) ? null : code); setSelectedWardCode(null); setSelectedAddress(null); };
    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const code = parseInt(e.target.value); setSelectedWardCode(isNaN(code) ? null : code); setSelectedAddress(null); };

    const calculateSubtotal = useCallback(() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0), [cartItems]);
    const formatPrice = useCallback((price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price), []);
    const totalBeforeDiscount = calculateSubtotal();
    const discount = 0;

    const handleGoBack = () => { handleRevertStock(); router.push('/cart'); };
    useEffect(() => { const onBeforeUnload = () => handleRevertStock(); window.addEventListener('beforeunload', onBeforeUnload); return () => window.removeEventListener('beforeunload', onBeforeUnload); }, [handleRevertStock]);

    const fetchShippingFee = async (province: string, district: string, value: number) => {
        setLoadingShippingFee(true);
        setShippingError(null);
        try {
            const res = await fetch(`http://localhost:8080/api/ghtk/fee?province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}&weight=1000&value=${value}`);
            const data = await res.json();
            if (res.ok && data.data != null) { setShippingFee(data.data); }
            else { setShippingFee(0); setShippingError("Không tính được phí"); }
        } catch { setShippingFee(0); setShippingError("Lỗi tính phí"); }
        finally { setLoadingShippingFee(false); }
    };

    useEffect(() => {
        const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name;
        const districtName = districts.find(d => d.code === selectedDistrictCode)?.name;
        if (provinceName && districtName && cartItems.length > 0) {
            fetchShippingFee(provinceName, districtName, totalBeforeDiscount);
        } else { setShippingFee(0); }
    }, [selectedProvinceCode, selectedDistrictCode, cartItems, provinces, districts, totalBeforeDiscount]);

    const handleOpenAddressModal = () => { fetchUserAddresses(); setAddressModalOpen(true); };
    const handleCloseAddressModal = () => setAddressModalOpen(false);

    const handleOrder = async () => {
        if (!session?.user) {
            if (!fullName.trim() || !phone.trim() || !selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !addressDetail.trim()) {
                alert('Vui lòng nhập đầy đủ thông tin giao hàng có dấu *!'); return;
            }
            if (!/^0\d{9,10}$/.test(phone.trim())) { alert('Số điện thoại không hợp lệ.'); return; }

            const selectedProvinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
            const selectedDistrictName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
            const selectedWardName = wards.find(w => w.code === selectedWardCode)?.name || '';
            const guestId = typeof window !== 'undefined' ? localStorage.getItem('guestId') || '' : '';

            const orderRequest = {
                appUser: { keycloakId: guestId, username: fullName, phoneNumber: phone },
                shippingAddress: { recipientName: fullName, phoneNumber: phone, streetAddress: addressDetail, wardCommune: selectedWardName, district: selectedDistrictName, cityProvince: selectedProvinceName, country: 'Việt Nam', isDefault: true, addressType: 'guest' },
                shippingMethodId: 1, shippingFee: shippingFee, note: note, paymentStatus: 'PENDING',
                products: cartItems.map(item => ({ id: item.id || item.productId, quantity: item.quantity }))
            };
            try {
                const response = await fetch('http://localhost:8080/api/orders/online', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderRequest),
                });
                const data = await response.json();
                if (response.ok) {
                    revertedRef.current = true;
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('cart');
                        localStorage.removeItem('guestId');
                    }
                    router.push(`/checkout/success?orderId=${data.orderId}`);
                } else {
                    alert(data.message || 'Đặt hàng thất bại');
                }
            } catch {
                alert('Có lỗi xảy ra khi đặt hàng');
            }
            return;
        }

        const isCustomAddress = !selectedAddress;
        if (isCustomAddress && (!fullName.trim() || !phone.trim() || !selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !addressDetail.trim())) {
            alert('Vui lòng nhập đầy đủ thông tin giao hàng có dấu *!'); return;
        }
        if (isCustomAddress && !/^0\d{9,10}$/.test(phone.trim())) { alert('Số điện thoại không hợp lệ.'); return; }

        const selectedProvinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
        const selectedDistrictName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
        const selectedWardName = wards.find(w => w.code === selectedWardCode)?.name || '';

        // Kiểm tra session và accessToken
        if (!session?.accessToken) {
            alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
            return;
        }

        const orderRequest = {
            appUser: { keycloakId: session.user.id, username: fullName, phoneNumber: phone },
            shippingAddress: {
                addressId: isCustomAddress ? null : selectedAddress?.addressId,
                recipientName: fullName, phoneNumber: phone, streetAddress: addressDetail,
                wardCommune: selectedWardName, district: selectedDistrictName, cityProvince: selectedProvinceName,
                country: 'Việt Nam', isDefault: isCustomAddress ? false : selectedAddress?.isDefault,
                addressType: isCustomAddress ? 'custom' : selectedAddress?.addressType,
            },
            shippingMethodId: 1, shippingFee: shippingFee, note: note, paymentStatus: 'PENDING',
            products: cartItems.map(item => ({ id: item.id || item.productId, quantity: item.quantity }))
        };

        try {
            const response = await fetch('http://localhost:8080/api/orders/online', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                body: JSON.stringify(orderRequest),
            });
            const data = await response.json();
            if (response.ok) {
                revertedRef.current = true;
                router.push(`/checkout/success?orderId=${data.orderId}`);
            } else {
                alert(data.message || 'Đặt hàng thất bại');
            }
        } catch {
            alert('Có lỗi xảy ra khi đặt hàng');
        }
    };

    const handleAddProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setAddProvinceCode(isNaN(code) ? null : code);
        setAddDistrictCode(null); setAddWardCode(null);
        setAddDistricts([]); setAddWards([]);
        if (!isNaN(code)) {
            setAddLoadingDistricts(true);
            fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then(res => res.json()).then(data => setAddDistricts(data.districts || [])).catch(() => setAddDistricts([])).finally(() => setAddLoadingDistricts(false));
        }
    };
    const handleAddDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setAddDistrictCode(isNaN(code) ? null : code);
        setAddWardCode(null); setAddWards([]);
        if (!isNaN(code)) {
            setAddLoadingWards(true);
            fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then(res => res.json()).then(data => setAddWards(data.wards || [])).catch(() => setAddWards([])).finally(() => setAddLoadingWards(false));
        }
    };
    const handleAddWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const code = parseInt(e.target.value); setAddWardCode(isNaN(code) ? null : code); };

    useEffect(() => {
        if (addAddressModalOpen) {
            setNewAddress({ recipientName: '', phoneNumber: '', streetAddress: '', wardCommune: '', district: '', province: '' });
            setAddProvinceCode(null); setAddDistrictCode(null); setAddWardCode(null);
            setAddDistricts([]); setAddWards([]); setAddError(null);
        }
    }, [addAddressModalOpen]);

    const handleAddAddress = async () => {
        setAddError(null);
        
        // Kiểm tra session trước khi thực hiện
        if (!session?.accessToken) {
            setAddError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
            return;
        }
        
        if (!newAddress.recipientName.trim() || !newAddress.phoneNumber.trim() || !newAddress.streetAddress.trim() || !addProvinceCode || !addDistrictCode || !addWardCode) {
            setAddError('Vui lòng nhập đầy đủ thông tin bắt buộc.'); return;
        }
        if (!/^0\d{9,10}$/.test(newAddress.phoneNumber.trim())) { setAddError('Số điện thoại không hợp lệ.'); return; }
        const provinceName = provinces.find(p => p.code === addProvinceCode)?.name || '';
        const districtName = addDistricts.find(d => d.code === addDistrictCode)?.name || '';
        const wardName = addWards.find(w => w.code === addWardCode)?.name || '';
        const payload = { ...newAddress, cityProvince: provinceName, district: districtName, wardCommune: wardName, isDefault: false, addressType: 'home', country: 'Việt Nam' };
        const keycloakId = session?.user?.id;
        try {
            const res = await fetch(`http://localhost:8080/api/addresses/user/create/${keycloakId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessToken}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setAddAddressModalOpen(false);
                fetchUserAddresses();
            } else { setAddError(data.message || 'Không thể thêm địa chỉ'); }
        } catch { setAddError('Có lỗi xảy ra'); }
    };

    const handleDeleteAddress = async (addressId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            // Kiểm tra session trước khi thực hiện
            if (!session?.accessToken) {
                alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
                return;
            }
            
            setIsSubmitting(true);
            try {
                const response = await fetch(`http://localhost:8080/api/addresses/${addressId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${session.accessToken}` }
                });
                if (response.ok) {
                    setUserAddresses(prevAddresses => prevAddresses.filter(addr => addr.addressId !== addressId));
                    if (selectedAddress?.addressId === addressId) {
                        setSelectedAddress(null);
                        setFullName('');
                        setPhone('');
                        setAddressDetail('');
                        setSelectedProvinceCode(null);
                    }
                    alert('Xóa địa chỉ thành công.');
                } else {
                    alert('Xóa địa chỉ thất bại. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error("Error deleting address:", error);
                alert('Có lỗi xảy ra khi xóa địa chỉ.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleSetDefaultAddress = async (addressId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        
        // Kiểm tra session trước khi thực hiện
        if (!session?.accessToken) {
            alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8080/api/addresses/default/${addressId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });

            if (response.ok) {
                alert('Đặt làm địa chỉ mặc định thành công.');
                const updatedAddresses = await fetchUserAddresses();

                if (updatedAddresses && updatedAddresses.length > 0) {
                    const newDefaultAddress = updatedAddresses.find(addr => addr.isDefault);
                    if (newDefaultAddress) {
                        handleSelectAddress(newDefaultAddress, false);
                    }
                }
            } else {
                alert('Đặt làm mặc định thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error("Error setting default address:", error);
            alert('Có lỗi xảy ra.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const RequiredMark = () => <span className="text-red-500 ml-1">*</span>;

    if (loadingCart || loadingProvinces) {
        return <div className="flex justify-center items-center min-h-screen"><p>Đang tải...</p></div>;
    }

    return (
        <div className="w-full mx-auto my-10 p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">THÔNG TIN THANH TOÁN</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Thông tin giao hàng</h2>
                            {session?.user && (
                                <Button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-sm py-2 px-4 rounded-md" onClick={handleOpenAddressModal}>
                                    CHỌN ĐỊA CHỈ KHÁC
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <RequiredMark /></label>
                                    <input type="text" id="fullName" value={fullName} onChange={handleFullNameChange} className="p-3 border border-gray-300 rounded-md w-full" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <RequiredMark /></label>
                                    <input type="text" id="phone" value={phone} onChange={handlePhoneChange} className="p-3 border border-gray-300 rounded-md w-full" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/thành phố <RequiredMark /></label>
                                    <select id="province" className="p-3 border border-gray-300 rounded-md w-full" onChange={handleProvinceChange} value={selectedProvinceCode || ''} disabled={loadingProvinces}>
                                        <option value="">Chọn Tỉnh/Thành phố</option>
                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/huyện <RequiredMark /></label>
                                    <select id="district" className="p-3 border border-gray-300 rounded-md w-full" onChange={handleDistrictChange} value={selectedDistrictCode || ''} disabled={!selectedProvinceCode || loadingDistricts}>
                                        <option value="">Chọn Quận/Huyện</option>
                                        {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Xã/thị trấn <RequiredMark /></label>
                                    <select id="ward" className="p-3 border border-gray-300 rounded-md w-full" onChange={handleWardChange} value={selectedWardCode || ''} disabled={!selectedDistrictCode || loadingWards}>
                                        <option value="">Chọn Xã/Thị trấn</option>
                                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể <RequiredMark /></label>
                                <input type="text" id="addressDetail" placeholder="Số nhà, tên đường, tòa nhà..." value={addressDetail} onChange={handleAddressDetailChange} className="p-3 border border-gray-300 rounded-md w-full" />
                            </div>
                            <div>
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="p-3 border border-gray-300 rounded-md w-full"></textarea>
                            </div>
                        </div>
                    </Card>

                    <h2 className="text-xl font-bold mb-3 text-gray-800">Phương thức thanh toán</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${paymentMethod === 'cod' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}>
                            <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="h-5 w-5 text-blue-600" />
                            <div className="ml-3 text-gray-700 font-medium">Thanh toán khi nhận hàng</div>
                        </label>
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${paymentMethod === 'online' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}>
                            <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="h-5 w-5 text-blue-600" />
                            <div className="ml-3 text-gray-700 font-medium flex items-center">
                                <Image src="/images/vnpay.png" alt="VNPay" width={24} height={24} className="h-6 w-auto mr-2" />
                                Thanh toán qua VNPay
                            </div>
                        </label>
                    </div>

                    <Button color="primary" size="lg" className="w-full mt-6 py-3 text-lg font-semibold" onClick={handleOrder}>
                        XÁC NHẬN ĐẶT HÀNG
                    </Button>
                </div>

                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Đơn hàng của bạn</h2>
                    {cartItems.length === 0 ? <p className="text-gray-500 text-center">Không có sản phẩm nào.</p> : <>
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-start mb-6 border-b pb-4 last:border-b-0 last:pb-0">
                                <CldImage width={80} height={80} src={item.imageUrl} alt={item.name} sizes="80px" className="w-20 h-20 object-cover mr-4 rounded-md" />
                                <div className="flex-1">
                                    <h3 className="text-md font-semibold text-gray-800">{item.productName}</h3>
                                    <div className="flex gap-4 text-sm text-gray-700 mt-1">
                                        <span>Màu: <span className="font-semibold">{item.colorName || '-'}</span></span>
                                        <span>Size: <span className="font-semibold">{item.sizeName || '-'}</span></span>
                                    </div>
                                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                    <p className="text-md font-bold text-red-600 mt-1">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            </div>
                        ))}
                        <div className="space-y-2 mt-6 text-gray-700">
                            <div className="flex justify-between">
                                <span>Tổng phụ:</span>
                                <span>{formatPrice(totalBeforeDiscount)}</span>
                            </div>
                            {cartItems.length > 0 && <>
                                <div className="flex justify-between text-base text-gray-700">
                                    <span>Phí giao hàng:</span>
                                    {loadingShippingFee ? <span>Đang tính...</span> : shippingError ? <span className="text-red-500">{shippingError}</span> : <span>{formatPrice(shippingFee)}</span>}
                                </div>
                                <div className="flex justify-between">
                                    <span>Giảm giá:</span>
                                    <span>- {formatPrice(discount)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-red-700">
                                    <span>Tổng cộng:</span>
                                    <span>{formatPrice(totalBeforeDiscount + (shippingFee || 0))}</span>
                                </div>
                            </>}
                        </div>
                    </>}
                    <Button variant="ghost" size="sm" onClick={handleGoBack} className="text-gray-500 mt-6 w-full">&larr; Quay lại giỏ hàng</Button>
                </div>
            </div>

            <Modal isOpen={addressModalOpen} onOpenChange={setAddressModalOpen} size="lg" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>Chọn hoặc quản lý địa chỉ</ModalHeader>
                    <ModalBody>
                        {userAddresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">Bạn chưa có địa chỉ nào.</div>
                        ) : (
                            <div className="space-y-4">
                                {[...userAddresses]
                                    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                                    .map((address) => (
                                        <div
                                            key={address.addressId}
                                            className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-sm"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 flex items-center">
                                                    {address.recipientName}
                                                    {address.isDefault && (
                                                        <span className="ml-2 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                                                        Mặc định
                                                     </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">{address.phoneNumber}</div>
                                                <div className="text-sm text-gray-500">
                                                    {address.streetAddress}, {address.wardCommune}, {address.district}, {address.province || address.cityProvince}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                                                {!address.isDefault && (
                                                    <Button
                                                        size="sm"
                                                        variant="light"
                                                        onClick={(e) => handleSetDefaultAddress(address.addressId!, e)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Đặt làm mặc định
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onClick={(e) => handleDeleteAddress(address.addressId!, e)}
                                                    disabled={isSubmitting || address.isDefault}
                                                    className={address.isDefault ? 'cursor-not-allowed' : ''}
                                                    title={address.isDefault ? 'Không thể xóa địa chỉ mặc định' : 'Xóa địa chỉ'}
                                                >
                                                    Xóa
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    onClick={() => handleSelectAddress(address)}
                                                    disabled={isSubmitting}
                                                >
                                                    Chọn
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onClick={handleCloseAddressModal}>Đóng</Button>
                        <Button color="primary" onClick={() => { setAddressModalOpen(false); setAddAddressModalOpen(true); }}>Thêm địa chỉ mới</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={addAddressModalOpen} onOpenChange={setAddAddressModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Thêm địa chỉ mới</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="add_recipientName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên
                                </label>
                                <input
                                    id="add_recipientName"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={newAddress.recipientName}
                                    onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="add_phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Số điện thoại
                                </label>
                                <input
                                    id="add_phoneNumber"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={newAddress.phoneNumber}
                                    onChange={e => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="add_streetAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ cụ thể
                                </label>
                                <input
                                    id="add_streetAddress"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Số nhà, tên đường, tên tòa nhà..."
                                    value={newAddress.streetAddress}
                                    onChange={e => setNewAddress({ ...newAddress, streetAddress: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="add_province" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỉnh/Thành phố
                                    </label>
                                    <select id="add_province" className="w-full p-2 border border-gray-300 rounded" value={addProvinceCode || ''} onChange={handleAddProvinceChange}>
                                        <option value="">Chọn Tỉnh/Thành phố</option>
                                        {provinces.map(province => (<option key={province.code} value={province.code}>{province.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="add_district" className="block text-sm font-medium text-gray-700 mb-1">
                                        Quận/Huyện
                                    </label>
                                    <select id="add_district" className="w-full p-2 border border-gray-300 rounded" value={addDistrictCode || ''} onChange={handleAddDistrictChange} disabled={!addProvinceCode || addLoadingDistricts}>
                                        <option value="">Chọn Quận/Huyện</option>
                                        {addDistricts.map(district => (<option key={district.code} value={district.code}>{district.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="add_ward" className="block text-sm font-medium text-gray-700 mb-1">
                                        Xã/Phường
                                    </label>
                                    <select id="add_ward" className="w-full p-2 border border-gray-300 rounded" value={addWardCode || ''} onChange={handleAddWardChange} disabled={!addDistrictCode || addLoadingWards}>
                                        <option value="">Chọn Xã/Phường</option>
                                        {addWards.map(ward => (<option key={ward.code} value={ward.code}>{ward.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onClick={() => setAddAddressModalOpen(false)}>Hủy</Button>
                        <Button color="primary" onClick={handleAddAddress}>Lưu</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}