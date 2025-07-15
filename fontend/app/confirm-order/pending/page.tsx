"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { Client as StompClient, IMessage } from '@stomp/stompjs';

export default function PendingZaloPay() {
  const router = useRouter();
  const searchParams = useSearchParams() as NonNullable<ReturnType<typeof useSearchParams>>;
  const orderCode = searchParams.get('orderCode') ?? '';
  const orderUrl = searchParams.get('orderUrl') ?? '';
  const stompClientRef = useRef<StompClient | null>(null);

  useEffect(() => {
    if (!orderCode) return;
    let SockJS: any;
    let Stomp: typeof StompClient;
    let client: StompClient;
    // Dynamic import để tránh lỗi SSR
    import('sockjs-client').then((sockjsModule) => {
      SockJS = sockjsModule.default;
      import('@stomp/stompjs').then((stompModule) => {
        Stomp = stompModule.Client;
        client = new Stomp({
          brokerURL: undefined,
          webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
          reconnectDelay: 5000,
        });
        client.onConnect = () => {
          client.subscribe(`/topic/payment-status/${orderCode}`, (message: IMessage) => {
            try {
              const data = JSON.parse(message.body);
              if (data.status === 'PAID') {
                router.push('/confirm-order/success');
              }
            } catch {}
          });
        };
        client.activate();
        stompClientRef.current = client;
      });
    });
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [orderCode, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-yellow-50 via-white to-blue-50 px-4">
      <div className="flex items-center justify-center mb-6 animate-bounce">
        <svg className="w-20 h-20 text-yellow-500 drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fef08a" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4-4" stroke="#eab308" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
      <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-yellow-600 drop-shadow-sm">Đơn hàng đang chờ thanh toán</h2>
      <p className="mb-4 text-lg text-gray-700">Mã đơn hàng: <span className="font-semibold text-blue-600">{orderCode}</span></p>
      <p className="mb-8 text-base text-gray-600">Vui lòng hoàn tất thanh toán để xử lý đơn hàng.</p>
      <div className="flex gap-4">
        <button
          className="px-7 py-2.5 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => { if (orderUrl) window.open(orderUrl, '_blank'); }}
        >
          Thanh toán ngay
        </button>
        <button
          className="px-7 py-2.5 bg-gray-400 text-white rounded-lg shadow-md hover:bg-gray-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400"
          onClick={() => router.push('/')}
        >
          Hủy giao dịch
        </button>
      </div>
      <div className="mt-8 text-sm text-gray-500">Trang sẽ tự động chuyển sang thành công khi thanh toán hoàn tất.</div>
    </div>
  );
} 