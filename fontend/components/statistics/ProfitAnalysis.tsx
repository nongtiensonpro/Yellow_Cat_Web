"use client";

import React, {useEffect, useState} from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
} from "@heroui/react";
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
import {Line} from "react-chartjs-2";
import {
    profitService,
    ProfitSummaryResponse,
    ProfitTrendResponse,
    ProfitMarginsResponse,
} from "@/services/profitService";

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

interface ProfitAnalysisProps {
    timeRange: string;
}

export const ProfitAnalysis: React.FC<ProfitAnalysisProps> = ({timeRange}) => {
    const [chartType, setChartType] = useState("weekly");

    // State
    const [summary, setSummary] = useState<ProfitSummaryResponse | null>(null);
    const [trends, setTrends] = useState<ProfitTrendResponse | null>(null);
    const [margins, setMargins] = useState<ProfitMarginsResponse | null>(null);

    const [loading, setLoading] = useState(true);

    // Fetch API
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [s, t, m] = await Promise.all([
                    profitService.getSummary(timeRange),
                    profitService.getTrends(timeRange, chartType),
                    profitService.getMargins(timeRange, chartType),
                ]);
                setSummary(s);
                setTrends(t);
                setMargins(m);
            } catch (err) {
                console.error("Lỗi khi load dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [timeRange, chartType]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    if (loading) {
        return (
            <div className="text-center text-gray-500">Đang tải dữ liệu...</div>
        );
    }

    if (!summary) {
        return <div className="text-center text-red-500">Không có dữ liệu!</div>;
    }

    // Chuẩn bị dữ liệu chart từ API
    const profitTrendData = trends && {
        labels: trends.labels,
        datasets: [
            {
                label: "Doanh thu",
                data: trends.datasets.revenue,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
            },
            {
                label: "Lợi nhuận",
                data: trends.datasets.netProfit,
                borderColor: "rgb(245, 158, 11)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const marginComparisonData = margins && {
        labels: margins.labels,
        datasets: [
            {
                label: "Tỷ suất lợi nhuận (%)",
                data: margins.datasets.netMargin,
                borderColor: "rgb(245, 158, 11)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    // ================= RENDER giao diện cũ, chỉ đổi data =================
    return (
        <div className="space-y-6">
            {/* Profit Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tổng doanh thu
                        </h4>
                        <p className="text-3xl font-bold text-blue-600">
                            {formatCurrency(summary.revenue)}
                        </p>
                        <p className="text-sm text-blue-500 mt-2">
                            +{summary.revenueGrowth?.toFixed(1)}% so với kỳ trước
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Lợi nhuận
                        </h4>
                        <p className="text-3xl font-bold text-emerald-600">
                            {formatCurrency(summary.netProfit ?? 0)}
                        </p>
                        <p className="text-sm text-emerald-500 mt-2">
                            {summary.profitMargin?.toFixed(1)}% tỷ suất lợi nhuận
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Giá vốn hàng bán
                        </h4>
                        <p className="text-3xl font-bold text-red-600">
                            {formatCurrency(summary.costOfGoods)}
                        </p>
                        <p className="text-sm text-red-500 mt-2">
                            {((summary.costOfGoods / summary.revenue) * 100).toFixed(1)}% tổng
                            doanh thu
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Profit Trends Chart */}
            {profitTrendData && (
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Xu hướng doanh thu và lợi nhuận
                        </h3>
                        <Select
                            label="Loại biểu đồ"
                            selectedKeys={[chartType]}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                setChartType(value);
                            }}
                            className="w-40"
                        >
                            <SelectItem key="daily">Theo ngày</SelectItem>
                            <SelectItem key="weekly">Theo tuần</SelectItem>
                            <SelectItem key="monthly">Theo tháng</SelectItem>
                            <SelectItem key="yearly">Theo năm</SelectItem>
                        </Select>
                    </CardHeader>
                    <CardBody>
                        <div className="h-80">
                            <Line data={profitTrendData} options={{responsive: true}}/>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Margin Analysis */}
            {marginComparisonData && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Phân tích tỷ suất lợi nhuận
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line data={marginComparisonData} options={{responsive: true}}/>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};