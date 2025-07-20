'use client'

import React, { useState } from 'react';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderType: 'customer' | 'admin';
    content: string;
    timestamp: string;
}

interface ChatConversation {
    id: string;
    customerId: string;
    customerName: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    status: 'active' | 'solved' | 'pending';
    messages: ChatMessage[];
}

export default function AdminChatPage() {
    const [conversations] = useState<ChatConversation[]>([
        {
            id: '1',
            customerId: 'cust1',
            customerName: 'Nguyễn Văn A',
            lastMessage: 'Tôi muốn hỏi về đơn hàng #12345',
            lastMessageTime: '20240110Z',
            unreadCount: 2,
            status: 'active',
            messages: [
                {
                    id: '1',
                    senderId: 'cust1',
                    senderName: 'Nguyễn Văn A',
                    senderType: 'customer',
                    content: 'Xin chào, tôi muốn hỏi về đơn hàng #12345',
                    timestamp: '2024011Z'
                },
                {
                    id: '2',
                    senderId: 'admin',
                    senderName: 'Admin',
                    senderType: 'admin',
                    content: 'Chào bạn! Tôi sẽ kiểm tra đơn hàng #12345 cho bạn.',
                    timestamp: '2024011Z'
                },
                {
                    id: '3',
                    senderId: 'cust1',
                    senderName: 'Nguyễn Văn A',
                    senderType: 'customer',
                    content: 'Cảm ơn bạn! Đơn hàng của tôi đang ở đâu vậy?',
                    timestamp: '2024011Z'
                }
            ]
        },
        {
            id: '2',
            customerId: 'cust2',
            customerName: 'Trần Thị B',
            lastMessage: 'Sản phẩm có còn hàng không?',
            lastMessageTime: '20240110Z',
            unreadCount: 0,
            status: 'solved',
            messages: [
                {
                    id: '4',
                    senderId: 'cust2',
                    senderName: 'Trần Thị B',
                    senderType: 'customer',
                    content: 'Sản phẩm có còn hàng không?',
                    timestamp: '2024011Z'
                },
                {
                    id: '5',
                    senderId: 'admin',
                    senderName: 'Admin',
                    senderType: 'admin',
                    content: 'Chào bạn! Sản phẩm vẫn còn hàng. Bạn có muốn đặt hàng không?',
                    timestamp: '2024011Z'
                }
            ]
        },
        {
            id: '3',
            customerId: 'cust3',
            customerName: 'Lê Văn C',
            lastMessage: 'Tôi muốn hủy đơn hàng',
            lastMessageTime: '20240110Z',
            unreadCount: 1,
            status: 'pending',
            messages: [
                {
                    id: '6',
                    senderId: 'cust3',
                    senderName: 'Lê Văn C',
                    senderType: 'customer',
                    content: 'Tôi muốn hủy đơn hàng #12346',
                    timestamp: '2024011Z'
                }
            ]
        }
    ]);

    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;
        setNewMessage('');
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'solved': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex">          {/* Sidebar - Danh sách tin nhắn */}
            <div className="w-80 bg-white border-r border-gray-200">               {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ChatBubbleLeftIcon className="w-5 h-5 mr-2" /> Hỗ trợ khách hàng
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {conversations.filter(c => c.unreadCount > 0).length} tin nhắn chưa đọc
                    </p>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            onClick={() => setSelectedConversation(conversation)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {conversation.customerName}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {formatTime(conversation.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {conversation.lastMessage}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                                                {conversation.status === 'active' ? 'Đang hoạt động' :
                                                 conversation.status === 'solved' ? 'Đã giải quyết' : conversation.status === 'pending' ? 'Chờ xử lý' : conversation.status}
                                            </span>
                                            {conversation.unreadCount > 0 && (
                                                <span className="bg-red-50 text-white text-xs rounded-full px-2 py-1">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedConversation.customerName}
                                        </h2>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedConversation.status)}`}>
                                                {selectedConversation.status === 'active' ? 'Đang hoạt động' :
                                                 selectedConversation.status === 'solved' ? 'Đã giải quyết' : selectedConversation.status === 'pending' ? 'Chờ xử lý' : selectedConversation.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    ID: {selectedConversation.customerId}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedConversation.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.senderType === 'admin'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200'
                                    }`}>
                                        <div className="text-sm">{message.content}</div>
                                        <div className={`text-xs mt-1 ${
                                            message.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                                {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={2}
                                    />
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chọn một cuộc trò chuyện
                            </h3>
                            <p className="text-gray-500">
                                Chọn một khách hàng từ danh sách bên trái để bắt đầu chat
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 