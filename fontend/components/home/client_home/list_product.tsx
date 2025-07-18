// "use client";
//
// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { CldImage } from "next-cloudinary";
// import {
//     Card,
//     CardBody,
//     CardHeader,
//     Button,
//     Skeleton,
//     Divider,
//     Pagination
// } from "@heroui/react";
// import {
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     TagIcon,
//     StarIcon,
//     HeartIcon as HeartIconOutline
// } from "@heroicons/react/24/outline";
// import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
//
// interface Product {
//     productId: number;
//     productName: string;
//     purchases: number;
//     categoryName: string;
//     brandName: string;
//     logoPublicId: string;
//     minPrice: number | null;
//     minSalePrice?: number | null;
//     totalStock: number | null;
//     thumbnail: string | null;
//     createdAt?: string;
// }
//
// interface PageInfo {
//     size: number;
//     number: number;
//     totalElements: number;
//     totalPages: number;
// }
//
// interface ApiResponseData {
//     content: Product[];
//     page: PageInfo;
// }
//
// interface ApiResponse {
//     timestamp: string;
//     status: number;
//     message: string;
//     data: ApiResponseData;
// }
//
// const ProductList = () => {
//     const [products, setProducts] = useState<Product[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState<number>(0);
//     const [totalPages, setTotalPages] = useState<number>(0);
//     const [wishlist, setWishlist] = useState<Product[]>([]);
//     const pageSize = 8;
//
//     useEffect(() => {
//         const storedWishlist = localStorage.getItem('wishlist');
//         if (storedWishlist) {
//             try {
//                 const parsed: Product[] = JSON.parse(storedWishlist);
//                 setWishlist(Array.isArray(parsed) ? parsed : []);
//             } catch (e) {
//                 console.error("Failed to parse wishlist from localStorage", e);
//                 setWishlist([]);
//             }
//         }
//         window.dispatchEvent(new Event('wishlistUpdated'));
//     }, []);
//
//     useEffect(() => {
//         const fetchAllProducts = async () => {
//             setLoading(true);
//             try {
//                 const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${pageSize}`);
//                 if (!response.ok) throw new Error('Failed to fetch products');
//                 const apiResponse: ApiResponse = await response.json();
//                 if (apiResponse.status === 200 && apiResponse.data?.content) {
//                     setProducts(apiResponse.data.content);
//                     setTotalPages(apiResponse.data.page.totalPages);
//                 } else throw new Error(apiResponse.message);
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'Unknown error');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchAllProducts();
//     }, [currentPage, pageSize]);
//
//     const formatPrice = (price: number | null) => {
//         if (price === null || isNaN(Number(price))) return 'Liên hệ';
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
//     };
//
//     const calculateDiscountPercent = (price: number, salePrice: number) => {
//         if (!price || !salePrice || price <= salePrice) return null;
//         const percent = ((price - salePrice) / price) * 100;
//         return Math.round(percent);
//     };
//
//     const handlePageChange = (page: number) => {
//         setCurrentPage(page - 1);
//     };
//
//     const toggleWishlist = (productToToggle: Product) => {
//         const isWishlisted = wishlist.some(p => p.productId === productToToggle.productId);
//         const updated = isWishlisted
//             ? wishlist.filter(p => p.productId !== productToToggle.productId)
//             : [...wishlist, productToToggle];
//
//         setWishlist(updated);
//         localStorage.setItem('wishlist', JSON.stringify(updated));
//         window.dispatchEvent(new Event('wishlistUpdated'));
//     };
//
//     const renderProductCard = (product: Product) => {
//         const isWishlisted = wishlist.some(p => p.productId === product.productId);
//         const discountPercent = product.minSalePrice && product.minPrice
//             ? calculateDiscountPercent(product.minPrice, product.minSalePrice)
//             : null;
//
//         return (
//             <Card
//                 key={product.productId}
//                 className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200 cursor-pointer"
//             >
//                 <CardHeader className="pb-0 pt-2 px-4 relative">
//                     <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
//                         <div className="absolute top-2 right-2 z-30">
//                             <button
//                                 onClick={(e) => {
//                                     e.stopPropagation();
//                                     toggleWishlist(product);
//                                 }}
//                                 className="p-1 rounded-full bg-white/80 hover:bg-white shadow"
//                             >
//                                 {isWishlisted ? (
//                                     <HeartIconSolid className="w-5 h-5 text-red-500" />
//                                 ) : (
//                                     <HeartIconOutline className="w-5 h-5 text-red-500" />
//                                 )}
//                             </button>
//                         </div>
//
//                         {discountPercent && (
//                             <div className="absolute top-2 left-2 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
//                                 -{discountPercent}%
//                             </div>
//                         )}
//
//                         {product.thumbnail ? (
//                             <CldImage
//                                 width={400}
//                                 height={400}
//                                 src={product.thumbnail}
//                                 alt={product.productName || "Product image"}
//                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                             />
//                         ) : (
//                             <div className="w-full h-full flex items-center justify-center text-default-400">
//                                 <BuildingStorefrontIcon className="w-16 h-16" />
//                             </div>
//                         )}
//                     </div>
//                 </CardHeader>
//
//                 <CardBody className="px-4 py-3">
//                     <Link href={`/products/${product.productId}`}>
//                         <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
//                             {product.productName || "Tên sản phẩm không xác định"}
//                         </h4>
//                     </Link>
//
//                     <div className="flex items-center gap-2 my-2">
//                         <CurrencyDollarIcon className="w-4 h-4 text-success" />
//                         {product.minSalePrice ? (
//                             <>
//                                 <span className="text-base text-gray-400 line-through">
//                                     {formatPrice(product.minPrice)}
//                                 </span>
//                                 <span className="text-lg font-semibold text-red-600">
//                                     {formatPrice(product.minSalePrice)}
//                                 </span>
//                             </>
//                         ) : (
//                             <span className="text-lg font-semibold text-success">
//                                 {formatPrice(product.minPrice)}
//                             </span>
//                         )}
//                     </div>
//
//                     <Divider className="my-2" />
//
//                     <div className="flex justify-between items-center text-sm">
//                         <div className="flex items-center gap-1 text-default-600">
//                             <TagIcon className="w-4 h-4" />
//                             <span>Kho: {product.totalStock || 'N/A'}</span>
//                         </div>
//                         <div className="flex items-center gap-1 text-default-600">
//                             <StarIcon className="w-4 h-4" />
//                             <span>Đã bán: {product.purchases}</span>
//                         </div>
//                     </div>
//                 </CardBody>
//             </Card>
//         );
//     };
//
//     if (error) {
//         return (
//             <div className="container mx-auto px-4 py-8 max-w-7xl">
//                 <Card className="max-w-md mx-auto">
//                     <CardBody className="text-center py-8">
//                         <div className="text-danger text-xl mb-4">⚠️</div>
//                         <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
//                         <p className="text-default-500">{error}</p>
//                         <Button color="primary" variant="flat" className="mt-4" onClick={() => window.location.reload()}>
//                             Thử lại
//                         </Button>
//                     </CardBody>
//                 </Card>
//             </div>
//         );
//     }
//
//     return (
//         <div className="container mx-auto px-4 py-8 max-w-7xl">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {loading
//                     ? Array.from({ length: pageSize }).map((_, index) => (
//                         <Skeleton key={index} className="h-64 rounded-lg bg-default-300" />
//                     ))
//                     : products.map(renderProductCard)}
//             </div>
//             {totalPages > 1 && (
//                 <div className="flex w-full justify-center mt-8">
//                     <Pagination
//                         loop
//                         showControls
//                         color="primary"
//                         page={currentPage + 1}
//                         total={totalPages}
//                         onChange={handlePageChange}
//                     />
//                 </div>
//             )}
//         </div>
//     );
// };
//
// export default ProductList;


