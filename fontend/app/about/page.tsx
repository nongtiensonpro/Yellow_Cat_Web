import { notFound } from 'next/navigation';

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

async function fetchData(page: number, size: number): Promise<ApiResponse> {
  const response = await fetch(`http://localhost:8080/demo/all?page=${page}&size=${size}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  return response.json();
}

export default async function AboutPage() {
  const page = 0;
  const size = 5;

  let demoData: DemoModel[] = [];
  let totalPages = 1;

  try {
    const apiResponse = await fetchData(page, size);
    demoData = apiResponse.data.content;
    totalPages = apiResponse.data.totalPages;
  } catch (error) {
    console.error('Error fetching data:', error);
    notFound();
  }

  return (
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Dữ Liệu API Demo
        </h1>
        <div className="max-w-4xl mx-auto">
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
              {demoData.length > 0 ? (
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
                </nav>
              </div>
          )}
        </div>
      </section>
  );
}