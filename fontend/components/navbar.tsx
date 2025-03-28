"use client";

import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarBrand,
    NavbarItem,
} from "@heroui/navbar";
import { MdMenu, MdClose } from 'react-icons/md';

import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
} from "@heroui/dropdown";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, SearchIcon, Logo } from "@/components/icons";
import { useAuthStore } from "@/keycloak/store";
import { useKeycloak } from "@react-keycloak/web";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Users {
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
    const { isAuthenticated, login, logout } = useAuthStore();
    const { keycloak, initialized } = useKeycloak();
    const [users, setUser] = useState<Users | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false);

    useEffect(() => {
        const getUserInfo = () => {
            if (!initialized) {
                return; // Đợi cho Keycloak khởi tạo xong
            }
            try {
                // Lấy thông tin từ tokenParsed đã có sẵn
                const tokenParsed = keycloak.tokenParsed || {};
                const clientId = keycloak.clientId || '';

                // Lấy client roles nếu clientId tồn tại
                const clientRoles = clientId && tokenParsed.resource_access?.[clientId]?.roles || [];

                // Xây dựng đối tượng user từ thông tin trong token
                const userData: Users = {
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
                console.log("Không có thông tin người dùng từ Keycloak:", err);
            } finally {
                setLoading(false);
            }
        };

        getUserInfo();
    }, [keycloak, initialized]);

    if (!initialized || loading) {
        return <LoadingSpinner />;
    }

    const searchInput = (
        <Input
            aria-label="Search"
            classNames={{
                inputWrapper: "bg-default-100",
                input: "text-sm",
            }}
            endContent={
                <Kbd className="hidden lg:inline-block" keys={["command"]}>
                    K
                </Kbd>
            }
            labelPlacement="outside"
            placeholder="Search..."
            startContent={
                <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
            }
            type="search"
        />
    );

    // Kiểm tra xem người dùng có vai trò Admin không
    const hasAdminRole = users?.roles?.includes('Admin_Web') || false;
    const hasAdminClientRole = users?.clientRoles?.includes('Admin_Web') || false;
    const isAdmin = hasAdminRole || hasAdminClientRole;

    // Toggle function to switch between regular and admin menu
    const toggleMenu = () => {
        setShowAdminMenu(!showAdminMenu);
    };

    return (
        <HeroUINavbar maxWidth="xl">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <Logo />
                        <p className="font-bold text-inherit">Yellow Cat Company</p>
                    </NextLink>
                </NavbarBrand>
                <ul className="hidden lg:flex gap-4 justify-start ml-2">
                    {/* Only show regular or admin menu based on toggle state */}
                    {isAdmin && (
                        <NavbarItem>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={toggleMenu}
                                aria-label={showAdminMenu ? "Close admin menu" : "Open admin menu"}
                            >
                                {showAdminMenu ? <MdClose size={24} /> : <MdMenu size={24} />}
                            </Button>
                        </NavbarItem>
                    )}

                    {/* Show regular menu items if not in admin mode or user is not admin */}
                    {(!showAdminMenu || !isAdmin) && siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink
                                className={clsx(
                                    linkStyles({ color: "foreground" }),
                                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                                )}
                                color="foreground"
                                href={item.href}
                            >
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}

                    {/* Show admin menu items only if in admin mode and user is admin */}
                    {showAdminMenu && isAdmin && siteConfig.navMenuItemsAdmin && siteConfig.navMenuItemsAdmin.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink
                                className={clsx(
                                    linkStyles({ color: "foreground" }),
                                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                                )}
                                color="foreground"
                                href={item.href}
                            >
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                </ul>
            </NavbarContent>
            <NavbarContent
                className="hidden sm:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem className="hidden sm:flex gap-2">
                    <Link isExternal aria-label="Github" href={siteConfig.links.github}>
                        <GithubIcon className="text-default-500" />
                    </Link>
                </NavbarItem>
                <NavbarItem className="hidden md:flex">{searchInput}</NavbarItem>
            </NavbarContent>
            {isAuthenticated ? (
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="bordered">
                            {users?.username}
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="User Actions">
                        <DropdownItem key="menu" className="text-default" textValue="Menu">
                            <ul className="hidden lg:flex gap-4 justify-start ml-2">
                                {siteConfig.navMenuItems.map((item) => (
                                    <NavbarItem key={item.href}>
                                        <NextLink
                                            className={clsx(
                                                linkStyles({ color: "foreground" }),
                                                "data-[active=true]:text-primary data-[active=true]:font-medium",
                                            )}
                                            color="foreground"
                                            href={item.href}
                                        >
                                            {item.label}
                                        </NextLink>
                                    </NavbarItem>
                                ))}
                            </ul>
                        </DropdownItem>
                        <DropdownItem
                            key="logout"
                            className="text-danger"
                            color="danger"
                            textValue="Đăng xuất"
                            onPress={() => logout()}
                        >
                            Đăng xuất
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            ) : (
                <Button color="primary" onPress={() => login()}>
                    Đăng nhập
                </Button>
            )}
            <ThemeSwitch />
        </HeroUINavbar>
    );
};