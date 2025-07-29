// "use client"
//
// import { useState, useEffect, useMemo, useCallback } from "react";
// import {
//   Card,
//   CardHeader,
//   CardBody,
//   Divider,
//   Button,
//   Modal,
//   ModalContent,
//   ModalHeader,
//   ModalBody,
//   ModalFooter,
//   useDisclosure,
//   Spinner,
//   Table,
//   TableHeader,
//   TableColumn,
//   TableBody,
//   TableRow,
//   TableCell,
//   Chip,
//   Progress,
//   Tooltip,
// } from "@heroui/react";
// import { Calendar } from "@heroui/react";
// import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
// import { useRevenue } from "@/hooks/useRevenue"; // Giả định hook này tồn tại và hoạt động đúng
//
// // --- Types ---
// interface ProductRevenueAggregated {
//   productId: number;
//   productName: string;
//   categoryName: string;
//   brandName: string;
//   totalRevenue: number;
//   totalUnitsSold: number;
//   ordersCount: number;
// }
//
// type SortableKey = keyof ProductRevenueAggregated;
//
// // --- Helper Functions (Không thay đổi) ---
// const formatDateForApi = (date: CalendarDate): string =>
//     `${date.year}-${String(date.month).padStart(2, "0")}-${String(
//         date.day
//     ).padStart(2, "0")}`;
//
// const formatCurrency = (amount: number): string =>
//     new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
//         amount
//     );
//
// const getRevenueStatus = (revenue: number) => {
//   if (revenue === 0)
//     return { color: "default" as const, text: "Không Có Doanh Thu" };
//   if (revenue < 1_000_000)
//     return { color: "warning" as const, text: "Doanh Thu Thấp" };
//   if (revenue < 5_000_000)
//     return { color: "primary" as const, text: "Doanh Thu Trung Bình" };
//   return { color: "success" as const, text: "Doanh Thu Cao" };
// };
//
// // --- Component Chính ---
// export default function StatisticsByDay() {
//   const { isOpen, onOpen, onClose } = useDisclosure();
//
//   // Timezone & dates
//   const tz = getLocalTimeZone();
//   const todayDate = useMemo(() => today(tz), [tz]);
//   const firstOfMonth = useMemo(() => todayDate.set({ day: 1 }), [todayDate]);
//
//   const [startDate, setStartDate] = useState<CalendarDate>(firstOfMonth);
//   const [endDate, setEndDate] = useState<CalendarDate>(todayDate);
//
//   const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' }>({
//     key: 'totalRevenue',
//     direction: 'descending',
//   });
//
//   const {
//     revenueData,
//     productRevenueDetail,
//     loading,
//     detailLoading,
//     error,
//     totalRevenue,
//     totalUnits,
//     fetchAllData,
//     hasSession,
//   } = useRevenue();
//
//   useEffect(() => {
//     if (hasSession && startDate && endDate) {
//       fetchAllData({
//         startDate: formatDateForApi(startDate),
//         endDate: formatDateForApi(endDate),
//       });
//     }
//   }, [startDate, endDate, hasSession, fetchAllData]); // Dependencies: Bất cứ khi nào các giá trị này thay đổi, effect sẽ chạy lại
//
//   const pickToday = useCallback(() => {
//     setStartDate(todayDate);
//     setEndDate(todayDate);
//   }, [todayDate]);
//
//   const pickCurrentWeek = useCallback(() => {
//     const js = new Date(todayDate.year, todayDate.month - 1, todayDate.day);
//     const day = js.getDay(); // 0-Sun,1-Mon...6-Sat
//     const offset = (day + 6) % 7;
//     const weekStart = todayDate.subtract({ days: offset });
//     setStartDate(weekStart);
//     setEndDate(todayDate);
//   }, [todayDate]);
//
//   const pickCurrentMonth = useCallback(() => {
//     setStartDate(firstOfMonth);
//     setEndDate(todayDate);
//   }, [firstOfMonth, todayDate]);
//
//   const pickCurrentYear = useCallback(() => {
//     const yearStart = todayDate.set({ month: 1, day: 1 });
//     setStartDate(yearStart);
//     setEndDate(todayDate);
//   }, [todayDate]);
//
//   // Hàm trigger fetch thủ công cho nút "Thử Lại"
//   const triggerFetch = useCallback(() => {
//     if (hasSession && startDate && endDate) {
//       fetchAllData({
//         startDate: formatDateForApi(startDate),
//         endDate: formatDateForApi(endDate),
//       });
//     }
//   }, [startDate, endDate, hasSession, fetchAllData]);
//
//   // Calculations (useMemo)
//   const totalDays = useMemo(() => {
//     if (!startDate || !endDate) return 1;
//     const start = startDate.toDate(tz);
//     const end = endDate.toDate(tz);
//     return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
//   }, [startDate, endDate, tz]);
//
//   const averageRevenuePerDay = useMemo(
//       () => (totalDays > 0 ? totalRevenue / totalDays : 0),
//       [totalRevenue, totalDays]
//   );
//
//   const maxRevenue = useMemo(
//       () => Math.max(...revenueData.map((d) => d.totalRevenue), 1),
//       [revenueData]
//   );
//
//   const aggregatedProductData = useMemo(() => {
//     if (!productRevenueDetail || productRevenueDetail.length === 0) return [];
//     const aggregated = productRevenueDetail.reduce((acc, item) => {
//       if (!acc[item.productId]) {
//         acc[item.productId] = {
//           productId: item.productId,
//           productName: item.productName,
//           categoryName: item.categoryName,
//           brandName: item.brandName,
//           totalRevenue: 0,
//           totalUnitsSold: 0,
//           ordersCount: 0,
//         };
//       }
//       acc[item.productId].totalRevenue += item.totalRevenue;
//       acc[item.productId].totalUnitsSold += item.totalUnitsSold;
//       acc[item.productId].ordersCount += item.ordersCount;
//       return acc;
//     }, {} as Record<string, ProductRevenueAggregated>);
//
//     const sortableItems = Object.values(aggregated);
//     if (sortConfig !== null) {
//       sortableItems.sort((a: ProductRevenueAggregated, b: ProductRevenueAggregated) => {
//         const aValue = a[sortConfig.key];
//         const bValue = b[sortConfig.key];
//
//         // Convert to string for consistent comparison
//         const aStr = String(aValue);
//         const bStr = String(bValue);
//
//         if (aStr < bStr) {
//           return sortConfig.direction === 'ascending' ? -1 : 1;
//         }
//         if (aStr > bStr) {
//           return sortConfig.direction === 'ascending' ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [productRevenueDetail, sortConfig]);
//
//   const requestSort = (key: SortableKey) => {
//     let direction: 'ascending' | 'descending' = 'descending';
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
//       direction = 'ascending';
//     }
//     setSortConfig({ key, direction });
//   };
//
//   const getSortIndicator = (key: SortableKey) => {
//     if (!sortConfig || sortConfig.key !== key) return null;
//     return sortConfig.direction === 'descending' ? '▼' : '▲';
//   };
//
//   return (
//       <Card className="max">
//         <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-primary">📊 Thống Kê Doanh Thu</h1>
//             <p className="text-sm text-default-500">
//               {formatDateForApi(startDate)} → {formatDateForApi(endDate)} ({totalDays} ngày)
//             </p>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             <Button onPress={pickToday} disabled={!hasSession} size="sm">Hôm Nay</Button>
//             <Button onPress={pickCurrentWeek} disabled={!hasSession} size="sm">Tuần Này</Button>
//             <Button onPress={pickCurrentMonth} disabled={!hasSession} size="sm" color="success">Tháng Này</Button>
//             <Button onPress={pickCurrentYear} disabled={!hasSession} size="sm" color="secondary">Năm Nay</Button>
//             <Button onPress={onOpen} disabled={!hasSession} size="sm" color="primary">
//               {hasSession ? "⚙️ Tùy Chỉnh Ngày" : "🔒 Vui lòng đăng nhập"}
//             </Button>
//           </div>
//         </CardHeader>
//         <Divider />
//         <CardBody className="space-y-6">
//           {error && (
//               <Card className="bg-danger-50 border border-danger-200">
//                 <CardBody className="text-center text-danger font-semibold">❌ {error}</CardBody>
//               </Card>
//           )}
//
//           {loading ? (
//               <div className="flex justify-center items-center h-64">
//                 <Spinner size="lg" label="Đang tải dữ liệu, vui lòng chờ..." />
//               </div>
//           ) : revenueData.length > 0 ? (
//               <>
//                 {/* Overview Cards */}
//                 <div className="grid md:grid-cols-3 gap-4">
//                   <Card shadow="sm" className="bg-success-50 border-l-4 border-success-500">
//                     <CardBody className="text-center p-4">
//                       <p className="font-semibold text-success-700">💰 Tổng Doanh Thu</p>
//                       <p className="text-3xl font-bold text-success-800">{formatCurrency(totalRevenue)}</p>
//                     </CardBody>
//                   </Card>
//                   <Card shadow="sm" className="bg-primary-50 border-l-4 border-primary-500">
//                     <CardBody className="text-center p-4">
//                       <p className="font-semibold text-primary-700">📦 Tổng Sản Phẩm Bán Ra</p>
//                       <p className="text-3xl font-bold text-primary-800">{totalUnits.toLocaleString('vi-VN')}</p>
//                     </CardBody>
//                   </Card>
//                   <Card shadow="sm" className="bg-warning-50 border-l-4 border-warning-500">
//                     <CardBody className="text-center p-4">
//                       <p className="font-semibold text-warning-700">📊 Doanh Thu TB/Ngày</p>
//                       <p className="text-3xl font-bold text-warning-800">{formatCurrency(averageRevenuePerDay)}</p>
//                     </CardBody>
//                   </Card>
//                 </div>
//
//                 {/* Daily Revenue Table */}
//                 <Card shadow="md">
//                   <CardHeader>
//                     <h2 className="text-lg font-semibold">📅 Chi Tiết Doanh Thu Theo Ngày</h2>
//                   </CardHeader>
//                   <CardBody>
//                     <Table aria-label="Bảng chi tiết doanh thu theo ngày">
//                       <TableHeader>
//                         <TableColumn>Ngày</TableColumn>
//                         <TableColumn>Doanh Thu</TableColumn>
//                         <TableColumn>Sản Phẩm</TableColumn>
//                         <TableColumn>Trạng Thái</TableColumn>
//                       </TableHeader>
//                       <TableBody>
//                         {revenueData.map((item, idx) => {
//                           const ratio = (item.totalRevenue / maxRevenue) * 100;
//                           const status = getRevenueStatus(item.totalRevenue);
//                           return (
//                               <TableRow key={idx}>
//                                 <TableCell className="font-medium">{item.revenueDate}</TableCell>
//                                 <TableCell>
//                                   <div className="flex flex-col gap-1">
//                                     <span className="font-semibold">{formatCurrency(item.totalRevenue)}</span>
//                                     <Tooltip content={`Đạt ${ratio.toFixed(1)}% so với ngày cao nhất`}>
//                                       <Progress value={ratio} size="sm" color={status.color} />
//                                     </Tooltip>
//                                   </div>
//                                 </TableCell>
//                                 <TableCell className="text-center">{item.totalUnitsSold.toLocaleString('vi-VN')}</TableCell>
//                                 <TableCell>
//                                   <Chip color={status.color} size="sm" variant="flat">{status.text}</Chip>
//                                 </TableCell>
//                               </TableRow>
//                           );
//                         })}
//                       </TableBody>
//                     </Table>
//                   </CardBody>
//                 </Card>
//
//                 {/* Aggregated Product Revenue Table */}
//                 {detailLoading ? (
//                     <div className="flex justify-center items-center h-40">
//                       <Spinner size="md" label="Đang tải chi tiết sản phẩm..." />
//                     </div>
//                 ) : aggregatedProductData.length > 0 && (
//                     <Card shadow="md">
//                       <CardHeader>
//                         <h2 className="text-lg font-semibold">🛍️ Thống Kê Theo Từng Sản Phẩm (Tổng Hợp)</h2>
//                       </CardHeader>
//                       <CardBody>
//                         <Table aria-label="Bảng tổng hợp doanh thu theo sản phẩm">
//                           <TableHeader>
//                             <TableColumn>Sản Phẩm</TableColumn>
//                             <TableColumn>Danh Mục / Thương Hiệu</TableColumn>
//                             <TableColumn
//                                 className="cursor-pointer"
//                                 onClick={() => requestSort('totalRevenue')}
//                             >
//                               Tổng Doanh Thu {getSortIndicator('totalRevenue')}
//                             </TableColumn>
//                             <TableColumn
//                                 className="cursor-pointer text-center"
//                                 onClick={() => requestSort('totalUnitsSold')}
//                             >
//                               Tổng SL Bán {getSortIndicator('totalUnitsSold')}
//                             </TableColumn>
//                             <TableColumn className="text-center">Số Đơn Hàng</TableColumn>
//                           </TableHeader>
//                           <TableBody items={aggregatedProductData}>
//                             {(item: ProductRevenueAggregated) => (
//                                 <TableRow key={item.productId}>
//                                   <TableCell>
//                                     <div className="flex flex-col">
//                                       <span className="font-medium text-sm">{item.productName}</span>
//                                       <span className="text-xs text-default-500">ID: {item.productId}</span>
//                                     </div>
//                                   </TableCell>
//                                   <TableCell>
//                                     <div className="flex flex-col gap-1">
//                                       <Chip size="sm" color="primary" variant="flat">{item.categoryName}</Chip>
//                                       <Chip size="sm" color="secondary" variant="flat">{item.brandName}</Chip>
//                                     </div>
//                                   </TableCell>
//                                   <TableCell className="font-semibold text-success-700">
//                                     {formatCurrency(item.totalRevenue)}
//                                   </TableCell>
//                                   <TableCell className="font-medium text-center">
//                                     {item.totalUnitsSold.toLocaleString('vi-VN')}
//                                   </TableCell>
//                                   <TableCell className="font-medium text-primary-600 text-center">
//                                     {item.ordersCount.toLocaleString('vi-VN')}
//                                   </TableCell>
//                                 </TableRow>
//                             )}
//                           </TableBody>
//                         </Table>
//                       </CardBody>
//                     </Card>
//                 )}
//               </>
//           ) : hasSession ? (
//               <div className="text-center py-16">
//                 <p className="text-lg text-default-600">📈 Không tìm thấy dữ liệu cho khoảng thời gian này.</p>
//                 <p className="text-sm text-default-500 mb-4">Vui lòng thử chọn một khoảng thời gian khác.</p>
//                 <Button onPress={triggerFetch} color="primary" isLoading={loading}>🔄 Thử Lại</Button>
//               </div>
//           ) : (
//               <div className="text-center py-16">
//                 <p className="text-lg text-default-600">🔒 Cần đăng nhập để xem dữ liệu thống kê.</p>
//                 <p className="text-sm text-default-500">Vui lòng đăng nhập và thử lại.</p>
//               </div>
//           )}
//         </CardBody>
//
//         <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
//           <ModalContent>
//             <ModalHeader className="flex flex-col gap-1">📅 Tùy Chỉnh Khoảng Thời Gian</ModalHeader>
//             <ModalBody>
//               <div className="flex flex-wrap gap-2 mb-4">
//                 <Button size="sm" onPress={pickToday}>Hôm Nay</Button>
//                 <Button size="sm" onPress={pickCurrentWeek}>Tuần Này</Button>
//                 <Button size="sm" color="success" onPress={pickCurrentMonth}>Tháng Này</Button>
//                 <Button size="sm" color="secondary" onPress={pickCurrentYear}>Năm Nay</Button>
//               </div>
//               <Divider className="my-4"/>
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <p className="font-medium mb-2">Từ Ngày</p>
//                   <Calendar aria-label="Ngày bắt đầu" value={startDate} onChange={setStartDate} maxValue={endDate || todayDate} />
//                 </div>
//                 <div>
//                   <p className="font-medium mb-2">Đến Ngày</p>
//                   <Calendar aria-label="Ngày kết thúc" value={endDate} onChange={setEndDate} minValue={startDate} maxValue={todayDate} />
//                 </div>
//               </div>
//             </ModalBody>
//             <ModalFooter>
//               <Button color="primary" onPress={onClose}>Đóng</Button>
//             </ModalFooter>
//           </ModalContent>
//         </Modal>
//       </Card>
//   );
// }




