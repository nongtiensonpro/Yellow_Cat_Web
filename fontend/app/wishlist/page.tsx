"use client";

import {useEffect, useState} from "react";
import {Card, CardBody, Button} from "@heroui/react";
import {CldImage} from "next-cloudinary";
import {BuildingStorefrontIcon, TrashIcon} from "@heroicons/react/24/outline";
import Link from "next/link";
import {CurrencyDollarIcon} from '@heroicons/react/24/solid';

interface WishlistItem {
    productId: number;
    productName: string;
    thumbnail: string | null;
    brandName: string;
    minPrice: number | null;
}

const WishlistPage = () => {
    const [products, setProducts] = useState<WishlistItem[]>([]);

    const updateWishlistFromStorage = () => {
        const stored = localStorage.getItem("wishlist");
        if (stored) {
            try {
                const items: WishlistItem[] = JSON.parse(stored);
                setProducts(Array.isArray(items) ? items : []);
            } catch (e) {
                console.error("Failed to parse wishlist from localStorage on WishlistPage", e);
                setProducts([]);
            }
        } else {
            setProducts([]);
        }
    };

    useEffect(() => {
        updateWishlistFromStorage();
        window.addEventListener("wishlistUpdated", updateWishlistFromStorage);
        return () => {
            window.removeEventListener("wishlistUpdated", updateWishlistFromStorage);
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
        if (price === null || isNaN(Number(price))) return 'Liên hệ';
        const formatted = new Intl.NumberFormat('vi-VN').format(Number(price));
        return `${formatted} ₫`;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-pink-500 to-red-600 bg-clip-text text-transparent drop-shadow-sm">
                Danh sách yêu thích của bạn
            </h1>
            {products.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center py-20 bg-default-50 rounded-lg shadow-inner border border-default-200">
                    <p className="text-center text-default-600 text-lg mb-6">
                        Có vẻ như bạn chưa thêm sản phẩm nào vào danh sách yêu thích.
                    </p>
                    <Link href="/products">
                        <Button color="primary" variant="shadow"
                                className="text-lg px-8 py-3 transform transition-transform duration-200 hover:scale-105">
                            Khám phá sản phẩm ngay!
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product.productId}
                              className="border border-default-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden rounded-lg">
                            {/* Adjusted height: Increased from h-40 to h-48 */}
                            <div
                                className="relative w-full h-48 overflow-hidden bg-default-100 flex items-center justify-center">
                                {product.thumbnail ? (
                                    <CldImage
                                        width={500}
                                        height={360} // Adjusted height to maintain aspect ratio with h-48 container
                                        src={product.thumbnail}
                                        alt={product.productName || "Product image"}
                                        className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-default-100 text-default-400">
                                        <BuildingStorefrontIcon className="w-20 h-20"/>
                                    </div>
                                )}
                                {/*<button*/}
                                {/*    onClick={() => removeFromWishlist(product.productId)}*/}
                                {/*    className="absolute top-3 right-3 p-1.5 rounded-full bg-white shadow-md hover:bg-danger-50 text-danger-600 hover:text-danger-700 transition-colors duration-200 z-10 flex items-center justify-center"*/}
                                {/*    title="Xoá khỏi yêu thích"*/}
                                {/*>*/}
                                {/*    <TrashIcon className="w-5 h-5" />*/}
                                {/*</button>*/}

                                <button
                                    onClick={() => removeFromWishlist(product.productId)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow hover:bg-danger/10"
                                    title="Xoá khỏi yêu thích"
                                >
                                    <TrashIcon className="w-5 h-5 text-danger"/>
                                </button>
                            </div>

                            <CardBody className="px-4 py-4 flex flex-col justify-between">
                                <Link href={`/products/${product.productId}`}>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 hover:text-gray-900 transition-colors line-clamp-2 mb-2 cursor-pointer">
                                        {product.productName || "Tên sản phẩm không xác định"}
                                    </h3>
                                </Link>

                                <div className="mt-auto">
                                    <div
                                        className="flex items-center text-green-600 font-bold text-2xl md:text-3xl mb-1">
                                        <CurrencyDollarIcon className="w-6 h-6 mr-1 text-green-500"/>
                                        {formatPrice(product.minPrice)}
                                    </div>
                                    {product.brandName && (
                                        <span className="text-sm text-gray-500">
                                            Thương hiệu: {product.brandName}
                                        </span>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;