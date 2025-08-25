"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
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
} from "@heroui/react";
import { Calendar } from "@heroui/react";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { useRevenue } from "@/hooks/useRevenue"; // Giả định hook này tồn tại và hoạt động đúng

// --- Types ---
interface ProductListItemDTO {
    productId: number;
    productName: string;
    purchases?: number; // Optional as before
    categoryName: string;
    brandName: string;
    logoPublicId?: string; // Optional

    minPrice: string;        // BigDecimal -> String
    minSalePrice?: string;  // BigDecimal -> String
    totalStock: string;      // Long -> String
    thumbnail?: string;      // Optional
}

// New type for order status counts
interface OrderStatusCounts {
    [status: string]: number;
}

// --- Helper Functions ---
const formatDateForApi = (date: CalendarDate): string =>
    `${date.year}-${String(date.month).padStart(2, "0")}-${String(
        date.day
    ).padStart(2, "0")}`;

const formatCurrency = (amount: number | string): string => {
    // Chuyển đổi string sang number trước khi format
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    // Fallback to 0 if parseFloat results in NaN (e.g., from an invalid string or null)
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(isNaN(numericAmount) ? 0 : numericAmount);
};

// Define colors for order statuses - these must match the statuses returned by your backend
// and visually correspond to your desired pie chart appearance.
// These colors are based on the common interpretation of the image provided.
const STATUS_COLORS: { [key: string]: string } = {
    'Chờ xác nhận': '#F4B400',   // A shade of orange/yellow that looks like the large 60% chunk in the image.
    'Đã xác nhận': '#00C49F',    // Green - corresponds to 15.00% in image
    'Chờ vận chuyển': '#AF19FF', // Purple - corresponds to 5.00% in image
    'Đang vận chuyển': '#FF8042',// Orange - corresponds to 25.00% in image
    'Đã thanh toán': '#FFBB28',  // Yellow - Using a different yellow/orange shade
    'Hoàn thành': '#8884d8',     // Light Purple
    'Đã hủy': '#FF0000',          // Red - corresponds to 5.00% in image
    'Trả hàng': '#82ca9d',        // Light Green
    'Partial': '#78C2AD',         // Teal
    'Pending': '#F8D347',         // Gold
    // Add any other statuses your backend might return, with appropriate colors
};

