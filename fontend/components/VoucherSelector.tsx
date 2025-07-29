'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Card, Chip, Divider } from "@heroui/react";
import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";
import { Tag, CheckCircle, XCircle, Info, Calendar, Users, Package, Percent } from 'lucide-react';

interface VoucherSummaryDTO {
    id: number;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    usedStatus: string;
    eligible: boolean;
}

interface VoucherDetailDTO {
    id: number;
    code: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    discountType: string;
    discountValue: number;
    maxDiscountAmount: number;
    minOrderValue: number;
    maxUsage: number;
    usageCount: number;
    scopeType: string;
    scopeDetails: string;
    status: string;
    isActive: boolean;
}

interface VoucherSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVoucher: (voucher: VoucherSummaryDTO | null) => void;
    selectedVoucher: VoucherSummaryDTO | null;
    cartItems: Array<{ productId: number; quantity: number; price: number; salePrice?: number | null }>;
    totalAmount: number;
    hasSelectedAddress: boolean;
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

export default function VoucherSelector({
    isOpen,
    onClose,
    onSelectVoucher,
    selectedVoucher,
    cartItems,
    totalAmount,
    hasSelectedAddress
}: VoucherSelectorProps) {
    const { data: session } = useSession() as { data: ExtendedSession | null };
    const [vouchers, setVouchers] = useState<VoucherSummaryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<VoucherDetailDTO | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);


    const formatPrice = (price: number) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const formatDateTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getVoucherStatusColor = (status: string) => {
        switch (status) {
            case 'Đang diễn ra':
            case 'Áp dụng được':
                return 'success';
            case 'Chưa bắt đầu':
                return 'warning';
            case 'Đã kết thúc':
            case 'Hết lượt sử dụng':
                return 'danger';
            default:
                return 'default';
        }
    };

    const getDiscountTypeName = (type: string) => {
        switch (type) {
            case 'PERCENTAGE':
            case 'PERCENT':
                return 'Giảm theo phần trăm';
            case 'FIXED_AMOUNT':
                return 'Giảm số tiền cố định';
            case 'FREE_SHIPPING':
                return 'Miễn phí vận chuyển';
            default:
                return type;
        }
    };

    const getScopeTypeName = (type: string) => {
        switch (type) {
            case 'ALL_PRODUCTS':
                return 'Tất cả sản phẩm';
            case 'SPECIFIC_PRODUCTS':
                return 'Sản phẩm cụ thể';
            case 'SPECIFIC_CATEGORIES':
                return 'Danh mục cụ thể';
            case 'SPECIFIC_USERS':
                return 'Người dùng cụ thể';
            default:
                return type;
        }
    };

    const fetchVoucherDetail = async (voucherId: number) => {
        if (!session?.accessToken) return;

        setDetailLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/vouchers/detail_admin/${voucherId}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Voucher detail response:', data);
                console.log('Discount type:', data.discountType);
                console.log('Discount value:', data.discountValue);
                console.log('Max discount amount:', data.maxDiscountAmount);
                console.log('Min order value:', data.minOrderValue);
                setSelectedVoucherDetail(data);
            } else {
                console.error('Failed to fetch voucher detail');
            }
        } catch (error) {
            console.error('Error fetching voucher detail:', error);
        } finally {
            setDetailLoading(false);
        }
    };



    const handleViewDetail = (voucher: VoucherSummaryDTO) => {
        setSelectedVoucherDetail(null);
        setShowDetailModal(true);
        fetchVoucherDetail(voucher.id);
    };

    const fetchAvailableVouchers = async () => {
        if (!session?.accessToken) {
            setError('Vui lòng đăng nhập để sử dụng voucher');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Lấy userId từ token
            let userId: string | null = null;
            try {
                const tokenData: JWTTokenData = jwtDecode(session.accessToken);
                userId = tokenData.sub;
                console.log('Token sub:', userId);
            } catch {
                setError('Không thể xác định người dùng');
                return;
            }

            // Kiểm tra xem userId có phải là UUID không
            if (!userId || userId.length !== 36) {
                setError('ID người dùng không hợp lệ');
                return;
            }

            // Lấy appUserId từ API
            let appUserId: number | null = null;
            try {
                const userResponse = await fetch(`http://localhost:8080/api/users/keycloak-user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`
                    }
                });
                
                if (userResponse.ok) {
                    const response = await userResponse.json();
                    console.log('AppUserId API response:', response);
                    
                    // Kiểm tra cấu trúc response
                    const appUserData = response.data || response;
                    console.log('AppUser data:', appUserData);
                    
                    if (appUserData && appUserData.appUserId) {
                        appUserId = appUserData.appUserId;
                        console.log('Found appUserId:', appUserId);
                    }
                } else {
                    console.log('AppUserId API failed with status:', userResponse.status);
                }
            } catch (error) {
                console.error('Error fetching appUserId:', error);
            }

            if (!appUserId) {
                // Fallback: thử lấy từ session user id
                console.log('Trying fallback method...');
                if (session?.user?.id) {
                    try {
                        appUserId = parseInt(session.user.id);
                        console.log('Using session user id as fallback:', appUserId);
                    } catch {
                        console.log('Session user id is not a number');
                    }
                }
                
                if (!appUserId || isNaN(appUserId)) {
                    setError('Không thể xác định ID người dùng trong hệ thống');
                    return;
                }
            }

            // Chuẩn bị productIds từ cartItems
            const productIds = cartItems.map(item => item.productId);

            const requestBody = {
                userId: appUserId,
                productIds: productIds,
                orderTotal: totalAmount
            };

            console.log('Fetching vouchers with request:', requestBody);

            const response = await fetch('http://localhost:8080/api/admin/vouchers/user_get_list_vouchers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('=== Vouchers API Response ===');
            console.log('All vouchers:', data);
            console.log('Eligible vouchers:', data.filter((voucher: VoucherSummaryDTO) => voucher.eligible));
            console.log('=== End Vouchers API Response ===');

            // Lọc chỉ lấy các voucher khả dụng
            const availableVouchers = data.filter((voucher: VoucherSummaryDTO) => 
                voucher.eligible
            );

            setVouchers(availableVouchers);
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            setError('Không thể tải danh sách voucher');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            console.log('=== VoucherSelector useEffect - modal opened ===');
            fetchAvailableVouchers();
            console.log('=== End VoucherSelector useEffect - modal opened ===');
        }
    }, [isOpen, cartItems, session]); // Bỏ totalAmount khỏi dependencies

    const handleSelectVoucher = (voucher: VoucherSummaryDTO) => {
        console.log('=== VoucherSelector handleSelectVoucher ===');
        console.log('Voucher being selected:', {
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            status: voucher.status,
            usedStatus: voucher.usedStatus,
            eligible: voucher.eligible
        });
        console.log('Current selected voucher:', selectedVoucher);
        console.log('Total amount:', totalAmount);
        
        if (selectedVoucher?.id === voucher.id) {
            // Nếu đã chọn voucher này rồi thì bỏ chọn
            console.log('Deselecting voucher');
            onSelectVoucher(null);
        } else {
            // Chọn voucher mới
            console.log('Selecting new voucher');
            onSelectVoucher(voucher);
            // Không cần gọi calculateDiscount ở đây, confirm-order page sẽ xử lý
        }
        console.log('=== End VoucherSelector handleSelectVoucher ===');
    };

    const handleApplyVoucher = () => {
        console.log('Applying voucher:', selectedVoucher);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            <span>Chọn Voucher</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600">{error}</p>
                            </div>
                        ) : !hasSelectedAddress ? (
                            <div className="text-center py-8">
                                <XCircle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                                <p className="text-orange-600 font-medium">Vui lòng chọn địa chỉ giao hàng trước</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Bạn cần chọn địa chỉ giao hàng để có thể sử dụng voucher
                                </p>
                            </div>
                        ) : vouchers.length === 0 ? (
                            <div className="text-center py-8">
                                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Không có voucher khả dụng</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Tổng đơn hàng hiện tại: {formatPrice(totalAmount)}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-sm text-gray-600 mb-4">
                                    Tổng đơn hàng: <span className="font-semibold">{formatPrice(totalAmount)}</span>
                                </div>
                                

                                {vouchers.map((voucher) => (
                                    <Card 
                                        key={voucher.id} 
                                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                                            selectedVoucher?.id === voucher.id 
                                                ? 'border-2 border-blue-500 bg-blue-50' 
                                                : 'border border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{voucher.name}</h3>
                                                    <Chip 
                                                        size="sm" 
                                                        color={getVoucherStatusColor(voucher.status)}
                                                        variant="flat"
                                                    >
                                                        {voucher.status}
                                                    </Chip>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Mã: <span className="font-mono font-semibold">{voucher.code}</span>
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Hiệu lực: {formatDateTime(voucher.startDate)} - {formatDateTime(voucher.endDate)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetail(voucher);
                                                    }}
                                                    className="min-w-0 p-2"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                                <div 
                                                    className={`flex items-center gap-2 ${hasSelectedAddress ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                                    onClick={() => hasSelectedAddress && handleSelectVoucher(voucher)}
                                                >
                                                    {selectedVoucher?.id === voucher.id ? (
                                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                                    ) : (
                                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button 
                            color="primary" 
                            onClick={handleApplyVoucher}
                            isDisabled={!selectedVoucher || !hasSelectedAddress}
                        >
                            Áp dụng voucher
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Voucher Detail Modal */}
            <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} size="3xl">
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            <span>Chi tiết Voucher</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        {detailLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : selectedVoucherDetail ? (
                            <div className="space-y-4">
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">{selectedVoucherDetail.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{selectedVoucherDetail.description}</p>
                                </div>

                                <Divider />

                                                                 <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Mã voucher:</span>
                                        <span className="text-sm font-mono">{selectedVoucherDetail.code}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Loại giảm:</span>
                                        <span className="text-sm">{getDiscountTypeName(selectedVoucherDetail.discountType)}</span>
                                    </div>

                                                                         <div className="flex items-center gap-2">
                                         <Percent className="w-4 h-4 text-gray-500" />
                                         <span className="text-sm font-medium">Giá trị giảm:</span>
                                         <span className="text-sm font-semibold text-blue-600">
                                             {selectedVoucherDetail.discountType === 'PERCENTAGE' || selectedVoucherDetail.discountType === 'PERCENT'
                                                 ? `${selectedVoucherDetail.discountValue}%`
                                                 : selectedVoucherDetail.discountType === 'FREE_SHIPPING'
                                                 ? '100%'
                                                 : formatPrice(selectedVoucherDetail.discountValue)
                                             }
                                         </span>
                                     </div>

                                     {selectedVoucherDetail.maxDiscountAmount && (
                                         <div className="flex items-center gap-2">
                                             <span className="text-sm font-medium">Giảm tối đa:</span>
                                             <span className="text-sm">{formatPrice(selectedVoucherDetail.maxDiscountAmount)}</span>
                                         </div>
                                     )}

                                     <div className="flex items-center gap-2">
                                         <span className="text-sm font-medium">Đơn hàng tối thiểu:</span>
                                         <span className="text-sm">
                                             {selectedVoucherDetail.minOrderValue && selectedVoucherDetail.minOrderValue > 0 
                                                 ? formatPrice(selectedVoucherDetail.minOrderValue)
                                                 : 'Không có'
                                             }
                                         </span>
                                     </div>

                                     <div className="flex items-center gap-2">
                                         <Users className="w-4 h-4 text-gray-500" />
                                         <span className="text-sm font-medium">Phạm vi áp dụng:</span>
                                         <span className="text-sm">{getScopeTypeName(selectedVoucherDetail.scopeType)}</span>
                                     </div>

                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Thời gian:</span>
                                        <span className="text-sm">
                                            {formatDateTime(selectedVoucherDetail.startDate)} - {formatDateTime(selectedVoucherDetail.endDate)}
                                        </span>
                                    </div>
                                </div>

                                {selectedVoucherDetail.scopeDetails && (
                                    <>
                                        <Divider />
                                        <div>
                                            <h4 className="font-medium mb-2">Chi tiết phạm vi:</h4>
                                            <p className="text-sm text-gray-600">{selectedVoucherDetail.scopeDetails}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600">Không thể tải thông tin voucher</p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
                            Đóng
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
} 