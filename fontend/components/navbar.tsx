"use client";

import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarBrand,
    NavbarItem,
    NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { siteConfig } from "@/config/site";
import NextLink from "next/link";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/theme-switch";
import { Avatar } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const Navbar = () => {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            // Đảm bảo các biến môi trường được đọc chính xác
            const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

            if (!issuer || !clientId) {
                console.error("Lỗi: Biến môi trường Keycloak cho logout chưa được cấu hình.");
                // Xử lý lỗi, ví dụ: đăng xuất cục bộ và chuyển hướng về trang chủ
                await signOut({ redirect: false });
                router.push(homeUrl);
                return;
            }

            const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;
            // Đăng xuất cục bộ trước
            await signOut({ redirect: false });
            // Sau đó chuyển hướng trình duyệt đến URL đăng xuất của Keycloak
            window.location.href = keycloakLogoutUrl;
        } catch (error) {
            console.error("Logout error:", error);
            // Nếu có lỗi, vẫn cố gắng chuyển hướng về trang chủ
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            window.location.href = homeUrl;
        }
    };

    const handleLogin = () => {
        // Redirect directly to Keycloak login page
        signIn("keycloak", { callbackUrl: window.location.href });
    };

    const renderAuthSection = () => {
        if (status === "loading") {
            return <Button isLoading className="bg-primary-500/20 text-primary">Loading...</Button>;
        }

        if (session) {
            const roles: string[] =
                (session.user && Array.isArray((session.user as any).roles))
                    ? (session.user as any).roles
                    : (
                        typeof (session.user as any).roles === "string"
                            ? [(session.user as any).roles]
                            : []
                    );

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
                        {roles.includes("admin") ? (
                            <DropdownItem key="admin_dashboard" href="/admin">
                                Admin Dashboard
                            </DropdownItem>
                        ) : null}
                        <DropdownItem key="user_info" href="/user_info">
                            User Profile
                        </DropdownItem>
                        <DropdownItem
                            key="logout"
                            className="text-danger"
                            onClick={handleLogout}
                        >
                            Log Out
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            );
        } else {
            return (
                <Button
                    onClick={handleLogin}
                    className="bg-primary-500/20 text-primary"
                >
                    Login
                </Button>
            );
        }
    };

    return (
        <HeroUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <p className="font-bold text-inherit">ACME</p>
                    </NextLink>
                </NavbarBrand>
                <ul className="hidden lg:flex gap-4 justify-start ml-2">
                    {siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink className={clsx("data-[active=true]:text-primary data-[active=true]:font-medium")} href={item.href}>
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                    {siteConfig.navMenuItemsAdmin.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink className={clsx("data-[active=true]:text-primary data-[active=true]:font-medium")} href={item.href}>
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                </ul>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
                <NavbarItem className="hidden sm:flex gap-2">
                    <ThemeSwitch />
                </NavbarItem>
                <NavbarItem className="hidden md:flex">
                    {renderAuthSection()}
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
                <ThemeSwitch />
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"}/>
            </NavbarContent>

            <NavbarMenu>
                <div className="mx-4 mt-2 flex flex-col gap-2">
                    {siteConfig.navMenuItems.map((item, index) => (
                        <NavbarMenuItem key={`${item}-${index}`}>
                            <Link
                                className={index === siteConfig.navMenuItems.length - 1 ? "text-danger" : "text-foreground"}
                                href="#"
                                size="lg"
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                    <NavbarMenuItem>
                        {renderAuthSection()}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};