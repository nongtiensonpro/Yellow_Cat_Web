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
