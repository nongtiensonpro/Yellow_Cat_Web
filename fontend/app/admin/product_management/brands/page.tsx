//
// "use client";
// import {
//     Card,
//     CardHeader,
//     CardBody,
//     Divider,
//     TableRow,
//     TableCell,
//     TableColumn,
//     TableHeader,
//     Table,
//     TableBody,
//     Modal,
//     ModalContent,
//     ModalHeader,
//     ModalBody,
//     ModalFooter,
//     Button,
//     useDisclosure,
//     Input
// } from "@heroui/react";
// import NextLink from "next/link";
// import { useEffect, useState } from "react";
// import { useSession, signIn } from "next-auth/react";
// import LoadingSpinner from "@/components/LoadingSpinner";
// import { CldImage } from "next-cloudinary";
// import { Client } from "@stomp/stompjs";
// import SockJS from "sockjs-client";
//
// interface Brands {
//     id: number;
//     brandName: string;
//     logoPublicId: string;
//     brandInfo: string;
//     productIds: number[];
// }
//
// interface ApiResponse {
//     data: {
//         content: Brands[];
//         totalPages: number;
//     };
// }
//
// export default function Page() {
//     const { data: session, status } = useSession();
//     const [allBrandsData, setAllBrandsData] = useState<Brands[]>([]);
//     const [brandsData, setBrandsData] = useState<Brands[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [currentPage, setCurrentPage] = useState(0);
//     const [itemsPerPage] = useState(5);
//     const [totalPages, setTotalPages] = useState(1);
//     const [brandToDelete, setBrandToDelete] = useState<{ id: number; name: string } | null>(null);
//     const [notification, setNotification] = useState<string | null>(null);
//     const { isOpen, onOpen, onClose } = useDisclosure();
//     const [stompClient, setStompClient] = useState<Client | null>(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [finalSearchTerm, setFinalSearchTerm] = useState("");
//
//     const initializeStompClient = () => {
//         const socket = new SockJS("http://localhost:8080/ws");
//         const client = new Client({
//             webSocketFactory: () => socket,
//             reconnectDelay: 5000,
//             onConnect: () => {
//                 client.subscribe("/topic/brands", (message) => {
//                     const data = JSON.parse(message.body);
//                     setNotification(`Hành động: ${data.action} - Brand: ${data.entity.brandName}`);
//
//                     setAllBrandsData((prev) => {
//                         if (data.action === "add") return [data.entity, ...prev];
//                         if (data.action === "update") return prev.map((b) => b.id === data.entity.id ? data.entity : b);
//                         if (data.action === "delete") return prev.filter((b) => b.id !== data.entity.id);
//                         return prev;
//                     });
//                 });
//             },
//             onStompError: (frame) => {
//                 console.error("Lỗi STOMP:", frame);
//                 setError("Lỗi kết nối STOMP. Vui lòng thử lại.");
//             }
//         });
//
//         client.activate();
//         setStompClient(client);
//     };
//
//     useEffect(() => {
//         if (status === "unauthenticated") signIn();
//     }, [status]);
//
//     useEffect(() => {
//         initializeStompClient();
//         return () => {
//             if (stompClient?.active) stompClient.deactivate();
//         };
//     }, []);
//
//     useEffect(() => {
//         const delay = setTimeout(() => {
//             setFinalSearchTerm(searchTerm);
//             setCurrentPage(0);
//         }, 500);
//         return () => clearTimeout(delay);
//     }, [searchTerm]);
//
//     useEffect(() => {
//         const fetchAllBrands = async () => {
//             if (status !== "authenticated") return;
//             setLoading(true);
//             setError(null);
//             try {
//                 const res = await fetch("http://localhost:8080/api/brands?page=0&size=1000");
//                 const json: ApiResponse = await res.json();
//                 setAllBrandsData(json.data.content);
//             } catch (err) {
//                 setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchAllBrands();
//     }, [status]);
//
//     useEffect(() => {
//         if (loading) return;
//         let filtered = allBrandsData;
//         if (finalSearchTerm) {
//             const term = finalSearchTerm.toLowerCase();
//             filtered = filtered.filter(
//                 (b) => b.brandName.toLowerCase().includes(term) || (b.brandInfo?.toLowerCase().includes(term))
//             );
//         }
//
//         const total = Math.ceil(filtered.length / itemsPerPage);
//         setTotalPages(Math.max(1, total));
//         const validPage = Math.min(currentPage, total - 1);
//         const slice = filtered.slice(validPage * itemsPerPage, (validPage + 1) * itemsPerPage);
//         setBrandsData(slice);
//         if (currentPage !== validPage) setCurrentPage(validPage);
//     }, [allBrandsData, finalSearchTerm, currentPage, itemsPerPage, loading]);
//
//     useEffect(() => {
//         if (notification) {
//             const timer = setTimeout(() => setNotification(null), 3000);
//             return () => clearTimeout(timer);
//         }
//     }, [notification]);
//
//     const openDeleteConfirm = (id: number, name: string) => {
//         setBrandToDelete({ id, name });
//         onOpen();
//     };
//
//     const handleDeleteBrand = async () => {
//         if (!brandToDelete || !session?.accessToken) return;
//         try {
//             const res = await fetch(`http://localhost:8080/api/brands/${brandToDelete.id}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${session.accessToken}` }
//             });
//             if (!res.ok) throw new Error("Xoá không thành công");
//             onClose();
//             setBrandToDelete(null);
//         } catch (err) {
//             setError("Không thể xoá brand. Vui lòng thử lại.");
//             onClose();
//         }
//     };
//
//     if (status === "loading" || (loading && allBrandsData.length === 0)) {
//         return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
//     }
//
//     return (
//         <Card className="min-h-screen py-8 px-4 md:px-36">
//             <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-3xl font-bold">Quản lý thương hiệu</h1>
//                 <NextLink
//                     href="/admin/product_management/brands/create"
//                     className="inline-block cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
//                 >
//                     Thêm mới
//                 </NextLink>
//             </div>
//
//             <Divider />
//
//             <CardHeader className="flex justify-end mb-4">
//                 <div className="w-full md:w-1/3">
//                     <Input
//                         placeholder="Tìm kiếm theo tên..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         isClearable
//                         onClear={() => setSearchTerm("")}
//                     />
//                 </div>
//             </CardHeader>
//
//             <CardBody>
//                 {notification && (
//                     <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
//                         <span>{notification}</span>
//                         <button className="absolute top-0 right-0 px-2 py-1" onClick={() => setNotification(null)}>×</button>
//                     </div>
//                 )}
//                 {error && (
//                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//                         <span>{error}</span>
//                     </div>
//                 )}
//
//                 <Table aria-label="Brands table">
//                     <TableHeader>
//                         <TableColumn>STT</TableColumn>
//                         <TableColumn>Tên thương hiệu</TableColumn>
//                         <TableColumn>Logo</TableColumn>
//                         <TableColumn>Thông tin thương hiệu</TableColumn>
//                         <TableColumn>Hành động</TableColumn>
//                     </TableHeader>
//                     <TableBody>
//                         {brandsData.length > 0 ? (
//                             brandsData.map((brand) => (
//                                 <TableRow key={brand.id}>
//                                     <TableCell>{brand.id}</TableCell>
//                                     <TableCell>{brand.brandName}</TableCell>
//                                     <TableCell>
//                                         {brand.logoPublicId && (
//                                             <CldImage
//                                                 width={20}
//                                                 height={20}
//                                                 src={brand.logoPublicId}
//                                                 alt="Ảnh"
//                                                 sizes="5vw"
//                                                 className="w-full h-full object-cover"
//                                             />
//                                         )}
//                                     </TableCell>
//                                     <TableCell className="max-w-xs truncate">{brand.brandInfo}</TableCell>
//                                     <TableCell>
//                                         <div className="flex space-x-2">
//                                             <NextLink href={`/admin/product_management/brands/update/${brand.id}`}>
//                                                 <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:brightness-110">Sửa</button>
//                                             </NextLink>
//                                             <button
//                                                 onClick={() => openDeleteConfirm(brand.id, brand.brandName)}
//                                                 className="bg-red-500 text-white px-4 py-2 rounded hover:brightness-110"
//                                             >
//                                                 Xoá
//                                             </button>
//                                         </div>
//                                     </TableCell>
//                                 </TableRow>
//                             ))
//                         ) : (
//                             <TableRow>
//                                 <TableCell colSpan={5} className="text-center py-4">
//                                     {finalSearchTerm ? "Không tìm thấy nhãn hàng nào khớp." : "Không có dữ liệu"}
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//
//                 <div className="flex justify-center mt-4">
//                     <button
//                         onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
//                         disabled={currentPage === 0}
//                         className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
//                     >
//                         Trước
//                     </button>
//                     <span className="px-3 py-1">Trang {currentPage + 1}/{totalPages}</span>
//                     <button
//                         onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
//                         disabled={currentPage >= totalPages - 1}
//                         className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
//                     >
//                         Sau
//                     </button>
//                 </div>
//
//                 <Modal isOpen={isOpen} onClose={onClose}>
//                     <ModalContent>
//                         <ModalHeader>Xác nhận xoá</ModalHeader>
//                         <ModalBody>
//                             {brandToDelete && (
//                                 <p>
//                                     Bạn có chắc chắn muốn xoá thương hiệu<strong>{brandToDelete.name}</strong> không?
//                                 </p>
//                             )}
//                         </ModalBody>
//                         <ModalFooter>
//                             <Button variant="light" onPress={onClose}>Huỷ</Button>
//                             <Button color="danger" onPress={handleDeleteBrand}>Xoá</Button>
//                         </ModalFooter>
//                     </ModalContent>
//                 </Modal>
//             </CardBody>
//         </Card>
//     );
// }


