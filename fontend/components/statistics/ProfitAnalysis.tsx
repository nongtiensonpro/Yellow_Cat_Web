"use client";

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Select, SelectItem, Progress } from "@heroui/react";
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
import { Line } from 'react-chartjs-2';

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

const ProfitAnalysis: React.FC<ProfitAnalysisProps> = () => {
  const [chartType, setChartType] = useState('monthly');

  // Mock data - trong thực tế sẽ lấy từ API
  const profitData = {
    revenue: 285000000,
    costOfGoods: 171000000,
    operatingExpenses: 57000000,
    grossProfit: 114000000,
    netProfit: 57000000,
    profitMargin: 20.0,
    grossMargin: 40.0
  };

  const profitTrendData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Doanh thu',
        data: [180000000, 195000000, 210000000, 225000000, 240000000, 255000000, 270000000, 285000000, 300000000, 315000000, 330000000, 345000000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Lợi nhuận gộp',
        data: [72000000, 78000000, 84000000, 90000000, 96000000, 102000000, 108000000, 114000000, 120000000, 126000000, 132000000, 138000000],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Lợi nhuận ròng',
        data: [36000000, 39000000, 42000000, 45000000, 48000000, 51000000, 54000000, 57000000, 60000000, 63000000, 66000000, 69000000],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const marginComparisonData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Tỷ suất lợi nhuận gộp (%)',
        data: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Tỷ suất lợi nhuận ròng (%)',
        data: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
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
      {/* Profit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tổng doanh thu
            </h4>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(profitData.revenue)}
            </p>
            <p className="text-sm text-blue-500 mt-2">+15.2% so với kỳ trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Lợi nhuận gộp
            </h4>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(profitData.grossProfit)}
            </p>
            <p className="text-sm text-green-500 mt-2">{profitData.grossMargin}% tỷ suất lợi nhuận</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Lợi nhuận ròng
            </h4>
            <p className="text-3xl font-bold text-emerald-600">
              {formatCurrency(profitData.netProfit)}
            </p>
            <p className="text-sm text-emerald-500 mt-2">{profitData.profitMargin}% tỷ suất lợi nhuận</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Giá vốn hàng bán
            </h4>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(profitData.costOfGoods)}
            </p>
            <p className="text-sm text-red-500 mt-2">60% tổng doanh thu</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Chi phí hoạt động
            </h4>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(profitData.operatingExpenses)}
            </p>
            <p className="text-sm text-orange-500 mt-2">20% tổng doanh thu</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tỷ lệ tăng trưởng
            </h4>
            <p className="text-3xl font-bold text-purple-600">
              +18.7%
            </p>
            <p className="text-sm text-purple-500 mt-2">So với kỳ trước</p>
          </CardBody>
        </Card>
      </div>

      {/* Profit Trends Chart */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xu hướng doanh thu và lợi nhuận
          </h3>
          <div className="flex items-center space-x-4">
            <Select
              label="Loại biểu đồ"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-40"
            >
              <SelectItem key="monthly" value="monthly">Theo tháng</SelectItem>
              <SelectItem key="quarterly" value="quarterly">Theo quý</SelectItem>
              <SelectItem key="yearly" value="yearly">Theo năm</SelectItem>
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="h-80">
            <Line 
              data={profitTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Số tiền (VND)',
                    },
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

      {/* Margin Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Phân tích tỷ suất lợi nhuận
          </h3>
        </CardHeader>
        <CardBody>
          <div className="h-64">
            <Line 
              data={marginComparisonData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 50,
                    title: {
                      display: true,
                      text: 'Tỷ suất (%)',
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
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Cost Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chi tiết chi phí
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Giá vốn hàng bán
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    60% ({formatCurrency(profitData.costOfGoods)})
                  </span>
                </div>
                <Progress 
                  value={60} 
                  color="danger" 
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chi phí vận chuyển
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    15% ({formatCurrency(profitData.revenue * 0.15)})
                  </span>
                </div>
                <Progress 
                  value={15} 
                  color="primary" 
                  className="w-full"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chỉ số tài chính
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tỷ suất lợi nhuận gộp</span>
                <span className="font-semibold text-green-600">{profitData.grossMargin}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tỷ suất lợi nhuận ròng</span>
                <span className="font-semibold text-blue-600">{profitData.profitMargin}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tỷ lệ tăng trưởng doanh thu</span>
                <span className="font-semibold text-emerald-600">+15.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tỷ lệ tăng trưởng lợi nhuận</span>
                <span className="font-semibold text-orange-600">+18.7%</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tổng chi phí
            </h4>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(profitData.costOfGoods + profitData.operatingExpenses)}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tỷ lệ chi phí/doanh thu
            </h4>
            <p className="text-2xl font-bold text-orange-600">
              {(((profitData.costOfGoods + profitData.operatingExpenses) / profitData.revenue) * 100).toFixed(1)}%
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Hiệu quả hoạt động
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {((profitData.netProfit / profitData.revenue) * 100).toFixed(1)}%
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ProfitAnalysis;
