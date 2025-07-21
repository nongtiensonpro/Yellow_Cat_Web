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
    Badge,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    addToast,
    Progress,
    Tooltip,
    ButtonGroup,
} from '@heroui/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CldImage } from 'next-cloudinary';
import { getSession } from 'next-auth/react';
import ReviewSection from '@/components/review/ReviewSection';


interface Base {
    id: number;
    name: string
}

type ColorInfo = Base;
type SizeInfo = Base;
type Material = Base;
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

interface ApiWrap<T> {
    status: number;
    data: T
}

interface Paged<T> {
    status: number;
    data: { content: T[] }
}


interface PromoItem {
    promotionCode: string;
    promotionName: string;
    description: string;
    discountAmount: number;
    finalPrice: number;
}

interface VariantPromos {
    bestPromo?: PromoItem;
    usablePromos: PromoItem[];
}

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


    const [promos, setPromos] = useState<VariantPromos>({ usablePromos: [] });

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

    const selected = variants.find(v => v.colorId === selColorId && v.sizeId === selSizeId) ?? variants[0];


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


    useEffect(() => {
        if (!selected) return;
        (async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/products/variant/${selected.variantId}/promotions`);
                if (!res.ok) throw new Error();
                const json = await res.json();
                if (json?.data) {
                    setPromos(json.data as VariantPromos);
                } else {
                    setPromos({ usablePromos: [] });
                }
            } catch (e) {
                console.error('Fetch promotions error', e);
                setPromos({ usablePromos: [] });
            }
        })();
    }, [selected]);

    const displayPrice = useMemo(() => {
        if (!selected) return 0;
        if (promos.bestPromo) return promos.bestPromo.finalPrice;
        return selected.salePrice ?? selected.price;
    }, [promos.bestPromo, selected]);

    const hasPromo = useMemo(() => {
        if (!selected) return false;
        return promos.bestPromo !== undefined;
    }, [promos.bestPromo, selected]);


    // Tính tổng tiết kiệm
    const totalSavings = useMemo(() => {
        if (!selected) return 0;
        if (hasPromo) {
            return selected.price - displayPrice; // Tiết kiệm từ giá gốc đến giá cuối
        }
        if (selected.salePrice && selected.salePrice < selected.price) {
            return selected.price - selected.salePrice; // Tiết kiệm từ sale
        }
        return 0;
    }, [selected, hasPromo, displayPrice]);

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

    useEffect(() => {
        setQuantity(1);
    }, [selected]);

    const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();

    const handleAddToCart = async () => {
        if (!selected || !view) {
            addToast({
                title: "Lỗi",
                description: "Không tìm thấy thông tin sản phẩm.",
                color: "danger"
            });
            return;
        }
        // Validate chọn màu và size
        if (!selColorId || !selSizeId) {
            addToast({
                title: "Thiếu thông tin",
                description: "Vui lòng chọn đầy đủ màu và kích cỡ trước khi thêm vào giỏ hàng!",
                color: "warning"
            });
            return;
        }

        const session = await getSession();

        if (session?.user) {
            // Đã đăng nhập - thêm vào DB
            try {
                const user = session.user as { id?: string; sub?: string; email?: string };
                const keycloakId = user.id || user.sub || user.email;

                if (!keycloakId) {
                    addToast({
                        title: "Lỗi xác thực",
                        description: "Không tìm thấy thông tin người dùng.",
                        color: "danger"
                    });
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

                addToast({
                    title: "Thành công!",
                    description: `Đã thêm ${quantity} sản phẩm "${view.productName}" vào giỏ hàng!`,
                    color: "success",
                    endContent: (
                        <Button size="sm" variant="flat" onPress={() => router.push('/shopping_cart')}>
                            Xem giỏ hàng
                        </Button>
                    )
                });

            } catch (error) {
                console.error('Error adding to cart:', error);
                addToast({
                    title: "Lỗi",
                    description: error instanceof Error ? error.message : 'Không thể thêm vào giỏ hàng',
                    color: "danger"
                });
            }
        } else {
            // Chưa đăng nhập - thêm vào localStorage
            const currentCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItemIndex = currentCart.findIndex(item => item.id === selected.variantId);

            if (existingItemIndex > -1) {
                const newQuantity = currentCart[existingItemIndex].quantity + quantity;
                if (newQuantity > selected.stockLevel) {
                    addToast({
                        title: "Vượt quá tồn kho",
                        description: `Số lượng trong giỏ hàng (${newQuantity}) không được vượt quá tồn kho (${selected.stockLevel}).`,
                        color: "warning"
                    });
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

            // Hiển thị thông báo thành công
            const message = existingItemIndex > -1
                ? `Đã cập nhật số lượng sản phẩm "${view.productName}" trong giỏ hàng!`
                : `Đã thêm ${quantity} sản phẩm "${view.productName}" vào giỏ hàng!`;

            addToast({
                title: "Thành công!",
                description: message,
                color: "success",
                endContent: (
                    <Button size="sm" variant="flat" onPress={() => router.push('/shopping_cart')}>
                        Xem giỏ hàng
                    </Button>
                )
            });
        }
    };

    const handleQuantityChange = (amount: number) => {
        const newQuantity = quantity + amount;
        if (newQuantity >= 1 && newQuantity <= selected.stockLevel) {
            setQuantity(newQuantity);
        }
    };

    // Trước khi render chính, đảm bảo selected đã có giá trị
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner label="Đang tải thông tin sản phẩm…" size="lg" />
        </div>
    );
    if (error || !view || !selected) return (
        <div className="text-center mt-20">
            <p className="text-red-600 mb-4">{error ?? 'Không tìm thấy sản phẩm'}</p>
            <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
    );

    return (
        <div className="container mx-auto my-4 p-4 max-w-7xl">
            <Card className="shadow-lg">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{view.productName}</h1>
                            <div className="flex items-center gap-3 text-default-600">
                                {view.logoPublicId && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                        <CldImage
                                            width={32}
                                            height={32}
                                            src={view.logoPublicId}
                                            alt={view.brandName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <span className="font-medium">{view.brandName}</span>
                                <Divider orientation="vertical" className="h-4" />
                                <Badge color="primary" variant="flat">
                                    {view.purchases} lượt mua
                                </Badge>
                            </div>
                        </div>
                        <Chip color="secondary" variant="flat" className="hidden sm:flex">
                            {view.categoryName}
                        </Chip>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="p-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Enhanced Image Section */}
                        <div className="space-y-4">
                            <div
                                className="relative aspect-square bg-gradient-to-br from-default-100 to-default-200 rounded-xl overflow-hidden cursor-pointer group"
                                onClick={onImageOpen}
                            >
                                {selected.imageUrl ? (
                                    <CldImage
                                        src={selected.imageUrl}
                                        alt={view.productName}
                                        width={500}
                                        height={500}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : view.thumbnail ? (
                                    <CldImage
                                        src={view.thumbnail}
                                        alt={view.productName}
                                        width={500}
                                        height={500}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-default-400">
                                        <span>Không có hình ảnh</span>
                                    </div>
                                )}
                                <div
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    <span
                                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 px-3 py-1 rounded-full text-sm">
                                        Nhấn để phóng to
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {variants.slice(0, 5).map((variant) => (
                                    <div
                                        key={variant.variantId}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${variant.variantId === selected.variantId
                                            ? 'border-primary'
                                            : 'border-default-200 hover:border-default-300'
                                            }`}
                                        onClick={() => {
                                            setSelColorId(variant.colorId);
                                            setSelSizeId(variant.sizeId);
                                        }}
                                    >
                                        <CldImage
                                            src={variant.imageUrl || view.thumbnail}
                                            alt={`${view.productName} - ${variant.colorName}`}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Product Details Section */}
                        <div className="space-y-6">
                            {/* Price Section with Enhanced Design */}
                            <div
                                className="bg-gradient-to-r from-danger-50 to-warning-50 p-4 rounded-xl border border-danger-200">
                                {hasPromo ? (
                                    <div className="space-y-2">
                                        <div className="flex items-end gap-3 flex-wrap">
                                            <span
                                                className="text-3xl sm:text-4xl font-bold text-danger">{money(displayPrice)}</span>
                                            <span
                                                className="text-lg line-through text-default-400">{money(selected.salePrice ?? selected.price)}</span>
                                            <Chip color="danger" variant="solid" size="sm" className="animate-pulse">
                                                -{percent(selected.salePrice ?? selected.price, displayPrice)}%
                                            </Chip>
                                        </div>
                                        <Badge color="success" variant="flat" className="text-xs">
                                            Tiết kiệm {money(totalSavings)}
                                        </Badge>
                                    </div>
                                ) : (
                                    selected.salePrice != null && selected.salePrice < selected.price ? (
                                        <div className="space-y-2">
                                            <div className="flex items-end gap-3 flex-wrap">
                                                <span
                                                    className="text-3xl sm:text-4xl font-bold text-danger">{money(selected.salePrice)}</span>
                                                <span
                                                    className="text-lg line-through text-default-400">{money(selected.price)}</span>
                                                <Chip color="danger" variant="solid" size="sm">
                                                    -{percent(selected.price, selected.salePrice)}%
                                                </Chip>
                                            </div>
                                            <Badge color="success" variant="flat" className="text-xs">
                                                Tiết kiệm {money(selected.price - selected.salePrice)}
                                            </Badge>
                                        </div>
                                    ) : (
                                        <span
                                            className="text-3xl sm:text-4xl font-bold text-danger">{money(selected.price)}</span>
                                    )
                                )}
                            </div>

                            {/* Enhanced Promotion Details */}
                            {hasPromo && promos.bestPromo && (
                                <Card
                                    className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Chip color="primary" variant="solid" size="sm">
                                                🎉 Khuyến mãi đặc biệt
                                            </Chip>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-default-700">Giá gốc:</span>
                                                <span className="font-semibold">{money(selected.price)}</span>
                                            </div>
                                            {selected.salePrice && selected.salePrice < selected.price && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-default-700">Giá sale:</span>
                                                    <span className="font-semibold">{money(selected.salePrice)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-default-700">Mã KM:</span>
                                                <Badge color="primary" variant="flat" className="font-semibold">
                                                    {promos.bestPromo.promotionCode}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-default-700">Tên KM:</span>
                                                <span
                                                    className="font-semibold text-primary">{promos.bestPromo.promotionName}</span>
                                            </div>
                                            {promos.bestPromo.description && (
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-default-700">Mô tả:</span>
                                                    <span
                                                        className="text-right max-w-[60%]">{promos.bestPromo.description}</span>
                                                </div>
                                            )}
                                            <Divider />
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-default-700">Giảm giá:</span>
                                                <span
                                                    className="font-bold text-success">-{money(promos.bestPromo.discountAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-default-700">Giá cuối:</span>
                                                <span
                                                    className="font-bold text-danger text-lg">{money(displayPrice)}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Enhanced Other Promotions */}
                            {promos.usablePromos.length > 1 && (
                                <Card
                                    className="bg-gradient-to-r from-warning-50 to-success-50 border border-warning-200">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Chip color="warning" variant="solid" size="sm">
                                                🎁 Các khuyến mãi khác
                                            </Chip>
                                            <Badge color="warning" variant="flat" size="sm">
                                                {promos.usablePromos.length} mã có sẵn
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            {promos.usablePromos.map((p: PromoItem, index) => (
                                                <Card key={p.promotionCode}
                                                    className="bg-white/70 border border-default-200 hover:shadow-md transition-shadow">
                                                    <CardBody className="p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        color={index === 0 ? "success" : "secondary"}
                                                                        variant="flat"
                                                                        size="sm"
                                                                        className="font-mono"
                                                                    >
                                                                        {p.promotionCode}
                                                                    </Badge>
                                                                    {index === 0 && (
                                                                        <Chip color="success" variant="solid" size="sm"
                                                                            className="text-xs">
                                                                            Tốt nhất
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                                <h4 className="font-semibold text-sm text-default-800">
                                                                    {p.promotionName}
                                                                </h4>
                                                                {p.description && (
                                                                    <p className="text-xs text-default-600 leading-relaxed">
                                                                        {p.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-4 text-xs">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-default-600">Giảm:</span>
                                                                        <span className="font-bold text-success">
                                                                            {money(p.discountAmount)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span
                                                                            className="text-default-600">Giá cuối:</span>
                                                                        <span className="font-bold text-danger">
                                                                            {money(p.finalPrice)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <div className="text-right">
                                                                    <div className="text-xs text-default-500">Tiết
                                                                        kiệm
                                                                    </div>
                                                                    <div className="font-bold text-success text-sm">
                                                                        {money(selected.price - p.finalPrice)}
                                                                    </div>
                                                                </div>
                                                                <Chip
                                                                    color="warning"
                                                                    variant="flat"
                                                                    size="sm"
                                                                    className="text-xs"
                                                                >
                                                                    -{percent(selected.price, p.finalPrice)}%
                                                                </Chip>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                        <div
                                            className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 text-xs text-blue-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-medium">
                                                    Hệ thống tự động áp dụng mã khuyến mãi tốt nhất cho bạn
                                                </span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Enhanced Color Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-default-700">Màu sắc:</h3>
                                    <Badge color="primary" variant="flat" size="sm">
                                        {selected.colorName}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(variants.map(v => v.colorId))).map(cid => {
                                        const c = colors.find(x => x.id === cid);
                                        const isSelected = cid === selColorId;
                                        return (
                                            <Tooltip key={cid} content={c?.name} placement="top">
                                                <Button
                                                    variant={isSelected ? 'solid' : 'bordered'}
                                                    color={isSelected ? 'primary' : 'default'}
                                                    size="sm"
                                                    className={`min-w-0 px-3 transition-all duration-200 ${isSelected ? 'scale-105 shadow-lg' : 'hover:scale-105'
                                                        }`}
                                                    onClick={() => setSelColorId(cid)}
                                                >
                                                    {c?.name}
                                                </Button>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Enhanced Size Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-default-700">Kích cỡ:</h3>
                                    <Badge color="secondary" variant="flat" size="sm">
                                        {selected.sizeName}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {sizesForColor.map(s => {
                                        const isSelected = s.id === selSizeId;
                                        return (
                                            <Button
                                                key={s.id}
                                                variant={isSelected ? 'solid' : 'bordered'}
                                                color={isSelected ? 'secondary' : 'default'}
                                                size="sm"
                                                className={`min-w-0 px-3 transition-all duration-200 ${isSelected ? 'scale-105 shadow-lg' : 'hover:scale-105'
                                                    }`}
                                                onClick={() => setSelSizeId(s.id)}
                                            >
                                                {s.name}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Enhanced Quantity Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-default-700">Số lượng:</h3>
                                    <div className="flex items-center gap-2">
                                        <Chip
                                            color={selected.stockLevel > 10 ? 'success' : selected.stockLevel > 0 ? 'warning' : 'danger'}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {selected.stockLevel > 0 ? `${selected.stockLevel} có sẵn` : 'Hết hàng'}
                                        </Chip>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ButtonGroup variant="bordered" size="sm">
                                        <Button
                                            isIconOnly
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                            className="min-w-8"
                                        >
                                            -
                                        </Button>
                                        <Button className="min-w-16 cursor-default" disabled>
                                            {quantity}
                                        </Button>
                                        <Button
                                            isIconOnly
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= selected.stockLevel}
                                            className="min-w-8"
                                        >
                                            +
                                        </Button>
                                    </ButtonGroup>
                                    {selected.stockLevel > 0 && (
                                        <Progress
                                            value={(quantity / selected.stockLevel) * 100}
                                            color="primary"
                                            size="sm"
                                            className="flex-1 max-w-32"
                                            showValueLabel={false}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Add to Cart Button */}
                            <div className="space-y-3">
                                <Button
                                    color="success"
                                    size="lg"
                                    className="w-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                                    disabled={selected.stockLevel <= 0}
                                    onClick={handleAddToCart}
                                    startContent={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    }
                                >
                                    {selected.stockLevel <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                                </Button>

                                {selected.stockLevel <= 0 && (
                                    <div className="text-center">
                                        <Chip color="danger" variant="flat" size="sm">
                                            Sản phẩm tạm thời hết hàng
                                        </Chip>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="bordered"
                                        className="flex-1"
                                        startContent={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        }
                                    >
                                        Yêu thích
                                    </Button>
                                    <Button
                                        variant="bordered"
                                        className="flex-1"
                                        startContent={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                            </svg>
                                        }
                                    >
                                        Chia sẻ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Tabs Section */}
                    <div className="mt-10">
                        <Tabs
                            variant="underlined"
                            color="primary"
                            classNames={{
                                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                cursor: "w-full bg-primary",
                                tab: "max-w-fit px-0 h-12",
                                tabContent: "group-data-[selected=true]:text-primary"
                            }}
                        >
                            <Tab
                                key="description"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Mô tả sản phẩm</span>
                                    </div>
                                }
                            >
                                <Card className="mt-4">
                                    <CardBody className="p-6">
                                        <div className="prose max-w-none text-default-700">
                                            <p className="text-base leading-relaxed mb-4">{view.description}</p>
                                            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                                {view.materialName && (
                                                    <div
                                                        className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
                                                        <div
                                                            className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-primary" fill="none"
                                                                stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">Chất liệu</p>
                                                            <p className="text-primary font-semibold">{view.materialName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {view.targetAudienceName && (
                                                    <div
                                                        className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
                                                        <div
                                                            className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-secondary" fill="none"
                                                                stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">Đối tượng</p>
                                                            <p className="text-secondary font-semibold">{view.targetAudienceName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>

                            <Tab
                                key="brand"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span>Thương hiệu</span>
                                    </div>
                                }
                            >
                                <Card className="mt-4">
                                    <CardBody className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            {view.logoPublicId && (
                                                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                                                    <CldImage
                                                        width={64}
                                                        height={64}
                                                        src={view.logoPublicId}
                                                        alt={view.brandName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">{view.brandName}</h3>
                                                <Badge color="primary" variant="flat">Thương hiệu chính thức</Badge>
                                            </div>
                                        </div>
                                        <div className="prose max-w-none text-default-700">
                                            <p className="text-base leading-relaxed">{view.brandInfo}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>

                            <Tab
                                key="specs"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        <span>Thông số kỹ thuật</span>
                                    </div>
                                }
                            >
                                <Card className="mt-4">
                                    <CardBody className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-divider">
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-default-700 bg-default-50">
                                                            Thuộc tính
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-default-700 bg-default-50">
                                                            Giá trị
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-divider">
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">SKU</td>
                                                        <td className="px-6 py-4 text-sm text-default-700">
                                                            <Badge variant="flat" color="default">{selected.sku}</Badge>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">Màu
                                                            sắc
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-default-700">
                                                            <Badge variant="flat"
                                                                color="primary">{selected.colorName}</Badge>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">Kích
                                                            cỡ
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-default-700">
                                                            <Badge variant="flat"
                                                                color="secondary">{selected.sizeName}</Badge>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">Giá
                                                            gốc
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-default-700">{money(selected.price)}</td>
                                                    </tr>
                                                    {selected.salePrice != null && (
                                                        <tr className="hover:bg-default-50 transition-colors">
                                                            <td className="px-6 py-4 text-sm font-medium text-default-900">Giá
                                                                khuyến mãi
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-semibold text-danger">{money(selected.salePrice)}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">Cân
                                                            nặng
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-default-700">{selected.weight} kg</td>
                                                    </tr>
                                                    <tr className="hover:bg-default-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-medium text-default-900">Tồn
                                                            kho
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-default-700">
                                                            <Chip
                                                                color={selected.stockLevel > 10 ? 'success' : selected.stockLevel > 0 ? 'warning' : 'danger'}
                                                                variant="flat"
                                                                size="sm"
                                                            >
                                                                {selected.stockLevel} sản phẩm
                                                            </Chip>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Tab>

                            <Tab
                                key="reviews"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        <span>Đánh giá</span>
                                        <Badge color="primary" variant="flat" size="sm">{reviewCnt}</Badge>
                                    </div>
                                }
                            >
                                <div className="mt-4">
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

            {/* Enhanced Image Modal */}
            <Modal
                isOpen={isImageOpen}
                onClose={onImageClose}
                size="5xl"
                classNames={{
                    backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold">{view.productName}</h2>
                        <div className="flex items-center gap-2 text-sm text-default-600">
                            <Badge color="primary" variant="flat" size="sm">
                                {selected.colorName}
                            </Badge>
                            <Badge color="secondary" variant="flat" size="sm">
                                {selected.sizeName}
                            </Badge>
                        </div>
                    </ModalHeader>
                    <ModalBody className="pb-6">
                        <div className="flex justify-center">
                            {selected.imageUrl ? (
                                <CldImage
                                    src={selected.imageUrl}
                                    alt={view.productName}
                                    width={800}
                                    height={800}
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            ) : view.thumbnail ? (
                                <CldImage
                                    src={view.thumbnail}
                                    alt={view.productName}
                                    width={800}
                                    height={800}
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-64 text-default-400">
                                    <span>Không có hình ảnh</span>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </div>
    );
}