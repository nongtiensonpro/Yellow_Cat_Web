import { getSession } from "next-auth/react";
import { RevenueData, ProductRevenueDetail, RevenueApiParams } from "@/types/revenue";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const revenueService = {
  getRevenueData: async (params: RevenueApiParams): Promise<RevenueData[]> => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      const url = new URL(`${API_BASE_URL}/api/revenue`);
      url.searchParams.append("startDate", params.startDate);
      url.searchParams.append("endDate", params.endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Không có quyền truy cập. Cần quyền Admin_Web.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: RevenueData[] = await response.json();
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu doanh thu:", error);
      throw error;
    }
  },

  getProductRevenueDetail: async (params: RevenueApiParams): Promise<ProductRevenueDetail[]> => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      const url = new URL(`${API_BASE_URL}/api/product-revenue-detail`);
      url.searchParams.append("startDate", params.startDate);
      url.searchParams.append("endDate", params.endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Không có quyền truy cập. Cần quyền Admin_Web.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: ProductRevenueDetail[] = await response.json();
      return data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chi tiết doanh thu sản phẩm:", error);
      throw error;
    }
  },
}; 