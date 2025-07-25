"use client";

import {useSession} from "next-auth/react";
import {useState, useEffect} from "react";
import React from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Textarea,
    Select,
    SelectItem,
    Button,
    Chip,
    Checkbox,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    addToast
} from "@heroui/react";
import {Save, ArrowLeft, RefreshCw, Settings} from "lucide-react";
import {useRouter, useParams} from "next/navigation";
import ProductImageUpload from "@/components/product/ProductImageUpload";
import type { Session } from "next-auth";

interface DropdownOption {
    id: number;
    name: string;
}

interface BrandOption {
    id: number;
    brandName: string;
    logoPublicId?: string;
    brandInfo?: string;
}

interface ProductVariant {
    id: string;
    sku?: string; // Tùy chọn vì backend sẽ tự động tạo
    colorId: number;
    sizeId: number;
    price: number;
    salePrice: number;
    stockLevel: number;
    sold: number;
    imageUrl: string;
    weight: number;
    enabled: boolean; // Cho phép kích hoạt/vô hiệu hóa biến thể
}

// Raw variant type trả về từ backend (giúp tránh dùng any)
interface RawVariant {
    variantId?: number;
    sku?: string;
    colorId: number;
    sizeId: number;
    price?: number;
    salePrice?: number;
    stockLevel?: number;
    sold?: number;
    imageUrl?: string;
    weight?: number;
}

interface ProductFormData {
    productName: string;
    description: string;
    brandId: number;
    categoryId: number;
    materialId: number;
    targetAudienceId: number;
    thumbnail: string;
    variants: ProductVariant[];
}

type SessionWithToken = Session & { accessToken?: string };

