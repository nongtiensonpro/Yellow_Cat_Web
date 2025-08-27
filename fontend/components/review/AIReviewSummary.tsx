import { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Review {
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    createdAt?: string;
}

interface ProductInfoForAI {
    productId: number;
    productName: string;
    brandName?: string;
    categoryName?: string;
    materialName?: string;
    targetAudienceName?: string;
}

interface AIReviewSummaryProps {
    reviews: Review[];
    productInfo?: ProductInfoForAI;
}

const AIReviewSummary = ({ reviews, productInfo }: AIReviewSummaryProps) => {
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const apiKey = 'AIzaSyCW1jh4rRrAIDeji8I1pwSt_6JraiyY_CY';

    const generateSummary = useCallback(async (reviewsData: Review[]) => {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const productContext = [
                'Thông tin sản phẩm:',
                `- Tên: ${productInfo?.productName ?? '(không có)'}`,
                `- Thương hiệu: ${productInfo?.brandName ?? '(không có)'}`,
                `- Danh mục: ${productInfo?.categoryName ?? '(không có)'} ,`,
                `- Chất liệu: ${productInfo?.materialName ?? '(không có)'} ,`,
                `- Đối tượng: ${productInfo?.targetAudienceName ?? '(không có)'} ,`
            ].join('\n');

            const context = `Bạn là AI chuyên phân tích đánh giá giày thể thao. Hãy dựa cả vào thông tin sản phẩm và danh sách đánh giá dưới đây để đưa ra tổng hợp ngắn gọn, hữu ích cho người mua.
            ${productContext}
            Danh sách đánh giá:
            ${JSON.stringify(reviewsData, null, 2)}
            Tạo bản tóm tắt ngắn gọn (khoảng 100 từ) bao gồm:
            1. Điểm trung bình
            2. Tỷ lệ đánh giá tích cực/tiêu cực
            3. Ưu điểm chính
            4. Nhược điểm chính (nếu có)
            Hài hước, thêm 1-2 emoji thú cưng. Chia thành các đoạn ngắn để dễ đọc.`;

            const result = await model.generateContent(context);
            return result.response.text();
        } catch (error) {
            console.error("Error generating AI summary:", error);
            throw new Error("Xin lỗi, có lỗi xảy ra khi tạo tóm tắt. Vui lòng thử lại sau! 🙏");
        }
    }, [apiKey, productInfo]);

    const formattedSummary = useMemo(() => {
        if (!aiSummary) return [];

        const sentences = aiSummary.split(/(?<=[.!?])\s+/);
        const paragraphs: string[] = [];
        let currentParagraph = '';

        for (const sentence of sentences) {
            if (currentParagraph.length + sentence.length > 100) {
                if (currentParagraph.trim()) {
                    paragraphs.push(currentParagraph.trim());
                }
                currentParagraph = '';
            }
            currentParagraph += sentence + ' ';
        }

        if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
        }

        return paragraphs;
    }, [aiSummary]);

    useEffect(() => {
        const handleGenerateSummary = async () => {
            if (!reviews || reviews.length === 0) {
                setAiSummary('Chưa có đánh giá nào để phân tích. 🐱');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const summary = await generateSummary(reviews);
                setAiSummary(summary);
            } catch (error) {
                console.error("Error getting AI summary:", error);
                setError("Xin lỗi, không thể tạo tóm tắt lúc này. Vui lòng thử lại sau. 🙏");
            } finally {
                setIsLoading(false);
            }
        };

        handleGenerateSummary();
    }, [reviews, generateSummary]);

    if (reviews.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                    Tổng hợp đánh giá và nhận xét bởi AI
                </h3>
            </div>

            {isLoading && (
                <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span>Đang phân tích đánh giá...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {!isLoading && !error && formattedSummary.length > 0 && (
                <div className="space-y-3">
                    {formattedSummary.map((paragraph, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            )}

            {!isLoading && !error && formattedSummary.length === 0 && aiSummary && (
                <div className="space-y-3">
                    <p className="text-gray-700 leading-relaxed">
                        {aiSummary}
                    </p>
                </div>
            )}

            {!isLoading && !error && !aiSummary && (
                <p className="text-gray-500 italic">
                    Chưa có đánh giá nào để phân tích. 🐱
                </p>
            )}
        </div>
    );
};

export default AIReviewSummary;
