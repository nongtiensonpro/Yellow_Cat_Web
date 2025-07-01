'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

const CheckoutSuccess = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-green-600">Đặt hàng thành công!</h2>
      <p className="mb-8">Cảm ơn bạn đã mua hàng tại Yellow Cat.</p>
      <div className="flex gap-4">
        <button
          className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() => router.push('/products')}
        >
          Mua tiếp
        </button>
        <button
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => router.push('/user_info/order')}
        >
          Xem đơn hàng
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess; 