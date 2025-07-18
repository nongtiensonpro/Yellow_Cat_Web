// "use client";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import {
//     Package,
//     Percent,
//     User,
//     LayoutDashboard,
//     RotateCcw,
//     FileText,
//     Box,
//     Tag,
//     Palette,
//     Ruler,
//     Store,
// } from "lucide-react";
// import { useState } from "react";
// interface MenuItem {
//     href?: string;
//     icon: React.ReactNode;
//     label: string;
//     children?: MenuItem[];
// }
// const menuItems: MenuItem[] = [
//     { href: "/admin/statistics", icon: <LayoutDashboard size={18} />, label: "Thống kê" },
//     { href: "/staff/officesales", icon: <Store size={18} />, label: "Bán hàng tại quầy" },
//     { href: "/admin/order/officesales", icon: <FileText size={18} />, label: "Hóa đơn" },
//     {
//         href: "/admin/product_management",
//         icon: <Package size={18} />,
//         label: "Quản lý sản phẩm",
//         children: [
//             { href: "/admin/product_management", icon: <Package size={18} />, label: "Sản phẩm" },
//             { href: "/admin/product_management/categories", icon: <Ruler size={18} />, label: "Danh mục" },
//             { href: "/admin/product_management/materials", icon: <Box size={18} />, label: "Chất liệu" },
//             { href: "/admin/product_management/brands", icon: <Tag size={18} />, label: "Thương hiệu" },
//             { href: "/admin/product_management/colors", icon: <Palette size={18} />, label: "Màu sắc" },
//             { href: "/admin/product_management/sizes", icon: <Ruler size={18} />, label: "Kích cỡ" },
//
//             // { href: "/admin/product_management/targetaudiences", icon: <Ruler size={18} />, label: "Đối tượng" },
//
//         ],
//     },
//     { href: "/admin/promotion_management/vouchers", icon: <Percent size={18} />, label: "Khuyến mãi" },
//     { href: "/admin/promotion_products", icon: <Percent size={18} />, label: "Đợt giảm giá" },
//     { href: "/admin/promotion_order", icon: <Percent size={18} />, label: "Giảm giá theo hóa đơn" },
//     { href: "/admin/return_management", icon: <RotateCcw size={18} />, label: "Trả hàng" },
//     { href: "/admin/account_management", icon: <User size={18} />, label: "Tài khoản" },
// ];
//
// // Component Sidebar chính
// export default function Sidebar() {
//     const pathname: string = usePathname() || "";
//     const [isProductMenuOpen, setIsProductMenuOpen] = useState(pathname.startsWith("/admin/product_management"));
//     return (
//         <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-800 flex flex-col">
//             {/* Logo SneakPeak */}
//             <Link href={'/admin'} className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
//                 <Image src="/images/logo.png" alt="SneakPeak Logo" width={32} height={32} />
//                 <span className="text-xl font-bold text-orange-600">SneakPeak</span>
//             </Link>
//
//             {/* Khối điều hướng chính */}
//             <nav className="flex-1 px-4 py-6 space-y-2">
//                 {menuItems.map((item) => (
//
//                     <div key={item.label}>
//                         {item.children ? (
//                             <>
//                                 <button
//                                     onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
//                                     className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                                         pathname.startsWith(item.href || "")
//                                             ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
//                                             : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
//                                     }`}
//                                 >
//                                     <span className="flex items-center gap-3">
//                                         {item.icon}
//                                         {item.label}
//                                     </span>
//                                     <svg
//                                         className={`w-4 h-4 transition-transform ${isProductMenuOpen ? 'rotate-90' : ''}`}
//                                         fill="none"
//                                         stroke="currentColor"
//                                         viewBox="0 0 24 24"
//                                         xmlns="http://www.w3.org/2000/svg"
//                                     >
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
//                                     </svg>
//                                 </button>
//                                 {isProductMenuOpen && ( // Chỉ render các mục con nếu menu cha đang mở
//                                     <div className="ml-6 mt-1 space-y-1"> {/* Thụt lề và khoảng cách cho các mục con */}
//                                         {item.children.map((child) => (
//                                             <Link
//                                                 key={child.href}
//                                                 href={child.href as string} // Các mục con luôn có href
//                                                 className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
//                                                     pathname === child.href
//                                                         ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20" // Màu highlight khác cho mục con
//                                                         : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
//                                                 }`}
//                                             >
//                                                 • {child.label}
//                                             </Link>
//                                         ))}
//                                     </div>
//                                 )}
//                             </>
//                         ) : (
//                             <Link
//                                 href={item.href as string}
//                                 className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                                     pathname === item.href
//                                         ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
//                                         : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
//                                 }`}
//                             >
//                                 {item.icon}
//                                 {item.label}
//                             </Link>
//                         )}
//                     </div>
//                 ))}
//             </nav>
//         </aside>
//     );
// }




"use client";
import { useState, useEffect } from "react";
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
    TicketPercent // Icon mới
} from "lucide-react";

// NOTE: Next.js specific imports (Link, Image, usePathname) have been replaced
// with standard web APIs (a, img, window.location.pathname) for compatibility.

interface MenuItem {
    href?: string;
    icon: React.ReactNode;
    label: string;
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    { href: "/admin/statistics", icon: <LayoutDashboard size={18} />, label: "Thống kê" },
    { href: "/staff/officesales", icon: <Store size={18} />, label: "Bán hàng tại quầy" },
    { href: "/admin/order/officesales", icon: <FileText size={18} />, label: "Hóa đơn" },
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
            { href: "/admin/promotion_order", icon: <Percent size={18} />, label: "Giảm giá theo hóa đơn" },
        ],
    },
    { href: "/admin/return_management", icon: <RotateCcw size={18} />, label: "Trả hàng" },
    { href: "/admin/account_management", icon: <User size={18} />, label: "Tài khoản" },
];

// Component con cho một mục menu
const MenuItemComponent = ({ item, currentPath, openMenus, toggleMenu }: any) => {
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
    const pathname: string = typeof window !== "undefined" ? window.location.pathname : "";

    // BẮT ĐẦU THAY ĐỔI: Logic quản lý trạng thái mở/đóng cho nhiều menu
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const activeMenus: Record<string, boolean> = {};
        menuItems.forEach(item => {
            if (item.children && item.href && pathname.startsWith(item.href)) {
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
            <a href={'/admin'} className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <img src="https://placehold.co/32x32/F97316/FFFFFF?text=S" alt="SneakPeak Logo" width={32} height={32} className="rounded-md"/>
                <span className="text-xl font-bold text-orange-600">SneakPeak</span>
            </a>


            {/* Khối điều hướng chính */}
            <nav className="flex-1 px-4 py-4 space-y-1.5">
                {menuItems.map((item) => (
                    <MenuItemComponent
                        key={item.label}
                        item={item}
                        currentPath={pathname}
                        openMenus={openMenus}
                        toggleMenu={handleMenuToggle}
                    />
                ))}
            </nav>
        </aside>
    );
}
