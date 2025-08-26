"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CldImage } from "next-cloudinary";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Skeleton,
    Divider,
    Pagination, // Thêm Pagination
    Badge,
    Chip,
    Tooltip,
} from "@heroui/react";
import {
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    TagIcon,
    StarIcon,
    HeartIcon as HeartIconOutline,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Product {
    productId: number;
    productName: string;
    purchases: number;
    categoryName: string;
    brandName: string;
    logoPublicId: string;
    minPrice: number | null;
    minSalePrice: number | null;
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


const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [reviewStatsMap, setReviewStatsMap] = useState<Record<number, { averageRating: number; totalReviews: number }>>({});

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const productsPerPage = 12;

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

    useEffect(() => {
        const fetchProductsByPage = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/products?page=${currentPage - 1}&size=${productsPerPage}`);

                if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm.');
                const apiResponse: ApiResponse = await res.json();

                if (apiResponse.status === 200 && 'content' in apiResponse.data) {
                    const data = apiResponse.data as ApiResponseData;
                    const inStockProducts = data.content.filter(product => product.totalStock && product.totalStock > 0);
                    setProducts(inStockProducts);
                    if (data.page) {
                        setTotalPages(data.page.totalPages);
                    }
                } else {
                    throw new Error(apiResponse.message || 'Lỗi khi tải sản phẩm.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductsByPage();
    }, [currentPage, productsPerPage]);

    useEffect(() => {
        if (!products || products.length === 0) return;
        const fetchStats = async () => {
            try {
                const entries = await Promise.all(
                    products.map(async (p) => {
                        try {
                            const res = await fetch(`http://localhost:8080/api/reviews/stats?productId=${p.productId}`);
                            if (!res.ok) throw new Error('stats failed');
                            const data = await res.json();
                            return [p.productId, {
                                averageRating: typeof data.averageRating === 'number' ? data.averageRating : 0,
                                totalReviews: typeof data.totalReviews === 'number' ? data.totalReviews : 0,
                            }] as const;
                        } catch {
                            return [p.productId, { averageRating: 0, totalReviews: 0 }] as const;
                        }
                    })
                );
                const map: Record<number, { averageRating: number; totalReviews: number }> = {};
                entries.forEach(([id, stats]) => { map[id] = stats; });
                setReviewStatsMap(map);
            } catch {
                // ignore stats errors
            }
        };
        fetchStats();
    }, [products]);


    const formatPrice = (price: number | null) => {
        if (price === null || isNaN(Number(price))) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    const calculateDiscountPercent = (price: number | null, salePrice: number | null) => {
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

    const renderProductCard = (product: Product) => {
        const isWishlisted = wishlist.some(p => p.productId === product.productId);
        const discountPercent = product.minSalePrice && product.minPrice
            ? calculateDiscountPercent(product.minPrice, product.minSalePrice)
            : null;
        const stats = reviewStatsMap[product.productId];
        const averageRating = stats?.averageRating ?? 0;
        const totalReviews = stats?.totalReviews ?? 0;
        const isStatsLoading = stats === undefined;

        return (
            <Card
                key={product.productId}
                className="group transition-all duration-300 hover:shadow-xl border border-default-200 hover:border-primary-200 hover:-translate-y-0.5 rounded-xl overflow-hidden bg-white"
            >
                <CardHeader className="pb-0 pt-0 px-0 relative">
                    <div className="relative w-full h-48 bg-gradient-to-br from-default-100 to-default-200">
                        <div className="absolute top-2 right-2 z-30">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                                className="p-1 rounded-full bg-white/80 hover:bg-white shadow outline-none focus-visible:ring-2 ring-offset-2 ring-primary"
                                aria-label={isWishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWishlist(product); } }}
                            >
                                {isWishlisted ? (
                                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                                ) : (
                                    <HeartIconOutline className="w-5 h-5 text-red-500" />
                                )}
                            </button>
                        </div>
                        {discountPercent !== null && discountPercent > 0 && (
                            <Chip color="danger" variant="solid" size="sm" className="absolute top-2 left-2 z-30">
                                -{discountPercent}%
                            </Chip>
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

                        {/* Brand overlay removed to free image space */}
                    </div>
                </CardHeader>

                <CardBody className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            {product.logoPublicId && (
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-default-200">
                                    <CldImage width={24} height={24} src={product.logoPublicId} alt={product.brandName || 'Thương hiệu'} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <span className="text-xs font-medium text-default-700 truncate">{product.brandName}</span>
                        </div>
                        <Badge color="warning" variant="flat" className="text-[10px]">
                            {product.categoryName}
                        </Badge>
                    </div>
                    <Link href={`/products/${product.productId}`}>
                        <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer h-14">
                            {product.productName || "Tên sản phẩm không xác định"}
                        </h4>
                    </Link>

                    <div className="flex items-center gap-2 mt-1" aria-label={`Đánh giá trung bình ${averageRating.toFixed(1)} trên 5`}>
                        <div className={`flex items-center ${isStatsLoading ? 'animate-pulse' : ''}`} role="img" aria-hidden="true">
                            {Array.from({ length: 5 }).map((_, idx) => {
                                const filled = idx < Math.round(averageRating);
                                return filled ? (
                                    <StarIconSolid key={idx} className="w-4 h-4 text-yellow-500" />
                                ) : (
                                    <StarIcon key={idx} className="w-4 h-4 text-default-300" />
                                );
                            })}
                        </div>
                        <span className="text-xs text-default-500">{isStatsLoading ? 'Đang tải…' : `${averageRating.toFixed(1)} (${totalReviews})`}</span>
                    </div>

                    <div className="flex items-center gap-2 my-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-success" />
                        {product.minSalePrice === 0 && product.minPrice && product.minPrice > 0 ? (
                            <>
                                <span className="text-base text-gray-400 line-through">
                                    {formatPrice(product.minPrice)}
                                </span>
                                <span className="text-lg font-semibold text-red-600">
                                    Miễn phí
                                </span>
                            </>
                        ) : (
                            product.minSalePrice && product.minPrice && product.minSalePrice < product.minPrice ? (
                                <>
                                    <span className="text-base text-gray-400 line-through">
                                        {formatPrice(product.minPrice)}
                                    </span>
                                    <span className="text-lg font-semibold text-red-600">
                                        {formatPrice(product.minSalePrice)}
                                    </span>
                                    {!!discountPercent && (
                                        <Chip color="danger" variant="flat" size="sm" className="ml-1">-{discountPercent}%</Chip>
                                    )}
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-success">
                                    {formatPrice(product.minPrice)}
                                </span>
                            )
                        )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-default-600">
                            <TagIcon className="w-4 h-4" />
                            <Chip size="sm" variant="flat" color={product.totalStock && product.totalStock > 10 ? 'success' : product.totalStock && product.totalStock > 0 ? 'warning' : 'danger'}>
                                {product.totalStock && product.totalStock > 0 ? `${product.totalStock} sản phẩm còn lại` : 'Đang hết hàng'}
                            </Chip>
                        </div>
                        <Tooltip content="Lượt mua" placement="top">
                            <Badge color="primary" variant="flat" className="font-medium">
                                {product.purchases} đã bán
                            </Badge>
                        </Tooltip>
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
            <h2 className="text-3xl font-bold mb-6">Tất cả sản phẩm</h2>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: productsPerPage }).map((_, index) => (
                        <Skeleton key={index} className="h-96 rounded-lg bg-default-300" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map(product => renderProductCard(product))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination
                                isCompact
                                showControls
                                total={totalPages}
                                page={currentPage}
                                onChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductList;