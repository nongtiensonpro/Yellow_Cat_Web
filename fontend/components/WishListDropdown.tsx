"use client";

import { useEffect, useState } from "react";
import {  Divider, Badge, Button } from "@heroui/react";
import { CldImage } from "next-cloudinary";
import { BuildingStorefrontIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface WishlistItem {
    productId: number;
    productName: string;
    thumbnail: string | null;
    brandName: string;
    minPrice: number | null;
}

export const WishlistDropdown = () => {
    const [products, setProducts] = useState<WishlistItem[]>([]);

    const updateDropdownWishlist = () => {
        const stored = localStorage.getItem("wishlist");
        if (stored) {
            try {
                const storedProducts: WishlistItem[] = JSON.parse(stored);
                // Đảm bảo storedProducts là một mảng các đối tượng
                setProducts(Array.isArray(storedProducts) ? storedProducts : []);
            } catch (e) {
                console.error("Failed to parse wishlist from localStorage", e);
                setProducts([]);
            }
        } else {
            setProducts([]);
        }
    };

    useEffect(() => {
        updateDropdownWishlist();

        window.addEventListener("wishlistUpdated", updateDropdownWishlist);

        return () => {
            window.removeEventListener("wishlistUpdated", updateDropdownWishlist);
        };
    }, []);

    const removeFromWishlist = (id: number) => {
        const stored = localStorage.getItem("wishlist");
        let currentWishlist: WishlistItem[] = [];
        if (stored) {
            try {
                currentWishlist = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing wishlist from localStorage:", e);
            }
        }

        const updated = currentWishlist.filter(p => p.productId !== id);
        setProducts(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        window.dispatchEvent(new Event("wishlistUpdated"));
    };

    const formatPrice = (price: number | null) => {
        if (price === null || isNaN(Number(price))) return 'Liên hệ'; // Xử lý cả NaN
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    return (
        <div className="p-4 w-80 max-h-[400px] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Sản phẩm yêu thích</h2>
            <Divider className="my-3" />
            {products.length === 0 ? (
                <p className="text-center text-default-500 py-4">Chưa có sản phẩm nào trong danh sách yêu thích.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {products.map((product) => (
                        <div key={product.productId} className="flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                            <Link href={`/products/${product.productId}`} className="flex-shrink-0">
                                {product.thumbnail ? (
                                    <CldImage
                                        width={60}
                                        height={60}
                                        src={product.thumbnail}
                                        alt={product.productName || "Product image"}
                                        className="rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 flex items-center justify-center bg-default-100 rounded-md text-default-400">
                                        <BuildingStorefrontIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </Link>
                            <div className="flex-grow">
                                <Link href={`/products/${product.productId}`}>
                                    <h3 className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors">
                                        {product.productName || "Tên sản phẩm không xác định"}
                                    </h3>
                                </Link>
                                <p className="text-xs text-default-500">{product.brandName || "Thương hiệu không xác định"}</p>
                                <Badge color="primary" size="sm" className="mt-1">
                                    {formatPrice(product.minPrice)}
                                </Badge>
                            </div>
                            <button
                                onClick={() => removeFromWishlist(product.productId)}
                                className="flex-shrink-0 p-1 rounded-full text-danger hover:bg-danger/10 transition-colors"
                                title="Xoá khỏi yêu thích"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <Divider className="my-3" />
            <div className="flex justify-center mt-4">
                <Link href="/wishlist">
                    <Button color="primary" variant="flat" size="sm">
                        Xem tất cả ({products.length})
                    </Button>
                </Link>
            </div>
        </div>
    );
};