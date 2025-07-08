import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";
import { getToken } from "next-auth/jwt";

// Kiểu cho accessToken sau khi decode
type KeycloakToken = {
    resource_access?: Record<string, { roles?: string[] }>;
};

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