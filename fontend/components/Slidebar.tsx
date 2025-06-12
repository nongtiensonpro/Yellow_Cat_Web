"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    BarChart2,
    Package,
    Percent,
    User,
    LayoutDashboard,
    RotateCcw, // icon trả hàng
} from "lucide-react";

const menuItems = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Thống kê" },
    { href: "/admin/order_management", icon: <BarChart2 size={18} />, label: "Đơn hàng" },
    { href: "/admin/product_management", icon: <Package size={18} />, label: "Sản phẩm" },
    { href: "/admin/promotion_management", icon: <Percent size={18} />, label: "Khuyến mãi" },
    { href: "/admin/return_management", icon: <RotateCcw size={18} />, label: "Trả hàng" }, // ✅ Mục mới
    { href: "/admin/account_management", icon: <User size={18} />, label: "Tài khoản" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Logo SneakPeak */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <Image src="/images/logo.png" alt="SneakPeak Logo" width={32} height={32} />
                <span className="text-xl font-bold text-orange-600">SneakPeak</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname === item.href
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
