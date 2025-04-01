"use client";

import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useAuthStore } from "@/keycloak/store";
import NextLink from "next/link";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
    MdSearch,
    MdMenu,
    MdClose,
    MdDashboard,
    MdSettings,
    MdPerson,
    MdExitToApp,
    MdLightMode,
    MdDarkMode,
    MdExpandMore,
    MdChevronRight
} from 'react-icons/md';
import { FaGithub } from 'react-icons/fa';
import { siteConfig } from "@/config/site";
import LoadingSpinner from "@/components/LoadingSpinner";

// Định nghĩa kiểu dữ liệu người dùng
interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    realmRoles: string[];
    clientRoles: string[];
    enabled: boolean;
}

export const Navbar = () => {
    // States
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
    const [isAdminView, setIsAdminView] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [searchExpanded, setSearchExpanded] = useState<boolean>(false);
    const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

    // Hooks
    const { keycloak, initialized } = useKeycloak();
    const { isAuthenticated, login, logout } = useAuthStore();

    // Lấy thông tin người dùng từ Keycloak
    useEffect(() => {
        const getUserInfo = () => {
            if (!initialized) return;

            try {
                const tokenParsed = keycloak.tokenParsed || {};
                const clientId = keycloak.clientId || '';
                const clientRoles = clientId && tokenParsed.resource_access?.[clientId]?.roles || [];

                const userData: User = {
                    id: tokenParsed.sub || '',
                    username: tokenParsed.preferred_username || '',
                    email: tokenParsed.email || '',
                    firstName: tokenParsed.given_name || '',
                    lastName: tokenParsed.family_name || '',
                    roles: tokenParsed.realm_access?.roles || [],
                    realmRoles: tokenParsed.realm_access?.roles || [],
                    clientRoles: clientRoles,
                    enabled: true
                };

                setUser(userData);
            } catch (err) {
                console.error("Không thể lấy thông tin người dùng:", err);
            } finally {
                setLoading(false);
            }
        };

        getUserInfo();
    }, [keycloak, initialized]);

    // Đọc theme từ localStorage khi component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            // Mặc định theo system preference
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', isDark);
        }
    }, []);

    // Toggle theme function
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    // Kiểm tra người dùng có phải admin không
    const isAdmin = user?.roles?.includes('Admin_Web') || user?.clientRoles?.includes('Admin_Web') || false;

    // Xác định menu items hiện tại
    const currentMenuItems = isAdmin && isAdminView
        ? siteConfig.navMenuItemsAdmin || []
        : siteConfig.navItems;

    // Loading state
    if (!initialized || loading) {
        return <LoadingSpinner />;
    }

    // Render UserInfo component
    const renderUserInfo = () => {
        if (!isAuthenticated) {
            return (
                <button
                    onClick={() => login()}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    Đăng nhập
                </button>
            );
        }

        const displayName = user?.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user?.username || 'Người dùng';

        return (
            <div className="relative">
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block max-w-32 truncate">{displayName}</span>
                    <MdExpandMore
                        className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                        size={20}
                    />
                </button>

                <AnimatePresence>
                    {userMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
                        >
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                {siteConfig.navMenuItems.map((item) => (
                                    <NextLink
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                    <span className="mr-2">
                      <MdPerson size={18} />
                    </span>
                                        {item.label}
                                    </NextLink>
                                ))}
                            </div>
                            <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        logout();
                                        setUserMenuOpen(false);
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                  <span className="mr-2">
                    <MdExitToApp size={18} />
                  </span>
                                    Đăng xuất
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <header className="sticky top-0 z-40 w-full backdrop-blur supports-backdrop-blur:bg-white/60 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo và Brand */}
                    <div className="flex items-center">
                        <NextLink href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                                <span className="text-white font-bold">YC</span>
                            </div>
                            <span className="font-bold text-lg hidden sm:inline-block">Yellow Cat Company</span>
                        </NextLink>
                    </div>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {/* Admin Toggle (if admin) */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsAdminView(!isAdminView)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors mr-2",
                                    isAdminView
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                )}
                            >
                                {isAdminView ? "Admin View" : "Admin Mode"}
                            </button>
                        )}

                        {/* Menu Items */}
                        {currentMenuItems.map((item) => (
                            <NextLink
                                key={item.href}
                                href={item.href}
                                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                            >
                                {item.label}
                            </NextLink>
                        ))}
                    </nav>

                    {/* Right Side Items */}
                    <div className="flex items-center space-x-2">
                        {/* Search */}
                        <div className={clsx(
                            "relative transition-all duration-300 ease-in-out flex items-center",
                            searchExpanded ? "w-64" : "w-10"
                        )}>
                            <input
                                type="text"
                                placeholder="Search..."
                                className={clsx(
                                    "h-10 rounded-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 text-sm transition-all duration-300 pl-10 pr-3 w-full",
                                    searchExpanded ? "opacity-100" : "opacity-0"
                                )}
                                onBlur={() => setTimeout(() => setSearchExpanded(false), 200)}
                            />
                            <button
                                onClick={() => setSearchExpanded(true)}
                                className="absolute left-0 p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <MdSearch size={20} />
                            </button>
                        </div>

                        {/* GitHub Link */}
                        <a
                            href={siteConfig.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <FaGithub size={20} />
                        </a>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
                        </button>

                        {/* User Menu */}
                        {renderUserInfo()}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden"
                    >
                        <div className="container mx-auto px-4 pb-4 pt-2 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            {/* Admin Toggle (if admin) */}
                            {isAdmin && (
                                <button
                                    onClick={() => setIsAdminView(!isAdminView)}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                        isAdminView
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                                            : "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800"
                                    )}
                                >
                  <span className="flex items-center">
                    <MdDashboard className="mr-3" size={20} />
                      {isAdminView ? "Admin View" : "Switch to Admin Mode"}
                  </span>
                                    <MdChevronRight
                                        className={`transition-transform ${isAdminView ? 'rotate-90' : ''}`}
                                        size={20}
                                    />
                                </button>
                            )}

                            {/* Menu Items */}
                            {currentMenuItems.map((item) => (
                                <NextLink
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    {item.label}
                                </NextLink>
                            ))}

                            {/* Search in Mobile View */}
                            <div className="px-4 py-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full h-10 rounded-md bg-gray-100 dark:bg-gray-800 border-transparent focus:border-gray-300 dark:focus:border-gray-600 focus:ring-0 text-sm pl-10"
                                    />
                                    <div className="absolute left-0 top-0 p-2 text-gray-500 dark:text-gray-400">
                                        <MdSearch size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* User Menu Items for Mobile */}
                            {isAuthenticated && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Tài khoản
                                    </p>
                                    {siteConfig.navMenuItems.map((item) => (
                                        <NextLink
                                            key={`mobile-${item.href}`}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <MdPerson className="mr-3" size={18} />
                                            {item.label}
                                        </NextLink>
                                    ))}
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center px-4 py-3 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <MdExitToApp className="mr-3" size={18} />
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};