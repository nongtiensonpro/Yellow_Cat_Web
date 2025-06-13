'use client';

import { useState } from 'react';
import { createPayment } from '@/app/staff/officesales/vnpay/service/vnpayService';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner
} from "@heroui/react";

interface PaymentModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    orderAmount: number;
    orderCode: string;
}

export default function PaymentModal({ isOpen, onOpenChange, orderAmount, orderCode }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const response = await createPayment({
                amount: orderAmount,
                orderType: 'billpayment',
                orderInfo: `${orderCode}`,
                language: 'vn',
                returnUrl: `${window.location.origin}/staff/officesales/vnpay/payment-result`,
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

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader>Thanh toán đơn hàng</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="font-medium">Mã đơn hàng:</span>
                            <span>{orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Số tiền thanh toán:</span>
                            <span className="text-primary font-bold">{orderAmount.toLocaleString('vi-VN')} VND</span>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onOpenChange}>
                        Hủy
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handlePayment}
                        disabled={loading}
                    >
                        {loading ? <Spinner color="white" size="sm" /> : "Thanh toán ngay"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 