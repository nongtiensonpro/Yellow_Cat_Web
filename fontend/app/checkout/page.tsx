

'use client';
import { Card, Button } from "@heroui/react"; // Simplified imports
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

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
}

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

    // Fetch cart items from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        }
        setLoadingCart(false);
    }, []);


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
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = parseInt(e.target.value);
        setSelectedDistrictCode(isNaN(code) ? null : code);
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
    const shippingFee = 0; // Set shipping fee to 0
    const discount = 0; // Set discount to 0
    const finalTotal = totalBeforeDiscount + shippingFee - discount; // The final total is now just the subtotal

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
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                                <select
                                    id="province"
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
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
                                {loadingProvinces && <p className="text-sm text-gray-500 mt-1">Đang tải tỉnh/thành phố...</p>}
                            </div>
                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                                <select
                                    id="district"
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
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
                                {loadingDistricts && <p className="text-sm text-gray-500 mt-1">Đang tải quận/huyện...</p>}
                            </div>
                            <div>
                                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">Xã/Phường</label>
                                <select
                                    id="ward"
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
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
                                {loadingWards && <p className="text-sm text-gray-500 mt-1">Đang tải xã/phường...</p>}
                            </div>
                            <div>
                                <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>
                                <input
                                    type="text"
                                    id="addressDetail"
                                    placeholder="Số nhà, tên đường"
                                    value={addressDetail}
                                    onChange={(e) => setAddressDetail(e.target.value)}
                                    className="p-3 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
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
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 text-base py-2 px-6 rounded-md">
                                CHỌN ĐỊA CHỈ ĐÃ LƯU
                            </Button>
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

                    <Button color="primary" size="lg" className="w-full mt-6 py-3 text-lg font-semibold">
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
                                        <h3 className="text-md font-semibold text-gray-800">{item.name}</h3>
                                        {item.productName !== item.name && (
                                            <p className="text-sm text-gray-600">{item.productName}</p>
                                        )}
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

                                <div className="flex justify-between">
                                    <span>Phí vận chuyển:</span>
                                    <span>{formatPrice(shippingFee)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Giảm giá:</span>
                                    <span>- {formatPrice(discount)}</span>
                                </div>

                                <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t border-gray-200 mt-2">
                                    <span>Tổng cộng:</span>
                                    <span className="text-red-600">{formatPrice(finalTotal)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <Button variant="ghost" size="sm" onPress={() => router.back()} className="text-gray-500 mt-6 w-full">
                        &larr; Quay lại giỏ hàng
                    </Button>
                </div>
            </div>
        </div>
    );
}