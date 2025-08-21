import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// types/overview.ts
export type OverviewResponseDTO = {
    revenue: number;
    orders: number;
    newCustomers: number;
    completionRate: number;
    netProfit: number;
    cancelRate: number;
    orderStats: {
        placed: number;
        delivered: number;
        cancelled: number;
    };
};

export type OverviewWithChangeDTO = {
    current: OverviewResponseDTO;
    change: {
        revenueChange: number;
        ordersChange: number;
        newCustomersChange: number;
        completionRateChange: number;
        netProfitChange: number;
        cancelRateChange: number;
    };
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
            return "year";
    }
};

export const overviewService = {
    getOverview: async (range: string): Promise<OverviewResponseDTO> => {
        const session = await getSession();

        if (!session?.accessToken) {
            throw new Error("Không có token xác thực");
        }

        const backendRange = mapRangeToBackend(range);
        const url = new URL(`${API_BASE_URL}/api/statistic/overviews`);
        url.searchParams.append("range", backendRange);

        const response = await fetch(url.toString(), {
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

        const data: OverviewResponseDTO = await response.json();
        return data;
    },
};


