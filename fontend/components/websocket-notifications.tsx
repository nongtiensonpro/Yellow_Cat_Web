'use client'

import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface EntityMessage {
  action: string;
  entity: {
    id: number;
    attributeName: string;
  };
}

export default function WebSocketNotifications() {
  const [notification, setNotification] = useState<string | null>(null);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  useEffect(() => {
    const initializeStompClient = () => {
      const socket = new SockJS('http://localhost:8080/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('Kết nối STOMP đã được thiết lập');
          client.subscribe('/topic/attributes', (message) => {
            const data: EntityMessage = JSON.parse(message.body);
            console.log('Nhận thông báo từ server:', data);
            setNotification(`Hành động: ${data.action} - Attribute: ${data.entity.attributeName}`);
          });
        },
        onStompError: (frame) => {
          console.error('Lỗi STOMP:', frame);
        },
      });

      client.activate();
      setStompClient(client);
    };

    initializeStompClient();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg max-w-md">
      <span className="block sm:inline">{notification}</span>
      <button
        className="absolute top-0 right-0 px-2 py-1"
        onClick={() => setNotification(null)}
      >
        ×
      </button>
    </div>
  );
}