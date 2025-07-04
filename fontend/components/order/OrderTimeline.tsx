'use client';

import {
    CheckBadgeIcon,
    TruckIcon,
    ShoppingBagIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import TimelineStep from './TimelineStep';

export type OrderTimelineProps = {
    status: string;
};

export default function OrderTimeline({ status }: OrderTimelineProps) {
    const steps = [
        { key: 'Paid', label: 'Đã thanh toán', icon: CreditCardIcon },
        { key: 'Confirmed', label: 'Đã xác nhận', icon: CheckBadgeIcon },
        { key: 'Processing', label: 'Chờ vận chuyển', icon: TruckIcon },
        { key: 'Shipped', label: 'Đang vận chuyển', icon: TruckIcon },
        { key: 'Delivered', label: 'Đã hoàn thành', icon: ShoppingBagIcon },
    ];

    const currentIndex = steps.findIndex((s) => s.key === status);

    return (
        <div className="flex items-center justify-between mt-6 relative">
            {steps.map((step, idx) => (
                <TimelineStep
                    key={step.key}
                    icon={step.icon}
                    label={step.label}
                    active={idx <= currentIndex}
                    isFirst={idx === 0}
                    isLast={idx === steps.length - 1}
                />
            ))}
        </div>
    );
}
