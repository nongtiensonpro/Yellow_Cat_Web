"use client";

import React, {useEffect, useState} from "react";
import {Card, CardBody, CardHeader, Chip, Avatar, Spinner} from "@heroui/react";
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
    ArcElement
} from "chart.js";
import {Bar} from "react-chartjs-2";
import {
    productStatisticService,
    ProductSummaryDTO,
    BestSellerDTO,
    LowStockDTO
} from "@/services/productStatisticService";

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

interface ProductPerformanceProps {
    timeRange: string;
}

const ProductPerformance: React.FC<ProductPerformanceProps> = ({timeRange}) => {
    const [summary, setSummary] = useState<ProductSummaryDTO | null>(null);
    const [bestSellers, setBestSellers] = useState<BestSellerDTO[]>([]);
    const [lowStock, setLowStock] = useState<LowStockDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, bestSellersRes, lowStockRes] = await Promise.all([
                    productStatisticService.getSummary(timeRange),
                    productStatisticService.getBestSellers(),
                    productStatisticService.getLowStock(),
                ]);

                setSummary(summaryRes);
                setBestSellers(bestSellersRes);
                setLowStock(lowStockRes);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);


    const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case "critical":
                return "bg-red-100 text-red-800";
            case "warning":
                return "bg-yellow-100 text-yellow-800";
            case "normal":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStockStatusText = (status: string) => {
        switch (status) {
            case "critical":
                return "Nguy hiểm";
            case "warning":
                return "Cảnh báo";
            case "normal":
                return "Bình thường";
            default:
                return "Không xác định";
        }
    };

    // Dữ liệu biểu đồ từ API
    const bestSellersData = {
        labels: bestSellers.map((p) => p.name),
        datasets: [
            {
                label: "Số lượng bán",
                data: bestSellers.map((p) => p.sales),
                backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                ],
            },
        ],
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner label="Đang tải dữ liệu..."/>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Product Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardBody className="text-center p-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Tổng sản phẩm bán ra
                            </h4>
                            <p className="text-3xl font-bold text-blue-600">
                                {formatNumber(summary.total)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center p-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Sản phẩm bán chạy
                            </h4>
                            <p className="text-3xl font-bold text-green-600">
                                {formatNumber(summary.bestSellers)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center p-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Sản phẩm hoàn trả
                            </h4>
                            <p className="text-3xl font-bold text-purple-600">
                                {formatNumber(summary.returned)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center p-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Tồn kho thấp
                            </h4>
                            <p className="text-3xl font-bold text-orange-600">
                                {formatNumber(summary.lowStock)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="text-center p-6">
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Hết hàng
                            </h4>
                            <p className="text-3xl font-bold text-red-600">
                                {formatNumber(summary.outOfStock)}
                            </p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Best Sellers Chart */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top 5 Sản phẩm bán chạy nhất
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="h-80">
                        <Bar
                            data={bestSellersData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {legend: {display: false}},
                            }}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top 5 Sản phẩm bán chạy nhất
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-3 px-4 text-left">Sản phẩm</th>
                                <th className="py-3 px-4 text-left">Danh mục</th>
                                <th className="py-3 px-4 text-left">Thương hiệu</th>
                                <th className="py-3 px-4 text-left">Đã bán</th>
                                <th className="py-3 px-4 text-left">Doanh thu</th>
                                <th className="py-3 px-4 text-left">Tồn kho</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bestSellers.map((p, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <td className="py-3 px-4 flex items-center space-x-3">
                                        <Avatar name={p.name} size="sm" className="bg-red-100 text-red-600"/>
                                        <span>{p.name}</span>
                                    </td>
                                    <td className="py-3 px-4">{p.category}</td>
                                    <td className="py-3 px-4">{p.brand}</td>
                                    <td className="py-3 px-4 font-semibold text-red-600">{p.sales}</td>
                                    <td className="py-3 px-4">{p.revenue}</td>
                                    <td className="py-3 px-4">{p.stock}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Low Stock Alert */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Cảnh báo tồn kho thấp
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="py-3 px-4 text-left">Sản phẩm</th>
                                <th className="py-3 px-4 text-left">Danh mục</th>
                                <th className="py-3 px-4 text-left">Thương hiệu</th>
                                <th className="py-3 px-4 text-left">Màu sắc</th>
                                <th className="py-3 px-4 text-left">Kích cở</th>
                                <th className="py-3 px-4 text-left">Tồn kho</th>
                                <th className="py-3 px-4 text-left">Ngưỡng</th>
                                <th className="py-3 px-4 text-left">Trạng thái</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lowStock.map((p, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <td className="py-3 px-4 flex items-center space-x-3">
                                        <Avatar name={p.name} size="sm" className="bg-red-100 text-red-600"/>
                                        <span>{p.name}</span>
                                    </td>
                                    <td className="py-3 px-4">{p.category}</td>
                                    <td className="py-3 px-4">{p.brand}</td>
                                    <td className="py-3 px-4">{p.color}</td>
                                    <td className="py-3 px-4">{p.size}</td>
                                    <td className="py-3 px-4 font-semibold text-red-600">{p.stock}</td>
                                    <td className="py-3 px-4">{p.threshold}</td>
                                    <td className="py-3 px-4">
                                        <Chip className={getStockStatusColor(p.status)} size="sm">
                                            {getStockStatusText(p.status)}
                                        </Chip>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ProductPerformance;
