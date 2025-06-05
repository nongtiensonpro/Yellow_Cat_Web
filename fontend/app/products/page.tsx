//
// "use client"; // Đây là Client Component
//
// import React, { useEffect, useState, useMemo } from 'react';
// import Link from 'next/link';
// import { CldImage } from "next-cloudinary";
<<<<<<< Updated upstream
=======
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
//     Input,
//     CheckboxGroup,
//     Checkbox,
//     Select, // Import Select component
//     SelectItem, // Import SelectItem component
// } from "@heroui/react";
// import {
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     TagIcon,
//     StarIcon,
//     MagnifyingGlassIcon,
//     BarsArrowDownIcon, // Icon for sorting
//     BarsArrowUpIcon, // Icon for sorting
// } from "@heroicons/react/24/outline";
// import { useTheme } from 'next-themes';
>>>>>>> Stashed changes
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
//     sizes: number[];
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
<<<<<<< Updated upstream
// // --- Kết thúc Interfaces và Types ---
//
// export default function Home() {
=======
//
// const ProductList = () => {
>>>>>>> Stashed changes
//     const [products, setProducts] = useState<Product[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string | null>(null);
//     const { theme, setTheme } = useTheme();
//
<<<<<<< Updated upstream
//
//     const brands = ["Nike", "Adidas", "Puma"];
//     const colors = ["Trắng", "Đen"];
//     const sizes = ["39", "40", "41", "42", "43", "44", "45"];
//     const materials = ["Canvas", "Vải"];
=======
//     // State for filters
//     const [searchTerm, setSearchTerm] = useState<string>('');
//     const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
//
//     // State for sorting
//     const [sortOption, setSortOption] = useState<string>('default'); // 'default', 'price-asc', 'price-desc', 'name-asc', 'name-desc'
//
//     // Add state for fetched filter options
//     const [fetchedSizes, setFetchedSizes] = useState<string[]>([]);
//     const [fetchedMaterials, setFetchedMaterials] = useState<string[]>([]);
//     const [fetchedBrands, setFetchedBrands] = useState<string[]>([]);
>>>>>>> Stashed changes
//
//     useEffect(() => {
//         const fetchFilterOptions = async () => {
//             try {
<<<<<<< Updated upstream
//                 const response = await fetch(`http://localhost:8080/api/products?page=${page - 1}&size=12`);
=======
//                 // const sizesRes = await fetch('http://localhost:8080/api/sizes'); // Replace with your actual API endpoints
//                 // const materialsRes = await fetch('http://localhost:8080/api/materials');
//                 const brandsRes = await fetch('http://localhost:8080/api/brands');
//
//                 // const sizesData = await sizesRes.json();
//                 // const materialsData = await materialsRes.json();
//                 const brandsData = await brandsRes.json();
//
//                 // setFetchedSizes(sizesData.data); // Assuming data structure is { data: string[] }
//                 // setFetchedMaterials(materialsData.data);
//                 setFetchedBrands(brandsData.data);
//             } catch (err) {
//                 console.error("Failed to fetch filter options:", err);
//                 // Optionally, handle error or fall back to hardcoded defaults
//             }
//         };
//         fetchFilterOptions();
//     }, []);
//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 const response = await fetch('http://localhost:8080/api/products');
>>>>>>> Stashed changes
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch products');
//                 }
//                 const data: ApiResponse = await response.json();
//                 if (data.status === 200 && data.data && data.data.content) {
<<<<<<< Updated upstream
//                     const activeProducts = data.data.content.filter(product => product.isActive);
//                     setProducts(activeProducts);
//                     setTotalPages(data.data.page.totalPages);
=======
//                     setProducts(data.data.content);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
//         fetchProducts(currentPage);
//     }, [currentPage]);
=======
//         fetchProducts();
//     }, []);
>>>>>>> Stashed changes
//
//     const formatPrice = (price: number | null) => {
//         if (price === null) return 'Liên hệ';
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
//     };
//
<<<<<<< Updated upstream
//     const renderFilterSection = (title: string, items: string[], type: 'checkbox' | 'radio') => (
//         <div className="filter-section">
//             <h3 className="filter-title">{title}</h3>
//             <div className="filter-options">
//                 {items.map((item, index) => (
//                     <label key={index} className="filter-option">
//                         <input type={type} name={title.toLowerCase().replace(/\s/g, '-')} value={item} />
//                         <span className="ml-2">{item}</span>
//                     </label>
//                 ))}
//             </div>
//         </div>
//     );
//
//     const renderPagination = () => {
//         const pageNumbers = [];
//         const maxPagesToShow = 5;
//         let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//         let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
//
//         if (endPage - startPage + 1 < maxPagesToShow) {
//             startPage = Math.max(1, endPage - maxPagesToShow + 1);
=======
//     const getStockStatus = (stock: number | null) => {
//         if (!stock || stock === 0) return { color: 'danger' as const, text: 'Hết hàng' };
//         if (stock < 10) return { color: 'warning' as const, text: 'Sắp hết' };
//         return { color: 'success' as const, text: 'Còn hàng' };
//     };
//
//     // Filtered and Sorted products
//     const displayedProducts = useMemo(() => {
//         let currentProducts = products.filter(product => {
//             const matchesSearchTerm = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
//             const productSizes = product.sizes || [];
//             const matchesSizes = selectedSizes.length === 0 ||
//                 selectedSizes.some(size => productSizes.includes(parseInt(size)));
//             return matchesSearchTerm && matchesSizes;
//         });
//
//         // Apply sorting
//         switch (sortOption) {
//             case 'price-asc':
//                 currentProducts.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
//                 break;
//             case 'price-desc':
//                 currentProducts.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
//                 break;
//             case 'name-asc':
//                 currentProducts.sort((a, b) => a.productName.localeCompare(b.productName));
//                 break;
//             case 'name-desc':
//                 currentProducts.sort((a, b) => b.productName.localeCompare(a.productName));
//                 break;
//             case 'default':
//             default:
//                 // No specific sorting, retain original order or a default stable sort if needed
//                 // For a truly stable sort, you might need to sort by a unique ID if available
//                 break;
>>>>>>> Stashed changes
//         }
//
//         return currentProducts;
//     }, [products, searchTerm, selectedSizes, sortOption]);
//
//     if (loading) {
//         return (
//             <div className="mx-auto w-full">
//                 <div className="flex justify-between items-center mb-8">
//                     <Skeleton className="w-48 h-8 rounded-lg" />
//                     <Skeleton className="w-24 h-10 rounded-lg" />
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
<<<<<<< Updated upstream
//         <StyledWrapper>
//             <div className="page-header">
//                 <div className="sort-by">
//                     <label htmlFor="sort">Sắp xếp:</label>
//                     <select id="sort" className="sort-select">
//                         <option value="price-asc">Giá tăng dần</option>
//                         <option value="price-desc">Giá giảm dần</option>
//                     </select>
=======
//         <div className="container mx-auto px-4 py-8 max-w-7xl">
//             <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
//                 <Image
//                     src="/images/banner.png"
//                     alt="Product List Banner"
//                     fill={true}
//                     objectFit="cover"
//                     quality={100}
//                     priority
//                 />
//             </div>
//
//             {/*/!* Header Section *!/*/}
//             {/*<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">*/}
//             {/*    <div className="flex items-center gap-3">*/}
//             {/*        <Chip*/}
//             {/*            startContent={<BuildingStorefrontIcon className="w-4 h-4" />}*/}
//             {/*            variant="flat"*/}
//             {/*            color="primary"*/}
//             {/*        >*/}
//             {/*            {displayedProducts.length} sản phẩm*/}
//             {/*        </Chip>*/}
//             {/*    </div>*/}
//             {/*</div>*/}
//
//             {/* --- Filter and Sort Section --- */}
//             <div className="mb-8 p-6 bg-default-50 rounded-lg shadow-md">
//                 <h2 className="text-xl font-semibold mb-4 text-default-800">Bộ lọc & Sắp xếp</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     {/* Search by Product Name */}
//                     <div>
//                         <Input
//                             label="Tìm kiếm theo tên sản phẩm"
//                             placeholder="Nhập tên giày..."
//                             value={searchTerm}
//                             onValueChange={setSearchTerm}
//                             startContent={
//                                 <MagnifyingGlassIcon className="w-5 h-5 text-default-400" />
//                             }
//                             isClearable
//                             onClear={() => setSearchTerm('')}
//                         />
//                     </div>
//
//
//                     {/* Sort by */}
//                     <div>
//                         <Select
//                             label="Sắp xếp theo"
//                             placeholder="Chọn tùy chọn sắp xếp"
//                             selectedKeys={[sortOption]}
//                             onSelectionChange={(keys) => {
//                                 // @ts-ignore
//                                 setSortOption(Array.from(keys).join(','));
//                             }}
//                             className="w-full"
//                         >
//                             <SelectItem key="default" >Mặc định</SelectItem>
//                             <SelectItem key="price-asc" >Giá: Thấp đến Cao</SelectItem>
//                             <SelectItem key="price-desc"  >Giá: Cao đến Thấp</SelectItem>
//                             <SelectItem key="name-asc" >Tên: A-Z</SelectItem>
//                             <SelectItem key="name-desc" >Tên: Z-A</SelectItem>
//                         </Select>
//                     </div>
>>>>>>> Stashed changes
//                 </div>
//             </div>
//             {/* --- End Filter and Sort Section --- */}
//
<<<<<<< Updated upstream
//             <div className="main-content">
//                 <aside className="sidebar">
//                     {renderFilterSection("THƯƠNG HIỆU", brands, 'checkbox')}
//                     {renderFilterSection("MÀU SẮC", colors, 'checkbox')}
//                     {renderFilterSection("KÍCH THƯỚC", sizes, 'checkbox')}
//                     {renderFilterSection("CHẤT LIỆU", materials, 'checkbox')}
//                 </aside>
//
//                 <div className="product-display-area">
//                     <div className="product-grid">
//                         {products.map((product) => (
//                             <div className="card" key={product.productId}>
//                                 {/* Sale and New badges */}
//                                 <div className="badge-container">
//                                     {(product.activePromotions && product.activePromotions.includes("ONLINE_EXCLUSIVE")) && (
//                                         <div className="badge online-exclusive">
//                                             <img src="/online-exclusive-badge.png" alt="Online Exclusive" /> {/* Bạn cần tạo ảnh này */}
//                                         </div>
//                                     )}
//                                     {(product.activePromotions && product.activePromotions.includes("NEW_ARRIVAL")) && (
//                                         <div className="badge new-arrival">NEW</div>
//                                     )}
//                                     {(product.activePromotions && product.activePromotions.includes("SALE")) && (
//                                         <div className="badge sale">SALE</div>
//                                     )}
//                                 </div>
//
//
//                                 <div className="image-container">
=======
//             {/* Products Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {displayedProducts.map((product) => {
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
//                                     {/* Heart icon for wishlist */}
//                                     <div className="wishlist-icon">
//                                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
//                                             <path d="m11.645 20.91-.007.003-.002.001-.006-.003Zm-2.493-9.255A.75.75 0 0 1 11.25 8.5v5.053a.75.75 0 0 1-1.258.679L7.5 12.333a.75.75 0 0 1-.295-.593V8.5A.75.75 0 0 1 8.5 7.75h2.25v-.321c0-.353.25-.662.593-.674.32-.012.628.18.775.47l1.761 3.522a.75.75 0 0 1-.775 1.077l-1.428-.714a.75.75 0 0 0-.964.331l-.25.5a.75.75 0 0 1-.964.331l-.25-.5ZM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" clipRule="evenodd" />
//                                         </svg>
//                                     </div>
=======
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
>>>>>>> Stashed changes
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
//             {displayedProducts.length === 0 && (
//                 <Card className="max-w-md mx-auto mt-12">
//                     <CardBody className="text-center py-12">
//                         <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
//                         <h3 className="text-xl font-semibold mb-2">Không có sản phẩm nào phù hợp</h3>
//                         <p className="text-default-500">
//                             Hãy thử điều chỉnh bộ lọc của bạn hoặc kiểm tra lại tên sản phẩm.
//                         </p>
//                     </CardBody>
//                 </Card>
//             )}
//         </div>
//     );
// }
//
// // --- Styled Components ---
// const StyledWrapper = styled.div`
//     max-width: 1400px;
//     margin: 0 auto;
//     padding: 2rem 1rem;
//     font-family: Arial, sans-serif;
//     color: #333;
//
//     .page-header {
//         display: flex;
//         justify-content: space-between;
//         align-items: flex-end; /* Căn chỉnh cho tiêu đề trang */
//         margin-bottom: 2rem;
//         padding-bottom: 1rem;
//         border-bottom: 1px solid #e0e0e0; /* Màu border nhạt hơn */
//     }
//
//     .page-title {
//         font-size: 2.2rem; /* Kích thước lớn hơn */
//         font-weight: 700;
//         color: #1a1a1a;
//         margin: 0;
//     }
//
//     .sort-by {
//         display: flex;
//         align-items: center;
//         gap: 0.5rem;
//         font-size: 0.95rem;
//         color: #555;
//     }
//
//     .sort-select {
//         padding: 0.5rem 0.75rem;
//         border: 1px solid #ccc;
//         border-radius: 0.25rem;
//         background-color: #fff;
//         cursor: pointer;
//         font-size: 0.9rem;
//         -webkit-appearance: none;
//         -moz-appearance: none;
//         appearance: none;
//         background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
//         background-repeat: no-repeat;
//         background-position: right 0.75rem center;
//         background-size: 0.8rem;
//     }
//
//     .main-content {
//         display: flex;
//         gap: 2rem;
//     }
//
//     .sidebar {
//         width: 280px;
//         flex-shrink: 0;
//         background-color: #f7f7f7; /* Màu nền sidebar giống ảnh */
//         border-radius: 0.5rem;
//         padding: 1.5rem;
//         box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Bóng đổ nhẹ hơn */
//     }
//
//     .filter-section {
//         margin-bottom: 1.5rem;
//         padding-bottom: 1.5rem;
//         border-bottom: 1px solid #eee;
//
//         &:last-child {
//             border-bottom: none;
//             margin-bottom: 0;
//             padding-bottom: 0;
//         }
//     }
//
//     .filter-title {
//         font-size: 0.9rem;
//         font-weight: 600;
//         color: #333;
//         text-transform: uppercase;
//         margin-bottom: 1rem;
//         letter-spacing: 0.05em; /* Thêm khoảng cách chữ */
//     }
//
//     .filter-options {
//         display: flex;
//         flex-direction: column;
//         gap: 0.75rem;
//     }
//
//     .filter-option {
//         display: flex;
//         align-items: center;
//         font-size: 0.9rem;
//         color: #555;
//         cursor: pointer;
//
//         input[type="checkbox"],
//         input[type="radio"] {
//             margin-right: 0.5rem;
//             accent-color: #3182ce;
//             width: 1rem; /* Kích thước checkbox/radio */
//             height: 1rem;
//         }
//     }
//
//     .product-display-area {
//         flex-grow: 1;
//     }
//
//     .product-grid {
//         display: grid;
//         grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
//         gap: 1.5rem;
//     }
//
//     .card {
//         background-color: #fff;
//         border-radius: 0.5rem;
//         box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
//         transition: transform 0.2s ease, box-shadow 0.2s ease;
//         overflow: hidden;
//         position: relative;
//     }
//
//     .card:hover {
//         transform: translateY(-3px);
//         box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
//     }
//
//     .badge-container {
//         position: absolute;
//         top: 0.75rem;
//         left: 0.75rem;
//         display: flex;
//         flex-direction: column;
//         gap: 0.4rem; /* Khoảng cách giữa các badge */
//         z-index: 10;
//     }
//
//     .badge {
//         padding: 0.25rem 0.6rem;
//         border-radius: 0.25rem;
//         font-size: 0.7rem;
//         font-weight: 700;
//         color: #fff;
//         display: inline-flex; /* Đảm bảo chỉ chiếm đủ không gian nội dung */
//         align-items: center;
//         justify-content: center;
//     }
//
//     .badge.online-exclusive {
//         background: none;
//         padding: 0;
//         img {
//             width: 60px; /* Kích thước ảnh badge */
//             height: auto;
//         }
//     }
//
//     .badge.new-arrival {
//         background-color: #6a0dad; /* Màu tím */
//     }
//
//     .badge.sale {
//         background-color: #e74c3c; /* Màu đỏ */
//     }
//
//     .image-container {
//         position: relative;
//         width: 100%;
//         height: 200px;
//         overflow: hidden;
//         border-top-left-radius: 0.5rem;
//         border-top-right-radius: 0.5rem;
//     }
//
//     .product-image {
//         width: 100%;
//         height: 100%;
//         object-fit: cover;
//     }
//
//     .product-image.placeholder {
//         background-color: #f0f0f0;
//     }
//
//     .wishlist-icon {
//         position: absolute;
//         top: 0.75rem;
//         right: 0.75rem;
//         background-color: rgba(255, 255, 255, 0.8);
//         border-radius: 50%;
//         padding: 0.4rem;
//         cursor: pointer;
//         z-index: 10;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Thêm bóng đổ nhỏ */
//
//         svg {
//             width: 18px;
//             height: 18px;
//             color: #777;
//         }
//         &:hover svg {
//             color: #e74c3c;
//         }
//     }
//
//     .content {
//         padding: 1rem;
//         display: flex;
//         flex-direction: column;
//         height: auto;
//     }
//
//     .product-brand {
//         font-size: 0.75rem;
//         color: #777;
//         text-transform: uppercase;
//         margin-bottom: 0.25rem;
//     }
//
//     .title-link {
//         text-decoration: none;
//         color: inherit;
//     }
//
//     .product-name {
//         font-size: 0.95rem;
//         font-weight: 600;
//         line-height: 1.3;
//         display: block;
//         margin-bottom: 0.5rem;
//         color: #333;
//         min-height: 2.6em;
//         overflow: hidden;
//         text-overflow: ellipsis;
//         display: -webkit-box;
//         -webkit-line-clamp: 2;
//         -webkit-box-orient: vertical;
//
//         &:hover {
//             text-decoration: underline;
//             text-decoration-color: #3182ce;
//         }
//     }
//
//     .price-info {
//         display: flex;
//         align-items: center;
//         gap: 0.5rem;
//         margin-top: auto;
//     }
//
//     .original-price {
//         font-size: 0.8rem;
//         color: #999;
//         text-decoration: line-through;
//     }
//
//     .current-price {
//         font-weight: 700;
//         color: #e74c3c;
//         font-size: 1rem;
//     }
//
//     .sale-percentage {
//         background-color: #e74c3c;
//         color: #fff;
//         padding: 0.1rem 0.4rem;
//         border-radius: 0.25rem;
//         font-size: 0.7rem;
//         font-weight: 600;
//     }
//
//     .pagination {
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         gap: 0.5rem;
//         margin-top: 2rem;
//         padding-top: 1rem;
//         border-top: 1px solid #eee;
//     }
//
//     .pagination-button {
//         background-color: #fff;
//         border: 1px solid #ddd;
//         border-radius: 0.25rem;
//         padding: 0.6rem 1rem;
//         cursor: pointer;
//         font-size: 0.9rem;
//         color: #555;
//         transition: background-color 0.2s ease, border-color 0.2s ease;
//
//         &:hover:not(:disabled),
//         &.active {
//             background-color: #3182ce;
//             color: #fff;
//             border-color: #3182ce;
//         }
//
//         &:disabled {
//             opacity: 0.6;
//             cursor: not-allowed;
//         }
//     }
//
//     .pagination-ellipsis {
//         padding: 0.6rem 0.5rem;
//         color: #777;
//     }
//
//     .loading-container, .error-container {
//         text-align: center;
//         font-size: 1.2rem;
//         color: #666;
//         margin-top: 50px;
//         flex-grow: 1;
//     }
//
//     @media (max-width: 992px) {
//         .main-content {
//             flex-direction: column;
//         }
//
//         .sidebar {
//             width: 100%;
//             margin-bottom: 1.5rem;
//         }
//
//         .product-grid {
//             grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
//         }
//     }
//
//     @media (max-width: 768px) {
//         .page-header {
//             flex-direction: column;
//             align-items: flex-start;
//             gap: 1rem;
//         }
//     }
// `;


