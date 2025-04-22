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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


export const Navbar = () => {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (session) {
            const customSession = session as any;
            const hasError = customSession.error === "RefreshAccessTokenError";
            const isExpired = customSession.expiresAt &&
                customSession.expiresAt < Math.floor(Date.now() / 1000);

            if (hasError || isExpired) {
                setIsTokenValid(false);
                handleLogout();
            } else {
                setIsTokenValid(true);
            }
        }
    }, [session]);

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
    const hasAdminRole = () => {
        if (!session || !isTokenValid) return false;

        try {
            const accessToken = (session as any).accessToken;
            if (accessToken) {
                const decodedToken = (session as any).decodedToken;
                if (decodedToken?.resource_access?.YellowCatCompanyWeb?.roles) {
                    return decodedToken.resource_access.YellowCatCompanyWeb.roles.includes("Admin_Web");
                }

                return (session as any).resource_access?.YellowCatCompanyWeb?.roles?.includes("Admin_Web");
            }

            return false;
        } catch (error) {
            console.error("Error checking admin role:", error);
            return false;
        }
    };

    const renderAuthSection = () => {
        if (status === "loading") {
            return <Button isLoading className="bg-primary-500/20 text-primary">Loading...</Button>;
        }
        if (!isTokenValid) {
            return (
                <Button
                    onClick={handleLogin}
                    className="bg-primary-500/20 text-primary"
                >
                    Login
                </Button>
            );
        }

        if (session && isTokenValid) {
            const isAdmin = hasAdminRole();

            // console.log("Session structure:", {
            //     hasAdminRole: isAdmin,
            //     resourceAccess: (session as any).resource_access,
            // });

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
                        <DropdownItem key="user_info" href="/user_info">
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

    const extractRolesFromToken = () => {
        if (!session || !isTokenValid) return false;

        try {
            const token = (session as any).accessToken;
            if (!token) return false;

            if ((session as any).resource_access?.YellowCatCompanyWeb?.roles) {
                return (session as any).resource_access.YellowCatCompanyWeb.roles.includes("Admin_Web");
            }

            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                return tokenData.resource_access?.YellowCatCompanyWeb?.roles?.includes("Admin_Web");
            } catch (e) {
                console.error("Failed to parse token data:", e);
                return false;
            }
        } catch (error) {
            console.error("Error extracting roles:", error);
            return false;
        }
    };

    const isAdminUser = extractRolesFromToken();

    return (
        <HeroUINavbar maxWidth="xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">

                        <p className="font-bold text-inherit">Yellow Cat Company</p>
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
                    {/* Admin menu items */}
                    {isAdminUser &&
                        siteConfig.navMenuItemsAdmin.map((item) => (
                            <NavbarItem key={item.href}>
                                <NextLink className={clsx("data-[active=true]:text-primary data-[active=true]:font-medium")} href={item.href}>
                                    {item.label}
                                </NextLink>
                            </NavbarItem>
                        ))
                    }
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
                                href={item.href}
                                size="lg"
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                    {/* Add admin menu items to mobile menu too */}
                    {isAdminUser &&
                        siteConfig.navMenuItemsAdmin.map((item, index) => (
                            <NavbarMenuItem key={`admin-${item}-${index}`}>
                                <Link
                                    className="text-foreground"
                                    href={item.href}
                                    size="lg"
                                >
                                    {item.label}
                                </Link>
                            </NavbarMenuItem>
                        ))
                    }
                    <NavbarMenuItem>
                        {renderAuthSection()}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};