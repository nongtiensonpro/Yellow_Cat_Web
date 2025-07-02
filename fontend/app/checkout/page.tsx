'use client';
import { Card, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"; // Simplified imports
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react"; // Import useCallback for memoization
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";

interface CartItem {
    id: number;
    productId: number;
    productName: string;
    name: string; // The variant name in the cart
    price: number; // This is assumed to be the price of the selected variant
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
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
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
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
    const revertedRef = useRef(false);

    const [shippingFee, setShippingFee] = useState<number>(0);
    const [loadingShippingFee, setLoadingShippingFee] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);

    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [userAddresses, setUserAddresses] = useState<any[]>([]);
    const [selectedAddressText, setSelectedAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({
        recipientName: '',
        phoneNumber: '',
        streetAddress: '',
        wardCommune: '',
        district: '',
        province: '',
    });
    const [addProvinceCode, setAddProvinceCode] = useState<number | null>(null);
    const [addDistrictCode, setAddDistrictCode] = useState<number | null>(null);
    const [addWardCode, setAddWardCode] = useState<number | null>(null);
    const [addDistricts, setAddDistricts] = useState<District[]>([]);
    const [addWards, setAddWards] = useState<Ward[]>([]);
    const [addLoadingDistricts, setAddLoadingDistricts] = useState(false);
    const [addLoadingWards, setAddLoadingWards] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            // Lấy từ backend
            fetch(`http://localhost:8080/api/cart?keycloakId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setCartItems((data.items || []).map((item: any) => ({
                    ...item,
                    id: item.id || item.variantId
                }))));
        } else if (typeof window !== 'undefined') {
            // Lấy từ localStorage
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        }
        setLoadingCart(false);
    }, [session]);

    // --- API Calls for Provinces, Districts, Wards ---

    // Fetch Provinces
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const response = await fetch('https://provinces.open-api.vn/api/?depth=1');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Province[] = await response.json();
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
                    const response = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setDistricts(data.districts || []);
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
                    const response = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setWards(data.wards || []);
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
        setSelectedDistrictCode(null);
        setShippingFee(0);
        setShippingError(null);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedDistrictCode(isNaN(code) ? null : code);
        if (isNaN(code)) {
            setShippingFee(0);
            setShippingError(null);
        }
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedWardCode(isNaN(code) ? null : code);
    };

    const calculateSubtotal = useCallback(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]); // Memoize this calculation

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }, []); // Memoize this function

    // Calculate totals without shipping fee and discount
    const totalBeforeDiscount = calculateSubtotal();
    const discount = 0; // Set discount to 0
    const finalTotal = totalBeforeDiscount + shippingFee - discount; // The final total is now just the subtotal

    const handleRevertStock = useCallback(async () => {
        if (revertedRef.current) return; // Đã revert rồi thì không gọi nữa
        revertedRef.current = true;
        let keycloakId = null;
        if (session?.user && session.accessToken) {
            try {
                const tokenData = jwtDecode(session.accessToken);
                keycloakId = tokenData.sub;
            } catch {
                return;
            }
        } else if (typeof window !== 'undefined') {
            keycloakId = localStorage.getItem('guestId') || null;
        }
        if (!keycloakId) return;
        try {
            await fetch(`http://localhost:8080/api/cart/revert?keycloakId=${keycloakId}`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Error reverting stock:', error);
        }
    }, [session]);

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
    }, [handleRevertStock]);

    // Revert stock khi chuyển route nội bộ Next.js (SPA)
    useEffect(() => {
        let ignore = false;
        const handleRouteChange = (url: string) => {
            if (ignore) return;
            if (url !== '/checkout') {
                handleRevertStock();
            }
        };
        const pushState = window.history.pushState;
        const replaceState = window.history.replaceState;
        function patchHistory(method: any) {
            return function(this: any) {
                const url = arguments[2];
                if (typeof url === 'string') {
                    handleRouteChange(url);
                }
                return method.apply(this, arguments);
            };
        }
        window.history.pushState = patchHistory(pushState);
        window.history.replaceState = patchHistory(replaceState);
        const popHandler = (e: any) => {
            handleRouteChange(window.location.pathname);
        };
        window.addEventListener('popstate', popHandler);
        return () => {
            ignore = true;
            window.history.pushState = pushState;
            window.history.replaceState = replaceState;
            window.removeEventListener('popstate', popHandler);
        };
    }, [handleRevertStock]);

    // Hàm lấy phí vận chuyển
    const fetchShippingFee = async (province: string, district: string, value: number) => {
        setLoadingShippingFee(true);
        setShippingError(null);
        try {
            const res = await fetch(
                `http://localhost:8080/api/ghtk/fee?province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}&weight=1000&value=${value}`
            );
            const data = await res.json();
            if (res.ok && data.data != null) {
                setShippingFee(data.data);
            } else {
                setShippingFee(0);
                setShippingError("Không lấy được phí vận chuyển");
            }
        } catch (err) {
            setShippingFee(0);
            setShippingError("Không lấy được phí vận chuyển");
        } finally {
            setLoadingShippingFee(false);
        }
    };

    // Gọi phí vận chuyển khi chọn tỉnh/huyện
    useEffect(() => {
        if (
            selectedProvinceCode &&
            selectedDistrictCode &&
            cartItems.length > 0 &&
            provinces.length > 0 &&
            districts.length > 0
        ) {
            const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name;
            const districtName = districts.find(d => d.code === selectedDistrictCode)?.name;
            if (provinceName && districtName) {
                fetchShippingFee(provinceName, districtName, totalBeforeDiscount);
            }
        } else {
            setShippingFee(0);
            setShippingError(null);
        }
        // eslint-disable-next-line
    }, [selectedProvinceCode, selectedDistrictCode, cartItems.length, provinces, districts]);

    // Hàm lấy danh sách địa chỉ user (giả sử đã có API, có thể cần sửa lại endpoint cho đúng)
    const fetchUserAddresses = async () => {
        if (!session || !session.accessToken) return;
        let keycloakId = null;
        try {
            const tokenData = jwtDecode(session.accessToken);
            keycloakId = tokenData.sub;
        } catch {
            return;
        }
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
        }
    };

    const handleOpenAddressModal = () => {
        fetchUserAddresses();
        setAddressModalOpen(true);
    };

    const handleCloseAddressModal = () => setAddressModalOpen(false);

    const handleSelectAddress = (address: any) => {
        if (session?.user) {
            setSelectedAddress(address);
            const text = `${address.recipientName || ''} - ${address.phoneNumber || ''} - ${address.streetAddress || ''}${address.wardCommune ? ', ' + address.wardCommune : ''}${address.district ? ', ' + address.district : ''}${address.province || address.cityProvince ? ', ' + (address.province || address.cityProvince) : ''}`;
            setSelectedAddressText(text);
            setAddressModalOpen(false);
            // Nếu có tỉnh và huyện, tự động lấy phí vận chuyển
            const provinceName = address.province || address.cityProvince;
            const districtName = address.district;
            if (provinceName && districtName) {
                fetchShippingFee(provinceName, districtName, totalBeforeDiscount);
            }
        } else {
            // Reset toàn bộ các ô input về rỗng/null (chỉ cho khách chưa đăng nhập)
            setFullName('');
            setPhone('');
            setAddressDetail('');
            setSelectedProvinceCode(null);
            setSelectedDistrictCode(null);
            setSelectedWardCode(null);
            const text = `${address.recipientName || ''} - ${address.phoneNumber || ''} - ${address.streetAddress || ''}${address.wardCommune ? ', ' + address.wardCommune : ''}${address.district ? ', ' + address.district : ''}${address.province || address.cityProvince ? ', ' + (address.province || address.cityProvince) : ''}`;
            setSelectedAddressText(text);
            setAddressModalOpen(false);
            // Nếu có tỉnh và huyện, tự động lấy phí vận chuyển
            const provinceName = address.province || address.cityProvince;
            const districtName = address.district;
            if (provinceName && districtName) {
                fetchShippingFee(provinceName, districtName, totalBeforeDiscount);
            }
        }
    };

    const handleOrder = async () => {
        if (!session?.user) {
            // Validate các trường bắt buộc
            if (!fullName.trim() || !phone.trim() || !selectedProvinceCode || !selectedDistrictCode || !selectedWardCode || !addressDetail.trim()) {
                alert('Vui lòng nhập đầy đủ thông tin giao hàng!');
                return;
            }
            if (!/^0\d{9,10}$/.test(phone.trim())) {
                alert('Số điện thoại không hợp lệ.');
                return;
            }
            // Lấy tên tỉnh/thành, quận/huyện, phường/xã từ dropdown
            const selectedProvinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
            const selectedDistrictName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
            const selectedWardName = wards.find(w => w.code === selectedWardCode)?.name || '';
            // Lấy guestId từ localStorage
            let guestId = '';
            if (typeof window !== 'undefined') {
                guestId = localStorage.getItem('guestId') || '';
            }
            // Chuẩn bị orderRequest cho khách chưa đăng nhập
            const orderRequest = {
                appUser: {
                    keycloakId: guestId,
                    username: fullName,
                    phoneNumber: phone
                },
                shippingAddress: {
                    recipientName: fullName,
                    phoneNumber: phone,
                    streetAddress: addressDetail,
                    wardCommune: selectedWardName,
                    district: selectedDistrictName,
                    cityProvince: selectedProvinceName,
                    country: 'Việt Nam',
                    isDefault: true,
                    addressType: 'guest'
                },
                shippingMethodId: 1,
                shippingFee: shippingFee,
                note: note,
                paymentStatus: 'PENDING',
                products: cartItems.map(item => ({
                    id: item.id || item.productId,
                    quantity: item.quantity
                }))
            };
            try {
                const response = await fetch('http://localhost:8080/api/orders/online', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderRequest),
                });
                const data = await response.json();
                if (response.ok) {
                    revertedRef.current = true;
                    if (!session?.user && typeof window !== 'undefined') {
                        localStorage.removeItem('cart');
                        localStorage.removeItem('guestId');
                    }
                    router.push('/checkout/success');
                } else {
                    console.error('Order API error:', data);
                    alert(data.message || 'Đặt hàng thất bại');
                }
            } catch (err) {
                alert('Có lỗi xảy ra khi đặt hàng');
            }
            return;
        }

        if (session?.user && !selectedAddress) {
            alert('Vui lòng chọn địa chỉ giao hàng!');
            return;
        }

        // Lấy tên tỉnh/thành, quận/huyện, phường/xã từ dropdown
        const selectedProvinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
        const selectedDistrictName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
        const selectedWardName = wards.find(w => w.code === selectedWardCode)?.name || '';

        // Nếu user đăng nhập, lấy keycloakId và username từ session
        const keycloakId = session?.user?.id || '';

        // Nếu chọn địa chỉ đã lưu, lấy addressId, còn không thì để rỗng
        const addressId = userAddresses.find(addr =>
            addr.recipientName === fullName &&
            addr.phoneNumber === phone &&
            addr.streetAddress === addressDetail
        )?.addressId || '';

        // Lấy thông tin từ selectedAddress nếu có, ưu tiên selectedAddress
        const recipientName = selectedAddress?.recipientName || fullName;
        const phoneNumber = selectedAddress?.phoneNumber || phone;
        const streetAddress = selectedAddress?.streetAddress || addressDetail;
        const wardCommune = selectedAddress?.wardCommune || selectedWardName;
        const district = selectedAddress?.district || selectedDistrictName;
        const cityProvince = selectedAddress?.province || selectedProvinceName || selectedAddress?.cityProvince;
        const isDefault = selectedAddress?.isDefault ?? true;
        const addressType = selectedAddress?.addressType || 'home';

        const orderRequest = {
            appUser: {
                keycloakId: session?.user?.id || '',
                username: selectedAddress?.recipientName || '',
                phoneNumber: selectedAddress?.phoneNumber || ''
            },
            shippingAddress: {
                addressId: selectedAddress?.addressId || '',
                recipientName: selectedAddress?.recipientName || '',
                phoneNumber: selectedAddress?.phoneNumber || '',
                streetAddress: selectedAddress?.streetAddress || '',
                wardCommune: selectedAddress?.wardCommune || '',
                district: selectedAddress?.district || '',
                cityProvince: selectedAddress?.province || selectedAddress?.cityProvince || '',
                country: 'Việt Nam',
                isDefault: selectedAddress?.isDefault ?? true,
                addressType: selectedAddress?.addressType || 'home'
            },
            shippingMethodId: 1,
            shippingFee: shippingFee,
            note: note,
            paymentStatus: 'PENDING',
            products: cartItems.map(item => ({
                id: item.id || item.productId,
                quantity: item.quantity
            }))
        };
        console.log('orderRequest:', orderRequest);
        try {
            const response = await fetch('http://localhost:8080/api/orders/online', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderRequest),
            });
            const data = await response.json();
            if (response.ok) {
                revertedRef.current = true;
                if (!session?.user && typeof window !== 'undefined') {
                    localStorage.removeItem('cart');
                    localStorage.removeItem('guestId');
                }
                router.push('/checkout/success');
            } else {
                console.error('Order API error:', data);
                alert(data.message || 'Đặt hàng thất bại');
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi đặt hàng');
        }
    };

    // Xử lý chọn tỉnh trong modal thêm địa chỉ
    const handleAddProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setAddProvinceCode(isNaN(code) ? null : code);
        setAddDistrictCode(null);
        setAddWardCode(null);
        setAddDistricts([]);
        setAddWards([]);
        if (!isNaN(code)) {
            setAddLoadingDistricts(true);
            fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
                .then(res => res.json())
                .then(data => setAddDistricts(data.districts || []))
                .catch(() => setAddDistricts([]))
                .finally(() => setAddLoadingDistricts(false));
        }
    };
    // Xử lý chọn huyện trong modal thêm địa chỉ
    const handleAddDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setAddDistrictCode(isNaN(code) ? null : code);
        setAddWardCode(null);
        setAddWards([]);
        if (!isNaN(code)) {
            setAddLoadingWards(true);
            fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
                .then(res => res.json())
                .then(data => setAddWards(data.wards || []))
                .catch(() => setAddWards([]))
                .finally(() => setAddLoadingWards(false));
        }
    };
    // Xử lý chọn xã trong modal thêm địa chỉ
    const handleAddWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setAddWardCode(isNaN(code) ? null : code);
    };
    // Reset modal khi mở
    useEffect(() => {
        if (addAddressModalOpen) {
            setNewAddress({ recipientName: '', phoneNumber: '', streetAddress: '', wardCommune: '', district: '', province: '' });
            setAddProvinceCode(null);
            setAddDistrictCode(null);
            setAddWardCode(null);
            setAddDistricts([]);
            setAddWards([]);
            setAddError(null);
        }
    }, [addAddressModalOpen]);
    // Hàm xử lý thêm địa chỉ mới (có validate)
    const handleAddAddress = async () => {
        setAddError(null);
        // Validate
        if (!newAddress.recipientName.trim() || !newAddress.phoneNumber.trim() || !newAddress.streetAddress.trim() || !addProvinceCode || !addDistrictCode || !addWardCode) {
            setAddError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
            return;
        }
        // Validate số điện thoại (10-11 số, bắt đầu bằng 0)
        if (!/^0\d{9,10}$/.test(newAddress.phoneNumber.trim())) {
            setAddError('Số điện thoại không hợp lệ.');
            return;
        }
        // Lấy tên tỉnh/huyện/xã
        const provinceName = provinces.find(p => p.code === addProvinceCode)?.name || '';
        const districtName = addDistricts.find(d => d.code === addDistrictCode)?.name || '';
        const wardName = addWards.find(w => w.code === addWardCode)?.name || '';
        // Chuẩn bị payload
        const payload = {
            ...newAddress,
            cityProvince: provinceName,
            district: districtName,
            wardCommune: wardName,
            isDefault: false,
            addressType: 'home',
            country: 'Việt Nam'
        };
        const keycloakId = session?.user?.id;
        try {
            const res = await fetch(`http://localhost:8080/api/addresses/user/create/${keycloakId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setAddAddressModalOpen(false);
                setNewAddress({ recipientName: '', phoneNumber: '', streetAddress: '', wardCommune: '', district: '', province: '' });
                fetchUserAddresses(); // Load lại danh sách địa chỉ đã lưu
            } else {
                setAddError(data.message || 'Không thể thêm địa chỉ');
            }
        } catch {
            setAddError('Có lỗi xảy ra');
        }
    };

    if (loadingCart || loadingProvinces) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Đang tải thông tin thanh toán...</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto my-10 p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">THÔNG TIN THANH TOÁN</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Section: Information Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!session?.user && (
                                <>
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => {
                                                setFullName(e.target.value);
                                                setSelectedAddressText('');
                                            }}
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                        <input
                                            type="text"
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => {
                                                setPhone(e.target.value);
                                                setSelectedAddressText('');
                                            }}
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                                        <select
                                            id="province"
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                            onChange={(e) => {
                                                handleProvinceChange(e);
                                                setSelectedAddressText('');
                                            }}
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
                                        {loadingProvinces && <p className="text-sm text-gray-500 mt-1">Đang tải tỉnh/thành phố...</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                                        <select
                                            id="district"
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                            onChange={(e) => {
                                                handleDistrictChange(e);
                                                setSelectedAddressText('');
                                            }}
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
                                        {loadingDistricts && <p className="text-sm text-gray-500 mt-1">Đang tải quận/huyện...</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Xã/Phường</label>
                                        <select
                                            id="ward"
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                            onChange={(e) => {
                                                handleWardChange(e);
                                                setSelectedAddressText('');
                                            }}
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
                                        {loadingWards && <p className="text-sm text-gray-500 mt-1">Đang tải xã/phường...</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>
                                        <input
                                            type="text"
                                            id="addressDetail"
                                            placeholder="Số nhà, tên đường"
                                            value={addressDetail}
                                            onChange={(e) => {
                                                setAddressDetail(e.target.value);
                                                setSelectedAddressText('');
                                            }}
                                            className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="md:col-span-2">
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                <textarea
                                    id="note"
                                    placeholder="Ví dụ: Giao hàng vào buổi tối..."
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                ></textarea>
                            </div>
                            {/* Ẩn ô địa chỉ đã chọn với khách chưa đăng nhập */}
                            {session?.user && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ đã chọn</label>
                                    <input
                                        type="text"
                                        value={selectedAddressText}
                                        onChange={e => setSelectedAddressText(e.target.value)}
                                        className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Chưa chọn địa chỉ"
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4">
                            {session?.user && (
                                <Button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-base py-2 px-6 rounded-md" onClick={handleOpenAddressModal}>
                                    CHỌN ĐỊA CHỈ ĐÃ LƯU
                                </Button>
                            )}
                        </div>
                    </Card>

                    <h2 className="text-xl font-bold mb-3 text-gray-800">Phương thức thanh toán</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                paymentMethod === 'cod' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-3 text-gray-700 font-medium flex items-center">
                                Thanh toán khi nhận hàng
                            </div>
                        </label>
                        <label
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                paymentMethod === 'online' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="online"
                                checked={paymentMethod === 'online'}
                                onChange={() => setPaymentMethod('online')}
                                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-3 text-gray-700 font-medium flex items-center">
                                <img src="/images/vnpay.png" alt="VNPay" className="h-6 w-auto mr-2" />
                                Thanh toán qua VNPay
                            </div>
                        </label>
                    </div>

                    <Button color="primary" size="lg" className="w-full mt-6 py-3 text-lg font-semibold" onClick={handleOrder}>
                        XÁC NHẬN ĐẶT HÀNG
                    </Button>
                </div>

                {/* Right Section: Order Summary */}
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Đơn hàng của bạn</h2>
                    {cartItems.length === 0 ? (
                        <p className="text-gray-500 text-center">Không có sản phẩm nào trong giỏ hàng để thanh toán.</p>
                    ) : (
                        <>
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-start mb-6 border-b pb-4 last:border-b-0 last:pb-0">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            width={80}
                                            height={80}
                                            className="rounded-md object-cover mr-4"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs mr-4">
                                            No Image
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-md font-semibold text-gray-800">{item.productName}</h3>
                                        <div className="flex gap-4 text-sm text-gray-700 mt-1">
                                            <span>Màu sắc: <span className="font-semibold">{item.colorName || '-'}</span></span>
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

                                {cartItems.length > 0 && (
                                    <>
                                        <div className="flex justify-between text-base text-gray-700">
                                            <span>Phí giao hàng:</span>
                                            {loadingShippingFee ? (
                                                <span>Đang tính...</span>
                                            ) : shippingError ? (
                                                <span className="text-red-500">{shippingError}</span>
                                            ) : (
                                    <span>{formatPrice(shippingFee)}</span>
                                            )}
                                </div>
                                <div className="flex justify-between">
                                    <span>Giảm giá:</span>
                                    <span>- {formatPrice(discount)}</span>
                                </div>
                                        <div className="flex justify-between text-lg font-bold text-green-700">
                                    <span>Tổng cộng:</span>
                                            <span>{formatPrice(totalBeforeDiscount + (shippingFee || 0))}</span>
                                </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    <Button variant="ghost" size="sm" onPress={handleGoBack} className="text-gray-500 mt-6 w-full">
                        &larr; Quay lại giỏ hàng
                    </Button>
                </div>
            </div>

            {/* Modal chọn địa chỉ */}
            <Modal isOpen={addressModalOpen} onOpenChange={setAddressModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Chọn địa chỉ giao hàng</ModalHeader>
                    <ModalBody>
                        {userAddresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">Bạn chưa có địa chỉ nào.</div>
                        ) : (
                            <div className="space-y-4">
                                {userAddresses.map((address, idx) => (
                                    <div
                                        key={address.addressId || idx}
                                        className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:border-blue-500 transition-all"
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
                        <Button color="primary" onClick={() => setAddAddressModalOpen(true)}>Thêm địa chỉ</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Modal thêm địa chỉ mới */}
            <Modal isOpen={addAddressModalOpen} onOpenChange={setAddAddressModalOpen} size="lg">
                <ModalContent>
                    <ModalHeader>Thêm địa chỉ mới</ModalHeader>
                    <ModalBody>
                        <div className="space-y-3">
                            <input className="w-full p-2 border rounded" placeholder="Họ tên" value={newAddress.recipientName} onChange={e => setNewAddress({...newAddress, recipientName: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Số điện thoại" value={newAddress.phoneNumber} onChange={e => setNewAddress({...newAddress, phoneNumber: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Địa chỉ (số nhà, đường...)" value={newAddress.streetAddress} onChange={e => setNewAddress({...newAddress, streetAddress: e.target.value})} />
                            {/* Select tỉnh */}
                            <select className="w-full p-2 border rounded" value={addProvinceCode || ''} onChange={handleAddProvinceChange}>
                                <option value="">Chọn Tỉnh/Thành phố</option>
                                {provinces.map(province => (
                                    <option key={province.code} value={province.code}>{province.name}</option>
                                ))}
                            </select>
                            {/* Select huyện */}
                            <select className="w-full p-2 border rounded" value={addDistrictCode || ''} onChange={handleAddDistrictChange} disabled={!addProvinceCode || addLoadingDistricts}>
                                <option value="">Chọn Quận/Huyện</option>
                                {addDistricts.map(district => (
                                    <option key={district.code} value={district.code}>{district.name}</option>
                                ))}
                            </select>
                            {/* Select xã */}
                            <select className="w-full p-2 border rounded" value={addWardCode || ''} onChange={handleAddWardChange} disabled={!addDistrictCode || addLoadingWards}>
                                <option value="">Chọn Xã/Phường</option>
                                {addWards.map(ward => (
                                    <option key={ward.code} value={ward.code}>{ward.name}</option>
                                ))}
                            </select>
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