// import React, { useEffect, useState } from 'react';
// import styled from 'styled-components';
// import Link from 'next/link';
// import {CldImage} from "next-cloudinary";
// import Image from "next/image";
//
// interface Product {
//   productId: number;
//   productName: string;
//   description: string;
//   purchases: number;
//   createdAt: string;
//   updatedAt: string;
//   categoryId: number;
//   categoryName: string;
//   brandId: number;
//   brandName: string;
//   brandInfo: string;
//   logoPublicId: string;
//   minPrice: number | null;
//   totalStock: number | null;
//   thumbnail: string | null;
//   activePromotions: string | null;
//   isActive: boolean;
// }
//
// interface PageInfo {
//   size: number;
//   number: number;
//   totalElements: number;
//   totalPages: number;
// }
//
// interface ApiResponseData {
//   content: Product[];
//   page: PageInfo;
// }
//
// interface ApiResponse {
//   timestamp: string;
//   status: number;
//   message: string;
//   data: ApiResponseData;
// }
//
//
// const ProductList = () => {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await fetch('http://localhost:8080/api/products');
//         if (!response.ok) {
//           throw new Error('Failed to fetch products');
//         }
//         const data: ApiResponse = await response.json();
//         if (data.status === 200 && data.data && data.data.content) {
//           // Chỉ hiển thị sản phẩm active
//           const activeProducts = data.data.content.filter(product => product.isActive);
//           setProducts(activeProducts);
//         } else {
//           throw new Error(data.message || 'Failed to fetch products');
//         }
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'An unknown error occurred');
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchProducts();
//   }, []);
//
//   if (loading) {
//     return <div>Loading products...</div>;
//   }
//
//   if (error) {
//     return <div>Error: {error}</div>;
//   }
//
//   // Format giá tiền
//   const formatPrice = (price: number | null) => {
//     if (price === null) return 'Liên hệ';
//     return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
//   };
//   return (
//       <StyledWrapper>
//         {/*<h2 className="section-title">Our Products</h2>*/}
//         <div className="full-width-banner-wrapper"> {/* Add this wrapper */}
//           <Image
//               src="/images/img_2.png"
//               alt="SneakerPeak Logo"
//               layout="responsive" // Best practice for Next.js Image
//               width={1920}
//               height={400}
//           />
//         </div>
//         <h2 className="section-title">Our Products</h2>
//         <div className="product-grid">
//           {products.map((product) => (
//               <div className="card" key={product.productId}>
//                 {product.thumbnail ? (
//                     <div className="image">
//                       <CldImage
//                           width={400}
//                           height={400}
//                           src={product.thumbnail}
//                           alt={product.productName}
//                           className="w-full h-full object-cover"
//                       />
//                     </div>
//                 ) : (
//                     <div className="image placeholder" />
//                 )}
//                 <div className="content">
//                   <Link href={`/products/${product.productId}`}>
//                 <span className="title inline">
//                   {product.productName}
//                 </span>
//                   </Link>
//                   <p className="price">{formatPrice(product.minPrice)}</p>
//                   <div className="desc">
//                     <div className="brand-info">
//                       <div className="brand-logo">
//                         <CldImage
//                             width={30}
//                             height={30}
//                             src={product.logoPublicId}
//                             alt={`${product.brandName} logo`}
//                             className="object-contain" // Giữ object-contain cho logo nhỏ
//                         />
//                       </div>
//                       <span> {product.brandName} <div className="category-info">{product.categoryName}</div></span>
//                     </div>
//                   </div>
//                   <div className="stats">
//                     <span className="stock">Stock: {product.totalStock || 'N/A'}</span>
//                     <span className="purchases">Sold: {product.purchases}</span>
//                   </div>
//                   <Link className="title text-right" href={`/products/${product.productId}`}>
//                     View Details
//                   </Link>
//                 </div>
//               </div>
//           ))}
//         </div>
//       </StyledWrapper>
//   );
// };
//
<<<<<<< Updated upstream
// const StyledWrapper = styled.div`
//   .section-title {
//     font-size: 1.5rem;
//     font-weight: 600;
//     margin-bottom: 1.5rem;
//     text-align: center;
//   }
//
//   .product-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//     gap: 1.5rem;
//     margin: 0 auto;
//     max-width: 1200px;
//   }
//
//   .card {
//     max-width: 100%;
//     border-radius: 0.5rem;
//     background-color: #fff;
//     box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
//     border: 1px solid transparent;
//     transition: transform 0.3s ease, box-shadow 0.3s ease;
//   }
//
//   .card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
//   }
//
//   .card a {
//     text-decoration: none
//   }
//
//   .content {
//     padding: 1.1rem;
//   }
//
//   .image {
//     position: relative;
//     width: 100%;
//     height: 220px;
//     border-top-left-radius: 0.5rem;
//     border-top-right-radius: 0.5rem;
//     overflow: hidden;
//   }
//
//   .image.placeholder {
//     background-color: rgb(255, 239, 205);
//   }
//
//   .title {
//     color: #111827;
//     font-size: 1.125rem;
//     line-height: 1.75rem;
//     font-weight: 600;
//     display: block;
//     margin-bottom: 0.5rem;
//   }
//
//   .price {
//     font-weight: 600;
//     color: #ef4444;
//     font-size: 1rem;
//     margin-bottom: 0.5rem;
//   }
//
//   .desc {
//     margin-top: 0.5rem;
//     color: #6B7280;
//     font-size: 0.875rem;
//     line-height: 1.25rem;
//   }
//
//   .category-info {
//     margin-bottom: 0.5rem;
//   }
//
//   .brand-info {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//   }
//
//   .brand-logo {
//     width: 30px;
//     height: 30px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     overflow: hidden;
//     border-radius: 50%;
//     background-color: #f9fafb;
//     border: 1px solid #e5e7eb;
//   }
//
//   .stats {
//     display: flex;
//     justify-content: space-between;
//     margin-top: 0.5rem;
//     font-size: 0.75rem;
//     color: #6B7280;
//   }
//
//   .action {
//     display: inline-flex;
//     margin-top: 1rem;
//     color: #ffffff;
//     font-size: 0.875rem;
//     line-height: 1.25rem;
//     font-weight: 500;
//     align-items: center;
//     gap: 0.25rem;
//     background-color: #2563EB;
//     padding: 4px 8px;
//     border-radius: 4px;
//   }
//
//   .action span {
//     transition: .3s ease;
//   }
//
//   .action:hover span {
//     transform: translateX(4px);
//   }
//   .text-right:hover{
//     text-decoration: underline;
//     text-decoration-color: black;
//   }
//   .title:hover{
//     text-decoration: underline;
//     text-decoration-color: black;
//   }
// `;
//
// export default ProductList;


