'use client';

import React from 'react';
import Image from 'next/image';
import Link from "next/link";

// Icon component để dễ dàng tái sử dụng (lấy từ Heroicons)
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconCollection = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L12 15.25l5.571-3M6.429 9.75L12 6.75l5.571 3" />
    </svg>
);

const IconSupport = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-6-6v0a6 6 0 00-6 6v1.5m12 0v-1.5a6 6 0 00-6-6v0a6 6 0 00-6 6v1.5" />
    </svg>
);

const AboutSection = () => {
  return (
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* === SECTION 1: HERO === */}
          <section className="py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 text-center md:text-left">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                  Nơi Đam Mê Gặp Gỡ <span className="text-red-600">Phong Cách</span>.
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto md:mx-0">
                  Chào mừng bạn đến với <span className="font-semibold text-red-600">SneakerPeak</span>. Chúng tôi không chỉ bán giày, mà còn lan tỏa niềm đam mê và đồng hành cùng bạn trên hành trình khẳng định cá tính qua từng đôi sneaker.
                </p>
                <p className="mt-4 text-lg text-gray-600 max-w-lg mx-auto md:mx-0">
                  Khởi đầu từ năm 2025, SneakerPeak tự hào là điểm đến uy tín cho cộng đồng yêu giày Việt Nam.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg transform transition-transform duration-500">
                  <Image
                      src="/images/img.png" // Đảm bảo đường dẫn hình ảnh chính xác
                      alt="Đội ngũ SneakerPeak"
                      layout="fill"
                      objectFit="cover"
                  />
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* === SECTION 2: WHY CHOOSE US? === */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Vì Sao Chọn SneakerPeak?
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Chúng tôi mang đến sự an tâm tuyệt đối và trải nghiệm mua sắm đẳng cấp mà bạn xứng đáng có được.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {/* Feature 1 */}
              <div className="p-8">
                <div className="flex justify-center items-center mb-4">
                  <IconCheck />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">100% Chính Hãng</h3>
                <p className="mt-2 text-gray-600">
                  Mọi sản phẩm đều được xác thực bởi chuyên gia, cam kết nguồn gốc và chất lượng tuyệt đối.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="p-8">
                <div className="flex justify-center items-center mb-4">
                  <IconCollection />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Bộ Sưu Tập Độc Đáo</h3>
                <p className="mt-2 text-gray-600">
                  Luôn cập nhật các phiên bản giới hạn và những mẫu giày hot nhất từ các thương hiệu hàng đầu.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="p-8">
                <div className="flex justify-center items-center mb-4">
                  <IconSupport />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Dịch Vụ Tận Tâm</h3>
                <p className="mt-2 text-gray-600">
                  Đội ngũ tư vấn chuyên nghiệp, sẵn sàng hỗ trợ bạn tìm kiếm đôi giày hoàn hảo nhất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* === SECTION 3: MISSION & VISION === */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-4">
                Sứ Mệnh
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Mang đến một không gian mua sắm giày authentic đáng tin cậy, nơi mỗi sản phẩm là một câu chuyện và là tuyên ngôn cho phong cách riêng của bạn. Chúng tôi cam kết về tính chính hãng, dịch vụ tận tâm và chính sách hậu mãi rõ ràng.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-4">
                Tầm Nhìn
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Trở thành hệ thống bán lẻ sneaker hàng đầu Việt Nam, một biểu tượng của sự uy tín, chất lượng và là nguồn cảm hứng vô tận cho cộng đồng đam mê giày thể thao trên cả nước.
              </p>
            </div>
          </div>
        </section>

        {/* === SECTION 4: CALL TO ACTION === */}
        <section className="bg-white pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-900 text-white text-center rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sẵn Sàng Khám Phá?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Bộ sưu tập mới nhất đang chờ bạn. Hãy tìm cho mình đôi giày hoàn hảo và tự tin sải bước.
              </p>
              <Link
                  href="/products" // Thay đổi link đến trang sản phẩm của bạn
                  className="inline-block bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg uppercase tracking-wide hover:bg-red-700 transition-colors duration-300"
              >
                Mua Sắm Ngay
              </Link>
            </div>
          </div>
        </section>

      </div>
  );
};

export default AboutSection;

