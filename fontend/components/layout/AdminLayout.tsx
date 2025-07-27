'use client';

import Slidebar from '../Slidebar';
import { ReactNode, useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Render với layout mặc định cho đến khi component mounted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                <Slidebar />
                <main className="flex-1 max-w-full overflow-auto">
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
            <main className="flex-1 max-w-full overflow-auto">
                {children}
            </main>
        </div>
    );
}
