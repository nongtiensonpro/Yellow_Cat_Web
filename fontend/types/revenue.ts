export interface RevenueData {
  revenueDate: string; // LocalDate từ Java sẽ được serialize thành string
  totalRevenue: number; // BigDecimal từ Java sẽ được serialize thành number
  totalUnitsSold: number; // Long từ Java sẽ được serialize thành number
}

export interface ProductRevenueDetail {
  orderDate: string; // LocalDate từ Java
  productId: number; // Long từ Java
  productName: string;
  variantId: number; // Long từ Java
  categoryName: string;
  brandName: string;
  paymentMethod: string;
  orderStatus: string;
  shippingMethod: string;
  totalRevenue: number; // BigDecimal từ Java
  totalUnitsSold: number; // Long từ Java
  avgUnitPrice: number; // BigDecimal từ Java
  ordersCount: number; // Long từ Java
}

export interface RevenueApiParams {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
} 