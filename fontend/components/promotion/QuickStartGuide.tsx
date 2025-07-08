import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Tag, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function QuickStartGuide() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-orange-500 p-2 rounded-lg text-white">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">🚀 Hướng dẫn nhanh: Hai loại Khuyến mãi</h3>
                        <p className="text-sm text-gray-600">Phân biệt và sử dụng đúng loại khuyến mãi cho từng trường hợp</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Promotion Products */}
                    <div className="bg-white rounded-lg border border-blue-200 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-800">🎯 Giảm giá Sản phẩm</h4>
                                <p className="text-xs text-blue-600">Áp dụng trực tiếp lên sản phẩm</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Giá sản phẩm <strong>tự động giảm</strong> trên website</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Customer thấy giá đã giảm <strong>ngay lập tức</strong></span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span><strong>Không cần nhập mã</strong>, mua luôn được</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded mb-4">
                            <p className="text-xs font-medium text-blue-800 mb-1">✨ Khi nào sử dụng:</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Flash Sale cuối tuần</li>
                                <li>• Sale thanh lý hàng tồn kho</li>
                                <li>• Giảm giá theo danh mục sản phẩm</li>
                            </ul>
                        </div>

                        <Link
                            href="/admin/promotion_products"
                            className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Quản lý Giảm giá SP
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Vouchers */}
                    <div className="bg-white rounded-lg border border-orange-200 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                <Tag size={18} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-orange-800">🎫 Voucher (Mã giảm giá)</h4>
                                <p className="text-xs text-orange-600">Mã giảm giá cho đơn hàng</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Customer <strong>nhập mã</strong> tại checkout</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Áp dụng cho <strong>toàn bộ đơn hàng</strong></span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>Có thể <strong>set điều kiện</strong> (giá trị tối thiểu...)</span>
                            </div>
                        </div>

                        <div className="bg-orange-50 p-3 rounded mb-4">
                            <p className="text-xs font-medium text-orange-800 mb-1">✨ Khi nào sử dụng:</p>
                            <ul className="text-xs text-orange-700 space-y-1">
                                <li>• Email marketing campaign</li>
                                <li>• Tặng khách hàng VIP</li>
                                <li>• Khuyến khích đơn hàng lớn</li>
                            </ul>
                        </div>

                        <Link
                            href="/admin/promotion_management/vouchers"
                            className="w-full bg-orange-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Quản lý Voucher
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            )}

            {/* Quick examples */}
            {!isExpanded && (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span><strong>Giảm giá SP:</strong> Áo thun 500k → 400k (tự động)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span><strong>Voucher:</strong> Mã SAVE50 → Giảm 50k đơn hàng</span>
                    </div>
                </div>
            )}
        </div>
    );
} 