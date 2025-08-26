import { ProductOverview, ChatMessage } from '@/types/chat';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private static readonly API_KEY = 'AIzaSyAngio9lHhhKrSYBeh_RBYxnQvkflv8CXQ';

  /**
   * Gửi tin nhắn tới Gemini AI với context sản phẩm
   */
  static async sendMessage(
    userMessage: string,
    productsData: ProductOverview[],
    chatHistory: ChatMessage[] = []
  ): Promise<string> {

    try {
      // Khởi tạo Gemini AI giống như trong AIReviewSummary
      const genAI = new GoogleGenerativeAI(this.API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Tạo system prompt với dữ liệu sản phẩm
      const systemPrompt = this.createSystemPrompt(productsData);
      
      // Tạo context hoàn chỉnh với lịch sử chat
      let fullContext = systemPrompt + '\n\n';
      
      // Thêm lịch sử chat gần đây
      const recentHistory = chatHistory.slice(-4);
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          fullContext += `Khách hàng: ${msg.content}\n`;
        } else if (msg.role === 'ai') {
          fullContext += `Sneaker Peak: ${msg.content}\n`;
        }
      }
      
      // Thêm tin nhắn hiện tại
      fullContext += `Khách hàng: ${userMessage}\n\nSneaker Peak:`;

      // Gọi API Gemini
      const result = await model.generateContent(fullContext);
      const response = result.response;
      const aiResponse = response.text();
      
      return aiResponse;

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return this.getAPIKeyErrorMessage();
        }
        if (error.message.includes('429') || error.message.includes('Quota exceeded') || error.message.includes('RATE_LIMIT_EXCEEDED')) {
          return this.getRateLimitErrorMessage(userMessage, productsData);
        }
      }
      
      return this.getErrorFallbackMessage(userMessage, productsData);
    }
  }

  /**
   * Tạo system prompt với dữ liệu sản phẩm
   */
  private static createSystemPrompt(productsData: ProductOverview[]): string {
    const totalProducts = productsData.length;
    const promotionCount = productsData.filter(p => p.hasPromotion).length;
    const featuredCount = productsData.filter(p => p.isFeatured).length;
    const brands = Array.from(new Set(productsData.map(p => p.brandName)));
    const categories = Array.from(new Set(productsData.map(p => p.categoryName)));

    return `
🎯 **BẠN LÀ Sneaker Peak - CHUYÊN GIA TƯ VẤN GIÀY THỂ THAO**

**VAI TRÒ & TÍNH CÁCH:**
- Tên: Sneaker Peak 🐱
- Vai trò: Nhân viên tư vấn bán hàng chuyên nghiệp tại Sneaker Peak Web
- Tính cách: Thân thiện, nhiệt tình, chuyên nghiệp, hài hước nhẹ nhàng
- Sử dụng emoji giày thể thao: 👟⚡🏃‍♂️🔥⭐💰

**QUY TẮC TƯ VẤN:**
1. CHỈ sử dụng thông tin sản phẩm được cung cấp bên dưới
2. KHÔNG bịa đặt thông tin về giá, tính năng, hoặc sản phẩm không tồn tại
3. Trả lời bằng HTML với styling đẹp (background gradients, colors, spacing)
4. Phân tích nhu cầu khách hàng và đề xuất sản phẩm phù hợp
5. Giải thích rõ lý do đề xuất dựa trên dữ liệu thực tế
6. Cảnh báo tồn kho thấp và khuyến mãi khi phù hợp

**DỮLIỆU CỬA HÀNG HIỆN TẠI:**
- Tổng sản phẩm: ${totalProducts}
- Đang khuyến mãi: ${promotionCount}
- Sản phẩm nổi bật: ${featuredCount}
- Thương hiệu: ${brands.join(', ')}
- Danh mục: ${categories.join(', ')}

**CHI TIẾT TỪNG SẢN PHẨM:**
${productsData.map((product, index) => `
${index + 1}. **${product.productName}**
   - ID: ${product.productId}
   - Mô tả: ${product.description}
   - Thương hiệu: ${product.brandName}
   - Danh mục: ${product.categoryName}
   - Đối tượng: ${product.targetAudience}
   - Chất liệu: ${product.materialName}
   - Giá gốc: ${product.minPrice.toLocaleString()}đ - ${product.maxPrice.toLocaleString()}đ
   - Giá khuyến mãi: ${product.minSalePrice ? product.minSalePrice.toLocaleString() + 'đ' : 'Không có'}
   - Tồn kho: ${product.totalStock} đôi
   - Đã bán: ${product.totalSold} đôi
   - Lượt mua: ${product.purchases}
   - Đánh giá: ${product.averageRating}/5 (${product.totalReviews} reviews)
   - Màu sắc: ${product.availableColors}
   - Kích thước: ${product.availableSizes}
   - Trạng thái: ${product.isActive ? 'Đang bán' : 'Ngừng bán'}
   - Nổi bật: ${product.isFeatured ? 'Có' : 'Không'}
   - Khuyến mãi: ${product.hasPromotion ? 'Có' : 'Không'}
`).join('\n')}

**FORMAT RESPONSE:**
- Sử dụng HTML với inline styles
- Background gradient cho header sections
- Cards trắng cho thông tin sản phẩm
- Colors: Blue (#2563eb), Purple (#7c3aed), Green (#059669), Red (#dc2626), Orange (#ea580c)
- Spacing và typography dễ đọc
- Icons phù hợp với nội dung

**VÍ DỤ CÁCH TRẢ LỜI:**
\`\`\`html
<div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 1.5rem; border-radius: 12px; color: white; margin-bottom: 1rem;">
  <h3 style="margin: 0 0 1rem 0;">🏃‍♂️ Đề Xuất Cho Bạn!</h3>
  <p style="margin: 0; opacity: 0.9;">Dựa trên yêu cầu của bạn, đây là những lựa chọn tốt nhất:</p>
</div>
<div style="background: white; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <h4 style="color: #2563eb; margin: 0 0 0.5rem 0;">👟 Tên Sản Phẩm</h4>
  <p style="color: #64748b; margin: 0 0 0.8rem 0;">Mô tả chi tiết...</p>
  <div style="display: flex; gap: 1rem; margin-bottom: 0.8rem;">
    <span style="background: #fee2e2; color: #dc2626; padding: 0.3rem 0.6rem; border-radius: 4px;">💰 Giá</span>
    <span style="background: #fef3c7; color: #d97706; padding: 0.3rem 0.6rem; border-radius: 4px;">⭐ Rating</span>
  </div>
</div>
\`\`\`

Hãy trả lời câu hỏi của khách hàng một cách chuyên nghiệp và hữu ích!
`;
  }

  /**
   * Message khi vượt quá rate limit
   */
  private static getRateLimitErrorMessage(userMessage: string, productsData: ProductOverview[]): string {
    // Phân tích đơn giản câu hỏi để đưa ra gợi ý
    const lowerMessage = userMessage.toLowerCase();
    let suggestions = [];

    if (lowerMessage.includes('chạy bộ') || lowerMessage.includes('chạy')) {
      const runningShoes = productsData.filter(p => 
        p.description.toLowerCase().includes('chạy bộ') || 
        p.categoryName.toLowerCase().includes('chạy')
      ).slice(0, 2);
      suggestions = runningShoes;
    } else if (lowerMessage.includes('nike')) {
      suggestions = productsData.filter(p => p.brandName.toLowerCase() === 'nike').slice(0, 2);
    } else if (lowerMessage.includes('khuyến mãi') || lowerMessage.includes('sale')) {
      suggestions = productsData.filter(p => p.hasPromotion).slice(0, 2);
    } else {
      suggestions = productsData.filter(p => p.isFeatured).slice(0, 2);
    }

    return `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 1.5rem; border-radius: 12px; color: white; margin-bottom: 1rem;">
        <h3 style="margin: 0 0 1rem 0;">⏰ Hệ Thống Đang Bận!</h3>
        <p style="margin: 0; opacity: 0.9;">AI đang xử lý nhiều yêu cầu. Trong lúc chờ, để tôi gợi ý một số sản phẩm phù hợp:</p>
      </div>
      
      ${suggestions.length > 0 ? `
        <div style="background: white; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h4 style="color: #d97706; margin: 0 0 1rem 0;">💡 Gợi Ý Cho Bạn:</h4>
          ${suggestions.map(product => `
            <div style="border: 1px solid #fed7aa; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
              <strong style="color: #1e293b;">${product.productName}</strong>
              <p style="color: #64748b; font-size: 0.9rem; margin: 0.3rem 0;">${product.description.substring(0, 100)}...</p>
              <div style="color: #64748b; font-size: 0.9rem; margin-top: 0.3rem;">
                💰 ${product.minSalePrice ? product.minSalePrice.toLocaleString() : product.minPrice.toLocaleString()}đ | 
                ⭐ ${product.averageRating}/5 | 
                📦 ${product.totalStock} đôi
                ${product.hasPromotion ? ' | 🔥 ĐANG SALE' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 1rem;">
        <p style="margin: 0; color: #92400e; font-size: 0.9rem;">
          💬 <strong>Vui lòng thử lại sau 1-2 phút</strong> hoặc liên hệ trực tiếp với chúng tôi qua hotline để được tư vấn chi tiết hơn!
        </p>
      </div>
    `;
  }

  /**
   * Message khi thiếu API key
   */
  private static getAPIKeyErrorMessage(): string {
    return `
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 1.5rem; border-radius: 12px; color: white; margin-bottom: 1rem;">
        <h3 style="margin: 0 0 1rem 0;">⚙️ Cấu Hình Chưa Hoàn Tất</h3>
        <p style="margin: 0; opacity: 0.9;">Gemini API key chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GEMINI_API_KEY vào file .env.local</p>
      </div>
      <div style="background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="color: #dc2626; margin: 0 0 0.5rem 0;">🔧 Hướng Dẫn Cấu Hình:</h4>
        <ol style="color: #64748b; margin: 0; padding-left: 1.2rem;">
          <li>Tạo file .env.local trong thư mục fontend/</li>
          <li>Thêm dòng: NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here</li>
          <li>Restart development server</li>
        </ol>
      </div>
    `;
  }

  /**
   * Fallback response khi có lỗi
   */
  private static getErrorFallbackMessage(userMessage: string, productsData: ProductOverview[]): string {
    // Tạo response đơn giản dựa trên dữ liệu sản phẩm
    const featuredProducts = productsData.filter(p => p.isFeatured).slice(0, 2);
    const promoProducts = productsData.filter(p => p.hasPromotion).slice(0, 2);

    return `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 1.5rem; border-radius: 12px; color: white; margin-bottom: 1rem;">
        <h3 style="margin: 0 0 1rem 0;">😅 Xin Lỗi Bạn!</h3>
        <p style="margin: 0; opacity: 0.9;">Hệ thống AI đang gặp sự cố. Để bù đắp, tôi sẽ giới thiệu một số sản phẩm tốt nhất của chúng tôi:</p>
      </div>
      
      ${featuredProducts.length > 0 ? `
        <div style="background: white; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h4 style="color: #7c3aed; margin: 0 0 1rem 0;">⭐ Sản Phẩm Nổi Bật:</h4>
          ${featuredProducts.map(product => `
            <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
              <strong style="color: #1e293b;">${product.productName}</strong>
              <div style="color: #64748b; font-size: 0.9rem; margin-top: 0.3rem;">
                💰 ${product.minSalePrice ? product.minSalePrice.toLocaleString() : product.minPrice.toLocaleString()}đ | 
                ⭐ ${product.averageRating}/5 | 
                📦 ${product.totalStock} đôi
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${promoProducts.length > 0 ? `
        <div style="background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h4 style="color: #dc2626; margin: 0 0 1rem 0;">🔥 Đang Khuyến Mãi:</h4>
          ${promoProducts.map(product => `
            <div style="border: 1px solid #fecaca; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
              <strong style="color: #dc2626;">${product.productName}</strong>
              <div style="color: #64748b; font-size: 0.9rem; margin-top: 0.3rem;">
                💰 ${product.minSalePrice?.toLocaleString()}đ 
                <s style="color: #9ca3af;">${product.minPrice.toLocaleString()}đ</s> | 
                📦 ${product.totalStock} đôi
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 1rem;">
        <p style="margin: 0; color: #475569; font-size: 0.9rem;">
          💬 Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi để được tư vấn chi tiết hơn!
        </p>
      </div>
    `;
  }
}
