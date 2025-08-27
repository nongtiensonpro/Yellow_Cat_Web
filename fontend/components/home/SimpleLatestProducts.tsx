'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { CldImage } from "next-cloudinary";
import {
    Card,
    CardBody,
    Badge,
    Chip,
    Button,
    Divider,
} from "@heroui/react";
import Link from "next/link";

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

const SimpleLatestProducts: React.FC = () => {
    const [products, setProducts] = useState<LatestProduct[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
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
                
                if (response.ok) {
                    const apiResponse: ApiResponse = await response.json();
                    if (apiResponse.status === 200 && apiResponse.data) {
                        setProducts(apiResponse.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching latest products:', err);
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getMainImage = (product: LatestProduct) => {
        return product.thumbnail || product.variants[0]?.imageUrl || '/images/placeholder-product.jpg';
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
            <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Sản Phẩm Mới Nhất
                    </h2>
                    <p className="text-gray-600">
                        Khám phá những sản phẩm giày mới nhất từ Yellow Cat
                    </p>
                </div>

                <div className="relative">
                    <div className="overflow-hidden rounded-xl shadow-lg">
                        <div className="relative h-80 md:h-96">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0"
                                >
                                    {products[currentIndex] && (
                                        <div className="h-full bg-white">
                                            <div className="h-full flex flex-col md:flex-row">
                                                {/* Image */}
                                                <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
                                                    <div className="relative">
                                                        <CldImage
                                                            src={getMainImage(products[currentIndex])}
                                                            alt={products[currentIndex].productName}
                                                            width={256}
                                                            height={256}
                                                            className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg shadow-md"
                                                            quality={80}
                                                            loading="lazy"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleWishlist(products[currentIndex]);
                                                            }}
                                                            className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
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

                                                                                                 {/* Content */}
                                                 <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
                                                     <div className="space-y-4">
                                                         {/* Brand & Category */}
                                                         <div className="flex items-center gap-3">
                                                             {products[currentIndex].logoPublicId && (
                                                                 <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md">
                                                                     <CldImage 
                                                                         width={32} 
                                                                         height={32} 
                                                                         src={products[currentIndex].logoPublicId}
                                                                         alt={products[currentIndex].brandName}
                                                                         className="w-full h-full object-cover"
                                                                     />
                                                                 </div>
                                                             )}
                                                             <div className="flex items-center gap-2">
                                                                 <Badge color="primary" variant="solid" className="text-xs">
                                                                     {products[currentIndex].brandName}
                                                                 </Badge>
                                                                 <Badge color="warning" variant="flat" className="text-xs">
                                                                     {products[currentIndex].categoryName}
                                                                 </Badge>
                                                             </div>
                                                         </div>

                                                         {/* Product Name & Description */}
                                                         <div>
                                                             <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                                                                 {products[currentIndex].productName}
                                                             </h3>
                                                             <p className="text-gray-600 text-sm line-clamp-2">
                                                                 {products[currentIndex].description}
                                                             </p>
                                                         </div>

                                                         {/* Specifications */}
                                                         <div className="grid grid-cols-2 gap-3">
                                                             {products[currentIndex].materialName && (
                                                                 <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2">
                                                                     <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                         Chất liệu
                                                                     </div>
                                                                     <div className="font-medium text-gray-900 text-sm">
                                                                         {products[currentIndex].materialName}
                                                                     </div>
                                                                 </div>
                                                             )}
                                                             {products[currentIndex].targetAudienceName && (
                                                                 <div className="bg-white/50 backdrop-blur-sm rounded-lg p-2">
                                                                     <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                                         Đối tượng
                                                                     </div>
                                                                     <div className="font-medium text-gray-900 text-sm">
                                                                         {products[currentIndex].targetAudienceName}
                                                                     </div>
                                                                 </div>
                                                             )}
                                                         </div>

                                                         {/* Pricing Section */}
                                                         <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                                                             <div className="flex items-center justify-between mb-3">
                                                                 <div>
                                                                     {products[currentIndex].minSalePrice && products[currentIndex].minSalePrice < products[currentIndex].minPrice ? (
                                                                         <>
                                                                             <div className="text-2xl font-bold text-red-600">
                                                                                 {formatPrice(products[currentIndex].minSalePrice)}
                                                                             </div>
                                                                             <div className="text-sm text-gray-400 line-through">
                                                                                 {formatPrice(products[currentIndex].minPrice)}
                                                                             </div>
                                                                         </>
                                                                     ) : (
                                                                         <div className="text-2xl font-bold text-gray-900">
                                                                             {formatPrice(products[currentIndex].minPrice)}
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                                 {products[currentIndex].minSalePrice && products[currentIndex].minSalePrice < products[currentIndex].minPrice && (
                                                                     <Chip color="danger" variant="solid" size="sm">
                                                                         Giảm giá
                                                                     </Chip>
                                                                 )}
                                                             </div>
                                                             
                                                             {/* Stock & Sales Info */}
                                                             <div className="flex items-center justify-between">
                                                                 <Chip 
                                                                     color={products[currentIndex].totalStock > 10 ? 'success' : products[currentIndex].totalStock > 0 ? 'warning' : 'danger'}
                                                                     variant="flat"
                                                                     size="sm"
                                                                 >
                                                                     {products[currentIndex].totalStock > 0 ? `${products[currentIndex].totalStock} còn lại` : 'Hết hàng'}
                                                                 </Chip>
                                                                 <Badge color="primary" variant="flat" className="font-medium text-xs">
                                                                     {products[currentIndex].purchases} đã bán
                                                                 </Badge>
                                                             </div>
                                                         </div>

                                                         {/* Action Buttons */}
                                                         <div className="flex gap-3">
                                                             <Button
                                                                 size="md"
                                                                 color="primary"
                                                                 variant="solid"
                                                                 className="flex-1 font-semibold"
                                                                 as={Link}
                                                                 href={`/products/${products[currentIndex].productId}`}
                                                             >
                                                                 Xem Chi Tiết
                                                             </Button>
                                                             <Button
                                                                 size="md"
                                                                 color="primary"
                                                                 variant="bordered"
                                                                 className="flex-1 font-semibold"
                                                             >
                                                                 Thêm Vào Giỏ
                                                             </Button>
                                                         </div>

                                                         {/* Additional Features */}
                                                         <div className="flex items-center justify-between text-xs text-gray-600">
                                                             <div className="flex items-center gap-3">
                                                                 <div className="flex items-center gap-1">
                                                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                     <span>Miễn phí vận chuyển</span>
                                                                 </div>
                                                                 <div className="flex items-center gap-1">
                                                                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                                     <span>Bảo hành chính hãng</span>
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-1">
                                                                 <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                                                 <span>Đổi trả 30 ngày</span>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation */}
                            <button
                                onClick={handlePrevious}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                            </button>
                            
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                            >
                                <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>
                    </div>

                                         {/* Dots */}
                     <div className="flex justify-center mt-4 space-x-2">
                         {products.map((_, index) => (
                             <button
                                 key={index}
                                 onClick={() => setCurrentIndex(index)}
                                 className={`w-2 h-2 rounded-full transition-all ${
                                     index === currentIndex 
                                         ? 'bg-blue-600 scale-125' 
                                         : 'bg-gray-300 hover:bg-gray-400'
                                 }`}
                             />
                         ))}
                     </div>
                 </div>

                 {/* Product Thumbnails */}
                 <div className="mt-8">
                     <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                         Tất Cả Sản Phẩm Mới Nhất
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {products.map((product, index) => (
                             <Card
                                 key={product.productId}
                                 className={`group transition-all duration-300 hover:shadow-xl border-2 ${
                                     index === currentIndex
                                         ? 'border-primary-500 shadow-lg'
                                         : 'border-default-200 hover:border-primary-300'
                                 } cursor-pointer`}
                                 isPressable
                                 onPress={() => setCurrentIndex(index)}
                             >
                                 <CardBody className="p-0">
                                     {/* Product Image */}
                                     <div className="relative w-full h-48 bg-gradient-to-br from-default-100 to-default-200">
                                         <CldImage
                                             src={getMainImage(product)}
                                             alt={product.productName}
                                             width={400}
                                             height={192}
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                             quality={80}
                                             loading="lazy"
                                         />
                                         
                                         {/* Wishlist Button */}
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 toggleWishlist(product);
                                             }}
                                             className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                                             aria-label={isInWishlist(product.productId) ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                                             tabIndex={0}
                                             onKeyDown={(e) => {
                                                 if (e.key === 'Enter' || e.key === ' ') {
                                                     e.preventDefault();
                                                     toggleWishlist(product);
                                                 }
                                             }}
                                         >
                                             {isInWishlist(product.productId) ? (
                                                 <HeartIconSolid className="w-5 h-5 text-red-500" />
                                             ) : (
                                                 <HeartIconOutline className="w-5 h-5 text-gray-600 hover:text-red-500" />
                                             )}
                                         </button>

                                         {/* Active Indicator */}
                                         {index === currentIndex && (
                                             <div className="absolute top-2 left-2">
                                                 <Badge color="primary" variant="solid" size="sm">
                                                     Đang xem
                                                 </Badge>
                                             </div>
                                         )}

                                         {/* Sale Badge */}
                                         {product.minSalePrice && product.minSalePrice < product.minPrice && (
                                             <div className="absolute bottom-2 left-2">
                                                 <Chip color="danger" variant="solid" size="sm">
                                                     Giảm giá
                                                 </Chip>
                                             </div>
                                         )}
                                     </div>

                                     {/* Product Info */}
                                     <div className="p-4">
                                         {/* Brand & Category */}
                                         <div className="flex items-center justify-between mb-2">
                                             <div className="flex items-center gap-2 min-w-0">
                                                 {product.logoPublicId && (
                                                     <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-default-200">
                                                         <CldImage 
                                                             width={24} 
                                                             height={24} 
                                                             src={product.logoPublicId}
                                                             alt={product.brandName}
                                                             className="w-full h-full object-cover"
                                                         />
                                                     </div>
                                                 )}
                                                 <span className="text-xs font-medium text-default-700 truncate">
                                                     {product.brandName}
                                                 </span>
                                             </div>
                                             <Badge color="warning" variant="flat" className="text-[10px]">
                                                 {product.categoryName}
                                             </Badge>
                                         </div>

                                         {/* Product Name */}
                                         <h4 className="font-bold text-sm line-clamp-2 hover:text-primary transition-colors mb-2 h-10">
                                             {product.productName}
                                         </h4>

                                         {/* Material & Target Audience */}
                                         <div className="flex flex-wrap gap-1 mb-3">
                                             {product.materialName && (
                                                 <Chip size="sm" variant="flat" color="default" className="text-xs">
                                                     {product.materialName}
                                                 </Chip>
                                             )}
                                             {product.targetAudienceName && (
                                                 <Chip size="sm" variant="flat" color="secondary" className="text-xs">
                                                     {product.targetAudienceName}
                                                 </Chip>
                                             )}
                                         </div>

                                         <Divider className="my-2" />

                                         {/* Pricing */}
                                         <div className="flex items-center gap-2 mb-2">
                                             {product.minSalePrice && product.minSalePrice < product.minPrice ? (
                                                 <>
                                                     <span className="text-lg font-bold text-danger">
                                                         {formatPrice(product.minSalePrice)}
                                                     </span>
                                                     <span className="text-sm text-default-400 line-through">
                                                         {formatPrice(product.minPrice)}
                                                     </span>
                                                 </>
                                             ) : (
                                                 <span className="text-lg font-bold text-success">
                                                     {formatPrice(product.minPrice)}
                                                 </span>
                                             )}
                                         </div>

                                         {/* Stock & Sales Info */}
                                         <div className="flex justify-between items-center text-xs text-default-500 mb-3">
                                             <div className="flex items-center gap-2">
                                                 <Chip 
                                                     size="sm" 
                                                     variant="flat"
                                                     color={product.totalStock > 10 ? 'success' : product.totalStock > 0 ? 'warning' : 'danger'}
                                                 >
                                                     {product.totalStock > 0 ? `${product.totalStock} còn lại` : 'Hết hàng'}
                                                 </Chip>
                                             </div>
                                             <Badge color="primary" variant="flat" className="font-medium">
                                                 {product.purchases} đã bán
                                             </Badge>
                                         </div>

                                         {/* Action Buttons */}
                                         <div className="flex gap-2">
                                             <Button
                                                 size="sm"
                                                 color="primary"
                                                 variant="flat"
                                                 className="flex-1"
                                                 as={Link}
                                                 href={`/products/${product.productId}`}
                                             >
                                                 Xem chi tiết
                                             </Button>
                                             <Button
                                                 size="sm"
                                                 color="primary"
                                                 variant="bordered"
                                                 className="flex-1"
                                             >
                                                 Thêm giỏ
                                             </Button>
                                         </div>
                                     </div>
                                 </CardBody>
                             </Card>
                         ))}
                     </div>
                 </div>
             </div>
         </section>
     );
 };

export default SimpleLatestProducts;