"use client"; // Đảm bảo đây là Client Component
=======
// export default ProductList;

>>>>>>> Stashed changes

"use client";
import React, { useEffect, useState, useMemo } from 'react';
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
    Input,
    CheckboxGroup,
    Checkbox,
    Select,
    SelectItem,
    RadioGroup,
    Radio,
} from "@heroui/react";
import {
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    MagnifyingGlassIcon,
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
    sizes: number[]; // Product sizes array
}

interface PageInfo {
    size: number;
    number: number;
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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { theme, setTheme } = useTheme();

    // State for filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
<<<<<<< Updated upstream
    const [minPriceFilter, setMinPriceFilter] = useState<string>('');
    const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Để xử lý radio cho category
    // --- Kết thúc State cho các bộ lọc ---

    // Dữ liệu giả định cho các bộ lọc (trong thực tế có thể lấy từ API)
    const brands = ["Nike", "Adidas", "Puma"];
    const colors = ["Trắng", "Đen"]; // Hiện tại chưa dùng đến, có thể thêm vào logic lọc sau
    const sizes = ["39", "40", "41", "42", "43", "44", "45"];
    const materials = ["Canvas", "Vải"]; // Hiện tại chưa dùng đến, có thể thêm vào logic lọc sau
    const categories = ["Running", "Sneaker", "Basketball"]; // Dữ liệu giả định cho category
=======
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<string[]>([]);

