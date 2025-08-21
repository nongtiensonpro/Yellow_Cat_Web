import {getSession} from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ================== TYPES ==================
export type ProfitSummaryResponse = {
    revenue: number;
    costOfGoods: number;
    netProfit?: number;
    profitMargin?: number;
    growthRate?: number;
    revenueGrowth?: number;
    profitGrowth?: number;
};

export type ProfitTrendResponse = {
    labels: string[];
    datasets: Record<string, number[]>; // revenue, netProfit
};

export type ProfitMarginsResponse = {
    labels: string[];
    datasets: Record<string, number[]>; //netMargin
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
export const profitService = {
    getSummary: async (range: string): Promise<ProfitSummaryResponse> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/profit/summary`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getTrends: async (
        range: string,
        period: string = "monthly"
    ): Promise<ProfitTrendResponse> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/profit/trends`);
        url.searchParams.append("range", mapRangeToBackend(range));
        url.searchParams.append("period", period);

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getMargins: async (
        range: string,
        period: string = "monthly"
    ): Promise<ProfitMarginsResponse> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/profit/margins`);
        url.searchParams.append("range", mapRangeToBackend(range));
        url.searchParams.append("period", period);

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },
};
