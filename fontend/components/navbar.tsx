"use client";

import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarItem,
    NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/theme-switch";
import { Avatar } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; // Import usePathname
import { jwtDecode } from 'jwt-decode';
import BadgeVisibility from "@/components/user/BadgeVisibility";

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
    [key: string]: any;
}

export const Navbar = () => {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // Get the current path

    useEffect(() => {
        const checkTokenAndAdminStatus = () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setIsTokenValid(true);
                setIsAdmin(false);
                return;
            }

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) {
                    console.warn("Không tìm thấy access token");
                    setIsTokenValid(false);
                    setIsAdmin(false);
                    return;
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);

                const currentTime = Math.floor(Date.now() / 1000);
                if (tokenData.exp && tokenData.exp < currentTime) {
                    console.warn("Access token đã hết hạn");
                    setIsTokenValid(false);
                    setIsAdmin(false);
                    handleLogout();
                    return;
                }

                setIsTokenValid(true);

                let hasAdminRole = false;
                const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                if (clientRoles.includes("Admin_Web")) {
                    hasAdminRole = true;
                }

                const realmRoles = tokenData.realm_access?.roles || [];
                if (realmRoles.includes("Admin_Web")) {
                    hasAdminRole = true;
                }

                console.log("Admin role check result:", {
                    hasAdminRole,
                    clientRoles,
                    realmRoles,
                    tokenExp: tokenData.exp,
                    currentTime
                });

                setIsAdmin(hasAdminRole);

            } catch (error) {
                console.error("Lỗi khi decode access token:", error);
                setIsTokenValid(false);
                setIsAdmin(false);

                if (error instanceof Error && error.message.includes('Invalid token')) {
                    handleLogout();
                }
            }
        };

        checkTokenAndAdminStatus();
    }, [session, status]);

    const handleLogout = async () => {
        try {
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

            if (!issuer || !clientId) {
                console.error("Lỗi: Biến môi trường Keycloak cho logout chưa được cấu hình.");
                await signOut({ redirect: false });
                router.push(homeUrl);
                return;
            }

            const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;
            await signOut({ redirect: false });
            window.location.href = keycloakLogoutUrl;
        } catch (error) {
            console.error("Logout error:", error);
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            window.location.href = homeUrl;
        }
    };

    const handleLogin = () => {
        signIn("keycloak", { callbackUrl: window.location.href });
    };

    const renderAuthSection = () => {
        if (status === "loading") {
            return <Button isLoading className="bg-primary-500/20 text-primary">Loading...</Button>;
        }

        if (!isTokenValid || status === 'unauthenticated' || !session) {
            return (
                <Button
                    onClick={handleLogin}
                    className="bg-primary-500/20 text-primary"
                >
                    Login
                </Button>
            );
        }

        return (
            <Dropdown placement="bottom-end">
                <DropdownTrigger>
                    <Avatar
                        isBordered
                        as="button"
                        className="transition-transform"
                        color="secondary"
                        name={session.user?.name || session.user?.email || "User"}
                        size="sm"
                        src={session.user?.image || undefined}
                    />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                    <DropdownItem key="profile" className="h-14 gap-2">
                        <p className="font-semibold">Signed in as</p>
                        <p className="font-semibold">{session.user?.email}</p>
                    </DropdownItem>
                    {isAdmin ? (
                        <DropdownItem key="admin_dashboard" href="/admin">
                            Admin Dashboard
                        </DropdownItem>
                    ) : null}
                    <DropdownItem
                        key="user_info"
                        onClick={() => router.push('/user_info')}
                    >
                        User Profile
                    </DropdownItem>
                    <DropdownItem
                        key="logout"
                        className="text-danger"
                        color="danger"
                        onClick={handleLogout}
                    >
                        Log Out
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    };

    // Base classes for consistent styling
    const linkBaseClass = "text-lg font-semibold transition-colors";
    // Active link styles
    const activeLinkClass = "text-orange-500 hover:text-orange-600";
    // Inactive link styles
    const inactiveLinkClass = "text-gray-700 hover:text-orange-500";


    return (
        <HeroUINavbar maxWidth="full" position="static" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="py-4 flex-col">
            <div className="w-24 h-auto relative transform translate-x-20"> {/* Thêm transform và translate-x-4 */}
                <img
                    src="/images/img_1.png"
                    alt="Logo"
                    className="object-contain w-full h-full"
                />
            </div>

            <NavbarContent className="hidden sm:flex basis-full justify-center" justify="center">
                <ul className="flex gap-8 items-center">
                    <NavbarItem>
                        <NextLink
                            className={clsx(linkBaseClass, pathname === "/" ? activeLinkClass : inactiveLinkClass)}
                            href="/"
                        >
                            Trang chủ
                        </NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink
                            className={clsx(
  linkBaseClass,
  (pathname?.startsWith("/products") ? activeLinkClass : inactiveLinkClass),
  "flex items-center gap-1"
)}
                            href="/products"
                        >
                            Sản phẩm
                        </NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink
                            className={clsx(
  linkBaseClass,
  (pathname?.startsWith("/about") ? activeLinkClass : inactiveLinkClass)
)}
                            href="/about"
                        >
                            Giới thiệu
                        </NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink
                            className={clsx(
  linkBaseClass,
  (pathname?.startsWith("/contact") ? activeLinkClass : inactiveLinkClass)
)}
                            href="/contact"
                        >
                            Liên hệ
                        </NextLink>
                    </NavbarItem>
                </ul>
            </NavbarContent>

            {/* Right-aligned items for user and theme switch */}
            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
                <BadgeVisibility/>
                <NavbarItem className="hidden sm:flex gap-2">
                    <ThemeSwitch />
                </NavbarItem>
                <NavbarItem className="hidden md:flex">
                    {renderAuthSection()}
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Menu Toggle */}
            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
                <ThemeSwitch />
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"}/>
            </NavbarContent>

            {/* Mobile Menu */}
            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    <NavbarMenuItem>
                        <Link className={clsx("text-foreground", pathname === "/" && "font-semibold text-orange-500")} href="/" size="lg">Trang chủ</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link
  className={clsx(
    "text-foreground",
    pathname?.startsWith("/products") && "font-semibold text-orange-500"
  )}
  href="/products"
  size="lg"
>
  Sản phẩm
</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link
  className={clsx(
    "text-foreground",
    pathname?.startsWith("/about") && "font-semibold text-orange-500"
  )}
  href="/about"
  size="lg"
>
  Giới thiệu
</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link
  className={clsx(
    "text-foreground",
    pathname?.startsWith("/contact") && "font-semibold text-orange-500"
  )}
  href="/contact"
  size="lg"
>
  Liên hệ
</Link>
                    </NavbarMenuItem>
                    {isAdmin && (
                        <NavbarMenuItem>
                            <Link
  className={clsx(
    "text-foreground",
    pathname?.startsWith("/admin") && "font-semibold text-orange-500"
  )}
  href="/admin"
  size="lg"
>
  Admin Dashboard
</Link>
                        </NavbarMenuItem>
                    )}
                    <NavbarMenuItem>
                        {renderAuthSection()}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};