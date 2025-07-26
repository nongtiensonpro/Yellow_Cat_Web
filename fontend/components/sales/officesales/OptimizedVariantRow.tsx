import { CldImage } from 'next-cloudinary';
import { Chip, Button } from "@heroui/react";
import type { ProductVariant, ProductManagement } from './ProductListSaleOffice';

interface OptimizedVariantRowProps {
    variant: ProductVariant;
    product: ProductManagement;
    onAddToCart: (variant: ProductVariant, product: ProductManagement) => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export function OptimizedVariantRow({ variant, product, onAddToCart }: OptimizedVariantRowProps) {
    const hasPromo = variant.bestPromo !== undefined;
    return (
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md hover:bg-indigo-50 transition-colors duration-150">
            <CldImage
                width={48}
                height={48}
                src={variant.imageUrl || product.thumbnail}
                alt={`${product.productName} - ${variant.colorName}`}
                className="object-cover rounded w-12 h-12 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat" color="primary">{variant.colorName}</Chip>
                    <Chip size="sm" variant="flat" color="secondary">{variant.sizeName}</Chip>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">SKU: {variant.sku}</p>
            </div>
            <div className="text-right flex-shrink-0 w-28">
                {hasPromo ? (
                    <>
                        <p className="font-semibold text-sm text-red-600">
                            {formatPrice(variant.salePrice ?? variant.price)}
                        </p>
                        <p className="text-xs line-through text-gray-400">
                            {formatPrice(variant.price)}
                        </p>
                        <div className="mt-0.5">
                            <Chip size="sm" color="warning" variant="flat">
                                {variant.bestPromo?.promotionCode}
                            </Chip>
                        </div>
                    </>
                ) : (
                    <p className="font-semibold text-sm text-red-600">
                        {formatPrice(variant.price)}
                    </p>
                )}
                <p className={`text-xs ${variant.stockLevel > 0 ? 'text-gray-600' : 'text-red-500 font-bold'}`}>
                    Tồn: {variant.stockLevel}
                </p>
            </div>
            <div className="flex-shrink-0">
                <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    onClick={() => onAddToCart(variant, product)}
                    disabled={variant.stockLevel <= 0}
                    className="px-3 py-1"
                >
                    {variant.stockLevel > 0 ? "Thêm" : "Hết"}
                </Button>
            </div>
        </div>
    );
}