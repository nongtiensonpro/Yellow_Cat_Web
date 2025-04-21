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
} from "@heroui/react";
import { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Plus, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
    productId: number;
    productName: string;
    description: string;
    purchases: number;
    createdAt: string;
    updatedAt: string;
    categoryId: number;
    categoryName: string;
    brandId: number;
    brandName: string;
    brandInfo: string;
    logoPublicId: string;
    minPrice: number | null;
    totalStock: number | null;
    thumbnail: string | null;
    activePromotions: string | null;
    active: boolean;
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

    const fetchProductsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${itemsPerPage}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiResponse = await response.json();

            if (apiResponse.status === 200 && apiResponse.data) {
                setProducts(apiResponse.data.content);
                setTotalPages(apiResponse.data.page.totalPages);
                setTotalElements(apiResponse.data.page.totalElements);
            } else {
                throw new Error(apiResponse.message || "Lỗi khi tải dữ liệu");
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
    }, [currentPage, itemsPerPage]);

    // Lọc sản phẩm theo searchTerm
    const filteredProducts = products.filter((product) => {
        const text = searchTerm.toLowerCase();
        return (
            product.productId.toString().includes(text) ||
            product.productName.toLowerCase().includes(text) ||
            product.categoryName.toLowerCase().includes(text) ||
            product.brandName.toLowerCase().includes(text) ||
            (product.description && product.description.toLowerCase().includes(text))
        );
    });

    // Format giá tiền
    const formatPrice = (price: number | null) => {
        if (price === null) return 'Chưa có giá';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý sản phẩm</p>
                    <span className="text-grey-500 text-sm">Danh sách sản phẩm chi tiết ({totalElements} sản phẩm)</span>
                </div>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="mb-4 flex justify-between items-center gap-2">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                    <Button color="primary" startContent={<Plus size={16} />}>Thêm sản phẩm</Button>
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
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
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
                                                <Badge color={product.totalStock > 50 ? "success" : product.totalStock > 10 ? "warning" : "danger"}>
                                                    {product.totalStock}
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{product.purchases}</TableCell>
                                        <TableCell>
                                            <Chip
                                                color={product.active ? "success" : "danger"}
                                                variant="flat"
                                            >
                                                {product.active ? "Đang bán" : "Ngừng bán"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>{formatDate(product.updatedAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Tooltip content="Xem chi tiết">
                                                    <Button isIconOnly size="sm" variant="light" as={Link} href={`/admin/products/${product.productId}`}>
                                                        <Eye size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Chỉnh sửa">
                                                    <Button isIconOnly size="sm" variant="light" as={Link} href={`/admin/products/edit/${product.productId}`}>
                                                        <Edit size={16} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Xóa">
                                                    <Button isIconOnly size="sm" variant="light" color="danger">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </Tooltip>
                                                {product.activePromotions && (
                                                    <Tooltip content="Có khuyến mãi">
                                                        <Button isIconOnly size="sm" variant="light" color="warning">
                                                            <Tag size={16} />
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        Không tìm thấy sản phẩm phù hợp.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                <div className="mt-6 flex gap-2 justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Hiển thị {filteredProducts.length} / {totalElements} sản phẩm
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            color="primary"
                            variant="flat"
                            onClick={() => setCurrentPage((old) => Math.max(0, old - 1))}
                            disabled={currentPage === 0 || loading}
                        >
                            Trang trước
                        </Button>
                        <span>
                            Trang <b>{currentPage + 1}</b> / {totalPages}
                        </span>
                        <Button
                            color="primary"
                            variant="flat"
                            onClick={() => setCurrentPage((old) => Math.min(totalPages - 1, old + 1))}
                            disabled={currentPage >= totalPages - 1 || loading}
                        >
                            Trang sau
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}