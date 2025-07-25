'use client';

import Slidebar from '../Slidebar';
import { ReactNode, useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Slidebar />
            <main className={`transition-[margin] duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
                <div className="p-6 max-w-full overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
