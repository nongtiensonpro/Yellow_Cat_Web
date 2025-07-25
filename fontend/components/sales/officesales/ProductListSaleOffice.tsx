"use client"

import { useState, useEffect } from "react";
import { Input, Spinner, Button } from "@heroui/react";
import { OptimizedProductItem } from "./OptimizedProductItem";


interface BaseEntity {
    id: number;
    name: string;
    description?: string;
}

type ColorInfo = BaseEntity;
type SizeInfo = BaseEntity;

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

interface ApiManagementResponse {
    timestamp: string;
    status: number;
    message: string;
    data: PaginatedResponse<ProductManagement>;
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

// Thông tin khuyến mãi đơn giản
interface PromoItem {
    promotionCode: string;
    promotionName: string;
    discountAmount: number;
    finalPrice: number;
}

export interface ProductVariant {
    variantId: number;
    sku: string;
    colorId: number;
    sizeId: number;
    colorName?: string;
    sizeName?: string;
    price: number;
    salePrice?: number;
    bestPromo?: PromoItem;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}
export interface ProductManagement {
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
export interface ProductWithVariants extends ProductManagement {
    variants: ProductVariant[];
    variantsLoaded: boolean;
}


export default function ProductListSaleOffice() {
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // States for related entities (cần thiết để map tên cho biến thể)
    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [sizes, setSizes] = useState<SizeInfo[]>([]);

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                // Tải các dữ liệu phụ trợ trước
                await Promise.all([
                    fetchColors(),
                    fetchSizes(),
                ]);
                // Sau đó tải danh sách sản phẩm chính
                await fetchProductsManagement();
            } catch (err: unknown) {
                console.error("Error during initial data fetch:", err);
                const errorMessage = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        initializeData();
    }, []);

    useEffect(() => {
        // Lọc sản phẩm khi searchTerm hoặc danh sách sản phẩm thay đổi
        if (searchTerm.trim() === "") {
            setFilteredProducts(products);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = products.filter(product =>
                product.productName.toLowerCase().includes(lowercasedFilter) ||
                product.categoryName.toLowerCase().includes(lowercasedFilter) ||
                product.brandName.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const fetchProductsManagement = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/products/management`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiManagementResponse = await response.json();
            if (apiResponse.status === 200 && apiResponse.data?.content) {
                const initialProducts = apiResponse.data.content.map(p => ({
                    ...p,
                    variants: [],
                    variantsLoaded: false // Đánh dấu là chưa tải variants
                }));
                setProducts(initialProducts);
                setFilteredProducts(initialProducts);
            } else {
                throw new Error(apiResponse.message || 'Failed to fetch products');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Lỗi tải danh sách sản phẩm';
            setError(errorMessage);
        }
    };

    const fetchColors = async () => {
        const response = await fetch(`http://localhost:8080/api/colors?page=0&size=1000`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching colors`);
        const data: ApiEntitiesResponse<ColorInfo> = await response.json();
        if (data.status === 200 && data.data?.content) {
            setColors(data.data.content);
        } else {
            throw new Error(data.message || 'Failed to fetch colors');
        }
    };

    const fetchSizes = async () => {
        const response = await fetch(`http://localhost:8080/api/sizes?page=0&size=1000`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching sizes`);
        const data: ApiEntitiesResponse<SizeInfo> = await response.json();
        if (data.status === 200 && data.data?.content) {
            setSizes(data.data.content);
        } else {
            throw new Error(data.message || 'Failed to fetch sizes');
        }
    };

    // Hàm mới để tải biến thể cho MỘT sản phẩm (Lazy Loading)
    const loadVariantsForProduct = async (productId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/products/${productId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiDetailResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data?.variants) {
                // Lấy promotions cho tất cả variants song song
                const fetchedVariants = await Promise.all(apiResponse.data.variants.map(async variant => {
                    let bestPromo: PromoItem | undefined;
                    try {
                        const resPromo = await fetch(`http://localhost:8080/api/products/variant/${variant.variantId}/promotions`);
                        if (resPromo.ok) {
                            const json = await resPromo.json();
                            if (json?.data?.bestPromo) {
                                bestPromo = json.data.bestPromo as PromoItem;
                            }
                        }
                    } catch (e) {
                        console.warn('Cannot fetch promo for variant', variant.variantId, e);
                    }

                    return {
                        ...variant,
                        colorName: colors.find(c => c.id === variant.colorId)?.name || 'N/A',
                        sizeName: sizes.find(s => s.id === variant.sizeId)?.name || 'N/A',
                        bestPromo,
                    } as ProductVariant;
                }));

                setProducts(prevProducts =>
                    prevProducts.map(p =>
                        p.productId === productId
                            ? { ...p, variants: fetchedVariants, variantsLoaded: true }
                            : p
                    )
                );
            }
        } catch (err) {
            console.error(`Error fetching variants for product ${productId}:`, err);
            // Optionally, handle the error in the UI for this specific product
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleAddToInvoice = (variant: ProductVariant, product: ProductManagement) => {
        console.log('Thêm vào hóa đơn:', { variant, product });
        alert(`Đã thêm ${product.productName} - ${variant.colorName} - ${variant.sizeName} vào hóa đơn!`);
    };

    // --- PHẦN RENDER (UI) ---

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><Spinner label="Đang tải..." size="lg" /></div>;
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-2 rounded">
                        <span className="font-semibold">Tổng sản phẩm:</span>
                        <span className="ml-1 text-blue-600">{products.length}</span>
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

            {/* Danh sách sản phẩm tối ưu */}
            <div className="h-[calc(100vh-350px)] overflow-y-auto pr-2">
                <div className="space-y-3">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <OptimizedProductItem
                                key={product.productId}
                                product={product}
                                onLoadVariants={loadVariantsForProduct}
                                onAddToCart={handleAddToInvoice}
                            />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>Không tìm thấy sản phẩm nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}