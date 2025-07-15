// 'use client';
//
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     Divider,
//     Button,
//     Spinner,
//     Tabs,
//     Tab,
// } from '@heroui/react';
// import { useRouter, useParams } from 'next/navigation';
// import { useState, useEffect, useCallback, useMemo } from 'react';
// import { CldImage } from 'next-cloudinary';
// import ReviewSection from '@/components/review/ReviewSection';
//
// interface Base { id: number; name: string }
// type ColorInfo = Base;
// type SizeInfo  = Base;
// type Material  = Base;
// type TargetAud = Base;
//
// interface Variant {
//     variantId: number;
//     sku: string;
//     colorId: number;
//     sizeId: number;
//     price: number;
//     salePrice?: number;
//     stockLevel: number;
//     imageUrl: string;
//     weight: number;
//     colorName?: string;
//     sizeName?: string;
// }
//
// interface Product {
//     productId: number;
//     productName: string;
//     description: string;
//     categoryName: string;
//     brandName: string;
//     brandInfo: string;
//     logoPublicId: string;
//     thumbnail: string;
//     purchases: number;
//     materialId: number;
//     targetAudienceId: number;
//     variants: Variant[];
//     materialName?: string;
//     targetAudienceName?: string;
// }
//
// interface ApiWrap<T> { status: number; data: T }
// interface Paged<T> { status: number; data: { content: T[] } }
//
// const money = (n: number) =>
//     new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
// const percent = (orig: number, sale: number) =>
//     Math.round((1 - sale / orig) * 100);
// const fetchJSON = async <T,>(url: string) => {
//     try {
//         const res = await fetch(url);
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return (await res.json()) as T;
//     } catch (e) {
//         console.error(url, e);
//         return null;
//     }
// };
//
// export default function ProductDetailPage() {
//     const router = useRouter();
//     const params = useParams<{ productId: string }>();
//     const productId = params?.productId;
//
//
//     const [product, setProduct] = useState<Product | null>(null);
//     const [colors, setColors] = useState<ColorInfo[]>([]);
//     const [sizes, setSizes] = useState<SizeInfo[]>([]);
//     const [materials, setMaterials] = useState<Material[]>([]);
//     const [targets, setTargets] = useState<TargetAud[]>([]);
//     const [selColorId, setSelColorId] = useState<number | null>(null);
//     const [selSizeId, setSelSizeId] = useState<number | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [reviewCnt, setReviewCnt] = useState(0);
//
//     const loadAll = useCallback(async (id: string) => {
//         setLoading(true);
//         setError(null);
//         const [p, c, s, m, t] = await Promise.allSettled([
//             fetchJSON<ApiWrap<Product>>(`http://localhost:8080/api/products/${id}`),
//             fetchJSON<Paged<ColorInfo>>('http://localhost:8080/api/colors'),
//             fetchJSON<Paged<SizeInfo>>('http://localhost:8080/api/sizes'),
//             fetchJSON<Paged<Material>>('http://localhost:8080/api/materials'),
//             fetchJSON<Paged<TargetAud>>('http://localhost:8080/api/target-audiences'),
//         ]);
//         if (p.status === 'fulfilled' && p.value?.data) setProduct(p.value.data);
//         else setError('Không tải được thông tin sản phẩm');
//         if (c.status === 'fulfilled' && c.value?.data) setColors(c.value.data.content);
//         if (s.status === 'fulfilled' && s.value?.data) setSizes(s.value.data.content);
//         if (m.status === 'fulfilled' && m.value?.data) setMaterials(m.value.data.content);
//         if (t.status === 'fulfilled' && t.value?.data) setTargets(t.value.data.content);
//         setLoading(false);
//     }, []);
//
//     useEffect(() => {
//         if (productId) loadAll(productId);
//     }, [productId, loadAll]);
//
//     const variants = useMemo(() => {
//         if (!product) return [];
//         return product.variants.map(v => ({
//             ...v,
//             colorName: colors.find(c => c.id === v.colorId)?.name,
//             sizeName: sizes.find(s => s.id === v.sizeId)?.name,
//         }));
//     }, [product, colors, sizes]);
//
//     const view = useMemo(() => {
//         if (!product) return null;
//         return {
//             ...product,
//             materialName: materials.find(m => m.id === product.materialId)?.name,
//             targetAudienceName: targets.find(t => t.id === product.targetAudienceId)?.name,
//             variants,
//         };
//     }, [product, materials, targets, variants]);
//
//     useEffect(() => {
//         if (variants.length && selColorId === null) {
//             setSelColorId(variants[0].colorId);
//             setSelSizeId(variants[0].sizeId);
//         }
//     }, [variants, selColorId]);
//
//     const sizesForColor = useMemo(() => {
//         if (!selColorId) return [];
//         const ids = new Set(variants.filter(v => v.colorId === selColorId).map(v => v.sizeId));
//         return sizes.filter(s => ids.has(s.id));
//     }, [selColorId, variants, sizes]);
//
//     const selected = variants.find(v => v.colorId === selColorId && v.sizeId === selSizeId) ?? variants[0];
//
//     if (loading) return (
//         <div className="flex items-center justify-center min-h-screen">
//             <Spinner label="Đang tải thông tin sản phẩm…" size="lg" />
//         </div>
//     );
//     if (error || !view) return (
//         <div className="text-center mt-20">
//             <p className="text-red-600 mb-4">{error ?? 'Không tìm thấy sản phẩm'}</p>
//             <Button onClick={() => router.back()}>Quay lại</Button>
//         </div>
//     );
//
//     return (
//         <div className="container mx-auto my-10 p-4 max-w-4xl">
//             <Card>
//                 <CardHeader>
//                     <h1 className="text-2xl font-bold">{view.productName}</h1>
//                     <div className="flex items-center mt-1 text-gray-600 text-sm">
//                         {view.logoPublicId && (
//                             <CldImage width={20} height={20} src={view.logoPublicId} alt="" className="mr-2 rounded-full" />
//                         )}
//                         {view.brandName}
//                         <span className="mx-2">•</span>
//                         {view.purchases} lượt mua
//                     </div>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     <div className="grid md:grid-cols-2 gap-8">
//                         {/* Image */}
//                         <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
//                             {selected.imageUrl ? (
//                                 <CldImage src={selected.imageUrl} width={400} height={400} alt="" className="object-contain" />
//                             ) : view.thumbnail ? (
//                                 <CldImage src={view.thumbnail} width={400} height={400} alt="" className="object-contain" />
//                             ) : (
//                                 <span className="text-gray-400">No image</span>
//                             )}
//                         </div>
//
//                         {/* Info */}
//                         <div className="space-y-6">
//                             {/* Price & Discount */}
//                             {selected.salePrice != null && selected.salePrice < selected.price ? (
//                                 <div className="flex items-end gap-3">
//                                     <p className="text-4xl font-bold text-red-600">
//                                         {money(selected.salePrice)}
//                                     </p>
//                                     <p className="text-lg line-through text-gray-400">
//                                         {money(selected.price)}
//                                     </p>
//                                     <span className="px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg
//                                     hover:scale-105 transition-transform">
//                     -{percent(selected.price, selected.salePrice)}%
//                   </span>
//                                 </div>
//                             ) : (
//                                 <p className="text-4xl font-bold text-red-600">
//                                     {money(selected.price)}
//                                 </p>
//                             )}
//
//                             {/* Color */}
//                             <div>
//                                 <h3 className="text-sm font-medium mb-1">Màu:</h3>
//                                 <div className="flex flex-wrap gap-2">
//                                     {Array.from(new Set(variants.map(v => v.colorId))).map(cid => {
//                                         const c = colors.find(x => x.id === cid);
//                                         return (
//                                             <Button
//                                                 key={cid}
//                                                 variant={cid === selColorId ? 'flat' : 'ghost'}
//                                                 color={cid === selColorId ? 'primary' : 'default'}
//                                                 onClick={() => setSelColorId(cid)}
//                                             >
//                                                 {c?.name}
//                                             </Button>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//
//                             {/* Size */}
//                             <div>
//                                 <h3 className="text-sm font-medium mb-1">Kích cỡ:</h3>
//                                 <div className="flex flex-wrap gap-2">
//                                     {sizesForColor.map(s => (
//                                         <Button
//                                             key={s.id}
//                                             variant={s.id === selSizeId ? 'flat' : 'ghost'}
//                                             color={s.id === selSizeId ? 'primary' : 'default'}
//                                             onClick={() => setSelSizeId(s.id)}
//                                         >
//                                             {s.name}
//                                         </Button>
//                                     ))}
//                                 </div>
//                             </div>
//
//                             <Button color="success" className="w-full" disabled={selected.stockLevel <= 0}>
//                                 Thêm vào giỏ hàng
//                             </Button>
//                             {selected.stockLevel <= 0 && (
//                                 <p className="text-sm text-red-500">Đã hết hàng</p>
//                             )}
//                         </div>
//                     </div>
//
//                     {/* Tabs */}
//                     <div className="mt-10">
//                         <Tabs>
//                             <Tab title="Mô tả sản phẩm">
//                                 <div className="p-4 prose max-w-none">
//                                     {view.description}
//                                     {view.materialName && <p><strong>Chất liệu:</strong> {view.materialName}</p>}
//                                     {view.targetAudienceName && (
//                                         <p><strong>Đối tượng:</strong> {view.targetAudienceName}</p>
//                                     )}
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông tin thương hiệu">
//                                 <div className="p-4 prose max-w-none">
//                                     <h3 className="text-lg font-semibold mb-2">{view.brandName}</h3>
//                                     <p>{view.brandInfo}</p>
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông số kỹ thuật">
//                                 <div className="p-4 overflow-x-auto">
//                                     <table className="min-w-full divide-y divide-gray-200">
//                                         <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuộc tính</th>
//                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
//                                         </tr>
//                                         </thead>
//                                         <tbody className="bg-white divide-y divide-gray-200">
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">SKU</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.sku}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Màu</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.colorName}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Size</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.sizeName}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá gốc</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{money(selected.price)}</td>
//                                         </tr>
//                                         {selected.salePrice != null && (
//                                             <tr>
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá sale</td>
//                                                 <td className="px-6 py-4 text-sm text-gray-700">{money(selected.salePrice)}</td>
//                                             </tr>
//                                         )}
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Cân nặng</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.weight} kg</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Tồn kho</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.stockLevel}</td>
//                                         </tr>
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </Tab>
//                             <Tab title={`Đánh giá sản phẩm (${reviewCnt})`}>
//                                 <div className="p-4">
//                                     <ReviewSection
//                                         productId={view.productId}
//                                         onReviewStatsChange={s => setReviewCnt(s.totalReviews)}
//                                     />
//                                 </div>
//                             </Tab>
//                         </Tabs>
//                     </div>
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }

