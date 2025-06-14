export interface RevenueData {
  revenueDate: string; // LocalDate từ Java sẽ được serialize thành string
  totalRevenue: number; // BigDecimal từ Java sẽ được serialize thành number
  totalUnitsSold: number; // Long từ Java sẽ được serialize thành number
}

export interface RevenueApiParams {
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
} 