import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { getToken } from "next-auth/jwt";

export async function middleware(request: any) {
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
                    const decodedAccessToken = jwtDecode<any>(token.accessToken as string);
                    const clientRoles = decodedAccessToken?.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                    hasAdminRole = clientRoles.includes("Admin_Web");
                } catch (decodeError) {
                    console.error("Error decoding access token:", decodeError);
                }
            }

            // Nếu người dùng không có quyền quản trị, chuyển hướng đến trang /unauthorized
            if (!hasAdminRole) {
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }

            return NextResponse.next();
        } catch (error) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/admin", "/admin/:path*"],
};