<<<<<<< Updated upstream
=======
//
// "use client";
//
// import {
//     Navbar as HeroUINavbar,
//     NavbarContent,
//     NavbarMenu,
//     NavbarMenuToggle,
//     NavbarItem,
//     NavbarMenuItem,
// } from "@heroui/navbar";
// import { Button } from "@heroui/button";
// import { Link } from "@heroui/link";
// import NextLink from "next/link";
// import clsx from "clsx";
// import { ThemeSwitch } from "@/components/theme-switch";
// import { Avatar } from "@heroui/react";
// import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
// import { useSession, signIn, signOut } from "next-auth/react";
// import { useState, useEffect } from "react";
// import { useRouter, usePathname } from "next/navigation"; // Import usePathname
// import { jwtDecode } from 'jwt-decode';
// import BadgeVisibility from "@/components/user/BadgeVisibility";
//
// interface DecodedToken {
//     sub?: string;
//     preferred_username?: string;
//     email?: string;
//     given_name?: string;
//     family_name?: string;
//     realm_access?: {
//         roles: string[];
//     };
//     resource_access?: {
//         [clientId: string]: {
//             roles: string[];
//         };
//     };
//     exp?: number;
//     [key: string]: any;
// }
//
// export const Navbar = () => {
//     const { data: session, status } = useSession();
//     const [isMenuOpen, setIsMenuOpen] = useState(false);
//     const [isTokenValid, setIsTokenValid] = useState(true);
//     const [isAdmin, setIsAdmin] = useState(false);
//     const router = useRouter();
//     const pathname = usePathname(); // Get the current path
//
//     useEffect(() => {
//         const checkTokenAndAdminStatus = () => {
//             if (status === 'loading') {
//                 return;
//             }
//
//             if (status === 'unauthenticated' || !session) {
//                 setIsTokenValid(true);
//                 setIsAdmin(false);
//                 return;
//             }
//
//             try {
//                 const accessToken = session.accessToken as string;
//                 if (!accessToken) {
//                     console.warn("Không tìm thấy access token");
//                     setIsTokenValid(false);
//                     setIsAdmin(false);
//                     return;
//                 }
//
//                 const tokenData = jwtDecode<DecodedToken>(accessToken);
//
//                 const currentTime = Math.floor(Date.now() / 1000);
//                 if (tokenData.exp && tokenData.exp < currentTime) {
//                     console.warn("Access token đã hết hạn");
//                     setIsTokenValid(false);
//                     setIsAdmin(false);
//                     handleLogout();
//                     return;
//                 }
//
//                 setIsTokenValid(true);
//
//                 let hasAdminRole = false;
//                 const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
//                 if (clientRoles.includes("Admin_Web")) {
//                     hasAdminRole = true;
//                 }
//
//                 const realmRoles = tokenData.realm_access?.roles || [];
//                 if (realmRoles.includes("Admin_Web")) {
//                     hasAdminRole = true;
//                 }
//
//                 console.log("Admin role check result:", {
//                     hasAdminRole,
//                     clientRoles,
//                     realmRoles,
//                     tokenExp: tokenData.exp,
//                     currentTime
//                 });
//
//                 setIsAdmin(hasAdminRole);
//
//             } catch (error) {
//                 console.error("Lỗi khi decode access token:", error);
//                 setIsTokenValid(false);
//                 setIsAdmin(false);
//
//                 if (error instanceof Error && error.message.includes('Invalid token')) {
//                     handleLogout();
//                 }
//             }
//         };
//
//         checkTokenAndAdminStatus();
//     }, [session, status]);
//
//     const handleLogout = async () => {
//         try {
//             const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
//             const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
//             const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
//
//             if (!issuer || !clientId) {
//                 console.error("Lỗi: Biến môi trường Keycloak cho logout chưa được cấu hình.");
//                 await signOut({ redirect: false });
//                 router.push(homeUrl);
//                 return;
//             }
//
//             const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;
//             await signOut({ redirect: false });
//             window.location.href = keycloakLogoutUrl;
//         } catch (error) {
//             console.error("Logout error:", error);
//             const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
//             window.location.href = homeUrl;
//         }
//     };
//
//     const handleLogin = () => {
//         signIn("keycloak", { callbackUrl: window.location.href });
//     };
//
//     const renderAuthSection = () => {
//         if (status === "loading") {
//             return <Button isLoading className="bg-primary-500/20 text-primary">Loading...</Button>;
//         }
//
//         if (!isTokenValid || status === 'unauthenticated' || !session) {
//             return (
//                 <Button
//                     onClick={handleLogin}
//                     className="bg-primary-500/20 text-primary"
//                 >
//                     Login
//                 </Button>
//             );
//         }
//
//         return (
//             <Dropdown placement="bottom-end">
//                 <DropdownTrigger>
//                     <Avatar
//                         isBordered
//                         as="button"
//                         className="transition-transform"
//                         color="secondary"
//                         name={session.user?.name || session.user?.email || "User"}
//                         size="sm"
//                         src={session.user?.image || undefined}
//                     />
//                 </DropdownTrigger>
//                 <DropdownMenu aria-label="Profile Actions" variant="flat">
//                     <DropdownItem key="profile" className="h-14 gap-2">
//                         <p className="font-semibold">Signed in as</p>
//                         <p className="font-semibold">{session.user?.email}</p>
//                     </DropdownItem>
//                     {isAdmin ? (
//                         <DropdownItem key="admin_dashboard" href="/admin">
//                             Admin Dashboard
//                         </DropdownItem>
//                     ) : null}
//                     <DropdownItem
//                         key="user_info"
//                         onClick={() => router.push('/user_info')}
//                     >
//                         User Profile
//                     </DropdownItem>
//                     <DropdownItem
//                         key="user_info"
//                         onClick={() => router.push('/user_info')}
//                     >
//                        Đơn hàng
//                     </DropdownItem>
//                     <DropdownItem
//                         key="user_info"
//                         onClick={() => router.push('/user_info')}
//                     >
//                         Địa chỉ
//                     </DropdownItem>
//                     <DropdownItem
//                         key="logout"
//                         className="text-danger"
//                         color="danger"
//                         onClick={handleLogout}
//                     >
//                         Log Out
//                     </DropdownItem>
//                 </DropdownMenu>
//             </Dropdown>
//         );
//     };
//
//     // Base classes for consistent styling
//     const linkBaseClass = "text-lg font-semibold transition-colors";
//     // Active link styles
//     const activeLinkClass = "text-orange-500 hover:text-orange-600";
//     // Inactive link styles
//     const inactiveLinkClass = "text-gray-700 hover:text-orange-500";
//
//
//     return (
//         <HeroUINavbar maxWidth="full" position="static" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="py-4 flex-col">
//             <div className="w-24 h-auto relative transform translate-x-20"> {/* Thêm transform và translate-x-4 */}
//                 <img
//                     src="/images/img_1.png"
//                     alt="Logo"
//                     className="object-contain w-full h-full"
//                 />
//             </div>
//
//             <NavbarContent className="hidden sm:flex basis-full justify-center" justify="center">
//                 <ul className="flex gap-8 items-center">
//                     <NavbarItem>
//                         <NextLink
//                             className={clsx(linkBaseClass, pathname === "/" ? activeLinkClass : inactiveLinkClass)}
//                             href="/"
//                         >
//                             Trang chủ
//                         </NextLink>
//                     </NavbarItem>
//                     <NavbarItem>
//                         <NextLink
//                             className={clsx(linkBaseClass, pathname === "/products" ? activeLinkClass : inactiveLinkClass, "flex items-center gap-1")}
//                             href="/products"
//                         >
//                             Sản phẩm
//                         </NextLink>
//                     </NavbarItem>
//                     <NavbarItem>
//                         <NextLink
//                             className={clsx(linkBaseClass, pathname === "/about" ? activeLinkClass : inactiveLinkClass)}
//                             href="/about"
//                         >
//                             Giới thiệu
//                         </NextLink>
//                     </NavbarItem>
//                     <NavbarItem>
//                         <NextLink
//                             className={clsx(linkBaseClass, pathname === "/contact" ? activeLinkClass : inactiveLinkClass)}
//                             href="/contact"
//                         >
//                             Liên hệ
//                         </NextLink>
//                     </NavbarItem>
//                 </ul>
//             </NavbarContent>
//
//             {/* Right-aligned items for user and theme switch */}
//             <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
//                 <BadgeVisibility/>
//                 <NavbarItem className="hidden sm:flex gap-2">
//                     <ThemeSwitch />
//                 </NavbarItem>
//                 <NavbarItem className="hidden md:flex">
//                     {renderAuthSection()}
//                 </NavbarItem>
//             </NavbarContent>
//
//             {/* Mobile Menu Toggle */}
//             <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
//                 <ThemeSwitch />
//                 <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"}/>
//             </NavbarContent>
//
//             {/* Mobile Menu */}
//             <NavbarMenu>
//                 <div className="mx-4 mt-2 flex flex-col gap-2">
//                     <NavbarMenuItem>
//                         <Link className={clsx("text-foreground", pathname === "/" && "font-semibold text-orange-500")} href="/" size="lg">Trang chủ</Link>
//                     </NavbarMenuItem>
//                     <NavbarMenuItem>
//                         <Link className={clsx("text-foreground", pathname=="/products" && "font-semibold text-orange-500")} href="/products" size="lg">Sản phẩm</Link>
//                     </NavbarMenuItem>
//                     <NavbarMenuItem>
//                         <Link className={clsx("text-foreground", pathname=="/about" && "font-semibold text-orange-500")} href="/about" size="lg">Giới thiệu</Link>
//                     </NavbarMenuItem>
//                     <NavbarMenuItem>
//                         <Link className={clsx("text-foreground", pathname=="/contact" && "font-semibold text-orange-500")} href="/contact" size="lg">Liên hệ</Link>
//                     </NavbarMenuItem>
//                     {isAdmin && (
//                         <NavbarMenuItem>
//                             <Link className={clsx("text-foreground", pathname=="/admin" && "font-semibold text-orange-500")} href="/admin" size="lg">Admin Dashboard</Link>
//                         </NavbarMenuItem>
//                     )}
//                     <NavbarMenuItem>
//                         {renderAuthSection()}
//                     </NavbarMenuItem>
//                 </div>
//             </NavbarMenu>
//         </HeroUINavbar>
//     );
// };
>>>>>>> Stashed changes


