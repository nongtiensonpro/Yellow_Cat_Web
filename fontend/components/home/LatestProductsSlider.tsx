'use client';

import React, {useState, useEffect} from 'react';
import {ChevronLeftIcon, ChevronRightIcon, HeartIcon as HeartIconOutline} from '@heroicons/react/24/outline';
import {HeartIcon as HeartIconSolid} from '@heroicons/react/24/solid';
import {motion, AnimatePresence} from 'framer-motion';
import {CldImage} from "next-cloudinary";
import Link from "next/link";
import {
    Badge,
    Chip,
} from "@heroui/react";

interface ProductVariant {
    variantId: number;
    sku: string;
    colorName: string;
    sizeName: string;
    price: number;
    salePrice: number | null;
    quantityInStock: number;
    sold: number;
    imageUrl: string;
    weight: number;
    costPrice: number;
}

interface LatestProduct {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    materialId: number;
    materialName: string;
    targetAudienceId: number;
    targetAudienceName: string;
    thumbnail: string;
    minPrice: number;
    minSalePrice: number | null;
    totalStock: number;
    variants: ProductVariant[];
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: LatestProduct[];
}

const LatestProductsSlider: React.FC = () => {
    const [products, setProducts] = useState<LatestProduct[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<LatestProduct[]>([]);

    useEffect(() => {
        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
            try {
                const parsed: LatestProduct[] = JSON.parse(storedWishlist);
                setWishlist(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                console.error("Failed to parse wishlist from localStorage", e);
                setWishlist([]);
            }
        }
        window.dispatchEvent(new Event('wishlistUpdated'));
    }, []);

    useEffect(() => {
        const fetchLatestProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8080/api/products/latest');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const apiResponse: ApiResponse = await response.json();

                if (apiResponse.status === 200 && apiResponse.data) {
                    setProducts(apiResponse.data);
                } else {
                    throw new Error(apiResponse.message || 'Failed to fetch products');
                }
            } catch (err) {
                console.error('Error fetching latest products:', err);
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchLatestProducts();
    }, []);

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? products.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === products.length - 1 ? 0 : prevIndex + 1
        );
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getMainImage = (product: LatestProduct) => {
        // Ưu tiên thumbnail, nếu không có thì lấy ảnh đầu tiên từ variants
        if (product.thumbnail) {
            return product.thumbnail;
        }
        return product.variants[0]?.imageUrl || '/images/placeholder-product.jpg';
    };

    const toggleWishlist = (productToToggle: LatestProduct) => {
        const isWishlisted = wishlist.some(p => p.productId === productToToggle.productId);
        const updated = isWishlisted
            ? wishlist.filter(p => p.productId !== productToToggle.productId)
            : [...wishlist, productToToggle];

        setWishlist(updated);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        window.dispatchEvent(new Event('wishlistUpdated'));
    };

    const isInWishlist = (productId: number) => {
        return wishlist.some(p => p.productId === productId);
    };

    if (loading) {
        return (
            <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Đang tải sản phẩm mới nhất...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
                <div className="text-red-500">Lỗi: {error}</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Không có sản phẩm mới</div>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Các Sản Phẩm Mới Nhất
                </h2>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                {/* Main Slider */}
                <div className="relative h-96 md:h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{opacity: 0, x: 100}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -100}}
                            transition={{duration: 0.5}}
                            className="absolute inset-0"
                        >
                            {products[currentIndex] && (
                                <div className="relative h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                                    {/* Background Image */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-20"
                                        style={{
                                            backgroundImage: `url(${getMainImage(products[currentIndex])})`
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="relative h-full flex flex-col md:flex-row">
                                        {/* Image Section */}
                                        <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
                                            <div className="relative group">
                                                <CldImage
                                                    src={getMainImage(products[currentIndex])}
                                                    alt={products[currentIndex].productName}
                                                    width={320}
                                                    height={320}
                                                    className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-300"
                                                    quality={85}
                                                    loading="lazy"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWishlist(products[currentIndex]);
                                                    }}
                                                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
                                                    aria-label={isInWishlist(products[currentIndex].productId) ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            toggleWishlist(products[currentIndex]);
                                                        }
                                                    }}
                                                >
                                                    {isInWishlist(products[currentIndex].productId) ? (
                                                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                                                    ) : (
                                                        <HeartIconOutline className="w-5 h-5 text-gray-600 hover:text-red-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                          {/* Info Section */}
                                         <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                                             <div className="space-y-6">
                                                 {/* Brand & Category */}
                                                 <div className="flex items-center gap-3">
                                                     {products[currentIndex].logoPublicId && (
                                                         <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                             <CldImage 
                                                                 width={40} 
                                                                 height={40} 
                                                                 src={products[currentIndex].logoPublicId}
                                                                 alt={products[currentIndex].brandName}
                                                                 className="w-full h-full object-cover"
                                                             />
                                                         </div>
                                                     )}
                                                     <div className="flex items-center gap-2">
                                                         <Badge color="primary" variant="solid" className="text-sm">
                                                             {products[currentIndex].brandName}
                                                         </Badge>
                                                         <Badge color="warning" variant="flat" className="text-sm">
                                                             {products[currentIndex].categoryName}
                                                         </Badge>
                                                     </div>
                                                 </div>
                                                 <Link href={`/products/${products[currentIndex].productId}`}>      
                                                 {/* Product Name */}
                                                 <div>
                                                     <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-2">
                                                         {products[currentIndex].productName}
                                                     </h3>
                                                     <p className="text-gray-600 text-lg line-clamp-3">
                                                         {products[currentIndex].description}
                                                     </p>
                                                 </div>
                                                 </Link> 
                                                 {/* Specifications */}
                                                 <div className="grid grid-cols-2 gap-4">
                                                     {products[currentIndex].materialName && (
                                                         <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
                                                             <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                 Chất liệu
                                                             </div>
                                                             <div className="font-medium text-gray-900">
                                                                 {products[currentIndex].materialName}
                                                             </div>
                                                         </div>
                                                     )}
                                                     {products[currentIndex].targetAudienceName && (
                                                         <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3">
                                                             <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                 Đối tượng
                                                             </div>
                                                             <div className="font-medium text-gray-900">
                                                                 {products[currentIndex].targetAudienceName}
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>

                                                 {/* Pricing Section */}
                                                 <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                                                     <div className="flex items-center justify-between mb-4">
                                                         <div>
                                                             {products[currentIndex].minSalePrice && products[currentIndex].minSalePrice < products[currentIndex].minPrice ? (
                                                                 <>
                                                                     <div className="text-4xl font-bold text-red-600">
                                                                         {formatPrice(products[currentIndex].minSalePrice)}
                                                                     </div>
                                                                     <div className="text-xl text-gray-400 line-through">
                                                                         {formatPrice(products[currentIndex].minPrice)}
                                                                     </div>
                                                                 </>
                                                             ) : (
                                                                 <div className="text-4xl font-bold text-gray-900">
                                                                     {formatPrice(products[currentIndex].minPrice)}
                                                                 </div>
                                                             )}
                                                         </div>
                                                         {products[currentIndex].minSalePrice && products[currentIndex].minSalePrice < products[currentIndex].minPrice && (
                                                             <Chip color="danger" variant="solid" size="lg" className="text-lg">
                                                                 Giảm giá
                                                             </Chip>
                                                         )}
                                                     </div>
                                                     
                                                     {/* Stock & Sales Info */}
                                                     <div className="flex items-center justify-between">
                                                         <div className="flex items-center gap-4">
                                                             <Chip 
                                                                 color={products[currentIndex].totalStock > 10 ? 'success' : products[currentIndex].totalStock > 0 ? 'warning' : 'danger'}
                                                                 variant="flat"
                                                                 size="sm"
                                                             >
                                                                 {products[currentIndex].totalStock > 0 ? `${products[currentIndex].totalStock} còn lại` : 'Hết hàng'}
                                                             </Chip>
                                                             <Badge color="primary" variant="flat" className="font-medium">
                                                                 {products[currentIndex].purchases} đã bán
                                                             </Badge>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-700"/>
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    >
                        <ChevronRightIcon className="w-6 h-6 text-gray-700"/>
                    </button>
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {products.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentIndex
                                    ? 'bg-blue-600 scale-125'
                                    : 'bg-white/60 hover:bg-white'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LatestProductsSlider;
