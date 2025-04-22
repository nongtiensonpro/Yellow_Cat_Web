import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import LoginButton from '@/components/login-button';
import PaginationControls from '@/components/pagination-controls';
import AttributeActions from '@/components/attribute-actions';
import WebSocketNotifications from '@/components/websocket-notifications';

interface Attributes {
    id: number;
    attributeName: string;
    dataType: string;
}

interface ApiResponse {
    data: {
        content: Attributes[];
        totalPages: number;
    };
}

export default async function AttributesPage({
    searchParams,
}: {
    searchParams: { page?: string; size?: string };
}) {
    // Get session on the server
    const session = await getServerSession(authOptions);

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">
                    Attributes Management
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    You need to be logged in to view this page.
                </p>
                <LoginButton />
            </div>
        );
    }

    // Parse pagination params
    const currentPage = parseInt(searchParams.page || '0', 10);
    const itemsPerPage = parseInt(searchParams.size || '5', 10);

    // Fetch data from API
    let attributesData: Attributes[] = [];
    let totalPages = 1;
    let error: string | null = null;

    try {
        const token = session.accessToken;
        if (!token) {
            throw new Error('No authentication token available');
        }

        const response = await fetch(
            `http://localhost:8080/api/attributes?page=${currentPage}&size=${itemsPerPage}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }

        const apiResponse: ApiResponse = await response.json();
        attributesData = apiResponse.data.content;
        totalPages = apiResponse.data.totalPages;
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to fetch data';
    }

    return (
        <div>
            {/* Render header */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Quản lý Attributes</h1>
                <Link
                    href="/admin/product_management/attributes/create"
                    className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                >
                    Thêm mới
                </Link>
            </header>

            {/* Render notification */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Render table */}
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Attributes Id
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Attributes Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {attributesData.length > 0 ? (
                    attributesData.map((attribute) => (
                        <tr key={attribute.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {attribute.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {attribute.attributeName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {attribute.dataType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/admin/product_management/attributes/update/${attribute.id}`}
                                        className="inline-block px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                    >
                                        Sửa
                                    </Link>
                                    <AttributeActions attributeId={attribute.id} attributeName={attribute.attributeName} />
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                            Không có dữ liệu thuộc tính.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            <PaginationControls 
                currentPage={currentPage} 
                totalPages={totalPages} 
                basePath="/admin/product_management/attributes"
            />

            {/* WebSocket notifications */}
            <WebSocketNotifications />
        </div>
    );
}