import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { getToken } from "next-auth/jwt";

// Kiểu cho accessToken sau khi decode
type KeycloakToken = {
    sub?: string;
    resource_access?: Record<string, { roles?: string[] }>;
};

// Interface cho AppUser từ backend
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

// Interface cho API Response
interface ApiResponse {
    status: number;
    message: string;
    data: AppUser;
    error?: string;
}

// Regex để validate số điện thoại Việt Nam
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;

// Function để kiểm tra user profile từ backend
async function checkUserProfile(keycloakId: string, accessToken: string): Promise<{ hasValidPhone: boolean; user?: AppUser }> {
    try {
        const response = await fetch(`http://localhost:8080/api/users/keycloak-user/${keycloakId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            cache: 'no-store', // Thêm để tránh cache, đảm bảo dữ liệu tươi mới
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} - ${response.statusText}`);
            return { hasValidPhone: false };
        }

        const apiResponse: ApiResponse = await response.json();

        if (apiResponse.status >= 200 && apiResponse.status < 300 && apiResponse.data) {
            const user = apiResponse.data;
            
            // Normalize phone number: loại bỏ khoảng trắng và chuyển +84 về 0
            let cleanedPhone = user.phoneNumber?.replace(/\s+/g, '').replace(/^\+84/, '0') || '';
            
            const hasValidPhone = !!(cleanedPhone && PHONE_REGEX.test(cleanedPhone));
            
            // Logging để debug
            console.log(`[checkUserProfile] KeycloakId: ${keycloakId}, Cleaned Phone: ${cleanedPhone}, Valid: ${hasValidPhone}`);
            
            return { hasValidPhone, user };
        }

        return { hasValidPhone: false };
    } catch (error) {
        console.error('Error checking user profile:', error);
        return { hasValidPhone: false };
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Kiểm tra quyền truy cập vào trang quản trị
    if (pathname.startsWith("/admin")) {
        try {
            const token = await getToken({
                req: request,
                secret: process.env.NEXTAUTH_SECRET
            });

            // Không có token nào đẩy người dùng về trang thông báo đăng nhập
            if (!token) {
                return NextResponse.redirect(new URL("/login", request.url));
            }

            let hasAdminRole = false;

            if (token.roles && Array.isArray(token.roles)) {
                hasAdminRole = token.roles.includes("Admin_Web");
            }

            if (!hasAdminRole && token.accessToken) {
                try {
                    const decodedAccessToken = jwtDecode<KeycloakToken>(token.accessToken as string);
                    const clientRoles = decodedAccessToken?.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                    hasAdminRole = clientRoles.includes("Admin_Web");
                } catch {
                    console.error("Error decoding access token:");
                }
            }

            // Nếu người dùng không có quyền quản trị, chuyển hướng đến trang /unauthorized
            if (!hasAdminRole) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }

            return NextResponse.next();
        } catch {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Kiểm tra quyền truy cập vào trang nhân viên
    if (pathname.startsWith("/staff")) {
        try {
            const token = await getToken({
                req: request,
                secret: process.env.NEXTAUTH_SECRET
            });

            // Không có token nào đẩy người dùng về trang thông báo đăng nhập
            if (!token) {
                return NextResponse.redirect(new URL("/login", request.url));
            }

            let hasStaffAccess = false;

            // Kiểm tra trong token.roles
            if (token.roles && Array.isArray(token.roles)) {
                hasStaffAccess = token.roles.includes("Admin_Web") || token.roles.includes("Staff_Web");
            }

            // Nếu chưa tìm thấy quyền, kiểm tra trong accessToken
            if (!hasStaffAccess && token.accessToken) {
                try {
                    const decodedAccessToken = jwtDecode<KeycloakToken>(token.accessToken as string);
                    const clientRoles = decodedAccessToken?.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                    hasStaffAccess = clientRoles.includes("Admin_Web") || clientRoles.includes("Staff_Web");
                } catch {
                    console.error("Error decoding access token:");
                }
            }

            // Nếu người dùng không có quyền nhân viên hoặc quản trị, chuyển hướng đến trang /unauthorized
            if (!hasStaffAccess) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }

            // Kiểm tra số điện thoại cho các trang staff cần thiết
            if (pathname.startsWith("/staff/officesales")) {
                try {
                    const decodedAccessToken = jwtDecode<KeycloakToken>(token.accessToken as string);
                    const keycloakId = decodedAccessToken.sub;
                    
                    if (keycloakId && token.accessToken) {
                        const { hasValidPhone } = await checkUserProfile(keycloakId, token.accessToken as string);
                        
                        if (!hasValidPhone) {
                            // Chuyển hướng đến trang yêu cầu cập nhật thông tin với return URL
                            const returnUrl = encodeURIComponent(request.url);
                            return NextResponse.redirect(new URL(`/staff/profile-required?returnUrl=${returnUrl}`, request.url));
                        }
                    }
                } catch (error) {
                    console.error("Error checking phone number:", error);
                    // Nếu có lỗi, vẫn cho phép truy cập nhưng component sẽ xử lý
                }
            }

            return NextResponse.next();
        } catch {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/admin", "/admin/:path*", "/staff", "/staff/:path*"],
};