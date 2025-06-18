"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { jwtDecode } from 'jwt-decode';

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

interface UserRequestDTO {
    id: string;
    name: string;
    email: string;
    roles: string[];
}

const CheckoutUser = () => {
    const { data: session, status } = useSession();
    const syncedRef = useRef<Set<string>>(new Set());

    const syncUserData = async (userDTO: UserRequestDTO) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
            const response = await fetch(`${backendUrl}/api/users/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(userDTO),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Lỗi đồng bộ dữ liệu người dùng: ${response.status} - ${errorText}`);
                return;
            }

            console.log("Đồng bộ dữ liệu người dùng thành công");
        } catch (error) {
            console.error("Lỗi khi gọi API đồng bộ người dùng:", error);
        }
    };

    useEffect(() => {
        const handleUserSync = async () => {
            // Chỉ xử lý khi session đã load xong và user đã đăng nhập
            if (status === 'loading') return;
            if (status === 'unauthenticated' || !session) return;

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) return;

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                
                // Kiểm tra token có hợp lệ không
                const currentTime = Math.floor(Date.now() / 1000);
                if (tokenData.exp && tokenData.exp < currentTime) {
                    console.warn("Token đã hết hạn");
                    return;
                }

                // Lấy thông tin user từ token
                const userId = tokenData.sub;
                if (!userId) return;

                // Kiểm tra xem đã đồng bộ user này chưa trong session hiện tại
                if (syncedRef.current.has(userId)) return;

                // Lấy roles từ token
                const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                const realmRoles = tokenData.realm_access?.roles || [];
                const allRoles = Array.from(new Set([...clientRoles, ...realmRoles]));

                // Tạo tên đầy đủ từ firstName và lastName
                const firstName = tokenData.given_name || "";
                const lastName = tokenData.family_name || "";
                const fullName = [firstName, lastName].filter(Boolean).join(" ") || 
                               tokenData.preferred_username || 
                               tokenData.email || 
                               "Unknown User";

                const userDTO: UserRequestDTO = {
                    id: userId,
                    name: fullName,
                    email: tokenData.email || "",
                    roles: allRoles,
                };

                // Gọi API để đồng bộ dữ liệu
                await syncUserData(userDTO);
                
                // Đánh dấu đã đồng bộ user này
                syncedRef.current.add(userId);

            } catch (error) {
                console.error("Lỗi khi xử lý token:", error);
            }
        };

        handleUserSync();
    }, [session, status]);

    // Component này không render gì cả - chỉ xử lý logic
    return null;
};

export default CheckoutUser;
