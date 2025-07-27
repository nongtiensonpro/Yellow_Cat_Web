'use client';

import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useSession } from 'next-auth/react';

const WS_URL = 'http://localhost:8080/ws';

// Định nghĩa interface cho Message
interface Message {
  id?: string | number;
  messageId?: string | number;
  content: string;
  fromStaff?: boolean;
  senderType?: 'admin' | 'customer' | 'guest';
  timestamp?: string | number;
  sessionId?: number;
  keycloakId?: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const userKeycloakId = session?.user?.id || '';

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [keycloakId, setKeycloakId] = useState('');
  const stompRef = useRef<Client | null>(null);

  // Kết nối websocket khi đã có sessionId
  useEffect(() => {
    if (!sessionId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      onConnect: () => {
        client.subscribe(`/topic/chat/sessions/${sessionId}/messages`, (msg) => {
          const message = JSON.parse(msg.body);
          setMessages(prev => [...prev, message]);
        });
      },
      debug: () => {},
    });
    client.activate();
    stompRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [sessionId]);

  // Lấy lịch sử tin nhắn khi đã có sessionId
  useEffect(() => {
    if (!sessionId) return;
    fetch(`http://localhost:8080/api/chat/sessions/${sessionId}/messages`)
      .then(res => res.json())
      .then(setMessages);
  }, [sessionId]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!input.trim()) return;
    const keycloakIdToSend = isLoggedIn ? userKeycloakId : keycloakId;
    if (!sessionId) {
      // Gửi tin nhắn đầu tiên qua REST để tạo session
      const res = await fetch('http://localhost:8080/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input,
          ...(keycloakIdToSend ? { keycloakId: keycloakIdToSend } : {}),
        }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setInput('');
    } else if (stompRef.current?.connected) {
      stompRef.current.publish({
        destination: '/app/customer/chat.send',
        body: JSON.stringify({
          sessionId,
          content: input,
          ...(keycloakIdToSend ? { keycloakId: keycloakIdToSend } : {}),
        }),
      });
      setInput('');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow p-6 flex flex-col h-[70vh]">
      <h2 className="text-2xl font-bold mb-4 text-orange-600">Chat với nhân viên hỗ trợ</h2>
      {!isLoggedIn && (
        <div className="mb-2">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Nhập Keycloak ID (nếu có, không bắt buộc)"
            value={keycloakId}
            onChange={e => setKeycloakId(e.target.value)}
            disabled={!!sessionId}
          />
        </div>
      )}
      {isLoggedIn && (
        <div className="mb-2 text-sm text-gray-600">
          Đăng nhập với ID: <span className="font-mono">{userKeycloakId}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 bg-gray-50 p-3 rounded">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.fromStaff ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.fromStaff ? 'bg-gray-200 text-gray-800' : 'bg-orange-500 text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          onClick={handleSend}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
