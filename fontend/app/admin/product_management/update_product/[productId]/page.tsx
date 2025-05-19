"use client";

import {Card, CardHeader, CardBody, CardFooter, Divider, Button, addToast, Spinner, Chip} from "@heroui/react";
import {Input, Textarea} from "@heroui/input";
import {CldUploadButton, CldImage} from "next-cloudinary";
import {useState, useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import {useSession} from "next-auth/react";
import {Trash2, Plus} from "lucide-react";

interface ProductVariant {
    variantId: number;
    sku: string;
    price: number;
    stockLevel: number;
    imageUrl: string;
    weight: number;
    variantAttributes: string;
}

interface ProductDetail {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    productCreatedAt: string;
    productUpdatedAt: string;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    variants: ProductVariant[];
    activePromotions: any | null;
    thumbnail: string | null;
    productAttributes: { attributeId: number; value: string }[];
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

interface Attribute {
    id: number;
    attributeName: string;
    dataType: string;
}

interface VariantInput {
    variantId?: number;
    sku: string;
    price: string;
    stockLevel: string;
    imageUrl: string;
    image?: any;
    attributes: { [key: string]: string };
    weight: string;
}

// Hàm phan tích chuỗi thuộc tính biến thể
const parseVariantAttributes = (attributesString: string) => {
    const attributes: Record<string, string> = {};

    attributesString.split(', ').forEach(attr => {
        const [key, value] = attr.split(': ');
        if (key && value) {
            attributes[key] = value;
        }
    });

    return attributes;
};

export default function UpdateProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.productId as string | undefined;
    const {data: session, status} = useSession();

    // State cho form sản phẩm
    const [productData, setProductData] = useState<ProductDetail | null>(null);
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [variants, setVariants] = useState<VariantInput[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);
    const [productAttributes, setProductAttributes] = useState<{ [key: string]: string }>({});

    // Lấy token từ session
    const authToken = session?.accessToken;

    // Kiểm tra trạng thái xác thực
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

    // Lấy dữ liệu sản phẩm
    useEffect(() => {
        if (productId && authToken) {
            setLoading(true);
            setFormError(null);

            console.log("Product ID from params:", productId);

            // Lấy dữ liệu sản phẩm
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
                            imageUrl: variant.imageUrl,
                            weight: variant.weight.toString(),
                            attributes: attributes
                        };
                    });
                    setVariants(variantInputs);
                }
            else
                {
                    throw new Error(data.message || 'Không thể tải dữ liệu sản phẩm');
                }
            }
        catch
            (err: any)
            {
                console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
                setFormError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu sản phẩm');
                addToast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin sản phẩm",
                    color: "danger"
                });
            }
        }
        ;

        // Lấy dữ liệu brands, categories, attributes
        const fetchMetadata = async () => {
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
                console.error('Lỗi khi tải metadata:', err);
                setFormError("Không thể tải dữ liệu danh mục, thương hiệu hoặc thuộc tính.");
            }
        };

        // Thực hiện các yêu cầu API đồng thời
        Promise.all([fetchProductData(), fetchMetadata()])
            .finally(() => {
                setLoading(false);
            });
    }
else
    {
        if (!productId) {
            setFormError("Không tìm thấy ID sản phẩm");
            addToast({
                title: "Lỗi",
                description: "Không tìm thấy ID sản phẩm",
                color: "danger"
            });
        }
        if (!authToken && status !== 'loading') {
            setFormError("Bạn cần đăng nhập để thực hiện chức năng này");
        }
        if (status !== 'loading') {
            setLoading(false);
        }
    }
}
,
[productId, authToken, status]
)
;

// Thêm biến thể mới
const addVariant = () => {
    setVariants([...variants, {
        sku: "",
        price: "",
        stockLevel: "",
        imageUrl: "",
        weight: "0",
        attributes: {}
    }]);
};

