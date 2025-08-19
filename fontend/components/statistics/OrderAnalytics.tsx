"use client";

import React from 'react';
import { Card, CardBody, CardHeader, Progress } from "@heroui/react";
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
import { Line, Doughnut } from 'react-chartjs-2';

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

const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({ timeRange }) => {
  // Mock data - trong thực tế sẽ lấy từ API
  const orderData = {
    total: 1240,
    processing: 89,
    shipped: 45,
    delivered: 1056,
    cancelled: 38,
    returned: 12
  };

  const orderTrendData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Đơn hàng',
        data: [120, 135, 142, 158, 165, 178, 185, 192, 198, 210, 225, 240],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const orderStatusData = {
    labels: ['Đang xử lý', 'Đã giao', 'Đã giao hàng', 'Bị hủy', 'Trả hàng'],
    datasets: [
      {
        data: [orderData.processing, orderData.shipped, orderData.delivered, orderData.cancelled, orderData.returned],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const aovData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Giá trị đơn hàng TB (VND)',
        data: [850000, 920000, 880000, 950000, 1020000, 980000, 1050000, 1120000, 1080000, 1150000, 1180000, 1200000],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const cancellationData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Tỷ lệ hủy (%)',
        data: [8.5, 7.2, 6.8, 7.5, 6.2, 5.8, 5.5, 5.2, 4.8, 4.5, 4.2, 3.8],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const calculateAOV = () => {
    const totalRevenue = 285000000; // Mock data
    return totalRevenue / orderData.total;
  };

  const calculateCompletionRate = () => {
    return ((orderData.delivered + orderData.shipped) / orderData.total * 100).toFixed(1);
  };

  const calculateCancellationRate = () => {
    return (orderData.cancelled / orderData.total * 100).toFixed(1);
  };

  const calculateReturnRate = () => {
    return (orderData.returned / orderData.total * 100).toFixed(1);
  };

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
              {formatNumber(orderData.total)}
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
              Giá trị đơn hàng TB
            </h4>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(calculateAOV())}
            </p>
            <p className="text-sm text-green-500 mt-2">+12.5% so với kỳ trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tỷ lệ hoàn thành
            </h4>
            <p className="text-3xl font-bold text-emerald-600">
              {calculateCompletionRate()}%
            </p>
            <p className="text-sm text-emerald-500 mt-2">+2.1% so với kỳ trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tỷ lệ hủy
            </h4>
            <p className="text-3xl font-bold text-red-600">
              {calculateCancellationRate()}%
            </p>
            <p className="text-sm text-red-500 mt-2">-1.2% so với kỳ trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tỷ lệ trả hàng
            </h4>
            <p className="text-3xl font-bold text-purple-600">
              {calculateReturnRate()}%
            </p>
            <p className="text-sm text-purple-500 mt-2">-0.5% so với kỳ trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Đơn hàng đang xử lý
            </h4>
            <p className="text-3xl font-bold text-orange-600">
              {formatNumber(orderData.processing)}
            </p>
            <p className="text-sm text-orange-500 mt-2">Cần xử lý gấp</p>
          </CardBody>
        </Card>
      </div>

      {/* Order Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Phân bố trạng thái đơn hàng
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Doughnut 
                data={orderStatusData}
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
                    {orderData.processing} ({((orderData.processing / orderData.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(orderData.processing / orderData.total) * 100} 
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
                    {orderData.shipped} ({((orderData.shipped / orderData.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(orderData.shipped / orderData.total) * 100} 
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
                    {orderData.delivered} ({((orderData.delivered / orderData.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(orderData.delivered / orderData.total) * 100} 
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
                    {orderData.cancelled} ({((orderData.cancelled / orderData.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(orderData.cancelled / orderData.total) * 100} 
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
                    {orderData.returned} ({((orderData.returned / orderData.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={(orderData.returned / orderData.total) * 100} 
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
              <Line 
                data={orderTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Số đơn hàng',
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
                          return `Đơn hàng: ${context.parsed.y}`;
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
              Giá trị đơn hàng TB theo tháng
            </h3>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <Line 
                data={aovData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Giá trị (VND)',
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
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Giá trị TB: ${formatCurrency(context.parsed.y)}`;
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

      {/* Cancellation Trend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xu hướng tỷ lệ hủy đơn hàng
          </h3>
        </CardHeader>
        <CardBody>
          <div className="h-64">
            <Line 
              data={cancellationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Tỷ lệ hủy (%)',
                    },
                    max: 10,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Tỷ lệ hủy: ${context.parsed.y}%`;
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
  );
};

export default OrderAnalytics;
