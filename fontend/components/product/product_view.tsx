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
} from "@heroui/react";
import { useEffect, useState } from "react";

interface Product {
    id: number;
    productName: string;
    category: {
        id: number;
        name: string;
    };
    brand: {
        id: number;
        brandName: string;
    };
}

interface ApiResponse {
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
    const [itemsPerPage] = useState<number>(5);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const fetchProductsData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/products?page=${currentPage}&size=${itemsPerPage}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const apiResponse: ApiResponse = await response.json();
            setProducts(apiResponse.data.content);
            setTotalPages(apiResponse.data.page.totalPages);
        } catch (err) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductsData();
        // eslint-disable-next-line
    }, [currentPage, itemsPerPage]);

    // Lọc sản phẩm theo searchTerm (tìm trong ID, tên, danh mục, thương hiệu)
    const filteredProducts = products.filter((product) => {
        const text = searchTerm.toLowerCase();
        return (
            product.id.toString().includes(text) ||
            product.productName.toLowerCase().includes(text) ||
            product.category.name.toLowerCase().includes(text) ||
            product.brand.brandName.toLowerCase().includes(text)
        );
    });

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý sản phẩm</p>
                    <span className="text-grey-500 text-sm">Danh sách sản phẩm chi tiết</span>
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
                    <Button color="primary">Thêm sản phẩm</Button>
                </div>
                {loading ? (
                    <div className="my-6 text-lg text-center text-blue-500">Đang tải dữ liệu...</div>
                ) : error ? (
                    <div className="my-6 text-lg text-center text-red-500">{error}</div>
                ) : (
                    <Table aria-label="Danh sách sản phẩm">
                        <TableHeader>
                            <TableColumn>ID</TableColumn>
                            <TableColumn>Tên sản phẩm</TableColumn>
                            <TableColumn>Danh mục</TableColumn>
                            <TableColumn>Thương hiệu</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.id}</TableCell>
                                        <TableCell>{product.productName}</TableCell>
                                        <TableCell>{product.category.name}</TableCell>
                                        <TableCell>{product.brand.brandName}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Không tìm thấy sản phẩm phù hợp.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
                <div className="mt-6 flex gap-2 justify-center items-center">
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
            </CardBody>
        </Card>
    );
}