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
    Spinner,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Autocomplete,
    AutocompleteItem,
    Checkbox,
    Spinner
    ModalFooter
} from "@heroui/react";
import {Input, Textarea} from "@heroui/input";
import {CldUploadButton, CldImage} from "next-cloudinary";
import {useState, useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import {useSession} from "next-auth/react";
import BrandForm from "@/components/product/BrandForm/BrandForm";
import EditBrandModal from "@/components/product/BrandForm/EditBrandModal";
import CategoryForm from "@/components/product/CategoryForm/CategoryForm";
import EditCategoryModal from "@/components/product/CategoryForm/EditCategoryModal";

interface ProductVariant { // From ProductDetailDTO (for displaying)
    variantId: number;
    sku: string;

    colorId: number;
    sizeId: number;
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
}

interface ProductDetail { // Matches ProductDetailDTO
    productId: number;
    productName: string;
    description: string;
    materialId: number;
    targetAudienceId: number;
    purchases: number;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    thumbnail: string | null;
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
    brandInfo : string;
    logoPublicId: string;
}

interface Category {
    id: number;
    name: string;
    description: string;
}


interface Attribute {
    id: number;
    attributeName: string;
    dataType: string;
    values?: string[];
}

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

interface ProductAttributeInput {
    attributeId: number;
    value: string;
}

// Interface cho attribute value trong modal
interface AttributeValue {
    id: string;
    value: string;
}

// Interface cho new attribute form
interface NewAttributeForm {
    name: string;
    dataType: string;
    values: AttributeValue[];
}

const DataTypeOptions = [
    {label: "Text", key: "TEXT", description: "Văn bản đơn giản"},
    {label: "Number", key: "NUMBER", description: "Số nguyên hoặc thập phân"},
    {label: "Boolean", key: "BOOLEAN", description: "True/False"},
    {label: "Date", key: "DATE", description: "Ngày tháng"},
    {label: "Select", key: "SELECT", description: "Lựa chọn từ danh sách"},
    {label: "Multi Select", key: "MULTI_SELECT", description: "Nhiều lựa chọn"},
    {label: "Color", key: "COLOR", description: "Mã màu hex"},
    {label: "URL", key: "URL", description: "Đường dẫn website"},
];

// Hàm phân tích chuỗi thuộc tính biến thể
const parseVariantAttributes = (attributesString: string) => {
    const attributes: Record<string, string> = {};
    if (!attributesString) return attributes;

    attributesString.split(', ').forEach(attr => {
        const [key, value] = attr.split(': ');
        if (key && value) {
            attributes[key] = value;
        }
    });

    return attributes;
};
=======
interface Size{
    id: number;
    name: string;
    description: string;
}

interface TargetAudience {
    id: number;
    name: string;
    description: string;
}

interface Color{
    id: number;
    name: string;
    description: string;
}

interface Material {
    id: number;
    name: string;
    description: string;
}


interface VariantInput {
    variantId?: number;
    sku: string;
    colorId: string;
    sizeId: string;
    price: string;
    stockLevel: string;
    image: any;
    weight: string;
}


export default function UpdateProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string | undefined;
    const {data: session, status} = useSession();


    const {isOpen: isBrandModalOpen, onOpen: onBrandModalOpen, onOpenChange: onBrandModalOpenChange} = useDisclosure();
    const {isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onOpenChange: onCategoryModalOpenChange} = useDisclosure();

    // Edit Brand Modal state
    const {isOpen: isEditBrandModalOpen, onOpen: onEditBrandModalOpen, onOpenChange: onEditBrandModalOpenChange} = useDisclosure();
    const [selectedBrandIdForEdit, setSelectedBrandIdForEdit] = useState<string | null>(null);

    // Edit Category Modal state
    const {isOpen: isEditCategoryModalOpen, onOpen: onEditCategoryModalOpen, onOpenChange: onEditCategoryModalOpenChange} = useDisclosure();
    const [selectedCategoryIdForEdit, setSelectedCategoryIdForEdit] = useState<string | null>(null);

    // State for form sản phẩm
    const [productData, setProductData] = useState<ProductDetail | null>(null);
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [material, setMaterial] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [thumbnail, setThumbnail] = useState<any>(null);
    // Separate modal states for Brand and Category
    const {isOpen: isBrandModalOpen, onOpen: onBrandModalOpen, onOpenChange: onBrandModalOpenChange} = useDisclosure();
    const {isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onOpenChange: onCategoryModalOpenChange} = useDisclosure();

    // Edit Brand Modal state
    const {isOpen: isEditBrandModalOpen, onOpen: onEditBrandModalOpen, onOpenChange: onEditBrandModalOpenChange} = useDisclosure();
    const [selectedBrandIdForEdit, setSelectedBrandIdForEdit] = useState<string | null>(null);

    // Edit Category Modal state
    const {isOpen: isEditCategoryModalOpen, onOpen: onEditCategoryModalOpen, onOpenChange: onEditCategoryModalOpenChange} = useDisclosure();
    const [selectedCategoryIdForEdit, setSelectedCategoryIdForEdit] = useState<string | null>(null);

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
    const [materials, setMaterials] = useState<Material[]>([]);
    const [audiences, setAudiences] = useState<TargetAudience[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
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
                        setMaterial(data.data.materialId?.toString() || '');
                        setTargetAudience(data.data.targetAudienceId?.toString() || '');
                        setBrandId(data.data.brandId.toString());
                        setCategoryId(data.data.categoryId.toString());
                        setIsActive(data.data.isActive);
                        // Parse thuộc tính sản phẩm
                        if (data.data.productAttributes && data.data.productAttributes.length > 0) {
                            const productAttrs: { [key: string]: string } = {};
                            data.data.productAttributes.forEach((attr: { attributeId: number; value: string }) => {
                                const attribute = attributes.find(a => a.id === attr.attributeId);
                                if (attribute) {
                                    productAttrs[attribute.attributeName] = attr.value;
                                }
                            });
                            setProductAttributes(productAttrs);
                        }

                        // Chuyển đổi biến thể từ API sang định dạng form
                        const variantInputs: VariantInput[] = data.data.variants.map(variant => {
                            const attributes = parseVariantAttributes(variant.variantAttributes);
                            return {
                                variantId: variant.variantId,
                                sku: variant.sku,
                                price: variant.price.toString(),
                                stockLevel: variant.stockLevel.toString(),
                                image: { public_id: variant.imageUrl },
                                weight: variant.weight.toString(),
                                attributes: attributes
                            };
                        });
                        const variantInputs: VariantInput[] = data.data.variants.map(variant => ({
                            variantId: variant.variantId,
                            sku: variant.sku,
                            colorId: variant.colorId.toString(),
                            sizeId: variant.sizeId.toString(),
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
                    const [brandRes, catRes, attrRes] = await Promise.all([
                        fetch("http://localhost:8080/api/brands?page=0&size=100"),
                        fetch("http://localhost:8080/api/categories?page=0&size=100"),
                    ]);
                    const brandData = await brandRes.json();
                    const catData = await catRes.json();
                    setBrands(brandData.data.content || []);
                    setCategories(catData.data.content || []);
                } catch (err) {
                    console.error('Lỗi khi tải metadata:', err);
                    setFormError("Không thể tải dữ liệu danh mục, thương hiệu hoặc thuộc tính.");
                    const [brandRes, catRes, materialRes, audienceRes, colorRes, sizeRes] = await Promise.all([
                        fetch("http://localhost:8080/api/brands?page=0&size=100"),
                        fetch("http://localhost:8080/api/categories?page=0&size=100"),
                        fetch("http://localhost:8080/api/materials?page=0&size=100"),
                        fetch("http://localhost:8080/api/target-audiences?page=0&size=100"),
                        fetch("http://localhost:8080/api/colors?page=0&size=100"),
                        fetch("http://localhost:8080/api/sizes?page=0&size=100")
                    ]);

                    const [brandData, catData, materialData, audienceData, colorData, sizeData] = await Promise.all([
                        brandRes.json(),
                        catRes.json(),
                        materialRes.json(),
                        audienceRes.json(),
                        colorRes.json(),
                        sizeRes.json()
                    ]);

                    setBrands(brandData.data.content || []);
                    setCategories(catData.data.content || []);
                    setMaterials(materialData.data.content || []);
                    setAudiences(audienceData.data.content || []);
                    setColors(colorData.data.content || []);
                    setSizes(sizeData.data.content || []);
                } catch (err) {
                    console.error('Lỗi khi tải metadata:', err);
                    setFormError("Không thể tải dữ liệu danh mục, thương hiệu hoặc thuộc tính sản phẩm.");
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
        setVariants([...variants, {sku: "", colorId: "", sizeId: "", price: "", stockLevel: "", image: null, weight: ""}]);
    };

    const removeVariant = (idx: number) => {

        const variant = variants[idx];
        if (variant.variantId) {
            // Nếu biến thể đã tồn tại trong DB, thêm vào danh sách xóa
            setDeletedVariantIds([...deletedVariantIds, variant.variantId]);
        }

        setVariants(variants.filter((_, i) => i !== idx));
    };

    const handleVariantChange = (idx: number, field: string, value: any) => {
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
                    }
                }

                return updatedVariant;
            }
            return v;
        });
        setVariants(updatedVariants);
    };

    // Xử lý thay đổi thuộc tính của biến thể
    const handleVariantAttributeChange = (idx: number, attrId: string, value: string) => {
        setVariants(variants.map((v, i) => i === idx ? {...v, attributes: {...v.attributes, [attrId]: value}} : v));
    };

    // Xử lý thay đổi thuộc tính sản phẩm (product level)
    const handleProductAttributeChange = (attrId: string, value: string) => {
        setProductAttributes(prev => ({...prev, [attrId]: value}));
    };

    // Toggle product attribute selection
    const toggleProductAttribute = (attrId: number) => {
        setSelectedProductAttributes(prev =>
            prev.includes(attrId)
                ? prev.filter(id => id !== attrId)
                : [...prev, attrId]
        );
    };

    // Handle new attribute form changes
    const handleNewAttributeFormChange = (field: keyof NewAttributeForm, value: any) => {
        setNewAttributeForm(prev => ({...prev, [field]: value}));
    };

    // Add new attribute value
    const addAttributeValue = () => {
        const newValue: AttributeValue = {
            id: Date.now().toString(),
            value: ""
        };
        setNewAttributeForm(prev => ({
            ...prev,
            values: [...prev.values, newValue]
        }));
    };

    // Remove attribute value
    const removeAttributeValue = (valueId: string) => {
        setNewAttributeForm(prev => ({
            ...prev,
            values: prev.values.filter(v => v.id !== valueId)
        }));
    };

    // Update attribute value
    const updateAttributeValue = (valueId: string, newValue: string) => {
        setNewAttributeForm(prev => ({
            ...prev,
            values: prev.values.map(v => v.id === valueId ? {...v, value: newValue} : v)
        }));
    };

    // Create new attribute
    const handleCreateAttribute = async () => {
        if (!newAttributeForm.name.trim() || !newAttributeForm.dataType) {
            setFormError("Vui lòng nhập đầy đủ thông tin thuộc tính.");
            return;
        }

        variants.forEach((v, i) => {
            if (!v.price.trim() || !v.stockLevel.trim() || !v.image || !v.weight.trim()) {
                errors.push(`Vui lòng nhập đầy đủ thông tin (SKU, giá, tồn kho, ảnh, trọng lượng) cho biến thể #${i + 1}`);
            }
            // Add validation for v.colorId and v.sizeId
            if (!v.colorId) errors.push(`Vui lòng chọn màu cho biến thể #${i + 1}`);
            if (!v.sizeId) errors.push(`Vui lòng chọn kích thước cho biến thể #${i + 1}`);

        setIsCreatingAttribute(true);
        try {
            const token = session?.accessToken;
            if (!token) throw new Error("Bạn cần đăng nhập.");

            const payload = {
                attributeName: newAttributeForm.name.trim(),
                dataType: newAttributeForm.dataType,
                values: newAttributeForm.values.map(v => v.value).filter(v => v.trim())
            };

            const response = await fetch("http://localhost:8080/api/attributes", {
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

            const newAttribute = await response.json();
            setAttributes(prev => [...prev, newAttribute.data]);

            // Reset form
            setNewAttributeForm({
                name: "",
                dataType: "",
                values: []
            });

            addToast({title: "Thành công", description: "Tạo thuộc tính mới thành công!", color: "success"});
            onOpenChange(); // Close modal
        } catch (err: any) {
            setFormError(err.message || "Không thể tạo thuộc tính mới.");
        } finally {
            setIsCreatingAttribute(false);
        }
    };

    // Reset new attribute form
    const resetNewAttributeForm = () => {
        setNewAttributeForm({
            name: "",
            dataType: "",
            values: []
        });
        setFormError(null);
    };

    // Validate form
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
                sku: v.sku,
                variantId: v.variantId || null, // Send variantId if it exists (for existing variants), else null
                sku: v.sku.trim(),
                colorId: parseInt(v.colorId), // Parse colorId as integer
                sizeId: parseInt(v.sizeId),   // Parse sizeId as integer
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
                productAttributes: productAttributePayload.length > 0 ? [{
                    attributes: productAttributePayload
                }] : [],
                materialId: parseInt(material),
                targetAudienceId: parseInt(targetAudience),
                thumbnail: thumbnail?.public_id || (typeof thumbnail === 'string' ? thumbnail : null),
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

    const refreshMateris = async () => {
        try {
            const matRes = await fetch("http://localhost:8080/api/materials?page=0&size=1000");
            if (matRes.ok) {
                const matData = await matRes.json();
                setMaterials(matData.data.content || []);
            }
        }catch (err) {
            console.error("Error refreshing materials:", err);
        }
    };

    const refreshTargetAudiences = async () => {
        try {
            const targetRes = await fetch("http://localhost:8080/api/target-audiences?page=0&size=1000");
            if (targetRes.ok) {
                const targetData = await targetRes.json();
                setAudiences(targetData.data.content || []);
            }
        } catch (err) {
            console.error("Error refreshing target audiences:", err);
        }
    }
    const refreshColors = async () => {
        try {
            const colorRes = await fetch("http://localhost:8080/api/colors?page=0&size=1000");
            if (colorRes.ok) {
                const colorData = await colorRes.json();
                setColors(colorData.data.content || []);
            }
        } catch (err) {
            console.error("Error refreshing colors:", err);
        }
    }

    const refreshSizes = async () => {
        try {
            const sizeRes = await fetch("http://localhost:8080/api/sizes?page=0&size=1000");
            if (sizeRes.ok) {
                const sizeData = await sizeRes.json();
                setSizes(sizeData.data.content || []);
            }
        } catch (err) {
            console.error("Error refreshing sizes:", err);
        }
    }
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
        <Card className={`min-h-screen py-8 px-4 md:px-36`}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
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
                                                <div className="grid grid-cols-3 flex flex-col">
                                                    <CldImage
                                                        width={1}
                                                        height={1}
                                                        src={brand.logoPublicId}
                                                        alt="Ảnh đã upload"
                                                        sizes="10vw"
                                                        className="w-full h-full object-cover p-2"
                                                    />
                                                    <span className="font-medium text-center">{brand.brandName}</span>
                                                    <span className="text-sm text-gray-500">{brand.brandInfo}</span>
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
                                // Refresh current selection to show updated brand name
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
                                // Refresh current selection to show updated category name
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
                            selectedKey={material}
                            onSelectionChange={(key) => setMaterial(key as string)}
                            isRequired
                        >
                            {(material) => (
                                <AutocompleteItem key={material.id.toString()} textValue={material.name}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{material.name}</span>
                                        {material.description && (
                                            <span className="text-sm text-gray-500">{material.description}</span>
                                        )}
                                    </div>
                                </AutocompleteItem>
                            )}
                        </Autocomplete>

                        <Autocomplete
                            label="Đối tượng khách hàng"
                            placeholder="Chọn đối tượng khách hàng"
                            defaultItems={audiences}
                            selectedKey={targetAudience}
                            onSelectionChange={(key) => setTargetAudience(key as string)}
                            isRequired
                        >
                            {(audience) => (
                                <AutocompleteItem key={audience.id.toString()} textValue={audience.name}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{audience.name}</span>
                                        {audience.description && (
                                            <span className="text-sm text-gray-500">{audience.description}</span>
                                        )}
                                    </div>
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                    </div>

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
                            </Autocomplete>
                        </div>
                        <div>
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
                                                {category.name}
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        color="warning"
                                        variant="bordered"
                                        onPress={handleEditCategory}
                                        isDisabled={!categoryId}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="default"
                                        variant="solid"
                                        onPress={onCategoryModalOpen}
                                        className="min-w-unit-10 px-2"
                                        isIconOnly
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
                                // Refresh current selection to show updated brand name
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
                                // Refresh current selection to show updated category name
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
                                                    <h6 className="font-medium mb-3 text-gray-700">📋 Thông tin cơ bản</h6>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <Input 
                                                            label="SKU" 
                                                            value={variant.sku}
                                                            onChange={e => handleVariantChange(idx, "sku", e.target.value)}
                                                            isRequired
                                                            variant="bordered"
                                                            placeholder="Mã SKU duy nhất"
                                                        />
                                                        <Input 
                                                            label="Giá (VNĐ)" 
                                                            type="number" 
                                                            value={variant.price}
                                                            onChange={e => handleVariantChange(idx, "price", e.target.value)}
                                                            isRequired
                                                            variant="bordered"
                                                            placeholder="0"
                                                        />
                                                        <Input 
                                                            label="Số lượng tồn kho" 
                                                            type="number" 
                                                            value={variant.stockLevel}
                                                            onChange={e => handleVariantChange(idx, "stockLevel", e.target.value)}
                                                            isRequired
                                                            variant="bordered"
                                                            placeholder="0"
                                                        />
                                                        <Input 
                                                            label="Trọng lượng (gram)" 
                                                            type="number" 
                                                            value={variant.weight}
                                                            onChange={e => handleVariantChange(idx, "weight", e.target.value)}
                                                            isRequired
                                                            variant="bordered"
                                                            placeholder="0"
                                                        />
                                                    <h6 className="font-medium mb-3 text-gray-700">📋 Thông tin cơ bản &
                                                        Thuộc tính</h6>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <Input
                                                            label="SKU"
                                                            value={variant.sku}
                                                            onChange={e => handleVariantChange(idx, "sku", e.target.value)}
                                                            variant="bordered"
                                                            placeholder="Mã sản phẩm"
                                                            description="Tự động tạo khi chọn màu và size"
                                                        />

                                                        <Autocomplete
                                                            label="Màu sắc"
                                                            placeholder="Chọn màu sắc"
                                                            defaultItems={colors}
                                                            selectedKey={variant.colorId}
                                                            onSelectionChange={(key) => handleVariantChange(idx, "colorId", key as string)}
                                                            isRequired
                                                            variant="bordered"
                                                        >
                                                            {(color) => (
                                                                <AutocompleteItem key={color.id.toString()} textValue={color.name}>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{color.name}</span>
                                                                        {color.description && (
                                                                            <span className="text-sm text-gray-500">{color.description}</span>
                                                                        )}
                                                                    </div>
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
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{size.name}</span>
                                                                        {size.description && (
                                                                            <span className="text-sm text-gray-500">{size.description}</span>
                                                                        )}
                                                                    </div>
                                                                </AutocompleteItem>
                                                            )}
                                                        </Autocomplete>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
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