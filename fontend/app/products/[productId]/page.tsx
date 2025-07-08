// 'use client';
//
// import { Card, CardHeader, CardBody, Divider, Button, Spinner, Tabs, Tab } from "@heroui/react";
// import { useRouter, useParams } from "next/navigation";
// import { useState, useEffect, useCallback } from "react";
// import { CldImage } from 'next-cloudinary';
//
// import ReviewSection from "@/components/review/ReviewSection";
// import { useSession } from "next-auth/react";
//
// interface BaseEntity {
//     id: number;
//     name: string;
//     description?: string;
// }
//
// // Use type aliases instead of empty interfaces
// type ColorInfo = BaseEntity;
// type SizeInfo = BaseEntity;
// type Material = BaseEntity;
// type TargetAudience = BaseEntity;
//
// // Interface for Extended Session
// interface ExtendedSession {
//     user?: {
//         id: string;
//         name?: string | null;
//         email?: string | null;
//         image?: string | null;
//     };
//     accessToken?: string;
// }
//
// // Interface for API Error
// interface ApiError {
//     message?: string;
// }
//
// interface PaginatedResponse<T> {
//     content: T[];
//     currentPage: number;
//     totalItems: number;
//     totalPages: number;
//     size: number;
//     first: boolean;
//     last: boolean;
// }
//
// interface ApiEntitiesResponse<T> {
//     timestamp: string;
//     status: number;
//     message: string;
//     data: PaginatedResponse<T>;
// }
//
// interface ProductVariant {
//     variantId: number;
//     sku: string;
//     colorId: number;
//     sizeId: number;
//     colorName?: string;
//     sizeName?: string;
//     price: number;
//     stockLevel: number;
//     imageUrl: string;
//     weight: number;
// }
//
// interface ProductDetail {
//     productId: number;
//     productName: string;
//     description: string;
//     materialId: number;
//     targetAudienceId: number;
//     materialName?: string;
//     targetAudienceName?: string;
//     purchases: number;
//     isActive: boolean;
//     categoryId: number;
//     categoryName: string;
//     brandId: number;
//     brandName: string;
//     brandInfo: string;
//     logoPublicId: string;
//     thumbnail: string;
//     variants: ProductVariant[];
// }
//
// interface ApiResponse {
//     timestamp: string;
//     status: number;
//     message: string;
//     data: ProductDetail;
// }
//
//
// export default function ProductDetailPage() {
//     const router = useRouter();
//     const params = useParams();
//     const productId = Array.isArray(params?.productId) ? params.productId[0] : params?.productId;
//     const numericProductId = productId ? parseInt(productId as string, 10) : null;
//
//     const { data: session } = useSession() as { data: ExtendedSession | null };
//
//     const [product, setProduct] = useState<ProductDetail | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
//     const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
//     const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
//
//     const [colors, setColors] = useState<ColorInfo[]>([]);
//     const [sizes, setSizes] = useState<SizeInfo[]>([]);
//     const [materials, setMaterials] = useState<Material[]>([]);
//     const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([]);
//     const [initialFetchComplete, setInitialFetchComplete] = useState(false);
//
//     const [reviewCount, setReviewCount] = useState<number>(0);
//
//     const fetchProductDetail = useCallback(async (id: string) => {
//         console.log("ProductDetailPage: Fetching product detail for ID:", id);
//         try {
//             setError(null);
//             const response = await fetch(`http://localhost:8080/api/products/${id}`);
//
//             if (!response.ok) {
//                 const errorData: ApiError | null = await response.json().catch(() => null);
//                 throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
//             }
//
//             const apiResponse: ApiResponse = await response.json();
//
//             if (apiResponse.status === 200 && apiResponse.data) {
//                 setProduct(apiResponse.data);
//             } else {
//                 throw new Error(apiResponse.message || 'Failed to fetch product data');
//             }
//         } catch (err: unknown) {
//             const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the product';
//             console.error('ProductDetailPage: Error fetching product:', err);
//             setError(errorMessage);
//             throw err;
//         }
//     }, []);
//
//     const fetchColors = useCallback(async () => {
//         console.log("ProductDetailPage: Fetching colors...");
//         try {
//             const response = await fetch(`http://localhost:8080/api/colors`);
//             if (!response.ok) console.log(`HTTP error! Status: ${response.status} fetching colors`);
//             const data: ApiEntitiesResponse<ColorInfo> = await response.json();
//             if (data.status === 200 && data.data?.content) {
//                 setColors(data.data.content);
//             } else {
//                 console.log(data.message || 'Failed to fetch colors');
//             }
//         } catch (err: unknown) {
//             console.error('ProductDetailPage: Error fetching colors:', err);
//             throw err;
//         }
//     }, []);
//
//     const fetchSizes = useCallback(async () => {
//         console.log("ProductDetailPage: Fetching sizes...");
//         try {
//             const response = await fetch(`http://localhost:8080/api/sizes`);
//             if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching sizes`);
//             const data: ApiEntitiesResponse<SizeInfo> = await response.json();
//             if (data.status === 200 && data.data?.content) {
//                 setSizes(data.data.content);
//             } else {
//                 throw new Error(data.message || 'Failed to fetch sizes');
//             }
//         } catch (err: unknown) {
//             console.error('ProductDetailPage: Error fetching sizes:', err);
//             throw err;
//         }
//     }, []);
//
//     const fetchMaterials = useCallback(async () => {
//         console.log("ProductDetailPage: Fetching materials...");
//         try {
//             const response = await fetch(`http://localhost:8080/api/materials`);
//             if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching materials`);
//             const data: ApiEntitiesResponse<Material> = await response.json();
//             if (data.status === 200 && data.data?.content) {
//                 setMaterials(data.data.content);
//             } else {
//                 throw new Error(data.message || 'Failed to fetch materials');
//             }
//         } catch (err: unknown) {
//             console.error('ProductDetailPage: Error fetching materials:', err);
//             throw err;
//         }
//     }, []);
//
//     const fetchTargetAudiences = useCallback(async () => {
//         console.log("ProductDetailPage: Fetching target audiences...");
//         try {
//             const response = await fetch(`http://localhost:8080/api/target-audiences`);
//             if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} fetching target audiences`);
//             const data: ApiEntitiesResponse<TargetAudience> = await response.json();
//             if (data.status === 200 && data.data?.content) {
//                 setTargetAudiences(data.data.content);
//             } else {
//                 throw new Error(data.message || 'Failed to fetch target audiences');
//             }
//         } catch (err: unknown) {
//             console.error('ProductDetailPage: Error fetching target audiences:', err);
//             throw err;
//         }
//     }, []);
//
//     const handleReviewStatsLoaded = useCallback((stats: { totalReviews: number, averageRating: number }) => {
//         console.log("ProductDetailPage: Review stats loaded:", stats);
//         setReviewCount(stats.totalReviews);
//     }, []);
//
//     // Type guard for ExtendedSession
//     const isExtendedSession = (session: unknown): session is ExtendedSession => {
//         if (typeof session !== 'object' || session === null) return false;
//         const sessionObj = session as Record<string, unknown>;
//         if (!('user' in sessionObj) || typeof sessionObj.user !== 'object' || sessionObj.user === null) return false;
//         const userObj = sessionObj.user as Record<string, unknown>;
//         return 'id' in userObj && typeof userObj.id === 'string';
//     };
//
//     // Helper function - defined early to be used in useEffect
//     const getSizesForColor = useCallback((colorId: number | null, currentVariants?: ProductVariant[]): SizeInfo[] => {
//         const variantsToUse = currentVariants || product?.variants;
//         if (!variantsToUse || !colorId || sizes.length === 0) return [];
//         const sizeIds = new Set<number>();
//         variantsToUse
//             .filter(variant => variant.colorId === colorId && variant.sizeId)
//             .forEach(variant => sizeIds.add(variant.sizeId));
//         return sizes.filter(s => sizeIds.has(s.id));
//     }, [product?.variants, sizes]);
//
//     useEffect(() => {
//         console.log("ProductDetailPage: Main useEffect triggered. Raw productId:", productId, "Numeric productId:", numericProductId);
//         if (numericProductId !== null && !isNaN(numericProductId)) { // Ensure numericProductId is valid
//             setLoading(true);
//             Promise.all([
//                 fetchProductDetail(numericProductId.toString()), // Pass string productId to fetchProductDetail
//                 fetchColors(),
//                 fetchSizes(),
//                 fetchMaterials(),
//                 fetchTargetAudiences()
//             ]).then(() => {
//                 setInitialFetchComplete(true);
//                 setLoading(false); // Set loading to false only after all fetches are complete
//             }).catch(err => {
//                 // Error is already set by individual fetch functions
//                 console.error("ProductDetailPage: Error during initial fetches:", err);
//                 setLoading(false); // Ensure loading stops if Promise.all fails
//             });
//         } else {
//             setError("Invalid Product ID.");
//             setLoading(false);
//             console.error("ProductDetailPage: Invalid numericProductId, not fetching data.");
//         }
//     }, [productId, numericProductId, fetchProductDetail, fetchColors, fetchSizes, fetchMaterials, fetchTargetAudiences]);
//
//
//     // Effect to update product variants with names and set initial selected variant
//     useEffect(() => {
//         // Điều kiện cơ bản để tiếp tục – nếu thiếu dữ liệu cần thiết thì bỏ qua
//         if (!initialFetchComplete || !product || colors.length === 0 || sizes.length === 0) {
//             return;
//         }
//
//         // Kiểm tra xem biến thể đã được gán tên màu/kích cỡ hoặc thông tin bổ sung chưa
//         const variantsNeedUpdate = product.variants.some(
//             (variant) => !variant.colorName || !variant.sizeName
//         );
//         const needsAdditionalInfo =
//             (!product.materialName && materials.length > 0) ||
//             (!product.targetAudienceName && targetAudiences.length > 0);
//
//         // Nếu không cần cập nhật nữa, thoát sớm để tránh vòng lặp vô hạn
//         if (!variantsNeedUpdate && !needsAdditionalInfo) {
//             return;
//         }
//
//         console.log("ProductDetailPage: Initial fetch complete, processing variants.");
//
//         const updatedVariants = product.variants.map((variant) => ({
//             ...variant,
//             colorName: colors.find((c) => c.id === variant.colorId)?.name || "N/A",
//             sizeName: sizes.find((s) => s.id === variant.sizeId)?.name || "N/A",
//         }));
//
//         const updatedProductData = { ...product, variants: updatedVariants };
//
//         if (materials.length > 0 && targetAudiences.length > 0) {
//             updatedProductData.materialName = materials.find((m) => m.id === product.materialId)?.name;
//             updatedProductData.targetAudienceName = targetAudiences.find((ta) => ta.id === product.targetAudienceId)?.name;
//         }
//
//         setProduct(updatedProductData);
//
//         // Đặt biến thể được chọn ban đầu
//         if (updatedVariants.length > 0) {
//             const firstVariant = updatedVariants[0];
//             setSelectedVariant(firstVariant);
//             setSelectedColorId(firstVariant.colorId);
//
//             const availableSizesForFirstColor = getSizesForColor(firstVariant.colorId, updatedVariants);
//             if (availableSizesForFirstColor.length > 0) {
//                 setSelectedSizeId(availableSizesForFirstColor[0].id);
//             } else {
//                 setSelectedSizeId(null);
//             }
//         } else {
//             setSelectedVariant(null);
//             setSelectedColorId(null);
//             setSelectedSizeId(null);
//         }
//     }, [initialFetchComplete, product, colors, sizes, materials, targetAudiences, getSizesForColor]);
//
//
//     // Effect to update selectedVariant when color/size selection changes
//     useEffect(() => {
//         if (product && colors.length > 0 && sizes.length > 0) {
//             if (selectedColorId && selectedSizeId) {
//                 const variant = product.variants.find(
//                     v => v.colorId === selectedColorId && v.sizeId === selectedSizeId
//                 );
//                 setSelectedVariant(variant || null);
//             } else if (selectedColorId && !selectedSizeId) {
//                 const firstVariantOfColor = product.variants.find(v => v.colorId === selectedColorId);
//                 setSelectedVariant(firstVariantOfColor || null);
//             } else {
//                 if (!selectedColorId && !selectedSizeId) {
//                     setSelectedVariant(null);
//                 }
//             }
//         }
//     }, [product, selectedColorId, selectedSizeId, colors, sizes]);
//
//
//     // ============================================================================
//     //                             HELPER FUNCTIONS
//     // ============================================================================
//
//     const getUniqueColors = useCallback((): ColorInfo[] => {
//         if (!product?.variants || colors.length === 0) return [];
//         const colorIdsInProduct = new Set<number>();
//         product.variants.forEach(variant => {
//             if (variant.colorId) {
//                 colorIdsInProduct.add(variant.colorId);
//             }
//         });
//         return colors.filter(c => colorIdsInProduct.has(c.id));
//     }, [product?.variants, colors]);
//
//     const handleColorSelect = (colorId: number) => {
//         setSelectedColorId(colorId);
//         const availableSizesForColor = getSizesForColor(colorId);
//         if (availableSizesForColor.length > 0) {
//             const currentSizeIsAvailable = availableSizesForColor.some(s => s.id === selectedSizeId);
//             if (currentSizeIsAvailable && selectedSizeId !== null) {
//                 setSelectedSizeId(selectedSizeId);
//             } else {
//                 setSelectedSizeId(availableSizesForColor[0].id);
//             }
//         } else {
//             setSelectedSizeId(null);
//         }
//     };
//
//     const handleSizeSelect = (sizeId: number) => {
//         setSelectedSizeId(sizeId);
//     };
//
//     const formatPrice = (price: number) => {
//         return new Intl.NumberFormat('vi-VN', {
//             style: 'currency',
//             currency: 'VND'
//         }).format(price);
//     };
//
//     const handleAddToCart = async () => {
//         if (!selectedVariant || !product) {
//             alert('Vui lòng chọn một biến thể sản phẩm trước khi thêm vào giỏ hàng.');
//             return;
//         }
//
//         if (selectedVariant.stockLevel <= 0) {
//             alert('Sản phẩm này hiện đang hết hàng.');
//             return;
//         }
//
//         if (isExtendedSession(session)) {
//             // Đã đăng nhập: chỉ gọi API backend, không thao tác localStorage
//             try {
//                 const res = await fetch("http://localhost:8080/api/cart-items/add", {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                         ...(session.accessToken ? { "Authorization": `Bearer ${session.accessToken}` } : {})
//                     },
//                     body: JSON.stringify({
//                         keycloakId: session.user!.id,
//                         variantId: selectedVariant.variantId,
//                         quantity: 1
//                     })
//                 });
//                 if (!res.ok) {
//                     const err: ApiError = await res.json().catch(() => ({}));
//                     throw new Error(err.message || 'Lỗi khi thêm vào giỏ hàng');
//                 }
//                 alert('Đã thêm sản phẩm vào giỏ hàng!');
//                 router.push('/cart');
//             } catch (err: unknown) {
//                 const errorMessage = err instanceof Error ? err.message : 'Không thể thêm vào giỏ hàng';
//                 alert(errorMessage);
//             }
//         } else {
//             // Chưa đăng nhập: thêm vào localStorage
//             interface LocalCartItem {
//                 id: number;
//                 productId: number;
//                 name: string;
//                 price: number;
//                 quantity: number;
//                 imageUrl: string;
//                 sku: string;
//                 stockLevel: number;
//                 colorName: string;
//                 sizeName: string;
//             }
//
//             let localCart: LocalCartItem[] = [];
//             if (typeof window !== 'undefined') {
//                 const storedCart = localStorage.getItem('cart');
//                 if (storedCart) {
//                     localCart = JSON.parse(storedCart);
//                 }
//                 // Thêm hoặc cập nhật sản phẩm trong cart
//                 const existing = localCart.find((item: LocalCartItem) => item.id === selectedVariant.variantId);
//                 if (existing) {
//                     existing.quantity += 1;
//                 } else {
//                     localCart.push({
//                         id: selectedVariant.variantId,
//                         productId: product.productId,
//                         name: product.productName,
//                         price: selectedVariant.price,
//                         quantity: 1,
//                         imageUrl: selectedVariant.imageUrl,
//                         sku: selectedVariant.sku,
//                         stockLevel: selectedVariant.stockLevel,
//                         colorName: selectedVariant.colorName || selectedColorName || '',
//                         sizeName: selectedVariant.sizeName || selectedSizeName || ''
//                     });
//                 }
//                 localStorage.setItem('cart', JSON.stringify(localCart));
//                 alert('Đã thêm sản phẩm vào giỏ hàng!');
//                 router.push('/cart');
//             }
//         }
//     };
//
//     // ============================================================================
//     //                             RENDER LOGIC
//     // ============================================================================
//
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center min-h-screen">
//                 <Spinner label="Đang tải thông tin sản phẩm..." size="lg" />
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <Card className="w-full max-w-4xl mx-auto my-10">
//                 <CardHeader>
//                     <p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
//                         {error}. Không thể hiển thị thông tin sản phẩm. Vui lòng thử lại.
//                     </p>
//                     <Button className="mt-4" onClick={() => {
//                         if (numericProductId !== null && !isNaN(numericProductId)) {
//                             setLoading(true);
//                             setError(null);
//                             setInitialFetchComplete(false);
//                             setProduct(null);
//                             setSelectedVariant(null);
//                             setSelectedColorId(null);
//                             setSelectedSizeId(null);
//
//                             Promise.all([
//                                 fetchProductDetail(numericProductId.toString()),
//                                 fetchColors(),
//                                 fetchSizes(),
//                                 fetchMaterials(),
//                                 fetchTargetAudiences()
//                             ]).then(() => {
//                                 setInitialFetchComplete(true);
//                                 setLoading(false);
//                             }).catch(err => {
//                                 console.error("Error during retry data fetch:", err);
//                                 const errorMessage = err instanceof Error ? err.message : "Lỗi tải dữ liệu phụ trợ";
//                                 setError(errorMessage);
//                                 setLoading(false);
//                             });
//                         }
//                     }}>Thử lại</Button>
//                     <Button className="mt-4 ml-2" onClick={() => router.back()}>Quay lại</Button>
//                 </CardBody>
//             </Card>
//         );
//     }
//
//     if (!product) {
//         return (
//             <Card className="w-full max-w-4xl mx-auto my-10">
//                 <CardHeader>
//                     <p className="text-lg font-semibold text-yellow-600">Không tìm thấy sản phẩm</p>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     <p className="p-3 bg-yellow-100 border border-yellow-300 rounded-md">
//                         Không tìm thấy thông tin sản phẩm với ID: {productId}
//                     </p>
//                     <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
//                 </CardBody>
//             </Card>
//         );
//     }
//
//     const uniqueColorInfos = getUniqueColors();
//     const availableSizeInfos = selectedColorId ? getSizesForColor(selectedColorId) : [];
//     const selectedColorObject = colors.find(c => c.id === selectedColorId);
//     const selectedSizeObject = sizes.find(s => s.id === selectedSizeId);
//     const selectedColorName = selectedColorObject?.name;
//     const selectedSizeName = selectedSizeObject?.name;
//
//
//     return (
//         <div className="container mx-auto my-10 p-4 max-w-4xl">
//             <Card className="w-full">
//                 <CardHeader className="flex flex-col items-start">
//                     <div className="flex items-center gap-2 mb-2">
//                         <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => router.back()}
//                             className="text-gray-500"
//                         >
//                             &larr; Quay lại
//                         </Button>
//                         <span className="text-gray-500">|</span>
//                         <span className="text-sm text-gray-500">{product.categoryName}</span>
//                     </div>
//                     <h1 className="text-2xl font-bold">{product.productName}</h1>
//                     <div className="flex items-center mt-2">
//                         <div className="flex items-center">
//                             {product.logoPublicId && (
//                                 <CldImage
//                                     width={30}
//                                     height={30}
//                                     src={product.logoPublicId}
//                                     alt={product.brandName}
//                                     className="mr-2 rounded-full object-cover"
//                                 />
//                             )}
//                             <span className="font-medium">{product.brandName}</span>
//                         </div>
//                         <span className="mx-2 text-gray-400">•</span>
//                         <span className="text-gray-600">{product.purchases} lượt mua</span>
//                     </div>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                         <div
//                             className="flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[300px] md:min-h-[400px]">
//                             {selectedVariant && selectedVariant.imageUrl ? (
//                                 <CldImage
//                                     width={400}
//                                     height={400}
//                                     src={selectedVariant.imageUrl}
//                                     alt={`${product.productName} - ${selectedVariant.colorName} - ${selectedVariant.sizeName}`}
//                                     className="object-contain max-h-[400px]"
//                                 />
//                             ) : (
//                                 product.thumbnail ? (
//                                     <CldImage
//                                         width={400}
//                                         height={400}
//                                         src={product.thumbnail}
//                                         alt={product.productName}
//                                         className="object-contain max-h-[400px]"
//                                     />
//                                 ) : (
//                                     <div className="text-gray-500">Không có hình ảnh</div>
//                                 )
//                             )}
//                         </div>
//
//                         <div className="space-y-6">
//                             <div>
//                                 <h2 className="text-3xl font-bold text-red-600">
//                                     {selectedVariant ? formatPrice(selectedVariant.price) : (product.variants.length > 0 && product.variants[0].price ? formatPrice(product.variants[0].price) : 'N/A')}
//                                 </h2>
//                                 <p className="text-sm text-gray-500 mt-1">
//                                     Còn
//                                     lại: {selectedVariant ? selectedVariant.stockLevel : (product.variants.length > 0 ? product.variants[0].stockLevel : 0)} sản
//                                     phẩm
//                                 </p>
//                             </div>
//
//                             {product.variants && product.variants.length > 0 && (
//                                 <div className="space-y-4">
//                                     {uniqueColorInfos.length > 0 && (
//                                         <div>
//                                             <h3 className="text-sm font-medium mb-2">Màu sắc: <span
//                                                 className="font-semibold">{selectedColorName || "Chọn màu"}</span></h3>
//                                             <div className="flex flex-wrap gap-2">
//                                                 {uniqueColorInfos.map(colorInfo => (
//                                                     <Button
//                                                         key={`color-${colorInfo.id}`}
//                                                         variant={selectedColorId === colorInfo.id ? "flat" : "ghost"}
//                                                         color={selectedColorId === colorInfo.id ? "primary" : "default"}
//                                                         onClick={() => handleColorSelect(colorInfo.id)}
//                                                         className="min-w-[80px]"
//                                                     >
//                                                         {colorInfo.name}
//                                                     </Button>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     )}
//
//                                     {availableSizeInfos.length > 0 && selectedColorId && (
//                                         <div>
//                                             <h3 className="text-sm font-medium mb-2">Kích cỡ: <span
//                                                 className="font-semibold">{selectedSizeName || "Chọn kích cỡ"}</span></h3>
//                                             <div className="flex flex-wrap gap-2">
//                                                 {availableSizeInfos.map(sizeInfo => (
//                                                     <Button
//                                                         key={`size-${selectedColorId}-${sizeInfo.id}`}
//                                                         variant={selectedSizeId === sizeInfo.id ? "flat" : "ghost"}
//                                                         color={selectedSizeId === sizeInfo.id ? "primary" : "default"}
//                                                         onClick={() => handleSizeSelect(sizeInfo.id)}
//                                                         className="min-w-[50px]"
//                                                     >
//                                                         {sizeInfo.name}
//                                                     </Button>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//
//                             <div className="pt-4">
//                                 <Button
//                                     color="success"
//                                     size="lg"
//                                     className="w-full"
//                                     onClick={handleAddToCart}
//                                     disabled={!selectedVariant || selectedVariant.stockLevel <= 0}
//                                 >
//                                     Thêm vào giỏ hàng
//                                 </Button>
//                                 {selectedVariant && selectedVariant.stockLevel <= 5 && selectedVariant.stockLevel > 0 && (
//                                     <p className="text-sm text-orange-500 mt-2">
//                                         Chỉ còn {selectedVariant.stockLevel} sản phẩm, mua ngay kẻo hết!
//                                     </p>
//                                 )}
//                                 {selectedVariant && selectedVariant.stockLevel <= 0 && (
//                                     <p className="text-sm text-red-500 mt-2">
//                                         Sản phẩm này đã hết hàng!
//                                     </p>
//                                 )}
//                                 {!selectedVariant && product.variants.length > 0 && (
//                                     <p className="text-sm text-yellow-500 mt-2">
//                                         Vui lòng chọn màu sắc và kích thước.
//                                     </p>
//                                 )}
//                             </div>
//
//                             <div className="text-sm text-gray-500">
//                                 SKU: {selectedVariant ? selectedVariant.sku : 'N/A'}
//                             </div>
//                         </div>
//                     </div>
//
//                     <div className="mt-10">
//                         <Tabs>
//                             <Tab title="Mô tả sản phẩm">
//                                 <div className="p-4 prose max-w-none">
//                                     <p className="text-gray-700 leading-relaxed">{product.description || "Không có mô tả cho sản phẩm này."}</p>
//                                     {product.materialName && (
//                                         <p className="mt-2 text-sm text-gray-600"><strong>Chất liệu:</strong> {product.materialName}</p>
//                                     )}
//                                     {product.targetAudienceName && (
//                                         <p className="mt-1 text-sm text-gray-600"><strong>Đối tượng:</strong> {product.targetAudienceName}</p>
//                                     )}
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông tin thương hiệu">
//                                 <div className="p-4">
//                                     <div className="flex items-center mb-4">
//                                         {product.logoPublicId && (
//                                             <CldImage
//                                                 width={60}
//                                                 height={60}
//                                                 src={product.logoPublicId}
//                                                 alt={product.brandName}
//                                                 className="mr-4 rounded-full object-cover"
//                                             />
//                                         )}
//                                         <h3 className="text-xl font-bold">{product.brandName}</h3>
//                                     </div>
//                                     <div className="prose max-w-none">
//                                         <p className="text-gray-700 leading-relaxed">{product.brandInfo || "Không có thông tin thương hiệu."}</p>
//                                     </div>
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông số kỹ thuật">
//                                 <div className="p-4">
//                                     {selectedVariant ? (
//                                         <table className="min-w-full divide-y divide-gray-200">
//                                             <thead className="bg-gray-50">
//                                             <tr>
//                                                 <th scope="col"
//                                                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Thuộc tính
//                                                 </th>
//                                                 <th scope="col"
//                                                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                                     Giá trị
//                                                 </th>
//                                             </tr>
//                                             </thead>
//                                             <tbody className="bg-white divide-y divide-gray-200">
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mã SKU</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.sku}</td>
//                                             </tr>
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Màu sắc</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.colorName}</td>
//                                             </tr>
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Kích cỡ</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.sizeName}</td>
//                                             </tr>
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Giá</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPrice(selectedVariant.price)}</td>
//                                             </tr>
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Cân nặng</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.weight} kg</td>
//                                             </tr>
//                                             <tr>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Tồn kho</td>
//                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{selectedVariant.stockLevel}</td>
//                                             </tr>
//                                             </tbody>
//                                         </table>
//                                     ) : (
//                                         <p className="text-gray-500">Vui lòng chọn một biến thể để xem thông số kỹ thuật chi tiết.</p>
//                                     )}
//                                 </div>
//                             </Tab>
//                             {/* Review Tab - displays review count in title */}
//                             {numericProductId !== null && !isNaN(numericProductId) && (
//                                 <Tab title={`Đánh giá sản phẩm (${reviewCount})`}>
//                                     <div className="p-4">
//                                         <ReviewSection
//                                             productId={numericProductId}
//                                             onReviewStatsChange={handleReviewStatsLoaded} // Correct prop name and callback
//                                         />
//                                     </div>
//                                 </Tab>
//                             )}
//                         </Tabs>
//                     </div>
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }
//
//


'use client';

import {
    Card,
    CardHeader,
    CardBody,
    Divider,
    Button,
    Spinner,
    Tabs,
    Tab,
} from '@heroui/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CldImage } from 'next-cloudinary';
import { useSession } from 'next-auth/react';
import ReviewSection from '@/components/review/ReviewSection';

interface Base { id: number; name: string }
type ColorInfo = Base;
type SizeInfo  = Base;
type Material  = Base;
type TargetAud = Base;

interface Variant {
    variantId: number;
    sku: string;
    colorId: number;
    sizeId: number;
    price: number;
    salePrice?: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
    colorName?: string;
    sizeName?: string;
}

interface Product {
    productId: number;
    productName: string;
    description: string;
    categoryName: string;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    thumbnail: string;
    purchases: number;
    materialId: number;
    targetAudienceId: number;
    variants: Variant[];
    materialName?: string;
    targetAudienceName?: string;
}

interface ApiWrap<T> { status: number; data: T }
interface Paged<T> { status: number; data: { content: T[] } }
interface ExtSession { user?: { id: string }; accessToken?: string }

const money = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const percent = (orig: number, sale: number) =>
    Math.round((1 - sale / orig) * 100);
const fetchJSON = async <T,>(url: string) => {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as T;
    } catch (e) {
        console.error(url, e);
        return null;
    }
};

