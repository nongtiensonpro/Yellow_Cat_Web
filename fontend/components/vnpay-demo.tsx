'use client';

import { useState } from 'react';
import { createPayment } from '@/app/staff/officesales/vnpay/service/vnpayService';

const orderTypes = [
  { value: 'billpayment', label: 'Thanh toán hóa đơn' }
];

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: 10000,
    orderType: orderTypes[0].value,
    orderInfo: 'Demo Order',
    language: 'vn',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createPayment({
        ...formData,
        returnUrl: `${window.location.origin}/vnpay/payment-result`,
      });

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Thanh toán VNPay</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Số tiền (VND)
              </label>
              <input
                type="number"
                name="amount"
                id="amount"
                min="1000"
                value={formData.amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">
                Loại đơn hàng
              </label>
              <select
                name="orderType"
                id="orderType"
                value={formData.orderType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="orderInfo" className="block text-sm font-medium text-gray-700">
                Thông tin đơn hàng
              </label>
              <input
                type="text"
                name="orderInfo"
                id="orderInfo"
                value={formData.orderInfo}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Nhập thông tin đơn hàng (không bắt buộc)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}