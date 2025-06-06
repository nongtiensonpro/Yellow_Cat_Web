import { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { Chip, Spinner } from "@heroui/react";
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { OptimizedVariantRow } from './OptimizedVariantRow';
import type { ProductWithVariants, ProductVariant, ProductManagement } from './ProductListSaleOffice';

interface OptimizedProductItemProps {
    product: ProductWithVariants;
    onLoadVariants: (productId: number) => Promise<void>;
    onAddToCart: (variant: ProductVariant, product: ProductManagement) => void;
}

export function OptimizedProductItem({ product, onLoadVariants, onAddToCart }: OptimizedProductItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);

        // Lazy load variants only on first expansion
        if (newExpandedState && !product.variantsLoaded) {
            setIsLoading(true);
            await onLoadVariants(product.productId);
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Product Header / Accordion Trigger */}
            <button
                type="button"
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition"
                onClick={handleToggle}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <CldImage
                        width={40}
                        height={40}
                        src={product.logoPublicId}
                        alt={product.brandName}
                        className="rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-md text-gray-800 truncate">{product.productName}</h3>
                        <p className="text-sm text-gray-500">{product.brandName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Tồn kho</div>
                        <div className="font-bold text-blue-600">{product.totalStock}</div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Expanded Content: Variants List */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-3">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-4">
                            <Spinner size="sm" label="Đang tải biến thể..." />
                        </div>
                    ) : product.variants.length > 0 ? (
                        <div className="space-y-2">
                            {product.variants.map(variant => (
                                <OptimizedVariantRow
                                    key={variant.variantId}
                                    variant={variant}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-4">Sản phẩm này chưa có biến thể.</p>
                    )}
                </div>
            )}
        </div>
    );
}