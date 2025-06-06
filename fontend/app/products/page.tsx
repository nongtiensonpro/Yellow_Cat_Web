// "use client";
// import React, { useEffect, useState, useMemo } from 'react';
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
//     Input,
//     CheckboxGroup,
//     Checkbox,
//     Select,
//     SelectItem,
//     RadioGroup,
//     Radio,
// } from "@heroui/react";
// import {
//     CurrencyDollarIcon,
//     BuildingStorefrontIcon,
//     MagnifyingGlassIcon,
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
//     sizes: number[]; // Product sizes array
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
//     // State for filters
//     const [searchTerm, setSearchTerm] = useState<string>('');
//     const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
//     const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
//     const [priceRange, setPriceRange] = useState<string[]>([]);
//
//     // State for sorting
//     const [sortOption, setSortOption] = useState<string>('default');
//
//     // Add state for fetched filter options
//     const [fetchedBrands, setFetchedBrands] = useState<string[]>([]);
//
//     // Define price ranges
//     const PRICE_RANGES = [
//         { key: 'under-600k', label: 'Giá dưới 600.000đ', min: 0, max: 600000 },
//         { key: '600k-1m', label: '600.000đ - 1.000.000đ', min: 600000, max: 1000000 },
//         { key: '1m-2m', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
//         { key: 'over-2m', label: 'Giá trên 2.000.000đ', min: 2000000, max: Infinity },
//     ];
//
//
//     const SIZE_OPTIONS = ["39", "40", "41", "42", "43", "44"];
//
//     useEffect(() => {
//         const fetchFilterOptions = async () => {
//             try {
//                 // Fetch brands
//                 const brandsRes = await fetch('http://localhost:8080/api/brands');
//                 if (!brandsRes.ok) throw new Error('Failed to fetch brands');
//                 const brandsData = await brandsRes.json();
//                 if (brandsData.status === 200 && brandsData.data) {
//                     setFetchedBrands(brandsData.data);
//                 } else {
//                     console.error('API Error fetching brands:', brandsData.message);
//                 }
//
//             } catch (err) {
//                 console.error("Failed to fetch filter options:", err);
//             }
//         };
//         fetchFilterOptions();
//     }, []);
//
//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 setLoading(true);
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
//     const displayedProducts = useMemo(() => {
//         let currentProducts = products.filter(product => {
//             const matchesSearchTerm = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
//
//             const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);
//
//             const matchesPriceRange = priceRange.length === 0 || priceRange.some(rangeKey => {
//                 const range = PRICE_RANGES.find(r => r.key === rangeKey);
//                 if (!range || product.minPrice === null) return false;
//                 return product.minPrice >= range.min && product.minPrice <= range.max;
//             });
//
//             const productSizes = product.sizes || [];
//             const matchesSizes = selectedSizes.length === 0 ||
//                 selectedSizes.some(size => productSizes.includes(parseInt(size)));
//
//             return matchesSearchTerm && matchesBrands && matchesPriceRange && matchesSizes;
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
//                 break;
//         }
//
//         return currentProducts;
//     }, [products, searchTerm, selectedBrands, priceRange, selectedSizes, sortOption]);
//
//     if (loading) {
//         return (
//             <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row gap-8"> {/* Changed to flex-col on small, flex-row on md+ */}
//                 {/* Skeleton for Left Sidebar */}
//                 <div className="w-full md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
//                     <Skeleton className="w-3/4 h-8 rounded-lg mb-4" /> {/* Search input */}
//                     <Skeleton className="w-full h-24 rounded-lg mb-4" /> {/* Price filter */}
//                     <Skeleton className="w-1/2 h-6 rounded-lg mb-4" /> {/* Size filter title */}
//                     <Skeleton className="w-full h-32 rounded-lg" /> {/* Size filter checkboxes (vertical) */}
//                     <Skeleton className="w-1/2 h-6 rounded-lg mb-4" /> {/* Brand filter title */}
//                     <Skeleton className="w-full h-12 rounded-lg" /> {/* Brand filter select */}
//                 </div>
//                 {/* Skeleton for Right Content */}
//                 <div className="w-full md:flex-1">
//                     {/* Skeleton for Sort dropdown */}
//                     <div className="mb-6 flex justify-end">
//                         <Skeleton className="w-64 h-10 rounded-lg" />
//                     </div>
//                     {/* Adjusted grid columns for responsiveness */}
//                     <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                         {Array.from({ length: 8 }).map((_, index) => (
//                             <Card key={index} className="w-full space-y-5 p-4" radius="lg">
//                                 <Skeleton className="rounded-lg">
//                                     <div className="h-40 rounded-lg bg-default-300"></div> {/* Adjusted height */}
//                                 </Skeleton>
//                                 <div className="space-y-3">
//                                     <Skeleton className="w-4/5 h-4 rounded-lg" />
//                                     <Skeleton className="w-3/5 h-4 rounded-lg" />
//                                     <Skeleton className="w-2/5 h-4 rounded-lg" />
//                                 </div>
//                             </Card>
//                         ))}
//                     </div>
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
//             {/* The main flex container. Changed to flex-col on small, flex-row on md+ */}
//             <div className="flex flex-col md:flex-row gap-8">
//                 {/* Left Sidebar for Filters */}
//                 <div className="w-full md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
//                     {/* Search Input */}
//                     <div className="mb-4">
//                         <Input
//                             placeholder="Nhập tên giày..."
//                             value={searchTerm}
//                             onValueChange={setSearchTerm}
//                             startContent={
//                                 <MagnifyingGlassIcon className="w-5 h-5 text-default-400" />
//                             }
//                             isClearable
//                             onClear={() => setSearchTerm('')}
//                             className="w-full"
//                         />
//                     </div>
//
//                     {/* Price Range Filter */}
//                     <div>
//                         <h3 className="text-lg font-semibold mb-3 text-default-800">Mức giá</h3>
//                         <CheckboxGroup
//                             value={priceRange}
//                             onValueChange={setPriceRange}
//                             orientation="vertical"
//                         >
//                             {PRICE_RANGES.map((range) => (
//                                 <Checkbox key={range.key} value={range.key}>
//                                     {range.label}
//                                 </Checkbox>
//                             ))}
//                         </CheckboxGroup>
//                     </div>
//
//                     <Divider className="my-2" />
//
//                     {/* Size Filter - Vertical CheckboxGroup */}
//                     <div>
//                         <h3 className="text-lg font-semibold mb-3 text-default-800">Kích thước</h3>
//                         <CheckboxGroup
//                             value={selectedSizes}
//                             onValueChange={setSelectedSizes}
//                             orientation="vertical" // Changed to vertical
//                             className="max-h-60 overflow-y-auto pr-2 custom-scrollbar"
//                         >
//                             {SIZE_OPTIONS.map((size) => (
//                                 <Checkbox key={size} value={size}>
//                                     {size}
//                                 </Checkbox>
//                             ))}
//                         </CheckboxGroup>
//                     </div>
//
//                     <Divider className="my-2" />
//
//                     {/* Brand Filter - Enhanced with Select component (remains the same as before) */}
//                     <div>
//                         <h3 className="text-lg font-semibold mb-3 text-default-800">Thương hiệu</h3>
//                         {fetchedBrands.length > 0 ? (
//                             <Select
//                                 placeholder="Chọn thương hiệu"
//                                 selectionMode="multiple"
//                                 selectedKeys={new Set(selectedBrands)}
//                                 onSelectionChange={(keys) => {
//                                     // @ts-ignore
//                                     setSelectedBrands(Array.from(keys));
//                                 }}
//                                 className="w-full"
//                                 isMultiline={true}
//                                 renderValue={(items) => {
//                                     if (items.length === 0) {
//                                         return "Chọn thương hiệu";
//                                     }
//                                     if (items.length === fetchedBrands.length) {
//                                         return "Tất cả thương hiệu";
//                                     }
//                                     return (
//                                         <div className="flex flex-wrap gap-1">
//                                             {items.map((item) => (
//                                                 <Chip key={item.key} size="sm" variant="flat">
//                                                     {item.textValue}
//                                                 </Chip>
//                                             ))}
//                                         </div>
//                                     );
//                                 }}
//                             >
//                                 {fetchedBrands.map((brand) => (
//                                     // <SelectItem key={brand} value={brand}>
//                                     <SelectItem key={brand} >
//                                         {brand}
//                                     </SelectItem>
//                                 ))}
//                             </Select>
//                         ) : (
//                             <p className="text-default-500 text-sm">Đang tải thương hiệu...</p>
//                         )}
//                     </div>
//                 </div>
//
//                 {/* Right Main Content for Products */}
//                 <div className="w-full md:flex-1">
//                     {/* Sort Section */}
//                     <div className="mb-6 flex justify-end">
//                         <Select
//                             placeholder="Mặc định"
//                             selectedKeys={[sortOption]}
//                             onSelectionChange={(keys) => {
//                                 // @ts-ignore
//                                 setSortOption(Array.from(keys).join(','));
//                             }}
//                             className="full"
//                         >
//                             <SelectItem key="default">Mặc định</SelectItem>
//                             <SelectItem key="price-asc">Giá: Thấp đến Cao</SelectItem>
//                             <SelectItem key="price-desc">Giá: Cao đến Thấp</SelectItem>
//                             <SelectItem key="name-asc">Tên: A-Z</SelectItem>
//                             <SelectItem key="name-desc">Tên: Z-A</SelectItem>
//                         </Select>
//                     </div>
//
//                     {/* Products Grid - Adjusted responsive columns */}
//                     <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                         {displayedProducts.map((product) => {
//                             const stockStatus = getStockStatus(product.totalStock);
//
//                             return (
//                                 <Card
//                                     key={product.productId}
//                                     className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border border-default-200"
//                                     isPressable
//                                 >
//                                     <CardHeader className="pb-0 pt-2 px-4 flex-col items-start relative">
//                                         {/* Product Image */}
//                                         <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-default-100 flex items-center justify-center">
//                                             {product.thumbnail ? (
//                                                 <CldImage
//                                                     width={300}
//                                                     height={300}
//                                                     src={product.thumbnail}
//                                                     alt={product.productName}
//                                                     className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
//                                                 />
//                                             ) : (
//                                                 <div className="w-full h-full flex items-center justify-center text-default-400">
//                                                     <BuildingStorefrontIcon className="w-16 h-16" />
//                                                 </div>
//                                             )}
//                                             {/* Stock Badge (top right) */}
//                                             <Badge
//                                                 color={stockStatus.color}
//                                                 className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-md"
//                                                 size="sm"
//                                             >
//                                                 {stockStatus.text}
//                                             </Badge>
//                                             {/* NEW Badge (top left - generic for now) */}
//                                             <Badge
//                                                 color="primary"
//                                                 className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded-md"
//                                                 size="sm"
//                                             >
//                                                 MỚI
//                                             </Badge>
//                                         </div>
//                                     </CardHeader>
//
//                                     <CardBody className="px-4 py-3">
//                                         {/* Product Name */}
//                                         <Link href={`/products/${product.productId}`}>
//                                             <h4 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors cursor-pointer h-12">
//                                                 {product.productName}
//                                             </h4>
//                                         </Link>
//
//                                         {/* Price */}
//                                         <div className="flex items-center gap-1 my-2">
//                                             <span className="text-lg font-bold text-success-600">
//                                                 {formatPrice(product.minPrice)}
//                                             </span>
//                                         </div>
//
//                                         {/* Brand */}
//                                         <div className="text-sm text-default-500 mb-2">
//                                             {product.brandName}
//                                         </div>
//                                     </CardBody>
//                                 </Card>
//                             );
//                         })}
//                     </div>
//
//                     {/* Empty State */}
//                     {displayedProducts.length === 0 && (
//                         <Card className="max-w-md mx-auto mt-12">
//                             <CardBody className="text-center py-12">
//                                 <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
//                                 <h3 className="text-xl font-semibold mb-2">Không có sản phẩm nào phù hợp</h3>
//                             </CardBody>
//                         </Card>
//                     )}
//                 </div>
//             </div>
//             {/* Custom CSS for scrollbar (if needed, otherwise define in global.css) */}
//             <style jsx global>{`
//                 .custom-scrollbar::-webkit-scrollbar {
//                     width: 8px; /* Width of the scrollbar */
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-track {
//                     background: #f1f1f1; /* Color of the track */
//                     border-radius: 4px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb {
//                     background: #888; /* Color of the scroll thumb */
//                     border-radius: 4px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//                     background: #555; /* Color on hover */
//                 }
//             `}</style>
//         </div>
//     );
// };
//
// export default ProductList;


"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { CldImage } from "next-cloudinary";
import Image from "next/image"; // Import Image for local assets
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

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
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
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data: ApiResponse = await response.json();
                if (data.status === 200 && data.data && data.data.content) {
                    setProducts(data.data.content);
                } else {
                    throw new Error(data.message || 'Failed to fetch products');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const formatPrice = (price: number | null) => {
        if (price === null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

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
                const range = PRICE_R.find(r => r.key === rangeKey);
                if (!range || product.minPrice === null) return false;
                return product.minPrice >= range.min && product.minPrice <= range.max;
            });

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
            <div className="container mx-auto px-4 py-8 max-w-7xl flex flex-col md:flex-row gap-8">
                {/* Skeleton for Left Sidebar */}
                <div className="w-full md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
                    <Skeleton className="w-3/4 h-8 rounded-lg mb-4" /> {/* Search input */}
                    <Skeleton className="w-full h-24 rounded-lg mb-4" /> {/* Price filter */}
                    <Skeleton className="w-1/2 h-6 rounded-lg mb-4" /> {/* Size filter title */}
                    <Skeleton className="w-full h-32 rounded-lg" /> {/* Size filter checkboxes (vertical) */}
                    <Skeleton className="w-1/2 h-6 rounded-lg mb-4" /> {/* Brand filter title */}
                    <Skeleton className="w-full h-12 rounded-lg" /> {/* Brand filter select */}
                </div>
                {/* Skeleton for Right Content */}
                <div className="w-full md:flex-1">
                    {/* Skeleton for Banner */}
                    <Skeleton className="w-full h-48 rounded-lg mb-8" /> {/* Added banner skeleton */}
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/*<div className="w-1/2 mx-auto mb-8 rounded-lg overflow-hidden shadow-md">*/}
            {/*    <Image*/}
            {/*        src="/images/img_2.png"*/}
            {/*        alt="Product Banner"*/}
            {/*        width={800} // hoặc 600 tùy bạn*/}
            {/*        height={400} // giữ tỷ lệ chuẩn banner nếu cần*/}
            {/*        layout="responsive"*/}
            {/*        objectFit="cover"*/}
            {/*        className="rounded-lg"*/}
            {/*    />*/}
            {/*</div>*/}


            {/* The main flex container. Changed to flex-col on small, flex-row on md+ */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar for Filters */}
                <div className="w-full md:w-1/5 p-6 bg-default-50 rounded-lg shadow-md flex flex-col gap-6">
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

                    {/* Size Filter - Vertical CheckboxGroup */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-default-800">Kích thước</h3>
                        <CheckboxGroup
                            value={selectedSizes}
                            onValueChange={setSelectedSizes}
                            orientation="vertical" // Changed to vertical
                            className="max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                        >
                            {SIZE_OPTIONS.map((size) => (
                                <Checkbox key={size} value={size}>
                                    {size}
                                </Checkbox>
                            ))}
                        </CheckboxGroup>
                    </div>

                    <Divider className="my-2" />

                    {/* Brand Filter - Enhanced with Select component (remains the same as before) */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-default-800">Thương hiệu</h3>
                        {fetchedBrands.length > 0 ? (
                            <Select
                                placeholder="Chọn thương hiệu"
                                selectionMode="multiple"
                                selectedKeys={new Set(selectedBrands)}
                                onSelectionChange={(keys) => {
                                    // @ts-ignore
                                    setSelectedBrands(Array.from(keys));
                                }}
                                className="w-full"
                                isMultiline={true}
                                renderValue={(items) => {
                                    if (items.length === 0) {
                                        return "Chọn thương hiệu";
                                    }
                                    if (items.length === fetchedBrands.length) {
                                        return "Tất cả thương hiệu";
                                    }
                                    return (
                                        <div className="flex flex-wrap gap-1">
                                            {items.map((item) => (
                                                <Chip key={item.key} size="sm" variant="flat">
                                                    {item.textValue}
                                                </Chip>
                                            ))}
                                        </div>
                                    );
                                }}
                            >
                                {fetchedBrands.map((brand) => (
                                    // <SelectItem key={brand} value={brand}>
                                    <SelectItem key={brand} >
                                        {brand}
                                    </SelectItem>
                                ))}
                            </Select>
                        ) : (
                            <p className="text-default-500 text-sm">Đang tải thương hiệu...</p>
                        )}
                    </div>
                </div>

                {/* Right Main Content for Products */}
                <div className="w-full md:flex-1">
                    {/* Sort Section */}
                    <div className="mb-6 flex justify-end">
                        <Select
                            placeholder="Mặc định"
                            selectedKeys={[sortOption]}
                            onSelectionChange={(keys) => {
                                // @ts-ignore
                                setSortOption(Array.from(keys).join(','));
                            }}
                            className="full"
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
                                                MỚI
                                            </Badge>
                                        </div>
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
                            </CardBody>
                        </Card>
                    )}
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

export default ProductList;