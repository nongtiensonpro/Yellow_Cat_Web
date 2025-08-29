"use client";

import React, {useEffect, useState} from "react";
import {Card, CardBody, CardHeader, Progress} from "@heroui/react";
import {Line, Doughnut} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import {
    orderService,
    OrderSummaryDTO,
    MonthlyTrendDTO,
    AovDTO,
    CancellationRateDTO,
} from "@/services/orderService";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface OrderAnalyticsProps {
    timeRange: string;
}

const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({timeRange}) => {
    // ================= STATE =================
    const [summary, setSummary] = useState<OrderSummaryDTO | null>(null);
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendDTO[]>([]);
    const [aov, setAov] = useState<AovDTO[]>([]);
    const [cancellationRates, setCancellationRates] =
        useState<CancellationRateDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // ================= FETCH DATA =================
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [summaryData, trendsData, aovData, cancelData] =
                    await Promise.all([
                        orderService.getSummary(timeRange),
                        orderService.getMonthlyTrends(),
                        orderService.getAov(),
                        orderService.getCancellationRate(),
                    ]);

                setSummary(summaryData);
                setMonthlyTrends(trendsData);
                setAov(aovData);
                setCancellationRates(cancelData);
            } catch (error) {
                console.error("Lỗi khi gọi API:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    // ================= HELPERS =================
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(amount);

    const formatNumber = (num: number) =>
        new Intl.NumberFormat("vi-VN").format(num);

    if (loading || !summary) {
        return <p className="text-center text-gray-500">Đang tải dữ liệu...</p>;
    }

    // ================= DATA MAPPING =================
    const orderTrendData = {
        labels: monthlyTrends.map((m) => m.month),
        datasets: [
            {
                label: "Đơn hàng",
                data: monthlyTrends.map((m) => m.orders),
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const aovData = {
        labels: aov.map((m) => m.month),
        datasets: [
            {
                label: "Giá trị đơn hàng TB (VND)",
                data: aov.map((m) => m.averageOrderValue),
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const cancellationData = {
        labels: cancellationRates.map((m) => m.month),
        datasets: [
            {
                label: "Tỷ lệ hủy (%)",
                data: cancellationRates.map((m) => m.cancellationRate),
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const orderStatusData = {
        labels: ["Đang xử lý", "Đang giao hàng", "Đã giao hàng", "Bị hủy", "Trả hàng"],
        datasets: [
            {
                data: [
                    summary.processing,
                    summary.shipped,
                    summary.delivered,
                    summary.cancelled,
                    summary.returned,
                ],
                backgroundColor: [
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                ],
                borderColor: [
                    "rgba(245, 158, 11, 1)",
                    "rgba(59, 130, 246, 1)",
                    "rgba(16, 185, 129, 1)",
                    "rgba(239, 68, 68, 1)",
                    "rgba(139, 92, 246, 1)",
                ],
                borderWidth: 2,
            },
        ],
    };

    // ================= RENDER =================
    return (
        <div className="space-y-6">
            {/* Order Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tổng đơn hàng
                        </h4>
                        <p className="text-3xl font-bold text-blue-600">
                            {formatNumber(summary.totalOrder)}
                        </p>
                        <p className={`text-sm mt-2 ${
                            summary.totalOrderGrowth >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                            {formatNumber(summary.totalOrderGrowth)}% so với kỳ trước
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Giá trị đơn hàng TB
                        </h4>
                        <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(summary.avgOrderValue)}
                        </p>
                        <p
                            className={`text-sm mt-2 ${
                                summary.avgOrderValueGrowth >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                        >
                            {formatNumber(summary.avgOrderValueGrowth)}% so với kỳ trước
                        </p>

                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tỷ lệ hoàn thành
                        </h4>
                        <p className="text-3xl font-bold text-emerald-600">
                            {summary.completionRate.toFixed(1)}%
                        </p>
                        <p className={`text-sm mt-2 ${
                            summary.completionRateGrowth >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                            {formatNumber(summary.completionRateGrowth)}% so với kỳ trước
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tỷ lệ hủy
                        </h4>
                        <p className="text-3xl font-bold text-red-600">
                            {summary.cancellationRate.toFixed(1)}%
                        </p>
                        <p className={`text-sm mt-2 ${
                            summary.cancellationRateGrowth >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                            {formatNumber(summary.cancellationRateGrowth)}% so với kỳ trước
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tỷ lệ trả hàng
                        </h4>
                        <p className="text-3xl font-bold text-purple-600">
                            {summary.returnRate.toFixed(1)}%
                        </p>
                        <p className={`text-sm mt-2 ${
                            summary.returnRateGrowth >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                            {formatNumber(summary.returnRateGrowth)}% so với kỳ trước
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Đơn hàng đang xử lý
                        </h4>
                        <p className="text-3xl font-bold text-orange-600">
                            {formatNumber(summary.processing)}
                        </p>
                        <p className="text-sm text-orange-500 mt-2">Cần xử lý gấp</p>
                    </CardBody>
                </Card>
            </div>

            {/* Order Status Chart + Chi tiết trạng thái */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Phân bố trạng thái đơn hàng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Doughnut data={orderStatusData}
                                      options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                              legend: {
                                                  position: 'bottom',
                                              },
                                              tooltip: {
                                                  callbacks: {
                                                      label: function (context) {
                                                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                          return `${context.label}: ${context.parsed} (${percentage}%)`;
                                                      },
                                                  },
                                              },
                                          },
                                      }}
                            />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Chi tiết trạng thái
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đang xử lý
                  </span>
                                    <span className="text-sm font-semibold text-orange-600">
                    {summary.processing} (
                                        {((summary.processing / summary.totalOrder) * 100).toFixed(
                                            1
                                        )}
                                        %)
                  </span>
                                </div>
                                <Progress
                                    value={(summary.processing / summary.totalOrder) * 100}
                                    color="warning"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đã giao
                  </span>
                                    <span className="text-sm font-semibold text-blue-600">
                    {summary.shipped} (
                                        {((summary.shipped / summary.totalOrder) * 100).toFixed(1)}%)
                  </span>
                                </div>
                                <Progress
                                    value={(summary.shipped / summary.totalOrder) * 100}
                                    color="primary"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đã giao hàng
                  </span>
                                    <span className="text-sm font-semibold text-green-600">
                    {summary.delivered} (
                                        {((summary.delivered / summary.totalOrder) * 100).toFixed(1)}
                                        %)
                  </span>
                                </div>
                                <Progress
                                    value={(summary.delivered / summary.totalOrder) * 100}
                                    color="success"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bị hủy
                  </span>
                                    <span className="text-sm font-semibold text-red-600">
                    {summary.cancelled} (
                                        {((summary.cancelled / summary.totalOrder) * 100).toFixed(1)}
                                        %)
                  </span>
                                </div>
                                <Progress
                                    value={(summary.cancelled / summary.totalOrder) * 100}
                                    color="danger"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trả hàng
                  </span>
                                    <span className="text-sm font-semibold text-purple-600">
                    {summary.returned} (
                                        {((summary.returned / summary.totalOrder) * 100).toFixed(1)}%)
                  </span>
                                </div>
                                <Progress
                                    value={(summary.returned / summary.totalOrder) * 100}
                                    color="secondary"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Order Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Xu hướng đơn hàng theo tháng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line data={orderTrendData}/>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Giá trị đơn hàng TB theo tháng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line data={aovData}/>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Cancellation Trend */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Xu hướng tỷ lệ hủy đơn hàng
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="h-64">
                        <Line data={cancellationData}/>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default OrderAnalytics;
