'use client';

import {Card, CardHeader, CardBody, Divider, Button, Spinner, Tabs, Tab} from "@heroui/react";
import {useRouter, useParams} from "next/navigation";
import {useState, useEffect} from "react";
import {CldImage} from 'next-cloudinary';

// Updated ProductVariant interface
interface ProductVariant {
    variantId: number;
    sku: string;
    color: string; // Direct property
    size: string;  // Direct property
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}

interface ProductDetail {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    variants: ProductVariant[];
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ProductDetail;
}

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string | undefined;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    useEffect(() => {
        if (productId) {
            fetchProductDetail(productId as string);
        }
    }, [productId]);

    useEffect(() => {
        // Update selectedVariant when color or size changes
        if (product && selectedColor && selectedSize) {
            const variant = product.variants.find(
                v => v.color === selectedColor && v.size === selectedSize
            );
            setSelectedVariant(variant || null);
        } else if (product && product.variants.length > 0 && selectedColor && !selectedSize) {
            // If a color is selected but no size yet (e.g. after color change before default size is set)
            // try to find first variant matching the color to avoid temporarily showing no variant
            const firstVariantOfColor = product.variants.find(v => v.color === selectedColor);
            setSelectedVariant(firstVariantOfColor || null);
        }
    }, [product, selectedColor, selectedSize]);


    const fetchProductDetail = async (id: string) => {
        try {
            setLoading(true);
            setError(null); // Reset error on new fetch
            const response = await fetch(`http://localhost:8080/api/products/${id}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            if (data.status === 200 && data.data) {
                setProduct(data.data);
                if (data.data.variants && data.data.variants.length > 0) {
                    const firstVariant = data.data.variants[0];
                    setSelectedVariant(firstVariant); // Set the full variant object
                    setSelectedColor(firstVariant.color);
                    setSelectedSize(firstVariant.size);
                } else {
                    setSelectedVariant(null);
                    setSelectedColor(null);
                    setSelectedSize(null);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch product data');
            }
        } catch (err: any) {
            console.error('Error fetching product:', err);
            setError(err.message || 'An error occurred while fetching the product');
        } finally {
            setLoading(false);
        }
    };

    // Group variants by color for the color selection UI
    const getUniqueColors = (): string[] => {
        if (!product?.variants) return [];
        const colors = new Set<string>();
        product.variants.forEach(variant => {
            if (variant.color) { // Ensure color is not null or empty
                colors.add(variant.color);
            }
        });
        return Array.from(colors);
    };

    // Get available sizes for a specific color
    const getSizesForColor = (color: string | null): string[] => {
        if (!product?.variants || !color) return [];
        const sizes = new Set<string>();
        product.variants
            .filter(variant => variant.color === color && variant.size) // Ensure size is not null or empty
            .forEach(variant => sizes.add(variant.size));
        return Array.from(sizes);
    };

    // Handle color selection
    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        const availableSizesForColor = getSizesForColor(color);
        if (availableSizesForColor.length > 0) {
            setSelectedSize(availableSizesForColor[0]); // Select the first available size for the new color
        } else {
            setSelectedSize(null); // Or handle as an error/impossibility if variants always have sizes for colors
        }
    };

    // Handle size selection
    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
    };

    // Format price with Vietnamese currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải thông tin sản phẩm..." size="lg"/>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-4xl mx-auto my-10">
                <CardHeader>
                    <p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p>
                </CardHeader>
                <Divider/>
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {error}. Không thể hiển thị thông tin sản phẩm. Vui lòng thử lại.
                    </p>
                    <Button className="mt-4" onClick={() => fetchProductDetail(productId!)}>Thử lại</Button>
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
                <Divider/>
                <CardBody>
                    <p className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                        Không tìm thấy thông tin sản phẩm với ID: {productId}
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    const uniqueColors = getUniqueColors();
    const availableSizes = selectedColor ? getSizesForColor(selectedColor) : [];

    return (
            <Card className="full">
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
                <Divider/>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Product Image */}
                        <div
                            className="flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[300px] md:min-h-[400px]">
                            {selectedVariant && selectedVariant.imageUrl ? (
                                <CldImage
                                    width={400}
                                    height={400}
                                    src={selectedVariant.imageUrl}
                                    alt={`${product.productName} - ${selectedVariant.color} - ${selectedVariant.size}`}
                                    className="object-contain max-h-[400px]"
                                />
                            ) : (
                                product.variants.length > 0 && product.variants[0].imageUrl ? (
                                    // Fallback to first variant's image if selectedVariant or its image is temporarily null
                                    <CldImage
                                        width={400}
                                        height={400}
                                        src={product.variants[0].imageUrl}
                                        alt={product.productName}
                                        className="object-contain max-h-[400px]"
                                    />
                                ) : (
                                    <div className="text-gray-500">Không có hình ảnh</div>
                                )
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Price */}
                            <div>
                                <h2 className="text-3xl font-bold text-red-600">
                                    {selectedVariant ? formatPrice(selectedVariant.price) : (product.variants.length > 0 ? formatPrice(product.variants[0].price) : 'N/A')}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Còn
                                    lại: {selectedVariant ? selectedVariant.stockLevel : (product.variants.length > 0 ? product.variants[0].stockLevel : 0)} sản
                                    phẩm
                                </p>
                            </div>

                            {/* Variant Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-4">
                                    {/* Color Selection */}
                                    {uniqueColors.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Màu sắc: <span
                                                className="font-semibold">{selectedColor}</span></h3>
                                            <div className="flex flex-wrap gap-2">
                                                {uniqueColors.map(colorValue => (
                                                    <Button
                                                        key={`color-${colorValue}`}
                                                        variant={selectedColor === colorValue ? "flat" : "ghost"}
                                                        color={selectedColor === colorValue ? "primary" : "default"}
                                                        onClick={() => handleColorSelect(colorValue)}
                                                        className="min-w-[80px]"
                                                    >
                                                        {colorValue}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Size Selection */}
                                    {availableSizes.length > 0 && selectedColor && (
                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Kích cỡ: <span
                                                className="font-semibold">{selectedSize}</span></h3>
                                            <div className="flex flex-wrap gap-2">
                                                {availableSizes.map(sizeValue => (
                                                    <Button
                                                        key={`size-${selectedColor}-${sizeValue}`}
                                                        variant={selectedSize === sizeValue ? "flat" : "ghost"}
                                                        color={selectedSize === sizeValue ? "primary" : "default"}
                                                        onClick={() => handleSizeSelect(sizeValue)}
                                                        className="min-w-[50px]"
                                                    >
                                                        {sizeValue}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Add to Cart Button */}
                            <div className="pt-4">
                                <Button
                                    color="success"
                                    size="lg"
                                    className="w-full"
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

                            {/* SKU */}
                            <div className="text-sm text-gray-500">
                                SKU: {selectedVariant ? selectedVariant.sku : 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Product Description, Brand Info, Specifications Tabs */}
                    <div className="mt-10">
                        <Tabs>
                            <Tab title="Mô tả sản phẩm">
                                <div className="p-4 prose max-w-none"> {/* Added prose for better text formatting */}
                                    <p className="text-gray-700 leading-relaxed">{product.description || "Không có mô tả cho sản phẩm này."}</p>
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
                                            <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Màu
                                                    sắc
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.color}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Kích
                                                    cỡ
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.size}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Giá</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(selectedVariant.price)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Trọng
                                                    lượng
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.weight || 'N/A'} {selectedVariant.weight ? 'kg' : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SKU</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.sku}</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>Vui lòng chọn một biến thể để xem thông số kỹ thuật.</p>
                                    )}
                                </div>
                            </Tab>
                        </Tabs>
                    </div>
                </CardBody>
            </Card>
    );
}