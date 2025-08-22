import {getSession} from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ================== TYPES ==================
export type OrderSummaryDTO = {
    totalOrder: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
    totalRevenue: number;
    avgOrderValue: number;
    processingRate: number;
    shippedRate: number;
    completionRate: number;
    cancellationRate: number;
    returnRate: number;
    totalOrderGrowth: number;
    avgOrderValueGrowth: number;
    completionRateGrowth: number;
    cancellationRateGrowth: number;
    returnRateGrowth: number;
};

export type MonthlyTrendDTO = {
    month: string;
    orders: number;
};
export type AovDTO = {
    month: string;
    averageOrderValue: number;
};
export type CancellationRateDTO = {
    month: string;
    cancellationRate: number;
};

// ================== HELPERS ==================
const mapRangeToBackend = (range: string): string => {
    switch (range) {
        case "today":
            return "day";
        case "week":
            return "week";
        case "month":
            return "month";
        case "year":
            return "year";
        default:
            return "year";
    }
};

const fetchWithAuth = async (url: string): Promise<Response> => {
    const session = await getSession();

    if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("Không có quyền truy cập. Cần quyền Admin_Web.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
};

// ================== SERVICE ==================
export const orderService = {
    getSummary: async (range: string): Promise<OrderSummaryDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/orders/summary`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },
    // Xu hướng đơn hàng theo tháng
    getMonthlyTrends: async (): Promise<MonthlyTrendDTO[]> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/orders/trends`);

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    // AOV theo tháng
    getAov: async (): Promise<AovDTO[]> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/orders/aov`);

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    // Tỷ lệ hủy theo tháng
    getCancellationRate: async (): Promise<CancellationRateDTO[]> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/orders/cancellation-rate`);

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },
};
