import { useState } from 'react';
import { Info, HelpCircle, X, Zap, Tag, ShoppingCart, Users } from 'lucide-react';

interface PromotionGuideProps {
    type: 'PRODUCT' | 'VOUCHER';
}

export default function PromotionGuide({ type }: PromotionGuideProps) {
    const [isOpen, setIsOpen] = useState(false);

    const productPromotion = {
        title: "🎯 Giảm giá Sản phẩm",
        subtitle: "Áp dụng trực tiếp lên sản phẩm cụ thể",
        color: "blue",
        icon: <Zap className="w-5 h-5" />,
        features: [
            "✅ Giá sản phẩm tự động giảm trên website",
            "✅ Customer thấy giá đã giảm ngay lập tức",
            "✅ Không cần nhập mã gì",
            "✅ Phù hợp cho Flash Sale, Sale theo danh mục"
        ],
        whenToUse: [
            "🔥 Flash Sale cuối tuần",
            "📱 Giảm giá sản phẩm cũ để thanh lý",
            "🎉 Sale theo thương hiệu, màu sắc, size",
            "⚡ Khuyến mãi nhanh để tăng conversion"
        ],
        example: {
            title: "Ví dụ: Sale Black Friday",
            steps: [
                "Chọn tất cả áo khoác mùa đông",
                "Giảm 40% tất cả sản phẩm đã chọn",
                "Customer vào web thấy giá: 1.000k → 600k",
                "Không cần làm gì thêm, mua luôn!"
            ]
        }
    };

    const voucherPromotion = {
        title: "🎫 Voucher (Mã giảm giá)",
        subtitle: "Mã giảm giá cho toàn bộ đơn hàng",
        color: "orange",
        icon: <Tag className="w-5 h-5" />,
        features: [
            "✅ Customer nhập mã tại checkout",
            "✅ Áp dụng cho toàn bộ đơn hàng", 
            "✅ Có thể set điều kiện (giá trị tối thiểu...)",
            "✅ Phù hợp cho Marketing campaign, loyalty"
        ],
        whenToUse: [
            "🎁 Tặng khách hàng VIP",
            "📧 Email marketing campaign",
            "🎯 Khuyến khích mua với giá trị cao",
            "🚚 Miễn phí ship cho đơn từ X đồng"
        ],
        example: {
            title: "Ví dụ: Mã FREESHIP50",
            steps: [
                "Tạo mã: FREESHIP50",
                "Điều kiện: Đơn hàng từ 300k",
                "Customer nhập mã khi thanh toán",
                "Giảm 50k phí ship (từ 50k → 0k)"
            ]
        }
    };

    const data = type === 'PRODUCT' ? productPromotion : voucherPromotion;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                    ${type === 'PRODUCT' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                        : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                    }`}
                title="Xem hướng dẫn sử dụng"
            >
                <HelpCircle size={16} />
                <span className="text-sm font-medium">Hướng dẫn sử dụng</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className={`p-6 border-b ${
                            type === 'PRODUCT' ? 'bg-blue-50' : 'bg-orange-50'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        type === 'PRODUCT' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                        {data.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{data.title}</h2>
                                        <p className="text-sm text-gray-600">{data.subtitle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Features */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Info size={18} className="text-blue-600" />
                                    Đặc điểm chính
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {data.features.map((feature, index) => (
                                        <div key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* When to use */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users size={18} className="text-green-600" />
                                    Khi nào nên sử dụng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {data.whenToUse.map((use, index) => (
                                        <div key={index} className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                                            {use}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Example */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-purple-600" />
                                    {data.example.title}
                                </h3>
                                <div className={`p-4 rounded-lg border-l-4 ${
                                    type === 'PRODUCT' ? 'bg-blue-50 border-blue-400' : 'bg-orange-50 border-orange-400'
                                }`}>
                                    <div className="space-y-2">
                                        {data.example.steps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-medium ${
                                                    type === 'PRODUCT' ? 'bg-blue-500' : 'bg-orange-500'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-700">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick tips */}
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <h4 className="font-medium text-yellow-800 mb-2">💡 Mẹo sử dụng hiệu quả</h4>
                                <div className="text-sm text-yellow-700 space-y-1">
                                    {type === 'PRODUCT' ? (
                                        <>
                                            <p>• Chọn sản phẩm có lượng tồn kho cao để giảm giá nhanh</p>
                                            <p>• Đặt thời gian có hạn để tạo cảm giác khan hiếm</p>
                                            <p>• Combine với email marketing để thông báo sale</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>• Đặt mã dễ nhớ và có ý nghĩa (VD: FREESHIP, SAVE20)</p>
                                            <p>• Set điều kiện tối thiểu để tăng giá trị đơn hàng</p>
                                            <p>• Chia sẻ mã qua email, social media để marketing</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Đã hiểu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 