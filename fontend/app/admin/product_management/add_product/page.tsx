"use client";
import { Card, CardHeader, CardBody, CardFooter, Divider, Button, addToast, Spinner } from "@heroui/react";
import { Input, Textarea } from "@heroui/input";
import { CldUploadButton, CldImage } from "next-cloudinary";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Brand {
    id: number;
    brandName: string;
}
interface Category {
    id: number;
    name: string;
}
interface Attribute {
    id: number;
    attributeName: string;
    dataType: string;
}
interface VariantInput {
    sku: string;
    price: string;
    stockLevel: string;
    image: any;
    weight: string;
    attributes: { [key: string]: string };
}

// Thêm interface mới cho productAttributes
interface ProductAttribute {
    attributes: {
        attributeId: number;
        value: string;
    }[];
}

export default function AddProductPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    // State cho form sản phẩm
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [variants, setVariants] = useState<VariantInput[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cập nhật state
    const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);

    // Lấy dữ liệu brands, categories, attributes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brandRes, catRes, attrRes] = await Promise.all([
                    fetch("http://localhost:8080/api/brands?page=0&size=100"),
                    fetch("http://localhost:8080/api/categories?page=0&size=100"),
                    fetch("http://localhost:8080/api/attributes?page=0&size=100"),
                ]);
                const brandData = await brandRes.json();
                const catData = await catRes.json();
                const attrData = await attrRes.json();
                setBrands(brandData.data.content || []);
                setCategories(catData.data.content || []);
                setAttributes(attrData.data.content || []);
            } catch (err) {
                setFormError("Không thể tải dữ liệu danh mục, thương hiệu hoặc thuộc tính.");
            }
        };
        fetchData();
    }, []);

    // Thêm biến thể mới
    const addVariant = () => {
        setVariants([...variants, { sku: "", price: "", stockLevel: "", image: null, weight: "", attributes: {} }]);
    };

    // Xóa biến thể
    const removeVariant = (idx: number) => {
        setVariants(variants.filter((_, i) => i !== idx));
    };

    // Xử lý thay đổi trường của biến thể
    const handleVariantChange = (idx: number, field: string, value: any) => {
        setVariants(variants.map((v, i) => i === idx ? { ...v, [field]: value } : v));
    };

    // Xử lý thay đổi thuộc tính của biến thể
    const handleVariantAttributeChange = (idx: number, attrId: string, value: string) => {
        setVariants(variants.map((v, i) => i === idx ? { ...v, attributes: { ...v.attributes, [attrId]: value } } : v));
    };

    // Validate form
    const validateForm = () => {
        if (!productName.trim()) {
            setFormError("Vui lòng nhập tên sản phẩm.");
            return false;
        }
        if (!brandId) {
            setFormError("Vui lòng chọn thương hiệu.");
            return false;
        }
        if (!categoryId) {
            setFormError("Vui lòng chọn danh mục.");
            return false;
        }
        if (variants.length === 0) {
            setFormError("Vui lòng thêm ít nhất một biến thể sản phẩm.");
            return false;
        }
        for (const v of variants) {
            if (!v.sku || !v.price || !v.stockLevel || !v.image || !v.weight) {
                setFormError("Vui lòng nhập đầy đủ thông tin cho mỗi biến thể.");
                return false;
            }
        }
        setFormError(null);
        return true;
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const token = session?.accessToken;
            if (!token) throw new Error("Bạn cần đăng nhập.");

            // Chuẩn hóa dữ liệu biến thể
            const variantPayload = variants.map(v => ({
                sku: v.sku,
                price: Number(v.price),
                stockLevel: Number(v.stockLevel),
                imageUrl: v.image.public_id,
                weight: Number(v.weight),
                attributes: Object.entries(v.attributes).map(([attrId, value]) => ({
                    attributeId: Number(attrId),
                    value
                }))
            }));

            const payload = {
                productName: productName.trim(),
                description: description.trim(),
                brandId: Number(brandId),
                categoryId: Number(categoryId),
                productAttributes: [{
                    attributes: Object.entries(variants[0].attributes).map(([attrId, value]) => ({
                        attributeId: Number(attrId),
                        value
                    }))
                }],
                variants: variantPayload
            };
            console.log("> Sản phẩm được tạo mới: ", JSON.stringify(payload, null, 2));
            const response = await fetch("http://localhost:8080/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            addToast({ title: "Thành công", description: "Tạo sản phẩm thành công!", color: "success" });
            setTimeout(() => router.push("/admin/product_management"), 1500);
        } catch (err: any) {
            setFormError(err.message || "Không thể tạo sản phẩm. Đã xảy ra lỗi không mong muốn.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto my-10">
            <form onSubmit={handleSubmit}>
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-2xl font-bold">Tạo mới sản phẩm</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6 p-5">
                    <Input label="Tên sản phẩm" value={productName} onChange={e => setProductName(e.target.value)} isRequired />
                    <Textarea label="Mô tả sản phẩm" value={description} onChange={e => setDescription(e.target.value)} />

                    <div>
                        <label htmlFor="brandId" className="block text-sm font-medium text-gray-700">Thương hiệu <span className="text-red-500">*</span></label>
                        <select
                            id="brandId"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={brandId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBrandId(e.target.value)}
                            required
                        >
                            <option value="">-- Chọn thương hiệu --</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.brandName}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Danh mục <span className="text-red-500">*</span></label>
                        <select
                            id="categoryId"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={categoryId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
                            required
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <Divider />
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold">Biến thể sản phẩm</p>
                            <Button type="button" color="primary" onClick={addVariant}>Thêm biến thể</Button>
                        </div>
                        {variants.map((variant, idx) => (
                            <div key={idx} className="border p-3 mb-3 rounded bg-gray-50">
                                <div className="flex gap-2 mb-2">
                                    <Input label="SKU" value={variant.sku} onChange={e => handleVariantChange(idx, "sku", e.target.value)} isRequired />
                                    <Input label="Giá" type="number" value={variant.price} onChange={e => handleVariantChange(idx, "price", e.target.value)} isRequired />
                                    <Input label="Tồn kho" type="number" value={variant.stockLevel} onChange={e => handleVariantChange(idx, "stockLevel", e.target.value)} isRequired />
                                    <Input label="Weight" type="number" value={variant.weight} onChange={e => handleVariantChange(idx, "weight", e.target.value)} isRequired />
                                </div>
                                <div className="flex gap-2 mb-2">
                                    {attributes.map(attr => (
                                        <Input
                                            key={attr.id}
                                            label={attr.attributeName}
                                            value={variant.attributes[attr.id] || ""}
                                            onChange={e => handleVariantAttributeChange(idx, attr.id.toString(), e.target.value)}
                                            isRequired
                                        />
                                    ))}
                                </div>
                                <div>
                                    <p className="mb-1 text-sm">Ảnh biến thể</p>
                                    <CldUploadButton
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                        onSuccess={(result, { widget }) => { handleVariantChange(idx, "image", result.info); widget.close(); }}
                                    >
                                        Chọn ảnh biến thể
                                    </CldUploadButton>
                                    {variant.image && (
                                        <div className="mt-2">
                                            <CldImage width={80} height={80} src={variant.image.public_id} alt="Ảnh biến thể" className="object-cover rounded" />
                                        </div>
                                    )}
                                </div>
                                <Button type="button" color="danger" className="mt-2" onClick={() => removeVariant(idx)}>Xóa biến thể</Button>
                            </div>
                        ))}
                    </div>
                    {formError && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
                            {formError}
                        </p>
                    )}
                </CardBody>
                <Divider />
                <CardFooter className="p-5 flex justify-end">
                    <Button color="success" type="submit" isDisabled={isSubmitting || status !== "authenticated"}>
                        {isSubmitting ? "Đang xử lý..." : "Tạo sản phẩm"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
