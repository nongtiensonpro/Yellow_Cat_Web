"use client";

import SidebarEmployee from "@/components/SidebarEmployee";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <SidebarEmployee />
            <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
                {children}
            </main>
        </div>
    );
}
