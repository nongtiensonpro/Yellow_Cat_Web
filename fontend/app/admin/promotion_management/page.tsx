// "use client";
//
// import { useEffect, useState } from "react";
// import {
//     Card,
//     CardBody,
//     CardHeader,
//     Table,
//     TableBody,
//     TableCell,
//     TableRow,
//     Button,
//     useDisclosure,
// } from "@heroui/react";
// import axios from "axios";
// import { Edit, Trash2, Plus } from "lucide-react";
//
// interface Promotion {
//     id: number;
//     promoCode: string;
//     name: string;
//     description?: string;
//     discountType: string;
//     discountValue: number;
//     startDate?: string;
//     endDate?: string;
//     minimumOrderValue?: number;
//     usageLimitPerUser?: number;
//     usageLimitTotal?: number;
//     isActive: boolean;
//     applicableTo?: string;
// }
//
// export default function PromotionListPage() {
//     const [promotions, setPromotions] = useState<Promotion[]>([]);
//
//     const fetchPromotions = async () => {
//         try {
//             const res = await axios.get("http://localhost:8080/api/promotions?page=0&size=1000");
//             setPromotions(res.data?.data?.content || []);
//         } catch (err) {
//             console.error("Lỗi khi lấy danh sách khuyến mãi:", err);
//         }
//     };
//
//     useEffect(() => {
//         fetchPromotions();
//     }, []);
//
//     const handleDelete = async (id: number) => {
//         try {
//             await axios.delete(`http://localhost:8080/api/promotions/${id}`);
//             fetchPromotions();
//         } catch (err) {
//             console.error("Lỗi khi xoá khuyến mãi:", err);
//         }
//     };
//
//     return (
//         <div className="p-6">
//             <div className="flex justify-between items-center mb-4">
//                 <h1 className="text-2xl font-semibold text-gray-700 dark:text-white">
//                     Danh sách khuyến mãi
//                 </h1>
//                 <Button href="/admin/promotion_management/add">
//                     Thêm khuyến mãi
//                 </Button>
//             </div>
//
//             <Card>
//                 <CardHeader>Danh sách chương trình</CardHeader>
//                 <CardBody>
//                     <Table>
//                         <thead className="bg-gray-100 dark:bg-gray-800">
//                         <tr>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Mã</th>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Tên</th>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Giảm giá</th>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Hiệu lực</th>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Kích hoạt</th>
//                             <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-white">Thao tác</th>
//                         </tr>
//                         </thead>
//                         <TableBody>
//                             {promotions.map((promo) => (
//                                 <TableRow key={promo.id}>
//                                     <TableCell>{promo.promoCode}</TableCell>
//                                     <TableCell>{promo.name}</TableCell>
//                                     <TableCell>
//                                         {promo.discountType === "PERCENT"
//                                             ? `${promo.discountValue}%`
//                                             : `${promo.discountValue.toLocaleString()}₫`}
//                                     </TableCell>
//                                     <TableCell>
//                                         {promo.startDate?.slice(0, 10)} - {promo.endDate?.slice(0, 10)}
//                                     </TableCell>
//                                     <TableCell>
//                     <span className={`text-sm font-medium ${promo.isActive ? "text-green-600" : "text-red-500"}`}>
//                       {promo.isActive ? "Đang hoạt động" : "Ngừng"}
//                     </span>
//                                     </TableCell>
//                                     <TableCell className="flex gap-2">
//                                         <Button size="sm" variant="flat">
//                                             <Edit size={16} />
//                                         </Button>
//                                         <Button
//                                             size="sm"
//                                             color="danger"
//                                             variant="flat"
//                                             onClick={() => handleDelete(promo.id)}
//                                         >
//                                             <Trash2 size={16} />
//                                         </Button>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </CardBody>
//             </Card>
//         </div>
//     );
// }
