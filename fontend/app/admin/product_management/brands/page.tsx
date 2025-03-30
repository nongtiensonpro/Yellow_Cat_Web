"use client"
import {
    Card,
    CardHeader,
    CardBody,
    Divider,
    TableRow,
    TableCell,
    TableColumn,
    TableHeader,
    Table,
    TableBody,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure
} from "@heroui/react";
import NextLink from "next/link";
import {useEffect, useState} from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {CldImage} from "next-cloudinary";
import keycloak from '@/keycloak/keycloak';

interface Brands {
    id: number;
    brandName: string;
    logoPublicId: string;
    brandInfo: string;
    productIds: number[];
}

interface ApiResponse {
    data: {
        content: Brands[];
        totalPages: number;
    }
}

export default function Page() {
    const [brandsData, setbrandsData] = useState<Brands[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [itemsPerPage] = useState<number>(5);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [brandToDelete, setBrandToDelete] = useState<{id: number, name: string} | null>(null);
    const {isOpen, onOpen, onClose} = useDisclosure();

    useEffect(() => {
        const fetchbrandsData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8080/api/brands?page=${currentPage}&size=${itemsPerPage}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const apiResponse: ApiResponse = await response.json();
                setbrandsData(apiResponse.data.content);
                setTotalPages(apiResponse.data.totalPages);
            } catch (err) {
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                console.error('Lỗi khi tải dữ liệu:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchbrandsData();
    }, [currentPage, itemsPerPage]);

    const openDeleteConfirm = (brandId: number, brandName: string) => {
        setBrandToDelete({id: brandId, name: brandName});
        onOpen();
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return;

        try {
            // Kiểm tra xác thực và lấy token
            if (!keycloak.authenticated) {
                await keycloak.login();
                return;
            }

            const token = keycloak.token;

            // Gửi request xóa với token xác thực
            const response = await fetch(`http://localhost:8080/api/brands/${brandToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `HTTP error! Status: ${response.status}`);
            }

            // Cập nhật state để loại bỏ brand đã xóa
            setbrandsData(brandsData.filter(b => b.id !== brandToDelete.id));
            onClose();
            setBrandToDelete(null);

        } catch (err) {
            console.error('Lỗi khi xóa brand:', err);
            setError(err instanceof Error ? err.message : 'Không thể xóa brand. Vui lòng thử lại sau.');
            onClose();
        }
    };

    return (
        <Card className="xl">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-4xl font-bold">Quản lý Brand</p>
                </div>
            </CardHeader>
            <Divider />
            <CardHeader>
                <NextLink href={"/admin/product_management/brands/create"} className="inline-block w-fit cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                    Thêm mới
                </NextLink>
            </CardHeader>
            <CardBody>
                {loading ? (
                    <LoadingSpinner/>
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                ) : (
                    <Table aria-label="Brands table">
                        <TableHeader>
                            <TableColumn>Brand Id</TableColumn>
                            <TableColumn>Brand Name</TableColumn>
                            <TableColumn>Logo</TableColumn>
                            <TableColumn>Brand Info</TableColumn>
                            <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {brandsData && brandsData.length > 0 ? (
                                brandsData.map((brand) => (
                                    <TableRow key={brand.id}>
                                        <TableCell>{brand.id}</TableCell>
                                        <TableCell>{brand.brandName}</TableCell>
                                        <TableCell>
                                            {brand.logoPublicId && (
                                                <CldImage
                                                    width={5}
                                                    height={5}
                                                    src={brand.logoPublicId}
                                                    alt="Ảnh đã upload"
                                                    sizes="10vw"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {brand.brandInfo.substring(0, 50)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <NextLink href={`/admin/product_management/brands/edit/${brand.id}`}>
                                                    <button className="inline-block w-fit cursor-pointer transition-all bg-yellow-500 text-white px-6 py-2 rounded-lg border-yellow-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                                                        Sửa
                                                    </button>
                                                </NextLink>
                                                <button
                                                    className="inline-block w-fit cursor-pointer transition-all bg-red-500 text-white px-6 py-2 rounded-lg border-red-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                                                    onClick={() => openDeleteConfirm(brand.id, brand.brandName)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {/* Simple pagination */}
                {!loading && !error && brandsData.length > 0 && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                            Trước
                        </button>
                        <span className="px-3 py-1">Trang {currentPage + 1}/{totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages - 1}
                            className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                            Sau
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            Xác nhận xóa
                        </ModalHeader>
                        <ModalBody>
                            {brandToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xóa brand "{brandToDelete.name}"?
                                    <br/>
                                    Hành động này không thể hoàn tác.
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Hủy
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteBrand}
                                className="bg-red-500 text-white"
                            >
                                Xóa
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </CardBody>
        </Card>
    );
}