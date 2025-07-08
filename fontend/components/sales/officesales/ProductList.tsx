"use client"

import { useState, useEffect, useCallback } from "react";
import { Input,  Spinner, Chip, Button} from "@heroui/react";
import { CldImage } from 'next-cloudinary';
import Link from "next/link";

interface BaseEntity {
    id: number;
    name: string;
    description?: string;
}

type ColorInfo = BaseEntity;
type SizeInfo = BaseEntity;
type Material = BaseEntity;
type TargetAudience = BaseEntity;

interface PaginatedResponse<T> {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}

interface ApiEntitiesResponse<T> {
    timestamp: string;
    status: number;
    message: string;
    data: PaginatedResponse<T>;
}

interface ProductManagement {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    minPrice: number;
    totalStock: number;
    thumbnail: string;
}

interface ApiManagementResponse {
    timestamp: string;
    status: number;
    message: string;
    data: PaginatedResponse<ProductManagement>;
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

interface ApiDetailResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ProductDetail;
}

interface ProductWithVariants extends ProductManagement {
    variants: ProductVariant[];
    variantsLoaded: boolean;
}

export default function ProductListSaleOffice(){
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingVariants, setLoadingVariants] = useState<Set<number>>(new Set());

    // States for related entities
    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [sizes, setSizes] = useState<SizeInfo[]>([]);
    const [initialFetchComplete, setInitialFetchComplete] = useState(false);

    const fetchProductDetail = async (productId: number): Promise<ProductDetail | null> => {
        try {
            const response = await fetch(`http://localhost:8080/api/products/${productId}`);
            if (!response.ok) {
                console.log(`HTTP error! Status: ${response.status}`);
            }
            const apiResponse: ApiDetailResponse = await response.json();
            if (apiResponse.status === 200 && apiResponse.data) {
                return apiResponse.data;
            }
        } catch (err: unknown) {
            console.error(`Error fetching product detail for ${productId}:`, err);
        }
        return null;
    };

    const loadVariantsForAllProducts = useCallback(async () => {
        const productIds = products.map(p => p.productId);

        for (const productId of productIds) {
            if (!loadingVariants.has(productId)) {
                setLoadingVariants(prev => new Set(prev).add(productId));

                const productDetail = await fetchProductDetail(productId);
                if (productDetail && productDetail.variants) {
                    // Update variants with color and size names
                    const updatedVariants = productDetail.variants.map(variant => ({
                        ...variant,
                        colorName: colors.find(c => c.id === variant.colorId)?.name || 'N/A',
                        sizeName: sizes.find(s => s.id === variant.sizeId)?.name || 'N/A',
                    }));

                    setProducts(prevProducts =>
                        prevProducts.map(product =>
                            product.productId === productId
                                ? { ...product, variants: updatedVariants, variantsLoaded: true }
                                : product
                        )
                    );
                }

                setLoadingVariants(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                });
            }
        }
    }, [products, loadingVariants, colors, sizes]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchProductsManagement(),
            fetchColors(),
            fetchSizes(),
            fetchMaterials(),
            fetchTargetAudiences()
        ]).then(() => {
            setInitialFetchComplete(true);
        }).catch((err: unknown) => {
            console.error("Error during initial data fetch:", err);
            const errorMessage = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
            setError(errorMessage);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product =>
                product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brandName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    // Load variants for all products after initial data is loaded
    useEffect(() => {
        if (initialFetchComplete && products.length > 0) {
            loadVariantsForAllProducts();
        }
    }, [initialFetchComplete, products.length, loadVariantsForAllProducts]);

    const fetchProductsManagement = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/products/management`);
            if (!response.ok) {
                console.log(`HTTP error! Status: ${response.status}`);
            }
            const apiResponse: ApiManagementResponse = await response.json();
            if (apiResponse.status === 200 && apiResponse.data?.content) {
                const productsWithVariants: ProductWithVariants[] = apiResponse.data.content.map(product => ({
                    ...product,
                    variants: [],
                    variantsLoaded: false
                }));
                setProducts(productsWithVariants);
                setFilteredProducts(productsWithVariants);
            } else {
                console.log(apiResponse.message || 'Failed to fetch products');
            }
        } catch (err: unknown) {
            console.error('Error fetching products:', err);
            const errorMessage = err instanceof Error ? err.message : 'Lỗi tải danh sách sản phẩm';
            setError(errorMessage);
        }
    };

    const fetchColors = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/colors`);
            if (!response.ok) console.log(`HTTP error! Status: ${response.status} fetching colors`);
            const data: ApiEntitiesResponse<ColorInfo> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setColors(data.data.content);
            }
        } catch (err: unknown) {
            console.error('Error fetching colors:', err);
        }
    };

    const fetchSizes = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/sizes`);
            if (!response.ok) console.log(`HTTP error! Status: ${response.status} fetching sizes`);
            const data: ApiEntitiesResponse<SizeInfo> = await response.json();
            if (data.status === 200 && data.data?.content) {
                setSizes(data.data.content);
            }
        } catch (err: unknown) {
            console.error('Error fetching sizes:', err);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/materials`);
            if (!response.ok) console.log(`HTTP error! Status: ${response.status} fetching materials`);
            const data: ApiEntitiesResponse<Material> = await response.json();
            if (data.status === 200 && data.data?.content) {
                // Materials data received but not used in current implementation
                console.log('Materials loaded:', data.data.content.length);
            }
        } catch (err: unknown) {
            console.error('Error fetching materials:', err);
        }
    };

    const fetchTargetAudiences = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/target-audiences`);
            if (!response.ok) console.log(`HTTP error! Status: ${response.status} fetching target audiences`);
            const data: ApiEntitiesResponse<TargetAudience> = await response.json();
            if (data.status === 200 && data.data?.content) {
                // Target audiences data received but not used in current implementation
                console.log('Target audiences loaded:', data.data.content.length);
            }
        } catch (err: unknown) {
            console.error('Error fetching target audiences:', err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleAddToInvoice = (variant: ProductVariant, product: ProductManagement) => {
        // Logic sẽ được implement sau
        console.log('Thêm vào hóa đơn:', {
            variant,
            product
        });
        alert(`Đã thêm ${product.productName} - ${variant.colorName} - ${variant.sizeName} vào hóa đơn!`);
    };

    // Calculate total variants across all products
    const totalVariants = products.reduce((total, product) => total + product.variants.length, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner label="Đang tải danh sách sản phẩm..." size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-300 rounded-md p-4">
                    <p className="text-red-600 font-semibold">Lỗi tải dữ liệu</p>
                    <p className="text-red-600">{error}</p>
                    <Button
                        className="mt-2"
                        color="primary"
                        size="sm"
                        onClick={() => window.location.reload()}
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="my-3.5">
            {/* Header thông tin tổng quan */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-bold text-blue-800 mb-2">Thông tin cửa hàng</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Tổng sản phẩm:</span>
                        <span className="ml-1 text-blue-600">{products.length}</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Tổng biến thể:</span>
                        <span className="ml-1 text-indigo-600">{totalVariants}</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Màu sắc có sẵn:</span>
                        <span className="ml-1 text-green-600">{colors.length}</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Kích cỡ có sẵn:</span>
                        <span className="ml-1 text-purple-600">{sizes.length}</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Tổng tồn kho:</span>
                        <span className="ml-1 text-orange-600">{products.reduce((total, product) => total + product.totalStock, 0)}</span>
                    </div>
                </div>
            </div>

            {/* Tìm kiếm */}
            <div className="my-2.5">
                <Input
                    label="Tìm kiếm sản phẩm (tên, danh mục, thương hiệu)"
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="max-w-md"
                />
            </div>

            {/* Thông tin màu sắc và kích cỡ có sẵn */}
            {/*{initialFetchComplete && (*/}
            {/*    <div className="mb-4 p-3 bg-gray-50 rounded-lg">*/}
            {/*        <div className="mb-3">*/}
            {/*            <h3 className="font-semibold mb-2">Màu sắc có sẵn:</h3>*/}
            {/*            <div className="flex flex-wrap gap-1">*/}
            {/*                {colors.map(color => (*/}
            {/*                    <Chip key={color.id} size="sm" variant="flat" color="primary">*/}
            {/*                        {color.name}*/}
            {/*                    </Chip>*/}
            {/*                ))}*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*        <div>*/}
            {/*            <h3 className="font-semibold mb-2">Kích cỡ có sẵn:</h3>*/}
            {/*            <div className="flex flex-wrap gap-1">*/}
            {/*                {sizes.map(size => (*/}
            {/*                    <Chip key={size.id} size="sm" variant="flat" color="secondary">*/}
            {/*                        {size.name}*/}
            {/*                    </Chip>*/}
            {/*                ))}*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/* Hiển thị kết quả tìm kiếm */}
            {searchTerm && (
                <div className="mb-3">
                    <p className="text-sm text-gray-600">
                        Tìm thấy {filteredProducts.length} sản phẩm cho {searchTerm}
                    </p>
                </div>
            )}

            {/* Danh sách biến thể sản phẩm */}
            <div className="h-[calc(100vh-400px)] overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div className="space-y-6">
                    {filteredProducts.map(product => (
                    <div key={product.productId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Header sản phẩm */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {product.logoPublicId && (
                                        <CldImage
                                            width={40}
                                            height={40}
                                            src={product.logoPublicId}
                                            alt={product.brandName}
                                            className="rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{product.productName}
                                            <Link href={`/products/${product.productId}`} target="_blank" rel="noopener noreferrer" passHref>
                                                 _Chi tiết
                                            </Link>
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-gray-600">{product.brandName}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-sm text-gray-600">{product.categoryName}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Chip size="sm" variant="flat" color={product.isActive ? "success" : "danger"}>
                                        {product.isActive ? "Đang bán" : "Ngừng bán"}
                                    </Chip>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Tổng tồn kho</div>
                                        <div className="font-bold text-lg text-blue-600">{product.totalStock}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách biến thể */}
                        <div className="p-4">
                            {loadingVariants.has(product.productId) ? (
                                <div className="flex justify-center py-8">
                                    <Spinner size="lg" label="Đang tải biến thể..." />
                                </div>
                            ) : product.variants.length > 0 ? (
                                <div className="space-y-3">
                                    {product.variants.map(variant => (
                                        <div key={variant.variantId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            {/* Hình ảnh biến thể */}
                                            <div className="flex-shrink-0">
                                                {variant.imageUrl ? (
                                                    <CldImage
                                                        width={80}
                                                        height={80}
                                                        src={variant.imageUrl}
                                                        alt={`${product.productName} - ${variant.colorName} - ${variant.sizeName}`}
                                                        className="object-cover rounded-lg w-20 h-20"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        <span className="text-xs text-gray-500">No img</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Thông tin biến thể */}
                                            <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                                                {/* Màu sắc & Kích cỡ */}
                                                <div className="col-span-2">
                                                    <div className="flex items-center gap-2">
                                                        <Chip size="sm" variant="flat" color="primary" className="text-xs">
                                                            {variant.colorName}
                                                        </Chip>
                                                        <Chip size="sm" variant="flat" color="secondary" className="text-xs">
                                                            {variant.sizeName}
                                                        </Chip>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        SKU: {variant.sku}
                                                    </div>
                                                </div>

                                                {/* Giá */}
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Giá bán</div>
                                                    <div className="font-bold text-red-600">{formatPrice(variant.price)}</div>
                                                </div>

                                                {/* Tồn kho */}
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">Tồn kho</div>
                                                    <div className={`font-bold text-lg ${variant.stockLevel > 10 ? 'text-green-600' : variant.stockLevel > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                                        {variant.stockLevel}
                                                    </div>
                                                </div>

                                                {/* Nút thêm vào hóa đơn */}
                                                <div className="text-center">
                                                    <Button
                                                        size="sm"
                                                        color="success"
                                                        variant="flat"
                                                        className="px-4"
                                                        onClick={() => handleAddToInvoice(variant, product)}
                                                        disabled={variant.stockLevel <= 0}
                                                    >
                                                        {variant.stockLevel > 0 ? "Thêm" : "Hết hàng"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Chưa có biến thể
                                </div>
                            )}
                        </div>
                    </div>
                    ))}

                    {filteredProducts.length === 0 && !loading && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {searchTerm ? "Không tìm thấy sản phẩm nào phù hợp." : "Không có sản phẩm nào."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}