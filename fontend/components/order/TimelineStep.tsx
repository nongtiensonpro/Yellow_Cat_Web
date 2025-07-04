'use client';

import { ElementType } from 'react';

type TimelineStepProps = {
    icon: ElementType;
    label: string;
    active: boolean;
    isFirst: boolean;
    isLast: boolean;
};

export default function TimelineStep({
                                         icon: Icon,
                                         label,
                                         active,
                                         isFirst,
                                         isLast,
                                     }: TimelineStepProps) {
    return (
        <div className="flex flex-1 flex-col items-center relative">
            {/* Line trái */}
            {!isFirst && (
                <div
                    className={`absolute top-1/2 left-0 w-1/2 h-1 ${
                        active ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                ></div>
            )}

            {/* Line phải */}
            {!isLast && (
                <div
                    className={`absolute top-1/2 right-0 w-1/2 h-1 ${
                        active ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                ></div>
            )}

            {/* Icon */}
            <div
                className={`w-10 h-10 flex items-center justify-center rounded-full z-10 ${
                    active ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'
                }`}
            >
                <Icon className="w-5 h-5" />
            </div>

            {/* Label */}
            <p
                className={`mt-2 text-xs ${
                    active ? 'text-blue-600' : 'text-gray-400'
                }`}
            >
                {label}
            </p>
        </div>
    );
}