    // State for sorting
    const [sortOption, setSortOption] = useState<string>('default');

    // Add state for fetched filter options
    const [fetchedBrands, setFetchedBrands] = useState<string[]>([]);

    // Define price ranges
    const PRICE_RANGES = [
        { key: 'under-600k', label: 'Giá dưới 600.000đ', min: 0, max: 600000 },
        { key: '600k-1m', label: '600.000đ - 1.000.000đ', min: 600000, max: 1000000 },
        { key: '1m-2m', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
        { key: 'over-2m', label: 'Giá trên 2.000.000đ', min: 2000000, max: Infinity },
    ];


    const SIZE_OPTIONS = ["39", "40", "41", "42", "43", "44"];
>>>>>>> Stashed changes

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
<<<<<<< Updated upstream
                const queryParams = new URLSearchParams();
                queryParams.append('page', (page - 1).toString());
                queryParams.append('size', '12');

                // Thêm tham số lọc thương hiệu
                if (selectedBrands.length > 0) {
                    selectedBrands.forEach(brand => queryParams.append('brandName', brand));
                }

                // Thêm tham số lọc kích thước
                if (selectedSizes.length > 0) {
                    selectedSizes.forEach(size => queryParams.append('size', size));
                }

                // Thêm tham số lọc giá
                if (minPriceFilter !== '') {
                    queryParams.append('minPrice', minPriceFilter);
                }
                if (maxPriceFilter !== '') {
                    queryParams.append('maxPrice', maxPriceFilter);
                }

                // Thêm tham số lọc Category (radio button)
                if (selectedCategory) {
                    queryParams.append('categoryName', selectedCategory);
                }

                // Tùy chọn: Thêm tham số sắp xếp (nếu bạn muốn triển khai)
                // const sortOrder = document.getElementById('sort').value;
                // if (sortOrder) {
                //     queryParams.append('sort', sortOrder);
                // }

                const response = await fetch(`http://localhost:8080/api/products?${queryParams.toString()}`);
=======
                // Fetch brands
                const brandsRes = await fetch('http://localhost:8080/api/brands');
                if (!brandsRes.ok) throw new Error('Failed to fetch brands');
                const brandsData = await brandsRes.json();
                if (brandsData.status === 200 && brandsData.data) {
                    setFetchedBrands(brandsData.data);
                } else {
                    console.error('API Error fetching brands:', brandsData.message);
                }

            } catch (err) {
                console.error("Failed to fetch filter options:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8080/api/products');
>>>>>>> Stashed changes
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data: ApiResponse = await response.json();
                if (data.status === 200 && data.data && data.data.content) {
<<<<<<< Updated upstream
                    const activeProducts = data.data.content.filter(product => product.isActive);
                    setProducts(activeProducts);
                    setTotalPages(data.data.page.totalPages); // Cập nhật tổng số trang
=======
                    setProducts(data.data.content);
>>>>>>> Stashed changes
                } else {
                    throw new Error(data.message || 'Failed to fetch products');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

<<<<<<< Updated upstream
        fetchProducts(currentPage);
        // Dependencies cho useEffect
    }, [currentPage, selectedBrands, selectedSizes, minPriceFilter, maxPriceFilter, selectedCategory]);
=======
        fetchProducts();
    }, []);
