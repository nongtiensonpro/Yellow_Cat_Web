// src/components/admin/AdminSidebar.tsx
import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import {
    LayoutDashboard, MessageSquare, Store, Receipt, Package, Users, User, Percent, LogOut
} from 'lucide-react'; // Import icons from lucide-react

interface AdminSidebarProps {
    onLinkClick: (section: string) => void;
    activeSection: string;
}

const sidebarItems = [
    { id: 'dashboard', label: 'Thống Kê', icon: LayoutDashboard },
    { id: 'at-counter', label: 'Tại Quầy', icon: Store },
    { id: 'orders', label: 'Hóa Đơn', icon: Receipt },
    { id: 'products', label: 'Quản Lý Sản Phẩm', icon: Package },
    { id: 'customers', label: 'Khách Hàng', icon: Users },
    { id: 'staff', label: 'Nhân Viên', icon: User },
    { id: 'discounts', label: 'Phiếu Giảm Giá', icon: Percent },
    // Logout will be handled by a separate function or link
    // { id: 'logout', label: 'Đăng xuất', icon: LogOut },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLinkClick, activeSection }) => {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col justify-between">
            <nav>
                <ul className="space-y-2">
                    {sidebarItems.map((item) => (
                        <li key={item.id}>
                            <a
                                href="#" // Use href="#" for client-side routing within the dashboard
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLinkClick(item.id);
                                }}
                                className={clsx(
                                    "flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
                                    { "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700": activeSection === item.id }
                                )}
                            >
                                <item.icon size={20} className="mr-3" />
                                <span className="font-medium">{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            {/* You might want a dedicated logout button here or keep it in the user dropdown */}
            {/* <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => console.log('Logout')} // Replace with your logout logic
                    className="flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 w-full text-left"
                >
                    <LogOut size={20} className="mr-3" />
                    <span className="font-medium">Đăng xuất</span>
                </button>
            </div> */}
        </aside>
    );
};