"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    Package,
    Percent,
    User,
    LayoutDashboard,
    RotateCcw,
    FileText,
    Box,
    Tag,
    Palette,
    Ruler,
    Store,
    ChevronRight,
    TicketPercent
} from "lucide-react";


interface MenuItem {
    href?: string;
    icon: React.ReactNode;
    label: string;
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    { href: "/admin/statistics", icon: <LayoutDashboard size={18} />, label: "Thống kê" },
    { href: "/staff/officesales", icon: <Store size={18} />, label: "Bán hàng tại quầy" },
    { href: "/admin/invoices", icon: <FileText size={18} />, label: "Hóa đơn" },
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
        ],
    },
    {
        href: "/admin/promotion_management",
        // BẮT ĐẦU THAY ĐỔI: Cập nhật icon mới
        icon: <TicketPercent size={18} />,
        // KẾT THÚC THAY ĐỔI
        label: "Quản lý khuyến mại",
        children: [
            { href: "/admin/promotion_management/vouchers", icon: <Percent size={18} />, label: "Phiếu giảm giá" },
            { href: "/admin/promotion_products", icon: <Percent size={18} />, label: "Đợt giảm giá" },
            // { href: "/admin/promotion_order", icon: <Percent size={18} />, label: "Giảm giá theo hóa đơn" },
        ],
    },
    { href: "/admin/return_management", icon: <RotateCcw size={18} />, label: "Trả hàng" },
    { href: "/admin/account_management", icon: <User size={18} />, label: "Tài khoản" },
    // { href: "/admin/chat", icon: <MessageCircle size={18} />, label: "Chat" },
];

interface MenuItemComponentProps {
    item: MenuItem;
    currentPath: string;
    openMenus: Record<string, boolean>;
    toggleMenu: (label: string) => void;
}

const MenuItemComponent = ({ item, currentPath, openMenus, toggleMenu }: MenuItemComponentProps) => {
    const isActive = item.href && (currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href)));
    const isMenuOpen = item.children && openMenus[item.label];

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => toggleMenu(item.label)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                >
                    <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="pl-5 pt-2 space-y-1">
                        {item.children.map((child: MenuItem) => (
                            <a
                                key={child.label}
                                href={child.href as string}
                                className={`flex items-center gap-3 pl-3 pr-2 py-2 rounded-md text-sm transition-colors relative ${
                                    currentPath === child.href
                                        ? "text-orange-600 font-semibold"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                <span className={`absolute left-0 h-full w-0.5 ${currentPath === child.href ? 'bg-orange-500' : ''}`}></span>
                                {child.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <a
            href={item.href as string}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
        >
            {item.icon}
            {item.label}
        </a>
    );
};


// Component Sidebar chính
export default function Sidebar() {
    const pathname = usePathname();

    // BẮT ĐẦU THAY ĐỔI: Logic quản lý trạng thái mở/đóng cho nhiều menu
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const activeMenus: Record<string, boolean> = {};
        menuItems.forEach(item => {
            if (item.children && item.href && pathname && pathname.startsWith(item.href)) {
                activeMenus[item.label] = true;
            }
        });
        setOpenMenus(activeMenus);
    }, [pathname]);

    const handleMenuToggle = (label: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };
    // KẾT THÚC THAY ĐỔI

    return (
        <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Logo SneakPeak */}
            <a href={'http://localhost:3000'} className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xl font-bold text-orange-600">SneakPeak</span>
            </a>


            {/* Khối điều hướng chính */}
            <nav className="flex-1 px-4 py-4 space-y-1.5">
                {menuItems.map((item) => (
                    <MenuItemComponent
                        key={item.label}
                        item={item}
                        currentPath={pathname || ''}
                        openMenus={openMenus}
                        toggleMenu={handleMenuToggle}
                    />
                ))}
            </nav>
        </aside>
    );
}