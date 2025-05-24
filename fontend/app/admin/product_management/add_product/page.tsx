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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Autocomplete,
    AutocompleteItem, Checkbox
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

interface Attribute {
    id: number;
    attributeName: string;
    dataType: string;
    values?: string[];
}

interface VariantInput {
    sku: string;
    price: string;
    stockLevel: string;
    image: any;
    weight: string;
    attributes: { [key: string]: string };
}

// Interface cho product attributes
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

export default function AddProductPage() {
    const router = useRouter();
    const {data: session, status} = useSession();

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

    //Modal
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    // State cho product attributes (riêng biệt với variant attributes)
    const [productAttributes, setProductAttributes] = useState<{ [key: string]: string }>({});

    // State cho new attribute form
    const [newAttributeForm, setNewAttributeForm] = useState<NewAttributeForm>({
        name: "",
        dataType: "",
        values: []
    });

    // State cho selected product attributes
    const [selectedProductAttributes, setSelectedProductAttributes] = useState<number[]>([]);

    // State cho loading
    const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);

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
        setVariants([...variants, {sku: "", price: "", stockLevel: "", image: null, weight: "", attributes: {}}]);
    };

    // Xóa biến thể
    const removeVariant = (idx: number) => {
        setVariants(variants.filter((_, i) => i !== idx));
    };

    // Xử lý thay đổi trường của biến thể
    const handleVariantChange = (idx: number, field: string, value: any) => {
        setVariants(variants.map((v, i) => i === idx ? {...v, [field]: value} : v));
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

            // Chuẩn hóa dữ liệu biến thể theo cấu trúc API mới
            const variantPayload = variants.map(v => ({
                sku: v.sku,
                price: Number(v.price),
                stockLevel: parseInt(v.stockLevel), // Chuyển thành integer
                imageUrl: v.image.public_id,
                weight: Number(v.weight),
                attributes: Object.entries(v.attributes).map(([attrId, value]) => ({
                    attributeId: parseInt(attrId), // Chuyển thành integer
                    value
                }))
            }));

            // Chuẩn hóa product attributes theo cấu trúc API mới
            const productAttributePayload = selectedProductAttributes
                .filter(attrId => productAttributes[attrId]?.trim())
                .map(attrId => ({
                    attributeId: attrId,
                    value: productAttributes[attrId].trim()
                }));

            const payload = {
                productName: productName.trim(),
                description: description.trim(),
                brandId: parseInt(brandId), // Chuyển thành integer
                categoryId: parseInt(categoryId), // Chuyển thành integer
                productAttributes: productAttributePayload.length > 0 ? [{
                    attributes: productAttributePayload
                }] : [],
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

            addToast({title: "Thành công", description: "Tạo sản phẩm thành công!", color: "success"});
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
                    </div>
                    <Accordion variant="splitted">
                        <AccordionItem key="1" aria-label="Thuộc tính sản phẩm" title="Thuộc tính sản phẩm">
                            <div className="space-y-6">
                                {/* Header với mô tả */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 mb-2">Quản lý thuộc tính sản phẩm</h4>
                                    <div className="text-sm text-blue-700 space-y-1">
                                        <p>• <strong>Thêm thuộc tính:</strong> Chọn từ danh sách thuộc tính có sẵn để áp dụng cho sản phẩm</p>
                                        <p>• <strong>Tạo thuộc tính mới:</strong> Tạo thuộc tính mới chưa có trong hệ thống</p>
                                    </div>
                                </div>

                                {/* Phần 1: Thêm thuộc tính có sẵn */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h5 className="font-semibold text-lg">📋 Thêm thuộc tính có sẵn</h5>
                                            <p className="text-sm text-gray-600">Chọn thuộc tính từ danh sách có sẵn để áp dụng cho sản phẩm này</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {selectedProductAttributes.length} thuộc tính đã chọn
                                        </div>
                                    </div>

                                    {attributes.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {attributes.map(attr => (
                                                <Card key={attr.id} className={`p-3 transition-all duration-200 ${
                                                    selectedProductAttributes.includes(attr.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                                                }`}>
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            isSelected={selectedProductAttributes.includes(attr.id)}
                                                            onValueChange={() => toggleProductAttribute(attr.id)}
                                                            color="primary"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium">{attr.attributeName}</span>
                                                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-mono">
                                                                    {attr.dataType}
                                                                </span>
                                                            </div>

                                                            {selectedProductAttributes.includes(attr.id) && (
                                                                <div className="mt-3 p-2 bg-white rounded border">
                                                                    {attr.dataType === 'SELECT' ? (
                                                                        <select
                                                                            className="w-full p-2 border rounded"
                                                                            value={productAttributes[attr.id] || ""}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Chọn giá trị cho ${attr.attributeName}`}
                                                                        >
                                                                            <option value="">Chọn {attr.attributeName.toLowerCase()}</option>
                                                                            {attr.values?.map((value: string, index: number) => (
                                                                                <option key={index} value={value}>{value}</option>
                                                                            ))}
                                                                        </select>
                                                                    ) : attr.dataType === 'BOOLEAN' ? (
                                                                        <select
                                                                            className="w-full p-2 border rounded"
                                                                            value={productAttributes[attr.id] || ""}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Chọn giá trị cho ${attr.attributeName}`}
                                                                        >
                                                                            <option value="">Chọn</option>
                                                                            <option value="true">Có</option>
                                                                            <option value="false">Không</option>
                                                                        </select>
                                                                    ) : attr.dataType === 'COLOR' ? (
                                                                        <input
                                                                            type="color"
                                                                            className="w-full h-10 border rounded"
                                                                            value={productAttributes[attr.id] || "#000000"}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Chọn màu cho ${attr.attributeName}`}
                                                                            title={`Chọn màu cho ${attr.attributeName}`}
                                                                        />
                                                                    ) : attr.dataType === 'DATE' ? (
                                                                        <input
                                                                            type="date"
                                                                            className="w-full p-2 border rounded"
                                                                            value={productAttributes[attr.id] || ""}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Chọn ngày cho ${attr.attributeName}`}
                                                                            title={`Chọn ngày cho ${attr.attributeName}`}
                                                                        />
                                                                    ) : attr.dataType === 'NUMBER' ? (
                                                                        <input
                                                                            type="number"
                                                                            className="w-full p-2 border rounded"
                                                                            placeholder={`Nhập ${attr.attributeName.toLowerCase()}`}
                                                                            value={productAttributes[attr.id] || ""}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Nhập số cho ${attr.attributeName}`}
                                                                        />
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            className="w-full p-2 border rounded"
                                                                            placeholder={`Nhập ${attr.attributeName.toLowerCase()}`}
                                                                            value={productAttributes[attr.id] || ""}
                                                                            onChange={e => handleProductAttributeChange(attr.id.toString(), e.target.value)}
                                                                            aria-label={`Nhập văn bản cho ${attr.attributeName}`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-white rounded border">
                                            <p className="font-medium">Chưa có thuộc tính nào trong hệ thống</p>
                                            <p className="text-sm">Hãy tạo thuộc tính mới ở phần bên dưới</p>
                                        </div>
                                    )}
                                </div>

                                {/* Phần 2: Tạo thuộc tính mới */}
                                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h5 className="font-semibold text-lg text-green-800">➕ Tạo thuộc tính mới</h5>
                                            <p className="text-sm text-green-700">Tạo thuộc tính mới chưa có trong hệ thống</p>
                                        </div>
                                        <Button 
                                            color="success" 
                                            variant="solid" 
                                            onPress={() => {
                                                resetNewAttributeForm();
                                                onOpen();
                                            }}
                                            className="font-medium"
                                        >
                                            🆕 Tạo thuộc tính mới
                                        </Button>
                                    </div>

                                    <div className="bg-white p-3 rounded border border-green-300">
                                        <p className="text-sm text-green-700 font-medium mb-2">
                                            💡 Mẹo: Thuộc tính mới sẽ được lưu vào hệ thống và có thể tái sử dụng cho các sản phẩm khác
                                        </p>
                                        <div className="text-xs text-green-600 space-y-1">
                                            <p>• Thuộc tính có thể áp dụng cho toàn bộ sản phẩm hoặc từng biến thể riêng lẻ</p>
                                            <p>• Các kiểu dữ liệu: Text, Number, Boolean, Date, Select, Multi Select, Color, URL</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal tạo thuộc tính mới */}
                                <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                                    <ModalContent>
                                        {(onClose) => (
                                            <>
                                                <ModalHeader className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span>🎯 Tạo thuộc tính mới</span>
                                                    </div>
                                                    <p className="text-sm font-normal text-gray-600">
                                                        Thuộc tính này sẽ được lưu vào hệ thống và có thể sử dụng cho các sản phẩm khác
                                                    </p>
                                                </ModalHeader>
                                                <ModalBody className="space-y-4">
                                                    <Input
                                                        label="Tên thuộc tính"
                                                        placeholder="Nhập tên thuộc tính (vd: Màu sắc, Kích thước)"
                                                        value={newAttributeForm.name}
                                                        onChange={e => handleNewAttributeFormChange('name', e.target.value)}
                                                        isRequired
                                                        variant="bordered"
                                                        description="Tên này sẽ hiển thị khi chọn thuộc tính cho sản phẩm"
                                                    />

                                                    <Autocomplete
                                                        label="Kiểu dữ liệu"
                                                        placeholder="Chọn kiểu dữ liệu"
                                                        defaultItems={DataTypeOptions}
                                                        selectedKey={newAttributeForm.dataType}
                                                        onSelectionChange={(key) => handleNewAttributeFormChange('dataType', key as string)}
                                                        isRequired
                                                        variant="bordered"
                                                        description="Kiểu dữ liệu xác định cách nhập và hiển thị giá trị"
                                                    >
                                                        {(item) => (
                                                            <AutocompleteItem key={item.key} textValue={item.label}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{item.label}</span>
                                                                    <span className="text-xs text-gray-500">{item.description}</span>
                                                                </div>
                                                            </AutocompleteItem>
                                                        )}
                                                    </Autocomplete>

                                                    {(newAttributeForm.dataType === 'SELECT' || newAttributeForm.dataType === 'MULTI_SELECT') && (
                                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <label className="text-sm font-medium">Giá trị thuộc tính</label>
                                                                    <p className="text-xs text-gray-500">Các giá trị có thể chọn cho thuộc tính này</p>
                                                                </div>
                                                                <Button
                                                                    color="primary"
                                                                    variant="flat"
                                                                    size="sm"
                                                                    onClick={addAttributeValue}
                                                                >
                                                                    ➕ Thêm giá trị
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                {newAttributeForm.values.map((value, index) => (
                                                                    <div key={value.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                                                                        <span className="text-xs text-gray-500 w-8">#{index + 1}</span>
                                                                        <Input
                                                                            className="flex-1"
                                                                            placeholder={`Giá trị ${index + 1}`}
                                                                            value={value.value}
                                                                            onChange={e => updateAttributeValue(value.id, e.target.value)}
                                                                            size="sm"
                                                                            variant="bordered"
                                                                        />
                                                                        <Button
                                                                            color="danger"
                                                                            variant="light"
                                                                            size="sm"
                                                                            onClick={() => removeAttributeValue(value.id)}
                                                                            isIconOnly
                                                                        >
                                                                            🗑️
                                                                        </Button>
                                                                    </div>
                                                                ))}

                                                                {newAttributeForm.values.length === 0 && (
                                                                    <div className="text-center py-6 text-gray-500 bg-white rounded border border-dashed">
                                                                        <p className="text-sm">Chưa có giá trị nào</p>
                                                                        <p className="text-xs">Nhấn "Thêm giá trị" để bắt đầu</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </ModalBody>

                                                <ModalFooter>
                                                    <Button color="danger" variant="light" onPress={onClose}>
                                                        Hủy
                                                    </Button>
                                                    <Button
                                                        color="success"
                                                        onPress={handleCreateAttribute}
                                                        isDisabled={isCreatingAttribute || !newAttributeForm.name.trim() || !newAttributeForm.dataType}
                                                        isLoading={isCreatingAttribute}
                                                    >
                                                        {isCreatingAttribute ? "Đang tạo..." : "🎯 Tạo thuộc tính"}
                                                    </Button>
                                                </ModalFooter>
                                            </>
                                        )}
                                    </ModalContent>
                                </Modal>
                            </div>
                        </AccordionItem>

                        <AccordionItem key="2" aria-label="Biến thể sản phẩm" title="Biến thể sản phẩm">
                            <div className="space-y-4">
                                {/* Header mô tả */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-800 mb-2">Quản lý biến thể sản phẩm</h4>
                                    <div className="text-sm text-purple-700 space-y-1">
                                        <p>• <strong>Biến thể:</strong> Các phiên bản khác nhau của sản phẩm (khác nhau về màu sắc, kích thước, ...)</p>
                                        <p>• <strong>Thuộc tính biến thể:</strong> Đặc điểm riêng biệt của từng biến thể</p>
                                        <p>• Mỗi biến thể cần có SKU, giá, tồn kho, trọng lượng và ảnh riêng</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">🎨 Danh sách biến thể</p>
                                        <p className="text-sm text-gray-600">
                                            {variants.length === 0 ? "Chưa có biến thể nào" : `${variants.length} biến thể`}
                                        </p>
                                    </div>
                                    <Button 
                                        type="button" 
                                        color="primary" 
                                        variant="solid" 
                                        onClick={addVariant}
                                        className="font-medium"
                                    >
                                        ➕ Thêm biến thể mới
                                    </Button>
                                </div>

                                {variants.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <div className="text-6xl mb-4">📦</div>
                                        <p className="text-lg font-medium text-gray-700 mb-2">Chưa có biến thể nào</p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Hãy thêm ít nhất một biến thể để tạo sản phẩm
                                        </p>
                                        <Button 
                                            type="button" 
                                            color="primary" 
                                            variant="ghost" 
                                            onClick={addVariant}
                                        >
                                            🚀 Tạo biến thể đầu tiên
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {variants.map((variant, idx) => (
                                            <Card key={idx} className="p-4 bg-white border-2 border-gray-200 hover:border-purple-300 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h6 className="font-semibold text-lg text-purple-800">
                                                        🎯 Biến thể #{idx + 1}
                                                    </h6>
                                                    <Button 
                                                        type="button" 
                                                        color="danger" 
                                                        variant="light" 
                                                        size="sm"
                                                        onClick={() => removeVariant(idx)}
                                                    >
                                                        🗑️ Xóa biến thể
                                                    </Button>
                                                </div>

                                                {/* Thông tin cơ bản */}
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
                                                    </div>
                                                </div>

                                                {/* Thuộc tính biến thể */}
                                                {attributes.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6 className="font-medium mb-3 text-gray-700">🏷️ Thuộc tính biến thể</h6>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {attributes.map(attr => (
                                                                <div key={attr.id} className="space-y-1">
                                                                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                        {attr.attributeName}
                                                                        <span className="px-1 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono">
                                                                            {attr.dataType}
                                                                        </span>
                                                                    </label>
                                                                    <Input
                                                                        value={variant.attributes[attr.id] || ""}
                                                                        onChange={e => handleVariantAttributeChange(idx, attr.id.toString(), e.target.value)}
                                                                        placeholder={`Nhập ${attr.attributeName.toLowerCase()}`}
                                                                        size="sm"
                                                                        variant="bordered"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {attributes.length === 0 && (
                                                            <p className="text-sm text-gray-500 italic">
                                                                Chưa có thuộc tính nào được tạo. Hãy tạo thuộc tính ở phần trên.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Ảnh biến thể */}
                                                <div className="bg-gray-50 p-3 rounded-lg border">
                                                    <h6 className="font-medium mb-3 text-gray-700">📸 Ảnh biến thể</h6>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <CldUploadButton
                                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                                                onSuccess={(result, {widget}) => {
                                                                    handleVariantChange(idx, "image", result.info);
                                                                    widget.close();
                                                                }}
                                                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                                            >
                                                                {variant.image ? "🔄 Thay đổi ảnh" : "📷 Chọn ảnh biến thể"}
                                                            </CldUploadButton>
                                                            {!variant.image && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Ảnh sẽ hiển thị khi khách hàng chọn biến thể này
                                                                </p>
                                                            )}
                                                        </div>
                                                        {variant.image && (
                                                            <div className="flex-shrink-0">
                                                                <div className="relative">
                                                                    <CldImage 
                                                                        width={100} 
                                                                        height={100} 
                                                                        src={variant.image.public_id}
                                                                        alt={`Ảnh biến thể ${idx + 1}`} 
                                                                        className="object-cover rounded-lg border-2 border-gray-200"
                                                                    />
                                                                    <div className="absolute -top-2 -right-2">
                                                                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                                                            ✓
                                                                        </div>
                                                                    </div>
                                                                </div>
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
                </CardBody>
                <Divider/>
                <CardFooter className="p-5 flex justify-end">
                    <Button color="success" type="submit" isDisabled={isSubmitting || status !== "authenticated"}>
                        {isSubmitting ? "Đang xử lý..." : "Tạo sản phẩm"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}