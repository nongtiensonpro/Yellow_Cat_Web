import React, { useEffect, useState, useCallback } from "react";
import {Badge} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// --- Types ---
interface IconProps {
    size?: number;
    height?: number;
    width?: number;
    [key: string]: unknown;
}

interface ExtendedUser {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
    sub?: string;
}

export const NotificationIcon = ({size, height, width, ...props}: IconProps) => {
    return (
        <svg
            fill="none"
            height={size || height || 24}
            viewBox="0 0 24 24"
            width={size || width || 24}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                clipRule="evenodd"
                d="M18.707 8.796c0 1.256.332 1.997 1.063 2.85.553.628.73 1.435.73 2.31 0 .874-.287 1.704-.863 2.378a4.537 4.537 0 01-2.9 1.413c-1.571.134-3.143.247-4.736.247-1.595 0-3.166-.068-4.737-.247a4.532 4.532 0 01-2.9-1.413 3.616 3.616 0 01-.864-2.378c0-.875.178-1.682.73-2.31.754-.854 1.064-1.594 1.064-2.85V8.37c0-1.682.42-2.781 1.283-3.858C7.861 2.942 9.919 2 11.956 2h.09c2.08 0 4.204.987 5.466 2.625.82 1.054 1.195 2.108 1.195 3.745v.426zM9.074 20.061c0-.504.462-.734.89-.833.5-.106 3.545-.106 4.045 0 .428.099.89.33.89.833-.025.48-.306.904-.695 1.174a3.635 3.635 0 01-1.713.731 3.795 3.795 0 01-1.008 0 3.618 3.618 0 01-1.714-.732c-.39-.269-.67-.694-.695-1.173z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
};

export const CartIcon = ({size, height, width, ...props}: IconProps) => {
    return (
        <svg
            fill="none"
            height={size || height || 24}
            viewBox="0 0 24 24"
            width={size || width || 24}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M16.25 22.5C17.2165 22.5 18 21.7165 18 20.75C18 19.7835 17.2165 19 16.25 19C15.2835 19 14.5 19.7835 14.5 20.75C14.5 21.7165 15.2835 22.5 16.25 22.5Z"
                fill="currentColor"
            />
            <path
                d="M8.25 22.5C9.2165 22.5 10 21.7165 10 20.75C10 19.7835 9.2165 19 8.25 19C7.2835 19 6.5 19.7835 6.5 20.75C6.5 21.7165 7.2835 22.5 8.25 22.5Z"
                fill="currentColor"
            />
            <path
                d="M4.84 3.94L4.64 6.39C4.6 6.86 4.97 7.25 5.44 7.25H20.75C21.17 7.25 21.52 6.93 21.55 6.51C21.68 4.74 20.33 3.3 18.56 3.3H6.27C6.17 2.86 5.97 2.44 5.66 2.09C5.16 1.56 4.46 1.25 3.74 1.25H2C1.59 1.25 1.25 1.59 1.25 2C1.25 2.41 1.59 2.75 2 2.75H3.74C4.05 2.75 4.34 2.88 4.55 3.1C4.76 3.33 4.86 3.63 4.84 3.94Z"
                fill="currentColor"
            />
            <path
                d="M20.5101 8.75H5.17005C4.75005 8.75 4.41005 9.07 4.37005 9.48L4.01005 13.83C3.87005 15.54 5.21005 17 6.92005 17H18.0401C19.5401 17 20.8601 15.77 20.9701 14.27L21.3001 9.6C21.3401 9.14 20.9801 8.75 20.5101 8.75Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default function App() {
    const { data: session } = useSession();
    const [cartCount, setCartCount] = useState(0);
    const router = useRouter();

    // Hàm tính tổng số lượng sản phẩm trong giỏ hàng
    const getCartCount = useCallback(async () => {
        if (session?.user) {
            try {
                // Sử dụng sub hoặc email làm identifier
                const user = session.user as ExtendedUser;
                const userId = user.id || user.sub || user.email;
                if (!userId) return 0;
                
                const res = await fetch(`http://localhost:8080/api/cart?keycloakId=${userId}`);
                if (!res.ok) {
                    if (res.status === 400 || res.status === 404) {
                        // Không có giỏ hàng hoặc user chưa từng thêm sản phẩm
                        return 0;
                    }
                    console.error('Failed to fetch cart from DB:', res.status);
                    return 0;
                }
                const data = await res.json();
                // Đảm bảo data.items là mảng
                if (!data.items || !Array.isArray(data.items)) return 0;
                return data.items.length;
            } catch (error) {
                console.error('Error fetching cart from DB:', error);
                return 0;
            }
        } else if (typeof window !== 'undefined') {
            const storedCart = localStorage.getItem('cart');
            if (!storedCart) return 0;
            try {
                const cartItems = JSON.parse(storedCart);
                if (!Array.isArray(cartItems)) return 0;
                // Trả về số lượng loại sản phẩm (length của array) thay vì tổng quantity
                return cartItems.length;
            } catch {
                return 0;
            }
        }
        return 0;
    }, [session]);

    // Cập nhật realtime khi localStorage thay đổi hoặc khi thêm/xóa/cập nhật sản phẩm
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        const updateCartCount = async () => {
            setCartCount(await getCartCount());
        };
        updateCartCount();

        // Lắng nghe sự kiện storage (tab khác) - chỉ khi chưa đăng nhập
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'cart' && !session?.user) {
                updateCartCount();
            }
        };
        window.addEventListener('storage', handleStorage);

        // Lắng nghe thay đổi localStorage trên cùng tab (polling) - chỉ khi chưa đăng nhập
        if (!session?.user) {
            interval = setInterval(updateCartCount, 700);
        } else {
            // Khi đã đăng nhập, cập nhật từ DB mỗi 2 giây
            interval = setInterval(updateCartCount, 2000);
        }

        return () => {
            window.removeEventListener('storage', handleStorage);
            if (interval) clearInterval(interval);
        };
    }, [getCartCount, session?.user]);

    return (
        <div className="flex items-center gap-4">
            <button className="flex items-center gap-3" onClick={() => router.push('/shopping_cart')}>
                <Badge color="danger" content={cartCount} isInvisible={cartCount === 0} shape="circle">
                    <CartIcon size={30} />
                </Badge>
            </button>
        </div>
    );
}

