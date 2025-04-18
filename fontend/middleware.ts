import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(request: any) {
    //  console.log("Middleware triggered for:", request.url);

    // Chỉ áp dụng bảo vệ cho các route /admin và /admin/*
    const pathname = request.nextUrl.pathname;
    if (!pathname.startsWith("/admin")) {
        return NextResponse.next(); // Không can thiệp vào các route khác
    }

    // Lấy token từ header Authorization hoặc cookie
    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
        const cookies = request.headers.get("cookie");
        token = cookies
            ?.split("; ")
            .find((row: string) => row.startsWith("token="))
            ?.split("=")[1];
    }
    console.log("Token received:", token);

    // Nếu không có token, redirect về /login (chỉ áp dụng cho /admin/*)
    if (!token) {
        console.log("No token found, redirecting to /login");
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const decoded: any = jwt.decode(token);
        console.log("Decoded token:", decoded);

        const clientRoles = decoded?.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
        console.log("Client roles for YellowCatCompanyWeb:", clientRoles);

        if (!clientRoles.includes("Admin_Web")) {
            console.log("Admin_Web role not found, redirecting to /unauthorized");
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        console.log("Access granted to", request.url);
        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: ["/admin", "/admin/:path*"], // Chỉ áp dụng cho /admin và sub-route
};