"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Spinner,
  Divider
} from '@heroui/react'
import { ChatMessage, ProductOverview } from '@/types/chat'
import { ChatService } from '@/services/chatService'
import DOMPurify from 'dompurify';
export default function ChatWithAIPage() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [productsData, setProductsData] = useState<ProductOverview[]>([])
  const chatHistoryRef = useRef<HTMLDivElement>(null)
  const lastRequestTime = useRef<number>(0)
  const MIN_REQUEST_INTERVAL = 3000 // 3 giây giữa các request

  // Load dữ liệu sản phẩm và hiển thị welcome message cố định
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setChatHistory([{ role: 'thinking', content: 'Đang tải dữ liệu sản phẩm...' }])
        
        // Lấy dữ liệu sản phẩm
        const products = await ChatService.getProductsOverview()
        setProductsData(products)
        
        // Hiển thị welcome message cố định (không gọi AI)
        const welcomeMessage = getWelcomeMessage()
        
        setChatHistory([{ 
          role: 'ai', 
          content: welcomeMessage,
          timestamp: new Date()
        }])
      } catch (error) {
        console.error('Error initializing chat:', error)
        setChatHistory([{ 
          role: 'system', 
          content: '😴 Xin lỗi, hệ thống đang bảo trì. Vui lòng thử lại sau!' 
        }])
      } finally {
        // Đã hoàn thành khởi tạo
      }
    }

    initializeChat()
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [chatHistory])

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    // Rate limiting - kiểm tra thời gian giữa các request
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const remainingTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `⏰ Vui lòng đợi ${remainingTime} giây trước khi gửi tin nhắn tiếp theo để tránh quá tải hệ thống.`,
        timestamp: new Date()
      }])
      return
    }

    const userMessage = userInput.trim()
    setUserInput('')
    setIsLoading(true)
    lastRequestTime.current = now

    // Thêm tin nhắn người dùng
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }])

    try {
      // Thêm thinking message
      setChatHistory(prev => [...prev, { 
        role: 'thinking', 
        content: 'Đang phân tích yêu cầu và tìm sản phẩm phù hợp...' 
      }])

      // Gửi tin nhắn tới AI
      const aiResponse = await ChatService.sendMessageToAI(userMessage, productsData, chatHistory)
      
      // Xóa thinking message và thêm AI response
      setChatHistory(prev => {
        const newHistory = prev.slice(0, -1) // Remove thinking message
        return [...newHistory, { 
          role: 'ai', 
          content: aiResponse,
          timestamp: new Date()
        }]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setChatHistory(prev => {
        const newHistory = prev.slice(0, -1) // Remove thinking message
        return [...newHistory, { 
          role: 'system', 
          content: '😵 Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại!' 
        }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Tạo welcome message đơn giản
  const getWelcomeMessage = () => {
    return `
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 1.5rem; border-radius: 12px; color: white;">
        <h3 style="margin: 0 0 0.5rem 0;">👋 Xin chào!</h3>
        <p style="margin: 0; opacity: 0.9;">Tôi là Sneaker Peak AI, tôi sẽ giúp bạn tư vấn giày thể thao. Hãy hỏi tôi bất cứ điều gì bạn muốn! 😊</p>
      </div>
    `;
  }

  const handleQuickAction = async (action: string) => {
    if (isLoading) return

    // Rate limiting cho quick actions
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime.current
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const remainingTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `⏰ Vui lòng đợi ${remainingTime} giây trước khi gửi tin nhắn tiếp theo để tránh quá tải hệ thống.`,
        timestamp: new Date()
      }])
      return
    }
    
    setUserInput('')
    setIsLoading(true)
    lastRequestTime.current = now

    // Thêm tin nhắn người dùng
    setChatHistory(prev => [...prev, { 
      role: 'user', 
      content: action,
      timestamp: new Date()
    }])

    try {
      // Thêm thinking message
      setChatHistory(prev => [...prev, { 
        role: 'thinking', 
        content: 'Đang phân tích yêu cầu và tìm sản phẩm phù hợp...' 
      }])

      // Gửi tin nhắn tới AI
      const aiResponse = await ChatService.sendMessageToAI(action, productsData, chatHistory)
      
      // Xóa thinking message và thêm AI response
      setChatHistory(prev => {
        const newHistory = prev.slice(0, -1) // Remove thinking message
        return [...newHistory, { 
          role: 'ai', 
          content: aiResponse,
          timestamp: new Date()
        }]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setChatHistory(prev => {
        const newHistory = prev.slice(0, -1) // Remove thinking message
        return [...newHistory, { 
          role: 'system', 
          content: '😵 Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại!' 
        }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-4 shadow-lg">
          <CardBody className="text-center py-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Chat với Sneaker Peak AI 👟
                </h1>
                <p className="text-gray-600 text-sm">Tư vấn giày thể thao chuyên nghiệp</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Chat Container */}
        <Card className="shadow-xl">
          <CardBody className="p-0">
            {/* Chat History */}
            <div 
              ref={chatHistoryRef}
              className="h-[60vh] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white/50 chat-scrollbar"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
              }}
            >
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}>
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                      : message.role === 'ai'
                      ? 'bg-white border border-gray-200 rounded-r-2xl rounded-tl-2xl rounded-bl-md shadow-md'
                      : message.role === 'thinking'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl'
                  } p-4 shadow-lg`}>
                    {message.role === 'thinking' && (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" color="white" />
                        <span>{message.content}</span>
                      </div>
                    )}
                    {message.role === 'ai' && (
                      <div 
                        className="ai-message-content text-gray-800"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
                      />
                    )}
                    {message.role === 'user' && (
                      <div className="font-medium">{message.content}</div>
                    )}
                    {message.role === 'system' && (
                      <div className="font-medium">{message.content}</div>
                    )}
                    {message.timestamp && (
                      <div className={`text-xs mt-2 opacity-70 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            {/* Input Section */}
            <div className="p-4 bg-white">
              <div className="flex gap-3 items-end">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn... (Ví dụ: 'Tư vấn giày chạy bộ giá 2 triệu')"
                  disabled={isLoading}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    input: "text-base",
                    inputWrapper: "border-2 hover:border-blue-400 focus-within:border-blue-500"
                  }}
                  endContent={
                    <div className="text-gray-400 text-sm">
                      Enter ↵
                    </div>
                  }
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !userInput.trim()}
                  color="primary"
                  size="lg"
                  className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 font-semibold"
                  startContent={isLoading ? <Spinner size="sm" color="white" /> : null}
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi'}
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {['Giày chạy bộ', 'Giày giá rẻ', 'Nike sale', 'Adidas mới', 'Puma thể thao'].map((quickAction) => (
                  <Button
                    key={quickAction}
                    size="sm"
                    variant="flat"
                    color="default"
                    className="text-xs"
                    onClick={() => handleQuickAction(quickAction)}
                    disabled={isLoading}
                  >
                    {quickAction}
                  </Button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="text-center mt-4 text-gray-500 text-sm">
          <p>🤖 Powered by Google AI Studio</p>
        </div>
      </div>
    </div>
    )
}