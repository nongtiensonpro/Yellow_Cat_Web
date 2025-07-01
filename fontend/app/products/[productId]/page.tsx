'use client';

import { Card, CardHeader, CardBody, Divider, Button, Spinner, Tabs, Tab } from "@heroui/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { CldImage } from 'next-cloudinary';
import ReviewSection from "@/components/review/ReviewSection";
interface BaseEntity {
    id: number;
    name: string;
    description?: string;
}

interface ColorInfo extends BaseEntity {}
interface SizeInfo extends BaseEntity {}
interface Material extends BaseEntity {}
interface TargetAudience extends BaseEntity {}

interface PaginatedResponse<T> {
    content: T[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
    size: number;
    first: boolean;
    last: boolean;
}

interface ApiEntitiesResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: PaginatedResponse<T>;
}

interface ProductVariant {
    variantId: number;
    sku: string;
    colorId: number;
    sizeId: number;
    colorName?: string;
    sizeName?: string;
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}

interface ProductDetail {
    productId: number;
    productName: string;
    description: string;
    materialId: number;
    targetAudienceId: number;
    materialName?: string;
    targetAudienceName?: string;
    purchases: number;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    thumbnail: string;
    variants: ProductVariant[];
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ProductDetail;
}

interface CartItem {
    id: number;
    productId: number;
    productName: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
}

