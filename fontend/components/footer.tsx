"use client"

import React from 'react';
import { Link } from "@heroui/link"; // Assuming you want to use HeroUI's Link
import { FaFacebook, FaYoutube, FaInstagram } from 'react-icons/fa'; // Import social icons
import { FaTiktok } from 'react-icons/fa6'; // Assuming you might use this for TikTok if available
import { Button, Input } from "@heroui/react"; // Giả sử HeroUI có các component này

export const Footer = () => {
    return (
        <footer className="bg-[#1a1a1a] dark:bg-gray-900 text-gray-300 dark:text-gray-200">
            {/* Top Section: Newsletter & Social Icons */}
            <div className="bg-[#8b2b2b] dark:bg-red-900 py-4">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <span className="text-white dark:text-gray-100 font-bold mr-4">ĐĂNG KÝ NHẬN TIN</span>
                        <div className="flex">
                            <Input
                                type="email"
                                placeholder="Email của bạn"
                                className="rounded-l-md text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-600 focus:ring-red-500 text-sm"
                            />
                            <Button
                                className="rounded-r-md bg-black dark:bg-gray-700 text-white px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200 text-sm"
                            >
                                ĐĂNG KÝ
                            </Button>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="bg-black dark:bg-gray-700 p-2 rounded-sm hover:opacity-80 transition-opacity">
                            <FaTiktok size={18} className="text-white" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bg-black dark:bg-gray-700 p-2 rounded-sm hover:opacity-80 transition-opacity">
                            <FaYoutube size={18} className="text-white" />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-black dark:bg-gray-700 p-2 rounded-sm hover:opacity-80 transition-opacity">
                            <FaFacebook size={18} className="text-white" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-black dark:bg-gray-700 p-2 rounded-sm hover:opacity-80 transition-opacity">
                            <FaInstagram size={18} className="text-white" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Giới Thiệu (About) */}
                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">GIỚI THIỆU</h3>
                    <p className="text-sm leading-relaxed mb-4">
                        SneakerPeak Store chuyên cung cấp cấp các loại giày thể thao
                    </p>
                    <div className="text-sm space-y-2">
                        <p className="flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                            Tòa nhà FPT Polytechnic, đường Trịnh Văn Bô, Phương Canh, Nam Từ Liêm, Hà Nội
                        </p>
                        <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06L6.223 10.61a1 1 0 00-.232 1.092l2.547 2.547a1 1 0 001.092-.232l1.37-1.37a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                            0123456789
                        </p>
                        <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                            sneakerpeak@gmail.com
                        </p>
                    </div>
                </div>

                {/* Chính Sách (Policies) */}
                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">CHÍNH SÁCH</h3>
                    <ul className="space-y-2 text-sm">
                        {/* Thêm class 'text-white' vào đây */}
                        <li><Link href="#" className="text-white hover:text-white">Chính sách bảo mật thông tin</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Chính sách thanh toán</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Chính sách vận chuyển và giao nhận</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Chính sách kiểm hàng</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Chính sách xử lý khiếu nại</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Chính sách bảo hành</Link></li>
                    </ul>
                </div>

                {/* Hướng Dẫn (Guide) */}
                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">HƯỚNG DẪN</h3>
                    <ul className="space-y-2 text-sm">
                        {/* Thêm class 'text-white' vào đây */}
                        <li><Link href="#" className="text-white hover:text-white">Hướng dẫn order</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Hướng dẫn mua hàng</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Điều khoản dịch vụ</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Tất cả sản phẩm</Link></li>
                        <li><Link href="#" className="text-white hover:text-white">Liên hệ</Link></li>
                    </ul>
                </div>

                {/* Fanpage Chúng Tôi (Our Fanpage) */}
                <div>
                    <h3 className="text-white font-semibold text-lg mb-4">FANPAGE CHÚNG TÔI</h3>
                    {/* Placeholder for Facebook Page Plugin */}
                    <div className="bg-gray-700 h-48 w-full flex items-center justify-center text-gray-400 text-center">
                        {/* For a real Facebook Fanpage embed, you would use Facebook's Page Plugin.
                            Example:
                            <iframe
                                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FYourFacebookPage&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=YOUR_APP_ID"
                                width="100%"
                                height="200"
                                style={{ border: 'none', overflow: 'hidden' }}
                                scrolling="no"
                                frameBorder="0"
                                allowFullScreen={true}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            ></iframe>
                            Remember to replace 'YourFacebookPage' and 'YOUR_APP_ID'.
                        */}
                        <p>Facebook Fanpage  here</p>
                    </div>
                </div>
            </div>

            {/* Copyright Section */}
            <div className="border-t border-gray-700 py-4 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} By SneakerPeak Store
            </div>
        </footer>
    );
};