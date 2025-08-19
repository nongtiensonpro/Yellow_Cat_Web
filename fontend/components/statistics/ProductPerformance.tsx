"use client";

import React from 'react';
import {Card, CardBody, CardHeader, Chip, Avatar} from "@heroui/react";
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
} from 'chart.js';
import {Line, Bar} from 'react-chartjs-2';

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

    // Mock data - trong thực tế sẽ lấy từ API
    const productData = {
        total: 1250,
        active: 1180,
        inactive: 70,
        lowStock: 45,
        outOfStock: 12,
        bestSellers: 89,
        returned: 23,
        conversionRate: 3.2
    };

    const bestSellersData = {
        labels: ['Nike Air Max', 'Adidas Ultraboost', 'Puma RS-X', 'Converse Chuck', 'Vans Old Skool'],
        datasets: [
            {
                label: 'Số lượng bán',
                data: [1250, 980, 850, 720, 680],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
            },
        ],
    };

    const categoryPerformanceData = {
        labels: ['Giày thể thao', 'Giày công sở', 'Giày cao gót', 'Giày búp bê', 'Giày lười'],
        datasets: [
            {
                label: 'Doanh thu (triệu VND)',
                data: [45, 32, 28, 18, 15],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ]
    };

    const stockLevelData = {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [
            {
                label: 'Tồn kho trung bình',
                data: [1200, 1180, 1150, 1120, 1100, 1080, 1050, 1020, 1000, 980, 950, 920],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ]
    };


    const topProducts = [
        {
            id: 1,
            name: 'Nike Air Max 270',
            category: 'Giày thể thao',
            brand: 'Nike',
            sales: 1250,
            revenue: 187500000,
            stock: 45,
            rating: 4.8
        },
        {
            id: 2,
            name: 'Adidas Ultraboost 22',
            category: 'Giày thể thao',
            brand: 'Adidas',
            sales: 980,
            revenue: 147000000,
            stock: 32,
            rating: 4.7
        },
        {
            id: 3,
            name: 'Puma RS-X 3D',
            category: 'Giày thể thao',
            brand: 'Puma',
            sales: 850,
            revenue: 102000000,
            stock: 28,
            rating: 4.6
        },
        {
            id: 4,
            name: 'Converse Chuck Taylor',
            category: 'Giày búp bê',
            brand: 'Converse',
            sales: 720,
            revenue: 86400000,
            stock: 65,
            rating: 4.5
        },
        {
            id: 5,
            name: 'Vans Old Skool',
            category: 'Giày lười',
            brand: 'Vans',
            sales: 680,
            revenue: 81600000,
            stock: 42,
            rating: 4.4
        },
    ];

    const lowStockProducts = [
        {
            id: 1,
            name: 'Nike Air Jordan 1',
            category: 'Giày thể thao',
            brand: 'Nike',
            stock: 5,
            threshold: 10,
            status: 'critical'
        },
        {
            id: 2,
            name: 'Adidas Yeezy Boost',
            category: 'Giày thể thao',
            brand: 'Adidas',
            stock: 8,
            threshold: 15,
            status: 'warning'
        },
        {
            id: 3,
            name: 'Puma Future Rider',
            category: 'Giày thể thao',
            brand: 'Puma',
            stock: 12,
            threshold: 20,
            status: 'warning'
        },
        {
            id: 4,
            name: 'Converse One Star',
            category: 'Giày búp bê',
            brand: 'Converse',
            stock: 3,
            threshold: 10,
            status: 'critical'
        },
        {
            id: 5,
            name: 'Vans Authentic',
            category: 'Giày lười',
            brand: 'Vans',
            stock: 7,
            threshold: 15,
            status: 'warning'
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'normal':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStockStatusText = (status: string) => {
        switch (status) {
            case 'critical':
                return 'Nguy hiểm';
            case 'warning':
                return 'Cảnh báo';
            case 'normal':
                return 'Bình thường';
            default:
                return 'Không xác định';
        }
    };

    return (
        <div className="space-y-6">
            {/* Product Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tổng sản phẩm
                        </h4>
                        <p className="text-3xl font-bold text-blue-600">
                            {formatNumber(productData.total)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {timeRange === 'today' ? 'Hôm nay' :
                                timeRange === 'week' ? 'Tuần này' :
                                    timeRange === 'month' ? 'Tháng này' :
                                        timeRange === 'quarter' ? 'Quý này' : 'Năm nay'}
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Sản phẩm bán chạy
                        </h4>
                        <p className="text-3xl font-bold text-green-600">
                            {formatNumber(productData.bestSellers)}
                        </p>
                        <p className="text-sm text-green-500 mt-2">+12.5% so với tháng trước</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Sản phẩm hoàn trả
                        </h4>
                        <p className="text-3xl font-bold text-purple-600">
                            {formatNumber(productData.returned)}
                        </p>
                        <p className="text-sm text-purple-500 mt-2">1.8% tổng đơn hàng</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tồn kho thấp
                        </h4>
                        <p className="text-3xl font-bold text-orange-600">
                            {formatNumber(productData.lowStock)}
                        </p>
                        <p className="text-sm text-orange-500 mt-2">Cần nhập hàng gấp</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Hết hàng
                        </h4>
                        <p className="text-3xl font-bold text-red-600">
                            {formatNumber(productData.outOfStock)}
                        </p>
                        <p className="text-sm text-red-500 mt-2">Cần bổ sung ngay</p>
                    </CardBody>
                </Card>
            </div>

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
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: {
                                            display: true,
                                            text: 'Số lượng bán',
                                        },
                                    },
                                },
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                return `Số lượng: ${context.parsed.y}`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Category Performance and Stock Levels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Hiệu suất theo danh mục
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line
                                data={categoryPerformanceData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Doanh thu (triệu VND)',
                                            },
                                        },
                                    },
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    return `Doanh thu: ${context.parsed.y} triệu VND`;
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
                            Mức tồn kho theo tháng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line
                                data={stockLevelData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Số lượng tồn kho',
                                            },
                                        },
                                    },
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    return `Tồn kho: ${context.parsed.y}`;
                                                },
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Top Products Table */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top 5 Sản phẩm bán chạy
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Sản
                                    phẩm
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Danh
                                    mục
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Thương
                                    hiệu
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Số
                                    lượng bán
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Doanh
                                    thu
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tồn
                                    kho
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Đánh
                                    giá
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {topProducts.map((product) => (
                                <tr key={product.id}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar
                                                name={product.name}
                                                size="sm"
                                                className="bg-blue-100 text-blue-600"
                                            />
                                            <span
                                                className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{product.category}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{product.brand}</td>
                                    <td className="py-3 px-4 font-semibold text-blue-600">{formatNumber(product.sales)}</td>
                                    <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(product.revenue)}</td>
                                    <td className="py-3 px-4 text-gray-900 dark:text-white">{product.stock}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-1">
                                            <span className="text-yellow-600">★</span>
                                            <span className="text-gray-900 dark:text-white">{product.rating}</span>
                                        </div>
                                    </td>
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
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Sản
                                    phẩm
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Danh
                                    mục
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Thương
                                    hiệu
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tồn
                                    kho
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Ngưỡng</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Trạng
                                    thái
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {lowStockProducts.map((product) => (
                                <tr key={product.id}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar
                                                name={product.name}
                                                size="sm"
                                                className="bg-red-100 text-red-600"
                                            />
                                            <span
                                                className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{product.category}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{product.brand}</td>
                                    <td className="py-3 px-4 font-semibold text-red-600">{product.stock}</td>
                                    <td className="py-3 px-4 text-gray-900 dark:text-white">{product.threshold}</td>
                                    <td className="py-3 px-4">
                                        <Chip
                                            className={getStockStatusColor(product.status)}
                                            size="sm"
                                        >
                                            {getStockStatusText(product.status)}
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
