"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from "@heroui/react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionWithToken extends Session {
  accessToken?: string;
}

interface StaffInfo {
  appUserId: number;
  keycloakId: string;
  email: string;
  roles: string[];
  enabled: boolean;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
}

interface Payment {
  paymentId?: number | string;
  paymentMethod: string;
  amount: number;
  paymentStatus: string;
  transactionId?: string;
}

interface Order {
  customerName?: string;
  phoneNumber?: string;
  orderCode: string;
  staffName?: string;
  discountAmount: number;
  payments?: Payment[];
}

interface OrderItem {
  orderItemId: number | string;
  productVariantId?: number;
  productName?: string;
  variantInfo?: string;
  quantity: number;
  priceAtPurchase: number;
  totalPrice: number;
  bestPromo?: {
    promotionCode: string;
    promotionName: string;
    discountAmount: number;
  };
  originalPrice?: number;
}

interface InvoiceProps {
  order: Order;
  orderItems: OrderItem[];
  totals: {
    subTotalAmount: number;
    finalAmount: number;
    calculatedStatus: string;
  };
  staffInfo?: StaffInfo | null;
}

// Component hiển thị hóa đơn để in
const InvoiceContent: React.FC<InvoiceProps> = ({ order, orderItems, totals, staffInfo }) => (
  (() => {
    // Tính tổng giá gốc và tổng giảm
    const originalTotal = orderItems.reduce((sum, item) => {
      const unitOriginal = item.originalPrice ?? item.priceAtPurchase;
      return sum + unitOriginal * item.quantity;
    }, 0);
    const discountedTotal = totals.subTotalAmount ?? totals.finalAmount;
    const totalDiscount = originalTotal - discountedTotal;

    return (
  <div className="bg-white p-8 max-w-4xl mx-auto text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold mb-2">HÓA ĐƠN BÁN HÀNG</h1>
      <div className="text-sm text-gray-600">
        <p className="font-bold">Cửa hàng bán giày thể thao nam Sneak Peak</p>
        <p>Địa chỉ: 123 Đường 123, Quận 123, Hà Nội</p>
        <p>Điện thoại: 0123.456.789 | Email: info@yellowcat.com</p>
      </div>
    </div>

    <hr className="border-black border-2 mb-6" />

    {/* Customer & Order Info */}
    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
      <div>
        <h3 className="font-bold mb-2">Thông tin khách hàng:</h3>
        <p>Tên: {order.customerName || 'Khách vãng lai'}</p>
        <p>SĐT: {order.phoneNumber || 'Không có'}</p>
      </div>
      <div>
        <h3 className="font-bold mb-2">Thông tin đơn hàng:</h3>
        <p>Mã đơn: {order.orderCode}</p>
        <p>Nhân viên: {staffInfo?.fullName || order.staffName || 'Admin'}</p>
        {staffInfo?.phoneNumber && (
          <p>Số điện thoại nhân viên: {staffInfo.phoneNumber}</p>
        )}
        {staffInfo?.email && (
          <p>Email nhân viên: {staffInfo.email}</p>
        )}
        {/*{staffInfo?.roles && staffInfo.roles.length > 0 && (*/}
        {/*  <p>Chức vụ: {staffInfo.roles.join(', ')}</p>*/}
        {/*)}*/}
      </div>
    </div>

    {/* Products Table */}
    <div className="mb-6">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-center">STT</th>
            <th className="border border-gray-300 p-2 text-left">Sản phẩm</th>
            <th className="border border-gray-300 p-2 text-center">SL</th>
            <th className="border border-gray-300 p-2 text-right">Đơn giá</th>
            <th className="border border-gray-300 p-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, index) => (
            <tr key={item.orderItemId}>
              <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
              <td className="border border-gray-300 p-2">
                <div>{item.productName ?? 'Tên sản phẩm không xác định'}</div>
                <div className="text-xs text-gray-500">{item.variantInfo ?? ''}</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
              <td className="border border-gray-300 p-2 text-right">
                {item.bestPromo ? (
                  <div className="text-right inline-block">
                    <span className="font-semibold text-red-600">{item.priceAtPurchase.toLocaleString('vi-VN')}</span><br />
                    <span className="line-through text-xs text-gray-500">{item.originalPrice?.toLocaleString('vi-VN')}</span><br />
                    <span className="text-[10px] text-orange-600">KM: {item.bestPromo.promotionCode}</span>
                  </div>
                ) : item.priceAtPurchase.toLocaleString('vi-VN')}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {item.totalPrice.toLocaleString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals */}
    <div className="bg-gray-50 p-4 border border-gray-300 mb-6 text-sm">
      <div className="flex justify-between mb-1">
        <span className="font-bold">Tạm tính (giá gốc):</span>
        <span>{originalTotal.toLocaleString('vi-VN')} VND</span>
      </div>
      {totalDiscount > 0 && (
        <div className="flex justify-between mb-1 text-red-600">
          <span className="font-bold">Giảm giá:</span>
          <span>-{totalDiscount.toLocaleString('vi-VN')} VND</span>
        </div>
      )}

      <hr className="border-gray-400 my-2" />
      <div className="flex justify-between text-lg font-bold">
        <span>Thành tiền:</span>
        <span>{totals.finalAmount.toLocaleString('vi-VN')} VND</span>
      </div>
    </div>

    {/* Payment Info */}
    {order.payments && order.payments.length > 0 && (
      <div className="bg-gray-50 p-4 border border-gray-300 mb-6 text-sm">
        <h3 className="font-bold mb-2">Thông tin thanh toán:</h3>
        {order.payments.map((payment: Payment, index: number) => (
          <div key={payment.paymentId || index} className="mb-2">
            <p>• {payment.paymentMethod}: {payment.amount.toLocaleString('vi-VN')} VND</p>
            <p className="text-xs text-gray-600">
              Trạng thái: {payment.paymentStatus}
              {payment.transactionId && ` - Mã GD: ${payment.transactionId}`}
            </p>
          </div>
        ))}
      </div>
    )}

    {/* Footer */}
    <div className="text-center text-sm text-gray-600 mt-8">
      <p>Cảm ơn quý khách đã mua hàng cửa hàng bán giày thể thao nam Sneak Peak!</p>
      <p>Hóa đơn được in lúc: {new Date().toLocaleString('vi-VN')}</p>
    </div>
  </div>
 );
  })()
);

