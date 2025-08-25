"use client";

import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Card,
    CardHeader,
    CardBody,
    Divider,
    Input,
    Chip,
    Tooltip,
    Badge,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
} from "@heroui/react";
import {useEffect, useState, useCallback} from "react";
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight} from "lucide-react";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useDisclosure } from "@heroui/react";
import { useSession, signIn } from "next-auth/react";
import { CldImage } from "next-cloudinary";

interface Product {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    minPrice: number | null;
    totalStock: number | null;
    thumbnail: string | null;
    minCostPrice: number | null;
}

interface Category {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface Brand {
    id: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    createdAt: string | null;
    updatedAt: string | null;
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: {
        content: Product[];
        totalElements: number;
        totalPages: number;
        size: number;
        number: number;
        pageable: {
            pageNumber: number;
            pageSize: number;
        };
        last: boolean;
        first: boolean;
        numberOfElements: number;
        empty: boolean;
    };
}

export default function Page() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [totalElements, setTotalElements] = useState<number>(0);
    
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
    
    // Debounced search term để tránh gọi API quá nhiều
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [productToToggle, setProductToToggle] = useState<Product | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isToggleOpen, onOpen: onToggleOpen, onClose: onToggleClose } = useDisclosure();
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [toggleError, setToggleError] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const { data: session, status } = useSession();
    
    // New filter states
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [brandsLoading, setBrandsLoading] = useState<boolean>(false);

    const fetchCategoriesData = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            // Kiểm tra đăng nhập
            if (status !== "authenticated" || !session) {
                console.log("Chưa đăng nhập, không thể tải danh mục");
                return;
            }
            
            const token = session?.accessToken;
            if (!token) {
                console.log("Không tìm thấy token xác thực");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/products/categories`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                return;
            }
            const apiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setCategories(apiResponse.data);
            } else {
                console.error('Categories API error:', apiResponse.message);
            }
        } catch (err) {
            console.error('Không thể tải danh sách danh mục:', err);
        } finally {
            setCategoriesLoading(false);
        }
    }, [status, session]);

    const fetchBrandsData = useCallback(async () => {
        try {
            setBrandsLoading(true);
            // Kiểm tra đăng nhập
            if (status !== "authenticated" || !session) {
                console.log("Chưa đăng nhập, không thể tải thương hiệu");
                return;
            }
            
            const token = session?.accessToken;
            if (!token) {
                console.log("Không tìm thấy token xác thực");
                return;
            }

            const response = await fetch(`http://localhost:8080/api/products/brands`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                return;
            }
            const apiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setBrands(apiResponse.data);
            } else {
                console.error('Brands API error:', apiResponse.message);
            }
        } catch (err) {
            console.error('Không thể tải danh sách thương hiệu:', err);
        } finally {
            setBrandsLoading(false);
        }
    }, [status, session]);

    const fetchProductsData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Kiểm tra đăng nhập
            if (status !== "authenticated" || !session) {
                console.log("Chưa đăng nhập, không thể tải sản phẩm");
                return;
            }
            
            const token = session?.accessToken;
            if (!token) {
                console.log("Không tìm thấy token xác thực");
                return;
            }
            
            const searchQuery = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : "";
            const categoryQuery = selectedCategory ? `&categoryId=${selectedCategory}` : "";
            const brandQuery = selectedBrand ? `&brandId=${selectedBrand}` : "";
            
            const response = await fetch(`http://localhost:8080/api/products/management?page=${currentPage}&size=${itemsPerPage}${searchQuery}${categoryQuery}${brandQuery}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.log(`HTTP error! Status: ${response.status}`);
                return;
            }
            
            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setProducts(apiResponse.data.content || []);
                setTotalPages(apiResponse.data.totalPages || 1);
                setTotalElements(apiResponse.data.totalElements || 0);
                setError(null); // Clear any previous errors
            } else {
                console.log(apiResponse.message || "Lỗi khi tải dữ liệu");
                setError(apiResponse.message || "Lỗi khi tải dữ liệu");
            }
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, debouncedSearchTerm, selectedCategory, selectedBrand, status, session]);

    useEffect(() => {
        if (status === "authenticated" && session) {
            fetchCategoriesData();
            fetchBrandsData();
        }
    }, [fetchCategoriesData, fetchBrandsData, status, session]);

    useEffect(() => {
        if (status === "authenticated" && session) {
            fetchProductsData();
        }
    }, [fetchProductsData, status, session]);

    // Format giá tiền
    const formatPrice = (price: number | null) => {
        if (price === null) return 'Chưa có giá';
        return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(price);
    };

    // Format ngày tháng
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const openDeleteConfirm = (product: Product) => {
        setProductToDelete(product);
        setDeleteError(null);
        onOpen();
    };

    const openToggleConfirm = (product: Product) => {
        setProductToToggle(product);
        setToggleError(null);
        onToggleOpen();
    };

    const handleToggleProductStatus = async () => {
        if (!productToToggle) return;
        
        try {
            // Kiểm tra đăng nhập
            if (status !== "authenticated" || !session) {
                signIn();
                return;
            }
            
            // Lấy accessToken từ session
            const token = session?.accessToken;
            if (!token) {
                console.log("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            }

            setIsToggling(true);
            setToggleError(null);
            const response = await fetch(`http://localhost:8080/api/products/activeornotactive/${productToToggle.productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
                console.log(errorMessage);
                setToggleError(errorMessage);
                return;
            }
            
            onToggleClose();
            setProductToToggle(null);
            // Refresh data để cập nhật trạng thái mới
            setTimeout(() => fetchProductsData(), 100);
            
        } catch (err) {
            setToggleError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái sản phẩm. Vui lòng thử lại sau.');
        } finally {
            setIsToggling(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            // Kiểm tra đăng nhập
            if (status !== "authenticated" || !session) {
                signIn();
                return;
            }
            // Lấy accessToken từ session
            const token = session?.accessToken;
            if (!token) {
                console.log("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
            }

            setIsDeleting(true);
            setDeleteError(null);
            const response = await fetch(`http://localhost:8080/api/products/${productToDelete.productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.message || `HTTP error! Status: ${response.status}`;
                console.log(errorMessage);
                setDeleteError(errorMessage);
                return;
            }
            onClose();
            setProductToDelete(null);
            // Refresh data sau khi xóa
            setTimeout(() => fetchProductsData(), 100);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Không thể xóa sản phẩm. Vui lòng thử lại sau.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
        setSelectedBrand("");
        setCurrentPage(0);
    };

    return (
        <Card className={`max p-1`}>
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý sản phẩm</p>
                    <span className="text-grey-500 text-sm">
                        {loading ? "Đang tải..." : `Hiện tại có ${totalElements} sản phẩm trong cửa hàng`}
                    </span>
                </div>
            </CardHeader>
            <Divider/>
            <CardBody>
                <div className="mb-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center flex-wrap">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-80"
                            />
                            <Select
                                placeholder={categoriesLoading ? "Đang tải..." : "Chọn danh mục"}
                                className="w-60"
                                isDisabled={categoriesLoading}
                                selectedKeys={selectedCategory ? [selectedCategory] : []}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0];
                                    setSelectedCategory(selected ? String(selected) : "");
                                    setCurrentPage(0);
                                }}
                            >
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <SelectItem key={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem key="no-data" isDisabled>
                                        {categoriesLoading ? "Đang tải..." : "Không có danh mục"}
                                    </SelectItem>
                                )}
                            </Select>
                            <Select
                                placeholder={brandsLoading ? "Đang tải..." : "Chọn thương hiệu"}
                                className="w-60"
                                isDisabled={brandsLoading}
                                selectedKeys={selectedBrand ? [selectedBrand] : []}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0];
                                    setSelectedBrand(selected ? String(selected) : "");
                                    setCurrentPage(0);
                                }}
                            >
                                {brands.length > 0 ? (
                                    brands.map((brand) => (
                                        <SelectItem key={brand.id}>
                                            {brand.brandName}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem key="no-data" isDisabled>
                                        {brandsLoading ? "Đang tải..." : "Không có thương hiệu"}
                                    </SelectItem>
                                )}
                            </Select>
                            <Button 
                                color="default" 
                                variant="flat" 
                                onPress={handleClearFilters}
                                className="min-w-fit"
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                        <Button color="default" as={Link} href={`/admin/product_management/add_product`}
                                startContent={<Plus size={16}/>}>Thêm sản phẩm</Button>
                    </div>
                    {(searchTerm || selectedCategory || selectedBrand) && (
                        <div className="flex gap-2 items-center text-sm text-gray-600">
                            <span>Bộ lọc đang áp dụng:</span>
                            {searchTerm && (
                                <Chip 
                                    size="sm" 
                                    color="primary" 
                                    variant="flat"
                                    onClose={() => setSearchTerm("")}
                                >
                                    Tìm kiếm: {searchTerm}
                                </Chip>
                            )}
                            {selectedCategory && (
                                <Chip 
                                    size="sm" 
                                    color="secondary" 
                                    variant="flat"
                                    onClose={() => setSelectedCategory("")}
                                >
                                    Danh mục: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                                </Chip>
                            )}
                            {selectedBrand && (
                                <Chip 
                                    size="sm" 
                                    color="success" 
                                    variant="flat"
                                    onClose={() => setSelectedBrand("")}
                                >
                                    Thương hiệu: {brands.find(b => b.id.toString() === selectedBrand)?.brandName}
                                </Chip>
                            )}
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="my-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                            <div className="text-default-600">Đang tải dữ liệu sản phẩm...</div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="my-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-danger-500 text-4xl">⚠️</div>
                            <div className="text-lg font-semibold text-default-900">Có lỗi xảy ra</div>
                            <div className="text-default-600 max-w-md">{error}</div>
                            <Button 
                                color="primary" 
                                variant="flat" 
                                onPress={() => fetchProductsData()}
                            >
                                Thử lại
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Table aria-label="Danh sách sản phẩm">
                        <TableHeader>
                            <TableColumn>ID</TableColumn>
                            <TableColumn>Sản phẩm</TableColumn>
                            <TableColumn>Danh mục</TableColumn>
                            <TableColumn>Thương hiệu</TableColumn>
                            <TableColumn>Giá nhập</TableColumn>
                            <TableColumn>Giá bán</TableColumn>
                            <TableColumn>Tồn kho</TableColumn>
                            <TableColumn>Đã bán</TableColumn>
                            <TableColumn>Trạng thái</TableColumn>
                            <TableColumn>Cập nhật</TableColumn>
                            <TableColumn>Thao tác</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <TableRow key={product.productId}>
                                        <TableCell>
                                            <span className="text-sm font-mono text-default-600">
                                                #{product.productId}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {product.thumbnail ? (
                                                        <CldImage
                                                            width={48}
                                                            height={48}
                                                            src={product.thumbnail}
                                                            alt={product.productName || "Product image"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <BuildingStorefrontIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate">{product.productName}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" color="secondary" variant="flat">
                                                {product.categoryName}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="sm" color="primary" variant="flat">
                                                {product.brandName}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-600">
                                                {formatPrice(product.minCostPrice)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-success">
                                                {formatPrice(product.minPrice)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {product.totalStock !== null ? (
                                                <Badge
                                                    color={product.totalStock > 50 ? "success" : product.totalStock > 10 ? "warning" : "danger"}>
                                                    {product.totalStock}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-default-600">
                                                {product.purchases != null ? product.purchases : "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                color={product.isActive ? "success" : "danger"}
                                                variant="flat"
                                            >
                                                {product.isActive ? "Đang bán" : "Ngừng bán"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-default-500">
                                                {formatDate(product.updatedAt)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {/*<Tooltip content="Xem chi tiết">*/}
                                                {/*    <Button isIconOnly size="sm" variant="light" as={Link}*/}
                                                {/*            href={`/products/${product.productId}`}>*/}
                                                {/*        <Eye size={16}/>*/}
                                                {/*    </Button>*/}
                                                {/*</Tooltip>*/}
                                                <Tooltip content="Chỉnh sửa">
                                                    <Button isIconOnly size="sm" variant="light" as={Link}
                                                            href={`/admin/product_management/update_product/${product.productId}`}>
                                                        <Edit size={16}/>
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content={product.isActive ? "Ngừng bán" : "Kích hoạt bán"}>
                                                    <Button 
                                                        isIconOnly 
                                                        size="sm" 
                                                        variant="light" 
                                                        color={product.isActive ? "warning" : "success"}
                                                        onPress={() => openToggleConfirm(product)}
                                                    >
                                                        {product.isActive ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Xóa">
                                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => openDeleteConfirm(product)}>
                                                        <Trash2 size={16}/>
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center">
                                        Không tìm thấy sản phẩm phù hợp.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                <div className="mt-6 flex gap-2 justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Hiển thị {products.length} / {totalElements} sản phẩm
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            color="default"
                            variant="flat"
                            onPress={() => setCurrentPage((old) => Math.max(0, old - 1))}
                            disabled={currentPage === 0 || loading}
                        >
                            Trang trước
                        </Button>
                        <span>
                            Trang <b>{currentPage + 1}</b> / {totalPages}
                        </span>
                        <Button
                            color="default"
                            variant="flat"
                            onPress={() => setCurrentPage((old) => Math.min(totalPages - 1, old + 1))}
                            disabled={currentPage >= totalPages - 1 || loading}
                        >
                            Trang sau
                        </Button>
                    </div>
                </div>

                {/* Modal xác nhận xóa */}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            Xác nhận xóa
                        </ModalHeader>
                        <ModalBody>
                            {productToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xóa sản phẩm <b>{productToDelete.productName}</b>?
                                    <br />
                                    Hành động này không thể hoàn tác.
                                </p>
                            )}
                            {deleteError && (
                                <div className="text-red-500 text-sm mt-2">{deleteError}</div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" variant="light" onPress={onClose}>
                                Hủy
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteProduct}
                                className="bg-red-500 text-white"
                                isLoading={isDeleting}
                            >
                                Xóa
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Modal xác nhận thay đổi trạng thái */}
                <Modal isOpen={isToggleOpen} onClose={onToggleClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            Xác nhận thay đổi trạng thái
                        </ModalHeader>
                        <ModalBody>
                            {productToToggle && (
                                <p>
                                    Bạn có chắc chắn muốn {productToToggle.isActive ? "ngừng bán" : "kích hoạt bán"} sản phẩm <b>{productToToggle.productName}</b>?
                                </p>
                            )}
                            {toggleError && (
                                <div className="text-red-500 text-sm mt-2">{toggleError}</div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" variant="light" onPress={onToggleClose}>
                                Hủy
                            </Button>
                            <Button
                                color={productToToggle?.isActive ? "warning" : "success"}
                                onPress={handleToggleProductStatus}
                                isLoading={isToggling}
                            >
                                {productToToggle?.isActive ? "Ngừng bán" : "Kích hoạt"}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </CardBody>
        </Card>
    );
}