// Xóa biến thể
const removeVariant = (idx: number) => {
    const variant = variants[idx];
    if (variant.variantId) {
        // Nếu biến thể đã tồn tại trong DB, thêm vào danh sách xóa
        setDeletedVariantIds([...deletedVariantIds, variant.variantId]);
    }
    setVariants(variants.filter((_, i) => i !== idx));
};

// Xử lý thay đổi trường của biến thể
const handleVariantChange = (idx: number, field: string, value: any) => {
    setVariants(variants.map((v, i) => i === idx ? {...v, [field]: value} : v));
};

// Xử lý thay đổi thuộc tính của biến thể
const handleVariantAttributeChange = (idx: number, attrName: string, value: string) => {
    setVariants(variants.map((v, i) => i === idx ? {
        ...v,
        attributes: {...v.attributes, [attrName]: value}
    } : v));
};


// Xử lý upload ảnh biến thể
const handleVariantImageUpload = (idx: number, result: any) => {
    if (result.event === "success" && result.info) {
        handleVariantChange(idx, 'image', result.info);
        handleVariantChange(idx, 'imageUrl', result.info.public_id);
    }
};

// Thêm hàm xử lý thay đổi thuộc tính sản phẩm
const handleProductAttributeChange = (attrName: string, value: string) => {
    setProductAttributes(prev => ({
        ...prev,
        [attrName]: value
    }));
};

// Validate form
const validateForm = () => {
    console.log("Bắt đầu validate form");
    const errors: string[] = [];

    console.log("Dữ liệu form:", {
        productName,
        brandId,
        categoryId,
        variantsCount: variants.length
    });

    if (!productName.trim()) {
        console.log("Lỗi: Thiếu tên sản phẩm");
        errors.push("Vui lòng nhập tên sản phẩm");
    }
    if (!brandId) {
        console.log("Lỗi: Thiếu thương hiệu");
        errors.push("Vui lòng chọn thương hiệu");
    }
    if (!categoryId) {
        console.log("Lỗi: Thiếu danh mục");
        errors.push("Vui lòng chọn danh mục");
    }
    if (variants.length === 0) {
        console.log("Lỗi: Không có biến thể");
        errors.push("Vui lòng thêm ít nhất một biến thể sản phẩm");
    }

    // Kiểm tra từng biến thể
    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        console.log(`Kiểm tra biến thể #${i + 1}:`, v);

        if (!v.sku || !v.price || !v.stockLevel || !v.imageUrl) {
            console.log(`Lỗi: Biến thể #${i + 1} thiếu thông tin`);
            errors.push(`Vui lòng nhập đầy đủ thông tin cho biến thể #${i + 1}`);
        }

        // Kiểm tra giá trị số
        if (isNaN(Number(v.price)) || Number(v.price) <= 0) {
            console.log(`Lỗi: Giá biến thể #${i + 1} không hợp lệ`);
            errors.push(`Giá của biến thể #${i + 1} phải lớn hơn 0`);
        }

        if (isNaN(Number(v.stockLevel)) || Number(v.stockLevel) < 0) {
            console.log(`Lỗi: Số lượng tồn kho biến thể #${i + 1} không hợp lệ`);
            errors.push(`Số lượng tồn kho của biến thể #${i + 1} không được âm`);
        }

        if (isNaN(Number(v.weight)) || Number(v.weight) < 0) {
            console.log(`Lỗi: Trọng lượng biến thể #${i + 1} không hợp lệ`);
            errors.push(`Trọng lượng của biến thể #${i + 1} không được âm`);
        }
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
        setFormError(errors[0]); // Hiển thị lỗi đầu tiên
        return false;
    }

    console.log("Form validation thành công");
    setFormError(null);
    setValidationErrors([]);
    return true;
};

