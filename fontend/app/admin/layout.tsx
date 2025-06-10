import { ReactNode } from "react";

export const metadata = {
    title: "Admin",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {/* KHÔNG có Navbar ở đây */}
            {children}
        </>
    );
}
