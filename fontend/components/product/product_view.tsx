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
} from "@heroui/react";
import {useEffect, useState} from "react";
import {Eye, Edit, Trash2, Plus, ToggleLeft, ToggleRight} from "lucide-react";
import Link from "next/link";
import { useDisclosure } from "@heroui/react";
import { useSession, signIn } from "next-auth/react";

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
}

interface ApiResponse {
    timestamp: string;
    status: number;
    message: string;
    data: {
        content: Product[];
        page: {
            size: number;
            number: number;
            totalElements: number;
            totalPages: number;
        };
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
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [productToToggle, setProductToToggle] = useState<Product | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isToggleOpen, onOpen: onToggleOpen, onClose: onToggleClose } = useDisclosure();
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [toggleError, setToggleError] = useState<string | null>(null);
    const [isToggling, setIsToggling] = useState<boolean>(false);
    const { data: session, status } = useSession();

    const fetchProductsData = async () => {
        try {
            setLoading(true);
            const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
            const response = await fetch(`http://localhost:8080/api/products/management?page=${currentPage}&size=${itemsPerPage}${searchQuery}`);
            if (!response.ok) console.log(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setProducts(apiResponse.data.content);
                setTotalPages(apiResponse.data.page.totalPages);
                setTotalElements(apiResponse.data.page.totalElements);
            } else {
                console.log(apiResponse.message || "Lỗi khi tải dữ liệu");
            }
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductsData();
        // eslint-disable-next-line
    }, [currentPage, itemsPerPage, searchTerm]);

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
                console.log(errorData?.message || `HTTP error! Status: ${response.status}`);
            }
            
            onToggleClose();
            setProductToToggle(null);
            fetchProductsData(); // Refresh data để cập nhật trạng thái mới
            
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

            setLoading(true);
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
                console.log(errorData?.message || `HTTP error! Status: ${response.status}`);
            }
            onClose();
            setProductToDelete(null);
            fetchProductsData();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Không thể xóa sản phẩm. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`min-h-screen py-8 px-4 md:px-36`}>
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý sản phẩm</p>
                    <span
                        className="text-grey-500 text-sm">Hiện tại có {totalElements} sản phẩm trong cửa hàng</span>
                </div>
            </CardHeader>
            <Divider/>
            <CardBody>
                <div className="mb-4 flex justify-between items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                    <Button color="default" as={Link} href={`/admin/product_management/add_product`}
                            startContent={<Plus size={16}/>}>Thêm sản phẩm</Button>
                    <Button color="default" as={Link} href={`/admin/product_management/brands`}>Quản lý nhãn hàng</Button>
                    <Button color="default" as={Link} href={`/admin/product_management/categories`}>Quản lý danh mục</Button>
                </div>
                {loading ? (
                    <div className="my-6 text-lg text-center text-blue-500">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="my-6 text-lg text-center text-red-500">{error}</div>
                ) : (
                    <Table aria-label="Danh sách sản phẩm">
                        <TableHeader>
                            <TableColumn>ID</TableColumn>
                            <TableColumn>Sản phẩm</TableColumn>
                            <TableColumn>Danh mục</TableColumn>
                            <TableColumn>Thương hiệu</TableColumn>
                            <TableColumn>Giá</TableColumn>
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
                                        <TableCell>{product.productId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-medium">{product.productName}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {product.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{product.categoryName}</TableCell>
                                        <TableCell>{product.brandName}</TableCell>
                                        <TableCell>{formatPrice(product.minPrice)}</TableCell>
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
                                        <TableCell>{product.purchases != null ? product.purchases : "-"}</TableCell>
                                        <TableCell>
                                            <Chip
                                                color={product.isActive ? "success" : "danger"}
                                                variant="flat"
                                            >
                                                {product.isActive ? "Đang bán" : "Ngừng bán"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>{formatDate(product.updatedAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Tooltip content="Xem chi tiết">
                                                    <Button isIconOnly size="sm" variant="light" as={Link}
                                                            href={`/products/${product.productId}`}>
                                                        <Eye size={16}/>
                                                    </Button>
                                                </Tooltip>
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
                                isLoading={loading}
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