"use client";

import {
    Navbar as HeroUINavbar,
    NavbarBrand,
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
<<<<<<< Updated upstream
import { useRouter } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image'; // Import Next.js Image component
=======
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import BadgeVisibility from "@/components/user/BadgeVisibility"; // Assuming this is for a shopping cart or similar
import {
    MagnifyingGlassIcon, // Import search icon
    HeartIcon, // Import wishlist icon
} from "@heroicons/react/24/outline";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======
    const pathname = usePathname();
>>>>>>> Stashed changes

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

                // Decode token để lấy thông tin roles ngay lập tức
                const tokenData = jwtDecode<DecodedToken>(accessToken);

                // Kiểm tra token có hết hạn không
                const currentTime = Math.floor(Date.now() / 1000);
                if (tokenData.exp && tokenData.exp < currentTime) {
                    console.warn("Access token đã hết hạn");
                    setIsTokenValid(false);
                    setIsAdmin(false);
                    handleLogout(); // Automatically log out if token is expired
                    return;
                }

                setIsTokenValid(true);

                // Kiểm tra quyền admin từ decoded token
                let hasAdminRole = false;

                // Kiểm tra client roles từ resource_access
                const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                if (clientRoles.includes("Admin_Web")) {
                    hasAdminRole = true;
                }

                // Kiểm tra realm roles nếu cần
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

                // Nếu có lỗi với token, có thể cần logout
                if (error instanceof Error && error.message.includes('Invalid token')) {
                    handleLogout(); // Log out if token is invalid
                }
            }
        };

        checkTokenAndAdminStatus();
    }, [session, status]);

    const handleLogout = async () => {
        try {
            // Ensure NEXT_PUBLIC_HOME_URL is correctly defined in your .env
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
            const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;

            if (!issuer || !clientId) {
                console.error("Lỗi: Biến môi trường Keycloak cho logout chưa được cấu hình.");
                await signOut({ redirect: false });
                router.push(homeUrl);
                return;
            }

            // Keycloak's direct logout URL
            const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(homeUrl)}&client_id=${clientId}`;

            // Perform NextAuth.js signOut first to clear session
            await signOut({ redirect: false });
            // Then redirect to Keycloak's logout endpoint
            window.location.href = keycloakLogoutUrl;
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback to home URL if any error occurs during logout
            const homeUrl = process.env.NEXT_PUBLIC_HOME_URL || "http://localhost:3000";
            window.location.href = homeUrl;
        }
    };


    const handleLogin = () => {
        signIn("keycloak", { callbackUrl: window.location.href });
    };

    const renderAuthSection = () => {
        if (status === "loading") {
            return <Button isLoading className="bg-primary-500/20 text-primary" size="sm">Loading...</Button>;
        }

        if (!isTokenValid || status === 'unauthenticated' || !session) {
            return (
                <Button
                    onClick={handleLogin}
                    className="bg-primary-500/20 text-primary"
                    size="sm"
                >
                    Đăng nhập
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
                        <p className="font-semibold">Đăng nhập với</p>
                        <p className="font-semibold">{session.user?.email}</p>
                    </DropdownItem>

                    {isAdmin ? (
                        <DropdownItem key="admin_dashboard" href="/admin">
                            Admin Dashboard
                        </DropdownItem>
                    ) : null}
                    <DropdownItem
                        key="user_profile"
                        onClick={() => router.push('/user_info')}
                    >
                        Hồ sơ của bạn
                    </DropdownItem>
                    <DropdownItem
                        key="orders"
                        onClick={() => router.push('/orders')} // Assuming an /orders page
                    >
                        Đơn hàng của bạn
                    </DropdownItem>
                    <DropdownItem
                        key="addresses"
                        onClick={() => router.push('/addresses')} // Assuming an /addresses page
                    >
                        Địa chỉ của bạn
                    </DropdownItem>
                    <DropdownItem
                        key="logout"
                        className="text-danger"
                        color="danger"
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    };

<<<<<<< Updated upstream
    return (
        <HeroUINavbar maxWidth="2xl" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        {/* Replace the text with your logo */}
                        <Image
                            src="/images/logogiay.jpg" // Path to your logo in the public directory
                            alt="SneakerPeak Logo"
                            width={60} // Adjust width as needed
                            height={60} // Adjust height as needed
                        />
                        <p className="font-bold text-inherit">
                            Sneaker<br />Peak
                        </p>
                    </NextLink>
                    <NextLink className="flex justify-content center" href="/">
                        <p className="font-bold text-inherit">Trang chủ</p>
                    </NextLink>
                    <NextLink className="flex justify-content center" href="/products"> {/* Thêm Sản phẩm */}
                        <p className="font-bold text-inherit">Sản phẩm</p>
                    </NextLink>
                    <NextLink className="flex justify-content center" href="/about">
                        <p className="font-bold text-inherit">Giới thiệu</p>
                    </NextLink>
                    <NextLink className="flex justify-content center" href="/contact">
                        <p className="font-bold text-inherit">Liên hệ</p>
                    </NextLink>
                    <NextLink className="flex justify-content center" href="/search"> {/* Thêm Tra cứu */}
                        <p className="font-bold text-inherit">Tra cứu</p>
                    </NextLink>


                </NavbarBrand>
                <ul className="hidden lg:flex gap-4 justify-start ml-2">
                    {siteConfig.navItems.map((item: { href: string; label: string }) => (
                        <NavbarItem key={item.href}>
                            <NextLink className={clsx("data-[active=true]:text-primary data-[active=true]:font-medium")} href={item.href}>
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                    {/* Admin menu items - will display when authorized */}
                    {isAdmin &&
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
=======
    const linkBaseClass = "text-lg font-semibold transition-colors";
    const activeLinkClass = "text-orange-600 border-b-2 border-orange-600 pb-1"; // Added border for active state
    const inactiveLinkClass = "text-gray-700 hover:text-orange-500";


    return (
        <HeroUINavbar maxWidth="full" position="sticky" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} className="py-4 shadow-md bg-background/80 backdrop-blur-lg backdrop-saturate-150">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as={NextLink} href="/" className="gap-2">
                    <img
                        src="/images/img_1.png"
                        alt="Logo"
                        className="h-10 w-auto object-contain"
                    />
                    <p className="font-bold text-xl text-inherit hidden md:block">SneakPeak</p>
                </NavbarBrand>
            </NavbarContent>

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
                            className={clsx(linkBaseClass, pathname === "/products" ? activeLinkClass : inactiveLinkClass)}
                            href="/products"
                        >
                            Sản phẩm
                        </NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink
                            className={clsx(linkBaseClass, pathname === "/about" ? activeLinkClass : inactiveLinkClass)}
                            href="/about"
                        >
                            Giới thiệu
                        </NextLink>
                    </NavbarItem>
                    <NavbarItem>
                        <NextLink
                            className={clsx(linkBaseClass, pathname === "/contact" ? activeLinkClass : inactiveLinkClass)}
                            href="/contact"
                        >
                            Liên hệ
                        </NextLink>
                    </NavbarItem>
                </ul>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full items-center gap-4" justify="end"> {/* Increased gap */}
                <NavbarItem>
                    {/* Search Icon */}
                    <NextLink href="/search" aria-label="Search">
                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-700 hover:text-orange-500 transition-colors" />
                    </NextLink>
                </NavbarItem>
                <NavbarItem>
                    {/* Wishlist Icon */}
                    <NextLink href="/wishlist" aria-label="Wishlist">
                        <HeartIcon className="h-6 w-6 text-gray-700 hover:text-orange-500 transition-colors" />
                    </NextLink>
                </NavbarItem>
                <NavbarItem>
                    <BadgeVisibility/> {/* Cart/Notification icon */}
                </NavbarItem>
                <NavbarItem>
>>>>>>> Stashed changes
                    <ThemeSwitch />
                </NavbarItem>
                <NavbarItem>
                    {renderAuthSection()}
                </NavbarItem>
            </NavbarContent>

<<<<<<< Updated upstream
            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
=======
            {/* Mobile Menu Toggle and right-aligned items for mobile */}
            <NavbarContent className="sm:hidden basis-1 pl-4 items-center gap-4" justify="end"> {/* Increased gap for mobile icons */}
                <NextLink href="/search" aria-label="Search">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-700" />
                </NextLink>
                <NextLink href="/wishlist" aria-label="Wishlist">
                    <HeartIcon className="h-6 w-6 text-gray-700" />
                </NextLink>
                <BadgeVisibility/>
>>>>>>> Stashed changes
                <ThemeSwitch />
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"}/>
            </NavbarContent>

<<<<<<< Updated upstream
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
                    {isAdmin &&
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
=======
            {/* Mobile Menu */}
            <NavbarMenu className="pt-4">
                <div className="mx-4 flex flex-col gap-3">
                    <NavbarMenuItem>
                        <Link className={clsx("text-foreground text-lg", pathname === "/" && "font-semibold text-orange-500")} href="/" size="lg">Trang chủ</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link className={clsx("text-foreground text-lg", pathname === "/products" && "font-semibold text-orange-500")} href="/products" size="lg">Sản phẩm</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link className={clsx("text-foreground text-lg", pathname === "/about" && "font-semibold text-orange-500")} href="/about" size="lg">Giới thiệu</Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link className={clsx("text-foreground text-lg", pathname === "/contact" && "font-semibold text-orange-500")} href="/contact" size="lg">Liên hệ</Link>
                    </NavbarMenuItem>
                    {isAdmin && (
                        <NavbarMenuItem>
                            <Link className={clsx("text-foreground text-lg", pathname === "/admin" && "font-semibold text-orange-500")} href="/admin" size="lg">Bảng điều khiển Admin</Link>
                        </NavbarMenuItem>
                    )}
                    <NavbarMenuItem className="mt-4">
>>>>>>> Stashed changes
                        {renderAuthSection()}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};