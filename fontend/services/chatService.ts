import { ProductOverview, ChatMessage } from '@/types/chat';
import { GeminiService } from './geminiService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ChatService {
  // Lấy dữ liệu tổng quan sản phẩm cho AI
  static async getProductsOverview(): Promise<ProductOverview[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/ai-overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || data; // Xử lý cả trường hợp có wrapper hoặc không
    } catch (error) {
      console.error('Error fetching products overview:', error);
      throw error;
    }
  }

  // Gửi tin nhắn tới Gemini AI
  static async sendMessageToAI(
    message: string, 
    productsData: ProductOverview[], 
chatHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Sử dụng Gemini AI service để xử lý tin nhắn
      return await GeminiService.sendMessage(message, productsData, chatHistory);
      
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  }
}
