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
    Pagination
} from "@heroui/react";
import {
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    TagIcon,
    StarIcon,
    HeartIcon as HeartIconOutline
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

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
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const pageSize = 8;

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
        const fetchAllProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${pageSize}`);
                if (!response.ok) throw new Error('Failed to fetch products');
                const apiResponse: ApiResponse = await response.json();
                if (apiResponse.status === 200 && apiResponse.data?.content) {
                    setProducts(apiResponse.data.content);
                    setTotalPages(apiResponse.data.page.totalPages);
                } else throw new Error(apiResponse.message);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, [currentPage, pageSize]);

    const formatPrice = (price: number | null) => {
        if (price === null || isNaN(Number(price))) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    const calculateDiscountPercent = (price: number, salePrice: number) => {
        if (!price || !salePrice || price <= salePrice) return null;
        const percent = ((price - salePrice) / price) * 100;
        return Math.round(percent);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1);
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

        return (
            <Card
                key={product.productId}
                className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200 cursor-pointer"
            >
                <CardHeader className="pb-0 pt-2 px-4 relative">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
                        <div className="absolute top-2 right-2 z-30">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                }}
                                className="p-1 rounded-full bg-white/80 hover:bg-white shadow"
                            >
                                {isWishlisted ? (
                                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                                ) : (
                                    <HeartIconOutline className="w-5 h-5 text-red-500" />
                                )}
                            </button>
                        </div>

                        {discountPercent && (
                            <div className="absolute top-2 left-2 z-30 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                -{discountPercent}%
                            </div>
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
                    </div>
                </CardHeader>

                <CardBody className="px-4 py-3">
                    <Link href={`/products/${product.productId}`}>
                        <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
                            {product.productName || "Tên sản phẩm không xác định"}
                        </h4>
                    </Link>

                    <div className="flex items-center gap-2 my-2">
                        <CurrencyDollarIcon className="w-4 h-4 text-success" />
                        {product.minSalePrice ? (
                            <>
                                <span className="text-base text-gray-400 line-through">
                                    {formatPrice(product.minPrice)}
                                </span>
                                <span className="text-lg font-semibold text-red-600">
                                    {formatPrice(product.minSalePrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-semibold text-success">
                                {formatPrice(product.minPrice)}
                            </span>
                        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading
                    ? Array.from({ length: pageSize }).map((_, index) => (
                        <Skeleton key={index} className="h-64 rounded-lg bg-default-300" />
                    ))
                    : products.map(renderProductCard)}
            </div>
            {totalPages > 1 && (
                <div className="flex w-full justify-center mt-8">
                    <Pagination
                        loop
                        showControls
                        color="primary"
                        page={currentPage + 1}
                        total={totalPages}
                        onChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductList;