"use client";
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
    useDisclosure,
    Input
} from "@heroui/react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CldImage } from "next-cloudinary";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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
    };
}

export default function Page() {
    const { data: session, status } = useSession();
    const [allBrandsData, setAllBrandsData] = useState<Brands[]>([]);
    const [brandsData, setBrandsData] = useState<Brands[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [brandToDelete, setBrandToDelete] = useState<{ id: number; name: string } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [finalSearchTerm, setFinalSearchTerm] = useState("");

    const initializeStompClient = () => {
        const socket = new SockJS("http://localhost:8080/ws");
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe("/topic/brands", (message) => {
                    const data = JSON.parse(message.body);
                    setNotification(`Hành động: ${data.action} - Brand: ${data.entity.brandName}`);

                    setAllBrandsData((prev) => {
                        if (data.action === "add") return [data.entity, ...prev];
                        if (data.action === "update") return prev.map((b) => b.id === data.entity.id ? data.entity : b);
                        if (data.action === "delete") return prev.filter((b) => b.id !== data.entity.id);
                        return prev;
                    });
                });
            },
            onStompError: (frame) => {
                console.error("Lỗi STOMP:", frame);
                setError("Lỗi kết nối STOMP. Vui lòng thử lại.");
            }
        });

        client.activate();
        setStompClient(client);
    };

    useEffect(() => {
        if (status === "unauthenticated") signIn();
    }, [status]);

    useEffect(() => {
        initializeStompClient();
        return () => {
            if (stompClient?.active) stompClient.deactivate();
        };
    }, []);

    useEffect(() => {
        const delay = setTimeout(() => {
            setFinalSearchTerm(searchTerm);
            setCurrentPage(0);
        }, 500);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    useEffect(() => {
        const fetchAllBrands = async () => {
            if (status !== "authenticated") return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("http://localhost:8080/api/brands?page=0&size=1000");
                const json: ApiResponse = await res.json();
                setAllBrandsData(json.data.content);
            } catch (err) {
                setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllBrands();
    }, [status]);

    useEffect(() => {
        if (loading) return;
        let filtered = allBrandsData;
        if (finalSearchTerm) {
            const term = finalSearchTerm.toLowerCase();
            filtered = filtered.filter(
                (b) => b.brandName.toLowerCase().includes(term) || (b.brandInfo?.toLowerCase().includes(term))
            );
        }

        const total = Math.ceil(filtered.length / itemsPerPage);
        setTotalPages(Math.max(1, total));
        const validPage = Math.min(currentPage, total - 1);
        const slice = filtered.slice(validPage * itemsPerPage, (validPage + 1) * itemsPerPage);
        setBrandsData(slice);
        if (currentPage !== validPage) setCurrentPage(validPage);
    }, [allBrandsData, finalSearchTerm, currentPage, itemsPerPage, loading]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const openDeleteConfirm = (id: number, name: string) => {
        setBrandToDelete({ id, name });
        onOpen();
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete || !session?.accessToken) return;
        try {
            const res = await fetch(`http://localhost:8080/api/brands/${brandToDelete.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            if (!res.ok) throw new Error("Xoá không thành công");
            onClose();
            setBrandToDelete(null);
        } catch (err) {
            setError("Không thể xoá brand. Vui lòng thử lại.");
            onClose();
        }
    };

    if (status === "loading" || (loading && allBrandsData.length === 0)) {
        return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
    }

    return (
        <Card className="min-h-screen py-8 px-4 md:px-36">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quản lý thương hiệu</h1>
                <NextLink
                    href="/admin/product_management/brands/create"
                    className="inline-block cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
                >
                    Thêm mới
                </NextLink>
            </div>

            <Divider />

            <CardHeader className="flex justify-end mb-4">
                <div className="w-full md:w-1/3">
                    <Input
                        placeholder="Tìm kiếm theo tên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        isClearable
                        onClear={() => setSearchTerm("")}
                    />
                </div>
            </CardHeader>

            <CardBody>
                {notification && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                        <span>{notification}</span>
                        <button className="absolute top-0 right-0 px-2 py-1" onClick={() => setNotification(null)}>×</button>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <span>{error}</span>
                    </div>
                )}

                <Table aria-label="Brands table">
                    <TableHeader>
                        <TableColumn>STT</TableColumn>
                        <TableColumn>Tên thương hiệu</TableColumn>
                        <TableColumn>Logo</TableColumn>
                        <TableColumn>Thông tin thương hiệu</TableColumn>
                        <TableColumn>Hành động</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {brandsData.length > 0 ? (
                            brandsData.map((brand, idx) => (
                                <TableRow key={currentPage * itemsPerPage + idx}>
                                    <TableCell>{currentPage * itemsPerPage + idx + 1}</TableCell>
                                    <TableCell>{brand.brandName}</TableCell>
                                    <TableCell>
                                        {brand.logoPublicId && (
                                            <CldImage
                                                width={20}
                                                height={20}
                                                src={brand.logoPublicId}
                                                alt="Ảnh"
                                                sizes="5vw"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{brand.brandInfo}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <NextLink href={`/admin/product_management/brands/update/${brand.id}`}>
                                                <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:brightness-110">Sửa</button>
                                            </NextLink>
                                            <button
                                                onClick={() => openDeleteConfirm(brand.id, brand.brandName)}
                                                className="bg-red-500 text-white px-4 py-2 rounded hover:brightness-110"
                                            >
                                                Xoá
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                    {finalSearchTerm ? "Không tìm thấy nhãn hàng nào khớp." : "Không có dữ liệu"}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Trước
                    </button>
                    <span className="px-3 py-1">Trang {currentPage + 1}/{totalPages}</span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-1 mx-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    >
                        Sau
                    </button>
                </div>

                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        <ModalHeader>Xác nhận xoá</ModalHeader>
                        <ModalBody>
                            {brandToDelete && (
                                <p>
                                    Bạn có chắc chắn muốn xoá thương hiệu <strong>{brandToDelete.name}</strong> không?
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>Huỷ</Button>
                            <Button color="danger" onPress={handleDeleteBrand}>Xoá</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </CardBody>
        </Card>
    );
}