interface InvoicePrintProps {
  order: Order;
  orderItems: OrderItem[];
  totals: {
    subTotalAmount: number;
    finalAmount: number;
    calculatedStatus: string;
  };
  className?: string;
}

interface PromoItem {
  promotionCode: string;
  promotionName: string;
  discountAmount: number;
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ order, orderItems, totals, className }) => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const printRef = useRef<HTMLDivElement>(null);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);

  // Promotion info
  const [promos, setPromos] = useState<PromoItem[]>([]);

  // Fetch thông tin nhân viên đơn giản theo order code
  const fetchStaffInfo = useCallback(async () => {
    const sessionWithToken = session as SessionWithToken;
    if (!order?.orderCode || !sessionWithToken?.accessToken) {
      console.warn('⚠️ No order code or session token available');
      return;
    }

    setStaffLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/orders/staff-info/${order.orderCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionWithToken.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('👤 Fetched staff info:', data);
      
      if (data.status >= 200 && data.status < 300 && data.data) {
        setStaffInfo(data.data);
      } else {
        console.warn('⚠️ No staff info found for order:', order.orderCode);
      }
    } catch (error) {
      console.error('❌ Error fetching staff info:', error);
    } finally {
      setStaffLoading(false);
    }
  }, [order?.orderCode, session]);

  // Fetch staff info khi modal mở
  useEffect(() => {
    if (isOpen && !staffInfo) {
      fetchStaffInfo();
    }
    // Fetch promotions
    if (isOpen && promos.length === 0 && orderItems.length > 0) {
      (async () => {
        try {
          const uniqueVariantIds = Array.from(new Set(orderItems.map(i => i.productVariantId)));
          const promoResults = await Promise.all(uniqueVariantIds.map(async (vid) => {
            try {
              const res = await fetch(`http://localhost:8080/api/products/variant/${vid}/promotions`);
              if (!res.ok) return null;
              const json = await res.json();
              return json?.data?.bestPromo as PromoItem | null;
            } catch {
              return null;
            }
          }));
          const filtered = promoResults.filter((p): p is PromoItem => p !== null);
          setPromos(filtered);
        } catch (error) {
          console.error('Error fetching promotions:', error);
        }
      })();
    }
  }, [isOpen, staffInfo, fetchStaffInfo, orderItems, promos.length]);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      // Tạo CSS cho print
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px; }
            .bg-gray-50 { background-color: #f9f9f9 !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
          }
        </style>
      `;
      
      document.head.innerHTML = printStyles;
      document.body.innerHTML = printContent;
      
      window.print();
      
      // Khôi phục lại nội dung gốc
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload để khôi phục hoàn toàn
    }
  };

  if (!order) return null;

  return (
    <>
      <Button
        color="secondary"
        size="sm"
        onPress={onOpen}
        className={className}
        startContent="🖨️"
      >
        In hóa đơn
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 no-print">
                <h2>Xem trước hóa đơn</h2>
              </ModalHeader>
              <ModalBody>
                {staffLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner label="Đang tải thông tin nhân viên..." />
                  </div>
                ) : (
                  <div ref={printRef}>
                    <InvoiceContent order={order} orderItems={orderItems} totals={totals} staffInfo={staffInfo} />
                
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="no-print">
                <Button color="danger" variant="light" onPress={onClose}>
                  Đóng
                </Button>
                <Button 
                  color="primary" 
                  onPress={handlePrint}
                  disabled={staffLoading}
                >
                  {staffLoading ? (
                    <>
                      <Spinner size="sm" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      🖨️ In hóa đơn
                    </>
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default InvoicePrint; 