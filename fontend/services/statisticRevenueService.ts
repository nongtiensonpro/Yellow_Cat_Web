import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// types/revenue.ts
export type RevenueTrendDTO = {
    labels: string[];
    revenue: number[];
    orders?: number[]; // chỉ có khi daily
};

export type RevenueByCategoryDTO = {
    categoryName: string[];
    totalRevenue: number[];
};

export type RevenueByBrandDTO = {
    brandName: string[];
    totalRevenue: number[];
};

export type RevenueSummaryDTO = {
    totalRevenue: number;
    growthRate: number;
    averageOrderValue: number;
};

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
            return "month";
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

export const revenueService = {
    getTrend: async (type: "daily" | "weekly" | "monthly", range: string): Promise<RevenueTrendDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/revenue/trend`);
        url.searchParams.append("type", type);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getByCategory: async (range: string): Promise<RevenueByCategoryDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/revenue/by-category`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getByBrand: async (range: string): Promise<RevenueByBrandDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/revenue/by-brand`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getSummary: async (range: string): Promise<RevenueSummaryDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/revenue/summary`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },
};


