'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

const SuccessIcon = () => (
  <div className="flex items-center justify-center mb-6 animate-bounce">
    <svg
      className="w-20 h-20 text-green-500 drop-shadow-lg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#dcfce7" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2l4-4"
        stroke="#22c55e"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  </div>
);

const CheckoutSuccess = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-yellow-50 via-white to-blue-50 animate-fade-in px-4">
      <SuccessIcon />
      <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-green-600 drop-shadow-sm animate-fade-in-up">Đặt hàng thành công!</h2>
      <p className="mb-8 text-lg text-gray-700 animate-fade-in-up delay-100">Cảm ơn bạn đã mua hàng tại <span className="font-semibold text-yellow-500">Yellow Cat</span>.</p>
      <div className="flex gap-4 animate-fade-in-up delay-200">
        <button
          className="px-7 py-2.5 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={() => router.push('/products')}
        >
          Mua tiếp
        </button>
        <button
          className="px-7 py-2.5 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => router.push('/user_info/order_online')}
        >
          Xem đơn hàng
        </button>
      </div>
    </div>
  );
};

// Tailwind custom animation (add to globals.css if not present):
// .animate-fade-in { animation: fadeIn 0.8s ease; }
// .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.39, 0.575, 0.565, 1) both; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

export default CheckoutSuccess; 