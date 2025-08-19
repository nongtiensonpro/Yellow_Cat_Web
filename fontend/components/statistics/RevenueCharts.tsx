"use client";

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem } from "@heroui/react";
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface RevenueChartsProps {
  timeRange: string;
}

const RevenueCharts: React.FC<RevenueChartsProps> = ({ timeRange }) => {
  const [chartType, setChartType] = useState('daily');

  // Mock data - trong thực tế sẽ lấy từ API
  const generateDailyData = () => {
    const days = [];
    const revenue = [];
    const orders = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
      revenue.push(Math.floor(Math.random() * 5000000) + 2000000);
      orders.push(Math.floor(Math.random() * 50) + 20);
    }
    
    return { days, revenue, orders };
  };

  const generateWeeklyData = () => {
    const weeks = [];
    const revenue = [];
    
    for (let i = 12; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      weeks.push(`Tuần ${Math.ceil((date.getDate() + date.getDay()) / 7)}`);
      revenue.push(Math.floor(Math.random() * 30000000) + 15000000);
    }
    
    return { weeks, revenue };
  };

  const generateMonthlyData = () => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const revenue = months.map(() => Math.floor(Math.random() * 200000000) + 100000000);
    return { months, revenue };
  };

  const { days, revenue, orders } = generateDailyData();
  const { weeks, revenue: weeklyRevenue } = generateWeeklyData();
  const { months, revenue: monthlyRevenue } = generateMonthlyData();

  const lineChartData = {
    labels: chartType === 'daily' ? days : chartType === 'weekly' ? weeks : months,
    datasets: [
      {
        label: 'Doanh thu',
        data: chartType === 'daily' ? revenue : chartType === 'weekly' ? weeklyRevenue : monthlyRevenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      ...(chartType === 'daily' ? [{
        label: 'Số đơn hàng',
        data: orders,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      }] : []),
    ],
  };

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: chartType === 'daily' ? 'Ngày' : chartType === 'weekly' ? 'Tuần' : 'Tháng',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Doanh thu (VND)',
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: chartType === 'daily',
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Số đơn hàng',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Biểu đồ doanh thu theo ${chartType === 'daily' ? 'ngày' : chartType === 'weekly' ? 'tuần' : 'tháng'}`,
      },
    },
  };

  const categoryData = {
    labels: ['Giày thể thao', 'Giày công sở', 'Giày cao gót', 'Giày búp bê', 'Giày lười'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const brandData = {
    labels: ['Nike', 'Adidas', 'Puma', 'Converse', 'Vans', 'Khác'],
    datasets: [
      {
        label: 'Doanh thu',
        data: [45000000, 38000000, 25000000, 20000000, 18000000, 15000000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };

  const channelData = {
    labels: ['Website', 'Cửa hàng'],
    datasets: [
      {
        label: 'Doanh thu',
        data: [60000000, 45000000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  const comparisonData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Năm 2024',
        data: monthlyRevenue,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Năm 2023',
        data: monthlyRevenue.map(val => Math.round(val * 0.85)),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xu hướng doanh thu
          </h3>
          <div className="flex items-center space-x-4">
            <Select
              label="Loại biểu đồ"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-40"
            >
              <SelectItem key="daily" value="daily">Theo ngày</SelectItem>
              <SelectItem key="weekly" value="weekly">Theo tuần</SelectItem>
              <SelectItem key="monthly" value="monthly">Theo tháng</SelectItem>
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </CardBody>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Doanh thu theo danh mục
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Doughnut 
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${percentage}%`;
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
              Doanh thu theo thương hiệu
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Bar 
                data={brandData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value as number);
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return formatCurrency(context.parsed.y);
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

      {/* Channel and Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Doanh thu theo kênh bán hàng
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Bar 
                data={channelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value as number);
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return formatCurrency(context.parsed.y);
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
              So sánh doanh thu theo năm
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Line 
                data={comparisonData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value as number);
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tổng doanh thu {timeRange === 'today' ? 'hôm nay' : 
                             timeRange === 'week' ? 'tuần này' : 
                             timeRange === 'month' ? 'tháng này' : 
                             timeRange === 'quarter' ? 'quý này' : 'năm nay'}
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                chartType === 'daily' ? revenue.reduce((a, b) => a + b, 0) :
                chartType === 'weekly' ? weeklyRevenue.reduce((a, b) => a + b, 0) :
                monthlyRevenue.reduce((a, b) => a + b, 0)
              )}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tăng trưởng so với kỳ trước
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              +15.2%
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Doanh thu trung bình
            </h4>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                Math.round(
                  (chartType === 'daily' ? revenue.reduce((a, b) => a + b, 0) :
                   chartType === 'weekly' ? weeklyRevenue.reduce((a, b) => a + b, 0) :
                   monthlyRevenue.reduce((a, b) => a + b, 0)) / 
                  (chartType === 'daily' ? revenue.length :
                   chartType === 'weekly' ? weeklyRevenue.length :
                   monthlyRevenue.length)
                )
              )}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default RevenueCharts;
