"use client";

import React from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

export default function ContactPage() {
    return (
        <div className="bg-white text-gray-800">


            {/* === Phần Nội Dung Chính (Form & Thông tin) === */}
            <div className="bg-slate-50">
                <div className="max-w-7xl mx-auto py-16 md:py-20 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* --- Cột Trái: Form Liên Hệ (Phong cách Tối giản) --- */}
                    <div className="bg-white p-8 md:p-10 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gửi Lời Nhắn</h2>
                        <p className="text-gray-600 mb-8">Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>

                        <form action="#" method="POST" className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    autoComplete="name"
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    // Thay đổi các class dưới đây
                                    className="block w-full rounded-md border-slate-300 bg-slate-50 focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    autoComplete="email"
                                    placeholder="Ví dụ: email@example.com"
                                    // Thay đổi các class dưới đây
                                    className="block w-full rounded-md border-slate-300 bg-slate-50 focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">Nội dung</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    placeholder="Bạn cần chúng tôi hỗ trợ vấn đề gì?"
                                    // Thay đổi các class dưới đây
                                    className="block w-full rounded-md border-slate-300 bg-slate-50 focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    // Sửa lại nút bấm cho nhất quán và hiện đại hơn
                                    className="w-full justify-center rounded-lg border border-transparent bg-blue-600 py-3 px-4 text-base font-bold text-white shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-300"
                                >
                                    GỬI TIN NHẮN
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* --- Cột Phải: Thông tin & Bản đồ --- */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Thông Tin Cửa Hàng</h2>
                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="h-6 w-6 flex-shrink-0 text-red-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Địa chỉ</h3>
                                        <p className="text-gray-600">Tòa nhà FPT Polytechnic, đường Trịnh Văn Bô, Phương Canh, Nam Từ Liêm, Hà Nội</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <FaPhoneAlt className="h-6 w-6 flex-shrink-0 text-red-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Điện thoại</h3>
                                        <p className="text-gray-600 hover:text-red-600 transition-colors"><a href="tel:0123456789">0123.456.789</a></p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <FaEnvelope className="h-6 w-6 flex-shrink-0 text-red-600 mt-1" />
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                                        <p className="text-gray-600 hover:text-red-600 transition-colors"><a href="mailto:contact@sneakerpeak.com">contact@sneakerpeak.com</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps Embed */}
                        <div className="w-full h-80 md:h-96 bg-gray-200 rounded-lg overflow-hidden shadow-sm border border-slate-200">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863892716584!2d105.74459841542336!3d21.03813279283592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313454b991d80fd5%3A0x53ce12c216b64f3c!2zVHLGsOG7nW5nIENhbyDEkeG6s25nIEZQVCBQb2x5dGVjaG5pYw!5e0!3m2!1svi!2s!4v1657448291888!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Vị trí FPT Polytechnic Hà Nội"
                            ></iframe>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}