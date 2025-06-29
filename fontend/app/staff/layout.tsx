// import AdminLayout from '@/components/layout/AdminLayout';
//
// export default function StaffLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <AdminLayout>
//             {children}
//         </AdminLayout>
//     );
// }
//
// import EmployeeLayout from '@/components/layout/EmployeeLayout';
//
// export default function StaffLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <EmployeeLayout>
//             {children}
//         </EmployeeLayout>
//     );
// }



import AdminLayout from '@/components/layout/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}
