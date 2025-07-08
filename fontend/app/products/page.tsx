"use client";

import React, {useEffect, useState, useMemo} from 'react';
import Link from 'next/link';
import {CldImage} from "next-cloudinary";
import {
    Card, CardBody, CardHeader, CardFooter,
    Button, Chip, Skeleton, Divider, Badge, Input, CheckboxGroup, Checkbox, Select, SelectItem
} from "@heroui/react";
import {
    BuildingStorefrontIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon,
    ExclamationTriangleIcon, InboxIcon, StarIcon, ShoppingCartIcon
} from "@heroicons/react/24/outline";
import {Selection} from "@react-types/shared";


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

const calculateDiscountPercentage = (originalPrice: number | null, salePrice: number | null): number | null => {
    if (salePrice === null || originalPrice === null || originalPrice === 0 || salePrice >= originalPrice) {
        return null;
    }
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
};


const PRICE_RANGES = [
    {key: 'under-600k', label: 'Dưới 600.000đ', min: 0, max: 599999},
    {key: '600k-1m', label: '600.000đ - 1.000.000đ', min: 600000, max: 1000000},
    {key: '1m-2m', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000},
    {key: 'over-2m', label: 'Trên 2.000.000đ', min: 2000001, max: Infinity},
];

const SIZE_OPTIONS = ["39", "40", "41", "42", "43", "44", "45"];

const SORT_OPTIONS = [
    {key: 'default', label: 'Mặc định'},
    {key: 'price-asc', label: 'Giá: Thấp đến Cao'},
    {key: 'price-desc', label: 'Giá: Cao đến Thấp'},
    {key: 'name-asc', label: 'Tên: A-Z'},
    {key: 'name-desc', label: 'Tên: Z-A'},
];

const ColorSwatch: React.FC<{ color: Color }> = ({color}) => (
    <div className="relative flex items-center justify-center" title={color.name}>
        <div
            className={cn(
                "w-7 h-7 rounded-full border-2 peer-data-[selected=true]:border-primary transition-transform-colors",
                color.tailwindClass || 'bg-transparent border-dashed'
            )}
        />
        <CheckIcon
            className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-data-[selected=true]:opacity-100"/>
    </div>
);

