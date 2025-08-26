"use client";

import React, {useEffect, useState, useMemo} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {CldImage} from "next-cloudinary";
import {
    Card, CardBody, CardHeader, CardFooter,
    Button, Chip, Divider, Input, CheckboxGroup, Checkbox, Select, SelectItem,
    Accordion, AccordionItem
} from "@heroui/react";
import {
    BuildingStorefrontIcon, MagnifyingGlassIcon, XMarkIcon,
    InboxIcon, StarIcon
} from "@heroicons/react/24/outline";
import {Selection} from "@react-types/shared";

// --- Interfaces & Types ---
interface Brand {
    id: number;
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
    productIds: number[];
}
interface Color {
    id: number;
    name: string;
    tailwindClass: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}
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
    sizes: number[];
    colors: string[];
}
// Kiểu dữ liệu thô trả về từ API sản phẩm
interface ProductApiItem {
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
    sizesStr?: string | null;
    colorsStr?: string | null;
}
interface PageInfo {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
}
interface ApiResponseData<T> {
    content: T[];
    page?: PageInfo;
    totalPages?: number;
}
interface ApiResponse<T> {
    timestamp?: string;
    status: number;
    message: string;
    data: ApiResponseData<T>;
}

// --- Helper Functions ---
const formatPrice = (price: number | null): string => {
    if (price === null) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(price);
};
const getStockStatus = (stock: number | null): {
    color: 'default' | 'danger' | 'warning' | 'success',
    text: string
} => {
    if (stock === null) return {color: 'default' as const, text: 'Kiểm tra'};
    if (stock === 0) return {color: 'danger' as const, text: 'Hết hàng'};
    if (stock < 10) return {color: 'warning' as const, text: 'Sắp hết'};
    return {color: 'success' as const, text: 'Còn hàng'};
};
// Sửa đổi hàm này để xử lý trường hợp giảm 100%
const calculateDiscountPercentage = (originalPrice: number | null, salePrice: number | null | undefined): number | null => {
    // Nếu giá sale là 0 và giá gốc lớn hơn 0, trả về 100%
    if (salePrice === 0 && originalPrice && originalPrice > 0) {
        return 100;
    }
    // Logic ban đầu cho các trường hợp khác
    if (salePrice === null || salePrice === undefined || originalPrice === null || originalPrice === 0 || salePrice >= originalPrice) {
        return null;
    }
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
};

// --- Constants ---
const PRICE_RANGES = [
    {key: 'under-600k', label: 'Dưới 600.000đ', min: 0, max: 599999},
    {key: '600k-1m', label: '600.000đ - 1.000.000đ', min: 600000, max: 1000000},
    {key: '1m-2m', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000},
    {key: 'over-2m', label: 'Trên 2.000.000đ', min: 2000001, max: Infinity},
];
const SIZE_OPTIONS = ["39", "40", "41", "42", "43", "44", "45"];
const SORT_OPTIONS = [
    {key: 'default', label: 'Mới nhất'},
    {key: 'price-asc', label: 'Giá: Thấp đến Cao'},
    {key: 'price-desc', label: 'Giá: Cao đến Thấp'},
    {key: 'name-asc', label: 'Tên: A-Z'},
    {key: 'name-desc', label: 'Tên: Z-A'},
];

