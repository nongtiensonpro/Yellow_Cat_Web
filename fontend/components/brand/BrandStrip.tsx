"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Button,
    Card,
    CardBody,
    Skeleton,
    ScrollShadow,
    useDisclosure,
} from "@heroui/react";
import {CldImage} from "next-cloudinary";
import {ChevronLeftIcon, ChevronRightIcon} from "@heroicons/react/24/outline";

// === Types ===
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

    // slider state
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [index, setIndex] = useState(0); // current slide index

    // detail modal state (only need setter for now)
    const [, setDetail] = useState<Brand | null>(null);
    const {onOpen} = useDisclosure();

    // config
    const intervalMs = 3800; // gentle pace

    // Derived
    const canSlide = useMemo(() => brands.length > 1, [brands.length]);

    // Fetch brands (robust unwrap logic)
    useEffect(() => {
        let cancelled = false;
        const loadBrands = async () => {
            setLoading(true);
            setError(null);
            try {

                const res = await fetch("http://localhost:8080/api/brands?page=0&size=50");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: ApiWrap<Brand[]> = await res.json();

                let list: Brand[] = [];
                const raw: unknown = json?.data as unknown;

                // Case 1: data is an array of brands
                if (Array.isArray(raw)) {
                    list = raw as Brand[];
                } else if (raw && typeof raw === "object") {
                    // Safe object access helpers
                    const obj = raw as Record<string, unknown>;

                    // Case 2: data has content: Brand[]
                    if (Array.isArray((obj as { content?: unknown }).content)) {
                        list = ((obj as { content?: unknown }).content as Brand[]) ?? [];
                    }

                    // Case 3: data has nested data: { content: Brand[] }
                    const nestedData = obj.data as { content?: unknown } | undefined;
                    if (!list.length && nestedData && Array.isArray(nestedData.content)) {
                        list = (nestedData.content as Brand[]) ?? [];
                    }
                }

                if (!cancelled) setBrands(list ?? []);
            } catch (e: unknown) {
                if (!cancelled) setError("Không thể tải nhãn hàng: " + (e instanceof Error ? e.message : String(e)));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadBrands();
        return () => {
            cancelled = true;
        };
    }, []);

    // Helper: go to slide i
    const scrollToIndex = useCallback((i: number) => {
        const el = viewportRef.current;
        if (!el) return;
        const w = el.clientWidth;
        el.scrollTo({left: i * w, behavior: "smooth"});
    }, []);

    const next = useCallback(() => {
        if (!canSlide) return;
        setIndex((prev) => {
            const i = (prev + 1) % brands.length;
            scrollToIndex(i);
            return i;
        });
    }, [brands.length, canSlide, scrollToIndex]);

    const prev = useCallback(() => {
        if (!canSlide) return;
        setIndex((prev) => {
            const i = (prev - 1 + brands.length) % brands.length;
            scrollToIndex(i);
            return i;
        });
    }, [brands.length, canSlide, scrollToIndex]);

    // Auto-advance (respect reduced motion & pause on hover/focus)
    useEffect(() => {
        const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!canSlide || isPaused || prefersReduced) return;

        const id = window.setInterval(() => {
            next();
        }, intervalMs);
        return () => window.clearInterval(id);
    }, [canSlide, isPaused, next]);

    // Sync index when user drags/scrolls manually
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const w = el.clientWidth || 1;
                const i = Math.round(el.scrollLeft / w);
                setIndex(i);
            });
        };
        el.addEventListener("scroll", onScroll, {passive: true});
        return () => {
            el.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(raf);
        };
    }, [brands.length]);

    // Pause when interacting
    const pause = () => setIsPaused(true);
    const resume = () => setIsPaused(false);

    // Open modal for full-screen reading
    const openDetail = (b: Brand) => {
        setDetail(b);
        onOpen();
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold mb-6">Thương hiệu nổi bật</h2>
                </div>

                {/* Controls (desktop) */}
                <div className="hidden sm:flex items-center gap-2">
                    <Button isIconOnly size="sm" variant="flat" aria-label="Trước" onPress={prev} isDisabled={!canSlide}>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </Button>
                    <Button isIconOnly size="sm" variant="flat" aria-label="Sau" onPress={next} isDisabled={!canSlide}>
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
            {/* Loading */}
            {loading && (
                <div className="w-full aspect-[16/6]">
                    <Skeleton className="w-full h-full rounded-xl" />
                </div>
            )}

            {/* Slider */}
            {!loading && !error && brands.length > 0 && (
                <div
                    className="relative"
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                    onFocus={pause}
                    onBlur={resume}
                >
                    {/* ScrollShadow adds subtle masked edges & hides native scrollbar */}
                    <ScrollShadow orientation="horizontal" hideScrollBar className="rounded-2xl">
                        <div
                            ref={viewportRef}
                            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            role="listbox"
                            aria-label="Slider thương hiệu (1 mục mỗi lần)"
                        >
                            {brands.map((b) => (
                                <section
                                    key={b.id}
                                    role="option"
                                    aria-selected={false}
                                    className="basis-full shrink-0 grow-0 snap-start grid place-items-center p-4"
                                >
                                    <Card
                                        shadow="sm"
                                        className="w-full max-w-2xl border border-default-200 rounded-2xl transition-transform duration-300 data-[hover=true]:scale-[1.015]"
                                        isPressable
                                        onPress={() => openDetail(b)}
                                    >
                                        <CardBody className="p-6">
                                            <div className="flex items-start gap-5">
                                                <div className="w-16 h-16 rounded-full overflow-hidden border border-default-200 flex-shrink-0">
                                                    <CldImage
                                                        width={64}
                                                        height={64}
                                                        src={b.logoPublicId}
                                                        alt={b.brandName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-lg truncate">{b.brandName}</h3>
                                                        {b.createdAt && (
                                                            <span className="text-tiny text-default-500">Tạo: {new Date(b.createdAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    {/* FULL description area with vertical ScrollShadow */}
                                                    <ScrollShadow orientation="vertical" className="max-h-56 md:max-h-64 mt-3 pr-1">
                                                        <p className="text-sm leading-relaxed text-default-700 whitespace-pre-line">
                                                            {b.brandInfo?.trim() || "(Chưa có mô tả cho thương hiệu này)"}
                                                        </p>
                                                    </ScrollShadow>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </section>
                            ))}
                        </div>
                    </ScrollShadow>

                    {/* Dots */}
                    {canSlide && (
                        <div className="absolute inset-x-0 -bottom-3 flex items-center justify-center gap-1.5">
                            {brands.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => scrollToIndex(i)}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === index ? "w-6 bg-primary" : "w-1.5 bg-default-300"
                                    }`}
                                    aria-label={`Tới slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* A11y hint */}
            {!loading && canSlide && (
                <p className="sr-only" aria-live="polite">
                    Slider tự động chuyển mỗi {Math.round(intervalMs / 1000)} giây. Di chuột hoặc focus để tạm dừng.
                </p>
            )}
        </div>
    );
};

export default BrandStrip;

