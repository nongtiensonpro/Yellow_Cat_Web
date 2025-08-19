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
import {Line, Doughnut} from 'react-chartjs-2';

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

interface CustomerInsightsProps {
    timeRange: string;
}

const CustomerInsights: React.FC<CustomerInsightsProps> = ({timeRange}) => {
    // Mock data - trong thực tế sẽ lấy từ API
    const customerData = {
        total: 12560,
        new: 156,
        returning: 12404,
        active: 8920,
        inactive: 3640,
        vip: 1256,
        regular: 6280,
        occasional: 5024
    };

    const acquisitionData = {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [
            {
                label: 'Khách hàng mới',
                data: [120, 135, 142, 158, 165, 178, 185, 192, 198, 210, 225, 240],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ]
    };

    const customerSegmentationData = {
        labels: ['VIP', 'Thường xuyên', 'Thỉnh thoảng', 'Mới'],
        datasets: [
            {
                data: [customerData.vip, customerData.regular, customerData.occasional, customerData.new],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
                borderColor: [
                    'rgba(245, 158, 11, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const topCustomers = [
        {
            id: 1,
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@email.com',
            totalSpent: 12500000,
            orders: 45,
            lastOrder: '2024-01-15',
            status: 'VIP'
        },
        {
            id: 2,
            name: 'Trần Thị B',
            email: 'tranthib@email.com',
            totalSpent: 9800000,
            orders: 32,
            lastOrder: '2024-01-14',
            status: 'VIP'
        },
        {
            id: 3,
            name: 'Lê Văn C',
            email: 'levanc@email.com',
            totalSpent: 8750000,
            orders: 28,
            lastOrder: '2024-01-13',
            status: 'Regular'
        },
        {
            id: 4,
            name: 'Phạm Thị D',
            email: 'phamthid@email.com',
            totalSpent: 7200000,
            orders: 25,
            lastOrder: '2024-01-12',
            status: 'Regular'
        },
        {
            id: 5,
            name: 'Hoàng Văn E',
            email: 'hoangvane@email.com',
            totalSpent: 6500000,
            orders: 22,
            lastOrder: '2024-01-11',
            status: 'Occasional'
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

    const calculateRetentionRate = () => {
        return ((customerData.returning / customerData.total) * 100).toFixed(1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VIP':
                return 'bg-yellow-100 text-yellow-800';
            case 'Regular':
                return 'bg-blue-100 text-blue-800';
            case 'Occasional':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Customer Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Tổng khách hàng
                        </h4>
                        <p className="text-3xl font-bold text-blue-600">
                            {formatNumber(customerData.total)}
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
                            Khách hàng mới
                        </h4>
                        <p className="text-3xl font-bold text-green-600">
                            {formatNumber(customerData.new)}
                        </p>
                        <p className="text-sm text-green-500 mt-2">+15.3% so với kỳ trước</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="text-center p-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Khách hàng quay lại
                        </h4>
                        <p className="text-3xl font-bold text-emerald-600">
                            {formatNumber(customerData.returning)}
                        </p>
                        <p className="text-sm text-emerald-500 mt-2">{calculateRetentionRate()}% tỷ lệ giữ chân</p>
                    </CardBody>
                </Card>
            </div>

            {/* Customer Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Xu hướng khách hàng mới
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Line
                                data={acquisitionData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: {
                                                display: true,
                                                text: 'Số khách hàng mới',
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
                                                    return `Khách hàng mới: ${context.parsed.y}`;
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
                            Phân loại khách hàng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <Doughnut
                                data={customerSegmentationData}
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
            </div>

            {/* Top Customers Table */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top 5 Khách hàng VIP
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Khách
                                    hàng
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tổng
                                    chi tiêu
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Số đơn
                                    hàng
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Đơn
                                    hàng cuối
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Trạng
                                    thái
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {topCustomers.map((customer) => (
                                <tr key={customer.id}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar
                                                name={customer.name}
                                                size="sm"
                                                className="bg-blue-100 text-blue-600"
                                            />
                                            <span
                                                className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{customer.email}</td>
                                    <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</td>
                                    <td className="py-3 px-4 text-gray-900 dark:text-white">{customer.orders}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{customer.lastOrder}</td>
                                    <td className="py-3 px-4">
                                        <Chip
                                            className={getStatusColor(customer.status)}
                                            size="sm"
                                        >
                                            {customer.status}
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

export default CustomerInsights;
