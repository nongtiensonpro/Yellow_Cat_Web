"use client";

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DemoModel {
  id: number;
  name: string;
  age: number;
}

interface ApiResponseData {
  content: DemoModel[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse {
  timestamp: string;
  status: number;
  message: string;
  data: ApiResponseData;
}

export default function AboutPage() {
  const [demoData, setDemoData] = useState<DemoModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  //Trang đầu tiên hiển thị
  const [currentPage, setCurrentPage] = useState<number>(0);

  ///Số phần tử muốn hiển thị
  const [itemsPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/demo/all?page=${currentPage}&size=${itemsPerPage}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const apiResponse: ApiResponse = await response.json();

        setDemoData(apiResponse.data.content);
        setTotalPages(apiResponse.data.totalPages);
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Lỗi khi tải dữ liệu demo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, [currentPage, itemsPerPage]);

  // Change page (using zero-based indexing internally)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Dữ Liệu API Demo
        </h1>
        <div className="max-w-4xl mx-auto">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Họ Tên</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tuổi</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {demoData && demoData.length > 0 ? (
                        demoData.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.age}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                            Không có dữ liệu
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 0}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className="sr-only">Trước</span>
                          &laquo;
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i).map((number) => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`relative inline-flex items-center px-4 py-2 border ${currentPage === number ? 'bg-yellow-500 text-white border-yellow-500 dark:border-yellow-600' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                              {number + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages - 1 || totalPages === 0}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === totalPages - 1 || totalPages === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className="sr-only">Sau</span>
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