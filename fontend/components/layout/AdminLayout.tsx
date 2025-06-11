import Sidebar from '../Slidebar';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 bg-gray-100 p-6 overflow-auto">{children}</main>
        </div>
    );
}