const ProductCard: React.FC<{ product: Product }> = ({product}) => {
    const stockStatus = getStockStatus(product.totalStock);
    const discountPercentage = calculateDiscountPercentage(product.minPrice, product.minSalePrice);

    return (
        <Card
            className="group/card w-full transition-all duration-300 border-2 border-transparent hover:border-primary hover:shadow-2xl hover:shadow-primary/20 cursor-pointer">
            <CardHeader className="p-0 relative">
                <Link href={`/products/${product.productId}`} className="w-full">
                    <div className="relative w-full aspect-square overflow-hidden rounded-t-lg bg-default-100">
                        {product.thumbnail ? (
                            <CldImage width={400} height={400} src={product.thumbnail} alt={product.productName}
                                      className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover/card:scale-105"/>) : (
                            <div className="w-full h-full flex items-center justify-center text-default-400">
                                <BuildingStorefrontIcon className="w-16 h-16"/></div>)}

                        {/* Badge Giảm giá (góc trên bên trái) */}
                        {discountPercentage !== null && (
                            <Badge color="danger" className="absolute top-3 left-3 shadow-md">
                                -{discountPercentage}%
                            </Badge>
                        )}

                        {/* Badge Tồn kho (góc trên bên phải) */}
                        <Badge color={stockStatus.color}
                               className="absolute top-3 right-3 shadow-md">{stockStatus.text}</Badge>
                    </div>
                </Link>
            </CardHeader>
            <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="relative w-8 h-8 rounded-full overflow-hidden bg-default-100 border border-default-200 flex-shrink-0">
                        {product.logoPublicId ? (<CldImage width={32} height={32} src={product.logoPublicId}
                                                           alt={`${product.brandName} logo`}
                                                           className="w-full h-full object-contain p-1"/>) : (<div
                            className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white text-xs font-bold w-full h-full flex items-center justify-center"> {product.brandName.charAt(0).toUpperCase()} </div>)}
                    </div>
                    <div><p className="text-sm font-semibold text-default-700">{product.brandName}</p> <p
                        className="text-xs text-default-500">{product.categoryName}</p></div>
                </div>
                <Link href={`/products/${product.productId}`}><h4
                    className="font-bold text-lg line-clamp-2 h-14 hover:text-primary transition-colors"> {product.productName} </h4>
                </Link>

                <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                        {product.minSalePrice != null && product.minSalePrice < product.minPrice ? (
                            <>
                <span className="text-base text-default-400 line-through">
                    {formatPrice(product.minPrice)}
                </span>
                                <span className="text-xl font-bold text-danger-500">
                    {formatPrice(product.minSalePrice)}
                </span>
                            </>
                        ) : (
                            <span className="text-xl font-bold text-success-600 dark:text-success-400">
                {formatPrice(product.minPrice)}
            </span>
                        )}
                    </div>

                    {discountPercentage !== null && (
                        <p className="text-sm text-danger-500 font-medium mt-1">
                            Giảm {discountPercentage}%
                        </p>
                    )}
                </div>

            </CardBody>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm text-default-600"><StarIcon
                    className="w-4 h-4 text-warning-400"/> <span>Đã bán {product.purchases}</span></div>
                <Button isIconOnly size="md" color="primary" variant="solid" aria-label="Thêm vào giỏ"
                        className="opacity-0 group-hover/card:opacity-100 transition-opacity translate-y-1 group-hover/card:translate-y-0">
                    <ShoppingCartIcon className="w-5 h-5"/> </Button>
            </CardFooter>
        </Card>
    );
};

const ProductListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [fetchedBrands, setFetchedBrands] = useState<Brand[]>([]);
    const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
    const [fetchedColors, setFetchedColors] = useState<Color[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [inStockOnly, setInStockOnly] = useState<boolean>(false);
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
                const productsApiResponse: ApiResponse<Product> = await productsRes.json();
                if (productsApiResponse.status === 200 && productsApiResponse.data?.content) {
                    const productsWithData = productsApiResponse.data.content.map(p => ({
                        ...p,
                        logoPublicId: brandLogoMap.get(p.brandName) || p.logoPublicId,
                        colors: p.colors && p.colors.length > 0 ? p.colors : ['Đen'],
                        sizes: p.sizes && p.sizes.length > 0 ? p.sizes : [40, 41, 42],
                    }));
                    setProducts(productsWithData);
                    const allCategories = new Set(productsWithData.map(p => p.categoryName));
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

    const displayedProducts = useMemo(() => {
        return products
            .filter(product => {
                const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brandName);
                const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoryName);

                // ===== LOGIC LỌC THEO GIÁ ĐÃ SỬA LẠI =====
                const matchesPrice = priceRange.length === 0 || priceRange.some(rangeKey => {
                    const range = PRICE_RANGES.find(r => r.key === rangeKey);
                    // Chỉ lọc theo giá gốc (minPrice)
                    if (!range || product.minPrice === null) return false;
                    return product.minPrice >= range.min && product.minPrice <= range.max;
                });
                // ===========================================

                const matchesSize = selectedSizes.length === 0 || selectedSizes.some(size => product.sizes?.includes(parseInt(size)));
                const matchesColor = selectedColors.length === 0 || product.colors?.some(colorName => selectedColors.includes(colorName));
                const matchesStock = !inStockOnly || (product.totalStock !== null && product.totalStock > 0);
                return matchesSearch && matchesBrand && matchesCategory && matchesPrice && matchesSize && matchesColor && matchesStock;
            })
            .sort((a, b) => {
                // ===== LOGIC SẮP XẾP ĐÃ SỬA LẠI =====
                switch (sortOption) {
                    case 'price-asc':
                        // Chỉ sắp xếp theo giá gốc (minPrice)
                        return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
                    case 'price-desc':
                        // Chỉ sắp xếp theo giá gốc (minPrice)
                        return (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity);
                    case 'name-asc':
                        return a.productName.localeCompare(b.productName);
                    case 'name-desc':
                        return b.productName.localeCompare(a.productName);
                    default:
                        return 0;
                }
                // =======================================
            });
    }, [products, searchTerm, selectedBrands, selectedCategories, priceRange, selectedSizes, selectedColors, inStockOnly, sortOption]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedSizes([]);
        setSelectedBrands([]);
        setPriceRange([]);
        setSelectedCategories([]);
        setSelectedColors([]);
        setInStockOnly(false);
        setSortOption('default');
    };

    const hasActiveFilters = searchTerm || selectedSizes.length > 0 || selectedBrands.length > 0 || priceRange.length > 0 ||
        selectedCategories.length > 0 || selectedColors.length > 0 || inStockOnly;

    if (loading) {
        return (
            <div className="container mx-auto max-w-screen-2xl px-4 py-8">
                <Skeleton className="h-10 w-1/3 mx-auto rounded-lg mb-6"/>
                <div className="flex flex-col md:flex-row gap-8 mt-12">
                    <div className="w-full md:w-1/4 lg:w-72"><Skeleton className="h-[600px] w-full rounded-lg"/></div>
                    <div className="w-full md:w-3/4 lg:flex-1">
                        <div className="flex justify-between items-center mb-6"><Skeleton
                            className="w-48 h-6 rounded-lg"/> <Skeleton className="w-64 h-10 rounded-lg"/></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({length: 9}).map((_, index) => (
                                <Card key={index} className="w-full space-y-5 p-4" radius="lg">
                                    <Skeleton className="rounded-lg h-48 bg-default-300"/>
                                    <div className="space-y-3 p-2"><Skeleton
                                        className="w-full h-4 rounded-lg bg-default-200"/> <Skeleton
                                        className="w-4/5 h-4 rounded-lg bg-default-200"/></div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto max-w-7xl px-4 py-16 flex items-center justify-center">
                <Card className="max-w-lg w-full p-4 border-1 border-danger-200 bg-danger-50">
                    <CardBody className="text-center">
                        <div className="mx-auto bg-danger-100 rounded-full p-3 w-fit"><ExclamationTriangleIcon
                            className="w-8 h-8 text-danger-500"/></div>
                        <h3 className="text-xl font-semibold text-danger-700 mt-4 mb-2">Đã có lỗi xảy ra</h3>
                        <p className="text-default-600">{error}</p>
                        <Button color="danger" variant="solid" className="mt-6"
                                onClick={() => window.location.reload()}> Tải lại trang </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-screen-2xl px-4 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-default-900 sm:text-3xl">Tất cả sản phẩm</h1>
            </header>
            <div className="flex flex-col md:flex-row md:items-start gap-8">
                <aside className="w-full md:w-1/4 lg:w-72 md:sticky md:top-8">
                    <Card className="shadow-sm">
                        <CardHeader className="p-4 border-b border-default-200">
                            <div className="flex justify-between items-center w-full">
                                <h2 className="text-xl font-semibold flex items-center gap-2"><AdjustmentsHorizontalIcon
                                    className="w-6 h-6"/> Bộ lọc </h2>
                                {hasActiveFilters && (<Button isIconOnly size="sm" variant="flat" color="danger"
                                                              onPress={handleClearFilters} aria-label="Xóa bộ lọc">
                                    <XMarkIcon className="w-5 h-5"/> </Button>)}
                            </div>
                        </CardHeader>
                        <CardBody className="p-4">
                            <div className="flex flex-col gap-6 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
                                <Input aria-label="Tìm kiếm" placeholder="Tìm kiếm tên giày..." value={searchTerm}
                                       onValueChange={setSearchTerm}
                                       startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400"/>}
                                       isClearable onClear={() => setSearchTerm('')}/>
                                <Checkbox isSelected={inStockOnly} onValueChange={setInStockOnly}>Chỉ hiển thị sản phẩm
                                    còn hàng</Checkbox>
                                <Divider/>
                                <CheckboxGroup label="Danh mục" value={selectedCategories}
                                               onValueChange={setSelectedCategories}> {fetchedCategories.map((cat) => (
                                    <Checkbox key={cat} value={cat}>{cat}</Checkbox>))} </CheckboxGroup>
                                <Divider/>
                                <CheckboxGroup label="Màu sắc" value={selectedColors} onValueChange={setSelectedColors}>
                                    <div className="flex flex-wrap gap-2">
                                        {fetchedColors.map((color) => (
                                            <Checkbox
                                                key={color.id}
                                                value={color.name}
                                                classNames={{
                                                    base: "relative m-0 p-0 max-w-max",
                                                    wrapper: "hidden"
                                                }}
                                                className="appearance-none px-4 py-2 rounded-full border border-gray-300 text-sm cursor-pointer bg-white text-gray-700 transition duration-200 hover:bg-gray-100 checked:bg-blue-500 checked:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                {color.name}
                                            </Checkbox>
                                        ))}
                                    </div>

                                </CheckboxGroup>
                                <Divider/>
                                <CheckboxGroup label="Mức giá" value={priceRange}
                                               onValueChange={setPriceRange}> {PRICE_RANGES.map((range) => (
                                    <Checkbox key={range.key}
                                              value={range.key}>{range.label}</Checkbox>))} </CheckboxGroup>
                                <Divider/>
                                <CheckboxGroup label="Kích thước" value={selectedSizes}
                                               onValueChange={setSelectedSizes}>
                                    <div className="grid grid-cols-3 gap-2">{SIZE_OPTIONS.map((size) => (
                                        <Checkbox key={size} value={size}>{size}</Checkbox>))}</div>
                                </CheckboxGroup>
                                <Divider/>
                                <Select
                                    label="Thương hiệu"
                                    placeholder="Chọn thương hiệu"
                                    selectionMode="multiple"
                                    selectedKeys={selectedBrands}
                                    onSelectionChange={(keys: Selection) => setSelectedBrands(Array.from(keys) as string[])}
                                    classNames={{
                                        trigger: "h-9 text-sm",
                                        listbox: "text-sm",
                                    }}
                                    renderValue={(items) => (
                                        <div className="flex flex-wrap gap-1">
                                            {items.map((item) => (
                                                <Chip
                                                    key={item.key}
                                                    size="sm"
                                                    className="px-2 py-0.5 text-xs"
                                                    variant="flat"
                                                    color="default"
                                                >
                                                    {item.textValue}
                                                </Chip>
                                            ))}
                                        </div>
                                    )}
                                >
                                    {fetchedBrands.map((brand) => (
                                        <SelectItem
                                            key={brand.brandName}
                                            textValue={brand.brandName}
                                            startContent={
                                                <CldImage
                                                    width={24}
                                                    height={24}
                                                    src={brand.logoPublicId}
                                                    alt="Logo thương hiệu"
                                                    className="w-6 h-6 object-contain rounded"
                                                />
                                            }
                                        >
                                            {brand.brandName}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </CardBody>
                    </Card>
                </aside>
                <main className="w-full md:w-3/4 lg:flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <p className="text-sm text-default-600 flex-shrink-0">Hiển thị <span
                            className="font-semibold text-default-800">{displayedProducts.length}</span> trên <span
                            className="font-semibold text-default-800">{products.length}</span> sản phẩm</p>
                        <Select aria-label="Sắp xếp sản phẩm" placeholder="Sắp xếp theo" selectedKeys={[sortOption]}
                                onSelectionChange={(keys: Selection) => setSortOption(Array.from(keys)[0] as string)}
                                className="w-full sm:w-64">
                            {SORT_OPTIONS.map(option => (<SelectItem key={option.key}>{option.label}</SelectItem>))}
                        </Select>
                    </div>
                    {displayedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedProducts.map((product) => <ProductCard key={product.productId}
                                                                             product={product}/>)}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-[50vh]">
                            <Card className="max-w-md w-full p-6 text-center">
                                <CardBody>
                                    <InboxIcon className="w-20 h-20 mx-auto text-default-300 mb-4"/>
                                    <h3 className="text-2xl font-semibold text-default-800">Không tìm thấy sản phẩm</h3>
                                    <p className="text-default-500 mt-2">Vui lòng thử lại với từ khóa hoặc bộ lọc
                                        khác.</p>
                                    <Button color="primary" variant="flat" className="mt-6" onPress={handleClearFilters}
                                            startContent={<XMarkIcon className="w-5 h-5"/>}>Xóa tất cả bộ lọc</Button>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProductListPage;