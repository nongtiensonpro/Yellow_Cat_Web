// import { notFound } from 'next/navigation';
//
// interface DemoModel {
//   id: number;
//   name: string;
//   age: number;
// }
//
// interface ApiResponseData {
//   content: DemoModel[];
//   currentPage: number;
//   totalItems: number;
//   totalPages: number;
//   size: number;
//   first: boolean;
//   last: boolean;
// }
//
// interface ApiResponse {
//   timestamp: string;
//   status: number;
//   message: string;
//   data: ApiResponseData;
// }
//
// async function fetchData(page: number, size: number): Promise<ApiResponse> {
//   const response = await fetch(`http://localhost:8080/demo/all?page=${page}&size=${size}`, {
//     cache: 'no-store',
//   });
//
//   if (!response.ok) {
//     throw new Error('Failed to fetch data');
//   }
//
//   return response.json();
// }
//
// // Assuming this is your about page structure
// import { Suspense } from 'react';
//
// // Create a component that fetches data
// async function DemoData() {
//   try {
//     // Use a longer revalidation period or make it explicitly dynamic
//     const res = await fetch('http://localhost:8080/demo/all?page=0&size=5', {
//       next: { revalidate: 3600 }, // Revalidate every hour instead of every request
//     });
//
//     const data = await res.json();
//
//     return (
//       <div>
//         {/* Render your data here */}
//         <pre>{JSON.stringify(data, null, 2)}</pre>
//       </div>
//     );
//   } catch (error) {
//     return <div>Failed to load data</div>;
//   }
// }
//
// // Use a fallback for the data component
// export const dynamic = 'force-dynamic';
//
// export default async function AboutPage() {
//   const page = 0;
//   const size = 5;
//
//   let demoData: DemoModel[] = [];
//   let totalPages = 1;
//
//   try {
//     const apiResponse = await fetchData(page, size);
//     demoData = apiResponse.data.content;
//     totalPages = apiResponse.data.totalPages;
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     notFound();
//   }
//
//   return (
//     <section className="mb-12">
//       <h1 className="text-4xl font-bold text-center mb-6 text-gray-800 dark:text-white">
//         Dữ Liệu API Demo
//       </h1>
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//             <thead className="bg-gray-50 dark:bg-gray-700">
//               <tr>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Họ Tên</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tuổi</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//               {demoData.length > 0 ? (
//                 demoData.map((item) => (
//                   <tr key={item.id}>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.id}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.name}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.age}</td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
//                     Không có dữ liệu
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//
//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex justify-center mt-6">
//             <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//             </nav>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }


// app/about/page.tsx
"use client";

import React from 'react';
import Image from 'next/image'; // Để tối ưu hóa hình ảnh