// ============================================================================
//                             MAIN COMPONENT
// ============================================================================

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = Array.isArray(params?.productId) ? params.productId[0] : params?.productId;
    // Convert productId to a number immediately, as ReviewSection expects number
    const numericProductId = productId ? parseInt(productId as string, 10) : null;


    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);

    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [sizes, setSizes] = useState<SizeInfo[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
    const [initialFetchComplete, setInitialFetchComplete] = useState(false);

    // State to hold review count and average rating from ReviewSection
    const [reviewCount, setReviewCount] = useState<number>(0);
    const [averageReviewRating, setAverageReviewRating] = useState<number>(0.0);


    // ============================================================================
    //                             FETCH FUNCTIONS (using useCallback)
    // ============================================================================

    const fetchProductDetail = useCallback(async (id: string) => {
        console.log("ProductDetailPage: Fetching product detail for ID:", id);
        try {
            setError(null);
            const response = await fetch(`http://localhost:8080/api/products/${id}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setProduct(apiResponse.data);
            } else {
                throw new Error(apiResponse.message || 'Failed to fetch product data');
            }
        } catch (err: any) {
            console.error('ProductDetailPage: Error fetching product:', err);
            setError(err.message || 'An error occurred while fetching the product');
            throw err;
        }
    }, []);

    const fetchColors = useCallback(async () => {
        console.log("ProductDetailPage: Fetching colors...");
        try {
            const response = await fetch(`http://localhost:8080/api/colors`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching colors`);
            const data: ApiEntitiesResponse<ColorInfo> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setColors(data.data.content);
            } else {
                throw new Error(data.message || 'Failed to fetch colors');
            }
        } catch (err: any) {
            console.error('ProductDetailPage: Error fetching colors:', err);
            throw err;
        }
    }, []);

    const fetchSizes = useCallback(async () => {
        console.log("ProductDetailPage: Fetching sizes...");
        try {
            const response = await fetch(`http://localhost:8080/api/sizes`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching sizes`);
            const data: ApiEntitiesResponse<SizeInfo> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setSizes(data.data.content);
            } else {
                throw new Error(data.message || 'Failed to fetch sizes');
            }
        } catch (err: any) {
            console.error('ProductDetailPage: Error fetching sizes:', err);
            throw err;
        }
    }, []);

    const fetchMaterials = useCallback(async () => {
        console.log("ProductDetailPage: Fetching materials...");
        try {
            const response = await fetch(`http://localhost:8080/api/materials`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching materials`);
            const data: ApiEntitiesResponse<Material> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setMaterials(data.data.content);
            } else {
                throw new Error(data.message || 'Failed to fetch materials');
            }
        } catch (err: any) {
            console.error('ProductDetailPage: Error fetching materials:', err);
            throw err;
        }
    }, []);

    const fetchTargetAudiences = useCallback(async () => {
        console.log("ProductDetailPage: Fetching target audiences...");
        try {
            const response = await fetch(`http://localhost:8080/api/target-audiences`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching target audiences`);
            const data: ApiEntitiesResponse<TargetAudience> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setTargetAudiences(data.data.content);
            } else {
                throw new Error(data.message || 'Failed to fetch target audiences');
            }
        } catch (err: any) {
            console.error('ProductDetailPage: Error fetching target audiences:', err);
            throw err;
        }
    }, []);

    const handleReviewStatsLoaded = useCallback((stats: { totalReviews: number, averageRating: number }) => {
        console.log("ProductDetailPage: Review stats loaded:", stats);
        setReviewCount(stats.totalReviews);
        setAverageReviewRating(stats.averageRating);
    }, []);

    useEffect(() => {
        console.log("ProductDetailPage: Main useEffect triggered. Raw productId:", productId, "Numeric productId:", numericProductId);
        if (numericProductId !== null && !isNaN(numericProductId)) { // Ensure numericProductId is valid
            setLoading(true);
            Promise.all([
                fetchProductDetail(numericProductId.toString()), // Pass string productId to fetchProductDetail
                fetchColors(),
                fetchSizes(),
                fetchMaterials(),
                fetchTargetAudiences()
            ]).then(() => {
                setInitialFetchComplete(true);
                setLoading(false); // Set loading to false only after all fetches are complete
            }).catch(err => {
                // Error is already set by individual fetch functions
                console.error("ProductDetailPage: Error during initial fetches:", err);
                setLoading(false); // Ensure loading stops if Promise.all fails
            });
        } else {
            setError("Invalid Product ID.");
            setLoading(false);
            console.error("ProductDetailPage: Invalid numericProductId, not fetching data.");
        }
    }, [numericProductId, fetchProductDetail, fetchColors, fetchSizes, fetchMaterials, fetchTargetAudiences]);


    // Effect to update product variants with names and set initial selected variant
    useEffect(() => {
        if (initialFetchComplete && product && colors.length > 0 && sizes.length > 0) {
            console.log("ProductDetailPage: Initial fetch complete, processing variants.");
            const updatedVariants = product.variants.map(variant => ({
                ...variant,
                colorName: colors.find(c => c.id === variant.colorId)?.name || 'N/A',
                sizeName: sizes.find(s => s.id === variant.sizeId)?.name || 'N/A',
            }));

            const updatedProductData = { ...product, variants: updatedVariants };

            if (materials.length > 0 && targetAudiences.length > 0) {
                updatedProductData.materialName = materials.find(m => m.id === product.materialId)?.name;
                updatedProductData.targetAudienceName = targetAudiences.find(ta => ta.id === product.targetAudienceId)?.name;
            }

            setProduct(updatedProductData);

            // Set initial selected variant
            if (updatedVariants.length > 0) {
                const firstVariant = updatedVariants[0];
                setSelectedVariant(firstVariant);
                setSelectedColorId(firstVariant.colorId);

                const availableSizesForFirstColor = getSizesForColor(firstVariant.colorId, updatedVariants);
                if (availableSizesForFirstColor.length > 0) {
                    setSelectedSizeId(availableSizesForFirstColor[0].id);
                } else {
                    setSelectedSizeId(null);
                }
            } else {
                setSelectedVariant(null);
                setSelectedColorId(null);
                setSelectedSizeId(null);
            }
        }
    }, [initialFetchComplete, product?.productId, colors, sizes, materials, targetAudiences]);


    // Effect to update selectedVariant when color/size selection changes
    useEffect(() => {
        if (product && colors.length > 0 && sizes.length > 0) {
            if (selectedColorId && selectedSizeId) {
                const variant = product.variants.find(
                    v => v.colorId === selectedColorId && v.sizeId === selectedSizeId
                );
                setSelectedVariant(variant || null);
            } else if (selectedColorId && !selectedSizeId) {
                const firstVariantOfColor = product.variants.find(v => v.colorId === selectedColorId);
                setSelectedVariant(firstVariantOfColor || null);
            } else {
                if (!selectedColorId && !selectedSizeId) {
                    setSelectedVariant(null);
                }
            }
        }
    }, [product, selectedColorId, selectedSizeId, colors, sizes]);


    // ============================================================================
    //                             HELPER FUNCTIONS
    // ============================================================================

    const getUniqueColors = (): ColorInfo[] => {
        if (!product?.variants || colors.length === 0) return [];
        const colorIdsInProduct = new Set<number>();
        product.variants.forEach(variant => {
            if (variant.colorId) {
                colorIdsInProduct.add(variant.colorId);
            }
        });
        return colors.filter(c => colorIdsInProduct.has(c.id));
    };

    const getSizesForColor = (colorId: number | null, currentVariants?: ProductVariant[]): SizeInfo[] => {
        const variantsToUse = currentVariants || product?.variants;
        if (!variantsToUse || !colorId || sizes.length === 0) return [];
        const sizeIds = new Set<number>();
        variantsToUse
            .filter(variant => variant.colorId === colorId && variant.sizeId)
            .forEach(variant => sizeIds.add(variant.sizeId));
        return sizes.filter(s => sizeIds.has(s.id));
    };


    const handleColorSelect = (colorId: number) => {
        setSelectedColorId(colorId);
        const availableSizesForColor = getSizesForColor(colorId);
        if (availableSizesForColor.length > 0) {
            const currentSizeIsAvailable = availableSizesForColor.some(s => s.id === selectedSizeId);
            if (currentSizeIsAvailable && selectedSizeId !== null) {
                setSelectedSizeId(selectedSizeId);
            } else {
                setSelectedSizeId(availableSizesForColor[0].id);
            }
        } else {
            setSelectedSizeId(null);
        }
    };

    const handleSizeSelect = (sizeId: number) => {
        setSelectedSizeId(sizeId);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddToCart = () => {
        if (!selectedVariant || !product) {
            alert('Vui lòng chọn một biến thể sản phẩm trước khi thêm vào giỏ hàng.');
            return;
        }

        if (selectedVariant.stockLevel <= 0) {
            alert('Sản phẩm này hiện đang hết hàng.');
            return;
        }

        const existingCartString = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
        let cart: CartItem[] = existingCartString ? JSON.parse(existingCartString) : [];

        const existingCartItemIndex = cart.findIndex(item => item.id === selectedVariant.variantId);

        if (existingCartItemIndex > -1) {
            const currentItem = cart[existingCartItemIndex];
            if (currentItem.quantity < selectedVariant.stockLevel) {
                currentItem.quantity += 1;
            } else {
                alert('Bạn đã đạt số lượng tối đa có thể mua của sản phẩm này.');
                return;
            }
        } else {
            const colorName = colors.find(c => c.id === selectedVariant.colorId)?.name || 'N/A';
            const sizeName = sizes.find(s => s.id === selectedVariant.sizeId)?.name || 'N/A';

            const newCartItem: CartItem = {
                id: selectedVariant.variantId,
                productId: product.productId,
                productName: product.productName,
                name: `${product.productName} - ${colorName} - ${sizeName}`,
                price: selectedVariant.price,
                quantity: 1,
                imageUrl: selectedVariant.imageUrl,
                sku: selectedVariant.sku,
                stockLevel: selectedVariant.stockLevel,
                colorName: colorName,
                sizeName: sizeName,
            };
            cart.push(newCartItem);
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem('cart', JSON.stringify(cart));
        }

        alert('Đã thêm sản phẩm vào giỏ hàng!');
        router.push('/cart');
    };

    // ============================================================================
    //                             RENDER LOGIC
    // ============================================================================

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải thông tin sản phẩm..." size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-4xl mx-auto my-10">
                <CardHeader>
                    <p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {error}. Không thể hiển thị thông tin sản phẩm. Vui lòng thử lại.
                    </p>
                    <Button className="mt-4" onClick={() => {
                        if (numericProductId !== null && !isNaN(numericProductId)) {
                            setLoading(true);
                            setError(null);
                            setInitialFetchComplete(false);
                            setProduct(null);
                            setSelectedVariant(null);
                            setSelectedColorId(null);
                            setSelectedSizeId(null);

                            Promise.all([
                                fetchProductDetail(numericProductId.toString()),
                                fetchColors(),
                                fetchSizes(),
                                fetchMaterials(),
                                fetchTargetAudiences()
                            ]).then(() => {
                                setInitialFetchComplete(true);
                                setLoading(false);
                            }).catch(err => {
                                console.error("Error during retry data fetch:", err);
                                setError(err.message || "Lỗi tải dữ liệu phụ trợ");
                                setLoading(false);
                            });
                        }
                    }}>Thử lại</Button>
                    <Button className="mt-4 ml-2" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    if (!product) {
        return (
            <Card className="w-full max-w-4xl mx-auto my-10">
                <CardHeader>
                    <p className="text-lg font-semibold text-yellow-600">Không tìm thấy sản phẩm</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    <p className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                        Không tìm thấy thông tin sản phẩm với ID: {productId}
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    const uniqueColorInfos = getUniqueColors();
    const availableSizeInfos = selectedColorId ? getSizesForColor(selectedColorId) : [];
    const selectedColorObject = colors.find(c => c.id === selectedColorId);
    const selectedSizeObject = sizes.find(s => s.id === selectedSizeId);
    const selectedColorName = selectedColorObject?.name;
    const selectedSizeName = selectedSizeObject?.name;


    return (
        <div className="container mx-auto my-10 p-4 max-w-4xl">
            <Card className="w-full">
                <CardHeader className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-gray-500"
                        >
                            &larr; Quay lại
                        </Button>
                        <span className="text-gray-500">|</span>
                        <span className="text-sm text-gray-500">{product.categoryName}</span>
                    </div>
                    <h1 className="text-2xl font-bold">{product.productName}</h1>
                    <div className="flex items-center mt-2">
                        <div className="flex items-center">
                            {product.logoPublicId && (
                                <CldImage
                                    width={30}
                                    height={30}
                                    src={product.logoPublicId}
                                    alt={product.brandName}
                                    className="mr-2 rounded-full object-cover"
                                />
                            )}
                            <span className="font-medium">{product.brandName}</span>
                        </div>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{product.purchases} lượt mua</span>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div
                            className="flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[300px] md:min-h-[400px]">
                            {selectedVariant && selectedVariant.imageUrl ? (
                                <CldImage
                                    width={400}
                                    height={400}
                                    src={selectedVariant.imageUrl}
                                    alt={`${product.productName} - ${selectedVariant.colorName} - ${selectedVariant.sizeName}`}
                                    className="object-contain max-h-[400px]"
                                />
                            ) : (
                                product.thumbnail ? (
                                    <CldImage
                                        width={400}
                                        height={400}
                                        src={product.thumbnail}
                                        alt={product.productName}
                                        className="object-contain max-h-[400px]"
                                    />
                                ) : (
                                    <div className="text-gray-500">Không có hình ảnh</div>
                                )
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-bold text-red-600">
                                    {selectedVariant ? formatPrice(selectedVariant.price) : (product.variants.length > 0 && product.variants[0].price ? formatPrice(product.variants[0].price) : 'N/A')}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Còn
                                    lại: {selectedVariant ? selectedVariant.stockLevel : (product.variants.length > 0 ? product.variants[0].stockLevel : 0)} sản
                                    phẩm
                                </p>
                            </div>

                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-4">
                                    {uniqueColorInfos.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Màu sắc: <span
                                                className="font-semibold">{selectedColorName || "Chọn màu"}</span></h3>
                                            <div className="flex flex-wrap gap-2">
                                                {uniqueColorInfos.map(colorInfo => (
                                                    <Button
                                                        key={`color-${colorInfo.id}`}
                                                        variant={selectedColorId === colorInfo.id ? "flat" : "ghost"}
                                                        color={selectedColorId === colorInfo.id ? "primary" : "default"}
                                                        onClick={() => handleColorSelect(colorInfo.id)}
                                                        className="min-w-[80px]"
                                                    >
                                                        {colorInfo.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {availableSizeInfos.length > 0 && selectedColorId && (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Kích cỡ: <span
                                                className="font-semibold">{selectedSizeName || "Chọn kích cỡ"}</span></h3>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSizeInfos.map(sizeInfo => (
                                                    <Button
                                                        key={`size-${selectedColorId}-${sizeInfo.id}`}
                                                        variant={selectedSizeId === sizeInfo.id ? "flat" : "ghost"}
                                                        color={selectedSizeId === sizeInfo.id ? "primary" : "default"}
                                                        onClick={() => handleSizeSelect(sizeInfo.id)}
                                                        className="min-w-[50px]"
                                                    >
                                                        {sizeInfo.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    color="success"
                                    size="lg"
                                    className="w-full"
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || selectedVariant.stockLevel <= 0}
                                >
                                    Thêm vào giỏ hàng
                                </Button>
                                {selectedVariant && selectedVariant.stockLevel <= 5 && selectedVariant.stockLevel > 0 && (
                                    <p className="text-sm text-orange-500 mt-2">
                                        Chỉ còn {selectedVariant.stockLevel} sản phẩm, mua ngay kẻo hết!
                                    </p>
                                )}
                                {selectedVariant && selectedVariant.stockLevel <= 0 && (
                                    <p className="text-sm text-red-500 mt-2">
                                        Sản phẩm này đã hết hàng!
                                    </p>
                                )}
                                {!selectedVariant && product.variants.length > 0 && (
                                    <p className="text-sm text-yellow-500 mt-2">
                                        Vui lòng chọn màu sắc và kích thước.
                                    </p>
                                )}
                            </div>

                            <div className="text-sm text-gray-500">
                                SKU: {selectedVariant ? selectedVariant.sku : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <Tabs>
                            <Tab title="Mô tả sản phẩm">
                                <div className="p-4 prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed">{product.description || "Không có mô tả cho sản phẩm này."}</p>
                                    {product.materialName && (
                                        <p className="mt-2 text-sm text-gray-600"><strong>Chất liệu:</strong> {product.materialName}</p>
                                    )}
                                    {product.targetAudienceName && (
                                        <p className="mt-1 text-sm text-gray-600"><strong>Đối tượng:</strong> {product.targetAudienceName}</p>
                                    )}
                                </div>
                            </Tab>
                            <Tab title="Thông tin thương hiệu">
                                <div className="p-4">
                                    <div className="flex items-center mb-4">
                                        {product.logoPublicId && (
                                            <CldImage
                                                width={60}
                                                height={60}
                                                src={product.logoPublicId}
                                                alt={product.brandName}
                                                className="mr-4 rounded-full object-cover"
                                            />
                                        )}
                                        <h3 className="text-xl font-bold">{product.brandName}</h3>
                                    </div>
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 leading-relaxed">{product.brandInfo || "Không có thông tin thương hiệu."}</p>
                                    </div>
                                </div>
                            </Tab>
                            <Tab title="Thông số kỹ thuật">
                                <div className="p-4">
                                    {selectedVariant ? (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thuộc tính
                                                </th>
                                                <th scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Giá trị
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mã SKU</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.sku}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Màu sắc</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.colorName}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Kích cỡ</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.sizeName}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Giá</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPrice(selectedVariant.price)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Cân nặng</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.weight} kg</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tồn kho</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.stockLevel}</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-gray-500">Vui lòng chọn một biến thể để xem thông số kỹ thuật chi tiết.</p>
                                    )}
                                </div>
                            </Tab>
                            {/* Review Tab - displays review count in title */}
                            {numericProductId !== null && !isNaN(numericProductId) && (
                                <Tab title={`Đánh giá sản phẩm (${reviewCount})`}>
                                    <div className="p-4">
                                        <ReviewSection
                                            productId={numericProductId}
                                            onReviewStatsChange={handleReviewStatsLoaded} // Correct prop name and callback
                                        />
                                    </div>
                                </Tab>
                            )}
                        </Tabs>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
