import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Progress,
} from "@heroui/react";
import { Calendar } from "@heroui/react";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { useRevenue } from "@/hooks/useRevenue";

// Helper functions
const formatDateForApi = (date: CalendarDate): string =>
    `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const getRevenueStatus = (revenue: number) => {
  if (revenue === 0) return { color: "default" as const, text: "Không Có Doanh Thu" };
  if (revenue < 1_000_000) return { color: "warning" as const, text: "Doanh Thu Thấp" };
  if (revenue < 5_000_000) return { color: "primary" as const, text: "Doanh Thu Trung Bình" };
  return { color: "success" as const, text: "Doanh Thu Cao" };
};

export default function StatisticsByDay() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Timezone & dates
  const tz = getLocalTimeZone();
  const todayDate = useMemo(() => today(tz), [tz]);
  const firstOfMonth = useMemo(() => todayDate.set({ day: 1 }), [todayDate]);

  const [startDate, setStartDate] = useState<CalendarDate>(firstOfMonth);
  const [endDate, setEndDate] = useState<CalendarDate>(todayDate);

  const {
    revenueData,
    loading,
    error,
    totalRevenue,
    totalUnits,
    fetchRevenueData,
    hasSession,
  } = useRevenue();

  // Quick select: Today
  const pickToday = useCallback(() => {
    setStartDate(todayDate);
    setEndDate(todayDate);
  }, [todayDate]);

  // Quick select: This Week (Mon → Today)
  const pickCurrentWeek = useCallback(() => {
    const js = new Date(todayDate.year, todayDate.month - 1, todayDate.day);
    const day = js.getDay(); // 0-Sun,1-Mon...6-Sat
    const offset = (day + 6) % 7; // Mon=0 → offset 0
    const weekStart = todayDate.subtract({ days: offset });
    setStartDate(weekStart);
    setEndDate(todayDate);
  }, [todayDate]);

  // Quick select: This Month
  const pickCurrentMonth = useCallback(() => {
    setStartDate(firstOfMonth);
    setEndDate(todayDate);
  }, [firstOfMonth, todayDate]);

  // Quick select: This Year
  const pickCurrentYear = useCallback(() => {
    const yearStart = todayDate.set({ month: 1, day: 1 });
    setStartDate(yearStart);
    setEndDate(todayDate);
  }, [todayDate]);

  // Calculate total number of days in range
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = useMemo(() => {
    const s = new Date(`${startDate.year}-${String(startDate.month).padStart(2,'0')}-${String(startDate.day).padStart(2,'0')}`);
    const e = new Date(`${endDate.year}-${String(endDate.month).padStart(2,'0')}-${String(endDate.day).padStart(2,'0')}`);
    return Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1;
  }, [startDate, endDate]);

  // Average revenue per calendar day
  const averageRevenuePerDay = useMemo(() => {
    return totalDays > 0 ? totalRevenue / totalDays : 0;
  }, [totalRevenue, totalDays]);

  // Fetch data
  const handleFetch = useCallback(async () => {
    await fetchRevenueData({
      startDate: formatDateForApi(startDate),
      endDate: formatDateForApi(endDate),
    });
    onClose();
  }, [fetchRevenueData, onClose, startDate, endDate]);

  useEffect(() => {
    if (hasSession) handleFetch();
  }, [hasSession, handleFetch]);

  // Max revenue for progress bars
  const maxRevenue = useMemo(
      () => Math.max(...revenueData.map(d => d.totalRevenue), 1),
      [revenueData]
  );

  // Header info
  const headerPeriod = useMemo(() => ({
    startIso: formatDateForApi(startDate),
    endIso: formatDateForApi(endDate),
  }), [startDate, endDate]);

  return (
      <Card className="max-w-6xl">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <p className="text-xl font-bold text-primary">📊 Thống Kê Doanh Thu Theo Ngày</p>
            <p className="text-sm text-default-500">
              {headerPeriod.startIso} → {headerPeriod.endIso} ({totalDays} ngày)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onPress={pickToday} disabled={!hasSession} size="sm">📅 Hôm Nay</Button>
            <Button onPress={pickCurrentWeek} disabled={!hasSession} size="sm">📅 Tuần Này</Button>
            <Button onPress={pickCurrentMonth} disabled={!hasSession} size="sm" color="success">📅 Tháng Này</Button>
            <Button onPress={pickCurrentYear} disabled={!hasSession} size="sm" color="secondary">📅 Năm Nay</Button>
            <Button onPress={onOpen} disabled={!hasSession} size="sm" color="primary">
              {hasSession ? "⚙️ Tùy Chỉnh" : "🔒 Đăng Nhập"}
            </Button>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          {error && (
              <Card className="bg-danger-50 border-danger-200">
                <CardBody className="text-center text-danger font-semibold">❌ {error}</CardBody>
              </Card>
          )}

          {loading ? (
              <div className="text-center py-8">
                <Spinner size="lg" />
                <p className="mt-2 text-default-500">Đang tải dữ liệu...</p>
              </div>
          ) : revenueData.length > 0 ? (
              <>
                {/* Overview Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-success-50">
                    <CardBody className="text-center">
                      <p className="font-semibold text-success-700">💰 Tổng Doanh Thu</p>
                      <p className="text-2xl font-bold text-success-800">{formatCurrency(totalRevenue)}</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-primary-50">
                    <CardBody className="text-center">
                      <p className="font-semibold text-primary-700">📦 Tổng Sản Phẩm</p>
                      <p className="text-2xl font-bold text-primary-800">{totalUnits.toLocaleString('vi-VN')}</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-warning-50">
                    <CardBody className="text-center">
                      <p className="font-semibold text-warning-700">📊 TB/Ngày</p>
                      <p className="text-2xl font-bold text-warning-800">{formatCurrency(averageRevenuePerDay)}</p>
                      <p className="text-xs text-warning-600">trên {totalDays} ngày</p>
                    </CardBody>
                  </Card>
                </div>

                {/* Detail Table */}
                <Card>
                  <CardHeader>Chi Tiết Doanh Thu</CardHeader>
                  <CardBody>
                    <Table>
                      <TableHeader>
                        <TableColumn>Doanh Thu</TableColumn>
                        <TableColumn>Sản Phẩm</TableColumn>
                        <TableColumn>Tỉ Lệ</TableColumn>
                        <TableColumn>Trạng Thái</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {revenueData.map((item, idx) => {
                          const ratio = (item.totalRevenue / maxRevenue) * 100;
                          const status = getRevenueStatus(item.totalRevenue);
                          return (
                              <TableRow key={idx}>
                                <TableCell>
                                  {formatCurrency(item.totalRevenue)}
                                  <Progress value={ratio} size="sm" className="mt-1" />
                                </TableCell>
                                <TableCell>{item.totalUnitsSold.toLocaleString('vi-VN')}</TableCell>
                                <TableCell>{ratio.toFixed(1)}%</TableCell>
                                <TableCell>
                                  <Chip color={status.color} size="sm">{status.text}</Chip>
                                </TableCell>
                              </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardBody>
                </Card>
              </>
          ) : hasSession ? (
              <Card className="text-center py-8">
                <p>📈 Chưa có dữ liệu cho khoảng thời gian này</p>
                <Button onPress={handleFetch}>🔄 Tải lại</Button>
              </Card>
          ) : (
              <Card className="text-center py-8">
                <p>🔒 Cần đăng nhập để xem dữ liệu</p>
              </Card>
          )}
        </CardBody>

        {/* Modal for custom date */}
        <Modal isOpen={isOpen} onOpenChange={onOpen} size="3xl">
          <ModalContent>
            <ModalHeader>📅 Chọn Khoảng Thời Gian</ModalHeader>
            <ModalBody>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" onPress={pickToday}>Hôm Nay</Button>
                <Button size="sm" onPress={pickCurrentWeek}>Tuần Này</Button>
                <Button size="sm" color="success" onPress={pickCurrentMonth}>Tháng Này</Button>
                <Button size="sm" color="secondary" onPress={pickCurrentYear}>Năm Nay</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Ngày Bắt Đầu</p>
                  <Calendar value={startDate} onChange={setStartDate} maxValue={todayDate} />
                </div>
                <div>
                  <p className="font-medium">Ngày Kết Thúc</p>
                  <Calendar value={endDate} onChange={setEndDate} minValue={startDate} maxValue={todayDate} />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => onClose()}>Hủy</Button>
              <Button onPress={handleFetch} isLoading={loading}>Xem Thống Kê</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Card>
  );
}