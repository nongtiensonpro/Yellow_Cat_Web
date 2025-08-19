"use client";

import React, {useEffect, useMemo, useState} from "react";
import {Card, CardBody, CardHeader} from "@heroui/react";
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {
    overviewService,
    type OverviewWithChangeDTO,
} from "@/services/overviewService";

interface OverviewCardsProps {
    timeRange: string;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({timeRange}) => {
    const [data, setData] = useState<OverviewWithChangeDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await overviewService.getOverview(timeRange);
                if (isMounted) setData(response);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Đã xảy ra lỗi";
                if (isMounted) setError(message);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [timeRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("vi-VN").format(num);
    };

    const cards = useMemo(() => {
        const safe = data?.current ?? {
            revenue: 0,
            orders: 0,
            newCustomers: 0,
            completionRate: 0,
            netProfit: 0,
            cancelRate: 0,
            orderStats: {placed: 0, delivered: 0, cancelled: 0},
        };

        const change = data?.change ?? {
            revenueChange: 0,
            ordersChange: 0,
            newCustomersChange: 0,
            completionRateChange: 0,
            netProfitChange: 0,
            cancelRateChange: 0,
        };

        const formatChange = (value: number) => {
            const fixed = value.toFixed(1);
            return `${value >= 0 ? "+" : ""}${fixed}%`;
        };

        return [
            {
                title: "Doanh thu",
                value: formatCurrency(Number(safe.revenue || 0)),
                icon: CurrencyDollarIcon,
                color: "text-green-600",
                bgColor: "bg-green-50",
                change: formatChange(change.revenueChange),
                changeType: change.revenueChange >= 0 ? "positive" : "negative",
            },
            {
                title: "Đơn hàng",
                value: formatNumber(Number(safe.orders || 0)),
                icon: ShoppingBagIcon,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                change: formatChange(change.ordersChange),
                changeType: change.ordersChange >= 0 ? "positive" : "negative",
            },
            {
                title: "Khách hàng mới",
                value: formatNumber(Number(safe.newCustomers || 0)),
                icon: UsersIcon,
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                change: formatChange(change.newCustomersChange),
                changeType: change.newCustomersChange >= 0 ? "positive" : "negative",
            },
            {
                title: "Tỷ lệ hoàn thành",
                value: `${Number(safe.completionRate || 0).toFixed(1)}%`,
                icon: CheckCircleIcon,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50",
                change: formatChange(change.completionRateChange),
                changeType: change.completionRateChange >= 0 ? "positive" : "negative",
            },
            {
                title: "Lợi nhuận ròng",
                value: formatCurrency(Number(safe.netProfit || 0)),
                icon: ArrowTrendingUpIcon,
                color: "text-orange-600",
                bgColor: "bg-orange-50",
                change: formatChange(change.netProfitChange),
                changeType: change.netProfitChange >= 0 ? "positive" : "negative",
            },
            {
                title: "Tỷ lệ hủy",
                value: `${Number(safe.cancelRate || 0).toFixed(1)}%`,
                icon: XCircleIcon,
                color: "text-red-600",
                bgColor: "bg-red-50",
                change: formatChange(change.cancelRateChange),
                changeType: change.cancelRateChange <= 0 ? "positive" : "negative",
            },
        ];
    }, [data, timeRange]);

    return (
        <div className="space-y-6">
            {/* Loading / Error */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, idx) => (
                        <Card key={idx} className="animate-pulse">
                            <CardBody className="p-6 h-28"/>
                        </Card>
                    ))}
                </div>
            )}
            {error && (
                <Card>
                    <CardBody className="p-6 text-red-600">{error}</CardBody>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={index}
                            className="hover:shadow-lg transition-shadow duration-300"
                        >
                            <CardBody className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            {card.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                            {card.value}
                                        </p>
                                        <div className="flex items-center">
                      <span
                          className={`text-sm font-medium ${
                              card.changeType === "positive"
                                  ? "text-green-600"
                                  : "text-red-600"
                          }`}
                      >
                        {card.change}
                      </span>
                                            <span className="text-sm text-gray-500 ml-2">
                        so với{" "}
                                                {timeRange === "day"
                                                    ? "hôm qua"
                                                    : timeRange === "week"
                                                        ? "tuần trước"
                                                        : timeRange === "month"
                                                            ? "tháng trước"
                                                            : "năm trước"}
                      </span>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                                        <Icon className={`w-8 h-8 ${card.color}`}/>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Tổng quan đơn hàng
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Đã đặt</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(Number(data?.current?.orders || 0))}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Đã giao</span>
                                <span className="font-semibold text-green-600">
                  {formatNumber(
                      Number(data?.current?.orderStats?.delivered || 0)
                  )}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Bị hủy</span>
                                <span className="font-semibold text-red-600">
                  {formatNumber(
                      Number(data?.current?.orderStats?.cancelled || 0)
                  )}
                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Hiệu suất kinh doanh
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Tỷ suất lợi nhuận
                </span>
                                <span className="font-semibold text-green-600">
                  {Number(
                      data?.current?.revenue
                          ? (Number(data.current.netProfit || 0) /
                              Number(data.current.revenue || 1)) *
                          100
                          : 0
                  ).toFixed(1)}
                                    %
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Giá trị đơn hàng TB
                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(
                      Number(
                          data?.current?.orders
                              ? Math.round(
                                  Number(data.current.revenue || 0) /
                                  Number(data.current.orders || 1)
                              )
                              : 0
                      )
                  )}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Tăng trưởng lợi nhuận
                </span>
                                <span className="font-semibold text-blue-600">
                  {`${data?.change?.netProfitChange?.toFixed(1) ?? "0"}%`}
                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default OverviewCards;