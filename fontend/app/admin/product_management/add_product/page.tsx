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
    AutocompleteItem
} from "@heroui/react";
import {Input, Textarea} from "@heroui/input";
import {CldUploadButton, CldImage} from "next-cloudinary";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";

interface Brand {
    id: number;
    brandName: string;
}

interface Category {
    id: number;
    name: string;
}

interface VariantInput {
    sku: string;
    price: string;
    stockLevel: string;
    imageUrl: any;
    weight: string;
    color: string;
    size: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const {data: session} = useSession();

    // State cho form sản phẩm
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState<string | null>(null); // Allow null initial state
    const [categoryId, setCategoryId] = useState<string | null>(null); // Allow null initial state
    const [material, setMaterial] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [productThumbnail, setProductThumbnail] = useState<any>(null); // For main product image

    const [variants, setVariants] = useState<VariantInput[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lấy dữ liệu brands, categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brandRes, catRes] = await Promise.all([
                    fetch("http://localhost:8080/api/brands?page=0&size=1000"), // Increased size
                    fetch("http://localhost:8080/api/categories?page=0&size=1000"), // Increased size
                ]);
                if (!brandRes.ok || !catRes.ok) {
                    throw new Error('Failed to fetch brands or categories');
                }
                const brandData = await brandRes.json();
                const catData = await catRes.json();
                setBrands(brandData.data.content || []);
                setCategories(catData.data.content || []);
            } catch (err) {
                console.error("Fetch data error:", err);
                setFormError("Không thể tải dữ liệu danh mục hoặc thương hiệu.");
                addToast({
                    title: "Lỗi tải dữ liệu",
                    description: "Không thể tải danh mục/thương hiệu.",
                    color: "danger"
                });
            }
        };
        fetchData();
    }, []);

    // Thêm biến thể mới
    const addVariant = () => {
        setVariants([...variants, {
            sku: "",
            price: "",
            stockLevel: "",
            imageUrl: null,
            weight: "",
            color: "", // Initialize color
            size: ""   // Initialize size
        }]);
    };

    // Xóa biến thể
    const removeVariant = (idx: number) => {
        setVariants(variants.filter((_, i) => i !== idx));
    };

    // Xử lý thay đổi trường của biến thể (including color and size)
    const handleVariantChange = (idx: number, field: keyof VariantInput, value: any) => {
        setVariants(variants.map((v, i) => i === idx ? {...v, [field]: value} : v));
    };

    // Validate form
    const validateForm = () => {
        if (!productName.trim()) {
            setFormError("Vui lòng nhập tên sản phẩm.");
            return false;
        }
        if (!brandId) { // Check for null or empty string
            setFormError("Vui lòng chọn thương hiệu.");
            return false;
        }
        if (!categoryId) { // Check for null or empty string
            setFormError("Vui lòng chọn danh mục.");
            return false;
        }
        if (!productThumbnail) {
            setFormError("Vui lòng tải ảnh bìa sản phẩm.");
            return false;
        }

        if (variants.length === 0) {
            setFormError("Vui lòng thêm ít nhất một biến thể sản phẩm.");
            return false;
        }
        for (const v of variants) {
            if (!v.price.trim() || !v.stockLevel.trim() || !v.imageUrl || !v.weight.trim() || !v.color.trim() || !v.size.trim()) {
                setFormError(`Vui lòng nhập đầy đủ thông tin (Giá, Tồn kho, Ảnh, Cân nặng, Màu sắc, Kích thước) cho mỗi biến thể.`);
                return false;
            }
            if (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0) {
                setFormError(`Giá của biến thể phải là số dương.`);
                return false;
            }
            if (isNaN(parseInt(v.stockLevel)) || parseInt(v.stockLevel) < 0) {
                setFormError(`Tồn kho của biến thể phải là số dương.`);
                return false;
            }
            if (isNaN(parseFloat(v.weight)) || parseFloat(v.weight) <= 0) {
                setFormError(`Cân nặng của biến thể phải là số dương.`);
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
            if (!token) {
                addToast({
                    title: "Lỗi xác thực",
                    description: "Bạn cần đăng nhập để thực hiện hành động này.",
                    color: "danger"
                });
                setIsSubmitting(false);
                return;
            }

            const variantPayload = variants.map(v => ({
                sku: v.sku.trim(),
                color: v.color.trim(), // Direct field
                size: v.size.trim(),   // Direct field
                price: parseFloat(v.price), // Ensure this is BigDecimal compatible on backend
                stockLevel: parseInt(v.stockLevel),
                imageUrl: v.imageUrl.public_id, // Assuming image object has public_id
                weight: parseFloat(v.weight)
            }));

            const payload = {
                productName: productName.trim(),
                description: description.trim(),
                brandId: parseInt(brandId!), // Ensure brandId is not null here
                categoryId: parseInt(categoryId!), // Ensure categoryId is not null
                material: material.trim(),
                targetAudience: targetAudience.trim(),
                thumbnail: productThumbnail.public_id, // Assuming productThumbnail object has public_id
                variants: variantPayload
            };

            // console.log("Payload to be sent: ", JSON.stringify(payload, null, 2));

            const response = await fetch("http://localhost:8080/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({message: "Lỗi không xác định từ máy chủ."}));
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            addToast({title: "Thành công", description: "Tạo sản phẩm thành công!", color: "success"});
            setTimeout(() => router.push("/admin/product_management"), 1500); // Adjust route as needed
        } catch (err: any) {
            setFormError(err.message || "Không thể tạo sản phẩm. Đã xảy ra lỗi không mong muốn.");
            addToast({title: "Lỗi tạo sản phẩm", description: err.message || "Đã có lỗi xảy ra.", color: "danger"});
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
                <Divider/>
                <CardBody className="space-y-6 p-5">
                    <Input label="Tên sản phẩm" value={productName} onChange={e => setProductName(e.target.value)}
                           isRequired/>
                    <Textarea label="Mô tả sản phẩm" value={description}
                              onChange={e => setDescription(e.target.value)}/>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Autocomplete
                            label="Thương hiệu"
                            placeholder="Chọn thương hiệu"
                            defaultItems={brands}
                            selectedKey={brandId}
                            onSelectionChange={(key) => setBrandId(key as string)}
                            isRequired
                        >
                            {(brand) => (
                                <AutocompleteItem key={brand.id.toString()} textValue={brand.brandName}>
                                    {brand.brandName}
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                        <Autocomplete
                            label="Danh mục"
                            placeholder="Chọn danh mục"
                            defaultItems={categories}
                            selectedKey={categoryId}
                            onSelectionChange={(key) => setCategoryId(key as string)}
                            isRequired
                        >
                            {(category) => (
                                <AutocompleteItem key={category.id.toString()} textValue={category.name}>
                                    {category.name}
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                    </div>

                    <Input label="Chất liệu (Material)" value={material} onChange={e => setMaterial(e.target.value)}
                           placeholder="Vd: Cotton, Bạc 925"/>
                    <Input label="Đối tượng (Target Audience)" value={targetAudience}
                           onChange={e => setTargetAudience(e.target.value)} placeholder="Vd: Nam, Nữ, Trẻ em"/>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Ảnh bìa sản phẩm
                            (Thumbnail) <span className="text-danger-500">*</span></label>
                        <CldUploadButton
                            options={{multiple: false}}
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"} // Replace with your preset
                            onSuccess={(result: any, {widget}) => { // Specify type for result
                                setProductThumbnail(result.info);
                                widget.close();
                                addToast({
                                    title: "Thành công",
                                    description: "Tải ảnh bìa thành công!",
                                    color: "success"
                                })
                            }}
                            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors w-full md:w-auto"
                        >
                            {productThumbnail ? "🖼️ Thay đổi ảnh bìa" : "📤 Tải ảnh bìa"}
                        </CldUploadButton>
                        {productThumbnail && (
                            <div className="mt-3">
                                <CldImage
                                    width={150}
                                    height={150}
                                    src={productThumbnail.public_id}
                                    alt="Ảnh bìa sản phẩm"
                                    className="object-cover rounded-lg border"
                                />
                            </div>
                        )}
                    </div>


                    <Accordion variant="splitted" defaultExpandedKeys={["variants_accordion"]}>
                        {/* Removed Product Attributes Accordion Item */}
                        <AccordionItem key="variants_accordion" aria-label="Biến thể sản phẩm"
                                       title="Biến thể sản phẩm">
                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-800 mb-2">Quản lý biến thể sản phẩm</h4>
                                    <p className="text-sm text-purple-700">
                                        Mỗi biến thể cần có Màu sắc, Kích thước, Giá, Tồn kho, Trọng lượng và Ảnh
                                        riêng.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="button" color="primary" variant="solid" onClick={addVariant}>
                                        ➕ Thêm biến thể
                                    </Button>
                                </div>

                                {variants.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">Chưa có biến thể nào.</div>
                                )}

                                {variants.map((variant, idx) => (
                                    <Card key={idx} className="p-4 border-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <h6 className="font-semibold text-lg">Biến thể #{idx + 1}</h6>
                                            <Button type="button" color="danger" variant="light" size="sm"
                                                    onClick={() => removeVariant(idx)}>
                                                Xóa biến thể
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Input label="Màu sắc" value={variant.color}
                                                   onChange={e => handleVariantChange(idx, "color", e.target.value)}
                                                   isRequired variant="bordered" placeholder="Vd: Đỏ, Xanh lam"/>
                                            <Input label="Kích thước" value={variant.size}
                                                   onChange={e => handleVariantChange(idx, "size", e.target.value)}
                                                   isRequired variant="bordered" placeholder="Vd: M, L, 30x40cm"/>
                                            <Input label="Giá (VNĐ)" type="number" value={variant.price}
                                                   onChange={e => handleVariantChange(idx, "price", e.target.value)}
                                                   isRequired variant="bordered" min="0"/>
                                            <Input label="Số lượng tồn kho" type="number" value={variant.stockLevel}
                                                   onChange={e => handleVariantChange(idx, "stockLevel", e.target.value)}
                                                   isRequired variant="bordered" min="0"/>
                                            <Input label="Trọng lượng (gram)" type="number" value={variant.weight}
                                                   onChange={e => handleVariantChange(idx, "weight", e.target.value)}
                                                   isRequired variant="bordered" min="0"/>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Ảnh biến
                                                thể <span className="text-danger-500">*</span></label>
                                            <CldUploadButton
                                                options={{multiple: false}}
                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"} // Replace
                                                onSuccess={(result: any, {widget}) => { // Specify type for result
                                                    handleVariantChange(idx, "imageUrl", result.info);
                                                    widget.close();
                                                    addToast({
                                                        title: "Thành công",
                                                        description: `Tải ảnh cho biến thể ${idx + 1} thành công!`,
                                                        color: "success"
                                                    })
                                                }}
                                                className="bg-secondary-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-secondary-600 transition-colors"
                                            >
                                                {variant.imageUrl ? "🔄 Thay đổi ảnh" : "📷 Chọn ảnh"}
                                            </CldUploadButton>
                                            {variant.imageUrl && (
                                                <div className="mt-2">
                                                    <CldImage
                                                        width={80}
                                                        height={80}
                                                        src={variant.imageUrl.public_id}
                                                        alt={`Ảnh biến thể ${idx + 1}`}
                                                        className="object-cover rounded-md border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </AccordionItem>
                    </Accordion>

                    {formError && (
                        <p className="text-red-600 text-sm p-3 bg-red-100 border border-red-300 rounded-md"
                           role="alert">
                            {formError}
                        </p>
                    )}
                </CardBody>
                <Divider/>
                <CardFooter className="p-5 flex justify-end gap-3">
                    <Button color="default" type="button" onClick={() => router.push("/admin/product_management")}>
                        Quay lại
                    </Button>
                    <Button color="success" type="submit" isDisabled={isSubmitting || !session}>
                        {isSubmitting ? "Đang xử lý..." : (session ? "Tạo sản phẩm" : "Vui lòng đăng nhập")}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}