//
// 'use client';
//
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     Divider,
//     Button,
//     Spinner,
//     Tabs,
//     Tab,
// } from '@heroui/react';
// import { useRouter, useParams } from 'next/navigation';
// import { useState, useEffect, useCallback, useMemo } from 'react';
// import { CldImage } from 'next-cloudinary';
// import ReviewSection from '@/components/review/ReviewSection';
//
// // --- Interfaces ---
// interface Base { id: number; name: string }
// type ColorInfo = Base;
// type SizeInfo  = Base;
// type Material  = Base;
// type TargetAud = Base;
//
// interface Variant {
//     variantId: number;
//     sku: string;
//     colorId: number;
//     sizeId: number;
//     price: number;
//     salePrice?: number;
//     stockLevel: number;
//     imageUrl: string;
//     weight: number;
//     colorName?: string;
//     sizeName?: string;
// }
//
// interface Product {
//     productId: number;
//     productName: string;
//     description: string;
//     categoryName: string;
//     brandName: string;
//     brandInfo: string;
//     logoPublicId: string;
//     thumbnail: string;
//     purchases: number;
//     materialId: number;
//     targetAudienceId: number;
//     variants: Variant[];
//     materialName?: string;
//     targetAudienceName?: string;
// }
//
// // Định nghĩa cấu trúc item trong giỏ hàng
// interface CartItem {
//     id: number; // variantId
//     productId: number;
//     productName: string;
//     name: string;
//     price: number;
//     quantity: number;
//     imageUrl: string;
//     sku: string;
//     stockLevel: number;
//     colorName?: string;
//     sizeName?: string;
// }
//
//
// interface ApiWrap<T> { status: number; data: T }
// interface Paged<T> { status: number; data: { content: T[] } }
//
// const money = (n: number) =>
//     new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
// const percent = (orig: number, sale: number) =>
//     Math.round((1 - sale / orig) * 100);
// const fetchJSON = async <T,>(url: string) => {
//     try {
//         const res = await fetch(url);
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return (await res.json()) as T;
//     } catch (e) {
//         console.error(url, e);
//         return null;
//     }
// };
//
// export default function ProductDetailPage() {
//     const router = useRouter();
//     const params = useParams<{ productId: string }>();
//     const productId = params?.productId;
//
//
//     const [product, setProduct] = useState<Product | null>(null);
//     const [colors, setColors] = useState<ColorInfo[]>([]);
//     const [sizes, setSizes] = useState<SizeInfo[]>([]);
//     const [materials, setMaterials] = useState<Material[]>([]);
//     const [targets, setTargets] = useState<TargetAud[]>([]);
//     const [selColorId, setSelColorId] = useState<number | null>(null);
//     const [selSizeId, setSelSizeId] = useState<number | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [reviewCnt, setReviewCnt] = useState(0);
//
//     // BƯỚC 1: THÊM STATE CHO SỐ LƯỢNG
//     const [quantity, setQuantity] = useState(1);
//
//     const loadAll = useCallback(async (id: string) => {
//         setLoading(true);
//         setError(null);
//         const [p, c, s, m, t] = await Promise.allSettled([
//             fetchJSON<ApiWrap<Product>>(`http://localhost:8080/api/products/${id}`),
//             fetchJSON<Paged<ColorInfo>>('http://localhost:8080/api/colors'),
//             fetchJSON<Paged<SizeInfo>>('http://localhost:8080/api/sizes'),
//             fetchJSON<Paged<Material>>('http://localhost:8080/api/materials'),
//             fetchJSON<Paged<TargetAud>>('http://localhost:8080/api/target-audiences'),
//         ]);
//         if (p.status === 'fulfilled' && p.value?.data) setProduct(p.value.data);
//         else setError('Không tải được thông tin sản phẩm');
//         if (c.status === 'fulfilled' && c.value?.data) setColors(c.value.data.content);
//         if (s.status === 'fulfilled' && s.value?.data) setSizes(s.value.data.content);
//         if (m.status === 'fulfilled' && m.value?.data) setMaterials(m.value.data.content);
//         if (t.status === 'fulfilled' && t.value?.data) setTargets(t.value.data.content);
//         setLoading(false);
//     }, []);
//
//     useEffect(() => {
//         if (productId) loadAll(productId);
//     }, [productId, loadAll]);
//
//     const variants = useMemo(() => {
//         if (!product) return [];
//         return product.variants.map(v => ({
//             ...v,
//             colorName: colors.find(c => c.id === v.colorId)?.name,
//             sizeName: sizes.find(s => s.id === v.sizeId)?.name,
//         }));
//     }, [product, colors, sizes]);
//
//     const view = useMemo(() => {
//         if (!product) return null;
//         return {
//             ...product,
//             materialName: materials.find(m => m.id === product.materialId)?.name,
//             targetAudienceName: targets.find(t => t.id === product.targetAudienceId)?.name,
//             variants,
//         };
//     }, [product, materials, targets, variants]);
//
//     useEffect(() => {
//         if (variants.length > 0 && selColorId === null) {
//             setSelColorId(variants[0].colorId);
//             setSelSizeId(variants[0].sizeId);
//         }
//     }, [variants, selColorId]);
//
//     const sizesForColor = useMemo(() => {
//         if (!selColorId) return [];
//         const ids = new Set(variants.filter(v => v.colorId === selColorId).map(v => v.sizeId));
//         return sizes.filter(s => ids.has(s.id));
//     }, [selColorId, variants, sizes]);
//
//     const selected = variants.find(v => v.colorId === selColorId && v.sizeId === selSizeId) ?? variants[0];
//
//     // Reset số lượng về 1 khi sản phẩm thay đổi
//     useEffect(() => {
//         setQuantity(1);
//     }, [selected]);
//
//
//     // BƯỚC 2: VIẾT HÀM XỬ LÝ THÊM VÀO GIỎ
//     const handleAddToCart = () => {
//         if (!selected || !view) {
//             alert('Lỗi: Không tìm thấy thông tin sản phẩm.');
//             return;
//         }
//
//         // Lấy giỏ hàng từ localStorage, nếu không có thì tạo mảng rỗng
//         const currentCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
//
//         // Tìm xem sản phẩm đã có trong giỏ chưa
//         const existingItemIndex = currentCart.findIndex(item => item.id === selected.variantId);
//
//         if (existingItemIndex > -1) {
//             // Nếu có, cộng dồn số lượng
//             const newQuantity = currentCart[existingItemIndex].quantity + quantity;
//             if (newQuantity > selected.stockLevel) {
//                 alert(`Số lượng trong giỏ hàng (${newQuantity}) không được vượt quá tồn kho (${selected.stockLevel}).`);
//                 return;
//             }
//             currentCart[existingItemIndex].quantity = newQuantity;
//         } else {
//             // Nếu chưa có, thêm item mới vào giỏ
//             const newItem: CartItem = {
//                 id: selected.variantId,
//                 productId: view.productId,
//                 productName: view.productName,
//                 name: `${view.productName} - ${selected.colorName} / ${selected.sizeName}`,
//                 price: selected.salePrice ?? selected.price,
//                 quantity: quantity,
//                 imageUrl: selected.imageUrl,
//                 sku: selected.sku,
//                 stockLevel: selected.stockLevel,
//                 colorName: selected.colorName,
//                 sizeName: selected.sizeName
//             };
//             currentCart.push(newItem);
//         }
//
//         // Lưu lại giỏ hàng mới vào localStorage
//         localStorage.setItem('cart', JSON.stringify(currentCart));
//         alert(`Đã thêm ${quantity} sản phẩm "${view.productName}" vào giỏ hàng!`);
//     };
//
//     const handleQuantityChange = (amount: number) => {
//         const newQuantity = quantity + amount;
//         if (newQuantity >= 1 && newQuantity <= selected.stockLevel) {
//             setQuantity(newQuantity);
//         }
//     };
//
//     if (loading) return (
//         <div className="flex items-center justify-center min-h-screen">
//             <Spinner label="Đang tải thông tin sản phẩm…" size="lg" />
//         </div>
//     );
//     if (error || !view) return (
//         <div className="text-center mt-20">
//             <p className="text-red-600 mb-4">{error ?? 'Không tìm thấy sản phẩm'}</p>
//             <Button onClick={() => router.back()}>Quay lại</Button>
//         </div>
//     );
//
//     return (
//         <div className="container mx-auto my-10 p-4 max-w-4xl">
//             <Card>
//                 <CardHeader>
//                     <h1 className="text-2xl font-bold">{view.productName}</h1>
//                     <div className="flex items-center mt-1 text-gray-600 text-sm">
//                         {view.logoPublicId && (
//                             <CldImage width={20} height={20} src={view.logoPublicId} alt="" className="mr-2 rounded-full" />
//                         )}
//                         {view.brandName}
//                         <span className="mx-2">•</span>
//                         {view.purchases} lượt mua
//                     </div>
//                 </CardHeader>
//                 <Divider />
//                 <CardBody>
//                     <div className="grid md:grid-cols-2 gap-8">
//                         {/* Image */}
//                         <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
//                             {selected.imageUrl ? (
//                                 <CldImage src={selected.imageUrl} width={400} height={400} alt={view.productName} className="object-contain" />
//                             ) : view.thumbnail ? (
//                                 <CldImage src={view.thumbnail} width={400} height={400} alt={view.productName} className="object-contain" />
//                             ) : (
//                                 <span className="text-gray-400">No image</span>
//                             )}
//                         </div>
//
//                         {/* Info */}
//                         <div className="space-y-6">
//                             {/* Price & Discount */}
//                             {selected.salePrice != null && selected.salePrice < selected.price ? (
//                                 <div className="flex items-end gap-3">
//                                     <p className="text-4xl font-bold text-red-600">{money(selected.salePrice)}</p>
//                                     <p className="text-lg line-through text-gray-400">{money(selected.price)}</p>
//                                     <span className="px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg hover:scale-105 transition-transform">
//                                         -{percent(selected.price, selected.salePrice)}%
//                                     </span>
//                                 </div>
//                             ) : (
//                                 <p className="text-4xl font-bold text-red-600">{money(selected.price)}</p>
//                             )}
//
//                             {/* Color */}
//                             <div>
//                                 <h3 className="text-sm font-medium mb-1">Màu: <span className="font-semibold">{selected.colorName}</span></h3>
//                                 <div className="flex flex-wrap gap-2">
//                                     {Array.from(new Set(variants.map(v => v.colorId))).map(cid => {
//                                         const c = colors.find(x => x.id === cid);
//                                         return (
//                                             <Button
//                                                 key={cid}
//                                                 variant={cid === selColorId ? 'flat' : 'ghost'}
//                                                 color={cid === selColorId ? 'primary' : 'default'}
//                                                 onClick={() => setSelColorId(cid)}
//                                             >
//                                                 {c?.name}
//                                             </Button>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//
//                             {/* Size */}
//                             <div>
//                                 <h3 className="text-sm font-medium mb-1">Kích cỡ:</h3>
//                                 <div className="flex flex-wrap gap-2">
//                                     {sizesForColor.map(s => (
//                                         <Button
//                                             key={s.id}
//                                             variant={s.id === selSizeId ? 'flat' : 'ghost'}
//                                             color={s.id === selSizeId ? 'primary' : 'default'}
//                                             onClick={() => setSelSizeId(s.id)}
//                                         >
//                                             {s.name}
//                                         </Button>
//                                     ))}
//                                 </div>
//                             </div>
//
//                             {/* BƯỚC 3: THÊM GIAO DIỆN CHỌN SỐ LƯỢNG */}
//                             <div>
//                                 <h3 className="text-sm font-medium mb-1">Số lượng:</h3>
//                                 <div className="flex items-center gap-2">
//                                     <Button size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</Button>
//                                     <input
//                                         type="text"
//                                         value={quantity}
//                                         readOnly
//                                         className="w-12 text-center p-1 border-gray-300 rounded-md"
//                                     />
//                                     <Button size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= selected.stockLevel}>+</Button>
//                                     <span className="text-sm text-gray-500">
//                                         ({selected.stockLevel} sản phẩm có sẵn)
//                                     </span>
//                                 </div>
//                             </div>
//
//                             {/* BƯỚC 4: GÁN ONCLICK VÀO NÚT */}
//                             <Button
//                                 color="success"
//                                 className="w-full text-white font-bold py-3"
//                                 disabled={selected.stockLevel <= 0}
//                                 onClick={handleAddToCart}
//                             >
//                                 Thêm vào giỏ hàng
//                             </Button>
//                             {selected.stockLevel <= 0 && (
//                                 <p className="text-sm text-center text-red-500">Sản phẩm tạm thời hết hàng</p>
//                             )}
//                         </div>
//                     </div>
//
//                     {/* Tabs */}
//                     <div className="mt-10">
//                         <Tabs>
//                             <Tab title="Mô tả sản phẩm">
//                                 <div className="p-4 prose max-w-none">
//                                     <p>{view.description}</p>
//                                     {view.materialName && <p><strong>Chất liệu:</strong> {view.materialName}</p>}
//                                     {view.targetAudienceName && (
//                                         <p><strong>Đối tượng:</strong> {view.targetAudienceName}</p>
//                                     )}
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông tin thương hiệu">
//                                 <div className="p-4 prose max-w-none">
//                                     <h3 className="text-lg font-semibold mb-2">{view.brandName}</h3>
//                                     <p>{view.brandInfo}</p>
//                                 </div>
//                             </Tab>
//                             <Tab title="Thông số kỹ thuật">
//                                 <div className="p-4 overflow-x-auto">
//                                     <table className="min-w-full divide-y divide-gray-200">
//                                         <thead className="bg-gray-50">
//                                         <tr>
//                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuộc tính</th>
//                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
//                                         </tr>
//                                         </thead>
//                                         <tbody className="bg-white divide-y divide-gray-200">
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">SKU</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.sku}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Màu</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.colorName}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Size</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.sizeName}</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá gốc</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{money(selected.price)}</td>
//                                         </tr>
//                                         {selected.salePrice != null && (
//                                             <tr>
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900">Giá sale</td>
//                                                 <td className="px-6 py-4 text-sm text-gray-700">{money(selected.salePrice)}</td>
//                                             </tr>
//                                         )}
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Cân nặng</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.weight} kg</td>
//                                         </tr>
//                                         <tr>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900">Tồn kho</td>
//                                             <td className="px-6 py-4 text-sm text-gray-700">{selected.stockLevel}</td>
//                                         </tr>
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </Tab>
//                             <Tab title={`Đánh giá sản phẩm (${reviewCnt})`}>
//                                 <div className="p-4">
//                                     <ReviewSection
//                                         productId={view.productId}
//                                         onReviewStatsChange={s => setReviewCnt(s.totalReviews)}
//                                     />
//                                 </div>
//                             </Tab>
//                         </Tabs>
//                     </div>
//                 </CardBody>
//             </Card>
//         </div>
//     );
//
// }


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
import { getSession } from 'next-auth/react';
import ReviewSection from '@/components/review/ReviewSection';

