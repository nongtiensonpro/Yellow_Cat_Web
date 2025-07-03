//
import UserSidebar from '@/components/UserSidebar';

export default function UserInfoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <UserSidebar />
            <main className="flex-1 p-6 bg-gray-50">
                {children}
            </main>
        </div>
    );
}
