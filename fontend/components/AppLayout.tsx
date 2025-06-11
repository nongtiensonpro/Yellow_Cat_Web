"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    return (
        <>
            {!isAdminPage && <Navbar />}
            <main>{children}</main>
            {!isAdminPage && <Footer />}
        </>
    );
}