// --- Interfaces ---
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

interface CartItem {
    id: number; // variantId
    productId: number;
    productName: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
    stockLevel: number;
    colorName?: string;
    sizeName?: string;
}

interface ApiWrap<T> { status: number; data: T }
interface Paged<T> { status: number; data: { content: T[] } }

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
    const params = useParams<{ productId: string }>();
    const productId = params?.productId;


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
    const [quantity, setQuantity] = useState(1);

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
        if (variants.length > 0 && selColorId === null) {
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

    useEffect(() => {
        setQuantity(1);
    }, [selected]);

    const handleAddToCart = async () => {
        if (!selected || !view) {
            alert('Lỗi: Không tìm thấy thông tin sản phẩm.');
            return;
        }
        // Validate chọn màu và size
        if (!selColorId || !selSizeId) {
            alert('Vui lòng chọn đầy đủ màu và kích cỡ trước khi thêm vào giỏ hàng!');
            return;
        }

        // Kiểm tra xem user đã đăng nhập chưa
        const session = await getSession();
        
        if (session?.user) {
            // Đã đăng nhập - thêm vào DB
            try {
                const user = session.user as { id?: string; sub?: string; email?: string };
                const keycloakId = user.id || user.sub || user.email;
                
                if (!keycloakId) {
                    alert('Lỗi: Không tìm thấy thông tin người dùng.');
                    return;
                }

                const response = await fetch('http://localhost:8080/api/cart-items/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        keycloakId: keycloakId,
                        variantId: selected.variantId,
                        quantity: quantity
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi khi thêm vào giỏ hàng');
                }

                // Phát tín hiệu giỏ hàng đã được cập nhật
                window.dispatchEvent(new Event('cart-updated'));
                
                alert(`Đã thêm ${quantity} sản phẩm "${view.productName}" vào giỏ hàng!`);
                router.push('/shopping_cart');
                
            } catch (error) {
                console.error('Error adding to cart:', error);
                alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể thêm vào giỏ hàng'}`);
            }
        } else {
            // Chưa đăng nhập - thêm vào localStorage
            const currentCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItemIndex = currentCart.findIndex(item => item.id === selected.variantId);

            if (existingItemIndex > -1) {
                const newQuantity = currentCart[existingItemIndex].quantity + quantity;
                if (newQuantity > selected.stockLevel) {
                    alert(`Số lượng trong giỏ hàng (${newQuantity}) không được vượt quá tồn kho (${selected.stockLevel}).`);
                    return;
                }
                currentCart[existingItemIndex].quantity = newQuantity;
            } else {
                const newItem: CartItem = {
                    id: selected.variantId,
                    productId: view.productId,
                    productName: view.productName,
                    name: `${view.productName} - ${selected.colorName} / ${selected.sizeName}`,
                    price: selected.salePrice ?? selected.price,
                    quantity: quantity,
                    imageUrl: selected.imageUrl,
                    sku: selected.sku,
                    stockLevel: selected.stockLevel,
                    colorName: selected.colorName,
                    sizeName: selected.sizeName
                };
                currentCart.push(newItem);
            }

            localStorage.setItem('cart', JSON.stringify(currentCart));

            // Phát tín hiệu giỏ hàng đã được cập nhật
            window.dispatchEvent(new Event('cart-updated'));

            // Hiển thị thông báo thành công và chuyển hướng
            const message = existingItemIndex > -1 
                ? `Đã cập nhật số lượng sản phẩm "${view.productName}" trong giỏ hàng!`
                : `Đã thêm ${quantity} sản phẩm "${view.productName}" vào giỏ hàng!`;
            
            alert(message);
            
            // Chuyển hướng đến trang giỏ hàng
            router.push('/shopping_cart');
        }
    };

    const handleQuantityChange = (amount: number) => {
        const newQuantity = quantity + amount;
        if (newQuantity >= 1 && newQuantity <= selected.stockLevel) {
            setQuantity(newQuantity);
        }
    };

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
                        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
                            {selected.imageUrl ? (
                                <CldImage src={selected.imageUrl} width={400} height={400} alt={view.productName} className="object-contain" />
                            ) : view.thumbnail ? (
                                <CldImage src={view.thumbnail} width={400} height={400} alt={view.productName} className="object-contain" />
                            ) : (
                                <span className="text-gray-400">No image</span>
                            )}
                        </div>

                        <div className="space-y-6">
                            {selected.salePrice != null && selected.salePrice < selected.price ? (
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-bold text-red-600">{money(selected.salePrice)}</p>
                                    <p className="text-lg line-through text-gray-400">{money(selected.price)}</p>
                                    <span className="px-2 py-1 bg-red-600 text-white text-sm font-semibold rounded-lg hover:scale-105 transition-transform">
                                        -{percent(selected.price, selected.salePrice)}%
                                    </span>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-red-600">{money(selected.price)}</p>
                            )}

                            <div>
                                <h3 className="text-sm font-medium mb-1">Màu: <span className="font-semibold">{selected.colorName}</span></h3>
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

                            <div>
                                <h3 className="text-sm font-medium mb-1">Số lượng:</h3>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</Button>
                                    <input
                                        type="text"
                                        value={quantity}
                                        readOnly
                                        className="w-12 text-center p-1 border-gray-300 rounded-md"
                                    />
                                    <Button size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= selected.stockLevel}>+</Button>
                                    <span className="text-sm text-gray-500">
                                        ({selected.stockLevel} sản phẩm có sẵn)
                                    </span>
                                </div>
                            </div>

                            <Button
                                color="success"
                                className="w-full text-white font-bold py-3"
                                disabled={selected.stockLevel <= 0}
                                onClick={handleAddToCart}
                            >
                                Thêm vào giỏ hàng
                            </Button>
                            {selected.stockLevel <= 0 && (
                                <p className="text-sm text-center text-red-500">Sản phẩm tạm thời hết hàng</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-10">
                        <Tabs>
                            <Tab title="Mô tả sản phẩm">
                                <div className="p-4 prose max-w-none">
                                    <p>{view.description}</p>
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