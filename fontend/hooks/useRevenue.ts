import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { RevenueData, RevenueApiParams } from "@/types/revenue";
import { revenueService } from "@/services/revenueService";

export const useRevenue = () => {
  const { data: session } = useSession();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(async (params: RevenueApiParams) => {
    if (!session?.accessToken) {
      setError("Bạn cần đăng nhập để xem dữ liệu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await revenueService.getRevenueData(params);
      setRevenueData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lấy dữ liệu");
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const clearData = useCallback(() => {
    setRevenueData([]);
    setError(null);
  }, []);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalUnits = revenueData.reduce((sum, item) => sum + item.totalUnitsSold, 0);
  const averageRevenuePerDay = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  return {
    revenueData,
    loading,
    error,
    totalRevenue,
    totalUnits,
    averageRevenuePerDay,
    fetchRevenueData,
    clearData,
    hasSession: !!session,
  };
}; 