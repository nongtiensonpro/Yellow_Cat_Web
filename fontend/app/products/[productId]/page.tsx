'use client';

import { Card, CardHeader, CardBody, Divider, Button, Spinner, Tabs, Tab } from "@heroui/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CldImage } from 'next-cloudinary';


interface ProductVariant {
  variantId: number;
  sku: string;
  price: number;
  stockLevel: number;
  imageUrl: string;
  weight: number;
  variantAttributes: string;
}

interface ProductDetail {
  productId: number;
  productName: string;
  description: string;
  purchases: number;
  productCreatedAt: string;
  productUpdatedAt: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  brandInfo: string;
  logoPublicId: string;
  variants: ProductVariant[];
  activePromotions: any | null;
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
  const productId = params.productId;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProductDetail(productId as string);
    }
  }, [productId]);

  const fetchProductDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/products/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.status === 200 && data.data) {
        setProduct(data.data);
        // Set the first variant as selected by default
        if (data.data.variants && data.data.variants.length > 0) {
          setSelectedVariant(data.data.variants[0]);
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

  // Parse variant attributes to display in a more readable format
  const parseVariantAttributes = (attributesString: string) => {
    const attributes: Record<string, string> = {};

    attributesString.split(', ').forEach(attr => {
      const [key, value] = attr.split(': ');
      if (key && value) {
        attributes[key] = value;
      }
    });

    return attributes;
  };

  // Group variants by color for the color selection UI
  const getUniqueColors = () => {
    if (!product?.variants) return [];

    const colors = new Set<string>();

    product.variants.forEach(variant => {
      const attributes = parseVariantAttributes(variant.variantAttributes);
      if (attributes['Màu sắc']) {
        colors.add(attributes['Màu sắc']);
      }
    });

    return Array.from(colors);
  };

  // Get available sizes for a specific color
  const getSizesForColor = (color: string) => {
    if (!product?.variants) return [];

    return product.variants
      .filter(variant => {
        const attributes = parseVariantAttributes(variant.variantAttributes);
        return attributes['Màu sắc'] === color;
      })
      .map(variant => {
        const attributes = parseVariantAttributes(variant.variantAttributes);
        return attributes['Kích cỡ'];
      });
  };

  // Handle variant selection
  const handleVariantSelect = (variantId: number) => {
    const variant = product?.variants.find(v => v.variantId === variantId);
    if (variant) {
      setSelectedVariant(variant);
    }
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
          <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-6xl mx-auto">
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
                  className="mr-2 rounded-full"
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
            {/* Product Image */}
            <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4">
              {selectedVariant && (
                <CldImage
                  width={400}
                  height={400}
                  src={selectedVariant.imageUrl}
                  alt={product.productName}
                  className="object-contain max-h-[400px]"
                />
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Price */}
              <div>
                <h2 className="text-3xl font-bold text-red-600">
                  {selectedVariant ? formatPrice(selectedVariant.price) : ''}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Còn lại: {selectedVariant ? selectedVariant.stockLevel : 0} sản phẩm
                </p>
              </div>

              {/* Variant Selection */}
              <div className="space-y-4">
                {/* Color Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Màu sắc:</h3>
                  <div className="flex flex-wrap gap-2">
                    {getUniqueColors().map(color => {
                      // Find a variant with this color to get its ID
                      const variantWithColor = product.variants.find(v => {
                        const attrs = parseVariantAttributes(v.variantAttributes);
                        return attrs['Màu sắc'] === color;
                      });

                      const isSelected = selectedVariant &&
                        parseVariantAttributes(selectedVariant.variantAttributes)['Màu sắc'] === color;

                      return (
                        <Button
                          key={color}
                          variant={isSelected ? "flat" : "ghost"}
                          color={isSelected ? "primary" : "default"}
                          onClick={() => variantWithColor && handleVariantSelect(variantWithColor.variantId)}
                          className="min-w-[80px]"
                        >
                          {color}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Kích cỡ:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant &&
                      getSizesForColor(parseVariantAttributes(selectedVariant.variantAttributes)['Màu sắc']).map(size => {
                        // Find the variant with this color and size
                        const variantWithSize = product.variants.find(v => {
                          const attrs = parseVariantAttributes(v.variantAttributes);
                          return attrs['Màu sắc'] === parseVariantAttributes(selectedVariant.variantAttributes)['Màu sắc'] &&
                                 attrs['Kích cỡ'] === size;
                        });

                        const isSelected = selectedVariant &&
                          parseVariantAttributes(selectedVariant.variantAttributes)['Kích cỡ'] === size;

                        return (
                          <Button
                            key={size}
                            variant={isSelected ? "flat" : "ghost"}
                            color={isSelected ? "primary" : "default"}
                            onClick={() => variantWithSize && handleVariantSelect(variantWithSize.variantId)}
                            className="min-w-[50px]"
                          >
                            {size}
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </div>

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
                    Sản phẩm đã hết hàng!
                  </p>
                )}
              </div>

              {/* SKU */}
              <div className="text-sm text-gray-500">
                SKU: {selectedVariant ? selectedVariant.sku : 'N/A'}
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="mt-10">
            <Tabs>
              <Tab title="Mô tả sản phẩm">
                <div className="p-4">
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
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
                        className="mr-4 rounded-full"
                      />
                    )}
                    <h3 className="text-xl font-bold">{product.brandName}</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{product.brandInfo}</p>
                </div>
              </Tab>
              <Tab title="Thông số kỹ thuật">
                <div className="p-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {selectedVariant && (
                        <>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Trọng lượng</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.weight} kg</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Thuộc tính</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{selectedVariant.variantAttributes}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab>
            </Tabs>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}