>>>>>>> Stashed changes

    // Format giá tiền
    const formatPrice = (price: number | null) => {
        if (price === null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

<<<<<<< Updated upstream
    // --- Hàm xử lý sự kiện cho các bộ lọc ---
    const handleCheckboxChange = (filterType: 'brand' | 'size' | 'color' | 'material', value: string, isChecked: boolean) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        if (filterType === 'brand') {
            setSelectedBrands(prev =>
                isChecked ? [...prev, value] : prev.filter(item => item !== value)
            );
        } else if (filterType === 'size') {
            setSelectedSizes(prev =>
                isChecked ? [...prev, value] : prev.filter(item => item !== value)
            );
        }
        // Có thể thêm logic cho 'color' và 'material' nếu cần
    };

    const handleRadioChange = (filterType: 'category', value: string) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        if (filterType === 'category') {
            setSelectedCategory(value);
        }
    };

    const handlePriceInputChange = (type: 'min' | 'max', event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentPage(1); // Reset về trang 1 khi áp dụng bộ lọc mới
        const value = event.target.value;
        if (type === 'min') {
            setMinPriceFilter(value);
        } else {
            setMaxPriceFilter(value);
        }
    };
    // --- Kết thúc Hàm xử lý sự kiện cho các bộ lọc ---

    // Hàm render phần bộ lọc
    const renderFilterSection = (
        title: string,
        items: string[],
        type: 'checkbox' | 'radio',
        selectedValues: string[] | string | null, // Có thể là mảng hoặc string
        handler: (value: string, isChecked?: boolean) => void // Handler có thể có isChecked hoặc không
    ) => (
        <div className="filter-section">
            <h3 className="filter-title">{title}</h3>
            <div className="filter-options">
                {items.map((item, index) => (
                    <label key={index} className="filter-option">
                        <input
                            type={type}
                            name={title.toLowerCase().replace(/\s/g, '-')}
                            value={item}
                            // Logic kiểm tra checked cho cả checkbox và radio
                            checked={
                                type === 'checkbox'
                                    ? (selectedValues as string[]).includes(item)
                                    : (selectedValues as string) === item
                            }
                            onChange={(e) =>
                                type === 'checkbox'
                                    ? handler(item, e.target.checked)
                                    : handler(item)
                            }
                        />
                        <span className="ml-2">{item}</span>
                    </label>
                ))}
            </div>
        </div>
    );
=======
    const getStockStatus = (stock: number | null) => {
        if (!stock || stock === 0) return { color: 'danger' as const, text: 'Hết hàng' };
        if (stock < 10) return { color: 'warning' as const, text: 'Sắp hết' };
        return { color: 'success' as const, text: 'Còn hàng' };
    };

    const displayedProducts = useMemo(() => {
        let currentProducts = products.filter(product => {
            const matchesSearchTerm = product.productName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);

            const matchesPriceRange = priceRange.length === 0 || priceRange.some(rangeKey => {
                const range = PRICE_RANGES.find(r => r.key === rangeKey);
                if (!range || product.minPrice === null) return false;
                return product.minPrice >= range.min && product.minPrice <= range.max;
            });
>>>>>>> Stashed changes

            const productSizes = product.sizes || [];
            const matchesSizes = selectedSizes.length === 0 ||
                selectedSizes.some(size => productSizes.includes(parseInt(size)));

            return matchesSearchTerm && matchesBrands && matchesPriceRange && matchesSizes;
        });

        // Apply sorting
        switch (sortOption) {
            case 'price-asc':
                currentProducts.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
                break;
            case 'price-desc':
                currentProducts.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity));
                break;
            case 'name-asc':
                currentProducts.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'name-desc':
                currentProducts.sort((a, b) => b.productName.localeCompare(a.productName));
                break;
            case 'default':
            default:
                break;
        }

        return currentProducts;
    }, [products, searchTerm, selectedBrands, priceRange, selectedSizes, sortOption]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-row gap-8"> {/* Always flex-row */}
                {/* Skeleton for Left Sidebar */}
                {/* Takes 1/2 width on small screens, 1/5 on medium and up */}
                <div className="w-1/2 md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
                    <Skeleton className="w-1/4 h-6 rounded-lg mb-4" /> {/* Search input */}
                    <Skeleton className="w-full h-24 rounded-lg mb-4" /> {/* Price filter */}
                    <Skeleton className="w-1/4 h-6 rounded-lg mb-4" /> {/* Size filter title */}
                    <Skeleton className="w-full h-32 rounded-lg" /> {/* Size filter checkboxes */}
                    <Skeleton className="w-1/4 h-6 rounded-lg mb-4" /> {/* Brand filter title */}
                    <Skeleton className="w-full h-32 rounded-lg" /> {/* Brand filter checkboxes */}
                </div>
                {/* Skeleton for Right Content */}
                {/* Takes 1/2 width on small screens, fluid on medium and up */}
                <div className="w-1/2 md:flex-1">
                    {/* Skeleton for Sort dropdown */}
                    <div className="mb-6 flex justify-end">
                        <Skeleton className="w-64 h-10 rounded-lg" />
                    </div>
                    {/* Adjusted grid columns for responsiveness */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Card key={index} className="w-full space-y-5 p-4" radius="lg">
                                <Skeleton className="rounded-lg">
                                    <div className="h-40 rounded-lg bg-default-300"></div> {/* Adjusted height */}
                                </Skeleton>
                                <div className="space-y-3">
                                    <Skeleton className="w-4/5 h-4 rounded-lg" />
                                    <Skeleton className="w-3/5 h-4 rounded-lg" />
                                    <Skeleton className="w-2/5 h-4 rounded-lg" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

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
<<<<<<< Updated upstream
        <StyledWrapper>
            <div className="full-width-banner-wrapper">
                <Image
                    src="/images/banner2.png"
                    alt="SneakerPeak Logo"
                    layout="responsive"
                    width={1000}
                    height={550}
                />
            </div>
            {/* Thêm phần tiêu đề trang và sắp xếp */}
            <div className="page-header">
                <div className="sort-by">
                    <label htmlFor="sort">Sắp xếp:</label>
                    <select id="sort" className="sort-select">
                        <option value="price-asc">Giá tăng dần</option>
                        <option value="price-desc">Giá giảm dần</option>
                    </select>
                </div>
            </div>

            <div className="main-content">
                <aside className="sidebar">
                    {/* Filter Thương hiệu */}
                    {renderFilterSection("THƯƠNG HIỆU", brands, 'checkbox', selectedBrands, (value, isChecked) => handleCheckboxChange('brand', value, isChecked!))}

                    {/* Filter Kích thước */}
                    {renderFilterSection("KÍCH THƯỚC", sizes, 'checkbox', selectedSizes, (value, isChecked) => handleCheckboxChange('size', value, isChecked!))}

                    {/* Filter Chất liệu (có thể bỏ qua hoặc thêm logic) */}
                    {/* {renderFilterSection("CHẤT LIỆU", materials, 'checkbox', selectedMaterials, (value, isChecked) => handleCheckboxChange('material', value, isChecked!))} */}

                    {/* Filter Giá */}
                    <div className="filter-section">
                        <h3 className="filter-title">GIÁ</h3>
                        <div className="filter-options filter-price">
                            <input
                                type="number"
                                placeholder="Giá từ"
                                value={minPriceFilter}
                                onChange={(e) => handlePriceInputChange('min', e)}
                            />
                            <input
                                type="number"
                                placeholder="Giá đến"
                                value={maxPriceFilter}
                                onChange={(e) => handlePriceInputChange('max', e)}
                            />
                        </div>
=======
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* The main flex container. Always flex-row to keep sidebar and products side-by-side. */}
            <div className="flex flex-row gap-8">
                {/* Left Sidebar for Filters */}
                {/* Takes 1/2 width on small screens, 1/5 width on medium and up. */}
                <div className="w-1/2 md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
                    {/* Search Input */}
                    <div className="mb-4">
                        <Input
                            placeholder="Nhập tên giày..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            startContent={
                                <MagnifyingGlassIcon className="w-5 h-5 text-default-400" />
                            }
                            isClearable
                            onClear={() => setSearchTerm('')}
                            className="w-full"
                        />
