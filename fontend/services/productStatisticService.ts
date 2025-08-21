import {getSession} from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ================== TYPES ==================
export type ProductSummaryDTO = {
    total: number;
    lowStock: number;
    outOfStock: number;
    bestSellers: number;
    returned: number;
};

export type LowStockDTO = {
    sku: string;
    name: string;
    category: string;
    brand: string;
    color: string;
    size: string;
    stock: number;
    threshold: number;
    status: string;
};

export type BestSellerDTO = {
    productId: number;
    name: string;
    category: string;
    brand: string;
    sales: number;
    revenue: number;
    stock: number;
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
export const productStatisticService = {
    getSummary: async (range: string): Promise<ProductSummaryDTO> => {
        const url = new URL(`${API_BASE_URL}/api/statistic/product/summary`);
        url.searchParams.append("range", mapRangeToBackend(range));

        const response = await fetchWithAuth(url.toString());
        return response.json();
    },

    getBestSellers: async (): Promise<BestSellerDTO[]> => {
        const url = `${API_BASE_URL}/api/statistic/product/best-sellers`;
        const response = await fetchWithAuth(url);
        return response.json();
    },

    getLowStock: async (): Promise<LowStockDTO[]> => {
        const url = `${API_BASE_URL}/api/statistic/product/low-stock`;
        const response = await fetchWithAuth(url);
        return response.json();
    },
};
