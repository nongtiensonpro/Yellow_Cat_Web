"use client";

import React, {useState} from 'react';
import {Button, Select, SelectItem} from "@heroui/react";
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import OverviewCards from '@/components/statistics/OverviewCards';
import RevenueCharts from '@/components/statistics/RevenueCharts';
import OrderAnalytics from '@/components/statistics/OrderAnalytics';
import CustomerInsights from '@/components/statistics/CustomerInsights';
import ProductPerformance from '@/components/statistics/ProductPerformance';
import {ProfitAnalysis} from '@/components/statistics/ProfitAnalysis';

export default function StatisticsPage() {
    const [timeRange, setTimeRange] = useState('year');
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        {key: 'overview', label: 'Tổng quan', icon: ChartBarIcon},
        {key: 'customers', label: 'Khách hàng', icon: UsersIcon},
        {key: 'products', label: 'Sản phẩm', icon: ShoppingBagIcon},
        {key: 'orders', label: 'Đơn hàng', icon: ShoppingBagIcon},
        {key: 'revenue', label: 'Doanh thu', icon: ArrowTrendingUpIcon},
        {key: 'profit', label: 'Lợi nhuận', icon: CurrencyDollarIcon},
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Thống kê & Báo cáo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Theo dõi hiệu suất kinh doanh
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <Select
                        label="Thời gian"
                        selectedKeys={[timeRange]}
                        onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
                        className="w-40"
                    >
                        <SelectItem key="today">Hôm nay</SelectItem>
                        <SelectItem key="week">Tuần này</SelectItem>
                        <SelectItem key="month">Tháng này</SelectItem>
                        <SelectItem key="year">Năm nay</SelectItem>
                    </Select>

                    <Button color="primary" size="lg">
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1">
                <div className="flex space-x-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                                    activeTab === tab.key
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-5 h-5"/>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content based on active tab */}
            <div className="min-h-[600px]">
                {activeTab === 'overview' && <OverviewCards timeRange={timeRange}/>}
                {activeTab === 'customers' && <CustomerInsights timeRange={timeRange}/>}
                {activeTab === 'products' && <ProductPerformance timeRange={timeRange}/>}
                {activeTab === 'orders' && <OrderAnalytics timeRange={timeRange}/>}
                {activeTab === 'revenue' && <RevenueCharts timeRange={timeRange}/>}
                {activeTab === 'profit' && <ProfitAnalysis timeRange={timeRange}/>}
            </div>
        </div>
    );
}