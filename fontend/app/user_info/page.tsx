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
//     const [decodedAccessToken, setDecodedAccessToken] = useState<any>(null);
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
//                 setDecodedAccessToken(tokenData);
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
//             {/* Debug section to view all user data */}
//             <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-96">
//                 <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Debug - Tất cả thông tin:</h3>
//                 <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
//                     {JSON.stringify(user, null, 2)}
//                 </pre>
//
//                 <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-white">Session Data:</h3>
//                 <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
//                     {JSON.stringify(session, null, 2)}
//                 </pre>
//
//                 <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-white">Decoded Access Token:</h3>
//                 <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
//                     {JSON.stringify(decodedAccessToken, null, 2)}
//                 </pre>
//             </div>
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

//
// "use client";
//
// import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import LoadingSpinner from '@/components/LoadingSpinner';
// import { jwtDecode } from 'jwt-decode';
//
// interface User {
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
// export default function UserProfilePage() {
//     const { data: session, status } = useSession();
//     const [user, setUser] = useState<User | null>(null);
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
//                 setError("Người dùng chưa đăng nhập.");
//                 setLoading(false);
//                 return;
//             }
//
//             try {
//                 const accessToken = session.accessToken as string;
//                 if (!accessToken) {
//                     throw new Error("Không tìm thấy access token hợp lệ.");
//                 }
//
//                 const tokenData = jwtDecode<DecodedToken>(accessToken);
//                 let clientRoles: string[] = [];
//                 if (tokenData.resource_access) {
//                     clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
//                 }
//
//                 const userData: User = {
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
//             <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Thông tin cá nhân</h2>
//
//             {/* Thông tin người dùng hiển thị dưới dạng bảng */}
//             <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                     <tr>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300 w-48">Tên đăng nhập:</td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">{user.username}</td>
//                     </tr>
//                     <tr>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">Họ và tên:</td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">{user.firstName} {user.lastName}</td>
//                     </tr>
//                     <tr>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">Email:</td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">{user.email}</td>
//                     </tr>
//
//                     {user.clientRoles && user.clientRoles.length > 0 && (
//                         <tr>
//                             <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">Vai trò:</td>
//                             <td className="px-6 py-3 text-sm text-gray-800 dark:text-white">
//                                 <div className="flex flex-wrap gap-2">
//                                     {user.clientRoles.map((role, index) => (
//                                         <span
//                                             key={index}
//                                             className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
//                                         >
//                                                 {role}
//                                             </span>
//                                     ))}
//                                 </div>
//                             </td>
//                         </tr>
//                     )}
//
//                     {user.realmRoles && user.realmRoles.length > 0 && (
//                         <tr>
//                             {/*<td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">Vai trò hệ thống (Realm):</td>*/}
//                             <td className="px-6 py-3 text-sm text-gray-800 dark:text-white">
//                                 <div className="flex flex-wrap gap-2">
//                                     {user.realmRoles
//                                         .filter(role => !['default-roles-yellow cat company', 'offline_access', 'uma_authorization'].includes(role))
//                                         .map((role, index) => (
//                                             <span
//                                                 key={index}
//                                                 className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm"
//                                             >
//                                                     {role}
//                                                 </span>
//                                         ))
//                                     }
//                                 </div>
//                             </td>
//                         </tr>
//                     )}
//
//                     <tr>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300">Trạng thái:</td>
//                         <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">
//                                 <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
//                                     Đang hoạt động
//                                 </span>
//                         </td>
//                     </tr>
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }






"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { jwtDecode } from 'jwt-decode';

interface User {
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

export default function UserProfilePage() {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getUserInfo = () => {
            if (status === 'loading') {
                return;
            }

            if (status === 'unauthenticated' || !session) {
                setError("Người dùng chưa đăng nhập.");
                setLoading(false);
                return;
            }

            try {
                const accessToken = session.accessToken as string;
                if (!accessToken) {
                    throw new Error("Không tìm thấy access token hợp lệ.");
                }

                const tokenData = jwtDecode<DecodedToken>(accessToken);
                let clientRoles: string[] = [];
                if (tokenData.resource_access) {
                    clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
                }

                const userData: User = {
                    id: tokenData.sub || '',
                    username: tokenData.preferred_username || '',
                    email: tokenData.email || '',
                    firstName: tokenData.given_name || '',
                    lastName: tokenData.family_name || '',
                    roles: clientRoles, // Giữ nguyên roles nếu bạn cần dùng nó ở đâu đó, nhưng ưu tiên clientRoles và realmRoles để hiển thị
                    realmRoles: tokenData.realm_access?.roles || [],
                    clientRoles: clientRoles,
                    enabled: true // Giả định người dùng luôn được kích hoạt nếu có token hợp lệ
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
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Sidebar Left */}
            <div className="md:w-1/4 lg:w-1/5 bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg md:mr-4 mb-4 md:mb-0">
                <div className="flex flex-col items-center mb-6">
                    {/* Placeholder for avatar */}
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-4xl font-bold mb-3">
                        {user.firstName ? user.firstName[0].toUpperCase() : 'N/A'}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{user.firstName} {user.lastName}</h3>
                    <button className="text-blue-500 hover:underline text-sm mt-1">Sửa hồ sơ</button>
                </div>

                <nav>
                    <ul>
                        <li className="mb-2">
                            <a href="#" className="flex items-center p-3 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium">
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                Hồ sơ
                            </a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="flex items-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Địa chỉ
                            </a>
                        </li>
                        <li className="mb-2">
                            <a href="#" className="flex items-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                Đơn mua
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content Right */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Hồ sơ của tôi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Họ tên */}
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Họ tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="customerName"
                            name="customerName"
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            value={`${user.firstName} ${user.lastName}`}
                            readOnly
                        />
                    </div>
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            value={user.email}
                            readOnly
                        />
                    </div>

                </div>

                {/* Phần hiển thị vai trò như bạn đã có */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    {user.clientRoles && user.clientRoles.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Vai trò:</p>
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
                        <div className="mb-4">
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

                    <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Trạng thái:</p>
                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Đang hoạt động
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}