// Submit form
const handleSubmit = async (e: React.FormEvent) => {
    console.log("Bắt đầu submit form");
    e.preventDefault();

    if (!validateForm() || isSubmitting || !authToken) {
        console.log("Form validation failed:", {
            isSubmitting,
            hasAuthToken: !!authToken
        });
        if (!authToken) {
            addToast({title: "Lỗi", description: "Phiên đăng nhập hết hạn", color: "danger"});
        }
        return;
    }

    setIsSubmitting(true);
    console.log("Bắt đầu gửi request");

    try {
        // Chuẩn hóa dữ liệu biến thể
        const variantPayload = variants.map(v => {
            // Chuyển đổi thuộc tính từ object sang mảng
            const attributeEntries = Object.entries(v.attributes).map(([attrName, value]) => {
                // Tìm ID của thuộc tính dựa trên tên
                const attribute = attributes.find(a => a.attributeName === attrName);
                return {
                    attributeId: attribute ? attribute.id : null,
                    value: value
                };
            }).filter(attr => attr.attributeId !== null);

            return {
                sku: v.sku,
                price: Number(v.price),
                stockLevel: Number(v.stockLevel),
                imageUrl: v.imageUrl,
                weight: Number(v.weight),
                attributes: attributeEntries
            };
        });

        // Chuẩn bị dữ liệu gửi đi theo đúng format API yêu cầu
        const payload = {
            productId: Number(productId),
            productName: productName.trim(),
            description: description.trim(),
            brandId: Number(brandId),
            categoryId: Number(categoryId),
            productAttributes: [
                {
                    attributes: Object.entries(productAttributes).map(([attrName, value]) => {
                        const attribute = attributes.find(a => a.attributeName === attrName);
                        return {
                            attributeId: attribute ? attribute.id : null,
                            value: value
                        };
                    }).filter(attr => attr.attributeId !== null)
                }
            ],
            variants: variantPayload
        };

        console.log("Dữ liệu gửi đi:", JSON.stringify(payload, null, 2));

        const response = await fetch(`http://localhost:8080/api/products`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        console.log("Response status:", response.status);
        const responseData = await response.json();
        console.log("Response data:", responseData);

        if (!response.ok) {
            const errorData = responseData;
            throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
        }

        addToast({
            title: "Thành công",
            description: "Cập nhật sản phẩm thành công!",
            color: "success"
        });

        setTimeout(() => router.push("/admin/product_management"), 1500);
    } catch (err: any) {
        console.error("Lỗi khi cập nhật sản phẩm:", err);
        setFormError(err.message || "Không thể cập nhật sản phẩm. Đã xảy ra lỗi không mong muốn.");
        addToast({
            title: "Lỗi",
            description: err.message || "Không thể cập nhật sản phẩm",
            color: "danger"
        });
    } finally {
        setIsSubmitting(false);
    }
};

// Hiển thị loading
if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Spinner label="Đang tải dữ liệu sản phẩm..." size="lg"/>
        </div>
    );
}

