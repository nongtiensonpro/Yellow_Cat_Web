'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    User, ShoppingCart, Heart, MapPin, Home
} from 'lucide-react';

const MENU_ITEMS = [
    { label: 'Thông tin tài khoản', href: '/user_info', icon: <User size={18} /> },
    { label: 'Quản lý đơn hàng', href: '/user_info/order', icon: <ShoppingCart size={18} /> },
    // { label: 'Mã giảm giá', href: '/user_info/vouchers', icon: <Percent size={18} /> },
    { label: 'Sản phẩm yêu thích', href: '/wishlist', icon: <Heart size={18} /> },
    { label: 'Địa chỉ', href: '/user_info/address_management', icon: <MapPin size={18} /> },
    { label: 'Quay về trang chủ', href: '/', icon: <Home size={18} /> },
];

export default function UserSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-64 bg-white p-4 border-r">
            <nav className="space-y-4">
                {MENU_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded 
              ${pathname === item.href ? 'text-blue-600 font-semibold' : 'text-gray-800 hover:bg-gray-100'}
            `}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
