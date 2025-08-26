'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {  Button, Card, CardBody, Chip, Skeleton, Tooltip } from '@heroui/react';
import { CldImage } from 'next-cloudinary';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type Brand = {
    id: number;
    brandName: string;
    logoPublicId: string;
    brandInfo?: string;
    createdAt?: string;
};

type PageInfo<T> = {
    content: T[];
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
};

type ApiWrap<T> = {
    timestamp?: string;
    status?: number;
    message?: string;
    data?: T | PageInfo<T> | { content?: T[] } | unknown;
};

const BrandStrip: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollRef.current;
        if (!container) return;
        const amount = Math.round(container.clientWidth * 0.8);
        container.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    const canScroll = useMemo(() => brands.length > 0, [brands.length]);

    useEffect(() => {
        const loadBrands = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('http://localhost:8080/api/brands?page=0&size=50');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: ApiWrap<Brand[]> = await res.json();

                let list: Brand[] = [];
                type RawData =
                    | Brand[]
                    | PageInfo<Brand>
                    | { content?: Brand[] }
                    | { data?: { content?: Brand[] } }
                    | undefined;
                const raw = json?.data as RawData;
                if (Array.isArray(raw)) {
                    list = raw;
                } else if (raw && 'content' in raw && Array.isArray(raw.content)) {
                    list = raw.content;
                } else if (raw && 'data' in raw) {
                    const nested = (raw as { data?: { content?: Brand[] } }).data;
                    if (nested && 'content' in nested && Array.isArray(nested.content)) {
                        list = nested.content;
                    }
                }

                setBrands(list);
            } catch (e) {
                setError('Không thể tải nhãn hàng' + e);
            } finally {
                setLoading(false);
            }
        };
        loadBrands();
    }, []);

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10m-7 4h7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold">Thương hiệu nổi bật</h2>
                    {!loading && brands.length > 0 && (
                        <Chip size="sm" variant="flat" color="primary" className="ml-1">
                            {brands.length} nhãn hàng
                        </Chip>
                    )}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    <Button isIconOnly size="sm" variant="flat" aria-label="Cuộn trái" onPress={() => handleScroll('left')} isDisabled={!canScroll}>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </Button>
                    <Button isIconOnly size="sm" variant="flat" aria-label="Cuộn phải" onPress={() => handleScroll('right')} isDisabled={!canScroll}>
                        <ChevronRightIcon className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="max-w-md">
                    <CardBody className="py-6 text-center">
                        <div className="text-danger-500 text-4xl mb-2">⚠️</div>
                        <p className="text-default-600">{error}</p>
                    </CardBody>
                </Card>
            )}

            {loading ? (
                <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="w-40 h-20 rounded-xl bg-default-200" />
                    ))}
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-default-300 scrollbar-track-transparent"
                    role="list"
                    aria-label="Danh sách thương hiệu"
                >
                    {brands.map((b) => (
                        <div
                            key={b.id}
                            role="listitem"
                            className="group min-w-[160px] max-w-[180px] snap-start"
                            tabIndex={0}
                            aria-label={`Thương hiệu ${b.brandName}`}
                        >
                            <Card className="border border-default-200 hover:border-primary-200 transition-colors rounded-xl">
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-default-200 flex-shrink-0">
                                            <CldImage
                                                width={40}
                                                height={40}
                                                src={b.logoPublicId}
                                                alt={b.brandName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <Tooltip
                                            content={
                                                b.brandInfo ? (
                                                    <div className="max-w-xs text-xs text-default-700 whitespace-pre-line leading-relaxed">
                                                        <p className="font-semibold mb-1 text-default-900">{b.brandName}</p>
                                                        {b.brandInfo}
                                                    </div>
                                                ) : (
                                                    b.brandName
                                                )
                                            }
                                            placement="top"
                                        >
                                            <span className="font-medium text-sm truncate max-w-[110px] group-hover:text-primary">{b.brandName}</span>
                                        </Tooltip>
                                    </div>
                                    {/* Mô tả được đưa vào Tooltip, không hiển thị trực tiếp */}
                                </CardBody>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrandStrip;