// --- ProductCard Component (Redesigned) ---
const ProductCard: React.FC<{ product: Product }> = ({product}) => {
    const stockStatus = getStockStatus(product.totalStock);
    const discountPercentage = calculateDiscountPercentage(product.minPrice, product.minSalePrice);

    return (
        <Card isPressable className="group/card w-full transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
            <Link href={`/products/${product.productId}`} className="w-full">
                <CardHeader className="p-0 relative">
                    <div className="relative w-full aspect-square overflow-hidden rounded-t-lg bg-gray-100 p-4">
                        {product.thumbnail ? (
                            <CldImage
                                width={300}
                                height={300}
                                src={product.thumbnail}
                                alt={product.productName}
                                className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover/card:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-400">
                                <BuildingStorefrontIcon className="w-16 h-16"/>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-default-200 flex-shrink-0">
                            <CldImage width={20} height={20} src={product.logoPublicId} alt={`${product.brandName} logo`} className="w-full h-full object-contain p-0.5"/>
                        </div>
                        <p className="text-sm font-semibold text-default-700">{product.brandName}</p>
                    </div>

                    <h4 className="font-bold text-base text-default-800 line-clamp-2 h-12 leading-6">
                        {product.productName}
                    </h4>

                    <div className="flex items-baseline gap-2 pt-0.5">
                        {product.minSalePrice != null && product.minPrice != null && product.minSalePrice < product.minPrice ? (
                            <>
                                <span className="text-lg font-bold text-danger-500">
                                    {product.minSalePrice === 0 ? 'Miễn phí' : formatPrice(product.minSalePrice)}
                                </span>
                                <span className="text-sm text-default-400 line-through">{formatPrice(product.minPrice)}</span>
                                {discountPercentage !== null && (
                                    <span className="text-sm font-bold text-danger-500">
                                        (-{discountPercentage}%)
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-lg font-bold text-default-800">{formatPrice(product.minPrice)}</span>
                        )}
                    </div>
                </CardBody>
                <Divider/>
                <CardFooter className="p-2.5 flex justify-between items-center text-xs text-default-600">
                    <div className="flex items-center gap-1">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-500"/>
                        <span>Đã bán {product.purchases}</span>
                    </div>
                    <Chip color={stockStatus.color} variant="flat" size="sm" className="text-xs">{stockStatus.text}</Chip>
                </CardFooter>
            </Link>
        </Card>
    );
};

// --- Main Page Component ---
const ProductListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchedBrands, setFetchedBrands] = useState<Brand[]>([]);
    const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
    const [fetchedColors, setFetchedColors] = useState<Color[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const searchParams = useSearchParams();
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<string[]>([]);
    const [sortOption, setSortOption] = useState<string>('default');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [productsRes, brandsRes, colorsRes] = await Promise.all([
                    fetch('http://localhost:8080/api/products'),
                    fetch('http://localhost:8080/api/brands?page=0&size=1000'),
                    fetch('http://localhost:8080/api/colors')
                ]);

                if (!brandsRes.ok) throw new Error('Không thể tải danh sách thương hiệu');
                const brandsApiResponse: ApiResponse<Brand> = await brandsRes.json();
                const brandsData = (brandsApiResponse.status === 200 && brandsApiResponse.data?.content) ? brandsApiResponse.data.content : [];
                setFetchedBrands(brandsData);
                const brandLogoMap = new Map(brandsData.map(b => [b.brandName, b.logoPublicId]));

                if (!colorsRes.ok) throw new Error('Không thể tải danh sách màu sắc');
                const colorsApiResponse: ApiResponse<Color> = await colorsRes.json();
                if (colorsApiResponse.status === 200 && colorsApiResponse.data?.content) {
                    setFetchedColors(colorsApiResponse.data.content);
                } else {
                    throw new Error(colorsApiResponse.message || 'Lỗi không xác định khi tải màu sắc');
                }

                if (!productsRes.ok) throw new Error('Không thể tải danh sách sản phẩm');
                const productsApiResponse: ApiResponse<ProductApiItem> = await productsRes.json();
                if (productsApiResponse.status === 200 && productsApiResponse.data?.content) {
                    const productsWithData = productsApiResponse.data.content.map((p: ProductApiItem) => ({
                        ...p,
                        logoPublicId: brandLogoMap.get(p.brandName) || p.logoPublicId,
                        // Chuyển đổi chuỗi sizesStr thành mảng số
                        sizes: p.sizesStr ? p.sizesStr.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((s: number) => !isNaN(s)) : [],
                        // Chuyển đổi chuỗi colorsStr thành mảng chuỗi
                        colors: p.colorsStr ? p.colorsStr.split(',').map((c: string) => c.trim()) : [],
                    }));
                    setProducts(productsWithData);
                    const allCategories = new Set(productsWithData.map((p: Product) => p.categoryName));
                    setFetchedCategories(Array.from(allCategories));
                } else {
                    throw new Error(productsApiResponse.message || 'Lỗi không xác định khi tải sản phẩm');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Đồng bộ từ khóa từ query ?search=
    useEffect(() => {
        const q = searchParams?.get('search') || '';
        setSearchTerm(q);
    }, [searchParams]);

    const displayedProducts = useMemo(() => {
        return products
            .filter(product => {
                const isInStock = product.totalStock !== 0;
                const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);
                const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoryName);
                const matchesPrice = priceRange.length === 0 || priceRange.some(rangeKey => {
                    const range = PRICE_RANGES.find(r => r.key === rangeKey);
                    if (!range || product.minPrice === null) return false;
                    return product.minPrice >= range.min && product.minPrice <= range.max;
                });

                // Logic lọc theo kích cỡ
                const matchesSize = selectedSizes.length === 0 || selectedSizes.some(selectedSizeStr =>
                    product.sizes?.includes(parseInt(selectedSizeStr, 10))
                );

                // Logic lọc theo màu sắc
                const matchesColor = selectedColors.length === 0 || product.colors?.some(colorName =>
                    selectedColors.includes(colorName)
                );

                return isInStock && matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesSize && matchesColor;
            })
            .sort((a, b) => {
                switch (sortOption) {
                    case 'price-asc': return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
                    case 'price-desc': return (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity);
                    case 'name-asc': return a.productName.localeCompare(b.productName);
                    case 'name-desc': return b.productName.localeCompare(a.productName);
                    default: return b.productId - a.productId;
                }
            });
    }, [products, searchTerm, selectedBrands, selectedCategories, priceRange, selectedSizes, selectedColors, sortOption]);

    const handleClearFilters = () => {
        setSearchTerm(''); setSelectedSizes([]); setSelectedBrands([]); setPriceRange([]);
        setSelectedCategories([]); setSelectedColors([]); setSortOption('default');
    };
    const hasActiveFilters = searchTerm || selectedSizes.length > 0 || selectedBrands.length > 0 || priceRange.length > 0 ||
        selectedCategories.length > 0 || selectedColors.length > 0;

    if (loading) { /* ... Skeleton UI ... */ }
    if (error) { /* ... Error UI ... */ }

    // Phần JSX return không có gì thay đổi
    return (
        <div className="bg-default-50">
            <div className="container mx-auto max-w-screen-2xl px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                    <aside className="w-full md:w-1/4 lg:w-72 md:sticky md:top-8">
                        {/* ... Các bộ lọc ... */}
                        <div className="space-y-4">
                            <Input aria-label="Tìm kiếm" placeholder="Tìm kiếm tên giày..." value={searchTerm} onValueChange={setSearchTerm}
                                   startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400"/>}
                                   isClearable onClear={() => setSearchTerm('')}
                                   classNames={{inputWrapper: "bg-white shadow-sm"}}
                            />
                            <Button
                                fullWidth
                                variant="bordered"
                                onPress={handleClearFilters}
                                startContent={<XMarkIcon className="w-5 h-5"/>}
                                disabled={!hasActiveFilters}
                            >
                                Làm mới bộ lọc
                            </Button>

                            <Accordion selectionMode="multiple" defaultExpandedKeys={["1", "2"]} itemClasses={{base: "shadow-sm bg-white", title: "font-semibold"}}>
                                <AccordionItem key="1" aria-label="Danh mục" title="Danh mục">
                                    <CheckboxGroup value={selectedCategories} onValueChange={setSelectedCategories}>
                                        {fetchedCategories.map((cat) => (<Checkbox key={cat} value={cat}>{cat}</Checkbox>))}
                                    </CheckboxGroup>
                                </AccordionItem>
                                <AccordionItem key="2" aria-label="Màu sắc" title="Màu sắc">
                                    <CheckboxGroup value={selectedColors} onValueChange={setSelectedColors}>
                                        {fetchedColors.map((color) => (
                                            <Checkbox key={color.id} value={color.name}>
                                                {color.name}
                                            </Checkbox>
                                        ))}
                                    </CheckboxGroup>
                                </AccordionItem>
                                <AccordionItem key="3" aria-label="Mức giá" title="Mức giá">
                                    <CheckboxGroup value={priceRange} onValueChange={setPriceRange}>
                                        {PRICE_RANGES.map((range) => (<Checkbox key={range.key} value={range.key}>{range.label}</Checkbox>))}
                                    </CheckboxGroup>
                                </AccordionItem>
                                <AccordionItem key="4" aria-label="Kích thước" title="Kích thước">
                                    <CheckboxGroup value={selectedSizes} onValueChange={setSelectedSizes}>
                                        <div className="grid grid-cols-3 gap-2">{SIZE_OPTIONS.map((size) => (
                                            <Chip as="label" key={size} variant="flat" className="cursor-pointer w-full justify-center">
                                                <Checkbox value={size} className="mr-1"/> {size}
                                            </Chip>))}
                                        </div>
                                    </CheckboxGroup>
                                </AccordionItem>
                                <AccordionItem key="5" aria-label="Thương hiệu" title="Thương hiệu">
                                    <Select
                                        labelPlacement="outside" placeholder="Chọn thương hiệu" selectionMode="multiple"
                                        selectedKeys={selectedBrands}
                                        onSelectionChange={(keys: Selection) => setSelectedBrands(Array.from(keys) as string[])}
                                        classNames={{trigger: "bg-white shadow-sm border-default-200"}}
                                    >
                                        {fetchedBrands.map((brand) => (
                                            <SelectItem key={brand.brandName} textValue={brand.brandName}
                                                        startContent={<CldImage width={24} height={24} src={brand.logoPublicId} alt="Logo" className="w-6 h-6 object-contain rounded"/>}>
                                                {brand.brandName}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </aside>

                    <main className="w-full md:w-3/4 lg:flex-1">
                        <div className="bg-white shadow-sm rounded-lg p-3 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-default-600 flex-shrink-0">
                                Hiển thị <span className="font-semibold text-default-800">{displayedProducts.length}</span> / {products.length} sản phẩm
                            </p>
                            <Select aria-label="Sắp xếp" placeholder="Sắp xếp theo" selectedKeys={[sortOption]}
                                    onSelectionChange={(keys: Selection) => setSortOption(Array.from(keys)[0] as string)}
                                    className="w-full sm:w-56" size="sm">
                                {SORT_OPTIONS.map(option => (<SelectItem key={option.key}>{option.label}</SelectItem>))}
                            </Select>
                        </div>
                        {displayedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {displayedProducts.map((product) => <ProductCard key={product.productId} product={product}/>)}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center py-24 bg-white rounded-lg shadow-sm">
                                <div className="text-center">
                                    <InboxIcon className="w-24 h-24 mx-auto text-default-300 mb-4"/>
                                    <h3 className="text-2xl font-semibold text-default-800">Không tìm thấy sản phẩm</h3>
                                    <p className="text-default-500 mt-2">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                                    <Button color="primary" variant="flat" className="mt-6" onPress={handleClearFilters}
                                            startContent={<XMarkIcon className="w-5 h-5"/>}>Xóa tất cả bộ lọc</Button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductListPage;