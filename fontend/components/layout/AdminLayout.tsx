'use client';

import Slidebar from '../Slidebar';
import { ReactNode, useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Listen for sidebar state changes
        const handleStorageChange = () => {
            const saved = localStorage.getItem('sidebar-collapsed');
            if (saved !== null) {
                setSidebarCollapsed(JSON.parse(saved));
            }
        };

        // Initial load
        handleStorageChange();

        // Listen for changes
        window.addEventListener('storage', handleStorageChange);
        
        // Custom event for same-tab updates
        const handleSidebarToggle = (e: CustomEvent) => {
            setSidebarCollapsed(e.detail.collapsed);
        };
        
        window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
        };
    }, []);

    // Render với layout mặc định cho đến khi component mounted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                <Slidebar />
                <main className="flex-1 p-6 max-w-full overflow-auto">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <Slidebar />
            {/* Main content */}
            <main className="flex-1 p-6 max-w-full overflow-auto">
                {children}
            </main>
        </div>
    );
}
