"use client";

import React from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa'; // Import các icon cần thiết

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-16 bg-white rounded-lg shadow-lg"> {/* Thêm background trắng, bo tròn, shadow */}
            {/* Tiêu đề trang Liên hệ */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-gray-900 drop-shadow-sm">
                LIÊN HỆ VỚI CHÚNG TÔI
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start"> {/* Tăng khoảng cách giữa các cột */}
                {/* Phần thông tin liên hệ và giới thiệu */}
                <div className="flex flex-col space-y-8 p-6 bg-gray-50 rounded-xl shadow-md"> {/* Thêm padding, background, bo tròn, shadow */}
                    <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b-2 border-red-500 pb-2 inline-block">
                        THÔNG TIN LIÊN HỆ
                    </h2>

                    <div className="flex items-start text-lg text-gray-700"> {/* Dùng items-start cho icon và text */}
                        <FaMapMarkerAlt className="text-red-600 mr-4 text-3xl flex-shrink-0 mt-1" /> {/* Icon lớn hơn, màu đậm hơn */}
                        <div>
                            <h3 className="font-semibold text-gray-900">ĐỊA CHỈ TRỤ SỞ:</h3>
                            <p>Tòa nhà FPT Polytechnic, đường Trịnh Văn Bô, Phương Canh, Nam Từ Liêm, Hà Nội</p> {/* Cập nhật địa chỉ */}
                        </div>
                    </div>

                    <div className="flex items-start text-lg text-gray-700">
                        <FaPhoneAlt className="text-green-600 mr-4 text-3xl flex-shrink-0 mt-1" /> {/* Icon lớn hơn, màu đậm hơn */}
                        <div>
                            <h3 className="font-semibold text-gray-900">SỐ ĐIỆN THOẠI:</h3>
                            <p>0123456789</p> {/* Cập nhật số điện thoại */}
                        </div>
                    </div>

                    <div className="flex items-start text-lg text-gray-700">
                        <FaEnvelope className="text-blue-600 mr-4 text-3xl flex-shrink-0 mt-1" /> {/* Icon lớn hơn, màu đậm hơn */}
                        <div>
                            <h3 className="font-semibold text-gray-900">EMAIL HỖ TRỢ:</h3> {/* Đổi tiêu đề */}
                            <p>contact@sneakerpeak.com</p> {/* Giữ nguyên email của bạn */}
                        </div>
                    </div>

                    {/* Phần giới thiệu ngắn về cửa hàng */}
                    <div className="mt-8 pt-6 border-t border-gray-200"> {/* Thêm border top */}
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">VỀ SNEAKERPEAK</h2> {/* Đổi tiêu đề */}
                        <p className="text-gray-700 leading-relaxed mb-4 text-justify">
                            Chào mừng bạn đến với <span className="font-bold text-red-600">SneakerPeak</span> – điểm đến lý tưởng cho những đôi giày thể thao và phong cách streetwear chính hãng. Chúng tôi tự hào mang đến một không gian mua sắm đáng tin cậy, nơi bạn có thể khám phá những bộ sưu tập đa dạng từ các thương hiệu hàng đầu thế giới.
                        </p>
                        <h3 className="text-xl font-bold mb-2 text-gray-800">ĐAM MÊ VÀ SÁNG TẠO</h3> {/* Đổi tiêu đề */}
                        <p className="text-gray-700 leading-relaxed text-justify">
                            SneakerPeak luôn nỗ lực không ngừng để đổi mới, mang đến những xu hướng mới nhất và đáp ứng mọi nhu cầu của khách hàng yêu giày.
                        </p>
                    </div>
                </div>

                {/* Phần bản đồ Google Maps */}
                <div className="w-full h-[450px] md:h-[600px] bg-gray-200 rounded-xl overflow-hidden shadow-2xl border border-gray-300"> {/* Tăng chiều cao, bo tròn nhiều hơn, shadow lớn hơn, thêm border */}
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.619082728987!2d105.81755187449514!3d21.00847058866299!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac84047a9641%3A0x6e788c0399581a8b!2s72%20P.%20T%C3%A2y%20S%C6%A1n%2C%20Trung%20Li%E1%BB%87t%2C%20%C4%90%E1%BB%91ng%20%C4%90a%2C%20H%C3%A0%20N%E1%BB%99i!5e0!3m2!1svi!2svn!4v1716531398858!5m2!1svi!2svn" // Vẫn là placeholder, bạn cần thay thế bằng SRC THẬT CỦA FPT POLYTECHNIC HÀ NỘI
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Vị trí Trường Cao đẳng FPT Polytechnic Hà Nội" // Cập nhật title rõ ràng hơn
                    ></iframe>
                </div>
            </div>
        </div>
    );
}