export default function AboutPage() {
  return (
      // Loại bỏ 'container' và 'mx-auto'
      <div className="w-full bg-gray-50"> {/* Sử dụng w-full để tràn chiều rộng */}
        {/* Thêm một div bọc ngoài với padding để kiểm soát khoảng cách từ các cạnh */}
        <div className="px-4 py-12 md:px-8 md:py-16 lg:px-16"> {/* Điều chỉnh padding ở đây */}
          {/* Phần tiêu đề */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-gray-900 drop-shadow-sm">
            VỀ CHÚNG TÔI - SNEAKERPEAK
          </h1>

          {/* Phần giới thiệu chung và hình ảnh chính */}
          {/* Để phần này tràn ra, chúng ta cần đảm bảo flex container không bị giới hạn quá mức */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 mb-16 max-w-7xl mx-auto"> {/* Thêm max-w và mx-auto để nội dung chính giữa nhưng không bị quá rộng trên màn hình lớn */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-lg h-80 md:h-96 rounded-xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500 ease-in-out">
                <Image
                    src="/images/img.png"
                    alt="SneakerPeak Team"
                    layout="fill"
                    objectFit="cover"
                    className="transition-opacity duration-500"
                />
              </div>
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-5 text-gray-800 leading-tight">
                Hành Trình Khẳng Định Phong Cách <br className="hidden md:block" /> Cùng <span className="text-red-600">SneakerPeak</span>
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-4 max-w-prose mx-auto md:mx-0">
                Tại <span className="font-bold text-red-600">SneakerPeak</span>, chúng tôi không chỉ bán giày; chúng tôi kiến tạo phong cách, thổi bùng đam mê và đồng hành cùng bạn trên mọi nẻo đường. Từ những bước chân đầu tiên vào năm 2025, SneakerPeak đã lớn mạnh trở thành điểm đến tin cậy cho những tín đồ sneaker tại Việt Nam, mang đến bộ sưu tập giày chính hãng đa dạng và độc đáo nhất.
              </p>
              <p className="text-lg leading-relaxed text-gray-700 max-w-prose mx-auto md:mx-0">
                Chúng tôi tự hào là cầu nối giữa bạn và những đôi giày mơ ước, từ những phiên bản kinh điển vượt thời gian đến những mẫu phát hành giới hạn "hot" nhất thị trường.
              </p>
            </div>
          </div>

          {/* Sứ mệnh & Tầm nhìn */}
          <div className="bg-gradient-to-r from-gray-100 to-white p-10 rounded-2xl shadow-xl mb-16 border border-gray-200 max-w-7xl mx-auto"> {/* Thêm max-w và mx-auto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-red-500 pb-2 inline-block">
                  Sứ Mệnh Của Chúng Tôi
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  Sứ mệnh của SneakerPeak là mang đến cho khách hàng trải nghiệm mua sắm giày authentic tuyệt vời nhất, nơi mỗi đôi giày không chỉ là sản phẩm mà còn là câu chuyện, là tuyên ngôn cá tính. Chúng tôi cam kết 100% sản phẩm chính hãng, dịch vụ tận tâm và chính sách hậu mãi minh bạch.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2 inline-block">
                  Tầm Nhìn Của Chúng Tôi
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">
                  Chúng tôi hướng tới việc trở thành hệ thống bán lẻ sneaker  hàng đầu Việt Nam, là biểu tượng của sự tin cậy, chất lượng và là nguồn cảm hứng bất tận cho cộng đồng yêu giày.
                </p>
              </div>
            </div>
          </div>

          {/* Tại sao chọn SneakerPeak? */}
          <div className="mb-16 max-w-7xl mx-auto"> {/* Thêm max-w và mx-auto */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800">
              Tại Sao Bạn Nên Chọn SneakerPeak?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center">
                <div className="bg-red-100 rounded-full p-4 mb-4">
                  <svg className="h-12 w-12 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">100% Chính Hãng</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  Mỗi sản phẩm tại SneakerPeak đều được kiểm tra kỹ lưỡng bởi đội ngũ chuyên gia, đảm bảo nguồn gốc rõ ràng và chất lượng tuyệt đối.
                </p>
              </div>
              <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-4 mb-4">
                  <svg className="h-12 w-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.22 13.91l-3.56-3.56.91-.91 2.65 2.65L16.48 9l.91.91-4.22 4.22c-.1.1-.24.15-.38.15s-.28-.05-.38-.15z"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Bộ Sưu Tập Đa Dạng</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  Luôn cập nhật những mẫu mã mới nhất, độc đáo nhất từ các thương hiệu hàng đầu thế giới như Nike, Adidas, Jordan, New Balance,...
                </p>
              </div>
              <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center">
                <div className="bg-green-100 rounded-full p-4 mb-4">
                  <svg className="h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-.01-5.5C10.79 9.5 10 8.71 10 7.72 10 6.73 10.79 6 11.78 6s1.78.73 1.78 1.72c0 .99-.79 1.78-1.78 1.78z"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Dịch Vụ Chuyên Nghiệp</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  Đội ngũ tư vấn tận tình, hỗ trợ nhanh chóng và chính sách đổi trả, bảo hành rõ ràng, mang lại sự yên tâm tuyệt đối cho khách hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Lời kêu gọi hành động */}
          {/*<div className="text-center bg-red-600 text-white p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center max-w-7xl mx-auto"> /!* Thêm max-w và mx-auto *!/*/}
          {/*  <h2 className="text-3xl md:text-4xl font-bold mb-4">*/}
          {/*    Sẵn Sàng Khám Phá Phong Cách Riêng Của Bạn?*/}
          {/*  </h2>*/}
          {/*  <p className="text-lg md:text-xl mb-8 max-w-3xl">*/}
          {/*    Hãy đến với SneakerPeak để tìm cho mình đôi giày hoàn hảo, nâng tầm diện mạo và tự tin sải bước trên con đường khẳng định cá tính riêng!*/}
          {/*  </p>*/}
          {/*  <a*/}
          {/*      href="/products"*/}
          {/*      className="inline-block bg-white text-red-700 font-extrabold py-4 px-10 rounded-full text-xl uppercase tracking-wide hover:bg-gray-100 hover:text-red-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"*/}
          {/*  >*/}
          {/*    MUA SẮM NGAY*/}
          {/*  </a>*/}
          {/*</div>*/}
        </div>
      </div>
  );
}