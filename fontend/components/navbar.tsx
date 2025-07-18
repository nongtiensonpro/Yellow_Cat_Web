"use client";

import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarItem,
    NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/react";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { ThemeSwitch } from "./theme-switch";
import { Avatar } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { WishlistDropdown } from "./WishListDropdown";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import BadgeVisibility from "@/components/user/BadgeVisibility";
import { HeartIcon } from "@heroicons/react/24/solid";
import CheckoutUser from "./checkoutuser";
import { CldImage } from 'next-cloudinary';

// Extend Session type để có accessToken
interface ExtendedSession {
    accessToken: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

interface DecodedToken {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [clientId: string]: {
            roles: string[];
        };
    };
    exp?: number;
    [key: string]: unknown;
}

interface AppUser {
    appUserId: number;
    keycloakId: string;
    username: string;
    email: string;
    roles: string[];
    enabled: boolean;
    fullName: string;
    phoneNumber: string;
    avatarUrl: string;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: AppUser;
    error?: string;
    path?: string;
}

export const Navbar = () => {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [userProfile, setUserProfile] = useState<AppUser | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUserProfile = useCallback(async (keycloakId: string) => {
        if (!session) return;

        try {
            const extendedSession = session as unknown as ExtendedSession;
            const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${extendedSession.accessToken}`,
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch user profile:', response.status);
                return;
            }

            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status >= 200 && apiResponse.status < 300 && apiResponse.data) {
                setUserProfile(apiResponse.data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [session]);

    const handleLogout = useCallback(async () => {
        try {
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
            if (!issuer || !clientId) {
                await signOut({ redirect: false });
                router.push(homeUrl);
                return;
            }
            const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;
            await signOut({ redirect: false });
            window.location.href = keycloakLogoutUrl;
        } catch (error) {
            console.error("Error during logout:", error);
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            window.location.href = homeUrl;
        }
    }, [router]);

    useEffect(() => {
        const updateWishlistCount = () => {
            const stored = localStorage.getItem("wishlist");
            if (stored) {
                try {
                    const items = JSON.parse(stored);
                    setWishlistCount(Array.isArray(items) ? items.length : 0);
                } catch (e) {
                    console.error("Failed to parse wishlist from localStorage for count:", e);
                    setWishlistCount(0);
                }
            } else {
                setWishlistCount(0);
            }
        };

        updateWishlistCount();

        window.addEventListener("wishlistUpdated", updateWishlistCount);

        return () => {
            window.removeEventListener("wishlistUpdated", updateWishlistCount);
        };
    }, []);

    useEffect(() => {
        const checkTokenAndAdminStatus = () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated' || !session) {
                setIsTokenValid(true);
                setIsAdmin(false);
                setUserProfile(null);
                return;
            }

            try {
                const extendedSession = session as unknown as ExtendedSession;
                const accessToken = extendedSession.accessToken;
                if (!accessToken) {
                    setIsTokenValid(false);
                    setIsAdmin(false);
                    setUserProfile(null);
                    return;
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                const currentTime = Math.floor(Date.now() / 1000);
                if (tokenData.exp && tokenData.exp < currentTime) {
                    setIsTokenValid(false);
                    setIsAdmin(false);
                    setUserProfile(null);
                    handleLogout();
                    return;
                }

                setIsTokenValid(true);
                let hasAdminRole = false;
                const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                const realmRoles = tokenData.realm_access?.roles || [];
                if (clientRoles.includes("Admin_Web") || realmRoles.includes("Admin_Web")) {
                    hasAdminRole = true;
                }
                setIsAdmin(hasAdminRole);

                // Fetch user profile from database
                if (tokenData.sub) {
                    fetchUserProfile(tokenData.sub);
                }
            } catch (error) {
                setIsTokenValid(false);
                setIsAdmin(false);
                setUserProfile(null);
                if (error instanceof Error && error.message.includes('Invalid token')) {
                    handleLogout(); // Log out if token is invalid
                }
            }
        };

        checkTokenAndAdminStatus();
    }, [session, status, fetchUserProfile, handleLogout]);

    const handleLogin = () => {
        signIn("keycloak", { callbackUrl: window.location.href });
    };

    const renderAuthSection = () => {
        if (status === "loading") {
            return <Button isLoading className="bg-primary-500/20 text-primary">Loading...</Button>;
        }
        if (!isTokenValid || status === 'unauthenticated' || !session) {
            return <Button onClick={handleLogin} className="bg-primary-500/20 text-primary">Login</Button>;
        }

        const userName = userProfile?.fullName || session.user?.name || session.user?.email || "User";

        return (
            <Dropdown placement="bottom-end">
                <DropdownTrigger>
                    {userProfile?.avatarUrl ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-secondary cursor-pointer hover:scale-105 transition-transform">
                            <CldImage
                                width={32}
                                height={32}
                                src={userProfile.avatarUrl}
                                alt={userName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <Avatar
                            isBordered
                            as="button"
                            className="transition-transform"
                            color="secondary"
                            name={userName}
                            size="sm"
                            src={session.user?.image || undefined}
                        />
                    )}
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                    <DropdownItem key="profile" className="h-14 gap-2">
                        <p className="font-semibold">Signed in as</p>
                        <p className="font-semibold">{userProfile?.email || session.user?.email}</p>
                    </DropdownItem>
                    {isAdmin ? <DropdownItem key="admin_dashboard"  onClick={() => router.push('/admin')}>Admin Dashboard</DropdownItem> : null}
                    <DropdownItem key="user_info" onClick={() => router.push('/user_info')}>User Profile</DropdownItem>
                    <DropdownItem key="logout" className="text-danger" color="danger" onClick={handleLogout}>Log Out</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    };

    const linkBaseClass = "text-lg font-semibold transition-colors";
    const activeLinkClass = "text-orange-500 hover:text-orange-600";
    const inactiveLinkClass = "text-gray-700 hover:text-orange-500";

    return (
        <HeroUINavbar maxWidth="full" position="static" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="py-4 flex-col">
            {/* Component ẩn để đồng bộ dữ liệu người dùng */}
            <CheckoutUser />

            <div className="w-24 h-auto relative transform translate-x-20">
                <Image
                    src="/images/img_1.png"
                    alt="Logo"
                    width={96}
                    height={96}
                    className="object-contain w-full h-full"
                    priority
                />
            </div>

            <NavbarContent className="hidden sm:flex basis-full justify-center" justify="center">
                <ul className="flex gap-8 items-center">
                    <NavbarItem><NextLink className={clsx(linkBaseClass, pathname === "/" ? activeLinkClass : inactiveLinkClass)} href="/">Trang chủ</NextLink></NavbarItem>
                    <NavbarItem><NextLink className={clsx(linkBaseClass, pathname?.startsWith("/products") ? activeLinkClass : inactiveLinkClass)} href="/products">Sản phẩm</NextLink></NavbarItem>
                    <NavbarItem><NextLink className={clsx(linkBaseClass, pathname?.startsWith("/about") ? activeLinkClass : inactiveLinkClass)} href="/about">Giới thiệu</NextLink></NavbarItem>
                    <NavbarItem><NextLink className={clsx(linkBaseClass, pathname?.startsWith("/contact") ? activeLinkClass : inactiveLinkClass)} href="/contact">Liên hệ</NextLink></NavbarItem>
                </ul>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
                <BadgeVisibility /> {/* Kiểm tra lại đường dẫn import này */}
                <NavbarItem className="hidden sm:flex gap-2 items-center">
                    <ThemeSwitch /> {/* Kiểm tra lại đường dẫn import này */}
                    <Popover placement="bottom-end">
                        <PopoverTrigger>
                            <div className="relative cursor-pointer">
                                <button className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
                                    <HeartIcon className="w-6 h-6 text-red-500" />
                                </button>
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        {wishlistCount}
                                    </span>
                                )}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="z-[999] bg-white shadow-lg rounded-lg p-0">
                            <WishlistDropdown />
                        </PopoverContent>
                    </Popover>
                </NavbarItem>
                <NavbarItem className="hidden md:flex">
                    {renderAuthSection()}
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
                <ThemeSwitch />
                <Popover placement="bottom-end">
                    <PopoverTrigger>
                        <div className="relative cursor-pointer">
                            <button className="p-2 rounded-full bg-white shadow hover:bg-gray-100">
                                <HeartIcon className="w-6 h-6 text-red-500" />
                            </button>
                            {wishlistCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {wishlistCount}
                                </span>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="z-[999] bg-white shadow-lg rounded-lg p-0">
                        <WishlistDropdown />
                    </PopoverContent>
                </Popover>
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    <NavbarMenuItem><Link className={clsx("text-foreground", pathname === "/" && "font-semibold text-orange-500")} href="/" size="lg">Trang chủ</Link></NavbarMenuItem>
                    <NavbarMenuItem><Link className={clsx("text-foreground", pathname?.startsWith("/products") && "font-semibold text-orange-500")} href="/products" size="lg">Sản phẩm</Link></NavbarMenuItem>
                    <NavbarMenuItem><Link className={clsx("text-foreground", pathname?.startsWith("/about") && "font-semibold text-orange-500")} href="/about" size="lg">Giới thiệu</Link></NavbarMenuItem>
                    <NavbarMenuItem><Link className={clsx("text-foreground", pathname?.startsWith("/contact") && "font-semibold text-orange-500")} href="/contact" size="lg">Liên hệ</Link></NavbarMenuItem>
                    {isAdmin && <NavbarMenuItem><Link className={clsx("text-foreground", pathname?.startsWith("/admin") && "font-semibold text-orange-500")} href="/admin" size="lg">Admin Dashboard</Link></NavbarMenuItem>}
                    <NavbarMenuItem><Link className={clsx("text-foreground", pathname?.startsWith("/wishlist") && "font-semibold text-orange-500")} href="/wishlist" size="lg">Danh sách yêu thích</Link></NavbarMenuItem>
                    <NavbarMenuItem>{renderAuthSection()}</NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};