// Hiển thị lỗi
if (formError && !productData) {
    return (
        <Card className="w-full max-w-4xl mx-auto my-10">
            <CardHeader>
                <p className="text-lg font-semibold text-red-600">Lỗi tải dữ liệu</p>
            </CardHeader>
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
    <Card className="w-full max-w-4xl mx-auto my-10">
        <form
            onSubmit={(e) => {
                console.log("Form submitted");
                handleSubmit(e);
            }}
        >
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-2xl font-bold">Cập nhật sản phẩm</p>
                    <p className="text-sm text-gray-500">ID: {productId}</p>
                </div>
            </CardHeader>
            <Divider/>
            <CardBody className="space-y-6 p-5">
                {/* Thông tin cơ bản */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Thông tin cơ bản</h3>

                    <Input
                        label="Tên sản phẩm"
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        isRequired
                    />

                    <Textarea
                        label="Mô tả sản phẩm"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="brandId" className="block text-sm font-medium text-gray-700">
                                Thương hiệu <span className="text-red-500">*</span>
                            </label>
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
                            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                                Danh mục <span className="text-red-500">*</span>
                            </label>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Trạng thái
                        </label>
                        <div className="mt-2">
                            <label className="inline-flex items-center mr-4">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="isActive"
                                    checked={isActive}
                                    onChange={() => setIsActive(true)}
                                />
                                <span className="ml-2">Đang bán</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio"
                                    name="isActive"
                                    checked={!isActive}
                                    onChange={() => setIsActive(false)}
                                />
                                <span className="ml-2">Ngừng bán</span>
                            </label>
                        </div>
                    </div>
                </div>

                <Divider/>

                {/* Biến thể sản phẩm */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Biến thể sản phẩm</h3>
                        <Button
                            color="primary"
                            size="sm"
                            onClick={addVariant}
                            startContent={<Plus size={16}/>}
                        >
                            Thêm biến thể
                        </Button>
                    </div>

                    {variants.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            Chưa có biến thể nào. Vui lòng thêm ít nhất một biến thể.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {variants.map((variant, idx) => (
                                <Card key={idx} className="p-4 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium">Biến thể #{idx + 1}</h4>
                                        <Button
                                            color="danger"
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onClick={() => removeVariant(idx)}
                                        >
                                            <Trash2 size={16}/>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Input
                                            label="Mã SKU"
                                            value={variant.sku}
                                            onChange={e => handleVariantChange(idx, 'sku', e.target.value)}
                                            isRequired
                                        />
                                        <Input
                                            label="Giá (VNĐ)"
                                            type="number"
                                            value={variant.price}
                                            onChange={e => handleVariantChange(idx, 'price', e.target.value)}
                                            isRequired
                                        />
                                        <Input
                                            label="Số lượng tồn kho"
                                            type="number"
                                            value={variant.stockLevel}
                                            onChange={e => handleVariantChange(idx, 'stockLevel', e.target.value)}
                                            isRequired
                                        />
                                        <Input
                                            label="Trọng lượng (gram)"
                                            type="number"
                                            value={variant.weight}
                                            onChange={e => handleVariantChange(idx, 'weight', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <p className="mb-2 text-sm font-medium text-gray-700">Thuộc tính</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {attributes.map(attr => (
                                                <div key={attr.id}>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {attr.attributeName}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                        value={variant.attributes[attr.attributeName] || ''}
                                                        onChange={e => handleVariantAttributeChange(idx, attr.attributeName, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-gray-700">
                                            Ảnh biến thể <span className="text-red-500">*</span>
                                        </p>
                                        <CldUploadButton
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 mb-4"
                                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "YellowCatWeb"}
                                            onSuccess={(result, {widget}) => {
                                                handleVariantImageUpload(idx, result);
                                                widget.close();
                                            }}
                                        >
                                            {variant.imageUrl ? "Thay đổi ảnh" : "Tải lên ảnh"}
                                        </CldUploadButton>

                                        {variant.imageUrl && (
                                            <div className="mt-2">
                                                <CldImage
                                                    width={100}
                                                    height={100}
                                                    src={variant.imageUrl}
                                                    alt={`Biến thể ${idx + 1}`}
                                                    className="object-cover border rounded-md shadow-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thêm phần thuộc tính sản phẩm */}
                {/* <div className="space-y-4">
            <h3 className="text-lg font-medium">Thuộc tính sản phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attributes.map(attr => (
                <div key={attr.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {attr.attributeName}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={productAttributes[attr.attributeName] || ''}
                    onChange={e => handleProductAttributeChange(attr.attributeName, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div> */}

                {/* Hiển thị thông báo lỗi */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardBody>
            <Divider/>
            <CardFooter className="p-5 flex justify-end gap-3">
                <Button
                    color="default"
                    type="button"
                    onClick={() => router.push("/admin/product_management")}
                >
                    Quay lại
                </Button>
                <Button
                    color="success"
                    type="submit"
                    isDisabled={isSubmitting || status !== "authenticated"}
                >
                    {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
                </Button>
            </CardFooter>
        </form>
    </Card>
);
}