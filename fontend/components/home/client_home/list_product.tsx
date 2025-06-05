<<<<<<< Updated upstream
=======
"use client";

>>>>>>> Stashed changes
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
<<<<<<< Updated upstream
import {CldImage} from "next-cloudinary";
import Image from "next/image";
=======
import { CldImage } from "next-cloudinary";
import Image from "next/image"; // Import Image component from next/image
import {
    Card,
    CardBody,
    CardHeader,
    CardFooter, // Make sure CardFooter is imported
    Button,
    Chip,
    Skeleton,
    Divider,
    Badge,
} from "@heroui/react";
import {
    ShoppingCartIcon, // Keep if you want to add to cart
    EyeIcon, // Keep if you want a quick view
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    TagIcon,
    StarIcon,
    HeartIcon, // Import HeartIcon for wishlist
} from "@heroicons/react/24/outline"; // Assuming HeartFillIcon is also in outline or similar
import { HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid"; // Import SolidHeartIcon for filled state
import { useTheme } from 'next-themes';
import { title } from 'process';
>>>>>>> Stashed changes

interface Product {
  productId: number;
  productName: string;
  description: string;
  purchases: number;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  brandInfo: string;
  logoPublicId: string;
  minPrice: number | null;
  totalStock: number | null;
  thumbnail: string | null;
  activePromotions: string | null;
  isActive: boolean;
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

<<<<<<< Updated upstream
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data: ApiResponse = await response.json();
        if (data.status === 200 && data.data && data.data.content) {
          // Chỉ hiển thị sản phẩm active
          const activeProducts = data.data.content.filter(product => product.isActive);
          setProducts(activeProducts);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
=======
    // State to manage wishlist status for each product locally
    // In a real app, this would be fetched from a user's wishlist API
    const [wishlistStatus, setWishlistStatus] = useState<{ [productId: number]: boolean }>({});

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data: ApiResponse = await response.json();
                if (data.status === 200 && data.data && data.data.content) {
                    setProducts(data.data.content);
                    // Initialize wishlist status (e.g., all false initially)
                    const initialWishlist: { [productId: number]: boolean } = {};
                    data.data.content.forEach(product => {
                        initialWishlist[product.productId] = false; // Assume not in wishlist by default
                    });
                    setWishlistStatus(initialWishlist);
                } else {
                    throw new Error(data.message || 'Failed to fetch products');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const formatPrice = (price: number | null) => {
        if (price === null) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
>>>>>>> Stashed changes
    };

    fetchProducts();
  }, []);

<<<<<<< Updated upstream
  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
=======
    const toggleWishlist = (productId: number) => {
        // In a real application, you'd make an API call here to add/remove from user's wishlist
        console.log(`Toggling wishlist for product ID: ${productId}`);
        setWishlistStatus(prevStatus => ({
            ...prevStatus,
            [productId]: !prevStatus[productId]
        }));
        // You might want to show a toast notification here (e.g., "Added to Wishlist!")
    };

    // The toggleTheme function is not used in this component after adding the next/image banner
    // but keeping it here for completeness if you decide to re-introduce a theme toggle button
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (loading) {
        return (
            <div className="mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="w-48 h-8 rounded-lg" />
                    <Skeleton className="w-24 h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Added gap for consistency */}
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Card key={index} className="w-full space-y-5 p-4" radius="lg">
                            <Skeleton className="rounded-lg">
                                <div className="h-48 rounded-lg bg-default-300"></div>
                            </Skeleton>
                            <div className="space-y-3">
                                <Skeleton className="w-3/5 rounded-lg">
                                    <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-4/5 rounded-lg">
                                    <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-2/5 rounded-lg">
                                    <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
                                </Skeleton>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
>>>>>>> Stashed changes

  // Format giá tiền
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

<<<<<<< Updated upstream
  return (
      <StyledWrapper>
        {/*<h2 className="section-title">Our Products</h2>*/}
        <div className="full-width-banner-wrapper"> {/* Add this wrapper */}
          <Image
              src="/images/banner.png"
              alt="SneakerPeak Logo"
              layout="responsive" // Best practice for Next.js Image
              width={800}
              height={500}
          />
=======
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="w-full relative h-[400px] mb-8 overflow-hidden rounded-lg shadow-lg">
                <Image
                    src="/images/banner.png"
                    alt="Product List Banner"
                    fill={true}
                    objectFit="cover"
                    quality={100}
                    priority
                />
            </div>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        TOP SẢN PHẨM BÁN CHẠY
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Chip
                        startContent={<BuildingStorefrontIcon className="w-4 h-4" />}
                        variant="flat"
                        color="primary"
                    >
                        {products.length} sản phẩm
                    </Chip>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
                    const stockStatus = getStockStatus(product.totalStock);
                    const isInWishlist = wishlistStatus[product.productId];

                    return (
                        <Card
                            key={product.productId}
                            className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary-200"
                            isPressable
                        >
                            <CardHeader className="pb-0 pt-2 px-4 relative">
                                {/* Product Image */}
                                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-default-100 to-default-200">
                                    {product.thumbnail ? (
                                        <CldImage
                                            width={400}
                                            height={400}
                                            src={product.thumbnail}
                                            alt={product.productName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-default-400">
                                            <BuildingStorefrontIcon className="w-16 h-16" />
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    <Badge
                                        color={stockStatus.color}
                                        className="absolute top-2 right-2"
                                        size="sm"
                                    >
                                        {stockStatus.text}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardBody className="px-4 py-3">
                                {/* Product Name */}
                                <Link href={`/products/${product.productId}`}>
                                    <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors group-hover:text-primary cursor-pointer">
                                        {product.productName}
                                    </h4>
                                </Link>

                                {/* Price */}
                                <div className="flex items-center gap-2 my-2">
                                    <CurrencyDollarIcon className="w-4 h-4 text-success" />
                                    <span className="text-lg font-semibold text-success">
                                        {formatPrice(product.minPrice)}
                                    </span>
                                </div>

                                {/* Brand & Category */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-default-100 border-2 border-default-200 flex items-center justify-center">
                                            {product.logoPublicId ? (
                                                <CldImage
                                                    width={32}
                                                    height={32}
                                                    src={product.logoPublicId}
                                                    alt={`${product.brandName} logo`}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="bg-gradient-to-br from-primary-400 to-secondary-400 text-white text-xs font-bold w-full h-full flex items-center justify-center rounded-full">
                                                    {product.brandName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{product.brandName}</span>
                                            <span className="text-xs text-default-500">{product.categoryName}</span>
                                        </div>
                                    </div>
                                </div>

                                <Divider className="my-2" />

                                {/* Stats */}
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

                            {/* Card Footer with Wishlist Button */}
                            <CardFooter className="px-4 py-2 flex justify-between items-center">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    as={Link} // Use as Link for navigation
                                    href={`/products/${product.productId}`}
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                >
                                    Xem chi tiết
                                </Button>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color={isInWishlist ? "danger" : "default"} // Change color if in wishlist
                                    onClick={() => toggleWishlist(product.productId)}
                                    aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                    {isInWishlist ? (
                                        <SolidHeartIcon className="w-5 h-5" /> // Filled heart if in wishlist
                                    ) : (
                                        <HeartIcon className="w-5 h-5" /> // Outline heart if not
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
                <Card className="max-w-md mx-auto mt-12">
                    <CardBody className="text-center py-12">
                        <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Không có sản phẩm</h3>
                        <p className="text-default-500">
                            Hiện tại chưa có sản phẩm nào được hiển thị.
                        </p>
                    </CardBody>
                </Card>
            )}
>>>>>>> Stashed changes
        </div>
        <h2 className="section-title">Our Products</h2>
        <div className="product-grid">
          {products.map((product) => (
              <div className="card" key={product.productId}>
                {product.thumbnail ? (
                    <div className="image">
                      <CldImage
                          width={400}
                          height={400}
                          src={product.thumbnail}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                      />
                    </div>
                ) : (
                    <div className="image placeholder" />
                )}
                <div className="content">
                  <Link href={`/products/${product.productId}`}>
                <span className="title inline">
                  {product.productName}
                </span>
                  </Link>
                  <p className="price">{formatPrice(product.minPrice)}</p>
                  <div className="desc">
                    <div className="brand-info">
                      <div className="brand-logo">
                        <CldImage
                            width={30}
                            height={30}
                            src={product.logoPublicId}
                            alt={`${product.brandName} logo`}
                            className="object-contain" // Giữ object-contain cho logo nhỏ
                        />
                      </div>
                      <span> {product.brandName} <div className="category-info">{product.categoryName}</div></span>
                    </div>
                  </div>
                  <div className="stats">
                    <span className="stock">Stock: {product.totalStock || 'N/A'}</span>
                    <span className="purchases">Sold: {product.purchases}</span>
                  </div>
                  <Link className="title text-right" href={`/products/${product.productId}`}>
                    View Details
                  </Link>
                </div>
              </div>
          ))}
        </div>
      </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 0 auto;
    max-width: 1200px;
  }

  .card {
    max-width: 100%;
    border-radius: 0.5rem;
    background-color: #fff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid transparent;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .card a {
    text-decoration: none
  }

  .content {
    padding: 1.1rem;
  }

  .image {
    position: relative;
    width: 100%;
    height: 220px;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    overflow: hidden;
  }

  .image.placeholder {
    background-color: rgb(255, 239, 205);
  }

  .title {
    color: #111827;
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 600;
    display: block;
    margin-bottom: 0.5rem;
  }

  .price {
    font-weight: 600;
    color: #ef4444;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .desc {
    margin-top: 0.5rem;
    color: #6B7280;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .category-info {
    margin-bottom: 0.5rem;
  }

  .brand-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .brand-logo {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 50%;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6B7280;
  }

  .action {
    display: inline-flex;
    margin-top: 1rem;
    color: #ffffff;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    align-items: center;
    gap: 0.25rem;
    background-color: #2563EB;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .action span {
    transition: .3s ease;
  }

  .action:hover span {
    transform: translateX(4px);
  }
  .text-right:hover{
    text-decoration: underline;
    text-decoration-color: black;
  }
  .title:hover{
    text-decoration: underline;
    text-decoration-color: black;
  }
`;

export default ProductList;