"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Progress,
  Tooltip,
} from "@heroui/react";
import { Calendar } from "@heroui/react";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { useRevenue } from "@/hooks/useRevenue"; // Giả định hook này tồn tại và hoạt động đúng

// --- Types ---
interface ProductRevenueAggregated {
  productId: number;
  productName: string;
  categoryName: string;
  brandName: string;
  totalRevenue: number;
  totalUnitsSold: number;
  ordersCount: number;
}

// --- UPDATED Type for ProductListItemDTO (aligns with how backend JSON serializes) ---
interface ProductListItemDTO {
  productId: number;
  productName: string;
  purchases?: number; // Optional as before
  categoryName: string;
  brandName: string;
  logoPublicId?: string; // Optional

  // *** CÁC THAY ĐỔI QUAN TRỌNG ĐỂ KHẮC PHỤC LỖI KIỂU DỮ LIỆU ***
  minPrice: string;       // Thay đổi từ 'number' sang 'string' (BigDecimal -> String)
  minSalePrice?: string;  // Thay đổi từ 'number' sang 'string' (BigDecimal -> String)
  totalStock: string;     // Thay đổi từ 'number' sang 'string' (Long -> String, an toàn hơn)
  // ************************************************************

  thumbnail?: string; // Optional
}

type SortableKey = keyof ProductRevenueAggregated;

