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
    AutocompleteItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import {Input, Textarea} from "@heroui/input";
import {CldUploadButton, CldImage} from "next-cloudinary";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import BrandForm from "@/components/product/BrandForm/BrandForm";
import EditBrandModal from "@/components/product/BrandForm/EditBrandModal";
import CategoryForm from "@/components/product/CategoryForm/CategoryForm";
import EditCategoryModal from "@/components/product/CategoryForm/EditCategoryModal";

interface Brand {
    id: number;
    brandName: string;
    brandInfo?: string;
    logoPublicId?: string;
}

interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Material {
    id: number;
    name: string;
    description?: string;
}

interface TargetAudience {
    id: number;
    name: string;
    description?: string;
}

interface Color {
    id: number;
    name: string;
}

interface Size {
    id: number;
    name: string;
}

interface VariantInput {
    sku: string;
    price: string;
    stockLevel: string;
    imageUrl: any;
    weight: string;
    colorId: string;
    sizeId: string;
}

export default function AddProductPage() {
    const router = useRouter();
    const {data: session} = useSession();

    // Separate modal states for Brand and Category
    const {isOpen: isBrandModalOpen, onOpen: onBrandModalOpen, onOpenChange: onBrandModalOpenChange} = useDisclosure();
    const {isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onOpenChange: onCategoryModalOpenChange} = useDisclosure();

    // Edit Brand Modal state
    const {isOpen: isEditBrandModalOpen, onOpen: onEditBrandModalOpen, onOpenChange: onEditBrandModalOpenChange} = useDisclosure();
    const [selectedBrandIdForEdit, setSelectedBrandIdForEdit] = useState<string | null>(null);

    // Edit Category Modal state
    const {isOpen: isEditCategoryModalOpen, onOpen: onEditCategoryModalOpen, onOpenChange: onEditCategoryModalOpenChange} = useDisclosure();
    const [selectedCategoryIdForEdit, setSelectedCategoryIdForEdit] = useState<string | null>(null);

    // State cho form sản phẩm
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [materialId, setMaterialId] = useState<string | null>(null);
    const [targetAudienceId, setTargetAudienceId] = useState<string | null>(null);
    const [productThumbnail, setProductThumbnail] = useState<any>(null);

    const [variants, setVariants] = useState<VariantInput[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [audiences, setAudiences] = useState<TargetAudience[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lấy dữ liệu metadata
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    brandRes,
                    catRes,
                    materialRes,
                    audienceRes,
                    colorRes,
                    sizeRes
                ] = await Promise.all([
                    fetch("http://localhost:8080/api/brands?page=0&size=1000"),
                    fetch("http://localhost:8080/api/categories?page=0&size=1000"),
                    fetch("http://localhost:8080/api/materials?page=0&size=1000"),
                    fetch("http://localhost:8080/api/target-audiences?page=0&size=1000"),
                    fetch("http://localhost:8080/api/colors?page=0&size=1000"),
                    fetch("http://localhost:8080/api/sizes?page=0&size=1000")
                ]);

                const results = await Promise.all([
                    brandRes.json(),
                    catRes.json(),
                    materialRes.json(),
                    audienceRes.json(),
                    colorRes.json(),
                    sizeRes.json()
                ]);

                if (!brandRes.ok) throw new Error(`Không thể tải thương hiệu: ${brandRes.status}`);
                if (!catRes.ok) throw new Error(`Không thể tải danh mục: ${catRes.status}`);
                if (!materialRes.ok) throw new Error(`Không thể tải chất liệu: ${materialRes.status}`);
                if (!audienceRes.ok) throw new Error(`Không thể tải đối tượng: ${audienceRes.status}`);
                if (!colorRes.ok) throw new Error(`Không thể tải màu sắc: ${colorRes.status}`);
                if (!sizeRes.ok) throw new Error(`Không thể tải kích thước: ${sizeRes.status}`);

                setBrands(results[0].data.content || []);
                setCategories(results[1].data.content || []);
                setMaterials(results[2].data.content || []);
                setAudiences(results[3].data.content || []);
                setColors(results[4].data.content || []);
                setSizes(results[5].data.content || []);

            } catch (err: any) {
                console.error("Fetch data error:", err);
                const errorMessage = err.message || "Không thể tải dữ liệu cần thiết (thương hiệu, danh mục, thuộc tính).";
                setFormError(errorMessage);
                addToast({
                    title: "Lỗi tải dữ liệu",
                    description: errorMessage + " Vui lòng thử lại.",
                    color: "danger"
                });
            }
        };
        fetchData();
    }, []);

    // Function to refresh brands data
    const refreshBrands = async () => {
        try {
            const brandRes = await fetch("http://localhost:8080/api/brands?page=0&size=1000");
            if (brandRes.ok) {
                const brandData = await brandRes.json();
                setBrands(brandData.data.content || []);
            }
        } catch (err) {
            console.error("Error refreshing brands:", err);
        }
    };

    // Function to refresh categories data
    const refreshCategories = async () => {
        try {
            const catRes = await fetch("http://localhost:8080/api/categories?page=0&size=1000");
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData.data.content || []);
            }
        } catch (err) {
            console.error("Error refreshing categories:", err);
        }
    };

    // Function to handle edit brand modal
    const handleEditBrand = () => {
        if (brandId) {
            setSelectedBrandIdForEdit(brandId);
            onEditBrandModalOpen();
        } else {
            addToast({
                title: "Lưu ý",
                description: "Vui lòng chọn thương hiệu trước khi chỉnh sửa.",
                color: "warning"
            });
        }
    };

    // Function to handle edit category modal
    const handleEditCategory = () => {
        if (categoryId) {
            setSelectedCategoryIdForEdit(categoryId);
            onEditCategoryModalOpen();
        } else {
            addToast({
                title: "Lưu ý",
                description: "Vui lòng chọn danh mục trước khi chỉnh sửa.",
                color: "warning"
            });
        }
    };

    // Thêm biến thể mới
    const addVariant = () => {
        setVariants([...variants, {
            sku: "",
            price: "",
            stockLevel: "",
            imageUrl: null,
            weight: "",
            colorId: "",
            sizeId: ""
        }]);
    };

    // Xóa biến thể
    const removeVariant = (idx: number) => {
        setVariants(variants.filter((_, i) => i !== idx));
    };

    // Xử lý thay đổi trường của biến thể
    const handleVariantChange = (idx: number, field: keyof VariantInput | string, value: any) => {
        const updatedVariants = variants.map((v, i) => {
            if (i === idx) {
                const updatedVariant = {...v, [field]: value};

                // Auto-generate SKU when color or size changes
                if ((field === 'colorId' || field === 'sizeId') && productName) {
                    const colorName = colors.find(c => c.id.toString() === updatedVariant.colorId)?.name || '';
                    const sizeName = sizes.find(s => s.id.toString() === updatedVariant.sizeId)?.name || '';

                    if (colorName && sizeName) {
                        const productCode = productName.slice(0, 3).toUpperCase();
                        const colorCode = colorName.slice(0, 3).toUpperCase();
                        const sizeCode = sizeName.toUpperCase();
                        updatedVariant.sku = `${productCode}-${colorCode}-${sizeCode}`;
                    } else {
                        updatedVariant.sku = "";
                    }
                }
                return updatedVariant;
            }
            return v;
        });
        setVariants(updatedVariants);
    };

    // Validate form
    const validateForm = () => {
        setFormError(null);
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
        if (!materialId) {
            setFormError("Vui lòng chọn chất liệu sản phẩm.");
            return false;
        }
        if (!targetAudienceId) {
            setFormError("Vui lòng chọn đối tượng khách hàng.");
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
        for (const [index, v] of variants.entries()) {
            if (!v.sku.trim() && !((v.colorId && v.sizeId && productName))) {
                setFormError(`Vui lòng nhập SKU hoặc chọn Màu/Kích thước để tự tạo SKU cho biến thể #${index + 1}.`);
                return false;
            }
            if (!v.price.trim() || !v.stockLevel.trim() || !v.imageUrl || !v.weight.trim() || !v.colorId.trim() || !v.sizeId.trim()) {
                setFormError(`Vui lòng nhập đầy đủ thông tin (Giá, Tồn kho, Ảnh, Cân nặng, Màu sắc, Kích thước) cho biến thể #${index + 1}.`);
                return false;
            }
            if (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0) {
                setFormError(`Giá của biến thể #${index + 1} phải là số dương.`);
                return false;
            }
            if (isNaN(parseInt(v.stockLevel)) || parseInt(v.stockLevel) < 0) {
                setFormError(`Tồn kho của biến thể #${index + 1} không được âm.`);
                return false;
            }
            if (isNaN(parseFloat(v.weight)) || parseFloat(v.weight) <= 0) {
                setFormError(`Cân nặng của biến thể #${index + 1} phải là số dương.`);
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
                colorId: parseInt(v.colorId),
                sizeId: parseInt(v.sizeId),
                price: parseFloat(v.price),
                stockLevel: parseInt(v.stockLevel),
                imageUrl: v.imageUrl.public_id,
                weight: parseFloat(v.weight)
            }));

            const payload = {
                productName: productName.trim(),
                description: description.trim(),
                brandId: parseInt(brandId!),
                categoryId: parseInt(categoryId!),
                materialId: parseInt(materialId!),
                targetAudienceId: parseInt(targetAudienceId!),
                thumbnail: productThumbnail.public_id,
                variants: variantPayload
            };

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
            setTimeout(() => router.push("/admin/product_management"), 1500);
        } catch (err: any) {
            setFormError(err.message || "Không thể tạo sản phẩm. Đã xảy ra lỗi không mong muốn.");
            addToast({title: "Lỗi tạo sản phẩm", description: err.message || "Đã có lỗi xảy ra.", color: "danger"});
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className={`min-h-screen py-8 px-4 md:px-36`}>
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
                        <div className="space-y-2">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{brand.brandName}</span>
                                                    {brand.brandInfo && (
                                                        <span className="text-sm text-gray-500">{brand.brandInfo}</span>
                                                    )}
                                                </div>
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="lg"
                                        color="warning"
                                        variant="bordered"
                                        onPress={handleEditBrand}
                                        isDisabled={!brandId}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
                                        aria-label="Sửa thương hiệu"
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        size="lg"
                                        color="default"
                                        variant="solid"
                                        onPress={onBrandModalOpen}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
                                        aria-label="Thêm thương hiệu mới"
                                    >
                                        ➕
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{category.name}</span>
                                                    {category.description && (
                                                        <span className="text-sm text-gray-500">{category.description}</span>
                                                    )}
                                                </div>
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="lg"
                                        color="warning"
                                        variant="bordered"
                                        onPress={handleEditCategory}
                                        isDisabled={!categoryId}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
                                        aria-label="Sửa danh mục"
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        size="lg"
                                        color="default"
                                        variant="solid"
                                        onPress={onCategoryModalOpen}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
                                        aria-label="Thêm danh mục mới"
                                    >
                                        ➕
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Brand Modal */}
                    <Modal
                        isOpen={isBrandModalOpen}
                        onOpenChange={onBrandModalOpenChange}
                        size="3xl"
                        scrollBehavior="inside"
                        placement="center"
                        className="max-w-[95vw] max-h-[90vh]"
                    >
                        <ModalContent>
                            {(onClose) => (
                                <>
                                    <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b">
                                        <h2 className="text-xl font-semibold">Thêm thương hiệu mới</h2>
                                        <p className="text-sm text-gray-600">Điền thông tin để tạo thương hiệu mới</p>
                                    </ModalHeader>
                                    <ModalBody className="px-6 py-6">
                                        <BrandForm
                                            onSuccess={() => {
                                                refreshBrands();
                                                onClose();
                                            }}
                                            onCancel={onClose}
                                        />
                                    </ModalBody>
                                </>
                            )}
                        </ModalContent>
                    </Modal>

                    {/* Category Modal */}
                    <Modal
                        isOpen={isCategoryModalOpen}
                        onOpenChange={onCategoryModalOpenChange}
                        size="3xl"
                        scrollBehavior="inside"
                        placement="center"
                        className="max-w-[95vw] max-h-[90vh]"
                    >
                        <ModalContent>
                            {(onClose) => (
                                <>
                                    <ModalHeader className="flex flex-col gap-1 px-6 py-4 border-b">
                                        <h2 className="text-xl font-semibold">Thêm danh mục mới</h2>
                                        <p className="text-sm text-gray-600">Điền thông tin để tạo danh mục mới</p>
                                    </ModalHeader>
                                    <ModalBody className="px-6 py-6">
                                        <CategoryForm
                                            onSuccess={() => {
                                                refreshCategories();
                                                onClose();
                                            }}
                                            onCancel={onClose}
                                        />
                                    </ModalBody>
                                </>
                            )}
                        </ModalContent>
                    </Modal>

                    {/* Edit Brand Modal */}
                    {selectedBrandIdForEdit && (
                        <EditBrandModal
                            isOpen={isEditBrandModalOpen}
                            onOpenChange={onEditBrandModalOpenChange}
                            brandId={selectedBrandIdForEdit}
                            onSuccess={() => {
                                refreshBrands();
                                const currentBrand = brands.find(b => b.id.toString() === selectedBrandIdForEdit);
                                if (currentBrand) {
                                    addToast({
                                        title: "Thông báo",
                                        description: "Dữ liệu thương hiệu đã được cập nhật!",
                                        color: "success"
                                    });
                                }
                            }}
                        />
                    )}

                    {/* Edit Category Modal */}
                    {selectedCategoryIdForEdit && (
                        <EditCategoryModal
                            isOpen={isEditCategoryModalOpen}
                            onOpenChange={onEditCategoryModalOpenChange}
                            categoryId={selectedCategoryIdForEdit}
                            onSuccess={() => {
                                refreshCategories();
                                const currentCategory = categories.find(c => c.id.toString() === selectedCategoryIdForEdit);
                                if (currentCategory) {
                                    addToast({
                                        title: "Thông báo",
                                        description: "Dữ liệu danh mục đã được cập nhật!",
                                        color: "success"
                                    });
                                }
                            }}
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Autocomplete
                            label="Chất liệu"
                            placeholder="Chọn chất liệu"
                            defaultItems={materials}
                            selectedKey={materialId}
                            onSelectionChange={(key) => setMaterialId(key as string)}
                            isRequired
                        >
                            {(item) => (
                                <AutocompleteItem key={item.id.toString()} textValue={item.name}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name}</span>
                                        {item.description && (
                                            <span className="text-sm text-gray-500">{item.description}</span>
                                        )}
                                    </div>
                                </AutocompleteItem>
                            )}
                        </Autocomplete>

                        <Autocomplete
                            label="Đối tượng khách hàng"
                            placeholder="Chọn đối tượng khách hàng"
                            defaultItems={audiences}
                            selectedKey={targetAudienceId}
                            onSelectionChange={(key) => setTargetAudienceId(key as string)}
                            isRequired
                        >
                            {(item) => (
                                <AutocompleteItem key={item.id.toString()} textValue={item.name}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.name}</span>
                                        {item.description && (
                                            <span className="text-sm text-gray-500">{item.description}</span>
                                        )}
                                    </div>
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Ảnh bìa sản phẩm
                            (Thumbnail) <span className="text-danger-500">*</span></label>
                        <CldUploadButton
                            options={{multiple: false}}
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                            onSuccess={(result: any, {widget}) => {
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
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <Input label="SKU" value={variant.sku}
                                                   onChange={e => handleVariantChange(idx, "sku", e.target.value)}
                                                   variant="bordered" placeholder="Tự động tạo hoặc nhập"
                                                   description={!variant.sku && productName && variant.colorId && variant.sizeId ? "SKU sẽ được tự động tạo." : "Nhập SKU hoặc để trống nếu tự động."}
                                            />
                                            <Autocomplete
                                                label="Màu sắc"
                                                placeholder="Chọn màu"
                                                defaultItems={colors}
                                                selectedKey={variant.colorId}
                                                onSelectionChange={(key) => handleVariantChange(idx, "colorId", key as string)}
                                                isRequired
                                                variant="bordered"
                                            >
                                                {(color) => (
                                                    <AutocompleteItem key={color.id.toString()} textValue={color.name}>
                                                        {color.name}
                                                    </AutocompleteItem>
                                                )}
                                            </Autocomplete>
                                            <Autocomplete
                                                label="Kích thước"
                                                placeholder="Chọn kích thước"
                                                defaultItems={sizes}
                                                selectedKey={variant.sizeId}
                                                onSelectionChange={(key) => handleVariantChange(idx, "sizeId", key as string)}
                                                isRequired
                                                variant="bordered"
                                            >
                                                {(size) => (
                                                    <AutocompleteItem key={size.id.toString()} textValue={size.name}>
                                                        {size.name}
                                                    </AutocompleteItem>
                                                )}
                                            </Autocomplete>
                                            <Input label="Giá (VNĐ)" type="number" value={variant.price}
                                                   onChange={e => handleVariantChange(idx, "price", e.target.value)}
                                                   isRequired variant="bordered" min="0" startContent="₫"/>
                                            <Input label="Số lượng tồn kho" type="number" value={variant.stockLevel}
                                                   onChange={e => handleVariantChange(idx, "stockLevel", e.target.value)}
                                                   isRequired variant="bordered" min="0"/>
                                            <Input label="Trọng lượng (gram)" type="number" value={variant.weight}
                                                   onChange={e => handleVariantChange(idx, "weight", e.target.value)}
                                                   isRequired variant="bordered" min="0" endContent="g"/>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-xs font-medium text-gray-600 block mb-1">Ảnh biến
                                                thể <span className="text-danger-500">*</span></label>
                                            <CldUploadButton
                                                options={{multiple: false}}
                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                                onSuccess={(result: any, {widget}) => {
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