//
// "use client";
//
// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { CldImage } from "next-cloudinary";
// import {
//     Card,
//     CardBody,
//     CardHeader,
//     Button,
//     Skeleton,
//     Divider,
//     Pagination
// } from "@heroui/react";
// import {
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     TagIcon,
//     StarIcon,
//     HeartIcon as HeartIconOutline
// } from "@heroicons/react/24/outline";
// import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
//
// interface Product {
//     productId: number;
//     productName: string;
//     purchases: number;
//     categoryName: string;
//     brandName: string;
//     logoPublicId: string;
//     minPrice: number | null;
//     minSalePrice?: number | null;
//     totalStock: number | null;
//     thumbnail: string | null;
//     createdAt?: string;
// }
//
// interface PageInfo {
//     size: number;
//     number: number;
//     totalElements: number;
//     totalPages: number;
// }
//
// interface ApiResponseData {
//     content: Product[];
//     page: PageInfo;
// }
//
// interface ApiResponse {
//     timestamp: string;
//     status: number;
//     message: string;
//     data: ApiResponseData;
// }
//
// const ProductList = () => {
//     const [products, setProducts] = useState<Product[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState<number>(0);
//     const [totalPages, setTotalPages] = useState<number>(0);
//     const [wishlist, setWishlist] = useState<Product[]>([]);
//     const pageSize = 8;
//
//     useEffect(() => {
//         const storedWishlist = localStorage.getItem('wishlist');
//         if (storedWishlist) {
//             try {
//                 const parsed: Product[] = JSON.parse(storedWishlist);
//                 setWishlist(Array.isArray(parsed) ? parsed : []);
//             } catch (e) {
//                 console.error("Failed to parse wishlist from localStorage", e);
//                 setWishlist([]);
//             }
//         }
//         window.dispatchEvent(new Event('wishlistUpdated'));
//     }, []);
//
//     useEffect(() => {
//         const fetchAllProducts = async () => {
//             setLoading(true);
//             try {
//                 const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${pageSize}`);
//                 if (!response.ok) throw new Error('Failed to fetch products');
//                 const apiResponse: ApiResponse = await response.json();
//                 if (apiResponse.status === 200 && apiResponse.data?.content) {
//                     // ==================== THAY ĐỔI Ở ĐÂY ====================
//                     // Lọc những sản phẩm có tồn kho (totalStock) và số lượng > 0
//                     const inStockProducts = apiResponse.data.content.filter(
//                         product => product.totalStock && product.totalStock > 0
//                     );
//                     setProducts(inStockProducts);
//                     // ========================================================
//                     setTotalPages(apiResponse.data.page.totalPages);
//                 } else throw new Error(apiResponse.message);
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'Unknown error');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchAllProducts();
//     }, [currentPage, pageSize]);
//
//     const formatPrice = (price: number | null) => {
//         if (price === null || isNaN(Number(price))) return 'Liên hệ';
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
//     };
//
//     const calculateDiscountPercent = (price: number, salePrice: number) => {
//         if (!price || !salePrice || price <= salePrice) return null;
//         const percent = ((price - salePrice) / price) * 100;
//         return Math.round(percent);
//     };
//
//     const handlePageChange = (page: number) => {
//         setCurrentPage(page - 1);
//     };
//
//     const toggleWishlist = (productToToggle: Product) => {
//         const isWishlisted = wishlist.some(p => p.productId === productToToggle.productId);
//         const updated = isWishlisted
//             ? wishlist.filter(p => p.productId !== productToToggle.productId)
//             : [...wishlist, productToToggle];
//
//         setWishlist(updated);
//         localStorage.setItem('wishlist', JSON.stringify(updated));
//         window.dispatchEvent(new Event('wishlistUpdated'));
//     };
//
//     const renderProductCard = (product: Product) => {
//         const isWishlisted = wishlist.some(p => p.productId === product.productId);
//         const discountPercent = product.minSalePrice && product.minPrice
//             ? calculateDiscountPercent(product.minPrice, product.minSalePrice)
//             : null;
//
//         return (
//             <Card
//                 key={product.productId}
//                 className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200 cursor-pointer"
//             >
//                 <CardHeader className="pb-0 pt-2 px-4 relative">
//                     <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
//                         <div className="absolute top-2 right-2 z-30">
//                             <button
//                                 onClick={(e) => {
//                                     e.stopPropagation();
//                                     toggleWishlist(product);
//                                 }}
//                                 className="p-1 rounded-full bg-white/80 hover:bg-white shadow"
//                             >
//                                 {isWishlisted ? (
//                                     <HeartIconSolid className="w-5 h-5 text-red-500" />
//                                 ) : (
//                                     <HeartIconOutline className="w-5 h-5 text-red-500" />
//                                 )}
//                             </button>
//                         </div>
//
//                         {discountPercent && (
//                             <div className="absolute top-2 left-2 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
//                                 -{discountPercent}%
//                             </div>
//                         )}
//
//                         {product.thumbnail ? (
//                             <CldImage
//                                 width={400}
//                                 height={400}
//                                 src={product.thumbnail}
//                                 alt={product.productName || "Product image"}
//                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                             />
//                         ) : (
//                             <div className="w-full h-full flex items-center justify-center text-default-400">
//                                 <BuildingStorefrontIcon className="w-16 h-16" />
//                             </div>
//                         )}
//                     </div>
//                 </CardHeader>
//
//                 <CardBody className="px-4 py-3">
//                     <Link href={`/products/${product.productId}`}>
//                         <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
//                             {product.productName || "Tên sản phẩm không xác định"}
//                         </h4>
//                     </Link>
//
//                     <div className="flex items-center gap-2 my-2">
//                         <CurrencyDollarIcon className="w-4 h-4 text-success" />
//                         {product.minSalePrice ? (
//                             <>
//                                 <span className="text-base text-gray-400 line-through">
//                                     {formatPrice(product.minPrice)}
//                                 </span>
//                                 <span className="text-lg font-semibold text-red-600">
//                                     {formatPrice(product.minSalePrice)}
//                                 </span>
//                             </>
//                         ) : (
//                             <span className="text-lg font-semibold text-success">
//                                 {formatPrice(product.minPrice)}
//                             </span>
//                         )}
//                     </div>
//
//                     <Divider className="my-2" />
//
//                     <div className="flex justify-between items-center text-sm">
//                         <div className="flex items-center gap-1 text-default-600">
//                             <TagIcon className="w-4 h-4" />
//                             <span>Kho: {product.totalStock || 'N/A'}</span>
//                         </div>
//                         <div className="flex items-center gap-1 text-default-600">
//                             <StarIcon className="w-4 h-4" />
//                             <span>Đã bán: {product.purchases}</span>
//                         </div>
//                     </div>
//                 </CardBody>
//             </Card>
//         );
//     };
//
//     if (error) {
//         return (
//             <div className="container mx-auto px-4 py-8 max-w-7xl">
//                 <Card className="max-w-md mx-auto">
//                     <CardBody className="text-center py-8">
//                         <div className="text-danger text-xl mb-4">⚠️</div>
//                         <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
//                         <p className="text-default-500">{error}</p>
//                         <Button color="primary" variant="flat" className="mt-4" onClick={() => window.location.reload()}>
//                             Thử lại
//                         </Button>
//                     </CardBody>
//                 </Card>
//             </div>
//         );
//     }
//
//     return (
//         <div className="container mx-auto px-4 py-8 max-w-7xl">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {loading
//                     ? Array.from({ length: pageSize }).map((_, index) => (
//                         <Skeleton key={index} className="h-64 rounded-lg bg-default-300" />
//                     ))
//                     : products.map(renderProductCard)}
//             </div>
//             {totalPages > 1 && (
//                 <div className="flex w-full justify-center mt-8">
//                     <Pagination
//                         loop
//                         showControls
//                         color="primary"
//                         page={currentPage + 1}
//                         total={totalPages}
//                         onChange={handlePageChange}
//                     />
//                 </div>
//             )}
//         </div>
//     );
// };
//
// export default ProductList;



