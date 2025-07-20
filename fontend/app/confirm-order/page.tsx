'use client';

import { Card, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { CldImage } from "next-cloudinary";
import { Package, Wallet } from 'lucide-react';

// --- Interfaces ---
interface CartItem {
    id: number;
    productId: number;
    productName: string;
    name: string;
    price: number;
    salePrice?: number | null;
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

export default function ConfirmOrderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession() as { data: ExtendedSession | null };
    const isWaitingOrder = searchParams?.get('waiting') === 'true';
    
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loadingCart, setLoadingCart] = useState(true);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [note, setNote] = useState('');
    const [shippingFee, setShippingFee] = useState<number>(0);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
    const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingShippingFee, setLoadingShippingFee] = useState(false);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ZALOPAY'>('COD');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        recipientName: '',
        phoneNumber: '',
        streetAddress: '',
        wardCommune: '',
        district: '',
        province: '',
        addressType: 'home', // Thêm trường này, mặc định là 'home'
    });
    const [addAddressError, setAddAddressError] = useState('');
    const [addingAddress, setAddingAddress] = useState(false);
    const [provincesVN, setProvincesVN] = useState<unknown[]>([]);
    const [districtsVN, setDistrictsVN] = useState<unknown[]>([]);
    const [wardsVN, setWardsVN] = useState<unknown[]>([]);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState('');

    const revertedRef = useRef(false);
    const pathname = usePathname();
    const prevPathRef = useRef(pathname);

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
            const data = await res.json();
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

    const formatPrice = useCallback((price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price), []);
    const totalBeforeDiscount = cartItems.reduce(
        (total, item) => total + ((item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity),
        0
    );
    const discount = 0;

    const fetchShippingFee = useCallback(async (provinceName: string, districtName: string, total: number) => {
        setLoadingShippingFee(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/ghtk/fee?province=${encodeURIComponent(provinceName)}&district=${encodeURIComponent(districtName)}&weight=100&value=${total}`
            );
            const data = await res.json();
            if (res.ok && data.data != null) {
                setShippingFee(data.data);
            } else {
                setShippingFee(0);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setShippingFee(0);
        } finally {
            setLoadingShippingFee(false);
        }
    }, []);

    const handleSelectAddress = useCallback((address: Address) => {
        setSelectedAddress(address);
        setFullName(address.recipientName || '');
        setPhone(address.phoneNumber || '');
        setAddressDetail(address.streetAddress || '');

        const province = provinces.find(p => p.name === (address.province || address.cityProvince));
        if (province) {
            setSelectedProvinceCode(province.code);
        } else {
            setSelectedProvinceCode(null);
            setSelectedDistrictCode(null);
            setSelectedWardCode(null);
        }
        setShowAddressModal(false);
    }, [provinces]);

    // useEffect tính phí giao hàng khi selectedAddress hoặc cartItems thay đổi
    useEffect(() => {
        if (session?.user) return;

        // Nếu chưa chọn tỉnh hoặc huyện thì luôn set phí giao hàng về 0
        if (!selectedProvinceCode || !selectedDistrictCode) {
            setShippingFee(0);
            return;
        }

        // Đã chọn tỉnh và huyện, và có sản phẩm trong giỏ
        if (cartItems.length > 0) {
            const provinceName = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
            const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
        if (provinceName && districtName) {
            fetchShippingFee(
                provinceName,
                districtName,
                cartItems.reduce(
                    (total, item) => total + ((item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price) * item.quantity),
                    0
                )
            );
        } else {
            setShippingFee(0);
        }
        } else {
            setShippingFee(0);
        }
    }, [selectedProvinceCode, selectedDistrictCode, cartItems, provinces, districts, fetchShippingFee, session?.user]);

    // Thay đổi hàm chọn tỉnh để reset huyện, xã và phí giao hàng
    const handleProvinceChange = (code: number | null) => {
        setSelectedProvinceCode(code);
        setSelectedDistrictCode(null);
        setSelectedWardCode(null);
        setShippingFee(0);
    };
    // Fetch districts khi chọn tỉnh
    const handleDistrictChange = async (districtCode: string) => {
        setNewAddress({ ...newAddress, district: districtCode, wardCommune: '' });
        setWardsVN([]);
        // setLoadingWards(true); // Removed
        try {
            const res = await fetch(`http://localhost:8080/api/address/districts/${districtCode}`);
            const data = await res.json();
            setDistrictsVN(data);
        } catch {}
        // setLoadingDistricts(false); // Removed
    };
    // Fetch wards khi chọn huyện
    const handleWardChange = (wardCode: string) => {
        setNewAddress({ ...newAddress, wardCommune: wardCode });
    };
    // Validate số điện thoại VN
    const isValidPhone = (phone: string) => /^0\d{9}$/.test(phone);

    const handleSaveNewAddress = async () => {
        setAddAddressError('');
        if (!newAddress.recipientName || !newAddress.phoneNumber || !newAddress.streetAddress || !newAddress.province || !newAddress.district || !newAddress.wardCommune) {
            setAddAddressError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }
        if (!isValidPhone(newAddress.phoneNumber)) {
            setAddAddressError('Số điện thoại không hợp lệ.');
            return;
        }
        // Lấy tên tỉnh/huyện/xã
        const provinceCodeNum = typeof newAddress.province === 'number' ? newAddress.province : parseInt(newAddress.province, 10);
        const provinceName = provinces.find(p => p.code === provinceCodeNum)?.name || '';
        const districtName = (districtsVN.find(d => (d as { code: string }).code === newAddress.district) as { name?: string } | undefined)?.name || '';
        const wardName = (wardsVN.find(w => (w as { code: string }).code === newAddress.wardCommune) as { name?: string } | undefined)?.name || '';
        // Validate cityProvince
        if (!provinceName) {
            setAddAddressError('Vui lòng chọn tỉnh/thành phố.');
            return;
        }
        // Chuẩn bị payload
        const payload = {
            ...newAddress,
            cityProvince: provinceName, // Đảm bảo luôn có cityProvince
            district: districtName,
            wardCommune: wardName,
            isDefault: false,
            addressType: newAddress.addressType,
            country: 'Việt Nam'
        };
        // Kiểm tra keycloakId
        const keycloakId = session?.user?.id;
        if (!keycloakId || !/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.test(keycloakId)) {
            setAddAddressError('Không xác định được người dùng hoặc ID không hợp lệ.');
            return;
        }
        setAddingAddress(true);
        try {
            console.log('Gửi API thêm địa chỉ:', { keycloakId, payload });
            const res = await fetch(`http://localhost:8080/api/addresses/user/create/${keycloakId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resText = await res.text();
            let data = {};
            try { data = JSON.parse(resText); } catch {}
            console.log('Kết quả trả về:', res.status, data);
            if (!res.ok) {
                const msg = (typeof data === 'object' && data && 'message' in data)
                    ? (data as { message?: string }).message
                    : undefined;
                setAddAddressError(msg || 'Lỗi khi thêm địa chỉ');
                setAddingAddress(false);
                return;
            }
            setShowAddAddressForm(false);
            setNewAddress({ recipientName: '', phoneNumber: '', streetAddress: '', wardCommune: '', district: '', province: '', addressType: 'home' });
            setProvincesVN([]); setDistrictsVN([]); setWardsVN([]);
            await fetchUserAddresses();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            setAddAddressError('Lỗi khi thêm địa chỉ');
        } finally {
            setAddingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        setOrderError('');
        const isGuest = !session?.user;
        let appUser, shippingAddress;
        if (isGuest) {
            // Validate các trường nhập tay
            if (!fullName || !phone || !addressDetail || !selectedProvinceCode || !selectedDistrictCode || !selectedWardCode) {
                setOrderError('Vui lòng nhập đầy đủ thông tin giao hàng.');
                setPlacingOrder(false);
                return;
            }
            // Lấy tên tỉnh/huyện/xã từ danh sách
            const province = provinces.find(p => p.code === selectedProvinceCode)?.name || '';
            const district = districts.find(d => d.code === selectedDistrictCode)?.name || '';
            const ward = wards.find(w => w.code === selectedWardCode)?.name || '';
            // Tạo appUser và shippingAddress cho khách
            let guestId = '';
            if (typeof window !== 'undefined') {
                guestId = localStorage.getItem('guestId') || '';
                if (!guestId) {
                    guestId = crypto.randomUUID();
                    localStorage.setItem('guestId', guestId);
                }
            }
            appUser = {
                keycloakId: guestId,
                username: fullName,
                phoneNumber: phone,
            };
            shippingAddress = {
                recipientName: fullName,
                phoneNumber: phone,
                streetAddress: addressDetail,
                wardCommune: ward,
                district: district,
                cityProvince: province,
                country: 'Việt Nam',
                isDefault: false,
                addressType: 'home',
            };
        } else {
            // Đã đăng nhập, dùng selectedAddress
        if (!selectedAddress) {
            setOrderError('Vui lòng chọn địa chỉ giao hàng.');
                setPlacingOrder(false);
            return;
            }
            const user = session?.user as { id?: string; name?: string; email?: string };
            appUser = {
                keycloakId: user?.id || user?.email || '',
                username: user?.name || '',
                phoneNumber: selectedAddress?.phoneNumber || '',
            };
            shippingAddress = selectedAddress;
        }
        if (cartItems.length === 0) {
            setOrderError('Giỏ hàng trống.');
            setPlacingOrder(false);
            return;
        }
        setPlacingOrder(true);
        try {
            // Chuẩn bị body
            const body = {
                appUser,
                shippingAddress,
                shippingMethodId: 1, // hardcode shipping method id, có thể lấy từ state nếu có
                shippingFee: shippingFee,
                note: note,
                paymentMethod: paymentMethod,
                orderStatus: 'Pending',
                products: cartItems.map(item => ({ id: item.productId, quantity: item.quantity }))
            };
            console.log('Order body gửi lên:', body);
            const res = await fetch('http://localhost:8080/api/orders/online', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.accessToken ? { 'Authorization': `Bearer ${session?.accessToken}` } : {})
                },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const data = await res.json();
                // Reset local cart khi đặt hàng thành công
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('cart');
                    window.dispatchEvent(new Event('cart-updated'));
                }
                if (paymentMethod === 'COD') {
                    router.push('/confirm-order/success');
                } else if (paymentMethod === 'ZALOPAY') {
                    // Lấy mã đơn hàng từ message
                    const message: string = data.message || '';
                    const match = message.match(/Đơn hàng (\w+) đang chờ xét duyệt/);
                    const orderCode = match ? match[1] : '';
                    if (!orderCode) {
                        setOrderError('Không lấy được mã đơn hàng từ backend.');
                        setPlacingOrder(false);
                        return;
                    }
                    // Gọi API ZaloPay
                    const payRes = await fetch(`http://localhost:8080/api/payment/create?orderCode=${orderCode}`, {
                        method: 'POST'
                    });
                    if (payRes.ok) {
                        const payData = await payRes.json();
                        const orderUrl = payData.order_url;
                        router.push(`/confirm-order/pending?orderCode=${orderCode}&orderUrl=${encodeURIComponent(orderUrl)}`);
                    } else {
                        setOrderError('Không tạo được giao dịch ZaloPay.');
                    }
                }
            } else {
                const data = await res.json().catch(() => ({}));
                setOrderError(data.message || 'Đặt hàng thất bại.');
            }
        } catch (err) {
            setOrderError('Có lỗi xảy ra khi đặt hàng.');
        } finally {
            setPlacingOrder(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingCart(true);
            await fetchProvinces();
            
            if (session?.user) {
                // Nếu đã đăng nhập, lấy cart từ API
                try {
                    const user = session.user as { id: string; sub: string; email: string };
                    const userId = user.id || user.sub || user.email;
                    const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.items && Array.isArray(data.items)) {
                            const items: CartItem[] = data.items.map((item: { variantId: number; productName: string; colorName: string; sizeName: string; price: number; salePrice: number | null; quantity: number; imageUrl: string; sku: string; stockLevel: number }) => ({
                                id: item.variantId,
                                productId: item.variantId,
                                productName: item.productName,
                                name: `${item.productName} - ${item.colorName} / ${item.sizeName}`,
                                price: Number(item.price),
                                salePrice: item.salePrice != null ? Number(item.salePrice) : null,
                                quantity: item.quantity,
                                imageUrl: item.imageUrl,
                                sku: item.sku,
                                stockLevel: item.stockLevel,
                                colorName: item.colorName,
                                sizeName: item.sizeName,
                            }));
                            setCartItems(items);
                        }
                    }

                    // Lấy địa chỉ của user
                    await fetchUserAddresses();
                } catch (error) {
                    console.error('Error loading cart data:', error);
                    setCartItems([]);
                }
            } else {
                // Chưa đăng nhập, lấy từ localStorage
                try {
                    const storedCart = localStorage.getItem('cart');
                    if (storedCart) {
                        const items = JSON.parse(storedCart) as CartItem[];
                        setCartItems(items);
                    }
                } catch (error) {
                    console.error('Error loading cart from localStorage:', error);
                    setCartItems([]);
                }
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
        // setLoadingDistricts(true); // Removed
        setDistricts([]);
        setSelectedDistrictCode(null);
        fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`)
            .then(res => res.json())
            .then(data => setDistricts(data.districts || []))
            .catch(err => console.error(err));
    }, [selectedProvinceCode]);

    useEffect(() => {
        if (!selectedDistrictCode) {
            setWards([]);
            setSelectedWardCode(null);
            return;
        }
        // setLoadingWards(true); // Removed
        setWards([]);
        setSelectedWardCode(null);
        fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`)
            .then(res => res.json())
            .then(data => setWards(data.wards || []))
            .catch(err => console.error(err));
    }, [selectedDistrictCode]);

    useEffect(() => {
        // Khi reload hoặc đóng tab
        const onBeforeUnload = () => {
        handleRevertStock(); 
        };
        window.addEventListener('beforeunload', onBeforeUnload); 

        // Khi tab bị ẩn (có thể là chuyển trang, đóng tab, v.v.)
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
            handleRevertStock();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Khi pathname thay đổi (chuyển route)
        if (prevPathRef.current !== pathname) {
            handleRevertStock();
            prevPathRef.current = pathname;
        }
        
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [pathname, handleRevertStock]);

    const handleGoBack = () => { 
            handleRevertStock();
        router.push('/shopping_cart'); 
        };

    // Wrapper cho router.push để đảm bảo revert stock trước khi chuyển trang
    const navigateWithRevert = (path: string) => {
        handleRevertStock();
        router.push(path);
    };

    // Khi nhấn nút chọn địa chỉ đã lưu
    const handleOpenAddressModal = async () => {
        if (userAddresses.length === 0) {
            await fetchUserAddresses();
        }
        setShowAddressModal(true);
    };
    const handleAddAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
    };
    // Fetch provinces khi mở form thêm địa chỉ
    const handleOpenAddAddressForm = async () => {
        setShowAddAddressForm(true);
        setAddAddressError('');
        setLoadingProvinces(true);
        try {
            const res = await fetch('http://localhost:8080/api/address/provinces');
            const data = await res.json();
            setProvincesVN(data);
        } catch {}
        setLoadingProvinces(false);
    };

    if (loadingCart || loadingProvinces) {
        return <div className="flex justify-center items-center min-h-screen"><p>Đang tải...</p></div>;
    }

    return (
        <div className="w-full mx-auto my-10 p-4 max-w-6xl">
            <div className="mb-6">
                <Button 
                    variant="ghost" 
                    onClick={handleGoBack}
                    className="mb-4"
                >
                    ← Quay lại
                </Button>
                <h1 className="text-3xl font-bold mb-6 text-gray-800">
                    XÁC NHẬN ĐƠN HÀNG
                    {isWaitingOrder && (
                        <span className="ml-4 text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                            Đơn hàng chờ
                        </span>
                    )}
                </h1>
            </div>
            
            {isWaitingOrder && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Thông báo đơn hàng chờ</h3>
                    <p className="text-yellow-700">
                        Một số sản phẩm trong đơn hàng của bạn hiện không đủ hàng. 
                        Đơn hàng sẽ được xử lý khi có đủ hàng trong kho.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Thông tin giao hàng</h2>
                        </div>
                        <div className="space-y-4">
                            {(!session?.user) ? (
                                // Chưa đăng nhập: giữ giao diện nhập địa chỉ như hiện tại
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                            <input 
                                                type="text" 
                                                id="fullName" 
                                                value={fullName} 
                                                onChange={e => setFullName(e.target.value)} 
                                                className="p-3 border border-gray-300 rounded-md w-full" 
                                                placeholder="Nhập họ và tên"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                            <input 
                                                type="text" 
                                                id="phone" 
                                                value={phone} 
                                                onChange={e => setPhone(e.target.value)} 
                                                className="p-3 border border-gray-300 rounded-md w-full" 
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/thành phố</label>
                                            <select 
                                                id="province" 
                                                value={selectedProvinceCode || ''} 
                                                onChange={e => handleProvinceChange(parseInt(e.target.value) || null)}
                                                className="p-3 border border-gray-300 rounded-md w-full"
                                            >
                                                <option value="">Chọn tỉnh/thành phố</option>
                                                {provinces.map(province => (
                                                    <option key={province.code} value={province.code}>
                                                        {province.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/huyện</label>
                                            <select 
                                                id="district" 
                                                value={selectedDistrictCode || ''} 
                                                onChange={e => setSelectedDistrictCode(parseInt(e.target.value) || null)}
                                                className="p-3 border border-gray-300 rounded-md w-full"
                                                disabled={!selectedProvinceCode}
                                            >
                                                <option value="">Chọn quận/huyện</option>
                                                {districts.map(district => (
                                                    <option key={district.code} value={district.code}>
                                                        {district.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Xã/thị trấn</label>
                                            <select 
                                                id="ward" 
                                                value={selectedWardCode || ''} 
                                                onChange={e => setSelectedWardCode(parseInt(e.target.value) || null)}
                                                className="p-3 border border-gray-300 rounded-md w-full"
                                                disabled={!selectedDistrictCode}
                                            >
                                                <option value="">Chọn xã/thị trấn</option>
                                                {wards.map(ward => (
                                                    <option key={ward.code} value={ward.code}>
                                                        {ward.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>
                                        <input 
                                            type="text" 
                                            id="addressDetail" 
                                            value={addressDetail} 
                                            onChange={e => setAddressDetail(e.target.value)}
                                            className="p-3 border border-gray-300 rounded-md w-full" 
                                            placeholder="Nhập địa chỉ cụ thể"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                        <textarea 
                                            id="note" 
                                            rows={3} 
                                            value={note} 
                                            onChange={e => setNote(e.target.value)}
                                            className="p-3 border border-gray-300 rounded-md w-full" 
                                            placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                                        ></textarea>
                                    </div>
                                </>
                            ) : (
                                // Đã đăng nhập: chỉ hiển thị 1 input địa chỉ đã chọn (readonly), 1 input ghi chú, 1 nút chọn địa chỉ đã lưu
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                                        <input
                                            type="text"
                                            value={selectedAddress ? `${selectedAddress.recipientName || ''} - ${selectedAddress.phoneNumber || ''} - ${selectedAddress.streetAddress || ''}${selectedAddress.wardCommune ? ', ' + selectedAddress.wardCommune : ''}${selectedAddress.district ? ', ' + selectedAddress.district : ''}${selectedAddress.province ? ', ' + selectedAddress.province : (selectedAddress.cityProvince ? ', ' + selectedAddress.cityProvince : '')}` : ''}
                                            readOnly
                                            disabled
                                            className="p-3 border border-gray-300 rounded-md w-full bg-gray-100 text-gray-700 cursor-not-allowed"
                                            placeholder="Chưa chọn địa chỉ giao hàng"
                                        />
                                        <Button
                                            className="mt-2"
                                            variant="bordered"
                                            color="primary"
                                            onClick={handleOpenAddressModal}
                                        >
                                            Chọn địa chỉ đã lưu
                                        </Button>
                                    </div>
                                    <div>
                                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                        <textarea 
                                            id="note" 
                                            rows={3} 
                                            value={note} 
                                            onChange={e => setNote(e.target.value)}
                                            className="p-3 border border-gray-300 rounded-md w-full" 
                                            placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                                        ></textarea>
                                    </div>
                                </>
                            )}
                            {/* Phương thức thanh toán giữ nguyên */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</label>
                                <div className="flex gap-4">
                                    <Button
                                        className={`flex-1 py-4 text-base font-semibold border-2 flex items-center justify-center gap-2 ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50 text-green-800 shadow' : 'border-gray-300 bg-white text-gray-700'}`}
                                        variant={paymentMethod === 'COD' ? 'solid' : 'ghost'}
                                        color={paymentMethod === 'COD' ? 'success' : 'default'}
                                        onClick={() => setPaymentMethod('COD')}
                                    >
                                        <Package className="w-6 h-6 mr-2" />
                                        Thanh toán khi nhận hàng (COD)
                                    </Button>
                                    <Button
                                        className={`flex-1 py-4 text-base font-semibold border-2 flex items-center justify-center gap-2 ${paymentMethod === 'ZALOPAY' ? 'border-blue-600 bg-blue-50 text-blue-800 shadow' : 'border-gray-300 bg-white text-gray-700'}`}
                                        variant={paymentMethod === 'ZALOPAY' ? 'solid' : 'ghost'}
                                        color={paymentMethod === 'ZALOPAY' ? 'primary' : 'default'}
                                        onClick={() => setPaymentMethod('ZALOPAY')}
                                    >
                                        <Wallet className="w-6 h-6 mr-2" />
                                        Thanh toán qua ZaloPay
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Đơn hàng của bạn</h2>
                    {cartItems.length === 0 ? (
                        <p className="text-gray-500 text-center">Không có sản phẩm nào.</p>
                    ) : (
                        <>
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-start mb-6 border-b pb-4 last:border-b-0 last:pb-0">
                                    <CldImage 
                                        width={80} 
                                        height={80} 
                                        src={item.imageUrl} 
                                        alt={item.name} 
                                        sizes="80px" 
                                        className="w-20 h-20 object-cover mr-4 rounded-md" 
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-md font-semibold text-gray-800">{item.productName}</h3>
                                        <div className="flex gap-4 text-sm text-gray-700 mt-1">
                                            <span>Màu: <span className="font-semibold">{item.colorName || '-'}</span></span>
                                            <span>Size: <span className="font-semibold">{item.sizeName || '-'}</span></span>
                                        </div>
                                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                                        <p className="text-md font-bold text-red-600 mt-1">
                                            {formatPrice(item.salePrice != null && item.salePrice < item.price ? item.salePrice * item.quantity : item.price * item.quantity)}
                                        </p>
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
                                            ) : (
                                                <span>{formatPrice(shippingFee)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Giảm giá:</span>
                                            <span>- {formatPrice(discount)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-red-700">
                                            <span>Tổng cộng:</span>
                                            <span>{formatPrice(totalBeforeDiscount + (shippingFee || 0))}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-6">
                                <Button 
                                    color="success" 
                                    className="w-full font-semibold py-3"
                                    onClick={handlePlaceOrder}
                                    isLoading={placingOrder}
                                >
                                    Xác nhận đặt hàng
                                </Button>
                                {orderError && <div className="text-red-600 text-sm mt-2">{orderError}</div>}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Popup chọn địa chỉ đã lưu */}
            <Modal isOpen={showAddressModal} onClose={() => { setShowAddressModal(false); setShowAddAddressForm(false); setAddAddressError(''); }}>
                <ModalContent>
                    <ModalHeader>Chọn địa chỉ giao hàng</ModalHeader>
                    <ModalBody>
                        {!showAddAddressForm && (
                            <Button color="primary" className="mb-4 w-full" onClick={handleOpenAddAddressForm}>
                                Thêm địa chỉ mới
                            </Button>
                        )}
                        {showAddAddressForm ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    name="recipientName"
                                    value={newAddress.recipientName}
                                    onChange={handleAddAddressChange}
                                    className="p-2 border border-gray-300 rounded w-full"
                                    placeholder="Họ và tên"
                                />
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={newAddress.phoneNumber}
                                    onChange={handleAddAddressChange}
                                    className="p-2 border border-gray-300 rounded w-full"
                                    placeholder="Số điện thoại"
                                />
                                <input
                                    type="text"
                                    name="streetAddress"
                                    value={newAddress.streetAddress}
                                    onChange={handleAddAddressChange}
                                    className="p-2 border border-gray-300 rounded w-full"
                                    placeholder="Địa chỉ cụ thể"
                                />
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Tỉnh/Thành phố</label>
                                    <select
                                        className="p-2 border border-gray-300 rounded w-full"
                                        value={newAddress.province}
                                        onChange={e => handleProvinceChange(parseInt(e.target.value) || null)}
                                    >
                                        <option value="">Chọn tỉnh/thành phố</option>
                                        {provincesVN.map((p) => {
                                            const province = p as { code: string; name: string };
                                            return (
                                                <option key={province.code || ''} value={province.code || ''}>{province.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Quận/Huyện</label>
                                    <select
                                        className="p-2 border border-gray-300 rounded w-full"
                                        value={newAddress.district}
                                        onChange={e => handleDistrictChange(e.target.value)}
                                        disabled={!newAddress.province}
                                    >
                                        <option value="">Chọn quận/huyện</option>
                                        {districtsVN.map((d) => {
                                            const district = d as { code: string; name: string };
                                            return (
                                                <option key={district.code || ''} value={district.code || ''}>{district.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Xã/Phường</label>
                                    <select
                                        className="p-2 border border-gray-300 rounded w-full"
                                        value={newAddress.wardCommune}
                                        onChange={e => handleWardChange(e.target.value)}
                                        disabled={!newAddress.district}
                                    >
                                        <option value="">Chọn xã/thị trấn</option>
                                        {wardsVN.map((w) => {
                                            const ward = w as { code: string; name: string };
                                            return (
                                                <option key={ward.code || ''} value={ward.code || ''}>{ward.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Loại địa chỉ</label>
                                    <select
                                        className="p-2 border border-gray-300 rounded w-full"
                                        value={newAddress.addressType}
                                        onChange={e => setNewAddress({...newAddress, addressType: e.target.value})}
                                    >
                                        <option value="home">Nhà riêng</option>
                                        <option value="office">Văn phòng</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                                {addAddressError && <div className="text-red-600 text-sm">{addAddressError}</div>}
                                <div className="flex gap-2 mt-2">
                                    <Button color="primary" isLoading={addingAddress} onClick={handleSaveNewAddress}>Lưu</Button>
                                    <Button variant="ghost" onClick={() => { setShowAddAddressForm(false); setAddAddressError(''); }}>Hủy</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {userAddresses.length === 0 ? (
                                    <div className="text-gray-500">Không có địa chỉ nào.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {userAddresses.map((addr, idx) => (
                                            <div
                                                key={addr.addressId || idx}
                                                className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer hover:border-blue-500 transition-all"
                                                onClick={() => handleSelectAddress(addr)}
                                            >
                                                <div>
                                                    <div className="font-semibold text-gray-900">{addr.recipientName}</div>
                                                    <div className="text-sm text-gray-500">{addr.phoneNumber}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {addr.streetAddress}
                                                        {addr.wardCommune ? `, ${addr.wardCommune}` : ''}
                                                        {addr.district ? `, ${addr.district}` : ''}
                                                        {addr.province ? `, ${addr.province}` : (addr.cityProvince ? `, ${addr.cityProvince}` : '')}
                                                    </div>
                                                </div>
                                                <Button size="sm" className="mt-2 md:mt-0" onClick={e => { e.stopPropagation(); handleSelectAddress(addr); }}>
                                                    Chọn
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => { setShowAddressModal(false); setShowAddAddressForm(false); setAddAddressError(''); }}>Đóng</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