export default function UpdateProductPage() {
    const {data: session} = useSession();
    const router = useRouter();
    const params = useParams();
    let productId = "";
    if (params && params.productId) {
        if (Array.isArray(params.productId)) {
            productId = params.productId[0];
        } else {
            productId = params.productId as string;
        }
    }

    // Trạng thái form
    const [formData, setFormData] = useState<ProductFormData>({
        productName: "",
        description: "",
        brandId: 0,
        categoryId: 0,
        materialId: 0,
        targetAudienceId: 0,
        thumbnail: "",
        variants: []
    });

    // Tùy chọn danh sách thả xuống
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [categories, setCategories] = useState<DropdownOption[]>([]);
    const [materials, setMaterials] = useState<DropdownOption[]>([]);
    const [targetAudiences, setTargetAudiences] = useState<DropdownOption[]>([]);
    const [colors, setColors] = useState<DropdownOption[]>([]);
    const [sizes, setSizes] = useState<DropdownOption[]>([]);

    // Trạng thái tải dữ liệu
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Trạng thái trình tạo ma trận
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    // Cài đặt hàng loạt (ẩn trường giảm giá, giá khuyến mãi luôn = giá bán)
    const [bulkSettings, setBulkSettings] = useState({
        price: 0,
        weight: 0,
        stockLevel: 0
    });

    // Validation state
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Thêm trạng thái loading dữ liệu sản phẩm
    const [isProductLoading, setIsProductLoading] = useState(true);

    const token = (session as SessionWithToken | null)?.accessToken;

    // Toast helper functions
    const showSuccessToast = (title: string, description: string) => {
        addToast({
            title: `✅ ${title}`,
            description,
            timeout: 3000,
            shouldShowTimeoutProgress: true
        });
    };

    const showErrorToast = (title: string, description: string) => {
        addToast({
            title: `❌ ${title}`,
            description,
            timeout: 5000,
            shouldShowTimeoutProgress: true
        });
    };

    const showWarningToast = (title: string, description: string) => {
        addToast({
            title: `⚠️ ${title}`,
            description,
            timeout: 4000,
            shouldShowTimeoutProgress: true
        });
    };

    const showInfoToast = (title: string, description: string) => {
        addToast({
            title: `ℹ️ ${title}`,
            description,
            timeout: 3000,
            shouldShowTimeoutProgress: true
        });
    };

    // Tải dữ liệu danh sách thả xuống
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setHasError(false);

            try {
                const [brandsRes, categoriesRes, materialsRes, audiencesRes, colorsRes, sizesRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/brands?page=0&size=1000`),
                    fetch(`http://localhost:8080/api/categories?page=0&size=1000`),
                    fetch(`http://localhost:8080/api/materials?page=0&size=1000`),
                    fetch(`http://localhost:8080/api/target-audiences?page=0&size=1000`),
                    fetch(`http://localhost:8080/api/colors?page=0&size=1000`),
                    fetch(`http://localhost:8080/api/sizes?page=0&size=1000`)
                ]);

                // Check for failed requests
                const failedRequests = [];
                if (!brandsRes.ok) failedRequests.push("thương hiệu");
                if (!categoriesRes.ok) failedRequests.push("danh mục");
                if (!materialsRes.ok) failedRequests.push("chất liệu");
                if (!audiencesRes.ok) failedRequests.push("đối tượng");
                if (!colorsRes.ok) failedRequests.push("màu sắc");
                if (!sizesRes.ok) failedRequests.push("kích thước");

                if (failedRequests.length > 0) {
                    showErrorToast(
                        "Lỗi tải dữ liệu",
                        `Không thể tải dữ liệu: ${failedRequests.join(", ")}. Vui lòng thử lại sau.`
                    );
                    setHasError(true);
                    return;
                }

                const [brandsData, categoriesData, materialsData, audiencesData, colorsData, sizesData] = await Promise.all([
                    brandsRes.ok ? brandsRes.json() : {data: {content: []}},
                    categoriesRes.ok ? categoriesRes.json() : {data: {content: []}},
                    materialsRes.ok ? materialsRes.json() : {data: {content: []}},
                    audiencesRes.ok ? audiencesRes.json() : {data: {content: []}},
                    colorsRes.ok ? colorsRes.json() : {data: {content: []}},
                    sizesRes.ok ? sizesRes.json() : {data: {content: []}}
                ]);

                // Trích xuất dữ liệu từ cấu trúc phản hồi backend
                const extractData = <T,>(response: unknown): T[] => {
                    if (Array.isArray(response)) {
                        return response as T[];
                    }

                    if (typeof response === "object" && response !== null) {
                        const obj = response as Record<string, unknown>;
                        const dataField = obj.data;

                        if (Array.isArray(dataField)) {
                            return dataField as T[];
                        }

                        if (typeof dataField === "object" && dataField !== null) {
                            const inner = dataField as Record<string, unknown>;
                            if (Array.isArray(inner.content)) {
                                return inner.content as T[];
                            }
                            if (Array.isArray(inner.data)) {
                                return inner.data as T[];
                            }
                        }
                    }

                    return [] as T[];
                };

                const extractedBrands = extractData<BrandOption>(brandsData);
                const extractedCategories = extractData<DropdownOption>(categoriesData);
                const extractedMaterials = extractData<DropdownOption>(materialsData);
                const extractedAudiences = extractData<DropdownOption>(audiencesData);
                const extractedColors = extractData<DropdownOption>(colorsData);
                const extractedSizes = extractData<DropdownOption>(sizesData);

                setBrands(extractedBrands);
                setCategories(extractedCategories);
                setMaterials(extractedMaterials);
                setTargetAudiences(extractedAudiences);
                setColors(extractedColors);
                setSizes(extractedSizes);

                // Success toast with loaded data info
                const totalItems = extractedBrands.length + extractedCategories.length +
                    extractedMaterials.length + extractedAudiences.length +
                    extractedColors.length + extractedSizes.length;

                showInfoToast(
                    "Tải dữ liệu thành công",
                    `Đã tải ${totalItems} mục dữ liệu gồm ${extractedBrands.length} thương hiệu, ${extractedCategories.length} danh mục, ${extractedColors.length} màu sắc, ${extractedSizes.length} kích thước.`
                );

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu danh sách:", error);
                setHasError(true);
                showErrorToast(
                    "Lỗi kết nối",
                    "Không thể kết nối đến server để tải dữ liệu. Vui lòng kiểm tra kết nối mạng và tải lại trang."
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch chi tiết sản phẩm khi vào trang
    useEffect(() => {
        const fetchProductDetail = async () => {
            if (!productId) {
                setHasError(true);
                showErrorToast("Lỗi", "Không tìm thấy productId trên URL");
                setIsProductLoading(false);
                return;
            }
            setIsProductLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/products/${productId}`);
                if (!res.ok) throw new Error("Không thể lấy chi tiết sản phẩm");
                const data = await res.json();
                if (data.status !== 200 || !data.data) throw new Error(data.message || "Lỗi dữ liệu");
                const product = data.data;
                // Map dữ liệu vào form
                setFormData({
                    productName: product.productName || "",
                    description: product.description || "",
                    brandId: product.brandId || 0,
                    categoryId: product.categoryId || 0,
                    materialId: product.materialId || 0,
                    targetAudienceId: product.targetAudienceId || 0,
                    thumbnail: product.thumbnail || "",
                    variants: (product.variants || []).map((v: RawVariant) => ({
                        id: v.variantId ? v.variantId.toString() : `${v.colorId}-${v.sizeId}`,
                        sku: v.sku,
                        colorId: v.colorId,
                        sizeId: v.sizeId,
                        price: v.price || 0,
                        salePrice: v.salePrice || 0,
                        stockLevel: v.stockLevel || 0,
                        sold: v.sold || 0,
                        imageUrl: v.imageUrl || "",
                        weight: v.weight || 0,
                        enabled: true
                    }))
                });
            } catch (err) {
                setHasError(true);
                showErrorToast("Lỗi", err instanceof Error ? err.message : "Không thể lấy chi tiết sản phẩm");
            } finally {
                setIsProductLoading(false);
            }
        };
        if (productId) fetchProductDetail();
        // Dependency chỉ cần productId
    }, [productId]);

    // Validation functions
    const validateProductName = (name: string): string => {
        if (!name.trim()) return "Tên sản phẩm không được để trống";
        if (name.trim().length < 2) return "Tên sản phẩm phải có ít nhất 2 ký tự";
        if (name.trim().length > 200) return "Tên sản phẩm không được vượt quá 200 ký tự";
        return "";
    };

    const validatePrice = (price: number, fieldName: string, comparePrice?: number, compareName?: string): string => {
        if (price < 0) return `${fieldName} không được âm`;
        if (price > 999999999) return `${fieldName} quá lớn`;
        if (comparePrice !== undefined && price > comparePrice && comparePrice > 0) {
            return `${fieldName} (${price.toLocaleString()} VNĐ) không được lớn hơn ${compareName} (${comparePrice.toLocaleString()} VNĐ)`;
        }
        return "";
    };

    const validateWeight = (weight: number): string => {
        if (weight < 0) return "Trọng lượng không được âm";
        if (weight > 50000) return "Trọng lượng không được vượt quá 50kg";
        return "";
    };

    const validateStock = (stock: number, fieldName: string): string => {
        if (stock < 0) return `${fieldName} không được âm`;
        if (stock > 999999) return `${fieldName} quá lớn`;
        return "";
    };

    const validateRequiredFields = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        // Validate tên sản phẩm
        const nameError = validateProductName(formData.productName);
        if (nameError) newErrors.productName = nameError;

        // Validate thumbnail
        if (!formData.thumbnail.trim()) {
            newErrors.thumbnail = "Ảnh đại diện là bắt buộc";
        }

        // Validate brand
        if (!formData.brandId) {
            newErrors.brandId = "Vui lòng chọn thương hiệu";
        }

        // Validate category
        if (!formData.categoryId) {
            newErrors.categoryId = "Vui lòng chọn danh mục";
        }

        // Validate mô tả
        if (formData.description && formData.description.length > 1000) {
            newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
        }

        // Validate variants
        const enabledVariants = formData.variants.filter(v => v.enabled);
        if (enabledVariants.length === 0) {
            newErrors.variants = "Phải có ít nhất 1 biến thể được kích hoạt";
        }

        // Validate từng variant
        enabledVariants.forEach((variant) => {
            const priceError = validatePrice(variant.price, "Giá gốc");
            if (priceError) newErrors[`variant_${variant.id}_price`] = priceError;

            const weightError = validateWeight(variant.weight);
            if (weightError) newErrors[`variant_${variant.id}_weight`] = weightError;

            const stockError = validateStock(variant.stockLevel, "Tồn kho");
            if (stockError) newErrors[`variant_${variant.id}_stockLevel`] = stockError;

            // Kiểm tra ảnh biến thể
            if (!variant.imageUrl.trim()) {
                newErrors[`variant_${variant.id}_imageUrl`] = "Ảnh biến thể là bắt buộc";
            }
        });

        setErrors(newErrors);

        // Detailed validation result toast
        if (Object.keys(newErrors).length > 0) {
            const errorTypes = [];
            if (newErrors.productName) errorTypes.push("tên sản phẩm");
            if (newErrors.thumbnail) errorTypes.push("ảnh đại diện");
            if (newErrors.brandId) errorTypes.push("thương hiệu");
            if (newErrors.categoryId) errorTypes.push("danh mục");
            if (newErrors.variants) errorTypes.push("biến thể");

            const variantErrors = Object.keys(newErrors).filter(key => key.startsWith('variant_')).length;
            if (variantErrors > 0) errorTypes.push(`${variantErrors} lỗi biến thể`);

            showErrorToast(
                "Cần hoàn thiện thông tin",
                `Vui lòng kiểm tra: ${errorTypes.join(", ")}. Tổng cộng ${Object.keys(newErrors).length} lỗi cần sửa.`
            );
        }

        return Object.keys(newErrors).length === 0;
    };

    // Clear specific error
    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    // Helper function để ngăn nhập số âm và ký tự không hợp lệ
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Ngăn nhập dấu trừ (-), dấu cộng (+), và ký tự e/E
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    // Helper function để validate và clean input value
    const handleNumberInput = (value: string, min: number = 0, max: number = Infinity): number => {
        const numValue = parseFloat(value);

        // Nếu NaN hoặc nhỏ hơn min, return min
        if (isNaN(numValue) || numValue < min) {
            return min;
        }

        // Nếu lớn hơn max, return max
        if (numValue > max) {
            return max;
        }

        return numValue;
    };

    // Helper function cho integer input
    const handleIntegerInput = (value: string, min: number = 0, max: number = Infinity): number => {
        const numValue = parseInt(value);

        // Nếu NaN hoặc nhỏ hơn min, return min
        if (isNaN(numValue) || numValue < min) {
            return min;
        }

        // Nếu lớn hơn max, return max
        if (numValue > max) {
            return max;
        }

        return numValue;
    };

    // Validate giá và hiển thị toast nếu có lỗi
    const validatePriceWithToast = (price: number, salePrice: number, variantId?: string) => {
        if (salePrice > price && price > 0) {
            const colorName = variantId ? getColorName(parseInt(variantId.split('-')[0])) : "";
            const sizeName = variantId ? getSizeName(parseInt(variantId.split('-')[1])) : "";
            const variantInfo = variantId ? ` (${colorName} - ${sizeName})` : "";

            showErrorToast(
                "Lỗi giá khuyến mãi",
                `Giá khuyến mãi (${salePrice.toLocaleString()} VNĐ) không được lớn hơn giá gốc (${price.toLocaleString()} VNĐ)${variantInfo}`
            );
            return false;
        }
        return true;
    };

    // Validate paste event để ngăn paste số âm
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedValue = e.clipboardData.getData('text');
        if (pastedValue.includes('-') || parseFloat(pastedValue) < 0) {
            e.preventDefault();
        }
    };

    const handleInputChange = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error khi user sửa
        clearError(field);

        // Validate realtime cho một số trường
        if (field === 'productName') {
            const error = validateProductName(value as string);
            if (error) {
                setErrors(prev => ({...prev, [field]: error}));
            }
        }
    };

    // Tạo ma trận biến thể từ màu sắc và kích thước đã chọn
    const generateVariantsMatrix = () => {
        if (selectedColors.length === 0 || selectedSizes.length === 0) {
            showWarningToast(
                "Thiếu thông tin bắt buộc",
                "Vui lòng chọn ít nhất 1 màu sắc và 1 kích thước để tạo ma trận biến thể"
            );
            return;
        }

        // Validate bulk settings trước khi tạo ma trận
        if (!validatePriceWithToast(bulkSettings.price, bulkSettings.price)) { // giảm giá mặc định bằng giá bán
            return; // Dừng nếu có lỗi validation
        }

        // Lấy các cặp (colorId-sizeId) đã tồn tại
        const existingPairs = new Set(formData.variants.map(v => `${v.colorId}-${v.sizeId}`));
        const newVariants: ProductVariant[] = [];

        selectedColors.forEach(colorId => {
            selectedSizes.forEach(sizeId => {
                const key = `${colorId}-${sizeId}`;
                if (!existingPairs.has(key)) {
                    const variant: ProductVariant = {
                        id: key,
                        colorId: parseInt(colorId),
                        sizeId: parseInt(sizeId),
                        price: bulkSettings.price,
                        salePrice: bulkSettings.price, // giảm giá mặc định bằng giá bán
                        stockLevel: bulkSettings.stockLevel, // Tồn kho
                        sold: 0,
                        imageUrl: "",
                        weight: bulkSettings.weight,
                        enabled: true
                    };
                    newVariants.push(variant);
                }
            });
        });

        if (newVariants.length === 0) {
            showInfoToast(
                "Không có biến thể mới",
                "Tất cả các biến thể đã tồn tại. Không có biến thể nào được thêm mới."
            );
            return;
        }

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, ...newVariants]
        }));

        // Clear variants errors
        clearError('variants');

        // Success toast
        showSuccessToast(
            "Tạo biến thể mới thành công",
            `Đã thêm ${newVariants.length} biến thể mới từ ${selectedColors.length} màu sắc và ${selectedSizes.length} kích thước`
        );
    };

    // Cập nhật biến thể cụ thể
    const updateVariant = <K extends keyof ProductVariant>(variantId: string, field: K, value: ProductVariant[K]) => {
        const currentVariant = formData.variants.find(v => v.id === variantId);
        if (!currentVariant) return;

        // Validate giá real-time
        if (field === 'price') {
            const newPrice = value as number;
            const newSalePrice = currentVariant.salePrice; // Giữ nguyên giá khuyến mãi

            // Validate và hiển thị toast nếu có lỗi
            if (!validatePriceWithToast(newPrice, newSalePrice, variantId)) {
                // Nếu có lỗi, vẫn cập nhật giá trị nhưng hiển thị thông báo
            }
        }

        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v =>
                v.id === variantId
                    ? {
                          ...v,
                          price: field === 'price' ? (value as number) : v.price,
                          salePrice: field === 'price' ? (value as number) : v.salePrice,
                          [field]: value
                      }
                    : v
            )








        }));

        // Clear error
        clearError(`variant_${variantId}_${field}`);

        // Toast notification for important changes
        if (field === 'enabled') {
            const variant = formData.variants.find(v => v.id === variantId);
            if (variant) {
                const colorName = getColorName(variant.colorId);
                const sizeName = getSizeName(variant.sizeId);

                if (value) {
                    showInfoToast(
                        "Kích hoạt biến thể",
                        `Đã kích hoạt biến thể ${colorName} - ${sizeName}`
                    );
                } else {
                    showWarningToast(
                        "Vô hiệu hóa biến thể",
                        `Đã vô hiệu hóa biến thể ${colorName} - ${sizeName}`
                    );
                }
            }
        }
    };

    // Áp dụng cài đặt hàng loạt cho tất cả biến thể đã kích hoạt
    const applyBulkSettings = () => {
        const enabledVariants = formData.variants.filter(v => v.enabled);

        if (enabledVariants.length === 0) {
            showWarningToast(
                "Không có biến thể nào được kích hoạt",
                "Vui lòng kích hoạt ít nhất 1 biến thể trước khi áp dụng cài đặt hàng loạt."
            );
            return;
        }

        // Validate bulk settings trước khi áp dụng
        if (!validatePriceWithToast(bulkSettings.price, bulkSettings.price)) { // giảm giá mặc định bằng giá bán
            return; // Dừng nếu có lỗi validation
        }

        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v =>
                v.enabled ? {
                    ...v,
                    price: bulkSettings.price || v.price,
                    salePrice: bulkSettings.price || v.price,
                    weight: bulkSettings.weight || v.weight,
                    stockLevel: bulkSettings.stockLevel !== undefined ? bulkSettings.stockLevel : v.stockLevel
                } : v
            )
        }));

        showSuccessToast(
            "Áp dụng cài đặt thành công",
            `Đã áp dụng cài đặt hàng loạt cho ${enabledVariants.length} biến thể được kích hoạt.`
        );
    };

    // Sửa lại handleSubmit để gọi PUT khi cập nhật
    const handleSubmit = async () => {
        if (!validateRequiredFields()) {
            const errorCount = Object.keys(errors).length;
            showErrorToast(
                "Form có lỗi",
                `Phát hiện ${errorCount} lỗi trong form. Vui lòng kiểm tra và sửa các trường được đánh dấu màu đỏ.`
            );
            return;
        }
        if (!token) {
            showErrorToast(
                "Chưa đăng nhập",
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục."
            );
            return;
        }
        setIsSubmitting(true);
        try {
            const enabledVariants = formData.variants.filter(v => v.enabled);
            const requestData = {
                productId: parseInt(productId),
                productName: formData.productName.trim(),
                description: formData.description.trim(),
                brandId: formData.brandId,
                categoryId: formData.categoryId,
                materialId: formData.materialId || null,
                targetAudienceId: formData.targetAudienceId || null,
                thumbnail: formData.thumbnail,
                variants: enabledVariants.map(v => ({
                    variantId: v.id && !isNaN(Number(v.id)) ? Number(v.id) : undefined,
                    colorId: v.colorId,
                    sizeId: v.sizeId,
                    price: v.price,
                    salePrice: v.salePrice,
                    stockLevel: v.stockLevel,
                    sold: v.sold,
                    imageUrl: v.imageUrl,
                    weight: v.weight
                }))
            };
            const response = await fetch(`http://localhost:8080/api/products`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });
            if (response.ok) {
                showSuccessToast(
                    "Cập nhật sản phẩm thành công!",
                    `Sản phẩm "${formData.productName}" đã được cập nhật.`
                );
                router.push("/admin/product_management");
            } else {
                const errorData = await response.json();
                showErrorToast(
                    "Lỗi từ server",
                    errorData.message || "Không thể cập nhật sản phẩm. Vui lòng thử lại sau."
                );
            }
        } catch (err) {
            console.error("Lỗi khi cập nhật sản phẩm:", err);
            showErrorToast(
                "Lỗi kết nối",
                "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getColorName = (colorId: number) => colors.find(c => c.id === colorId)?.name || "";
    const getSizeName = (sizeId: number) => sizes.find(s => s.id === sizeId)?.name || "";

    // Trạng thái tải dữ liệu
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="container mx-auto p-6 max">
                <Card className="border-red-200">
                    <CardBody className="text-center py-8">
                        <div className="text-red-500 mb-4">
                            <h2 className="text-xl font-bold">Không thể tải dữ liệu</h2>
                            <p className="mt-2">Vui lòng kiểm tra kết nối mạng và thử lại</p>
                        </div>
                        <Button
                            color="primary"
                            onPress={() => window.location.reload()}
                        >
                            Tải lại trang
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (isProductLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Đang tải chi tiết sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-1 max">
            {/* Phần đầu trang */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={20}/>
                    </Button>
                    <h1 className="text-2xl font-bold">Cập Nhật Sản Phẩm</h1>
                </div>

                <Button
                    color="primary"
                    startContent={<Save size={18}/>}
                    isLoading={isSubmitting}
                    onPress={handleSubmit}
                    isDisabled={!formData.productName || formData.variants.filter(v => v.enabled).length === 0 || !token || Object.keys(errors).length > 0}
                    className={Object.keys(errors).length > 0 ? "opacity-60" : ""}
                >
                    {Object.keys(errors).length > 0
                        ? `Có ${Object.keys(errors).length} lỗi cần sửa`
                        : `Lưu Sản Phẩm (${formData.variants.filter(v => v.enabled).length} biến thể)`
                    }
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Thông tin cơ bản */}
                <Card className="xl:col-span-1">
                    <CardHeader>
                        <h2 className="text-lg font-semibold">Thông Tin Cơ Bản</h2>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Input
                            label="Tên sản phẩm"
                            placeholder="Nhập tên sản phẩm"
                            value={formData.productName}
                            onChange={(e) => handleInputChange("productName", e.target.value)}
                            isRequired
                            isInvalid={!!errors.productName}
                            errorMessage={errors.productName}
                            maxLength={200}
                        />

                        <Textarea
                            label="Mô tả"
                            placeholder="Nhập mô tả sản phẩm"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            minRows={2}
                            maxLength={1000}
                            isInvalid={!!errors.description}
                            errorMessage={errors.description}
                        />

                        <div className="grid grid-cols-1 gap-3">
                            <Select
                                label="Thương hiệu"
                                placeholder="Chọn thương hiệu"
                                selectedKeys={formData.brandId ? [formData.brandId.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    handleInputChange("brandId", selectedKey ? parseInt(selectedKey) : 0);
                                }}
                                isRequired
                                size="sm"
                                isInvalid={!!errors.brandId}
                                errorMessage={errors.brandId}
                            >
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id}>{brand.brandName}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Danh mục"
                                placeholder="Chọn danh mục"
                                selectedKeys={formData.categoryId ? [formData.categoryId.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    handleInputChange("categoryId", selectedKey ? parseInt(selectedKey) : 0);
                                }}
                                isRequired
                                size="sm"
                                isInvalid={!!errors.categoryId}
                                errorMessage={errors.categoryId}
                            >
                                {categories.map((category) => (
                                    <SelectItem key={category.id}>{category.name}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Chất liệu"
                                placeholder="Chọn chất liệu"
                                selectedKeys={formData.materialId ? [formData.materialId.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    handleInputChange("materialId", selectedKey ? parseInt(selectedKey) : 0);
                                }}
                                size="sm"
                            >
                                {materials.map((material) => (
                                    <SelectItem key={material.id}>{material.name}</SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Đối tượng"
                                placeholder="Chọn đối tượng"
                                selectedKeys={formData.targetAudienceId ? [formData.targetAudienceId.toString()] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    handleInputChange("targetAudienceId", selectedKey ? parseInt(selectedKey) : 0);
                                }}
                                size="sm"
                            >
                                {targetAudiences.map((audience) => (
                                    <SelectItem key={audience.id}>{audience.name}</SelectItem>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2">Ảnh đại diện <span className="text-red-500">*</span>
                            </p>
                            <div className="flex flex-col items-center gap-2">
                                <ProductImageUpload
                                    onUpload={(imageUrl) => handleInputChange("thumbnail", imageUrl)}
                                    onRemove={() => handleInputChange("thumbnail", "")}
                                    label="Chọn ảnh đại diện"
                                    currentImage={formData.thumbnail}
                                    imageClassName="w-20 h-20"
                                />
                                {formData.thumbnail && (
                                    <button
                                        type="button"
                                        className="text-xs text-red-500 underline mt-1"
                                        onClick={() => handleInputChange("thumbnail", "")}
                                    >
                                        Xóa ảnh
                                    </button>
                                )}
                            </div>
                            {errors.thumbnail && (
                                <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
                            )}
                        </div>
                    </CardBody>
                </Card>


                <Card className="xl:col-span-2">
                    <CardHeader className="flex justify-between">
                        <h2 className="text-lg font-semibold">🎯 Tạo biến thể mới</h2>
                        <div className="flex gap-2">
                            <Button
                                color="success"
                                size="sm"
                                startContent={<RefreshCw size={16}/>}
                                onPress={generateVariantsMatrix}
                                isDisabled={selectedColors.length === 0 || selectedSizes.length === 0}
                            >
                                Tạo biến thể ({selectedColors.length}×{selectedSizes.length})
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                        {/* Chọn nhiều màu sắc và kích thước */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="🎨 Chọn Màu Sắc"
                                placeholder="Chọn nhiều màu sắc..."
                                selectionMode="multiple"
                                selectedKeys={new Set(selectedColors)}
                                onSelectionChange={(keys) => setSelectedColors(Array.from(keys) as string[])}
                                classNames={{
                                    trigger: "min-h-12",
                                }}
                            >
                                {colors.map((color) => (
                                    <SelectItem key={color.id.toString()}>
                                        {color.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="📏 Chọn Kích Thước"
                                placeholder="Chọn nhiều kích thước..."
                                selectionMode="multiple"
                                selectedKeys={new Set(selectedSizes)}
                                onSelectionChange={(keys) => setSelectedSizes(Array.from(keys) as string[])}
                                classNames={{
                                    trigger: "min-h-12",
                                }}
                            >
                                {sizes.map((size) => (
                                    <SelectItem key={size.id.toString()}>
                                        {size.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <Divider/>

                        {/* Cài đặt hàng loạt */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Settings size={16}/>
                                <h3 className="font-medium">Cài Đặt Hàng Loạt</h3>
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={applyBulkSettings}
                                    isDisabled={formData.variants.length === 0}
                                >
                                    Áp Dụng Cho Tất Cả
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <Input
                                    label="Giá gốc (VNĐ)"
                                    type="number"
                                    size="sm"
                                    min={0}
                                    max={999999999}
                                    value={bulkSettings.price.toString()}
                                    onChange={(e) => {
                                        const value = handleNumberInput(e.target.value, 0, 999999999);
                                        setBulkSettings(prev => ({...prev, price: value}));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                />
                                <Input
                                    label="Trọng lượng (g)"
                                    type="number"
                                    size="sm"
                                    min={0}
                                    max={50000}
                                    value={bulkSettings.weight.toString()}
                                    onChange={(e) => {
                                        const value = handleNumberInput(e.target.value, 0, 50000);
                                        setBulkSettings(prev => ({...prev, weight: value}));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                />
                                <Input
                                    label="Tồn kho"
                                    type="number"
                                    size="sm"
                                    min={0}
                                    max={999999}
                                    value={bulkSettings.stockLevel.toString()}
                                    onChange={(e) => {
                                        const value = handleIntegerInput(e.target.value, 0, 999999);
                                        setBulkSettings(prev => ({ ...prev, stockLevel: value }));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onPaste={handlePaste}
                                />
                            </div>
                        </div>

                        {/* Bảng danh sách biến thể */}
                        {formData.variants.length > 0 && (
                            <div>
                                <h3 className="font-medium mb-3">📋 Danh Sách Biến Thể
                                    ({formData.variants.filter(v => v.enabled).length}/{formData.variants.length})</h3>
                                {errors.variants && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                        <p className="text-red-600 text-sm">{errors.variants}</p>
                                    </div>
                                )}
                                <div className="border rounded-lg overflow-x-auto">
                                    <Table
                                        aria-label="Bảng biến thể sản phẩm"
                                        classNames={{
                                            table: "min-h-[200px] min-w-[1000px]", // Tăng min-width để chứa thêm cột
                                        }}
                                    >
                                        <TableHeader>
                                            <TableColumn>KÍCH HOẠT</TableColumn>
                                            <TableColumn>SKU</TableColumn>
                                            <TableColumn>BIẾN THỂ</TableColumn>
                                            <TableColumn>GIÁ GỐC</TableColumn>
                                            <TableColumn>TRỌNG LƯỢNG</TableColumn>
                                            <TableColumn>TỒN KHO</TableColumn>
                                            <TableColumn>ẢNH BIẾN THỂ</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.variants.map((variant) => (
                                                <TableRow key={variant.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            isSelected={variant.enabled}
                                                            onValueChange={(checked: boolean) => updateVariant(variant.id, 'enabled', checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{variant.sku}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Chip size="sm" color="primary" variant="flat">
                                                                {getColorName(variant.colorId)}
                                                            </Chip>
                                                            <Chip size="sm" color="secondary" variant="flat">
                                                                {getSizeName(variant.sizeId)}
                                                            </Chip>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            size="sm"
                                                            min={0}
                                                            max={999999999}
                                                            value={variant.price.toString()}
                                                            onChange={(e) => updateVariant(variant.id, 'price', handleNumberInput(e.target.value, 0, 999999999))}
                                                            className="w-24"
                                                            isInvalid={!!errors[`variant_${variant.id}_price`]}
                                                            onKeyDown={handleKeyDown}
                                                            onPaste={handlePaste}
                                                        />
                                                        {errors[`variant_${variant.id}_price`] && (
                                                            <p className="text-red-500 text-xs mt-1">{errors[`variant_${variant.id}_price`]}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            size="sm"
                                                            min={0}
                                                            max={50000}
                                                            value={variant.weight.toString()}
                                                            onChange={(e) => updateVariant(variant.id, 'weight', handleNumberInput(e.target.value, 0, 50000))}
                                                            className="w-20"
                                                            isInvalid={!!errors[`variant_${variant.id}_weight`]}
                                                            onKeyDown={handleKeyDown}
                                                            onPaste={handlePaste}
                                                        />
                                                        {errors[`variant_${variant.id}_weight`] && (
                                                            <p className="text-red-500 text-xs mt-1">{errors[`variant_${variant.id}_weight`]}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            size="sm"
                                                            min={0}
                                                            max={999999}
                                                            value={variant.stockLevel.toString()}
                                                            onChange={(e) => updateVariant(variant.id, 'stockLevel', handleIntegerInput(e.target.value, 0, 999999))}
                                                            className="w-20"
                                                            isInvalid={!!errors[`variant_${variant.id}_stockLevel`]}
                                                            onKeyDown={handleKeyDown}
                                                            onPaste={handlePaste}
                                                        />
                                                        {errors[`variant_${variant.id}_stockLevel`] && (
                                                            <p className="text-red-500 text-xs mt-1">{errors[`variant_${variant.id}_stockLevel`]}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="w-32 flex flex-col items-center gap-2">
                                                            <ProductImageUpload
                                                                onUpload={(imageUrl) => updateVariant(variant.id, 'imageUrl', imageUrl)}
                                                                onRemove={() => updateVariant(variant.id, 'imageUrl', '')}
                                                                label="Chọn ảnh"
                                                                currentImage={variant.imageUrl}
                                                                imageClassName="w-24 h-24"
                                                            />
                                                            {errors[`variant_${variant.id}_imageUrl`] && (
                                                                <p className="text-red-500 text-xs mt-1">{errors[`variant_${variant.id}_imageUrl`]}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {formData.variants.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">🎯</div>
                                <h3 className="text-lg font-medium mb-2">Chưa có biến thể nào</h3>
                                <p className="text-sm">Chọn màu sắc và kích thước, sau đó nhấn &quot;Tạo Ma Trận&quot; để bắt
                                    đầu</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}