// --- Main Component ---
export default function StatisticsByDay() {
    // Modal state and handlers for custom date range selection
    const { isOpen, onOpen, onClose } = useDisclosure();
    // Session data for authentication (e.g., accessToken)
    const { data: session } = useSession();
    // Timezone and current date utilities for date pickers
    const tz = getLocalTimeZone();
    const todayDate = useMemo(() => today(tz), [tz]);
    const firstOfMonth = useMemo(() => todayDate.set({ day: 1 }), [todayDate]);

    // State for selected date range for revenue statistics
    const [startDate, setStartDate] = useState<CalendarDate>(firstOfMonth);
    const [endDate, setEndDate] = useState<CalendarDate>(todayDate);

    // State for sorting product revenue table
// States for Top Selling Products section
    const [topSellingProducts, setTopSellingProducts] = useState<ProductListItemDTO[]>([]);
    const [topSellingLoading, setTopSellingLoading] = useState<boolean>(true);
    const [topSellingError, setTopSellingError] = useState<string | null>(null);

    // States for Low Stock Products section
    const [lowStockProducts, setLowStockProducts] = useState<ProductListItemDTO[]>([]);
    const [lowStockLoading, setLowStockLoading] = useState<boolean>(true);
    const [lowStockError, setLowStockError] = useState<string | null>(null);
    const LOW_STOCK_THRESHOLD = 10; // Threshold for low stock products

    // States for Order Status Counts section
    const [orderStatusCounts, setOrderStatusCounts] = useState<OrderStatusCounts>({});
    const [orderStatusLoading, setOrderStatusLoading] = useState<boolean>(true);
    const [orderStatusError, setOrderStatusError] = useState<string | null>(null);

    // Custom hook for revenue data fetching and processing
    const {
        revenueData,// Daily revenue data
        loading,              // Loading state for revenue data
        error,                // Error state for revenue data
        totalRevenue,         // Total revenue for the selected period
        totalUnits,           // Total units sold for the selected period
        fetchAllData,         // Function to trigger revenue data fetch
        hasSession,           // Boolean indicating if a user session exists
    } = useRevenue();

    // Effect to fetch revenue data based on date range changes or session
    useEffect(() => {
        if (hasSession && startDate && endDate) {
            fetchAllData({
                startDate: formatDateForApi(startDate),
                endDate: formatDateForApi(endDate),
            });
        }
    }, [startDate, endDate, hasSession, fetchAllData]);

    // Function to fetch top-selling products from the backend
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
                "http://localhost:8080/api/products/top-selling", // API endpoint for top-selling products
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`, // Pass JWT for authentication
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                let errorMessage = `Failed to fetch top-selling products: ${response.status} ${response.statusText}`;
                const contentType = response.headers.get("content-type");

                // Attempt to parse JSON error message if available
                if (contentType && contentType.includes("application/json")) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonError) {
                        console.error("Failed to parse error response as JSON:", jsonError);
                        errorMessage = `Received non-JSON error response from server. Status: ${response.status}.`;
                    }
                } else {
                    // Log raw text if response is not JSON
                    const rawText = await response.text();
                    console.error(
                        "Expected JSON but received non-JSON response:",
                        rawText
                    );
                    errorMessage = `Server responded with non-JSON content. Status: ${response.status}. Please check server logs.`;
                }
                throw new Error(errorMessage);
            }

            // Verify content type for successful response
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
            // Update state if data is successful and an array
            if (data.success && Array.isArray(data.data)) {
                setTopSellingProducts(data.data);
            } else {
                throw new Error(
                    "Invalid data format for top-selling products: 'success' property missing or 'data' is not an array."
                );
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải sản phẩm bán chạy nhất do lỗi không xác định.";
            console.error("Error fetching top-selling products:", err);
            setTopSellingError(errorMessage);
        } finally {
            setTopSellingLoading(false); // End loading regardless of success or failure
        }
    }, [session?.accessToken]); // Depend on accessToken for re-fetch

    // Function to fetch low-stock products from the backend
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
                `http://localhost:8080/api/products/low-stock?threshold=${LOW_STOCK_THRESHOLD}`, // API endpoint for low-stock products with threshold
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
            console.log("Received low-stock products data:", data); // Log for debugging

            if (data.success && Array.isArray(data.data)) {
                setLowStockProducts(data.data);
            } else {
                throw new Error(
                    "Invalid data format for low-stock products: 'success' property missing or 'data' is not an array."
                );
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải sản phẩm sắp hết hàng do lỗi không xác định.";
            console.error("Error fetching low-stock products:", err);
            // More specific error message for type mismatch
            if (err instanceof Error && err.message && err.message.includes("JSON")) {
                setLowStockError("Lỗi định dạng dữ liệu từ máy chủ. Vui lòng kiểm tra console.");
            } else {
                setLowStockError(errorMessage);
            }
        } finally {
            setLowStockLoading(false);
        }
    }, [session?.accessToken, LOW_STOCK_THRESHOLD]); // Depend on accessToken and threshold

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

    // New: State and logic for Order Status Counts
    const fetchOrderStatusCounts = useCallback(async () => {
        if (!session?.accessToken) {
            setOrderStatusLoading(false);
            setOrderStatusError("Không có phiên đăng nhập hoặc Access Token.");
            return;
        }

        setOrderStatusLoading(true);
        setOrderStatusError(null);
        try {
            const response = await fetch("http://localhost:8080/api/orders/status-counts", {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                let errorMessage = `Failed to fetch order status counts: ${response.status} ${response.statusText}`;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const rawText = await response.text();
                    errorMessage = `Server responded with non-JSON content. Status: ${response.status}. Response: ${rawText}`;
                }
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const rawText = await response.text();
                throw new Error(
                    "Invalid response from server: Expected JSON, but received non-JSON content: " + rawText
                );
            }

            const data = await response.json();
            if (data.success && typeof data.data === 'object' && data.data !== null) {
                setOrderStatusCounts(data.data);
            } else {
                throw new Error("Invalid data format for order status counts.");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải thống kê trạng thái đơn hàng do lỗi không xác định.";
            console.error("Error fetching order status counts:", err);
            setOrderStatusError(errorMessage);
        } finally {
            setOrderStatusLoading(false);
        }
    }, [session?.accessToken]);

    // Effect to fetch order status counts on component mount or session change
    useEffect(() => {
        if (hasSession) {
            fetchOrderStatusCounts();
        }
    }, [hasSession, fetchOrderStatusCounts]);

    // Prepare data and CSS style for the conic gradient pie chart
    const pieChartGradientStyle = useMemo(() => {
        if (!orderStatusCounts || Object.keys(orderStatusCounts).length === 0) {
            return {};
        }

        const totalOrders = Object.values(orderStatusCounts).reduce((sum, count) => sum + count, 0);
        if (totalOrders === 0) return {};

        let currentPercentage = 0;
        const gradientParts: string[] = [];

        // Sort statuses to ensure consistent slice order in the pie chart and legend
        const sortedStatuses = Object.keys(orderStatusCounts).sort();

        sortedStatuses.forEach(status => {
            const count = orderStatusCounts[status];
            const percentage = (count / totalOrders) * 100;
            const color = STATUS_COLORS[status] || '#cccccc'; // Fallback color if status not in map

            if (percentage > 0) {
                // For the first slice, start from 0%
                if (currentPercentage === 0) {
                    gradientParts.push(`${color} 0% ${percentage}%`);
                } else {
                    // For subsequent slices, start from the end of the previous slice
                    gradientParts.push(`${color} ${currentPercentage}% ${currentPercentage + percentage}%`);
                }
                currentPercentage += percentage;
            }
        });

        // Ensure the last part extends to 100% to avoid minor visual gaps due to floating point inaccuracies.
        if (gradientParts.length > 0) {
            const lastPart = gradientParts[gradientParts.length - 1];
            // Extract the color from the last added gradient part
            const lastColorMatch = lastPart.match(/^(#[\da-fA-F]{6}|rgba?\([^)]+\))\s/);
            const lastColor = lastColorMatch ? lastColorMatch[1] : '#cccccc';

            // Adjust the end stop of the last gradient part to exactly 100%
            // Math.floor is used to prevent potential overflow that might create a tiny "gap" if percentages slightly exceed 100 due to rounding
            gradientParts[gradientParts.length - 1] = `${lastColor} ${Math.floor(currentPercentage - (currentPercentage - Math.floor(currentPercentage)))}% 100%`;
        }

        return {
            backgroundImage: `conic-gradient(${gradientParts.join(', ')})`,
            borderRadius: '50%', // Makes the div a perfect circle
            width: '250px', // Fixed width for the pie chart container
            height: '250px', // Fixed height for the pie chart container
        };
    }, [orderStatusCounts]);

    // Prepare data for the legend, including calculated percentages for display
    const legendData = useMemo(() => {
        if (!orderStatusCounts) return [];
        const totalOrders = Object.values(orderStatusCounts).reduce((sum, count) => sum + count, 0);

        // Sort legend items to match the order of slices in the pie chart
        return Object.entries(orderStatusCounts)
            .sort(([statusA], [statusB]) => statusA.localeCompare(statusB))
            .map(([status, count]) => ({
                name: status,
                value: count,
                percentage: totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(0) + '%' : '0%', // Calculate percentage (0 decimal places)
                color: STATUS_COLORS[status] || '#cccccc' // Get color for the legend's color dot
            }));
    }, [orderStatusCounts]);


    return (
        <Card className="max">
            {/* Card Header for Dashboard Title and Date Range Selection */}
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary"> Quản lý thống kê </h1>
                    {/*<p className="text-sm text-default-500">*/}
                    {/*    {formatDateForApi(startDate)} → {formatDateForApi(endDate)} (*/}
                    {/*    {totalDays} ngày) /!* Displays the current selected date range *!/*/}
                    {/*</p>*/}
                </div>
                {/*/!* Date Range Quick Selection Buttons *!/*/}
                {/*<div className="flex flex-wrap gap-2">*/}
                {/*    <Button onPress={pickToday} disabled={!hasSession} size="sm">*/}
                {/*        Hôm Nay*/}
                {/*    </Button>*/}
                {/*    <Button onPress={pickCurrentWeek} disabled={!hasSession} size="sm">*/}
                {/*        Tuần Này*/}
                {/*    </Button>*/}
                {/*    <Button onPress={pickCurrentMonth} disabled={!hasSession} size="sm" color="success">*/}
                {/*        Tháng Này*/}
                {/*    </Button>*/}
                {/*    <Button size="sm" color="secondary" onPress={pickCurrentYear}>*/}
                {/*        Năm Nay*/}
                {/*    </Button>*/}
                {/*    <Button onPress={onOpen} disabled={!hasSession} size="sm" color="primary">*/}
                {/*        {hasSession ? "⚙️ Tùy Chỉnh Ngày" : " Vui lòng đăng nhập"} /!* Button to open custom date selection modal *!/*/}
                {/*    </Button>*/}
                {/*</div>*/}
            </CardHeader>
            {/* Date Range Quick Selection Buttons */}
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
                <Button size="sm" color="secondary" onPress={pickCurrentYear}>
                    Năm Nay
                </Button>
                <Button onPress={onOpen} disabled={!hasSession} size="sm" color="primary">
                    {hasSession ? "⚙️ Tùy Chỉnh Ngày" : " Vui lòng đăng nhập"} {/* Button to open custom date selection modal */}
                </Button>
            </div>
            <Divider /> {/* Separator line */}

            {/* Main Card Body containing all statistics sections */}
            <CardBody className="space-y-6">
                {/* Error message display for main revenue data fetch */}
                {error && (
                    <Card className="bg-danger-50 border border-danger-200">
                        <CardBody className="text-center text-danger font-semibold">
                            ❌ {error}
                        </CardBody>
                    </Card>
                )}

                {/* Conditional rendering for overall loading state */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner size="lg" label="Đang tải dữ liệu, vui lòng chờ..." />
                    </div>
                ) : revenueData.length > 0 ? (
                    <>
                        {/* Overview Cards: Displays summary of financial data */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card shadow="sm" className="bg-success-50 border-l-4 border-success-500">
                                <CardBody className="text-center p-4">
                                    <p className="font-semibold text-success-700"> Tổng Doanh Thu</p>
                                    <p className="text-3xl font-bold text-success-800">
                                        {formatCurrency(totalRevenue)} {/* Formatted total revenue */}
                                    </p>
                                </CardBody>
                            </Card>
                            <Card shadow="sm" className="bg-primary-50 border-l-4 border-primary-500">
                                <CardBody className="text-center p-4">
                                    <p className="font-semibold text-primary-700"> Tổng Sản Phẩm Bán Ra</p>
                                    <p className="text-3xl font-bold text-primary-800">
                                        {totalUnits.toLocaleString("vi-VN")} {/* Formatted total units sold */}
                                    </p>
                                </CardBody>
                            </Card>
                            <Card shadow="sm" className="bg-warning-50 border-l-4 border-warning-500">
                                <CardBody className="text-center p-4">
                                    <p className="font-semibold text-warning-700"> Doanh Thu TB/Ngày</p>
                                    <p className="text-3xl font-bold text-warning-800">
                                        {formatCurrency(averageRevenuePerDay)} {/* Formatted average daily revenue */}
                                    </p>
                                </CardBody>
                            </Card>
                        </div>

                        {/* --- NEW SECTION: Order Status Statistics (PIE CHART ONLY) --- */}
                        <Divider className="my-6" />
                        <Card shadow="md">
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-primary"> Thống Kê Đơn Hàng Theo Trạng Thái</h2>
                            </CardHeader>
                            <CardBody>
                                {/* Conditional rendering for order status data: loading, error, or content */}
                                {orderStatusLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Spinner size="md" label="Đang tải thống kê trạng thái đơn hàng..." />
                                    </div>
                                ) : orderStatusError ? (
                                    <div className="text-center text-danger-500 py-4">
                                        <p>❌ {orderStatusError}</p>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            onPress={fetchOrderStatusCounts} // Retry button
                                            className="mt-2"
                                        >
                                            Thử lại
                                        </Button>
                                    </div>
                                ) : Object.keys(orderStatusCounts).length > 0 ? (
                                    // Main container for pie chart and legend, arranged using flexbox
                                    // Modified this div to control the alignment better
                                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
                                        {/* CSS Pie Chart Container */}
                                        <div className="flex items-center justify-center flex-shrink-0"> {/* Added flex-shrink-0 to prevent shrinking */}
                                            <div
                                                style={pieChartGradientStyle as React.CSSProperties} // Apply the calculated conic gradient style
                                                className="relative flex items-center justify-center text-default-700 font-bold"
                                            >
                                                {/* Optional: Inner white circle for a donut effect (matches your image) */}
                                                <div className="absolute inset-0 m-auto bg-white rounded-full" style={{ width: '60px', height: '60px' }}></div>
                                                {/* Note: Labels *inside* the slices like in your image are complex with pure CSS.
                                                    They require manually positioning elements using trigonometry or using a charting library.
                                                    For this "no install" version, labels are only in the legend. */}
                                            </div>
                                        </div>

                                        {/* Legend Section */}
                                        <div className="flex flex-col gap-2 min-w-[200px]"> {/* Added min-w to give it some space */}
                                            {legendData.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    {/* Color dot for the legend item */}
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    ></div>
                                                    {/* Status name, count, and calculated percentage */}
                                                    <span className="text-sm">
                                                        {item.name}: {item.value.toLocaleString()} ({item.percentage})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Message displayed when no order status data is available
                                    <div className="text-center py-8 text-default-600">
                                        <p>Chưa có dữ liệu thống kê trạng thái đơn hàng.</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>


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
                                        <p>❌ {topSellingError}</p>
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
                                                                <Image
                                                                    src={product.thumbnail}
                                                                    alt={product.productName}
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-cover rounded-md"
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
                                                        {product.purchases?.toLocaleString("vi-VN") || "N/A"}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-success-700">
                                                        {product.minSalePrice && parseFloat(product.minSalePrice) > 0
                                                            ? formatCurrency(product.minSalePrice)
                                                            : formatCurrency(product.minPrice || '0')}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {parseInt(product.totalStock || '0').toLocaleString("vi-VN")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-default-600">
                                        <p>
                                            Chưa có dữ liệu sản phẩm bán chạy.
                                        </p>
                                        <p className="text-sm text-default-500 mt-2">
                                            Kiểm tra lại ngưỡng tồn kho hoặc thêm sản phẩm.
                                        </p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* --- NEW SECTION: LOW STOCK PRODUCTS --- */}
                        <Divider className="my-6" />
                        <Card shadow="md">
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-warning">
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
                                        <p>❌ {lowStockError}</p>
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
                                                                <Image
                                                                    src={product.thumbnail}
                                                                    alt={product.productName}
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-cover rounded-md"
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
                                                        {parseInt(product.totalStock || '0').toLocaleString("vi-VN")}
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-success-700">
                                                        {product.minSalePrice && parseFloat(product.minSalePrice) > 0
                                                            ? formatCurrency(product.minSalePrice)
                                                            : formatCurrency(product.minPrice || '0')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-8 text-default-600">
                                        <p>
                                            Không có sản phẩm nào sắp hết hàng (dưới {LOW_STOCK_THRESHOLD} Đơn Vị).
                                        </p>
                                        <p className="text-sm text-default-500 mt-2">
                                            Kiểm tra lại ngưỡng tồn kho hoặc thêm sản phẩm.
                                        </p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </>
                ) : hasSession ? (
                    <div className="text-center py-16">
                        <p className="text-lg text-default-600">
                            Không tìm thấy dữ liệu cho khoảng thời gian này.
                        </p>
                        <p className="text-sm text-default-500 mb-4">
                            Vui lòng thử chọn một khoảng thời gian khác.
                        </p>
                        <Button onPress={triggerFetch} color="primary" isLoading={loading}>
                            Thử Lại
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-lg text-default-600">
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
