"use client"

import { useState, useEffect } from 'react'
import { Star, Heart, Eye } from 'lucide-react'
import Link from 'next/link'
import { CldImage } from 'next-cloudinary'
import Image from 'next/image'

interface ProductVariant {
    variantId: number
    sku: string
    colorName: string
    sizeName: string
    price: number
    salePrice: number | null
    quantityInStock: number
    sold: number
    imageUrl: string
    weight: number
    costPrice: number
}

interface FeaturedProduct {
    productId: number
    productName: string
    description: string
    purchases: number
    isActive: boolean
    createdAt: string
    updatedAt: string
    categoryId: number
    categoryName: string
    brandId: number
    brandName: string
    brandInfo: string
    logoPublicId: string
    materialId: number
    materialName: string
    targetAudienceId: number
    targetAudienceName: string
    thumbnail: string
    minPrice: number
    minSalePrice: number | null
    totalStock: number
    averageRating: number
    totalReviews: number
    variants: ProductVariant[]
}

interface ApiResponse {
    timestamp: string
    status: number
    data: FeaturedProduct
    message: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

const   FeaturedProductCard = () => {
    const [product, setProduct] = useState<FeaturedProduct | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        const fetchFeaturedProduct = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/api/products/featured`)
                
                if (!response.ok) {
                    throw new Error('Không thể tải sản phẩm được gợi ý')
                }

                const result: ApiResponse = await response.json()
                setProduct(result.data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
            } finally {
                setLoading(false)
            }
        }

        fetchFeaturedProduct()
    }, [])

    const handleAddToWishlist = () => {
        setIsWishlisted(!isWishlisted)
        // TODO: Implement wishlist functionality
    }

    const formatPrice = (price: number | null) => {
        if (price === null || isNaN(Number(price))) return 'Liên hệ'
        return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(Number(price))
    }

    const calculateDiscountPercent = (price: number | null, salePrice: number | null) => {
        if (!price || !salePrice || price <= salePrice) return null
        const percent = ((price - salePrice) / price) * 100
        return Math.round(percent)
    }

    const renderStars = (rating: number) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 !== 0

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            )
        }

        if (hasHalfStar) {
            stars.push(
                <Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            )
        }

        const emptyStars = 5 - Math.ceil(rating)
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
            )
        }

        return stars
    }

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-1/2">
                            <div className="bg-gray-200 rounded-xl h-80 w-full"></div>
                        </div>
                        <div className="lg:w-1/2 space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                    <p className="text-gray-500">Không thể tải sản phẩm được gợi ý</p>
                </div>
            </div>
        )
    }

    const discountPercent = calculateDiscountPercent(product.minPrice, product.minSalePrice)
    const displayPrice = product.minSalePrice || product.minPrice
    
    // Xử lý ảnh cho Cloudinary
    const getMainImage = () => {
        // Ưu tiên thumbnail của sản phẩm
        if (product.thumbnail) {
            return product.thumbnail
        }
        
        // Nếu không có thumbnail, lấy ảnh từ variant đầu tiên
        if (product.variants && product.variants.length > 0 && product.variants[0]?.imageUrl) {
            return product.variants[0].imageUrl
        }
        
        // Fallback image
        return '/images/img.png'
    }
    
    const mainImage = getMainImage()
    
    // Kiểm tra xem ảnh có phải từ Cloudinary không
    const isCloudinaryImage = (imageUrl: string) => {
        if (!imageUrl) return false
        // Handle absolute URLs
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            try {
                const host = new URL(imageUrl).host.toLowerCase();
                // Accept exactly res.cloudinary.com and *.res.cloudinary.com
                if (host === 'res.cloudinary.com' || host.endsWith('.res.cloudinary.com')) {
                    return true;
                }
                // Optionally handle other official cloudinary subdomains/set as needed
                return false;
            } catch {
                return false;
            }
        }
        // Handle relative and protocol-less paths (like Cloudinary's public ID format)
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            // Not a web URL, so treat as Cloudinary image string or path
            return true;
        }
        return false;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                            <h2 className="text-xl font-bold">Sản phẩm được gợi ý</h2>
                        </div>
                        {product.averageRating > 0 && (
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                    {renderStars(product.averageRating)}
                                </div>
                                <span className="text-sm">
                                    {product.averageRating.toFixed(1)} ({product.totalReviews} đánh giá)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Content */}
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Product Image */}
                        <div className="lg:w-1/2">
                            <div className="relative group">
                                <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-lg relative">
                                    {isCloudinaryImage(mainImage) && !imageError ? (
                                        <CldImage
                                            src={mainImage}
                                            alt={product.productName}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            quality={85}
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <Image
                                            src={imageError ? '/images/img.png' : mainImage}
                                            alt={product.productName}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            loading="lazy"
                                            unoptimized
                                            onError={() => setImageError(true)}
                                        />
                                    )}
                                </div>
                                
                                {/* Badges */}
                                <div className="absolute top-4 left-4 space-y-2">
                                    {discountPercent && (
                                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                            -{discountPercent}%
                                        </div>
                                    )}
                                    {product.purchases > 0 && (
                                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                            Đã bán {product.purchases}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 space-y-2">
                                    <button
                                        onClick={handleAddToWishlist}
                                        className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
                                            isWishlisted 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-white text-gray-600 hover:bg-red-50'
                                        }`}
                                        aria-label="Thêm vào yêu thích"
                                    >
                                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </button>
                                    <Link
                                        href={`/products/${product.productId}`}
                                        className="p-2 bg-white text-gray-600 rounded-full shadow-lg hover:bg-blue-50 transition-all duration-200"
                                        aria-label="Xem chi tiết"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="lg:w-1/2 space-y-6">
                            {/* Brand & Category */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">Thương hiệu:</span>
                                    <span className="text-sm font-medium text-blue-600">{product.brandName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">Danh mục:</span>
                                    <span className="text-sm font-medium text-gray-700">{product.categoryName}</span>
                                </div>
                            </div>

                            {/* Product Name */}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                                    {product.productName}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-3">
                                    {product.description}
                                </p>
                            </div>

                            {/* Rating */}
                            {product.averageRating > 0 && (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        {renderStars(product.averageRating)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {product.averageRating.toFixed(1)} ({product.totalReviews} đánh giá)
                                    </span>
                                </div>
                            )}

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-bold text-red-600">
                                        {formatPrice(displayPrice)}
                                    </span>
                                    {product.minSalePrice && product.minPrice && (
                                        <span className="text-lg text-gray-400 line-through">
                                            {formatPrice(product.minPrice)}
                                        </span>
                                    )}
                                </div>
                                {product.totalStock > 0 ? (
                                    <p className="text-sm text-green-600">
                                        Còn {product.totalStock} sản phẩm trong kho
                                    </p>
                                ) : (
                                    <p className="text-sm text-red-600">
                                        Hết hàng
                                    </p>
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Chất liệu:</span>
                                    <p className="font-medium">{product.materialName}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Đối tượng:</span>
                                    <p className="font-medium">{product.targetAudienceName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeaturedProductCard
