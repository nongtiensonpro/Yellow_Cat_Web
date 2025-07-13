"use client"

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { RevenueData, ProductRevenueDetail, RevenueApiParams } from "@/types/revenue";
import { revenueService } from "@/services/revenueService";

export const useRevenue = () => {
  const { data: session } = useSession();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [productRevenueDetail, setProductRevenueDetail] = useState<ProductRevenueDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const fetchProductRevenueDetail = useCallback(async (params: RevenueApiParams) => {
    if (!session?.accessToken) {
      setError("Bạn cần đăng nhập để xem dữ liệu");
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const data = await revenueService.getProductRevenueDetail(params);
      setProductRevenueDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lấy dữ liệu chi tiết");
      setProductRevenueDetail([]);
    } finally {
      setDetailLoading(false);
    }
  }, [session?.accessToken]);

  const fetchAllData = useCallback(async (params: RevenueApiParams) => {
    if (!session?.accessToken) {
      setError("Bạn cần đăng nhập để xem dữ liệu");
      return;
    }

    setLoading(true);
    setDetailLoading(true);
    setError(null);

    try {
      const [basicData, detailData] = await Promise.all([
        revenueService.getRevenueData(params),
        revenueService.getProductRevenueDetail(params)
      ]);
      
      setRevenueData(basicData);
      setProductRevenueDetail(detailData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lấy dữ liệu");
      setRevenueData([]);
      setProductRevenueDetail([]);
    } finally {
      setLoading(false);
      setDetailLoading(false);
    }
  }, [session?.accessToken]);

  const clearData = useCallback(() => {
    setRevenueData([]);
    setProductRevenueDetail([]);
    setError(null);
  }, []);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalUnits = revenueData.reduce((sum, item) => sum + item.totalUnitsSold, 0);
  const averageRevenuePerDay = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  return {
    revenueData,
    productRevenueDetail,
    loading,
    detailLoading,
    error,
    totalRevenue,
    totalUnits,
    averageRevenuePerDay,
    fetchRevenueData,
    fetchProductRevenueDetail,
    fetchAllData,
    clearData,
    hasSession: !!session,
  };
}; 