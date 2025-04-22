import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode"; // Thay đổi từ jsonwebtoken sang jwt-decode
import { getToken } from "next-auth/jwt";

export async function middleware(request: any) {
    const pathname = request.nextUrl.pathname;
    if (!pathname.startsWith("/admin")) {
        return NextResponse.next();
    }

    try {
        // Sử dụng getToken từ next-auth/jwt để lấy token
        const token = await getToken({ 
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            console.log("No token found, redirecting to /login");
            return NextResponse.redirect(new URL("/login", request.url));
        }

        console.log("Token received from NextAuth");

        // Kiểm tra quyền từ token.roles hoặc từ accessToken đã decode
        let hasAdminRole = false;
        
        // Kiểm tra từ token.roles (đã được xử lý bởi NextAuth)
        if (token.roles && Array.isArray(token.roles)) {
            hasAdminRole = token.roles.includes("Admin_Web");
        }
        
        // Nếu không có trong token.roles, thử kiểm tra từ accessToken
        if (!hasAdminRole && token.accessToken) {
            try {
                const decodedAccessToken = jwtDecode<any>(token.accessToken as string);
                const clientRoles = decodedAccessToken?.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                hasAdminRole = clientRoles.includes("Admin_Web");
            } catch (decodeError) {
                console.error("Error decoding access token:", decodeError);
            }
        }

        if (!hasAdminRole) {
            console.log("User does not have Admin_Web role, redirecting to /unauthorized");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: ["/admin", "/admin/:path*"],
};