export default function ProductDetailPage() {
    const router = useRouter();
    const { productId } = useParams<{ productId: string }>();
    const { data: session } = useSession() as { data: ExtSession | null };

    const [product, setProduct] = useState<Product | null>(null);
    const [colors, setColors] = useState<ColorInfo[]>([]);
    const [sizes, setSizes] = useState<SizeInfo[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [targets, setTargets] = useState<TargetAud[]>([]);
    const [selColorId, setSelColorId] = useState<number | null>(null);
    const [selSizeId, setSelSizeId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewCnt, setReviewCnt] = useState(0);

    const loadAll = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        const [p, c, s, m, t] = await Promise.allSettled([
            fetchJSON<ApiWrap<Product>>(`http://localhost:8080/api/products/${id}`),
            fetchJSON<Paged<ColorInfo>>('http://localhost:8080/api/colors'),
            fetchJSON<Paged<SizeInfo>>('http://localhost:8080/api/sizes'),
            fetchJSON<Paged<Material>>('http://localhost:8080/api/materials'),
            fetchJSON<Paged<TargetAud>>('http://localhost:8080/api/target-audiences'),
        ]);
        if (p.status === 'fulfilled' && p.value?.data) setProduct(p.value.data);
        else setError('Không tải được thông tin sản phẩm');
        if (c.status === 'fulfilled' && c.value?.data) setColors(c.value.data.content);
        if (s.status === 'fulfilled' && s.value?.data) setSizes(s.value.data.content);
        if (m.status === 'fulfilled' && m.value?.data) setMaterials(m.value.data.content);
        if (t.status === 'fulfilled' && t.value?.data) setTargets(t.value.data.content);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (productId) loadAll(productId);
    }, [productId, loadAll]);

    const variants = useMemo(() => {
        if (!product) return [];
        return product.variants.map(v => ({
            ...v,
            colorName: colors.find(c => c.id === v.colorId)?.name,
            sizeName: sizes.find(s => s.id === v.sizeId)?.name,
        }));
    }, [product, colors, sizes]);

    const view = useMemo(() => {
        if (!product) return null;
        return {
            ...product,
            materialName: materials.find(m => m.id === product.materialId)?.name,
            targetAudienceName: targets.find(t => t.id === product.targetAudienceId)?.name,
            variants,
        };
    }, [product, materials, targets, variants]);

    useEffect(() => {
        if (variants.length && selColorId === null) {
            setSelColorId(variants[0].colorId);
            setSelSizeId(variants[0].sizeId);
        }
    }, [variants, selColorId]);

    const sizesForColor = useMemo(() => {
        if (!selColorId) return [];
        const ids = new Set(variants.filter(v => v.colorId === selColorId).map(v => v.sizeId));
        return sizes.filter(s => ids.has(s.id));
    }, [selColorId, variants, sizes]);

    const selected = variants.find(v => v.colorId === selColorId && v.sizeId === selSizeId) ?? variants[0];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner label="Đang tải thông tin sản phẩm…" size="lg" />
        </div>
    );
    if (error || !view) return (
        <div className="text-center mt-20">
            <p className="text-red-600 mb-4">{error ?? 'Không tìm thấy sản phẩm'}</p>
            <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
    );

    return (
        <div className="container mx-auto my-10 p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">{view.productName}</h1>
                    <div className="flex items-center mt-1 text-gray-600 text-sm">
                        {view.logoPublicId && (
                            <CldImage width={20} height={20} src={view.logoPublicId} alt="" className="mr-2 rounded-full" />
                        )}
                        {view.brandName}
                        <span className="mx-2">•</span>
                        {view.purchases} lượt mua
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image */}
                        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
                            {selected.imageUrl ? (
                                <CldImage src={selected.imageUrl} width={400} height={400} alt="" className="object-contain" />
                            ) : view.thumbnail ? (
                                <CldImage src={view.thumbnail} width={400} height={400} alt="" className="object-contain" />
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="space-y-6">
                            {/* Price & Discount */}
                            {selected.salePrice != null && selected.salePrice < selected.price ? (
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-bold text-red-600">
                                        {money(selected.salePrice)}
                                    </p>
                                    <p className="text-lg line-through text-gray-400">
                                        {money(selected.price)}
                                    </p>
                                    <span className="px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg
                                    hover:scale-105 transition-transform">
                    -{percent(selected.price, selected.salePrice)}%
                  </span>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-red-600">
                                    {money(selected.price)}
                                </p>
                            )}

                            {/* Color */}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Màu:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(variants.map(v => v.colorId))).map(cid => {
                                        const c = colors.find(x => x.id === cid);
                                        return (
                                            <Button
                                                key={cid}
                                                variant={cid === selColorId ? 'flat' : 'ghost'}
                                                color={cid === selColorId ? 'primary' : 'default'}
                                                onClick={() => setSelColorId(cid)}
                                            >
                                                {c?.name}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Size */}
                            <div>
                                <h3 className="text-sm font-medium mb-1">Kích cỡ:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {sizesForColor.map(s => (
                                        <Button
                                            key={s.id}
                                            variant={s.id === selSizeId ? 'flat' : 'ghost'}
                                            color={s.id === selSizeId ? 'primary' : 'default'}
                                            onClick={() => setSelSizeId(s.id)}
                                        >
                                            {s.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button color="success" className="w-full" disabled={selected.stockLevel <= 0}>
                                Thêm vào giỏ hàng
                            </Button>
                            {selected.stockLevel <= 0 && (
                                <p className="text-sm text-red-500">Đã hết hàng</p>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-10">
                        <Tabs>
                            <Tab title="Mô tả sản phẩm">
                                <div className="p-4 prose max-w-none">
                                    {view.description}
                                    {view.materialName && <p><strong>Chất liệu:</strong> {view.materialName}</p>}
                                    {view.targetAudienceName && (
                                        <p><strong>Đối tượng:</strong> {view.targetAudienceName}</p>
                                    )}
                                </div>
                            </Tab>
                            <Tab title="Thông tin thương hiệu">
                                <div className="p-4 prose max-w-none">
                                    <h3 className="text-lg font-semibold mb-2">{view.brandName}</h3>
                                    <p>{view.brandInfo}</p>
                                </div>
                            </Tab>
                            <Tab title="Thông số kỹ thuật">
                                <div className="p-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuộc tính</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">SKU</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{selected.sku}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Màu</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{selected.colorName}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Size</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{selected.sizeName}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá gốc</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{money(selected.price)}</td>
                                        </tr>
                                        {selected.salePrice != null && (
                                            <tr>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá sale</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{money(selected.salePrice)}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Cân nặng</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{selected.weight} kg</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Tồn kho</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{selected.stockLevel}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                            <Tab title={`Đánh giá sản phẩm (${reviewCnt})`}>
                                <div className="p-4">
                                    <ReviewSection
                                        productId={view.productId}
                                        onReviewStatsChange={s => setReviewCnt(s.totalReviews)}
                                    />
                                </div>
                            </Tab>
                        </Tabs>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