"use client";

import React, { useEffect, useState, useRef } from 'react'; // Thêm useRef
import Link from 'next/link';
import { CldImage } from "next-cloudinary";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Skeleton,
    Divider,
    // Pagination // Bỏ Pagination
} from "@heroui/react";
import {
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    TagIcon,
    StarIcon,
    HeartIcon as HeartIconOutline,
    ChevronLeftIcon, // Thêm icon mũi tên
    ChevronRightIcon, // Thêm icon mũi tên
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

// --- Interfaces (Không đổi) ---
interface Product {
    productId: number;
    productName: string;
    purchases: number;
    categoryName: string;
    brandName: string;
    logoPublicId: string;
    minPrice: number | null;
    minSalePrice?: number | null;
    totalStock: number | null;
    thumbnail: string | null;
    createdAt?: string;
}

interface PageInfo {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}

interface ApiResponseData {
    content: Product[];
    page?: PageInfo;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ApiResponseData | Product[];
}

// --- Component chính ---
const ProductList = () => {
    // --- State đã được cập nhật ---
    const [products, setProducts] = useState<Product[]>([]);
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<Product[]>([]);

    // State và Ref mới để điều khiển carousel "Tất cả sản phẩm"
    const allProductsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Bỏ state cho phân trang
    // const [currentPage, setCurrentPage] = useState<number>(0);
    // const [totalPages, setTotalPages] = useState<number>(0);
    const allProductsPageSize = 20; // Tải nhiều sản phẩm hơn cho carousel

    useEffect(() => {
        const storedWishlist = localStorage.getItem('wishlist');
        if (storedWishlist) {
            try {
                const parsed: Product[] = JSON.parse(storedWishlist);
                setWishlist(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                console.error("Failed to parse wishlist from localStorage", e);
                setWishlist([]);
            }
        }
        window.dispatchEvent(new Event('wishlistUpdated'));
    }, []);

    // --- useEffect đã được cập nhật để tải danh sách lớn hơn, bỏ phân trang ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Tải trang đầu tiên với số lượng lớn hơn và không phụ thuộc vào currentPage
                const [paginatedRes, topSellingRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/products?page=0&size=${allProductsPageSize}`),
                    fetch(`http://localhost:8080/api/products/top-selling`)
                ]);

                if (!paginatedRes.ok) throw new Error('Không thể tải danh sách sản phẩm.');
                if (!topSellingRes.ok) throw new Error('Không thể tải sản phẩm bán chạy.');

                const paginatedApiResponse: ApiResponse = await paginatedRes.json();
                const topSellingApiResponse: ApiResponse = await topSellingRes.json();

                // Xử lý "Tất cả sản phẩm"
                if (paginatedApiResponse.status === 200 && 'content' in paginatedApiResponse.data) {
                    const paginatedData = paginatedApiResponse.data as ApiResponseData;
                    const inStockProducts = paginatedData.content.filter(
                        product => product.totalStock && product.totalStock > 0
                    );
                    setProducts(inStockProducts);
                } else {
                    throw new Error(paginatedApiResponse.message || 'Lỗi khi tải sản phẩm.');
                }

                // Xử lý sản phẩm bán chạy
                if (topSellingApiResponse.status === 200 && Array.isArray(topSellingApiResponse.data)) {
                    const topProductsData = topSellingApiResponse.data as Product[];
                    setTopProducts(topProductsData);
                } else {
                    console.warn(topSellingApiResponse.message || 'Không thể tải sản phẩm bán chạy.');
                    setTopProducts([]);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [allProductsPageSize]); // Chỉ chạy 1 lần khi component mount

    // --- Hàm check trạng thái cuộn của carousel ---
    const checkScrollability = () => {
        const el = allProductsScrollRef.current;
        if (el) {
            const isScrollable = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScrollability(); // Check khi dữ liệu đã tải xong
        const currentRef = allProductsScrollRef.current;
        currentRef?.addEventListener('scroll', checkScrollability);
        window.addEventListener('resize', checkScrollability);

        return () => {
            currentRef?.removeEventListener('scroll', checkScrollability);
            window.removeEventListener('resize', checkScrollability);
        }
    }, [products, loading]);

    // --- Hàm xử lý cuộn ---
    const handleScroll = (direction: 'left' | 'right') => {
        const el = allProductsScrollRef.current;
        if (el) {
            // Cuộn một khoảng bằng 3/4 chiều rộng của container
            const scrollAmount = el.clientWidth * 0.75;
            el.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };


    // Bỏ hàm xử lý phân trang
    // const handlePageChange = (page: number) => { ... };

    const formatPrice = (price: number | null) => {
        if (price === null || isNaN(Number(price))) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    const calculateDiscountPercent = (price: number, salePrice: number) => {
        if (!price || !salePrice || price <= salePrice) return null;
        const percent = ((price - salePrice) / price) * 100;
        return Math.round(percent);
    };

    const toggleWishlist = (productToToggle: Product) => {
        const isWishlisted = wishlist.some(p => p.productId === productToToggle.productId);
        const updated = isWishlisted
            ? wishlist.filter(p => p.productId !== productToToggle.productId)
            : [...wishlist, productToToggle];

        setWishlist(updated);
        localStorage.setItem('wishlist', JSON.stringify(updated));
        window.dispatchEvent(new Event('wishlistUpdated'));
    };

    const renderProductCard = (product: Product, isCarouselItem = false) => {
        // ... (Nội dung hàm renderProductCard không đổi)
        const isWishlisted = wishlist.some(p => p.productId === product.productId);
        const discountPercent = product.minSalePrice && product.minPrice
            ? calculateDiscountPercent(product.minPrice, product.minSalePrice)
            : null;

        return (
            <Card
                key={product.productId}
                className={`group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200 cursor-pointer ${isCarouselItem ? 'w-64 flex-shrink-0' : ''}`}
            >
                <CardHeader className="pb-0 pt-2 px-4 relative">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
                        <div className="absolute top-2 right-2 z-30">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                                className="p-1 rounded-full bg-white/80 hover:bg-white shadow"
                                aria-label="Add to wishlist"
                            >
                                {isWishlisted ? (
                                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                                ) : (
                                    <HeartIconOutline className="w-5 h-5 text-red-500" />
                                )}
                            </button>
                        </div>

                        {discountPercent && (
                            <div className="absolute top-2 left-2 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                -{discountPercent}%
                            </div>
                        )}

                        {product.thumbnail ? (
                            <CldImage
                                width={400}
                                height={400}
                                src={product.thumbnail}
                                alt={product.productName || "Product image"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-400">
                                <BuildingStorefrontIcon className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardBody className="px-4 py-3">
                    <Link href={`/products/${product.productId}`}>
                        <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer h-14">
                            {product.productName || "Tên sản phẩm không xác định"}
                        </h4>
                    </Link>

                    <div className="flex items-center gap-2 my-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-success" />
                        {product.minSalePrice && product.minPrice && product.minSalePrice < product.minPrice ? (
                            <>
                                <span className="text-base text-gray-400 line-through">
                                    {formatPrice(product.minPrice)}
                                </span>
                                <span className="text-lg font-semibold text-red-600">
                                    {formatPrice(product.minSalePrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-semibold text-success">
                                {formatPrice(product.minPrice)}
                            </span>
                        )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-default-600">
                            <TagIcon className="w-4 h-4" />
                            <span>Kho: {product.totalStock ?? 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-default-600">
                            <StarIcon className="w-4 h-4" />
                            <span>Đã bán: {product.purchases}</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    };

    if (error) {
        return (
            // ... (Phần hiển thị lỗi không đổi)
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <div className="text-danger-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
                        <p className="text-default-500">{error}</p>
                        <Button color="primary" variant="flat" className="mt-4" onClick={() => window.location.reload()}>
                            Thử lại
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* === KHU VỰC TẤT CẢ SẢN PHẨM (ĐÃ CHUYỂN THÀNH CAROUSEL) === */}
            <div className="relative">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Tất cả sản phẩm</h2>
                    <div className="flex gap-2">
                        <Button isIconOnly variant="flat" onClick={() => handleScroll('left')} disabled={!canScrollLeft}>
                            <ChevronLeftIcon className="w-5 h-5"/>
                        </Button>
                        <Button isIconOnly variant="flat" onClick={() => handleScroll('right')} disabled={!canScrollRight}>
                            <ChevronRightIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>

                <div
                    ref={allProductsScrollRef}
                    className="flex gap-6 overflow-x-auto pb-4 -mb-4 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    role="region"
                    aria-label="Product list"
                    tabIndex={0}
                >
                    {loading
                        ? Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="w-64 flex-shrink-0">
                                <Skeleton className="h-96 rounded-lg bg-default-300" />
                            </div>
                        ))
                        : products.map(product => renderProductCard(product, true))}
                </div>
            </div>


            <Divider className="my-8" />

            {/* === KHU VỰC SẢN PHẨM BÁN CHẠY (Không đổi) === */}
            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    Sản phẩm bán chạy
                </h2>
                <div className="flex gap-6 overflow-x-auto pb-4 -mb-4">
                    {loading
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="w-64 flex-shrink-0">
                                <Skeleton className="h-96 rounded-lg bg-default-300" />
                            </div>
                        ))
                        : topProducts.map(product => renderProductCard(product, true))}
                </div>
            </div>
        </div>
    );
};

export default ProductList;