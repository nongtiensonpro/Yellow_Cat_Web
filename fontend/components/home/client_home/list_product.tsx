//
// "use client";
//
// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { CldImage } from "next-cloudinary";
// import Image from "next/image"; // Import Image component from next/image
// import {
//     Card,
//     CardBody,
//     CardHeader,
//     CardFooter,
//     Button,
//     Chip,
//     Skeleton,
//     Divider,
//     Badge,
// } from "@heroui/react";
// import {
//     ShoppingCartIcon,
//     EyeIcon,
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     TagIcon,
//     StarIcon
// } from "@heroicons/react/24/outline";
// import { useTheme } from 'next-themes';
//
// interface Product {
//     productId: number;
//     productName: string;
//     purchases: number;
//     categoryName: string;
//     brandName: string;
//     logoPublicId: string;
//     minPrice: number | null;
//     totalStock: number | null;
//     thumbnail: string | null;
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
//     const { theme, setTheme } = useTheme();
//
//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 const response = await fetch('http://localhost:8080/api/products');
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch products');
//                 }
//                 const data: ApiResponse = await response.json();
//                 if (data.status === 200 && data.data && data.data.content) {
//                     setProducts(data.data.content);
//                 } else {
//                     throw new Error(data.message || 'Failed to fetch products');
//                 }
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'An unknown error occurred');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchProducts();
//     }, []);
//
//     const formatPrice = (price: number | null) => {
//         if (price === null) return 'Liên hệ';
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
//     };
//
//     const getStockStatus = (stock: number | null) => {
//         if (!stock || stock === 0) return { color: 'danger' as const, text: 'Hết hàng' };
//         if (stock < 10) return { color: 'warning' as const, text: 'Sắp hết' };
//         return { color: 'success' as const, text: 'Còn hàng' };
//     };
//
//     const toggleTheme = () => {
//         setTheme(theme === 'dark' ? 'light' : 'dark');
//     };
//
//     if (loading) {
//         return (
//             <div className="mx-auto w-full">
//                 <div className="flex justify-between items-center mb-8">
//                     <Skeleton className="w-48 h-8 rounded-lg" />
//                     <Skeleton className="w-24 h-10 rounded-lg" />
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//                     {Array.from({ length: 8 }).map((_, index) => (
//                         <Card key={index} className="w-full space-y-5 p-4" radius="lg">
//                             <Skeleton className="rounded-lg">
//                                 <div className="h-48 rounded-lg bg-default-300"></div>
//                             </Skeleton>
//                             <div className="space-y-3">
//                                 <Skeleton className="w-3/5 rounded-lg">
//                                     <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
//                                 </Skeleton>
//                                 <Skeleton className="w-4/5 rounded-lg">
//                                     <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
//                                 </Skeleton>
//                                 <Skeleton className="w-2/5 rounded-lg">
//                                     <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
//                                 </Skeleton>
//                             </div>
//                         </Card>
//                     ))}
//                 </div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="container mx-auto px-4 py-8 max-w-7xl">
//                 <Card className="max-w-md mx-auto">
//                     <CardBody className="text-center py-8">
//                         <div className="text-danger text-xl mb-4">⚠️</div>
//                         <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
//                         <p className="text-default-500">{error}</p>
//                         <Button
//                             color="primary"
//                             variant="flat"
//                             className="mt-4"
//                             onClick={() => window.location.reload()}
//                         >
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
//             {/* Banner Section */}
//             <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
//                 <Image
//                     src="/images/banner.png" // Đường dẫn đến ảnh banner của bạn
//                     alt="Product List Banner"
//                     layout="fill" // Sử dụng layout="fill" để ảnh cover toàn bộ div cha
//                     objectFit="cover" // Đảm bảo ảnh được cover và không bị biến dạng
//                     quality={100} // Chất lượng ảnh cao
//                     priority // Tải ảnh này ưu tiên để nó xuất hiện nhanh
//                 />
//             </div>
//
//             {/* Header Section */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//                 <div>
//                     <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
//                         TOP SẢN PHẨM BÁN CHẠY
//                     </h1>
//                 </div>
//                 <div className="flex items-center gap-3">
//                     <Chip
//                         startContent={<BuildingStorefrontIcon className="w-4 h-4" />}
//                         variant="flat"
//                         color="primary"
//                     >
//                         {products.length} sản phẩm
//                     </Chip>
//                 </div>
//             </div>
//
//             {/* Products Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {products.map((product) => {
//                     const stockStatus = getStockStatus(product.totalStock);
//
//                     return (
//                         <Card
//                             key={product.productId}
//                             className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200"
//                             isPressable
//                         >
//                             <CardHeader className="pb-0 pt-2 px-4 relative">
//                                 {/* Product Image */}
//                                 <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
//                                     {product.thumbnail ? (
//                                         <CldImage
//                                             width={400}
//                                             height={400}
//                                             src={product.thumbnail}
//                                             alt={product.productName}
//                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                                         />
//                                     ) : (
//                                         <div className="w-full h-full flex items-center justify-center text-default-400">
//                                             <BuildingStorefrontIcon className="w-16 h-16" />
//                                         </div>
//                                     )}
//
//                                     {/* Stock Badge */}
//                                     <Badge
//                                         color={stockStatus.color}
//                                         className="absolute top-2 right-2"
//                                         size="sm"
//                                     >
//                                         {stockStatus.text}
//                                     </Badge>
//                                 </div>
//                             </CardHeader>
//
//                             <CardBody className="px-4 py-3">
//                                 {/* Product Name */}
//                                 <Link href={`/products/${product.productId}`}>
//                                     <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
//                                         {product.productName}
//                                     </h4>
//                                 </Link>
//
//                                 {/* Price */}
//                                 <div className="flex items-center gap-2 my-2">
//                                     <CurrencyDollarIcon className="w-4 h-4 text-success" />
//                                     <span className="text-lg font-semibold text-success">
//                                         {formatPrice(product.minPrice)}
//                                     </span>
//                                 </div>
//
//                                 {/* Brand & Category */}
//                                 <div className="flex items-center justify-between mb-3">
//                                     <div className="flex items-center gap-2">
//                                         <div className="relative w-8 h-8 rounded-full overflow-hidden bg-default-100 border-2 border-default-200 flex items-center justify-center">
//                                             {product.logoPublicId ? (
//                                                 <CldImage
//                                                     width={32}
//                                                     height={32}
//                                                     src={product.logoPublicId}
//                                                     alt={`${product.brandName} logo`}
//                                                     className="w-full h-full object-contain"
//                                                 />
//                                             ) : (
//                                                 <div className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white text-xs font-bold w-full h-full flex items-center justify-center rounded-full">
//                                                     {product.brandName.charAt(0).toUpperCase()}
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div className="flex flex-col">
//                                             <span className="text-sm font-medium">{product.brandName}</span>
//                                             <span className="text-xs text-default-500">{product.categoryName}</span>
//                                         </div>
//                                     </div>
//                                 </div>
//
//                                 <Divider className="my-2" />
//
//                                 {/* Stats */}
//                                 <div className="flex justify-between items-center text-sm">
//                                     <div className="flex items-center gap-1 text-default-600">
//                                         <TagIcon className="w-4 h-4" />
//                                         <span>Kho: {product.totalStock || 'N/A'}</span>
//                                     </div>
//                                     <div className="flex items-center gap-1 text-default-600">
//                                         <StarIcon className="w-4 h-4" />
//                                         <span>Đã bán: {product.purchases}</span>
//                                     </div>
//                                 </div>
//                             </CardBody>
//                         </Card>
//                     );
//                 })}
//             </div>
//
//             {/* Empty State */}
//             {products.length === 0 && (
//                 <Card className="max-w-md mx-auto mt-12">
//                     <CardBody className="text-center py-12">
//                         <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
//                         <h3 className="text-xl font-semibold mb-2">Không có sản phẩm</h3>
//                         <p className="text-default-500">
//                             Hiện tại chưa có sản phẩm nào được hiển thị.
//                         </p>
//                     </CardBody>
//                 </Card>
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
// import Image from "next/image";
// import {
//     Card,
//     CardBody,
//     CardHeader,
//     Button,
//     Chip,
//     Skeleton,
//     Divider,
//     Badge,
//     Pagination // Import Pagination component
// } from "@heroui/react";
// import {
//     ShoppingCartIcon,
//     EyeIcon,
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     TagIcon,
//     StarIcon
// } from "@heroicons/react/24/outline";
// import { useTheme } from 'next-themes';
//
// interface Product {
//     productId: number;
//     productName: string;
//     purchases: number;
//     categoryName: string;
//     brandName: string;
//     logoPublicId: string;
//     minPrice: number | null;
//     totalStock: number | null;
//     thumbnail: string | null;
// }
//
// interface PageInfo {
//     size: number;
//     number: number; // current page number (0-indexed)
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
//     const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed page
//     const [totalPages, setTotalPages] = useState<number>(0);
//     const pageSize = 8; // Number of products per page, adjust as needed
//     const { theme, setTheme } = useTheme();
//
//     useEffect(() => {
//         const fetchProducts = async () => {
//             setLoading(true); // Set loading true on each fetch
//             try {
//                 // Pass current page and size as query parameters
//                 const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${pageSize}`);
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch products');
//                 }
//                 const apiResponse: ApiResponse = await response.json();
//
//                 if (apiResponse.status === 200 && apiResponse.data && apiResponse.data.content) {
//                     setProducts(apiResponse.data.content);
//                     setTotalPages(apiResponse.data.page.totalPages);
//                 } else {
//                     throw new Error(apiResponse.message || 'Failed to fetch products');
//                 }
//             } catch (err) {
//                 setError(err instanceof Error ? err.message : 'An unknown error occurred');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         fetchProducts();
//     }, [currentPage, pageSize]); // Re-fetch when currentPage or pageSize changes
//
//     const formatPrice = (price: number | null) => {
//         if (price === null) return 'Liên hệ';
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
//     };
//
//     const getStockStatus = (stock: number | null) => {
//         if (!stock || stock === 0) return { color: 'danger' as const, text: 'Hết hàng' };
//         if (stock < 10) return { color: 'warning' as const, text: 'Sắp hết' };
//         return { color: 'success' as const, text: 'Còn hàng' };
//     };
//
//     const handlePageChange = (page: number) => {
//         // Pagination component usually returns 1-indexed page, convert to 0-indexed
//         setCurrentPage(page - 1);
//     };
//
//     if (loading) {
//         return (
//             <div className="mx-auto w-full max-w-7xl px-4 py-8">
//                 <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
//                     <Skeleton className="w-full h-full rounded-lg" />
//                 </div>
//                 <div className="flex justify-between items-center mb-8">
//                     <Skeleton className="w-48 h-8 rounded-lg" />
//                     <Skeleton className="w-24 h-10 rounded-lg" />
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                     {Array.from({ length: pageSize }).map((_, index) => (
//                         <Card key={index} className="w-full space-y-5 p-4" radius="lg">
//                             <Skeleton className="rounded-lg">
//                                 <div className="h-48 rounded-lg bg-default-300"></div>
//                             </Skeleton>
//                             <div className="space-y-3">
//                                 <Skeleton className="w-3/5 rounded-lg">
//                                     <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
//                                 </Skeleton>
//                                 <Skeleton className="w-4/5 rounded-lg">
//                                     <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
//                                 </Skeleton>
//                                 <Skeleton className="w-2/5 rounded-lg">
//                                     <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
//                                 </Skeleton>
//                             </div>
//                         </Card>
//                     ))}
//                 </div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="container mx-auto px-4 py-8 max-w-7xl">
//                 <Card className="max-w-md mx-auto">
//                     <CardBody className="text-center py-8">
//                         <div className="text-danger text-xl mb-4">⚠️</div>
//                         <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
//                         <p className="text-default-500">{error}</p>
//                         <Button
//                             color="primary"
//                             variant="flat"
//                             className="mt-4"
//                             onClick={() => window.location.reload()}
//                         >
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
//             {/* Banner Section */}
//             <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
//                 <Image
//                     src="/images/banner.png"
//                     alt="Product List Banner"
//                     layout="fill"
//                     objectFit="cover"
//                     quality={100}
//                     priority
//                 />
//             </div>
//
//             {/* Header Section */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
//                 <div className="flex justify-center w-full">
//                     <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
//                         TOP SẢN PHẨM BÁN CHẠY
//                     </h1>
//                 </div>
//                 <div className="flex items-center gap-3">
//                     <Chip
//                         startContent={<BuildingStorefrontIcon className="w-4 h-4" />}
//                         variant="flat"
//                         color="primary"
//                     >
//                         {products.length} sản phẩm
//                     </Chip>
//                 </div>
//             </div>
//
//             {/* Products Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {products.map((product) => {
//                     const stockStatus = getStockStatus(product.totalStock);
//
//                     return (
//                         <Card
//                             key={product.productId}
//                             className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200"
//                             isPressable
//                         >
//                             <CardHeader className="pb-0 pt-2 px-4 relative">
//                                 {/* Product Image */}
//                                 <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
//                                     {product.thumbnail ? (
//                                         <CldImage
//                                             width={400}
//                                             height={400}
//                                             src={product.thumbnail}
//                                             alt={product.productName}
//                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                                         />
//                                     ) : (
//                                         <div className="w-full h-full flex items-center justify-center text-default-400">
//                                             <BuildingStorefrontIcon className="w-16 h-16" />
//                                         </div>
//                                     )}
//
//                                     {/* Stock Badge */}
//                                     <Badge
//                                         color={stockStatus.color}
//                                         className="absolute top-2 right-2"
//                                         size="sm"
//                                     >
//                                         {stockStatus.text}
//                                     </Badge>
//                                 </div>
//                             </CardHeader>
//
//                             <CardBody className="px-4 py-3">
//                                 {/* Product Name */}
//                                 <Link href={`/products/${product.productId}`}>
//                                     <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
//                                         {product.productName}
//                                     </h4>
//                                 </Link>
//
//                                 {/* Price */}
//                                 <div className="flex items-center gap-2 my-2">
//                                     <CurrencyDollarIcon className="w-4 h-4 text-success" />
//                                     <span className="text-lg font-semibold text-success">
//                                         {formatPrice(product.minPrice)}
//                                     </span>
//                                 </div>
//
//                                 {/* Brand & Category */}
//                                 <div className="flex items-center justify-between mb-3">
//                                     <div className="flex items-center gap-2">
//                                         <div className="relative w-8 h-8 rounded-full overflow-hidden bg-default-100 border-2 border-default-200 flex items-center justify-center">
//                                             {product.logoPublicId ? (
//                                                 <CldImage
//                                                     width={32}
//                                                     height={32}
//                                                     src={product.logoPublicId}
//                                                     alt={`${product.brandName} logo`}
//                                                     className="w-full h-full object-contain"
//                                                 />
//                                             ) : (
//                                                 <div className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white text-xs font-bold w-full h-full flex items-center justify-center rounded-full">
//                                                     {product.brandName.charAt(0).toUpperCase()}
//                                                 </div>
//                                             )}
//                                         </div>
//                                         <div className="flex flex-col">
//                                             <span className="text-sm font-medium">{product.brandName}</span>
//                                             <span className="text-xs text-default-500">{product.categoryName}</span>
//                                         </div>
//                                     </div>
//                                 </div>
//
//                                 <Divider className="my-2" />
//
//                                 {/* Stats */}
//                                 <div className="flex justify-between items-center text-sm">
//                                     <div className="flex items-center gap-1 text-default-600">
//                                         <TagIcon className="w-4 h-4" />
//                                         <span>Kho: {product.totalStock || 'N/A'}</span>
//                                     </div>
//                                     <div className="flex items-center gap-1 text-default-600">
//                                         <StarIcon className="w-4 h-4" />
//                                         <span>Đã bán: {product.purchases}</span>
//                                     </div>
//                                 </div>
//                             </CardBody>
//                         </Card>
//                     );
//                 })}
//             </div>
//
//             {/* Pagination Controls */}
//             {totalPages > 1 && (
//                 <div className="flex w-full justify-center mt-8">
//                     <Pagination
//                         loop
//                         showControls
//                         color="primary"
//                         page={currentPage + 1} // `Pagination` expects 1-indexed page
//                         total={totalPages}
//                         onChange={handlePageChange}
//                     />
//                 </div>
//             )}
//
//             {/* Empty State */}
//             {products.length === 0 && !loading && (
//                 <Card className="max-w-md mx-auto mt-12">
//                     <CardBody className="text-center py-12">
//                         <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
//                         <h3 className="text-xl font-semibold mb-2">Không có sản phẩm</h3>
//                         <p className="text-default-500">
//                             Hiện tại chưa có sản phẩm nào được hiển thị.
//                         </p>
//                     </CardBody>
//                 </Card>
//             )}
//         </div>
//     );
// };
//
// export default ProductList;

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Skeleton,
    Divider,
    Badge,
    Pagination
} from "@heroui/react";
import {
    ShoppingCartIcon,
    EyeIcon,
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    TagIcon,
    StarIcon
} from "@heroicons/react/24/outline";
import { useTheme } from 'next-themes';

interface Product {
    productId: number;
    productName: string;
    purchases: number;
    categoryName: string;
    brandName: string;
    logoPublicId: string;
    minPrice: number | null;
    totalStock: number | null;
    thumbnail: string | null;
    createdAt?: string; // Assuming a createdAt field for new products
}

interface PageInfo {
    size: number;
    number: number; // current page number (0-indexed)
    totalElements: number;
    totalPages: number;
}

interface ApiResponseData {
    content: Product[];
    page: PageInfo;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ApiResponseData;
}

const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [newProducts, setNewProducts] = useState<Product[]>([]); // New state for new products
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingNewProducts, setLoadingNewProducts] = useState<boolean>(true); // Loading for new products
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0); // 0-indexed page
    const [totalPages, setTotalPages] = useState<number>(0);
    const pageSize = 8; // Number of products per page, adjust as needed
    const { theme, setTheme } = useTheme();

    // Effect to fetch all products for pagination
    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${pageSize}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const apiResponse: ApiResponse = await response.json();

                if (apiResponse.status === 200 && apiResponse.data && apiResponse.data.content) {
                    setProducts(apiResponse.data.content);
                    setTotalPages(apiResponse.data.page.totalPages);
                } else {
                    throw new Error(apiResponse.message || 'Failed to fetch products');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, [currentPage, pageSize]);

    // Effect to fetch new products (e.g., last 4 added)
    useEffect(() => {
        const fetchNewProducts = async () => {
            setLoadingNewProducts(true);
            try {
                // IMPORTANT: Replace this with your actual API endpoint for new products.
                // This is a placeholder. You might need to add a new endpoint on your backend
                // that returns products sorted by creation date.
                const response = await fetch('http://localhost:8080/api/products/new?limit=4'); // Example endpoint
                if (!response.ok) {
                    throw new Error('Failed to fetch new products');
                }
                const apiResponse: ApiResponse = await response.json();

                if (apiResponse.status === 200 && apiResponse.data && apiResponse.data.content) {
                    setNewProducts(apiResponse.data.content);
                } else {
                    console.warn("Could not fetch new products:", apiResponse.message);
                    setNewProducts([]); // Ensure it's an empty array if no new products
                }
            } catch (err) {
                console.error("Error fetching new products:", err);
                setNewProducts([]);
            } finally {
                setLoadingNewProducts(false);
            }
        };

        fetchNewProducts();
    }, []); // Run once on component mount

    const formatPrice = (price: number | null) => {
        if (price === null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStockStatus = (stock: number | null) => {
        if (!stock || stock === 0) return { color: 'danger' as const, text: 'Hết hàng' };
        if (stock < 10) return { color: 'warning' as const, text: 'Sắp hết' };
        return { color: 'success' as const, text: 'Còn hàng' };
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1); // Pagination component usually returns 1-indexed page, convert to 0-indexed
    };

    const renderProductCard = (product: Product, index: number) => {
        const stockStatus = getStockStatus(product.totalStock);
        return (
            <Card
                key={product.productId}
                className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200"
                isPressable
            >
                <CardHeader className="pb-0 pt-2 px-4 relative">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
                        {product.thumbnail ? (
                            <CldImage
                                width={400}
                                height={400}
                                src={product.thumbnail}
                                alt={product.productName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-400">
                                <BuildingStorefrontIcon className="w-16 h-16" />
                            </div>
                        )}
                        <Badge
                            color={stockStatus.color}
                            className="absolute top-2 right-2"
                            size="sm"
                        >
                            {stockStatus.text}
                        </Badge>
                    </div>
                </CardHeader>
                <CardBody className="px-4 py-3">
                    <Link href={`/products/${product.productId}`}>
                        <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
                            {product.productName}
                        </h4>
                    </Link>
                    <div className="flex items-center gap-2 my-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-success" />
                        <span className="text-lg font-semibold text-success">
                            {formatPrice(product.minPrice)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-default-100 border-2 border-default-200 flex items-center justify-center">
                                {product.logoPublicId ? (
                                    <CldImage
                                        width={32}
                                        height={32}
                                        src={product.logoPublicId}
                                        alt={`${product.brandName} logo`}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white text-xs font-bold w-full h-full flex items-center justify-center rounded-full">
                                        {product.brandName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{product.brandName}</span>
                                <span className="text-xs text-default-500">{product.categoryName}</span>
                            </div>
                        </div>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-default-600">
                            <TagIcon className="w-4 h-4" />
                            <span>Kho: {product.totalStock || 'N/A'}</span>
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <div className="text-danger text-xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
                        <p className="text-default-500">{error}</p>
                        <Button
                            color="primary"
                            variant="flat"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                        >
                            Thử lại
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Banner Section */}
            <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
                <Image
                    src="/images/banner.png"
                    alt="Product List Banner"
                    layout="fill"
                    objectFit="cover"
                    quality={100}
                    priority
                />
            </div>

            {/* New Products Section */}
            {!loadingNewProducts && newProducts.length > 0 && (
                <>
                    <div className="flex justify-center w-full mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                            SẢN PHẨM MỚI
                        </h1>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                        {newProducts.map((product, index) => renderProductCard(product, index))}
                    </div>
                    <Divider className="my-12" />
                </>
            )}

            {/* Top Selling Products Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex justify-center w-full">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Sản phẩm nổi bật
                    </h1>
                </div>
                {/* Moved the total products chip here for logical grouping */}
                <div className="flex items-center gap-3">
                    <Chip
                        startContent={<BuildingStorefrontIcon className="w-4 h-4" />}
                        variant="flat"
                        color="primary"
                    >
                        {products.length} sản phẩm
                    </Chip>
                </div>
            </div>

            {/* Products Grid - Top Selling */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: pageSize }).map((_, index) => (
                        <Card key={index} className="w-full space-y-5 p-4" radius="lg">
                            <Skeleton className="rounded-lg">
                                <div className="h-48 rounded-lg bg-default-300"></div>
                            </Skeleton>
                            <div className="space-y-3">
                                <Skeleton className="w-3/5 rounded-lg">
                                    <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-4/5 rounded-lg">
                                    <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-2/5 rounded-lg">
                                    <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
                                </Skeleton>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product, index) => renderProductCard(product, index))}
                </div>
            )}


            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex w-full justify-center mt-8">
                    <Pagination
                        loop
                        showControls
                        color="primary"
                        page={currentPage + 1} // `Pagination` expects 1-indexed page
                        total={totalPages}
                        onChange={handlePageChange}
                    />
                </div>
            )}

            {/* Empty State for Top Selling Products */}
            {products.length === 0 && !loading && (
                <Card className="max-w-md mx-auto mt-12">
                    <CardBody className="text-center py-12">
                        <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Không có sản phẩm bán chạy</h3>
                        <p className="text-default-500">
                            Hiện tại chưa có sản phẩm bán chạy nào được hiển thị.
                        </p>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default ProductList;