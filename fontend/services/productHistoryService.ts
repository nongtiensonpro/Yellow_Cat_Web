import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ProductHistoryDto {
  historyId: number;
  historyGroupId: string;
  productName: string;
  description: string;
  category: string;
  brand: string;
  material: string;
  targetAudience: string;
  thumbnail: string;
  changedAt: string;
  changedBy: string;
  operation: string;
}

export interface ProductVariantHistoryDTO {
  historyId: number;
  historyGroupId: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  salePrice: number;
  quantityInStock: number;
  imageUrl: string;
  weight: number;
  operation: string;
  changedAt: string;
  changedBy: string;
}

export interface ProductHistoryPage {
  content: ProductHistoryDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProductVariantHistoryPage {
  content: ProductVariantHistoryDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const productHistoryService = {
  // Lấy danh sách lịch sử sản phẩm
  getAllProductHistory: async (page: number = 0, size: number = 10): Promise<ProductHistoryPage> => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      const url = new URL(`${API_BASE_URL}/api/products/product-history`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", size.toString());

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
        if (response.status === 403) {
          throw new Error("Bạn không có quyền truy cập chức năng này.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu lịch sử sản phẩm:", error);
      throw error;
    }
  },

  // Lấy lịch sử variant theo historyGroupId
  getProductVariantHistory: async (
    historyGroupId: string, 
    page: number = 0, 
    size: number = 10
  ): Promise<ProductVariantHistoryPage> => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      const url = new URL(`${API_BASE_URL}/api/products/variant-history`);
      url.searchParams.append("historyGroupId", historyGroupId);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", size.toString());

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
        if (response.status === 403) {
          throw new Error("Bạn không có quyền truy cập chức năng này.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu lịch sử variant:", error);
      throw error;
    }
  },

  // Rollback sản phẩm về phiên bản cũ
  rollbackProduct: async (historyId: number): Promise<void> => {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      const response = await fetch(`${API_BASE_URL}/api/products/rollback/${historyId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Không có quyền truy cập. Cần quyền Admin_Web.");
        }
        if (response.status === 403) {
          throw new Error("Bạn không có quyền thực hiện rollback.");
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status >= 200 && data.status < 300) {
        return;
      } else {
        throw new Error(data.message || "Lỗi khi thực hiện rollback");
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện rollback sản phẩm:", error);
      throw error;
    }
  }
}