>>>>>>> Stashed changes
                    </div>

                    {/* Price Range Filter */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-default-800">Mức giá</h3>
                        <CheckboxGroup
                            value={priceRange}
                            onValueChange={setPriceRange}
                            orientation="vertical"
                        >
                            {PRICE_RANGES.map((range) => (
                                <Checkbox key={range.key} value={range.key}>
                                    {range.label}
                                </Checkbox>
                            ))}
                        </CheckboxGroup>
                    </div>

                    <Divider className="my-2" />

                    {/* Size Filter - Compacted */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-default-800">Kích thước</h3>
                        <CheckboxGroup
                            value={selectedSizes}
                            onValueChange={setSelectedSizes}
                            orientation="horizontal"
                            className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                        >
                            {SIZE_OPTIONS.map((size) => (
                                <Checkbox key={size} value={size} className="min-w-[40px] text-center">
                                    {size}
                                </Checkbox>
                            ))}
                        </CheckboxGroup>
                    </div>

                    <Divider className="my-2" />

                    {/* Brand Filter */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-default-800">Thương hiệu</h3>
                        {fetchedBrands.length > 0 ? (
                            <CheckboxGroup
                                value={selectedBrands}
                                onValueChange={setSelectedBrands}
                                orientation="vertical"
                                className="max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                            >
                                {fetchedBrands.map((brand) => (
                                    <Checkbox key={brand} value={brand}>
                                        {brand}
                                    </Checkbox>
                                ))}
                            </CheckboxGroup>
                        ) : (
                            <p className="text-default-500 text-sm">Đang tải thương hiệu...</p>
                        )}
                    </div>
                </div>

                {/* Right Main Content for Products */}
                {/* Takes 1/2 width on small screens, takes remaining flexible space on medium and up. */}
                <div className="w-1/2 md:flex-1">
                    {/* Sort Section */}
                    <div className="mb-8 flex justify-end">
                        <Select
                            placeholder="Mặc định"
                            selectedKeys={[sortOption]}
                            onSelectionChange={(keys) => {
                                // @ts-ignore
                                setSortOption(Array.from(keys).join(','));
                            }}
                            className="swal2-full"
                        >
                            <SelectItem key="default">Mặc định</SelectItem>
                            <SelectItem key="price-asc">Giá: Thấp đến Cao</SelectItem>
                            <SelectItem key="price-desc">Giá: Cao đến Thấp</SelectItem>
                            <SelectItem key="name-asc">Tên: A-Z</SelectItem>
                            <SelectItem key="name-desc">Tên: Z-A</SelectItem>
                        </Select>
                    </div>

                    {/* Products Grid - Adjusted responsive columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedProducts.map((product) => {
                            const stockStatus = getStockStatus(product.totalStock);

                            return (
                                <Card
                                    key={product.productId}
                                    className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border border-default-200"
                                    isPressable
                                >
                                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start relative">
                                        {/* Product Image */}
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-default-100 flex items-center justify-center">
                                            {product.thumbnail ? (
                                                <CldImage
                                                    width={300}
                                                    height={300}
                                                    src={product.thumbnail}
                                                    alt={product.productName}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-default-400">
                                                    <BuildingStorefrontIcon className="w-16 h-16" />
                                                </div>
                                            )}
                                            {/* Stock Badge (top right) */}
                                            <Badge
                                                color={stockStatus.color}
                                                className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md"
                                                size="sm"
                                            >
                                                {stockStatus.text}
                                            </Badge>
                                            {/* NEW Badge (top left - generic for now) */}
                                            <Badge
                                                color="primary"
                                                className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-md"
                                                size="sm"
                                            >
                                                NEW
                                            </Badge>
                                        </div>
<<<<<<< Updated upstream
                                    )}
                                    {(product.activePromotions && product.activePromotions.includes("NEW_ARRIVAL")) && (
                                        <div className="badge new-arrival">NEW</div>
                                    )}
                                    {(product.activePromotions && product.activePromotions.includes("SALE")) && (
                                        <div className="badge sale">SALE</div>
                                    )}
                                </div>

                                <div className="image-container">
                                    {product.thumbnail ? (
                                        <CldImage
                                            width={400}
                                            height={400}
                                            src={product.thumbnail}
                                            alt={product.productName}
                                            className="product-image"
                                        />
                                    ) : (
                                        <div className="product-image placeholder" />
                                    )}

                                </div>

                                <div className="content">
                                    <span className="product-brand">{product.brandName}</span>
                                    <Link href={`/products/${product.productId}`} className="title-link">
                                        <span className="product-name">
                                            {product.productName}
                                        </span>
                                    </Link>
                                    <div className="price-info">
                                        {product.activePromotions && product.activePromotions.includes("SALE") && (
                                            <>
                                                <p className="original-price">{formatPrice(product.minPrice ? product.minPrice * 1.28 : null)}</p>
                                                <p className="sale-percentage">-28%</p>
                                            </>
                                        )}
                                        <p className="current-price">{formatPrice(product.minPrice)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {renderPagination()}
=======
                                    </CardHeader>

                                    <CardBody className="px-4 py-3">
                                        {/* Product Name */}
                                        <Link href={`/products/${product.productId}`}>
                                            <h4 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors cursor-pointer h-12">
                                                {product.productName}
                                            </h4>
                                        </Link>

                                        {/* Price */}
                                        <div className="flex items-center gap-1 my-2">
                                            <span className="text-lg font-bold text-success-600">
                                                {formatPrice(product.minPrice)}
                                            </span>
                                        </div>

                                        {/* Brand */}
                                        <div className="text-sm text-default-500 mb-2">
                                            {product.brandName}
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {displayedProducts.length === 0 && (
                        <Card className="max-w-md mx-auto mt-12">
                            <CardBody className="text-center py-12">
                                <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Không có sản phẩm nào phù hợp</h3>
                                <p className="text-default-500">
                                    Hãy thử điều chỉnh bộ lọc của bạn hoặc kiểm tra lại tên sản phẩm.
                                </p>
                            </CardBody>
                        </Card>
                    )}
>>>>>>> Stashed changes
                </div>
            </div>
            {/* Custom CSS for scrollbar (if needed, otherwise define in global.css) */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px; /* Width of the scrollbar */
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1; /* Color of the track */
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #888; /* Color of the scroll thumb */
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555; /* Color on hover */
                }
            `}</style>
        </div>
    );
};

<<<<<<< Updated upstream
const StyledWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Arial, sans-serif;
  color: #333;

  .full-width-banner-wrapper {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    text-align: center;
    display: none; /* Ẩn tiêu đề này vì đã có Page Header */
  }

  .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
  }

  .page-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
  }

  .sort-by {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #555;
  }

  .sort-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ccc;
      border-radius: 0.25rem;
      background-color: #fff;
      cursor: pointer;
      font-size: 0.9rem;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 0.8rem;
  }

  .main-content {
      display: flex;
      gap: 2rem;
  }

  .sidebar {
      width: 280px;
      flex-shrink: 0;
      background-color: #f7f7f7;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .filter-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;

      &:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
      }
  }

  .filter-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      margin-bottom: 1rem;
      letter-spacing: 0.05em;
  }

  .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
  }

  .filter-options.filter-price {
      flex-direction: row;
      gap: 0.75rem;
      input {
          width: 50%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          font-size: 0.9rem;
      }
  }

  .filter-option {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      color: #555;
      cursor: pointer;

      input[type="checkbox"],
      input[type="radio"] {
          margin-right: 0.5rem;
          accent-color: #3182ce;
          width: 1rem;
          height: 1rem;
      }
  }

  .product-display-area {
      flex-grow: 1;
  }

  .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
  }

  .card {
      background-color: #fff;
      border-radius: 0.5rem;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
      position: relative;
  }

  .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
  }

  .badge-container {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      z-index: 10;
  }

  .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
  }

  .badge.online-exclusive {
      background: none;
      padding: 0;
      img {
          width: 60px;
          height: auto;
      }
  }

  .badge.new-arrival {
      background-color: #6a0dad;
  }

  .badge.sale {
      background-color: #e74c3c;
  }

  .image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
  }

  .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
  }

  .product-image.placeholder {
      background-color: #f0f0f0;
  }

  .wishlist-icon {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      padding: 0.4rem;
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      svg {
          width: 18px;
          height: 18px;
          color: #777;
      }
      &:hover svg {
          color: #e74c3c;
      }
  }

  .content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      height: auto;
  }

  .product-brand {
      font-size: 0.75rem;
      color: #777;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
  }

  .title-link {
      text-decoration: none;
      color: inherit;
  }

  .product-name {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      min-height: 2.6em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;

      &:hover {
          text-decoration: underline;
          text-decoration-color: #3182ce;
      }
  }

  .price-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
  }

  .original-price {
      font-size: 0.8rem;
      color: #999;
      text-decoration: line-through;
  }

  .current-price {
      font-weight: 700;
      color: #e74c3c;
      font-size: 1rem;
  }

  .sale-percentage {
      background-color: #e74c3c;
      color: #fff;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 600;
  }

  .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
  }

  .pagination-button {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 0.25rem;
      padding: 0.6rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #555;
      transition: background-color 0.2s ease, border-color 0.2s ease;

      &:hover:not(:disabled),
      &.active {
          background-color: #3182ce;
          color: #fff;
          border-color: #3182ce;
      }

      &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
      }
  }

  .pagination-ellipsis {
      padding: 0.6rem 0.5rem;
      color: #777;
  }

  .loading-container, .error-container {
      text-align: center;
      font-size: 1.2rem;
      color: #666;
      margin-top: 50px;
      flex-grow: 1;
  }

  @media (max-width: 992px) {
      .main-content {
          flex-direction: column;
      }

      .sidebar {
          width: 100%;
          margin-bottom: 1.5rem;
      }

      .product-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }
  }

  @media (max-width: 768px) {
      .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }
  }
`;

=======
>>>>>>> Stashed changes
export default ProductList;