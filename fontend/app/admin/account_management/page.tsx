"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';

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

export default function Page() {
    const { data: session, status } = useSession();
    const [demoData, setDemoData] = useState<Users[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(5);

    useEffect(() => {
        if (status === 'authenticated' && session) {
            fetchDemoData();
        } else if (status !== 'loading') {
            setLoading(false);
        }
    }, [status, session]);

    const login = () => {
        signIn('keycloak');
    };

    const fetchDemoData = async () => {
        try {
            setLoading(true);

            const token = session?.accessToken;

            if (!token) {
                throw new Error('No authentication token available');
            }

            const response = await fetch('http://localhost:8080/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
                } catch {
                    errorMessage += errorText ? ` - ${errorText}` : '';
                }
                console.error(errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setDemoData(data);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? `Failed to fetch data: ${err.message}`
                : 'Failed to fetch data. Please try again later.';
            setError(errorMessage);
            console.error('Error fetching demo data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get current items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = demoData.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Calculate total pages
    const totalPages = Math.ceil(demoData.length / itemsPerPage);

    // Check if user is authenticated
    if (status === 'unauthenticated') {
        return (
            <section className="mb-12">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">
                        Users Management
                    </h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">
                        You need to be logged in to view this page.
                    </p>
                    <button
                        onClick={login}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </section>
        );
    }

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <section className="mb-12">
                <div className="max-w-6xl mx-auto text-center">
                    <LoadingSpinner />
                </div>
            </section>
        );
    }

    return (
        <section className="mb-12">
            <h1 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
                Users Management
            </h1>
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Full Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{`${item.firstName} ${item.lastName}`}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.roles.map((role, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        >
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.enabled 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                    {item.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {demoData.length > 0 && (
                            <div className="flex justify-center mt-6">
                                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        &laquo;
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number)}
                                            className={`relative inline-flex items-center px-4 py-2 border ${currentPage === number ? 'bg-yellow-500 text-white border-yellow-500 dark:border-yellow-600' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {number}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        &raquo;
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}