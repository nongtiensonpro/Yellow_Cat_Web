"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import { jwtDecode } from 'jwt-decode';

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

interface UserRequestDTO {
    id: string;
    name: string;
    email: string;
    roles: string[];
}

const CheckoutUser = () => {
    const { data: session, status } = useSession();
    const syncedRef = useRef<Set<string>>(new Set());

    // Kiểm tra xem user đã được đồng bộ chưa (từ localStorage)
    const isUserSynced = useCallback((userId: string): boolean => {
        try {
            const syncedUsers = JSON.parse(localStorage.getItem('syncedUsers') || '[]');
            return syncedUsers.includes(userId);
        } catch {
            return false;
        }
    }, []);

    // Đánh dấu user đã được đồng bộ (lưu vào localStorage)
    const markUserAsSynced = useCallback((userId: string) => {
        try {
            const syncedUsers = JSON.parse(localStorage.getItem('syncedUsers') || '[]');
            if (!syncedUsers.includes(userId)) {
                syncedUsers.push(userId);
                localStorage.setItem('syncedUsers', JSON.stringify(syncedUsers));
            }
        } catch (error) {
            console.error("Lỗi khi lưu trạng thái đồng bộ:", error);
        }
    }, []);

    // Kiểm tra xem user đã tồn tại trong backend chưa
    const checkUserExists = useCallback(async (keycloakId: string): Promise<boolean> => {
        if (!session) return false;
        
        try {
            const extendedSession = session as unknown as ExtendedSession;
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
            const response = await fetch(`${backendUrl}/api/users/keycloak-user/${keycloakId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${extendedSession.accessToken}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error("Lỗi khi kiểm tra user tồn tại:", error);
            return false;
        }
    }, [session]);

    const syncUserData = useCallback(async (userDTO: UserRequestDTO) => {
        if (!session) return false;
        
        try {
            const extendedSession = session as unknown as ExtendedSession;
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
            const response = await fetch(`${backendUrl}/api/users/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${extendedSession.accessToken}`,
                },
                body: JSON.stringify(userDTO),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Lỗi đồng bộ dữ liệu người dùng: ${response.status} - ${errorText}`);
                return false;
            }

            console.log("Đồng bộ dữ liệu người dùng thành công");
            return true;
        } catch (error) {
            console.error("Lỗi khi gọi API đồng bộ người dùng:", error);
            return false;
        }
    }, [session]);

    useEffect(() => {
        const handleUserSync = async () => {
            // Chỉ xử lý khi session đã load xong và user đã đăng nhập
            if (status === 'loading') return;
            if (status === 'unauthenticated' || !session) return;

            try {
                const extendedSession = session as unknown as ExtendedSession;
                const accessToken = extendedSession.accessToken;
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

                // Kiểm tra xem user đã được đồng bộ trước đó chưa (từ localStorage)
                if (isUserSynced(userId)) {
                    console.log(`User ${userId} đã được đồng bộ trước đó, bỏ qua`);
                    syncedRef.current.add(userId);
                    return;
                }

                // Kiểm tra xem user đã tồn tại trong backend chưa
                const userExists = await checkUserExists(userId);
                if (userExists) {
                    console.log(`User ${userId} đã tồn tại trong backend, bỏ qua đồng bộ`);
                    // Đánh dấu là đã đồng bộ để tránh kiểm tra lại
                    syncedRef.current.add(userId);
                    markUserAsSynced(userId);
                    return;
                }

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
                console.log(`Đồng bộ dữ liệu user ${userId} lần đầu...`);
                const syncSuccess = await syncUserData(userDTO);
                
                if (syncSuccess) {
                    // Đánh dấu đã đồng bộ user này trong session hiện tại
                    syncedRef.current.add(userId);
                    // Lưu vào localStorage để tránh đồng bộ lại trong tương lai
                    markUserAsSynced(userId);
                    console.log(`Đã lưu trạng thái đồng bộ cho user ${userId}`);
                }

            } catch (error) {
                console.error("Lỗi khi xử lý token:", error);
            }
        };

        handleUserSync();
    }, [session, status, syncUserData, isUserSynced, markUserAsSynced, checkUserExists]);

    // Component này không render gì cả - chỉ xử lý logic
    return null;
};

export default CheckoutUser;