// --- Helper Functions (Cập nhật để xử lý 'string' cho tiền tệ) ---
const formatDateForApi = (date: CalendarDate): string =>
    `${date.year}-${String(date.month).padStart(2, "0")}-${String(
        date.day
    ).padStart(2, "0")}`;

// Cập nhật formatCurrency để chấp nhận cả number hoặc string
const formatCurrency = (amount: number | string): string => {
  // Chuyển đổi string sang number trước khi format
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numericAmount);
};

const getRevenueStatus = (revenue: number) => {
  if (revenue === 0)
    return { color: "default" as const, text: "Không Có Doanh Thu" };
  if (revenue < 1_000_000)
    return { color: "warning" as const, text: "Doanh Thu Thấp" };
  if (revenue < 5_000_000)
    return { color: "primary" as const, text: "Doanh Thu Trung Bình" };
  return { color: "success" as const, text: "Doanh Thu Cao" };
};

// --- Component Chính ---
export default function StatisticsByDay() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();
  const tz = getLocalTimeZone();
  const todayDate = useMemo(() => today(tz), [tz]);
  const firstOfMonth = useMemo(() => todayDate.set({ day: 1 }), [todayDate]);

  const [startDate, setStartDate] = useState<CalendarDate>(firstOfMonth);
  const [endDate, setEndDate] = useState<CalendarDate>(todayDate);

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: "ascending" | "descending";
  }>({
    key: "totalRevenue",
    direction: "descending",
  });

  const [topSellingProducts, setTopSellingProducts] = useState<ProductListItemDTO[]>([]);
  const [topSellingLoading, setTopSellingLoading] = useState<boolean>(true);
  const [topSellingError, setTopSellingError] = useState<string | null>(null);

  const [lowStockProducts, setLowStockProducts] = useState<ProductListItemDTO[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState<boolean>(true);
  const [lowStockError, setLowStockError] = useState<string | null>(null);
  const LOW_STOCK_THRESHOLD = 10;

  const {
    revenueData,
    productRevenueDetail,
    loading,
    detailLoading,
    error,
    totalRevenue,
    totalUnits,
    fetchAllData,
    hasSession,
  } = useRevenue();

  useEffect(() => {
    if (hasSession && startDate && endDate) {
      fetchAllData({
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
      });
    }
  }, [startDate, endDate, hasSession, fetchAllData]);

  const fetchTopSellingProducts = useCallback(async () => {
    if (!session?.accessToken) {
      setTopSellingLoading(false);
      setTopSellingError("Không có phiên đăng nhập hoặc Access Token.");
      return;
    }

    setTopSellingLoading(true);
    setTopSellingError(null);
    try {
      const response = await fetch(
          "http://localhost:8080/api/products/top-selling",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (!response.ok) {
        let errorMessage = `Failed to fetch top-selling products: ${response.status} ${response.statusText}`;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Failed to parse error response as JSON:", jsonError);
            errorMessage = `Received non-JSON error response from server. Status: ${response.status}.`;
          }
        } else {
          const rawText = await response.text();
          console.error(
              "Expected JSON but received non-JSON response:",
              rawText
          );
          errorMessage = `Server responded with non-JSON content. Status: ${response.status}. Please check server logs.`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        console.error(
            "Expected JSON but received non-JSON response for success:",
            rawText
        );
        throw new Error(
            "Invalid response from server: Expected JSON, but received non-JSON content."
        );
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTopSellingProducts(data.data);
      } else {
        throw new Error(
            "Invalid data format for top-selling products: 'success' property missing or 'data' is not an array."
        );
      }
    } catch (err: any) {
      console.error("Error fetching top-selling products:", err);
      setTopSellingError(
          err.message || "Không thể tải sản phẩm bán chạy nhất do lỗi không xác định."
      );
    } finally {
      setTopSellingLoading(false);
    }
  }, [session?.accessToken]);

  const fetchLowStockProducts = useCallback(async () => {
    if (!session?.accessToken) {
      setLowStockLoading(false);
      setLowStockError("Không có phiên đăng nhập hoặc Access Token.");
      return;
    }

    setLowStockLoading(true);
    setLowStockError(null);
    try {
      const response = await fetch(
          `http://localhost:8080/api/products/low-stock?threshold=${LOW_STOCK_THRESHOLD}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": "application/json",
            },
          }
      );

      if (!response.ok) {
        let errorMessage = `Failed to fetch low-stock products: ${response.status} ${response.statusText}`;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Failed to parse error response as JSON:", jsonError);
            errorMessage = `Received non-JSON error response from server. Status: ${response.status}.`;
          }
        } else {
          const rawText = await response.text();
          console.error(
              "Expected JSON but received non-JSON response:",
              rawText
          );
          errorMessage = `Server responded with non-JSON content. Status: ${response.status}. Please check server logs.`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        console.error(
            "Expected JSON but received non-JSON response for success:",
            rawText
        );
        throw new Error(
            "Invalid response from server: Expected JSON, but received non-JSON content."
        );
      }

      const data = await response.json();
      console.log("Received low-stock products data:", data);

      if (data.success && Array.isArray(data.data)) {
        setLowStockProducts(data.data);
      } else {
        throw new Error(
            "Invalid data format for low-stock products: 'success' property missing or 'data' is not an array."
        );
      }
    } catch (err: any) {
      console.error("Error fetching low-stock products:", err);
      setLowStockError(
          err.message || "Không thể tải sản phẩm sắp hết hàng do lỗi không xác định."
      );
    } finally {
      setLowStockLoading(false);
    }
  }, [session?.accessToken, LOW_STOCK_THRESHOLD]);

  useEffect(() => {
    fetchTopSellingProducts();
    fetchLowStockProducts();
  }, [fetchTopSellingProducts, fetchLowStockProducts]);

  const pickToday = useCallback(() => {
    setStartDate(todayDate);
    setEndDate(todayDate);
  }, [todayDate]);

  const pickCurrentWeek = useCallback(() => {
    const js = new Date(todayDate.year, todayDate.month - 1, todayDate.day);
    const day = js.getDay(); // 0-Sun,1-Mon...6-Sat
    const offset = (day + 6) % 7; // Calculate offset to Monday (or Sunday if you prefer)
    const weekStart = todayDate.subtract({ days: offset });
    setStartDate(weekStart);
    setEndDate(todayDate);
  }, [todayDate]);

  const pickCurrentMonth = useCallback(() => {
    setStartDate(firstOfMonth);
    setEndDate(todayDate);
  }, [firstOfMonth, todayDate]);

  const pickCurrentYear = useCallback(() => {
    const yearStart = todayDate.set({ month: 1, day: 1 });
    setStartDate(yearStart);
    setEndDate(todayDate);
  }, [todayDate]);

  const triggerFetch = useCallback(() => {
    if (hasSession && startDate && endDate) {
      fetchAllData({
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
      });
    }
  }, [startDate, endDate, hasSession, fetchAllData]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = startDate.toDate(tz);
    const end = endDate.toDate(tz);
    return (
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  }, [startDate, endDate, tz]);

  const averageRevenuePerDay = useMemo(
      () => (totalDays > 0 ? totalRevenue / totalDays : 0),
      [totalRevenue, totalDays]
  );

  const maxRevenue = useMemo(
      () => Math.max(...revenueData.map((d) => d.totalRevenue), 1),
      [revenueData]
  );

  const aggregatedProductData = useMemo(() => {
    if (!productRevenueDetail || productRevenueDetail.length === 0) return [];
    const aggregated = productRevenueDetail.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          brandName: item.brandName,
          totalRevenue: 0,
          totalUnitsSold: 0,
          ordersCount: 0,
        };
      }
      acc[item.productId].totalRevenue += item.totalRevenue;
      acc[item.productId].totalUnitsSold += item.totalUnitsSold;
      acc[item.productId].ordersCount += item.ordersCount;
      return acc;
    }, {} as Record<string, ProductRevenueAggregated>);

    const sortableItems = Object.values(aggregated);
    if (sortConfig !== null) {
      sortableItems.sort(
          (a: ProductRevenueAggregated, b: ProductRevenueAggregated) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (typeof aValue === "number" && typeof bValue === "number") {
              return sortConfig.direction === "ascending"
                  ? aValue - bValue
                  : bValue - aValue;
            } else {
              const aStr = String(aValue);
              const bStr = String(bValue);
              if (aStr < bStr) {
                return sortConfig.direction === "ascending" ? -1 : 1;
              }
              if (aStr > bStr) {
                return sortConfig.direction === "ascending" ? 1 : -1;
              }
            }
            return 0;
          }
      );
    }
    return sortableItems;
  }, [productRevenueDetail, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: "ascending" | "descending" = "descending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "descending") {
      direction = "ascending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "descending" ? "▼" : "▲";
  };

  return (
      <Card className="max">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Thống Kê Doanh Thu</h1>
            <p className="text-sm text-default-500">
              {formatDateForApi(startDate)} → {formatDateForApi(endDate)} (
              {totalDays} ngày)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onPress={pickToday} disabled={!hasSession} size="sm">
              Hôm Nay
            </Button>
            <Button onPress={pickCurrentWeek} disabled={!hasSession} size="sm">
              Tuần Này
            </Button>
            <Button onPress={pickCurrentMonth} disabled={!hasSession} size="sm" color="success">
              Tháng Này
            </Button>
            <Button onPress={pickCurrentYear} disabled={!hasSession} size="sm" color="secondary">
              Năm Nay
            </Button>
            <Button onPress={onOpen} disabled={!hasSession} size="sm" color="primary">
              {hasSession ? "⚙️ Tùy Chỉnh Ngày" : " Vui lòng đăng nhập"}
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          {error && (
              <Card className="bg-danger-50 border border-danger-200">
                <CardBody className="text-center text-danger font-semibold">
                  ❌ {error}
                </CardBody>
              </Card>
          )}

          {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" label="Đang tải dữ liệu, vui lòng chờ..." />
              </div>
          ) : revenueData.length > 0 ? (
              <>
                {/* Overview Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card shadow="sm" className="bg-success-50 border-l-4 border-success-500">
                    <CardBody className="text-center p-4">
                      <p className="font-semibold text-success-700"> Tổng Doanh Thu</p>
                      <p className="text-3xl font-bold text-success-800">
                        {formatCurrency(totalRevenue)}
                      </p>
                    </CardBody>
                  </Card>
                  <Card shadow="sm" className="bg-primary-50 border-l-4 border-primary-500">
                    <CardBody className="text-center p-4">
                      <p className="font-semibold text-primary-700"> Tổng Sản Phẩm Bán Ra</p>
                      <p className="text-3xl font-bold text-primary-800">
                        {totalUnits.toLocaleString("vi-VN")}
                      </p>
                    </CardBody>
                  </Card>
                  <Card shadow="sm" className="bg-warning-50 border-l-4 border-warning-500">
                    <CardBody className="text-center p-4">
                      <p className="font-semibold text-warning-700"> Doanh Thu TB/Ngày</p>
                      <p className="text-3xl font-bold text-warning-800">
                        {formatCurrency(averageRevenuePerDay)}
                      </p>
                    </CardBody>
                  </Card>
                </div>

                {/* Daily Revenue Table */}
                <Card shadow="md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold"> Chi Tiết Doanh Thu Theo Ngày</h2>
                  </CardHeader>
                  <CardBody>
                    <Table aria-label="Bảng chi tiết doanh thu theo ngày">
                      <TableHeader>
                        <TableColumn>Ngày</TableColumn>
                        <TableColumn>Doanh Thu</TableColumn>
                        <TableColumn>Sản Phẩm</TableColumn>
                        <TableColumn>Trạng Thái</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {revenueData.map((item, idx) => {
                          const ratio = (item.totalRevenue / maxRevenue) * 100;
                          const status = getRevenueStatus(item.totalRevenue);
                          return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {item.revenueDate}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                              <span className="font-semibold">
                                {formatCurrency(item.totalRevenue)}
                              </span>
                                    <Tooltip
                                        content={`Đạt ${ratio.toFixed(
                                            1
                                        )}% so với ngày cao nhất`}
                                    >
                                      <Progress value={ratio} size="sm" color={status.color} />
                                    </Tooltip>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.totalUnitsSold.toLocaleString("vi-VN")}
                                </TableCell>
                                <TableCell>
                                  <Chip color={status.color} size="sm" variant="flat">
                                    {status.text}
                                  </Chip>
                                </TableCell>
                              </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>

                {/* Aggregated Product Revenue Table */}
                {detailLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Spinner size="md" label="Đang tải chi tiết sản phẩm..." />
                    </div>
                ) : (
                    aggregatedProductData.length > 0 && (
                        <Card shadow="md">
                          <CardHeader>
                            <h2 className="text-lg font-semibold">
                              {" "}
                              Thống Kê Theo Từng Sản Phẩm (Tổng Hợp)
                            </h2>
                          </CardHeader>
                          <CardBody>
                            <Table aria-label="Bảng tổng hợp doanh thu theo sản phẩm">
                              <TableHeader>
                                <TableColumn>Sản Phẩm</TableColumn>
                                <TableColumn>Danh Mục / Thương Hiệu</TableColumn>
                                <TableColumn
                                    className="cursor-pointer"
                                    onClick={() => requestSort("totalRevenue")}
                                >
                                  Tổng Doanh Thu {getSortIndicator("totalRevenue")}
                                </TableColumn>
                                <TableColumn
                                    className="cursor-pointer text-center"
                                    onClick={() => requestSort("totalUnitsSold")}
                                >
                                  Tổng SL Bán {getSortIndicator("totalUnitsSold")}
                                </TableColumn>
                                <TableColumn className="text-center">Số Đơn Hàng</TableColumn>
                              </TableHeader>
                              <TableBody items={aggregatedProductData}>
                                {(item: ProductRevenueAggregated) => (
                                    <TableRow key={item.productId}>
                                      <TableCell>
                                        <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {item.productName}
                                </span>
                                          <span className="text-xs text-default-500">
                                  ID: {item.productId}
                                </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col gap-1">
                                          <Chip size="sm" color="primary" variant="flat">
                                            {item.categoryName}
                                          </Chip>
                                          <Chip
                                              size="sm"
                                              color="secondary"
                                              variant="flat"
                                          >
                                            {item.brandName}
                                          </Chip>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-semibold text-success-700">
                                        {formatCurrency(item.totalRevenue)}
                                      </TableCell>
                                      <TableCell className="font-medium text-center">
                                        {item.totalUnitsSold.toLocaleString("vi-VN")}
                                      </TableCell>
                                      <TableCell className="font-medium text-primary-600 text-center">
                                        {item.ordersCount.toLocaleString("vi-VN")}
                                      </TableCell>
                                    </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardBody>
                        </Card>
                    )
                )}

                {/* --- NEW SECTION: TOP 5 BEST-SELLING PRODUCTS --- */}
                <Divider className="my-6" />
                <Card shadow="md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-primary"> Top 5 Sản Phẩm Bán Chạy Nhất</h2>
                  </CardHeader>
                  <CardBody>
                    {topSellingLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <Spinner size="md" label="Đang tải sản phẩm bán chạy..." />
                        </div>
                    ) : topSellingError ? (
                        <div className="text-center text-danger-500 py-4">
                          <p>{topSellingError}</p>
                          <Button
                              size="sm"
                              color="primary"
                              onPress={fetchTopSellingProducts}
                              className="mt-2"
                          >
                            Thử lại
                          </Button>
                        </div>
                    ) : topSellingProducts.length > 0 ? (
                        <Table aria-label="Bảng top 5 sản phẩm bán chạy nhất">
                          <TableHeader>
                            <TableColumn>Sản Phẩm</TableColumn>
                            <TableColumn>Danh Mục</TableColumn>
                            <TableColumn>Thương Hiệu</TableColumn>
                            <TableColumn>Lượt Mua</TableColumn>
                            <TableColumn>Giá </TableColumn>
                            <TableColumn>Tồn Kho</TableColumn>
                          </TableHeader>
                          <TableBody items={topSellingProducts}>
                            {(product) => (
                                <TableRow key={product.productId}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {product.thumbnail && (
                                          <img
                                              src={product.thumbnail}
                                              alt={product.productName}
                                              className="w-10 h-10 object-cover rounded-md"
                                          />
                                      )}
                                      <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {product.productName}
                                </span>
                                        <span className="text-xs text-default-500">
                                  ID: {product.productId}
                                </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="sm" color="primary" variant="flat">
                                      {product.categoryName}
                                    </Chip>
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="sm" color="secondary" variant="flat">
                                      {product.brandName}
                                    </Chip>
                                  </TableCell>
                                  <TableCell className="font-semibold text-lg text-danger-600">
                                    {/* Đảm bảo purchases có thể là undefined nếu nó là optional */}
                                    {product.purchases?.toLocaleString("vi-VN") || "N/A"}
                                  </TableCell>
                                  <TableCell className="font-semibold text-success-700">
                                    {/* Sử dụng formatCurrency đã cập nhật */}
                                    {product.minSalePrice && parseFloat(product.minSalePrice) > 0
                                        ? formatCurrency(product.minSalePrice)
                                        : formatCurrency(product.minPrice)}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {/* Chuyển đổi totalStock sang số để định dạng */}
                                    {parseInt(product.totalStock).toLocaleString("vi-VN")}
                                  </TableCell>
                                </TableRow>
                            )}
                          </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-default-600">
                          <p>Chưa có dữ liệu sản phẩm bán chạy.</p>
                        </div>
                    )}
                  </CardBody>
                </Card>

                {/* --- NEW SECTION: LOW STOCK PRODUCTS --- */}
                <Divider className="my-6" />
                <Card shadow="md">
                  <CardHeader>
                    <h2 className="text-lg font-semibold text-warning">
                      {" "}
                      Sản Phẩm Sắp Hết Hàng (Dưới {LOW_STOCK_THRESHOLD} Đơn Vị)
                    </h2>
                  </CardHeader>
                  <CardBody>
                    {lowStockLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <Spinner
                              size="md"
                              label="Đang tải sản phẩm sắp hết hàng..."
                          />
                        </div>
                    ) : lowStockError ? (
                        <div className="text-center text-danger-500 py-4">
                          <p>{lowStockError}</p>
                          <Button
                              size="sm"
                              color="primary"
                              onPress={fetchLowStockProducts}
                              className="mt-2"
                          >
                            Thử lại
                          </Button>
                        </div>
                    ) : lowStockProducts.length > 0 ? (
                        <Table aria-label="Bảng sản phẩm sắp hết hàng">
                          <TableHeader>
                            <TableColumn>Sản Phẩm</TableColumn>
                            <TableColumn>Danh Mục</TableColumn>
                            <TableColumn>Thương Hiệu</TableColumn>
                            <TableColumn>Tồn Kho</TableColumn>
                            <TableColumn>Giá </TableColumn>
                          </TableHeader>
                          <TableBody items={lowStockProducts}>
                            {(product) => (
                                <TableRow key={product.productId}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {product.thumbnail && (
                                          <img
                                              src={product.thumbnail}
                                              alt={product.productName}
                                              className="w-10 h-10 object-cover rounded-md"
                                          />
                                      )}
                                      <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {product.productName}
                                </span>
                                        <span className="text-xs text-default-500">
                                  ID: {product.productId}
                                </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="sm" color="primary" variant="flat">
                                      {product.categoryName}
                                    </Chip>
                                  </TableCell>
                                  <TableCell>
                                    <Chip size="sm" color="secondary" variant="flat">
                                      {product.brandName}
                                    </Chip>
                                  </TableCell>
                                  <TableCell className="font-semibold text-lg text-warning-600">
                                    {/* Chuyển đổi totalStock sang số để định dạng */}
                                    {parseInt(product.totalStock).toLocaleString("vi-VN")}
                                  </TableCell>
                                  <TableCell className="font-semibold text-success-700">
                                    {/* Sử dụng formatCurrency đã cập nhật */}
                                    {product.minSalePrice && parseFloat(product.minSalePrice) > 0
                                        ? formatCurrency(product.minSalePrice)
                                        : formatCurrency(product.minPrice)}
                                  </TableCell>
                                </TableRow>
                            )}
                          </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-default-600">
                          <p>
                            Không có sản phẩm nào sắp hết hàng .
                          </p>
                        </div>
                    )}
                  </CardBody>
                </Card>
              </>
          ) : hasSession ? (
              <div className="text-center py-16">
                <p className="text-lg text-default-600">
                  {" "}
                  Không tìm thấy dữ liệu cho khoảng thời gian này.
                </p>
                <p className="text-sm text-default-500 mb-4">
                  Vui lòng thử chọn một khoảng thời gian khác.
                </p>
                <Button onPress={triggerFetch} color="primary" isLoading={loading}>
                  {" "}
                  Thử Lại
                </Button>
              </div>
          ) : (
              <div className="text-center py-16">
                <p className="text-lg text-default-600">
                  {" "}
                  Cần đăng nhập để xem dữ liệu thống kê.
                </p>
                <p className="text-sm text-default-500">
                  Vui lòng đăng nhập và thử lại.
                </p>
              </div>
          )}
        </CardBody>

        <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              {" "}
              Tùy Chỉnh Khoảng Thời Gian
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" onPress={pickToday}>
                  Hôm Nay
                </Button>
                <Button size="sm" onPress={pickCurrentWeek}>
                  Tuần Này
                </Button>
                <Button size="sm" color="success" onPress={pickCurrentMonth}>
                  Tháng Này
                </Button>
                <Button size="sm" color="secondary" onPress={pickCurrentYear}>
                  Năm Nay
                </Button>
              </div>
              <Divider className="my-4" />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Từ Ngày</p>
                  <Calendar
                      aria-label="Ngày bắt đầu"
                      value={startDate}
                      onChange={setStartDate}
                      maxValue={endDate || todayDate}
                  />
                </div>
                <div>
                  <p className="font-medium mb-2">Đến Ngày</p>
                  <Calendar
                      aria-label="Ngày kết thúc"
                      value={endDate}
                      onChange={setEndDate}
                      minValue={startDate}
                      maxValue={todayDate}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onClose}>
                Đóng
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Card>
  );
}

