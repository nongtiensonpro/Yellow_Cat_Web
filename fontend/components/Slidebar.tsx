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
    RotateCcw,
    FileText,
    Layers,
    Shirt,
    Box,
    Tag,
    Palette,
    Ruler,
    Target,
    Store,
    ListOrdered
} from "lucide-react";
import { useState } from "react";
interface MenuItem {
    href?: string;
    icon: React.ReactNode;
    label: string;
    children?: MenuItem[];
}
const menuItems: MenuItem[] = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Thống kê" },
    { href: "/staff/officesales", icon: <Store size={18} />, label: "Bán hàng tại quầy" },
    { href: "/admin/order_management", icon: <ListOrdered size={18} />, label: "Đơn hàng" },
    {
        href: "/admin/product_management",
        icon: <Package size={18} />,
        label: "Quản lý sản phẩm",
        children: [
            { href: "/admin/product_management", icon: <Package size={18} />, label: "Sản phẩm" },
            { href: "/admin/product_management/categories", icon: <Ruler size={18} />, label: "Danh mục" },
            { href: "/admin/product_management/materials", icon: <Box size={18} />, label: "Chất liệu" },
            { href: "/admin/product_management/brands", icon: <Tag size={18} />, label: "Thương hiệu" },
            { href: "/admin/product_management/colors", icon: <Palette size={18} />, label: "Màu sắc" },
            { href: "/admin/product_management/sizes", icon: <Ruler size={18} />, label: "Kích cỡ" },

            // { href: "/admin/product_management/targetaudiences", icon: <Ruler size={18} />, label: "Đối tượng" },

        ],
    },
    { href: "/admin/promotion_management/vouchers", icon: <Percent size={18} />, label: "Khuyến mãi" },
    { href: "/admin/promotion_products", icon: <Percent size={18} />, label: "Đợt giảm giá" },
    { href: "/admin/return_management", icon: <RotateCcw size={18} />, label: "Trả hàng" },
    { href: "/admin/invoice_management", icon: <FileText size={18} />, label: "Hóa đơn" },
    { href: "/admin/account_management", icon: <User size={18} />, label: "Tài khoản" },
];

// Component Sidebar chính
export default function Sidebar() {
    const pathname: string = usePathname() || "";
    const [isProductMenuOpen, setIsProductMenuOpen] = useState(pathname.startsWith("/admin/product_management"));
    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Logo SneakPeak */}
            <Link href={'/'} className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <Image src="/images/logo.png" alt="SneakPeak Logo" width={32} height={32} />
                <span className="text-xl font-bold text-orange-600">SneakPeak</span>
            </Link>

            {/* Khối điều hướng chính */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => (

                    <div key={item.label}>
                        {item.children ? (
                            <>
                                <button
                                    onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        pathname.startsWith(item.href || "")
                                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        {item.icon}
                                        {item.label}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isProductMenuOpen ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                                {isProductMenuOpen && ( // Chỉ render các mục con nếu menu cha đang mở
                                    <div className="ml-6 mt-1 space-y-1"> {/* Thụt lề và khoảng cách cho các mục con */}
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href as string} // Các mục con luôn có href
                                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                                    pathname === child.href
                                                        ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" // Màu highlight khác cho mục con
                                                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                • {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                href={item.href as string}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    pathname === item.href
                                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}