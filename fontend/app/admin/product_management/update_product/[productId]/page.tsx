"use client";

import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Divider,
    Button,
    addToast,
    Accordion,
    AccordionItem,
    Autocomplete,
    AutocompleteItem,
    Spinner
} from "@heroui/react";
import {Input, Textarea} from "@heroui/input";
import {CldUploadButton, CldImage} from "next-cloudinary";
import {useState, useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import {useSession} from "next-auth/react";

interface ProductVariant { // From ProductDetailDTO (for displaying)
    variantId: number;
    sku: string;
    color: string;
    size: string;
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}

interface ProductDetail { // Matches ProductDetailDTO
    productId: number;
    productName: string;
    description: string;
    material: string;
    targetAudience: string
    purchases: number;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    thumbnail: string | null; // Cloudinary public_id or null
    variants: ProductVariant[];
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: ProductDetail;
}

interface Brand {
    id: number;
    brandName: string;
}

interface Category {
    id: number;
    name: string;
}

// Updated VariantInput to ensure color and size are always present
interface VariantInput {
    variantId?: number; // For existing variants
    sku: string;
    color: string;      // Changed from optional
    size: string;       // Changed from optional
    price: string;
    stockLevel: string;
    image: any;         // Cloudinary result object or public_id string
    weight: string;
}

// (DataTypeOptions and parseVariantAttributes can remain if used elsewhere, but not directly for this update logic)

export default function UpdateProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string | undefined;
    const {data: session, status} = useSession();

    // State for form sản phẩm
    const [productData, setProductData] = useState<ProductDetail | null>(null);
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [material, setMaterial] = useState(""); // Added for material
    const [targetAudience, setTargetAudience] = useState(""); // Added for targetAudience
    const [thumbnail, setThumbnail] = useState<any>(null); // Added for thumbnail (Cloudinary object or public_id)
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true); // For display, not in update payload
    const [variants, setVariants] = useState<VariantInput[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const authToken = session?.accessToken;

    useEffect(() => {
        if (status === 'unauthenticated') {
            addToast({
                title: "Cần đăng nhập",
                description: "Vui lòng đăng nhập để tiếp tục.",
                color: "danger"
            });
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (productId && authToken) {
            setLoading(true);
            setFormError(null);

            const fetchProductData = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/products/${productId}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data: ApiResponse = await response.json();

                    if (data.status === 200 && data.data) {
                        setProductData(data.data);
                        setProductName(data.data.productName);
                        setDescription(data.data.description || '');
                        setMaterial(data.data.material || ''); // Initialize material
                        setTargetAudience(data.data.targetAudience || ''); // Initialize targetAudience
                        setBrandId(data.data.brandId.toString());
                        setCategoryId(data.data.categoryId.toString());
                        setIsActive(data.data.isActive);
                        setThumbnail(data.data.thumbnail ? {public_id: data.data.thumbnail} : null);

                        const variantInputs: VariantInput[] = data.data.variants.map(variant => ({
                            variantId: variant.variantId,
                            sku: variant.sku,
                            color: variant.color || "", // Ensure color is initialized
                            size: variant.size || "",   // Ensure size is initialized
                            price: variant.price.toString(),
                            stockLevel: variant.stockLevel.toString(),
                            image: variant.imageUrl ? {public_id: variant.imageUrl} : null,
                            weight: variant.weight.toString()
                        }));
                        setVariants(variantInputs);
                    } else {
                        throw new Error(data.message || 'Không thể tải dữ liệu sản phẩm');
                    }
                } catch (err: any) {
                    console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
                    setFormError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu sản phẩm');
                    addToast({title: "Lỗi", description: "Không thể tải thông tin sản phẩm", color: "danger"});
                }
            };

            const fetchMetadata = async () => {
                try {
                    const [brandRes, catRes] = await Promise.all([
                        fetch("http://localhost:8080/api/brands?page=0&size=100"),
                        fetch("http://localhost:8080/api/categories?page=0&size=100"),
                    ]);
                    const brandData = await brandRes.json();
                    const catData = await catRes.json();
                    setBrands(brandData.data.content || []);
                    setCategories(catData.data.content || []);
                } catch (err) {
                    console.error('Lỗi khi tải metadata:', err);
                    setFormError("Không thể tải dữ liệu danh mục hoặc thương hiệu.");
                }
            };

            Promise.all([fetchProductData(), fetchMetadata()]).finally(() => setLoading(false));
        } else {
            if (!productId) setFormError("Không tìm thấy ID sản phẩm");
            if (!authToken && status !== 'loading') setFormError("Bạn cần đăng nhập để thực hiện chức năng này");
            if (status !== 'loading') setLoading(false);
        }
    }, [productId, authToken, status]);

    const addVariant = () => {
        setVariants([...variants, {sku: "", color: "", size: "", price: "", stockLevel: "", image: null, weight: ""}]);
    };

    const removeVariant = (idx: number) => {
        // const variant = variants[idx]; // No need for deletedVariantIds as backend relies on SKU comparison
        setVariants(variants.filter((_, i) => i !== idx));
    };

    const handleVariantChange = (idx: number, field: string, value: any) => {
        setVariants(variants.map((v, i) => i === idx ? {...v, [field]: value} : v));
    };

    // Product attribute functions (toggleProductAttribute, etc.) can remain if UI is kept
    // but they won't be part of this specific product update payload

    const validateForm = () => {
        const errors: string[] = [];
        if (!productName.trim()) errors.push("Vui lòng nhập tên sản phẩm");
        if (!brandId) errors.push("Vui lòng chọn thương hiệu");
        if (!categoryId) errors.push("Vui lòng chọn danh mục");
        // Add validation for material, targetAudience, thumbnail if they are mandatory
        if (!material.trim()) errors.push("Vui lòng nhập chất liệu sản phẩm");
        if (!targetAudience.trim()) errors.push("Vui lòng nhập đối tượng mục tiêu");
        if (!thumbnail) errors.push("Vui lòng chọn ảnh bìa sản phẩm");


        if (variants.length === 0) {
            errors.push("Vui lòng thêm ít nhất một biến thể sản phẩm");
        }
        variants.forEach((v, i) => {
            if (!v.price.trim() || !v.stockLevel.trim() || !v.image || !v.weight.trim()) {
                errors.push(`Vui lòng nhập đầy đủ thông tin (SKU, giá, tồn kho, ảnh, trọng lượng) cho biến thể #${i + 1}`);
            }
            // Add validation for v.color and v.size if needed
            if (!v.color.trim()) errors.push(`Vui lòng nhập màu cho biến thể #${i + 1}`);
            if (!v.size.trim()) errors.push(`Vui lòng nhập kích thước cho biến thể #${i + 1}`);

            if (isNaN(Number(v.price)) || Number(v.price) <= 0) {
                errors.push(`Giá của biến thể #${i + 1} phải lớn hơn 0`);
            }
            if (isNaN(Number(v.stockLevel)) || Number(v.stockLevel) < 0) {
                errors.push(`Số lượng tồn kho của biến thể #${i + 1} không được âm`);
            }
            if (isNaN(Number(v.weight)) || Number(v.weight) < 0) {
                errors.push(`Trọng lượng của biến thể #${i + 1} không được âm`);
            }
        });

        setValidationErrors(errors);
        if (errors.length > 0) {
            setFormError(errors.join("; "));
            addToast({title: "Lỗi xác thực", description: errors.join("\n"), color: "danger"});
            return false;
        }
        setFormError(null);
        setValidationErrors([]);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting || !authToken) {
            if (!authToken) addToast({title: "Lỗi", description: "Phiên đăng nhập hết hạn", color: "danger"});
            return;
        }
        setIsSubmitting(true);

        try {
            const token = session?.accessToken;
            if (!token) throw new Error("Bạn cần đăng nhập.");

            const variantPayload = variants.map(v => ({
                variantId: v.variantId || null, // Send variantId if it exists (for existing variants), else null
                sku: v.sku.trim(),
                color: v.color.trim(), // Add color
                size: v.size.trim(),   // Add size
                price: Number(v.price),
                stockLevel: parseInt(v.stockLevel),
                imageUrl: v.image?.public_id || (typeof v.image === 'string' ? v.image : null), // Handle image object or direct public_id string
                weight: Number(v.weight),
            }));

            const payload = {
                productId: parseInt(productId!),
                productName: productName.trim(),
                description: description.trim(),
                brandId: parseInt(brandId),
                categoryId: parseInt(categoryId),
                material: material.trim(), // Add material
                targetAudience: targetAudience.trim(), // Add targetAudience
                thumbnail: thumbnail?.public_id || (typeof thumbnail === 'string' ? thumbnail : null), // Add thumbnail public_id
                variants: variantPayload
            };

            console.log("Updating product with payload: ", JSON.stringify(payload, null, 2));

            const response = await fetch("http://localhost:8080/api/products", { // Assuming PUT to /api/products for update
                method: "PUT",
                headers: {"Content-Type": "application/json", "Authorization": `Bearer ${token}`},
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData?.message || `HTTP error! Status: ${response.status}`);
            }

            addToast({title: "Thành công", description: "Cập nhật sản phẩm thành công!", color: "success"});
            setTimeout(() => router.push("/admin/product_management"), 1500);

        } catch (err: any) {
            console.error("Lỗi khi cập nhật sản phẩm:", err);
            setFormError(err.message || "Không thể cập nhật sản phẩm.");
            addToast({title: "Lỗi", description: err.message || "Không thể cập nhật sản phẩm", color: "danger"});
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><Spinner label="Đang tải..." size="lg"/>
        </div>;
    }
    if (formError && !productData) {
        // ... (error display remains the same)
        return (
            <Card className="w-full max-w-3xl mx-auto my-10">
                <CardHeader><p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p></CardHeader>
                <Divider/>
                <CardBody>
                    <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                        {formError}. Không thể hiển thị form cập nhật. Vui lòng thử lại sau.
                    </p>
                    <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl mx-auto my-10">
            <form onSubmit={handleSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-2xl font-bold">Cập nhật sản phẩm</p>
                        <p className="text-sm text-gray-500">ID: {productId}</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="space-y-6 p-5">
                    <Input label="Tên sản phẩm" value={productName} onChange={e => setProductName(e.target.value)}
                           isRequired/>
                    <Textarea label="Mô tả sản phẩm" value={description}
                              onChange={e => setDescription(e.target.value)}/>

                    <Input
                        label="Chất liệu"
                        value={material}
                        onChange={e => setMaterial(e.target.value)}
                        placeholder="Ví dụ: Cotton, Polyester, Kim loại..."
                        isRequired
                    />
                    <Input
                        label="Đối tượng khách hàng"
                        value={targetAudience}
                        onChange={e => setTargetAudience(e.target.value)}
                        placeholder="Ví dụ: Nam giới, Nữ giới, Trẻ em, Người lớn tuổi..."
                    />

                    {/* Thumbnail Upload */}
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <h6 className="font-medium mb-3 text-gray-700">🖼️ Ảnh bìa sản phẩm</h6>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <CldUploadButton
                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                    onSuccess={(result: any, {widget}) => {
                                        setThumbnail(result.info); // result.info contains public_id, url etc.
                                        widget.close();
                                    }}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    {thumbnail ? "🔄 Thay đổi ảnh bìa" : "📤 Tải ảnh bìa"}
                                </CldUploadButton>
                                {!thumbnail && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ảnh đại diện chính cho sản phẩm.
                                    </p>
                                )}
                            </div>
                            {thumbnail && (
                                <div className="flex-shrink-0">
                                    <CldImage
                                        width={120}
                                        height={120}
                                        src={thumbnail.public_id || thumbnail}
                                        alt="Ảnh bìa sản phẩm"
                                        className="object-cover rounded-lg border-2 border-gray-200"
                                    />
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Autocompletes for Brand and Category remain the same */}
                        <div>
                            <Autocomplete label="Thương hiệu" placeholder="Chọn thương hiệu" defaultItems={brands}
                                          selectedKey={brandId} onSelectionChange={(key) => setBrandId(key as string)}
                                          isRequired>
                                {(brand) => <AutocompleteItem key={brand.id.toString()}
                                                              textValue={brand.brandName}>{brand.brandName}</AutocompleteItem>}
                            </Autocomplete>
                        </div>
                        <div>
                            <Autocomplete label="Danh mục" placeholder="Chọn danh mục" defaultItems={categories}
                                          selectedKey={categoryId}
                                          onSelectionChange={(key) => setCategoryId(key as string)} isRequired>
                                {(category) => <AutocompleteItem key={category.id.toString()}
                                                                 textValue={category.name}>{category.name}</AutocompleteItem>}
                            </Autocomplete>
                        </div>
                    </div>

                    <Accordion variant="splitted">
                        <AccordionItem key="2" aria-label="Biến thể sản phẩm" title="Biến thể sản phẩm">
                            <div className="space-y-4">
                                {/* ... (Header mô tả biến thể) ... */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-800 mb-2">Quản lý biến thể sản phẩm</h4>
                                    {/* ... description ... */}
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">🎨 Danh sách biến thể</p>
                                        <p className="text-sm text-gray-600">
                                            {variants.length === 0 ? "Chưa có biến thể nào" : `${variants.length} biến thể`}
                                        </p>
                                    </div>
                                    <Button type="button" color="primary" variant="solid" onClick={addVariant}
                                            className="font-medium">
                                        ➕ Thêm biến thể mới
                                    </Button>
                                </div>

                                {variants.length === 0 ? (
                                    <div
                                        className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        {/* ... empty state ... */}
                                        <Button type="button" color="primary" variant="ghost" onClick={addVariant}>
                                            🚀 Tạo biến thể đầu tiên
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {variants.map((variant, idx) => (
                                            <Card key={idx}
                                                  className="p-4 bg-white border-2 border-gray-200 hover:border-purple-300 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h6 className="font-semibold text-lg text-purple-800">
                                                        🎯 Biến thể #{idx + 1}
                                                        {variant.variantId && (<span
                                                            className="text-sm text-gray-500 ml-2">(ID: {variant.variantId})</span>)}
                                                    </h6>
                                                    <Button type="button" color="danger" variant="light" size="sm"
                                                            onClick={() => removeVariant(idx)}>
                                                        🗑️ Xóa biến thể
                                                    </Button>
                                                </div>

                                                <div className="mb-4">
                                                    <h6 className="font-medium mb-3 text-gray-700">📋 Thông tin cơ bản &
                                                        Thuộc tính</h6>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <Input label="Màu sắc" value={variant.color}
                                                               onChange={e => handleVariantChange(idx, "color", e.target.value)}
                                                               variant="bordered" placeholder="VD: Đỏ, Xanh Lam"/>
                                                        <Input label="Kích thước" value={variant.size}
                                                               onChange={e => handleVariantChange(idx, "size", e.target.value)}
                                                               variant="bordered"
                                                               placeholder="VD: S, M, L, XL, 40, 41"/>
                                                        <Input label="Giá (VNĐ)" type="number" value={variant.price}
                                                               onChange={e => handleVariantChange(idx, "price", e.target.value)}
                                                               isRequired variant="bordered" placeholder="0"/>
                                                        <Input label="Số lượng tồn kho" type="number"
                                                               value={variant.stockLevel}
                                                               onChange={e => handleVariantChange(idx, "stockLevel", e.target.value)}
                                                               isRequired variant="bordered" placeholder="0"/>
                                                        <Input label="Trọng lượng (gram)" type="number"
                                                               value={variant.weight}
                                                               onChange={e => handleVariantChange(idx, "weight", e.target.value)}
                                                               isRequired variant="bordered" placeholder="0"/>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-lg border">
                                                    <h6 className="font-medium mb-3 text-gray-700">📸 Ảnh biến thể</h6>
                                                    {/* ... (CldUploadButton and CldImage for variant image remain largely the same) ... */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <CldUploadButton
                                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                                                onSuccess={(result: any, {widget}) => { // Ensure 'any' or specific type for result
                                                                    handleVariantChange(idx, "image", result.info);
                                                                    widget.close();
                                                                }}
                                                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                                            >
                                                                {variant.image ? "🔄 Thay đổi ảnh" : "📷 Chọn ảnh biến thể"}
                                                            </CldUploadButton>
                                                            {!variant.image &&
                                                                <p className="text-xs text-gray-500 mt-1">Ảnh cho biến
                                                                    thể này.</p>}
                                                        </div>
                                                        {variant.image && (
                                                            <div className="flex-shrink-0 relative">
                                                                <CldImage width={100} height={100}
                                                                          src={variant.image.public_id || variant.image}
                                                                          alt={`Ảnh ${idx + 1}`}
                                                                          className="object-cover rounded-lg border-2"/>
                                                                {/* ... checkmark ... */}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AccordionItem>
                    </Accordion>

                    {formError && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md"
                           role="alert">
                            {formError}
                        </p>
                    )}
                    {validationErrors.length > 0 && (
                        <div className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md"
                             role="alert">
                            <p className="font-semibold mb-1">Vui lòng sửa các lỗi sau:</p>
                            <ul className="list-disc list-inside">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardBody>
                <Divider/>
                <CardFooter className="p-5 flex justify-end gap-3">
                    <Button color="default" type="button" onClick={() => router.push("/admin/product_management")}>
                        Quay lại
                    </Button>
                    <Button color="success" type="submit" isDisabled={isSubmitting || status !== "authenticated"}>
                        {isSubmitting ? "Đang xử lý..." : "Cập nhật sản phẩm"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}