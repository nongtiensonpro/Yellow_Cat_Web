"use client";

import React, {useEffect, useState} from "react";
import {Card, CardBody, CardHeader, Select, SelectItem} from "@heroui/react";
import {Line, Bar, Doughnut} from "react-chartjs-2";
import {
    revenueService,
    type RevenueTrendDTO,
    type RevenueByCategoryDTO,
    type RevenueByBrandDTO,
    type RevenueSummaryDTO
} from "@/services/statisticRevenueService";

interface RevenueChartsProps {
    timeRange: string;
}

const RevenueCharts: React.FC<RevenueChartsProps> = ({timeRange}) => {
    const [chartType, setChartType] = useState<"daily" | "weekly" | "monthly">("daily");
    const [trendData, setTrendData] = useState<RevenueTrendDTO | null>(null);
    const [categoryData, setCategoryData] = useState<RevenueByCategoryDTO | null>(null);
    const [brandData, setBrandData] = useState<RevenueByBrandDTO | null>(null);
    const [summary, setSummary] = useState<RevenueSummaryDTO | null>(null);

    // load dữ liệu khi chartType hoặc timeRange thay đổi
    useEffect(() => {
        const fetchData = async () => {
            try {
                const trend = await revenueService.getTrend(chartType, timeRange);
                const cat = await revenueService.getByCategory(timeRange);
                const brand = await revenueService.getByBrand(timeRange);
                const sum = await revenueService.getSummary(timeRange);

                setTrendData(trend);
                setCategoryData(cat);
                setBrandData(brand);
                setSummary(sum);
            } catch (err) {
                console.error("Lỗi load dữ liệu:", err);
            }
        };
        fetchData();
    }, [chartType, timeRange]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(amount);

    // Nếu chưa có dữ liệu thì hiển thị loading
    if (!trendData || !categoryData || !brandData || !summary) {
        return <p>Đang tải dữ liệu...</p>;
    }

    const lineChartData = {
        labels: trendData.labels,
        datasets: [
            {
                label: "Doanh thu",
                data: trendData.revenue,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
            },
            ...(trendData.orders
                ? [
                    {
                        label: "Số đơn hàng",
                        data: trendData.orders,
                        borderColor: "rgb(16, 185, 129)",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        tension: 0.4,
                        fill: true,
                        yAxisID: "y1",
                    },
                ]
                : []),
        ],
    };

    const categoryChartData = {
        labels: categoryData.categoryName,
        datasets: [
            {
                data: categoryData.totalRevenue,
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(139, 92, 246, 0.8)"
                ]
            }
        ]
    };

    const brandChartData = {
        labels: brandData.brandName,
        datasets: [
            {
                label: "Doanh thu",
                data: brandData.totalRevenue,
                backgroundColor: "rgba(59, 130, 246, 0.8)"
            }
        ]
    };

    const conversionFunction = () => {
        switch (timeRange) {
            case "day":
                return "ngày";
            case "week":
                return "tuần";
            case "month":
                return "tháng";
            case "year":
                return "năm";
            default:
                return "tháng";
        }
    };

    const handleChartTypeChange = (value: string) => {
        setChartType(value as "daily" | "weekly" | "monthly");
    };

    return (
        <div className="space-y-6">
            {/* Biểu đồ xu hướng */}
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Xu hướng doanh thu</h3>
                    <Select 
                        selectedKeys={[chartType]} 
                        onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string;
                            handleChartTypeChange(selectedKey);
                        }} 
                        className="w-40"
                    >
                        <SelectItem key="daily">Theo ngày</SelectItem>
                        <SelectItem key="weekly">Theo tuần</SelectItem>
                        <SelectItem key="monthly">Theo tháng</SelectItem>
                    </Select>
                </CardHeader>
                <CardBody>
                    <div className="h-80">
                        <Line data={lineChartData}/>
                    </div>
                </CardBody>
            </Card>

            {/* Danh mục & Thương hiệu */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold">Doanh thu theo danh mục</h3></CardHeader>
                    <CardBody><Doughnut data={categoryChartData}/></CardBody>
                </Card>

                <Card>
                    <CardHeader><h3 className="text-lg font-semibold">Doanh thu theo thương hiệu</h3></CardHeader>
                    <CardBody><Bar data={brandChartData}/></CardBody>
                </Card>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="text-center">
                        <h4>Tổng doanh thu theo {conversionFunction()}</h4>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <h4>Tăng trưởng so với {conversionFunction()} trước</h4>
                        <p className="text-2xl font-bold text-blue-600">{summary.growthRate}%</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <h4>Doanh thu trung bình theo {conversionFunction()}</h4>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.averageOrderValue)}</p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default RevenueCharts;
