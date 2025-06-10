"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jwtDecode } from 'jwt-decode';

interface Users {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    realmRoles: string[];
    clientRoles: string[];
    enabled: boolean;
}

interface DecodedToken {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [clientId: string]: {
            roles: string[];
        };
    };
    [key: string]: any;
}

export default function Page() {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<Users | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [decodedAccessToken, setDecodedAccessToken] = useState<any>(null);

    useEffect(() => {
        const getUserInfo = () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập");
                setLoading(false);
                return;
            }

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                setDecodedAccessToken(tokenData);
                let clientRoles: string[] = [];
                if (tokenData.resource_access) {
                    clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                }

                // Xây dựng đối tượng user từ thông tin trong token
                const userData: Users = {
                    id: tokenData.sub || '',
                    username: tokenData.preferred_username || '',
                    email: tokenData.email || '',
                    firstName: tokenData.given_name || '',
                    lastName: tokenData.family_name || '',
                    roles: clientRoles,
                    realmRoles: tokenData.realm_access?.roles || [],
                    clientRoles: clientRoles,
                    enabled: true
                };

                setUser(userData);
            } catch (err) {
                console.error("Lỗi khi lấy thông tin người dùng từ session:", err);
                setError("Không thể lấy thông tin người dùng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        getUserInfo();
    }, [session, status]);

    if (status === 'loading' || loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => window.location.reload()}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
                <p>Không tìm thấy thông tin người dùng.</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => window.location.reload()}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Thông tin người dùng</h2>

            {/* Debug section to view all user data */}
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-96">
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Debug - Tất cả thông tin:</h3>
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(user, null, 2)}
                </pre>

                <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-white">Session Data:</h3>
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(session, null, 2)}
                </pre>

                <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-white">Decoded Access Token:</h3>
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(decodedAccessToken, null, 2)}
                </pre>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Tên đăng nhập:</span>
                    <span className="text-gray-800 dark:text-white">{user.username}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Họ và tên:</span>
                    <span className="text-gray-800 dark:text-white">{user.firstName} {user.lastName}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Email:</span>
                    <span className="text-gray-800 dark:text-white">{user.email}</span>
                </div>

                {user.clientRoles && user.clientRoles.length > 0 && (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Vai trò:</span>
                        <div className="flex flex-wrap gap-2">
                            {user.clientRoles.map((role, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {user.realmRoles && user.realmRoles.length > 0 && (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Vai trò hệ thống:</span>
                        <div className="flex flex-wrap gap-2">
                            {user.realmRoles
                                .filter(role => !['default-roles-yellow cat company', 'offline_access', 'uma_authorization'].includes(role))
                                .map((role, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm"
                                    >
                                        {role}
                                    </span>
                                ))
                            }
                        </div>
                    </div>
                )}

                <div className="flex items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Trạng thái:</span>
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Đang hoạt động
                    </span>
                </div>
            </div>
        </div>
    );
}


// "use client";
//
// import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import LoadingSpinner from '@/components/LoadingSpinner';
// import { jwtDecode } from 'jwt-decode';
//
// interface Users {
//     id: string;
//     username: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     roles: string[];
//     realmRoles: string[];
//     clientRoles: string[];
//     enabled: boolean;
// }
//
// interface DecodedToken {
//     sub?: string;
//     preferred_username?: string;
//     email?: string;
//     given_name?: string;
//     family_name?: string;
//     realm_access?: {
//         roles: string[];
//     };
//     resource_access?: {
//         [clientId: string]: {
//             roles: string[];
//         };
//     };
//     [key: string]: any;
// }
//
// export default function Page() {
//     const { data: session, status } = useSession();
//     const [user, setUser] = useState<Users | null>(null);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//
//     useEffect(() => {
//         const getUserInfo = () => {
//             if (status === 'loading') {
//                 return;
//             }
//
//             if (status === 'unauthenticated' || !session) {
//                 setError("Người dùng chưa đăng nhập");
//                 setLoading(false);
//                 return;
//             }
//
//             try {
//                 const accessToken = session.accessToken as string;
//                 if (!accessToken) {
//                     throw new Error("Không tìm thấy access token hợp lệ");
//                 }
//
//                 const tokenData = jwtDecode<DecodedToken>(accessToken);
//                 let clientRoles: string[] = [];
//                 if (tokenData.resource_access) {
//                     clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
//                 }
//
//                 // Xây dựng đối tượng user từ thông tin trong token
//                 const userData: Users = {
//                     id: tokenData.sub || '',
//                     username: tokenData.preferred_username || '',
//                     email: tokenData.email || '',
//                     firstName: tokenData.given_name || '',
//                     lastName: tokenData.family_name || '',
//                     roles: clientRoles,
//                     realmRoles: tokenData.realm_access?.roles || [],
//                     clientRoles: clientRoles,
//                     enabled: true
//                 };
//
//                 setUser(userData);
//             } catch (err) {
//                 console.error("Lỗi khi lấy thông tin người dùng từ session:", err);
//                 setError("Không thể lấy thông tin người dùng. Vui lòng thử lại sau.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         getUserInfo();
//     }, [session, status]);
//
//     if (status === 'loading' || loading) {
//         return <LoadingSpinner />;
//     }
//
//     if (error) {
//         return (
//             <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
//                 <p>{error}</p>
//                 <button
//                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     onClick={() => window.location.reload()}
//                 >
//                     Thử lại
//                 </button>
//             </div>
//         );
//     }
//
//     if (!user) {
//         return (
//             <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
//                 <p>Không tìm thấy thông tin người dùng.</p>
//                 <button
//                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     onClick={() => window.location.reload()}
//                 >
//                     Thử lại
//                 </button>
//             </div>
//         );
//     }
//
//     return (
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
//             <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Thông tin người dùng</h2>
//
//             <div className="space-y-4">
//                 <div className="flex flex-col md:flex-row md:items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Tên đăng nhập:</span>
//                     <span className="text-gray-800 dark:text-white">{user.username}</span>
//                 </div>
//
//                 <div className="flex flex-col md:flex-row md:items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Họ và tên:</span>
//                     <span className="text-gray-800 dark:text-white">{user.firstName} {user.lastName}</span>
//                 </div>
//
//                 <div className="flex flex-col md:flex-row md:items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Email:</span>
//                     <span className="text-gray-800 dark:text-white">{user.email}</span>
//                 </div>
//
//                 {user.clientRoles && user.clientRoles.length > 0 && (
//                     <div className="flex flex-col">
//                         <span className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Vai trò:</span>
//                         <div className="flex flex-wrap gap-2">
//                             {user.clientRoles.map((role, index) => (
//                                 <span
//                                     key={index}
//                                     className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
//                                 >
//                                     {role}
//                                 </span>
//                             ))}
//                         </div>
//                     </div>
//                 )}
//
//                 {user.realmRoles && user.realmRoles.length > 0 && (
//                     <div className="flex flex-col">
//                         <span className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Vai trò hệ thống:</span>
//                         <div className="flex flex-wrap gap-2">
//                             {user.realmRoles
//                                 .filter(role => !['default-roles-yellow cat company', 'offline_access', 'uma_authorization'].includes(role))
//                                 .map((role, index) => (
//                                     <span
//                                         key={index}
//                                         className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm"
//                                     >
//                                         {role}
//                                     </span>
//                                 ))
//                             }
//                         </div>
//                     </div>
//                 )}
//
//                 <div className="flex items-center">
//                     <span className="font-semibold text-gray-600 dark:text-gray-300 w-32">Trạng thái:</span>
//                     <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
//                         Đang hoạt động
//                     </span>
//                 </div>
//             </div>
//         </div>
//     );
// }