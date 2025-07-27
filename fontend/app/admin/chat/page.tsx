'use client';

import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useSession } from 'next-auth/react';
// import type { Session } from 'next-auth';

const WS_URL = 'http://localhost:8080/ws';
const API_URL = 'http://localhost:8080/api/chat';

interface ChatSession {
  id?: number;
  sessionId?: number;
  customerId?: string;
  status: string;
  lastMessage?: {
    content: string;
  };
}

interface ChatMessage {
  id?: number;
  messageId?: number;
  content: string;
  fromStaff?: boolean;
  senderType?: 'admin' | 'customer' | 'guest';
  timestamp?: string;
  sessionId?: number;
  keycloakId?: string;
}

// interface SessionWithUser extends Session {
//   user?: {
//     id?: string;
//     [key: string]: unknown;
//   };
// }

export default function AdminChatPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const userKeycloakId = session?.user?.id || '';

  const [keycloakId, setKeycloakId] = useState('');
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('Chưa chọn session');
  const [error, setError] = useState('');
  const stompRef = useRef<Client | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const keycloakIdToUse = isLoggedIn ? userKeycloakId : keycloakId.trim();

  // Lấy session chờ
  const loadWaitingSessions = async () => {
    setError('');
    const id = isLoggedIn ? userKeycloakId : keycloakId.trim();
    if (!id) {
      setError('Vui lòng nhập Keycloak ID cho nhân viên');
      alert('Vui lòng nhập Keycloak ID cho nhân viên');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/sessions/waiting`);
      if (!res.ok) throw new Error('Không thể tải session chờ');
      const data = await res.json();
      setWaitingSessions(Array.isArray(data) ? data : data.data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setError('Lỗi khi tải session chờ: ' + errorMessage);
      alert('Lỗi khi tải session chờ: ' + errorMessage);
    }
  };

  // Chọn session, gán nhân viên, lấy lịch sử, subscribe WS
  const handleSelectSession = async (sessionObj: ChatSession) => {
    setError('');
    const id = isLoggedIn ? userKeycloakId : keycloakId.trim();
    if (!id) {
      setError('Vui lòng nhập Keycloak ID cho nhân viên');
      alert('Vui lòng nhập Keycloak ID cho nhân viên');
      return;
    }
    setSelectedSession(sessionObj);
    setStatus(`Đang hỗ trợ session #${sessionObj.id || sessionObj.sessionId}`);
    try {
      // Gán nhân viên vào session
      const assignRes = await fetch(`${API_URL}/sessions/${sessionObj.id || sessionObj.sessionId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Keycloak-Id': id,
        },
      });
      if (!assignRes.ok) {
        const errData = await assignRes.json().catch(() => ({}));
        setError('Lỗi khi gán nhân viên vào session: ' + (errData.message || assignRes.statusText));
        alert('Lỗi khi gán nhân viên vào session: ' + (errData.message || assignRes.statusText));
        return;
      }
      // Lấy lịch sử tin nhắn
      const res = await fetch(`${API_URL}/sessions/${sessionObj.id || sessionObj.sessionId}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.data || []);
      // Kết nối websocket
      if (stompRef.current) stompRef.current.deactivate();
      setWsStatus('connecting');
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        onConnect: () => {
          setWsStatus('connected');
          console.log('WebSocket connected!');
          client.subscribe(`/topic/chat/sessions/${sessionObj.id || sessionObj.sessionId}/messages`, (msg) => {
            const message = JSON.parse(msg.body);
            if (Array.isArray(message)) {
              setMessages(prev => [...prev, ...message]);
            } else if (typeof message === 'object' && message !== null && message.content) {
              setMessages(prev => [...prev, message]);
            }
          });
        },
        onDisconnect: () => {
          setWsStatus('disconnected');
          console.log('WebSocket disconnected!');
        },
        onStompError: (frame) => {
          setWsStatus('error');
          console.error('WebSocket STOMP error:', frame);
        },
        debug: (str) => { console.log('STOMP debug:', str); },
      });
      client.activate();
      stompRef.current = client;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setError('Lỗi khi chọn session: ' + errorMessage);
      alert('Lỗi khi chọn session: ' + errorMessage);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = () => {
    setError('');
    const id = isLoggedIn ? userKeycloakId : keycloakId.trim();
    if (!newMessage.trim() || !selectedSession || !keycloakIdToUse) return;
    if (!stompRef.current?.connected) {
      setError('WebSocket chưa kết nối, vui lòng thử lại sau!');
      alert('WebSocket chưa kết nối, vui lòng thử lại sau!');
      return;
    }
    try {
      stompRef.current.publish({
        destination: '/app/staff/chat.send',
        body: JSON.stringify({
          sessionId: selectedSession.id || selectedSession.sessionId,
          content: newMessage,
          keycloakId: id,
        }),
      });
      setNewMessage('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setError('Lỗi khi gửi tin nhắn: ' + errorMessage);
      alert('Lỗi khi gửi tin nhắn: ' + errorMessage);
    }
  };

  // Log trạng thái debug
  useEffect(() => {
    console.log('selectedSession:', selectedSession);
    console.log('keycloakIdToUse:', isLoggedIn ? userKeycloakId : keycloakId);
    console.log('WebSocket connected:', stompRef.current?.connected);
  }, [selectedSession, userKeycloakId, keycloakId, stompRef.current?.connected, isLoggedIn]);

  // UI
    return (
    <div className="container mx-auto py-8 flex gap-8">
      {/* Panel Nhân viên */}
      <div className="panel flex-1 flex flex-col min-w-[350px]">
        <div className="panel-title flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Nhân viên</h2>
          <div className="badge bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Đã sửa lỗi</div>
                </div>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{error}</div>}
        <div className="mb-2 text-xs">
          Trạng thái WebSocket: {wsStatus === 'connected' ? 'Đã kết nối' : wsStatus === 'connecting' ? 'Đang kết nối...' : wsStatus === 'error' ? 'Lỗi kết nối' : 'Chưa kết nối'}
                                    </div>
        <div className="input-group mb-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Keycloak ID:</label>
          {isLoggedIn ? (
            <input
              className="border rounded px-3 py-2 w-full text-sm bg-gray-100"
              value={userKeycloakId}
              disabled
            />
          ) : (
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              placeholder="Nhập Keycloak ID..."
              value={keycloakId}
              onChange={e => setKeycloakId(e.target.value)}
              disabled={!!selectedSession}
            />
                                            )}
                                        </div>
        <div className="status-bar bg-blue-50 border-l-4 border-blue-400 text-blue-800 font-semibold py-2 px-3 rounded mb-2">{status}</div>
        <button onClick={loadWaitingSessions} className="mb-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
          <span className="icon">🔄</span> Tải session chờ
        </button>
        <div>
          {waitingSessions.length === 0 ? (
            <div className="message system bg-yellow-50 text-yellow-800 p-2 rounded">Không có session nào đang chờ</div>
          ) : (
            waitingSessions.map(session => (
              <div
                key={session.id || session.sessionId}
                className={`session-item p-3 my-2 border rounded cursor-pointer ${selectedSession && (selectedSession.id || selectedSession.sessionId) === (session.id || session.sessionId) ? 'bg-blue-100 border-blue-400' : 'hover:bg-blue-50 border-slate-200'}`}
                onClick={() => handleSelectSession(session)}
              >
                <h4 className="font-semibold text-slate-800">Session #{session.id || session.sessionId}</h4>
                <div className="session-details flex justify-between text-xs text-slate-500">
                  <span>Khách: {session.customerId ? 'User' : 'Guest'}</span>
                  <span>Trạng thái: {session.status}</span>
                </div>
                <div className="text-xs mt-1">{session.lastMessage ? `Tin cuối: ${session.lastMessage.content}` : 'Chưa có tin nhắn'}</div>
            </div>
            ))
          )}
                                    </div>
        <div className="input-group mt-4">
                                    <textarea
            className="w-full p-2 border rounded mb-2"
            rows={3}
            placeholder="Nhập tin nhắn..."
                                        value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={!selectedSession || !keycloakIdToUse}
          />
                                <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                                    onClick={handleSendMessage}
            disabled={!selectedSession || !keycloakIdToUse || !stompRef.current?.connected || !newMessage.trim()}
                                >
            Gửi tin nhắn
                                </button>
                            </div>
        <div className="messages-container flex-1 overflow-y-auto mt-2 bg-slate-50 rounded p-2">
          {messages.map((msg, idx) => (
            <div
              key={msg.id || msg.messageId || idx}
              className={`message ${msg.fromStaff || msg.senderType === 'admin' ? 'staff' : (msg.senderType === 'customer' ? 'customer' : 'guest')} mb-2`}
            >
              <div className="message-header font-semibold mb-1">
                {msg.fromStaff || msg.senderType === 'admin'
                  ? 'Nhân viên'
                  : msg.senderType === 'customer'
                  ? 'Khách hàng'
                  : 'Khách vãng lai'}
                        </div>
              <div>{msg.content}</div>
              <div className="timestamp text-xs mt-1 text-right">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
            </div>
          ))}
        </div>
            </div>
        </div>
    );
} 