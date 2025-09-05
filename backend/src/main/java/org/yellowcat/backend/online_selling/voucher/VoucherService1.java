package org.yellowcat.backend.online_selling.voucher;

import jakarta.persistence.EntityNotFoundException;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.yellowcat.backend.online_selling.gmail_sending.EmailService;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.online_selling.voucher.dto.*;
import org.yellowcat.backend.online_selling.voucher.entity.*;
import org.yellowcat.backend.online_selling.voucher.repository.*;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.ProductRepository;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class VoucherService1 {
    // ===== HẰNG SỐ THÔNG BÁO LỖI =====
    private static final String ERR_VOUCHER_NOT_FOUND = "Không tìm thấy voucher";
    private static final String ERR_VOUCHER_INACTIVE = "Voucher đã ngưng hoạt động";
    private static final String ERR_VOUCHER_EXPIRED = "Voucher đã hết hạn. Thời gian kết thúc: ";
    private static final String ERR_VOUCHER_NOT_STARTED = "Voucher chưa có hiệu lực. Thời gian bắt đầu: ";
    private static final String ERR_MAX_USAGE_REACHED = "Voucher đã hết lượt sử dụng. Số lượt tối đa: ";
    private static final String ERR_MIN_ORDER_VALUE = "Giá trị đơn hàng không đủ để áp dụng voucher. Tối thiểu: ";
    private static final String ERR_USER_USAGE_LIMIT = "Bạn đã sử dụng voucher này rồi";
    private static final String ERR_INVALID_ORDER = "Thông tin đơn hàng không hợp lệ";
    private static final String ERR_INVALID_DISCOUNT_TYPE = "Loại giảm giá không hợp lệ";
    private static final String ERR_VOUCHER_ALREADY_USED = "Voucher đã được sử dụng bởi số điện thoại này";

    // ===== DEPENDENCY INJECTIONS =====
    @Autowired private VoucherRepository1 voucherRepository;
    @Autowired private VoucherScopeRepository scopeRepository;
    @Autowired private VoucherUserRepository voucherUserRepository;
    @Autowired private VoucherRedemptionRepository voucherRedemptionRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private AppUserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private OderOnlineRepository orderOnlineRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private EmailService emailService;

    // ===== CRUD OPERATIONS =====


    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh") // Chạy mỗi đầu giờ theo giờ VN
    public void deactivateExpiredVouchers() {
        List<Voucher> expiredVouchers = voucherRepository.findAllByEndDateBeforeAndIsActiveTrue(LocalDateTime.now());
        for (Voucher v : expiredVouchers) {
            v.setIsActive(false);
        }
        voucherRepository.saveAll(expiredVouchers);
    }


    /**
     * Tạo mới voucher với danh sách phạm vi áp dụng
     *
     * @param voucher Đối tượng voucher cần tạo
     * @param scopes Danh sách phạm vi áp dụng (sản phẩm/danh mục/người dùng)
     * @return Voucher đã được lưu thành công
     * @throws IllegalArgumentException nếu voucher là null
     */
    //done
    @Transactional
    public Voucher createVoucher(Voucher voucher, List<VoucherScope> scopes) {
        System.out.println("===> chạy vào hàm tạo voucher");

        if (voucher == null) {
            throw new IllegalArgumentException("Voucher không được null");
        }

        // ✅ Normalize code trước khi validate
        System.out.println("===> Code nhận được: '" + voucher.getCode() + "'");
        if (voucher.getCode() == null || voucher.getCode().trim().isEmpty()) {
            System.out.println("===> Code null hoặc rỗng, tạo mã random");
            String generatedCode = generateUniqueVoucherCode();
            System.out.println("===> Mã được tạo: " + generatedCode);
            voucher.setCode(generatedCode);
        } else {
            System.out.println("===> Code không null, normalize");
            voucher.setCode(normalizeCode(voucher.getCode()));
        }

        // ✅ Validate sau khi normalize
        validateVoucher(voucher, false);

        voucher.setIsActive(voucher.getIsActive() != null ? voucher.getIsActive() : true);
        voucher.setUsageCount(voucher.getUsageCount() != null ? voucher.getUsageCount() : 0);
        voucher.setCreatedAt(LocalDateTime.now());

        Voucher savedVoucher = voucherRepository.save(voucher);

        // Gán scope
        associateScopesWithVoucher(scopes, savedVoucher);

        // ✅ Gửi email thông báo - chỉ gọi service email
        try {
            emailService.sendVoucherNotification(savedVoucher, scopes);
        } catch (Exception e) {
            System.out.println("Lỗi khi gửi email thông báo voucher: " + e.getMessage());
        }

        return savedVoucher;
    }


    private void validateVoucher(Voucher voucher, boolean isUpdate) {
        if (voucher.getName() == null || voucher.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt giảm giá không được để trống");
        }

        if (voucher.getName().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt giảm giá không được vượt quá 100 ký tự");
        }

        boolean nameExists = isUpdate
                ? voucherRepository.existsByNameAndIdNot(voucher.getName(), voucher.getId())
                : voucherRepository.existsByName(voucher.getName());

        if (nameExists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt giảm giá đã tồn tại");
        }

        if (voucher.getCode() != null) {
            if (voucher.getCode().length() > 50) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã giảm giá không được vượt quá 50 ký tự");
            }

            boolean codeExists = isUpdate
                    ? voucherRepository.existsByCodeAndIdNot(voucher.getCode(), voucher.getId())
                    : voucherRepository.existsByCode(voucher.getCode());

            if (codeExists) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã tồn tại");
            }
        }

        // Với FREE_SHIPPING, discountValue có thể là null hoặc 0
        if (voucher.getDiscountType() != DiscountType.FREE_SHIPPING) {
            if (voucher.getDiscountValue() == null || voucher.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị giảm giá phải lớn hơn 0");
            }
        }

        if (voucher.getStartDate() != null && voucher.getEndDate() != null &&
                voucher.getEndDate().isBefore(voucher.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc không được trước ngày bắt đầu");
        }
    }


    /**
     * Lấy voucher theo ID
     *
     * @param id ID của voucher cần lấy
     * @return Đối tượng voucher tìm thấy
     * @throws RuntimeException nếu không tìm thấy voucher
     */
    @Transactional
    public VoucherDetailDTO getVoucherById(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
        return mapToDetalDTO(voucher); // Chỉ trả về thông tin cơ bản
    }

    @Transactional
    public VoucherPerformanceDTO getVoucherPerformanceStats(Integer id, int page, int pageSize) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        VoucherPerformanceDTO stats = new VoucherPerformanceDTO();
        stats.setRedemptionCount(voucher.getUsageCount());
        stats.setTotalDiscount(calculateTotalDiscount(voucher));
        stats.setTotalSales(calculateTotalSales(voucher));
        stats.setTotalProfit(calculateTotalProfit(voucher));

        if (voucher.getMaxUsage() != null) {
            stats.setRemainingUsage(voucher.getMaxUsage() - voucher.getUsageCount());
        }
        if (voucher.getMaxUsage() != null && voucher.getMaxUsage() > 0) {
            double rate = (double) voucher.getUsageCount() / voucher.getMaxUsage() * 100;
            stats.setRedemptionRate(Math.round(rate * 100.0) / 100.0);
        }

        // Build paged chart window
        ChartData chart = buildPagedChartData(voucher, page, pageSize);
        stats.setDailyUsageChart(chart);

        // NEW: Evaluate effectiveness based on real outcomes (Completed/Cancelled) and ROI
        /*
         * EFFECTIVENESS (đánh giá hiệu quả thực tế của voucher)
         * - completed: số lượt dùng dẫn tới đơn hàng trạng thái Completed
         * - cancelled: số lượt dùng nhưng đơn ở trạng thái Cancelled/Refunded
         * - completionRate = completed / (completed + cancelled)
         * - netROI = (totalProfit − totalDiscount) / totalDiscount
         *   (nếu totalDiscount = 0 và totalProfit > 0 thì xem là +∞; nếu = 0 thì 0)
         * - Phân loại trạng thái:
         *   HIỆU QUẢ CAO: completionRate ≥ 0.60 && netROI ≥ 1.0 && cancelRatio ≤ 0.10
         *   HIỆU QUẢ:      completionRate ≥ 0.40 && netROI ≥ 0.50 && cancelRatio ≤ 0.20
         *   TRUNG BÌNH:    completionRate ≥ 0.20 || netROI ≥ 0.20
         *   THẤP:          các trường hợp còn lại (hoặc không có đơn Completed)
         */
        int completed = 0;
        int cancelled = 0;
        List<VoucherRedemption> reds = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        for (VoucherRedemption r : reds) {
            Order o = orderOnlineRepository.findById(r.getOrderId()).orElse(null);
            if (o == null || o.getOrderStatus() == null) continue;
            String st = o.getOrderStatus();
            if ("Completed".equalsIgnoreCase(st)) completed++;
            else if ("Cancelled".equalsIgnoreCase(st) || "Refunded".equalsIgnoreCase(st)) cancelled++;
        }
        int totalConsidered = completed + cancelled;
        double completionRate = totalConsidered > 0 ? (double) completed / totalConsidered : 0.0;
        double cancelRatio = totalConsidered > 0 ? (double) cancelled / totalConsidered : 0.0;
        java.math.BigDecimal disc = stats.getTotalDiscount() == null ? java.math.BigDecimal.ZERO : stats.getTotalDiscount();
        java.math.BigDecimal profit = stats.getTotalProfit() == null ? java.math.BigDecimal.ZERO : stats.getTotalProfit();
        double netROI;
        if (disc.compareTo(java.math.BigDecimal.ZERO) > 0) {
            netROI = profit.subtract(disc).divide(disc, java.math.RoundingMode.HALF_UP).doubleValue();
        } else {
            netROI = profit.compareTo(java.math.BigDecimal.ZERO) > 0 ? Double.POSITIVE_INFINITY : 0.0;
        }
        // Debug logs for metrics
        System.out.println("=== Voucher Performance Metrics ===");
        System.out.printf("VoucherID: %d | Completed: %d | Cancelled/Refunded: %d | Considered: %d%n", voucher.getId(), completed, cancelled, totalConsidered);
        System.out.printf("CompletionRate: %.2f | CancelRatio: %.2f | TotalDiscount: %s | TotalProfit: %s | netROI: %s%n",
                completionRate, cancelRatio, disc.toPlainString(), profit.toPlainString(),
                (Double.isInfinite(netROI) ? "INF" : String.format("%.2f", netROI)));

        String eff = determineEffectivenessByOutcomes(completionRate, netROI, cancelRatio, completed);
        stats.setEffectivenessStatus(eff);
        System.out.println("EffectivenessStatus => " + eff);
        return stats;
    }

    private String determineEffectivenessByOutcomes(double completionRate, double netROI, double cancelRatio, int completed) {
        if (completed <= 0) {
            return "THẤP";
        }
        if (completionRate >= 0.60 && netROI >= 1.0 && cancelRatio <= 0.10) {
            return "HIỆU QUẢ CAO";
        }
        if (completionRate >= 0.40 && netROI >= 0.50 && cancelRatio <= 0.20) {
            return "HIỆU QUẢ";
        }
        if (completionRate >= 0.20 || netROI >= 0.20) {
            return "TRUNG BÌNH";
        }
        return "THẤP";
    }

    private ChartData buildPagedChartData(Voucher voucher, int page, int pageSize) {
        LocalDate start = voucher.getStartDate().toLocalDate();
        LocalDate end = voucher.getEndDate().toLocalDate();
        if (end.isBefore(start)) {
            end = start;
        }
        int totalDays = (int) (end.toEpochDay() - start.toEpochDay()) + 1; // inclusive
        int totalPages = (int) Math.ceil(totalDays / (double) pageSize);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages == 0 ? 1 : totalPages;

        // Page 1 = earliest window (starting at start), last page = newest window (ending at end)
        int windowStartIndex = Math.max(0, (page - 1) * pageSize);
        int windowEndIndex = Math.min(totalDays - 1, windowStartIndex + pageSize - 1);

        LocalDate windowStart = start.plusDays(windowStartIndex);
        LocalDate windowEnd = start.plusDays(windowEndIndex);

        // Preload raw usage+sales from repo
        List<Object[]> rawData = voucherRedemptionRepository.findDailyUsageWithSalesByVoucherId(voucher.getId());
        Map<LocalDate, Object[]> dataByDate = new HashMap<>();
        for (Object[] row : rawData) {
            if (row[0] != null) {
                LocalDate d = ((java.sql.Date) row[0]).toLocalDate();
                dataByDate.put(d, row);
            }
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");
        ChartData chart = new ChartData();
        chart.setLabels(new ArrayList<>());
        chart.setUsageCounts(new ArrayList<>());
        chart.setSalesData(new ArrayList<>());
        chart.setProfitData(new ArrayList<>());
        chart.setDisplayLabels(new ArrayList<>());

        for (LocalDate d = windowStart; !d.isAfter(windowEnd); d = d.plusDays(1)) {
            Object[] row = dataByDate.get(d);
            int usage = 0;
            BigDecimal sales = BigDecimal.ZERO;
            if (row != null) {
                usage = row[1] != null ? ((Number) row[1]).intValue() : 0;
                sales = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            }
            BigDecimal profit = calculateDailyProfit(voucher, d);

            chart.getLabels().add(d.toString());
            chart.getUsageCounts().add(usage);
            chart.getSalesData().add(sales);
            chart.getProfitData().add(profit);
            chart.getDisplayLabels().add(String.format("%s: %d lượt", d.format(formatter), usage));
        }

        chart.setRangeStart(windowStart.toString());
        chart.setRangeEnd(windowEnd.toString());
        chart.setPage(page);
        chart.setPageSize(pageSize);
        chart.setTotalPages(totalPages);
        chart.setTotalDays(totalDays);
        return chart;
    }

    private Map<String, DailyUsageStats> calculateDailyUsage(Voucher voucher) {
        List<Object[]> dailyUsageData = voucherRedemptionRepository.findDailyUsageWithSalesByVoucherId(voucher.getId());

        return dailyUsageData.stream()
                .filter(data -> data[0] != null) // Lọc bỏ bản ghi có ngày null
                .collect(Collectors.toMap(
                        data -> {
                            // Xử lý cả Date và LocalDate
                            if (data[0] instanceof java.sql.Date) {
                                return ((java.sql.Date) data[0]).toLocalDate().toString();
                            } else if (data[0] instanceof java.time.LocalDate) {
                                return ((java.time.LocalDate) data[0]).toString();
                            } else {
                                return LocalDate.now().toString(); // Fallback
                            }
                        },
                        data -> {
                            int usageCount = data[1] != null ? ((Number) data[1]).intValue() : 0;
                            BigDecimal sales = data[2] != null ? (BigDecimal) data[2] : BigDecimal.ZERO;
                            return new DailyUsageStats(usageCount, sales);
                        }
                ));
    }

    private String determineEffectiveness(Double redemptionRate) {
        if (redemptionRate == null) return "KHÔNG XÁC ĐỊNH";

        if (redemptionRate >= 70) {
            return "HIỆU QUẢ CAO";
        } else if (redemptionRate >= 40) {
            return "HIỆU QUẢ";
        } else if (redemptionRate >= 20) {
            return "TRUNG BÌNH";
        } else {
            return "THẤP";
        }
    }

    private VoucherPerformanceDTO calculatePerformanceStats(Voucher voucher) {
        VoucherPerformanceDTO stats = new VoucherPerformanceDTO();

        stats.setRedemptionCount(voucher.getUsageCount());
        stats.setTotalDiscount(calculateTotalDiscount(voucher));
        stats.setTotalSales(calculateTotalSales(voucher));

        if (voucher.getMaxUsage() != null) {
            stats.setRemainingUsage(voucher.getMaxUsage() - voucher.getUsageCount());
        }

        if (voucher.getMaxUsage() != null && voucher.getMaxUsage() > 0) {
            double rate = (double) voucher.getUsageCount() / voucher.getMaxUsage() * 100;
            stats.setRedemptionRate(Math.round(rate * 100.0) / 100.0);
        } else {
            stats.setRedemptionRate(null);
        }

        return stats;
    }


    private BigDecimal calculateTotalDiscount(Voucher voucher) {
        // Chỉ tính các đơn ở trạng thái Completed
        List<VoucherRedemption> reds = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        BigDecimal sum = BigDecimal.ZERO;
        for (VoucherRedemption r : reds) {
            Order o = orderOnlineRepository.findById(r.getOrderId()).orElse(null);
            if (o != null && "Completed".equalsIgnoreCase(o.getOrderStatus())) {
                sum = sum.add(r.getDiscountAmount() == null ? BigDecimal.ZERO : r.getDiscountAmount());
            }
        }
        return sum;
    }

    private BigDecimal calculateTotalSales(Voucher voucher) {
        // Chỉ tính các đơn ở trạng thái Completed
        List<VoucherRedemption> reds = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        BigDecimal sum = BigDecimal.ZERO;
        for (VoucherRedemption r : reds) {
            Order o = orderOnlineRepository.findById(r.getOrderId()).orElse(null);
            if (o != null && "Completed".equalsIgnoreCase(o.getOrderStatus())) {
                // Doanh thu trước giảm = final + discount
                BigDecimal finalAmt = o.getFinalAmount() == null ? BigDecimal.ZERO : o.getFinalAmount();
                BigDecimal disc = r.getDiscountAmount() == null ? BigDecimal.ZERO : r.getDiscountAmount();
                sum = sum.add(finalAmt.add(disc));
            }
        }
        return sum;
    }

    private BigDecimal calculateTotalProfit(Voucher voucher) {
        // Lấy danh sách đơn hàng đã sử dụng voucher này
        List<VoucherRedemption> redemptions = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        
        BigDecimal totalProfit = BigDecimal.ZERO;
        
        for (VoucherRedemption redemption : redemptions) {
            // Lấy đơn hàng
            Order order = orderOnlineRepository.findById(redemption.getOrderId()).orElse(null);
            if (order != null && "Completed".equalsIgnoreCase(order.getOrderStatus())) {
                // Tính lợi nhuận cho từng order item
                for (OrderItem item : order.getOrderItems()) {
                    // Giá bán = giá tại thời điểm mua
                    BigDecimal sellingPrice = item.getPriceAtPurchase();
                    // Giá nhập = giá nhập của product variant
                    BigDecimal costPrice = item.getVariant().getCostPrice();
                    
                    if (sellingPrice != null && costPrice != null) {
                        // Lợi nhuận = (giá bán - giá nhập) * số lượng
                        BigDecimal itemProfit = sellingPrice.subtract(costPrice).multiply(BigDecimal.valueOf(item.getQuantity()));
                        totalProfit = totalProfit.add(itemProfit);
                    }
                }
            }
        }
        
        return totalProfit;
    }

    private ChartData prepareChartData(Voucher voucher) {
        // Lấy dữ liệu thô từ database
        List<Object[]> rawData = voucherRedemptionRepository.findDailyUsageWithSalesByVoucherId(voucher.getId());

        // Tạo đối tượng ChartData
        ChartData chartData = new ChartData();
        chartData.setLabels(new ArrayList<>());
        chartData.setUsageCounts(new ArrayList<>());
        chartData.setSalesData(new ArrayList<>());
        chartData.setProfitData(new ArrayList<>());
        chartData.setDisplayLabels(new ArrayList<>());

        // Sắp xếp dữ liệu theo ngày tăng dần
        rawData.sort(Comparator.comparing(
                data -> ((java.sql.Date) data[0]).toLocalDate()
        ));

        // Định dạng ngày tháng
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM");

        for (Object[] data : rawData) {
            if (data[0] == null) continue; // Bỏ qua nếu không có ngày

            LocalDate date = ((java.sql.Date) data[0]).toLocalDate();
            int usageCount = data[1] != null ? ((Number) data[1]).intValue() : 0;
            BigDecimal sales = data[2] != null ? (BigDecimal) data[2] : BigDecimal.ZERO;

            // Lọc doanh thu theo đơn Completed
            sales = filterSalesByCompletedOnDate(voucher, date, sales);
            // Lợi nhuận chỉ tính đơn Completed trong ngày này
            BigDecimal dailyProfit = calculateDailyProfit(voucher, date);

            // Định dạng hiển thị
            String formattedDate = date.format(formatter);
            String displayLabel = String.format("%s: %d lượt", formattedDate, usageCount);

            // Thêm dữ liệu vào biểu đồ
            chartData.getLabels().add(date.toString());
            chartData.getUsageCounts().add(usageCount);
            chartData.getSalesData().add(sales);
            chartData.getProfitData().add(dailyProfit);
            chartData.getDisplayLabels().add(displayLabel);
        }

        return chartData;
    }

    private BigDecimal calculateDailyProfit(Voucher voucher, LocalDate date) {
        // Lấy danh sách đơn hàng đã sử dụng voucher này trong ngày cụ thể
        List<VoucherRedemption> redemptions = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        
        BigDecimal dailyProfit = BigDecimal.ZERO;
        
        for (VoucherRedemption redemption : redemptions) {
            // Lấy đơn hàng tương ứng
            Order order = orderOnlineRepository.findById(redemption.getOrderId()).orElse(null);
            if (order == null) {
                continue;
            }
            // Xác định ngày áp dụng: ưu tiên appliedAt, fallback orderDate
            LocalDate appliedDate = redemption.getAppliedAt() != null
                    ? redemption.getAppliedAt().toLocalDate()
                    : (order.getOrderDate() != null ? order.getOrderDate().toLocalDate() : null);
            if (appliedDate == null || !appliedDate.equals(date) || !"Completed".equalsIgnoreCase(order.getOrderStatus())) {
                continue;
            }
            // Tính lợi nhuận cho từng order item
            for (OrderItem item : order.getOrderItems()) {
                BigDecimal sellingPrice = item.getPriceAtPurchase();
                BigDecimal costPrice = item.getVariant().getCostPrice();
                
                if (sellingPrice != null && costPrice != null) {
                    BigDecimal itemProfit = sellingPrice.subtract(costPrice).multiply(BigDecimal.valueOf(item.getQuantity()));
                    dailyProfit = dailyProfit.add(itemProfit);
                }
            }
        }
        
        return dailyProfit;
    }

    private BigDecimal filterSalesByCompletedOnDate(Voucher voucher, LocalDate date, BigDecimal rawSales) {
        // Tính lại sales cho ngày này: chỉ cộng đơn Completed
        List<VoucherRedemption> redemptions = voucherRedemptionRepository.findAllByVoucher_Id(voucher.getId());
        BigDecimal sales = BigDecimal.ZERO;
        for (VoucherRedemption r : redemptions) {
            Order o = orderOnlineRepository.findById(r.getOrderId()).orElse(null);
            if (o == null) continue;
            LocalDate applied = r.getAppliedAt() != null ? r.getAppliedAt().toLocalDate() : (o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : null);
            if (applied == null) continue;
            if (applied.equals(date) && "Completed".equalsIgnoreCase(o.getOrderStatus())) {
                BigDecimal finalAmt = o.getFinalAmount() == null ? BigDecimal.ZERO : o.getFinalAmount();
                BigDecimal disc = r.getDiscountAmount() == null ? BigDecimal.ZERO : r.getDiscountAmount();
                sales = sales.add(finalAmt.add(disc));
            }
        }
        return sales;
    }

    public String getProductName(Integer id) {
        String productName = productRepository.findById(id).get().getProductName();
        return productName;
    }
    public String getUserName(Integer id) {
        String userName = userRepository.findById(id).get().getEmail();
        return userName;
    }
    public String getCategooryrName(Integer id) {
        String categoryName = categoryRepository.findById(id).get().getName();
        return categoryName;
    }


    public VoucherDetailDTO mapToDetalDTO(Voucher voucher) {
        VoucherDetailDTO dto = new VoucherDetailDTO();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        dto.setName(voucher.getName());
        dto.setDescription(voucher.getDescription());
        dto.setDiscountType(voucher.getDiscountType());
        dto.setDiscountValue(voucher.getDiscountValue());
        dto.setStartDate(voucher.getStartDate());
        dto.setEndDate(voucher.getEndDate());
        dto.setMaxUsage(voucher.getMaxUsage());
        dto.setUsageCount(voucher.getUsageCount());
        dto.setMinOrderValue(voucher.getMinOrderValue());
        dto.setMaxDiscountAmount(voucher.getMaxDiscountAmount());
        dto.setIsActive(voucher.getIsActive());
        dto.setCreatedAt(voucher.getCreatedAt());
        dto.setUpdatedAt(voucher.getUpdatedAt());

        // Group targetIds theo scopeType
        Map<ScopeType, List<Integer>> groupedScopes = voucher.getScopes()
                .stream()
                .collect(Collectors.groupingBy(
                        VoucherScope::getScopeType,
                        Collectors.mapping(VoucherScope::getTargetId, Collectors.toList())
                ));

        List<VoucherScopeDTO> scopeDTOs = new ArrayList<>();

        for (Map.Entry<ScopeType, List<Integer>> entry : groupedScopes.entrySet()) {
            ScopeType scopeType = entry.getKey();
            List<Integer> targetIds = entry.getValue();

            List<String> targetNames = targetIds.stream()
                    .map(id -> {
                        switch (scopeType) {
                            case SPECIFIC_PRODUCTS:
                                return getProductName(id);
                            case SPECIFIC_USERS:
                                return getUserName(id);
                            case PRODUCT_CATEGORY:
                                return getCategooryrName(id);
                            case ALL_PRODUCTS:
                                return "Tất cả sản phẩm";
                            default:
                                return "Không xác định";
                        }
                    })
                    .toList();
            VoucherScopeDTO scopeDTO = new VoucherScopeDTO();
            scopeDTO.setScopeType(scopeType);
            scopeDTO.setTargetNames(targetNames);

            scopeDTOs.add(scopeDTO);
        }

        dto.setScopes(scopeDTOs);
        return dto;
    }
    /**
     * Lấy danh sách người dùng đã sử dụng voucher
     */
    @Transactional
    public VoucherUsageDTO getVoucherUsageDetails(Integer voucherId) {
        // Lấy thông tin voucher để kiểm tra tồn tại
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        // Lấy danh sách lịch sử sử dụng voucher
        List<VoucherRedemption> redemptions = voucherRedemptionRepository.findAllByVoucher_Id((voucherId));

        // Tạo đối tượng kết quả
        VoucherUsageDTO usageDTO = new VoucherUsageDTO();
        usageDTO.setTotalRedemptions(redemptions.size());

        // Lấy danh sách chi tiết người dùng
        List<VoucherUserDetailDTO> userDetails = redemptions.stream()
                .map(this::mapToUserDetailDTO)
                .collect(Collectors.toList());

        usageDTO.setUserDetails(userDetails);

        // Tính số lượng người dùng duy nhất
        long uniqueUserCount = redemptions.stream()
                .map(VoucherRedemption::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        usageDTO.setTotalUsers((int) uniqueUserCount);

        return usageDTO;
    }

    private VoucherUserDetailDTO mapToUserDetailDTO(VoucherRedemption redemption) {
        VoucherUserDetailDTO dto = new VoucherUserDetailDTO();
        dto.setUserId(redemption.getUserId());
        dto.setUsedAt(redemption.getAppliedAt());
        dto.setDiscountAmount(redemption.getDiscountAmount());
        dto.setOrderId(redemption.getOrderId());

        // Lấy thông tin người dùng
        if (redemption.getUserId() != null) {
            AppUser user = userRepository.findById(redemption.getUserId()).orElse(null);
            if (user != null) {
                dto.setEmail(user.getEmail());
                dto.setPhone(user.getPhoneNumber());
                dto.setFullName(user.getFullName());
            }
        }

        // Lấy thông tin đơn hàng
        Order order = orderOnlineRepository.findById(redemption.getOrderId()).orElse(null);
        if (order != null) {
            dto.setOrderCode(order.getOrderCode());
            dto.setOrderStatus(order.getOrderStatus());
            // Tính giá trị đơn hàng trước giảm giá
            BigDecimal orderValue = order.getFinalAmount().add(redemption.getDiscountAmount());
            dto.setOrderValue(orderValue);

            // Tính lợi nhuận cho đơn hàng này (chỉ khi Completed)
            BigDecimal orderProfit = BigDecimal.ZERO;
            if ("Completed".equalsIgnoreCase(order.getOrderStatus())) {
                for (OrderItem item : order.getOrderItems()) {
                    BigDecimal sellingPrice = item.getPriceAtPurchase();
                    BigDecimal costPrice = item.getVariant().getCostPrice();
                    
                    if (sellingPrice != null && costPrice != null) {
                        BigDecimal itemProfit = sellingPrice.subtract(costPrice).multiply(BigDecimal.valueOf(item.getQuantity()));
                        orderProfit = orderProfit.add(itemProfit);
                    }
                }
            }
            dto.setProfitAmount(orderProfit);

            // Nếu không có thông tin user từ userRepository, lấy từ đơn hàng
            if (dto.getFullName() == null) {
                dto.setFullName(order.getCustomerName());
            }
            if (dto.getPhone() == null) {
                dto.setPhone(order.getPhoneNumber());
            }
        } else {
            // Xử lý trường hợp đơn hàng không tồn tại
            dto.setOrderValue(BigDecimal.ZERO);
            dto.setOrderCode("Đơn hàng đã bị xóa");
            dto.setProfitAmount(BigDecimal.ZERO);
            dto.setOrderStatus("UNKNOWN");
        }

        return dto;
    }




    /**
     * Lấy voucher theo mã code
     *
     * @param code Mã voucher (VD: VC123ABC)
     * @return Đối tượng voucher tương ứng
     * @throws RuntimeException nếu không tìm thấy
     */
    @Transactional
    public Voucher getVoucherByCode(String code) {
        return voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException(ERR_VOUCHER_NOT_FOUND));
    }

    /**
     * Cập nhật thông tin voucher
     * - Cập nhật thông tin cơ bản
     * - Xóa toàn bộ scope cũ và tạo lại scope mới
     *
     * @param voucherUpdate Đối tượng voucher chứa thông tin cập nhật
     * @throws EntityNotFoundException nếu không tìm thấy voucher
     */
    @Transactional
    public void updateVoucher(Voucher voucherUpdate) {
        Voucher existingVoucher = voucherRepository.findById(voucherUpdate.getId())
                .orElseThrow(() -> new EntityNotFoundException("Voucher not found with ID: " + voucherUpdate.getId()));
        System.out.println("====> lấy ra id voucher cần update : " + voucherUpdate.getId());

        // Kiểm tra trạng thái voucher để quyết định có cho phép sửa không
        LocalDateTime now = LocalDateTime.now();
        boolean isNotStarted = now.isBefore(existingVoucher.getStartDate());
        boolean isExpired = now.isAfter(existingVoucher.getEndDate());
        boolean isOutOfUsage = existingVoucher.getMaxUsage() != null && 
                              existingVoucher.getUsageCount() != null && 
                              existingVoucher.getUsageCount() >= existingVoucher.getMaxUsage();
        boolean isInactive = !existingVoucher.getIsActive();

        // Chỉ cho phép sửa voucher chưa bắt đầu hoặc hết lượt sử dụng
        if (!isNotStarted && !isOutOfUsage && !isInactive) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể cập nhật vì voucher đang hoạt động");
        }

        // Normalize code trước
        if (voucherUpdate.getCode() != null) {
            voucherUpdate.setCode(normalizeCode(voucherUpdate.getCode()));
        }

        // Validate sau khi normalize
        validateVoucher(voucherUpdate, true); // true vì đang update

        if (voucherUpdate.getCode() == null || voucherUpdate.getCode().trim().isEmpty()) {
            System.out.println("===> Code null hoặc rỗng, tạo mã random");
            String generatedCode = generateUniqueVoucherCode();
            System.out.println("===> Mã được tạo: " + generatedCode);
            existingVoucher.setCode(generatedCode);
        } else {
            System.out.println("===> Code không null, normalize");
            existingVoucher.setCode(normalizeCode(voucherUpdate.getCode()));
        }

        // Cập nhật thông tin
        existingVoucher.setName(voucherUpdate.getName());
//        existingVoucher.setCode(voucherUpdate.getCode());
        existingVoucher.setDescription(voucherUpdate.getDescription());
        existingVoucher.setDiscountType(voucherUpdate.getDiscountType());
        existingVoucher.setDiscountValue(voucherUpdate.getDiscountValue());
        existingVoucher.setStartDate(voucherUpdate.getStartDate());
        existingVoucher.setEndDate(voucherUpdate.getEndDate());
        existingVoucher.setMaxUsage(voucherUpdate.getMaxUsage());
        existingVoucher.setMinOrderValue(voucherUpdate.getMinOrderValue());
        existingVoucher.setMaxDiscountAmount(voucherUpdate.getMaxDiscountAmount());
        existingVoucher.setIsActive(voucherUpdate.getIsActive());
        existingVoucher.setUpdatedAt(LocalDateTime.now());

        // Cập nhật scope
        scopeRepository.deleteByVoucherId(existingVoucher.getId());
        if (voucherUpdate.getScopes() != null) {
            for (VoucherScope scope : voucherUpdate.getScopes()) {
                scope.setVoucher(existingVoucher);
                scopeRepository.save(scope);
            }
        }

        voucherRepository.save(existingVoucher);
    }

    @Transactional
    public void deactivateVoucher(Integer voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new EntityNotFoundException("Voucher không tìm thấy"));

        if (!voucher.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voucher đã bị vô hiệu trước đó");
        }

        voucher.setIsActive(false);
        voucher.setUpdatedAt(LocalDateTime.now());
        voucherRepository.save(voucher);
    }




    /**
     * Xóa mềm voucher (đánh dấu không hoạt động)
     * - Chỉ đánh dấu isActive=false chứ không xóa vật lý
     * - Không thể xóa nếu voucher đã được sử dụng
     *
     * @param id ID voucher cần xóa
     * @throws RuntimeException nếu voucher đã được sử dụng
     */
//    @Transactional
//    public void softDeleteVoucher(Integer id) {
//        Voucher voucher = getVoucherById(id);
//
//        if (voucher.getUsageCount() > 0) {
//            throw new RuntimeException(ERR_VOUCHER_ALREADY_USED);
//        }
//
//        voucher.setIsActive(false);
//        voucherRepository.save(voucher);
//    }

    // ===== VOUCHER APPLICATION LOGIC =====

    /**
     * Áp dụng voucher vào đơn hàng
     * - Validate điều kiện sử dụng
     * - Tính toán số tiền giảm giá
     * - Cập nhật lượt dùng và lưu lịch sử
     *
     * @param code Mã voucher
     * @param order Đơn hàng cần áp dụng
     * @param userId ID người dùng
     * @return Map chứa kết quả: discountAmount, finalAmount và thông báo
     */
    @Transactional
    public Map<String, Object> applyVoucher(String code, Order order, Integer userId) {
        try {
            System.out.println("🔍 Bắt đầu áp dụng voucher với mã: " + code);

            Voucher voucher = getVoucherByCode(code);
            System.out.println("✅ Đã lấy được voucher: " + voucher.getCode());

            System.out.println("🔍 Chạy hàm kiểm tra điều kiện sử dụng voucher");
            validateVoucherForOrder(voucher, userId, order);
            System.out.println("✅ Đã qua kiểm tr a điều kiện");

            System.out.println("🔍 Tính toán số tiền giảm giá");
            BigDecimal discountAmount = calculateDiscountAmount(
                    order.getSubTotalAmount(),
                    voucher,
                    order.getShippingFee()
            );
            System.out.println("✅ Số tiền giảm ban đầu: " + discountAmount);

            discountAmount = applyDiscountCap(discountAmount, voucher, order.getSubTotalAmount(), order.getShippingFee());
            System.out.println("✅ Số tiền giảm sau khi giới hạn: " + discountAmount);


                System.out.println("🔍 Cập nhật lượt sử dụng cho userId: " + userId);
                updateVoucherUsage(voucher, userId);
                System.out.println("✅ Đã cập nhật lượt sử dụng");

            System.out.println("🔍 Lưu lịch sử áp dụng voucher");
            saveRedemptionRecord(voucher, order, userId, discountAmount);
            System.out.println("✅ Đã lưu lịch sử áp dụng");

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Áp dụng mã giảm giá thành công");
            result.put("discountAmount", discountAmount);
            result.put("finalAmount", order.getFinalAmount());
            System.out.println("🎉 Áp dụng thành công. Giảm: " + discountAmount + ", Tổng cuối: " + order.getFinalAmount());
            return result;

        } catch (Exception e) {
            System.out.println("❌ Lỗi xảy ra khi áp dụng voucher: " + e.getMessage());
            e.printStackTrace(); // In stack trace ra console
            throw new RuntimeException("Áp dụng mã thất bại: " + e.getMessage(), e);
        }
    }



    /**
     * Tính toán số tiền duoc giam
     *
     * @param code Mã voucher
     * @param subtotal Tổng giá trị đơn hàng
     * @param shippingFee Phí vận chuyển
     * @return Tổng số tiền phải thanh toán sau giảm giá
     */
    public BigDecimal calculateDiscountedAmount(String code, BigDecimal subtotal, BigDecimal shippingFee) {
        System.out.println("=== calculateDiscountedAmount ===");
        System.out.println("Code: " + code);
        System.out.println("Subtotal: " + subtotal);
        System.out.println("ShippingFee: " + shippingFee);
        
        Voucher voucher = getVoucherByCode(code);
        System.out.println("Voucher found: " + voucher.getName());
        System.out.println("Discount type: " + voucher.getDiscountType());
        System.out.println("Discount value: " + voucher.getDiscountValue());
        System.out.println("Max discount amount: " + voucher.getMaxDiscountAmount());
        
        BigDecimal discountAmount = calculateDiscountAmount(subtotal, voucher, shippingFee);
        System.out.println("Initial discount amount: " + discountAmount);
        
        discountAmount = applyDiscountCap(discountAmount, voucher, subtotal, shippingFee);
        System.out.println("Final discount amount: " + discountAmount);
        System.out.println("=== End calculateDiscountedAmount ===");
        
        return discountAmount;
    }

    //  tinsh toongr soos tieenf sau khi ap dung ma
    public BigDecimal calculateAmountAfterDiscout(String code, BigDecimal subtotal, BigDecimal shippingFee) {
        System.out.println("=== calculateAmountAfterDiscout ===");
        System.out.println("Code: " + code);
        System.out.println("Subtotal: " + subtotal);
        System.out.println("ShippingFee: " + shippingFee);

        Voucher voucher = getVoucherByCode(code);
        BigDecimal discountAmount = calculateDiscountAmount(subtotal, voucher, shippingFee);
        discountAmount = applyDiscountCap(discountAmount, voucher, subtotal, shippingFee);

        System.out.println("Final discount amount: " + discountAmount);
        System.out.println("=== End calculateAmountAfterDiscout ===");

        return discountAmount; // Trả về số tiền được giảm, không phải số tiền còn lại
    }

    // ===== VOUCHER DISPLAY METHODS =====

    /**
     * Lấy danh sách voucher tóm tắt cho người dùng
     * - Chỉ trả về voucher đang hoạt động
     * - Kiểm tra điều kiện sử dụng cho user/đơn hàng cụ thể
     *
     * @param userId ID người dùng
     * @param productIds Danh sách ID sản phẩm trong giỏ hàng
     * @param orderTotal Tổng giá trị đơn hàng
     * @return Danh sách voucher dạng tóm tắt (VoucherSummaryDTO)
     */
    //done
    public List<VoucherSummaryDTO> getAvailableVoucherSummariesForUser(
            Integer userId, List<Integer> productIds, BigDecimal orderTotal) {

        System.out.println("=== getAvailableVoucherSummariesForUser ===");
        System.out.println("userId: " + userId);
        System.out.println("productIds: " + productIds);
        System.out.println("orderTotal: " + orderTotal);

        // kiểm tra người dùng
        if(userId == null) {
            throw new IllegalArgumentException("Cần đăng nhập để sử dung voucher");
        }

        try {
            List<Voucher> activeVouchers = voucherRepository.findAllByIsActive(true);
            System.out.println("Found " + activeVouchers.size() + " active vouchers");

            List<VoucherSummaryDTO> result = activeVouchers.stream()
                    .map(voucher -> {
                        try {
                            return buildVoucherSummary(voucher, userId, productIds, orderTotal);
                        } catch (Exception e) {
                            System.out.println("Error building voucher summary for voucher " + voucher.getId() + ": " + e.getMessage());
                            e.printStackTrace();
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            System.out.println("Returning " + result.size() + " voucher summaries");
            System.out.println("=== End getAvailableVoucherSummariesForUser ===");
            return result;
        } catch (Exception e) {
            System.out.println("Error in getAvailableVoucherSummariesForUser: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Lấy chi tiết voucher theo ID
     * - Trả về đầy đủ thông tin voucher + trạng thái với user
     *
     * @param voucherId ID voucher
     * @param userId ID người dùng
     * @param productIds Danh sách ID sản phẩm
     * @param orderTotal Tổng giá trị đơn hàng
     * @return Đối tượng chi tiết voucher (VoucherReponseDTO)
     */
    //done
    @Transactional
    public VoucherReponseDTO getVoucherDetailForUser(Integer voucherId, Integer userId,
                                              List<Integer> productIds, BigDecimal orderTotal) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        return buildVoucherResponse(voucher, userId, productIds, orderTotal);
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Xây dựng DTO tóm tắt cho danh sách voucher
     *
     * @param voucher Đối tượng voucher
     * @param userId ID người dùng
     * @param productIds Danh sách ID sản phẩm
     * @param orderTotal Tổng giá trị đơn hàng
     * @return DTO tóm tắt thông tin voucher
     */
    private VoucherSummaryDTO buildVoucherSummary(Voucher voucher, Integer userId,
                                                  List<Integer> productIds, BigDecimal orderTotal) {

        System.out.println("Building voucher summary for voucher ID: " + voucher.getId());

        try {
            VoucherSummaryDTO dto = new VoucherSummaryDTO();
            dto.setId(voucher.getId());
            dto.setCode(voucher.getCode());
            // Sử dụng name thực sự của voucher
            dto.setName(voucher.getName() != null ? voucher.getName() : voucher.getDescription());
            dto.setStartDate(voucher.getStartDate());
            dto.setEndDate(voucher.getEndDate());

            System.out.println("Checking if voucher is used by user...");
            boolean isUsed = isVoucherUsedByUser(voucher, userId);
            dto.setUsedStatus(isUsed ? "Đã sử dụng" : "Chưa sử dụng");
            System.out.println("Voucher used by user: " + isUsed);

            if (isUsed) {
                dto.setEligible(false);
                dto.setStatus("Đã sử dụng");

            } else {
                System.out.println("Checking voucher eligibility...");
                VoucherEligibilityResult result = checkVoucherEligibility(voucher, userId, productIds, orderTotal);
                dto.setEligible(result.isEligible());

                if (result.isEligible()) {
                    dto.setStatus("Áp dụng được");
                } else {
                    String reason = String.join("; ", result.getFailureReasons());
                    dto.setStatus("Không áp dụng: " + reason);
                }
                System.out.println("Voucher eligible: " + result.isEligible());
            }

            System.out.println("Built voucher summary successfully");
            return dto;
        } catch (Exception e) {
            System.out.println("Error building voucher summary: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Xây dựng DTO chi tiết cho voucher
     *
     * @param voucher Đối tượng voucher
     * @param userId ID người dùng
     * @param productIds Danh sách ID sản phẩm
     * @param orderTotal Tổng giá trị đơn hàng
     * @return DTO chi tiết thông tin voucher
     */
    private VoucherReponseDTO buildVoucherResponse(Voucher voucher, Integer userId,
                                                   List<Integer> productIds, BigDecimal orderTotal) {

        VoucherReponseDTO dto = new VoucherReponseDTO();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        dto.setName(voucher.getName());
        dto.setDescription(voucher.getDescription());
        dto.setDiscountType(voucher.getDiscountType());
        dto.setDiscountValue(voucher.getDiscountValue());
        dto.setStartDate(voucher.getStartDate());
        dto.setEndDate(voucher.getEndDate());
        dto.setMaxUsage(voucher.getMaxUsage());
        dto.setUsageCount(voucher.getUsageCount());
        dto.setMinOrderValue(voucher.getMinOrderValue());
        dto.setMaxDiscountAmount(voucher.getMaxDiscountAmount());
        dto.setIsActive(voucher.getIsActive());
        dto.setCreatedAt(voucher.getCreatedAt());

        // Kiểm tra null cho maxUsage và usageCount
        Integer maxUsage = voucher.getMaxUsage();
        Integer usageCount = voucher.getUsageCount();
        
        int remaining = 0;
        if (maxUsage != null && usageCount != null) {
            remaining = maxUsage - usageCount;
        }
        dto.setRemainingUsage(Math.max(remaining, 0));

        boolean isUsed = isVoucherUsedByUser(voucher, userId);
        dto.setIsUsed(isUsed);
        dto.setUsedStatus(isUsed ? "Đã sử dụng" : "Chưa sử dụng");

        VoucherEligibilityResult eligible = checkVoucherEligibility(voucher, userId, productIds, orderTotal);

        dto.setIsEligible(eligible.isEligible());

        if (eligible.isEligible()) {
            dto.setStatus(List.of(eligible.getMessage())); // List với 1 phần tử
        } else {
            dto.setStatus(eligible.getFailureReasons()); // Danh sách các lỗi
        }

        // ====== Xử lý phạm vi áp dụng voucher ======
        Map<ScopeType, List<VoucherScope>> groupedScopes = voucher.getScopes().stream()
                .collect(Collectors.groupingBy(VoucherScope::getScopeType));

        List<VoucherScopeDTO> scopeDTOs = new ArrayList<>();

        for (Map.Entry<ScopeType, List<VoucherScope>> entry : groupedScopes.entrySet()) {
            ScopeType scopeType = entry.getKey();
            List<VoucherScope> scopes = entry.getValue();

            List<String> targetNames = scopes.stream()
                    .map(scope -> {
                        Integer refId = scope.getTargetId();
                        switch (scopeType) {
                            case SPECIFIC_PRODUCTS:
                                return getProductName(refId);
                            case SPECIFIC_USERS:
                                return getUserName(refId);
                            case PRODUCT_CATEGORY:
                                return getCategooryrName(refId);
                            case ALL_PRODUCTS:
                                return "Tất cả sản phẩm";
                            default:
                                return "Không xác định";
                        }
                    })
                    .distinct()
                    .toList();

            VoucherScopeDTO scopeDTO = new VoucherScopeDTO();
            scopeDTO.setScopeType(scopeType);
            scopeDTO.setTargetNames(targetNames);
            scopeDTOs.add(scopeDTO);
        }

        dto.setScopes(scopeDTOs);

        return dto;
    }



    /**
     * Liên kết phạm vi áp dụng với voucher
     *
     * @param scopes Danh sách phạm vi
     * @param voucher Voucher cần liên kết
     */
    private void associateScopesWithVoucher(List<VoucherScope> scopes, Voucher voucher) {
        System.out.println("Chạy vào phần liên kết scopes");
        if (scopes == null || scopes.isEmpty()) {
            System.out.println("Không có scopes để gắn.");
            return;
        }

        for (VoucherScope scope : scopes) {
            scope.setVoucher(voucher);
            System.out.println("Scope: type = " + scope.getScopeType() + ", targetId = " + scope.getTargetId());
        }

        voucher.setScopes(scopes);
        scopeRepository.saveAll(scopes);
    }

    /**
     * Tạo mã voucher ngẫu nhiên không trùng
     *
     * @return Mã voucher (định dạng VC + 6 ký tự ngẫu nhiên)
     */
    private String generateUniqueVoucherCode() {
        String code;
        do {
            code = "VC" + RandomStringUtils.randomAlphanumeric(6).toUpperCase();
        } while (voucherRepository.existsByCode(code));
        return code;
    }

    /**
     * Kiểm tra điều kiện sử dụng voucher cho đơn hàng
     *
     * @param voucher Voucher cần kiểm tra
     * @param userId ID người dùng
     * @param order Đơn hàng
     * @throws RuntimeException nếu không thỏa điều kiện
     */
    private void validateVoucherForOrder(Voucher voucher, Integer userId, Order order) {
        validateBasicConditions(voucher);
        validateUserEligibility(voucher, userId);
        validateOrderRequirements(voucher, order);

    }

    private String normalizeCode(String input) {
        if (input == null) return null;

        // Bỏ dấu tiếng Việt
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noDiacritics = pattern.matcher(normalized).replaceAll("");

        // Thay khoảng trắng bằng dấu gạch dưới, chuyển in hoa
        return noDiacritics.trim().replaceAll("\\s+", "_").toUpperCase();
    }

    /**
     * Kiểm tra điều kiện cơ bản của voucher
     *
     * @param voucher Voucher cần kiểm tra
     * @throws RuntimeException nếu voucher không hoạt động, chưa đến hạn, hết hạn hoặc hết lượt dùng
     */
    private void validateBasicConditions(Voucher voucher) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException(ERR_VOUCHER_NOT_STARTED + voucher.getStartDate());
        }
        if (now.isAfter(voucher.getEndDate())) {
            if (voucher.getIsActive()) {
                voucher.setIsActive(false);
                voucherRepository.save(voucher);
            }
            throw new RuntimeException(ERR_VOUCHER_EXPIRED + voucher.getEndDate());
        }
        if (!voucher.getIsActive()) {
            throw new RuntimeException(ERR_VOUCHER_INACTIVE);
        }
        // Kiểm tra null cho maxUsage và usageCount
        Integer maxUsage = voucher.getMaxUsage();
        Integer usageCount = voucher.getUsageCount();
        
        if (maxUsage != null && usageCount != null && usageCount >= maxUsage) {
            throw new RuntimeException(ERR_MAX_USAGE_REACHED + maxUsage);
        }
    }

    /**
     * Kiểm tra điều kiện đơn hàng
     *
     * @param voucher Voucher cần kiểm tra
     * @param order Đơn hàng
     * @throws RuntimeException nếu đơn hàng không hợp lệ hoặc không đạt giá trị tối thiểu
     */
    private void validateOrderRequirements(Voucher voucher, Order order) {
        System.out.println("=== [validateOrderRequirements] Bắt đầu kiểm tra ===");

        // 1. Kiểm tra đơn hàng null hoặc subtotal null
        if (order == null || order.getSubTotalAmount() == null) {
            System.out.println("[LỖI] Đơn hàng null hoặc không có subtotal.");
            throw new RuntimeException(ERR_INVALID_ORDER);
        }

        System.out.println("Subtotal của đơn hàng: " + order.getSubTotalAmount());
        System.out.println("Giá trị tối thiểu để áp dụng voucher: " + voucher.getMinOrderValue());

        // 2. Kiểm tra subtotal có đủ điều kiện dùng voucher không
        if (order.getSubTotalAmount().compareTo(voucher.getMinOrderValue()) < 0) {
            System.out.println("[LỖI] Subtotal nhỏ hơn giá trị tối thiểu.");
            throw new RuntimeException(ERR_MIN_ORDER_VALUE + voucher.getMinOrderValue());
        }

        // 3. Kiểm tra xem người dùng đã từng sử dụng voucher chưa
        System.out.println("Đang kiểm tra xem voucher đã từng được dùng bởi số điện thoại: " + order.getPhoneNumber());
        VoucherRedemption voucherRedemption = voucherRedemptionRepository
                .findByVoucherIdAndPhoneNumber(voucher.getId(), order.getPhoneNumber());

        if (voucherRedemption != null) {
            System.out.println("[LỖI] Voucher đã được sử dụng bởi số điện thoại này.");
            throw new RuntimeException(ERR_VOUCHER_ALREADY_USED);
        }

        System.out.println("✅ Tất cả điều kiện hợp lệ, có thể sử dụng voucher.");
    }


    /**
     * Kiểm tra điều kiện người dùng
     *
     * @param voucher Voucher cần kiểm tra
     * @param userId ID người dùng
     * @throws RuntimeException nếu người dùng đã sử dụng voucher
     */
    private void validateUserEligibility(Voucher voucher, Integer userId) {
        System.out.println("=======> Chạy qua hàm check user với voucher");
//        if (userId == null) {
//            // Không có user → bỏ qua kiểm tra điều kiện user
//            return;
//        }
        AppUser currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        VoucherUser userVoucher = voucherUserRepository.findByVoucherIdAndUserId(
                voucher.getId(), currentUser.getAppUserId());

        if (userVoucher != null && userVoucher.getUsageCount() >= 1) {
            throw new RuntimeException(ERR_USER_USAGE_LIMIT);
        }
    }





    /**
     * Tính toán số tiền giảm giá
     *
     * @param orderTotal Tổng giá trị đơn hàng
     * @param voucher Voucher áp dụng
     * @param shippingFee Phí vận chuyển
     * @return Số tiền được giảm
     * @throws IllegalArgumentException nếu loại giảm giá không hợp lệ
     */
    private BigDecimal calculateDiscountAmount(BigDecimal orderTotal, Voucher voucher, BigDecimal shippingFee) {
        System.out.println("=== calculateDiscountAmount ===");
        System.out.println("Order total: " + orderTotal);
        System.out.println("Discount type: " + voucher.getDiscountType());
        System.out.println("Discount value: " + voucher.getDiscountValue());
        
        BigDecimal result;
        switch (voucher.getDiscountType()) {
            case PERCENT:
                BigDecimal percent = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                result = orderTotal.multiply(percent);
                System.out.println("Percent calculation: " + voucher.getDiscountValue() + "% of " + orderTotal + " = " + result);
                return result;
            case FIXED_AMOUNT:
                result = voucher.getDiscountValue();
                System.out.println("Fixed amount: " + result);
                return result;
            case FREE_SHIPPING:
                result = shippingFee;
                System.out.println("Free shipping: " + result);
                return result;
            default:
                throw new IllegalArgumentException(ERR_INVALID_DISCOUNT_TYPE);
        }
    }

    /**
     * Áp dụng giới hạn số tiền giảm giá tối đa
     *
     * @param discount Số tiền giảm giá tính toán
     * @param voucher Voucher áp dụng
     * @param orderTotal Tổng giá trị đơn hàng
     * @return Số tiền giảm giá sau khi áp giới hạn
     */
    private BigDecimal applyDiscountCap(BigDecimal discount, Voucher voucher, BigDecimal orderTotal, BigDecimal shippingFee) {
        System.out.println("=== applyDiscountCap ===");
        System.out.println("Initial discount: " + discount);
        System.out.println("Max discount amount: " + voucher.getMaxDiscountAmount());
        System.out.println("Order total: " + orderTotal);
        
        if (voucher.getDiscountType() == DiscountType.PERCENT && voucher.getMaxDiscountAmount() != null) {
            BigDecimal oldDiscount = discount;
            discount = discount.min(voucher.getMaxDiscountAmount());
            System.out.println("PERCENT cap applied: " + oldDiscount + " -> " + discount);
        }
        if (voucher.getDiscountType() == DiscountType.FREE_SHIPPING) {

            BigDecimal maxShippingDiscount = voucher.getMaxDiscountAmount() != null
                    ? voucher.getMaxDiscountAmount()
                    : shippingFee;

            discount = shippingFee.min(maxShippingDiscount);
            System.out.println("FREE_SHIPPING cap applied: " + discount);
        }
        
        BigDecimal finalDiscount = discount.min(orderTotal);
        System.out.println("Final cap (min with order total): " + discount + " -> " + finalDiscount);
        System.out.println("=== End applyDiscountCap ===");
        
        return finalDiscount;
    }

    /**
     * Cập nhật lượt sử dụng voucher
     *
     * @param voucher Voucher được sử dụng
     * @param userId ID người dùng
     */
    private void updateVoucherUsage(Voucher voucher, Integer userId) {
        incrementVoucherUsageCount(voucher);
        updateUserVoucherUsage(voucher, userId);
    }

    /**
     * Tăng số lượt sử dụng của voucher
     *
     * @param voucher Voucher được sử dụng
     */
    private void incrementVoucherUsageCount(Voucher voucher) {
        int newCount = voucher.getUsageCount() + 1;
        voucher.setUsageCount(newCount);
        // Tự động vô hiệu hóa nếu hết lượt sử dụng
        Integer maxUsage = voucher.getMaxUsage();
        if (maxUsage != null && newCount >= maxUsage) {
            voucher.setIsActive(false);
        }
        voucherRepository.save(voucher);
    }

    /**
     * Cập nhật lượt sử dụng của người dùng
     *
     * @param voucher Voucher được sử dụng
     * @param userId ID người dùng
     */
    private void updateUserVoucherUsage(Voucher voucher, Integer userId) {
        // Kiểm tra nếu userId là null -> không xử lý, thoát hàm
        if (userId == null) {
            return;
        }

        VoucherUser userUsage = voucherUserRepository.findByVoucherIdAndUserId(voucher.getId(), userId);
        if (userUsage == null) {
            userUsage = new VoucherUser(null, userId, voucher, 1);
        } else {
            userUsage.setUsageCount(userUsage.getUsageCount() + 1);
        }
        voucherUserRepository.save(userUsage);
    }

    /**
     * Lưu lịch sử sử dụng voucher
     *
     * @param voucher Voucher được sử dụng
     * @param order Đơn hàng
     * @param userId ID người dùng
     * @param discountAmount Số tiền giảm giá
     */
    private void saveRedemptionRecord(Voucher voucher, Order order, Integer userId, BigDecimal discountAmount) {
        VoucherRedemption redemption = new VoucherRedemption();
        redemption.setVoucher(voucher);
        redemption.setUserId(userId);
        redemption.setOrderId(order.getOrderId());
        redemption.setDiscountAmount(discountAmount);
        // Ghi nhận thời điểm áp dụng để đồng bộ biểu đồ và tính profit theo ngày
        redemption.setAppliedAt(LocalDateTime.now());
        voucherRedemptionRepository.save(redemption);
    }

    /**
     * Kiểm tra voucher có đủ điều kiện sử dụng
     *
     * @param voucher Voucher cần kiểm tra
     * @param userId ID người dùng
     * @param productIds Danh sách sản phẩm
     * @param orderTotal Tổng giá trị đơn hàng
     * @return true nếu đủ điều kiện, false nếu không
     */
    private VoucherEligibilityResult checkVoucherEligibility(Voucher voucher, Integer userId, List<Integer> productIds, BigDecimal orderTotal) {
        VoucherEligibilityResult result = new VoucherEligibilityResult();

        if (!isActiveAndInPeriod(voucher)) {
            result.addFailureReason("Voucher không hoạt động hoặc đã hết hạn.");
        }

        if (!hasRemainingUsage(voucher)) {
            result.addFailureReason("Voucher đã hết lượt sử dụng.");
        }

        if (!meetsOrderMinimum(voucher, orderTotal)) {
            result.addFailureReason("Đơn hàng chưa đạt giá trị tối thiểu.");
        }

        if (!isUserPermitted(voucher, userId)) {
            result.addFailureReason("Người dùng không nằm trong phạm vi áp dụng.");
        }

        if (!matchesProductScope(voucher, productIds)) {
            result.addFailureReason("Có sản phẩm không nằm trong phạm vi sản phẩm giảm giá.");
        }

        if (!matchesCategoryScope(voucher, productIds)) {
            result.addFailureReason("Có sản phẩm không nằm trong phạm vi danh mục giảm giá.");
        }


        // Nếu không có lỗi nào, đánh dấu hợp lệ với thông điệp thành công
        if (result.isEligible()) {
            result.markEligible();
        }

        return result;
    }



    /**
     * Kiểm tra voucher đang hoạt động và trong thời gian hiệu lực
     *
     * @param voucher Voucher cần kiểm tra
     * @return true nếu đang hoạt động và trong thời gian hiệu lực
     */
    private boolean isActiveAndInPeriod(Voucher voucher) {
        LocalDateTime now = LocalDateTime.now();

        System.out.println("Voucher code: " + voucher.getCode());
        System.out.println("Is active: " + voucher.getIsActive());
        System.out.println("Start date: " + voucher.getStartDate());
        System.out.println("End date: " + voucher.getEndDate());
        System.out.println("Now: " + now);

        boolean result = voucher.getIsActive()
                && now.isAfter(voucher.getStartDate())
                && now.isBefore(voucher.getEndDate());

        System.out.println("=======> Trạng thái active: " + result);
        return result;
    }

    /**
     * Kiểm tra voucher còn lượt sử dụng
     *
     * @param voucher Voucher cần kiểm tra
     * @return true nếu còn lượt sử dụng
     */
    private boolean hasRemainingUsage(Voucher voucher) {
        // Kiểm tra null cho maxUsage và usageCount
        Integer maxUsage = voucher.getMaxUsage();
        Integer usageCount = voucher.getUsageCount();
        
        // Nếu maxUsage là null, coi như không giới hạn
        if (maxUsage == null) {
            System.out.println("=====> MaxUsage null, không giới hạn lượt sử dụng");
            return true;
        }
        
        Boolean check = usageCount < maxUsage;
        System.out.println("=====> Số lượt còn lại: " + check);
        return check;
    }

    /**
     * Kiểm tra đơn hàng đạt giá trị tối thiểu
     *
     * @param voucher Voucher cần kiểm tra
     * @param orderTotal Tổng giá trị đơn hàng
     * @return true nếu đạt giá trị tối thiểu
     */
    private boolean meetsOrderMinimum(Voucher voucher, BigDecimal orderTotal) {
        Boolean check = orderTotal.compareTo(voucher.getMinOrderValue()) >= 0;
        System.out.println("Giá trị đơn hàng tối thiểu: " + check);
        return check;
    }

    /**
     * Kiểm tra người dùng có quyền sử dụng voucher
     *
     * @param voucher Voucher cần kiểm tra
     * @param userId ID người dùng
     * @return true nếu người dùng được phép sử dụng
     */
    private boolean isUserPermitted(Voucher voucher, Integer userId) {
        List<VoucherScope> userScopes = voucher.getScopes().stream()
                .filter(s -> s.getScopeType() == ScopeType.SPECIFIC_USERS)
                .collect(Collectors.toList());
        if (userScopes.isEmpty()) return true;
        Boolean check = userScopes.stream().anyMatch(s -> s.getTargetId().equals(userId));
        System.out.println("check tính ợp lệ của người dùng: " + check);
        return check;
    }

    /**
     * Kiểm tra voucher áp dụng cho sản phẩm trong giỏ hàng
     *
     * @param voucher Voucher cần kiểm tra
     * @param variantIds Danh sách ID sản phẩm
     * @return true nếu voucher áp dụng cho ít nhất 1 sản phẩm trong giỏ
     */
    private boolean matchesProductScope(Voucher voucher, List<Integer> variantIds) {
        System.out.println("===> Variant cần check: " + variantIds);

        // Lấy danh sách ID sản phẩm từ ID biến thể
        List<Integer> productIds = variantIds.stream()
                .map(id -> productVariantRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm ID = " + id)))
                .map(variant -> variant.getProduct().getProductId())
                .toList();

        // Lọc ra các scope áp dụng cho sản phẩm cụ thể
        List<Integer> scopedProductIds = voucher.getScopes().stream()
                .filter(s -> s.getScopeType() == ScopeType.SPECIFIC_PRODUCTS)
                .map(VoucherScope::getTargetId)
                .toList();

        // Nếu không có scope loại sản phẩm cụ thể thì coi như hợp lệ
        if (scopedProductIds.isEmpty()) return true;

        // Kiểm tra tất cả sản phẩm trong giỏ hàng phải nằm trong scopedProductIds
        boolean allMatch = productIds.stream().allMatch(scopedProductIds::contains);

        System.out.println("Tất cả sản phẩm đều nằm trong danh sách giảm giá? " + allMatch);
        return allMatch;
    }


    /**
     * Kiểm tra voucher áp dụng cho danh mục sản phẩm trong giỏ hàng
     *
     * @param voucher Voucher cần kiểm tra
     * @param variantIds Danh sách ID biến thể sản phẩm
     * @return true nếu voucher áp dụng cho ít nhất 1 danh mục trong giỏ
     */
    private boolean matchesCategoryScope(Voucher voucher, List<Integer> variantIds) {
        // Lấy danh sách ID danh mục được giảm giá theo scope
        Set<Integer> scopedCategoryIds = voucher.getScopes().stream()
                .filter(s -> s.getScopeType() == ScopeType.PRODUCT_CATEGORY)
                .map(VoucherScope::getTargetId)
                .collect(Collectors.toSet());

        // Nếu không có scope loại PRODUCT_CATEGORY thì luôn khớp (true)
        if (scopedCategoryIds.isEmpty()) {
            return true;
        }

        // Lấy danh sách categoryId của các sản phẩm trong giỏ từ danh sách variantId
        Set<Integer> cartCategoryIds = variantIds.stream()
                .map(id -> productVariantRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm ID = " + id)))
                .map(variant -> {
                    // Fetch product với category để tránh LazyInitializationException
                    Product product = productRepository.findById(variant.getProduct().getProductId())
                            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm ID = " + variant.getProduct().getProductId()));
                    Category category = product.getCategory();
                    if (category == null) {
                        throw new IllegalStateException("Sản phẩm không có danh mục.");
                    }
                    return category.getId();
                })
                .collect(Collectors.toSet());

        // Kiểm tra tất cả categoryId của giỏ hàng đều phải nằm trong scope
        boolean allValid = cartCategoryIds.stream().allMatch(scopedCategoryIds::contains);
        System.out.println("Check tất cả danh mục sản phẩm hợp lệ không: " + allValid);


        return allValid;
    }
//
//    /**
//     * Lấy danh sách ID danh mục từ danh sách sản phẩm
//     *
//     * @param productIds Danh sách ID sản phẩm
//     * @return Tập hợp ID danh mục
//     */
//    private Set<Integer> getCartCategoryIds(List<Integer> productIds) {
//        return productIds.stream()
//                .map(productRepository::findById)
//                .filter(Optional::isPresent)
//                .map(Optional::get) // chính là Product
//                .filter(Objects::nonNull)
//                .map(Product::getCategory)
//                .filter(Objects::nonNull)
//                .map(Category::getId)
//                .collect(Collectors.toSet());
//    }


    /**
     * Xác định thông báo trạng thái voucher
     *
     * @param voucher Voucher cần kiểm tra
     * @param isEligible Có đủ điều kiện sử dụng không
     * @return Chuỗi mô tả trạng thái
     */
    private String determineStatusMessage(Voucher voucher, boolean isEligible) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = voucher.getStartDate();
        LocalDateTime endDate = voucher.getEndDate();
        
        // Kiểm tra trạng thái active trước tiên - nếu bị vô hiệu hóa thì thành "Đã kết thúc"
        if (!voucher.getIsActive()) {
            return "Đã kết thúc";
        }
        
        // Kiểm tra thời gian hiệu lực
        if (now.isBefore(startDate)) {
            return "Chưa bắt đầu";
        }
        
        if (now.isAfter(endDate)) {
            return "Đã kết thúc";
        }
        
        // Kiểm tra lượt sử dụng
        Integer maxUsage = voucher.getMaxUsage();
        Integer usageCount = voucher.getUsageCount();
        
        if (maxUsage != null && usageCount != null && usageCount >= maxUsage) {
            return "Hết lượt sử dụng";
        }
        
        return "Đang diễn ra";
    }

    /**
     * Kiểm tra người dùng đã sử dụng voucher chưa
     *
     * @param voucher Voucher cần kiểm tra
     * @param userId ID người dùng
     * @return true nếu người dùng đã sử dụng voucher này
     */
    private boolean isVoucherUsedByUser(Voucher voucher, Integer userId) {
        try {
            VoucherUser userVoucher = voucherUserRepository.findByVoucherIdAndUserId(voucher.getId(), userId);
            return userVoucher != null && userVoucher.getUsageCount() > 0;
        } catch (Exception e) {
            System.out.println("Error checking voucher usage for user: " + e.getMessage());
            return false; // Default to not used if there's an error
        }
    }

    /**
     * Lấy tất cả voucher (cho quản trị viên)
     *
     * @return Danh sách tất cả voucher dạng tóm tắt
     */
    //done
    @Transactional
    public List<VoucherSummaryDTO> getAllVouchers() {
        List<Voucher> listvoucher = voucherRepository.findAll();

        return listvoucher.stream()
                .map(this::buildVoucherSummarySimple)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<VoucherSummaryAllDTO> getAllVouchersDiscountType( DiscountType discountType) {
        List<Voucher> listvoucher = voucherRepository.findAllByDiscountType(discountType);

        return listvoucher.stream()
                .map(this::buildVoucherSummaryAllDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<VoucherSummaryAllDTO> getAllVouchersScopeType( ScopeType scopeType) {
        List<Voucher> listvoucher = voucherRepository.findAllByScopes(scopeType);

        return listvoucher.stream()
                .map(this::buildVoucherSummaryAllDTO)
                .collect(Collectors.toList());
    }

    /**
     * Xây dựng DTO tóm tắt đơn giản (cho trang quản trị)
     *
     * @param voucher Đối tượng voucher
     * @return DTO tóm tắt thông tin
     */
    private VoucherSummaryDTO buildVoucherSummarySimple(Voucher voucher) {
        VoucherSummaryDTO dto = new VoucherSummaryDTO();

        System.out.println(">>> Bắt đầu chuyển đổi Voucher sang DTO");
        System.out.println("Voucher ID: " + voucher.getId());
        System.out.println("Code: " + voucher.getCode());
        System.out.println("Name: " + voucher.getName());
        System.out.println("Description: " + voucher.getDescription());
        System.out.println("Start Date: " + voucher.getStartDate());
        System.out.println("End Date: " + voucher.getEndDate());
        System.out.println("Is Active: " + voucher.getIsActive());

        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        // Sử dụng name thực sự của voucher
        dto.setName(voucher.getName() != null ? voucher.getName() : voucher.getDescription());
        dto.setStartDate(voucher.getStartDate());
        dto.setEndDate(voucher.getEndDate());

        boolean eligible = isActiveAndInPeriod(voucher);
        dto.setEligible(eligible);
        System.out.println("Eligible: " + eligible);

        List<VoucherScope> voucherScopes = voucher.getScopes();
        System.out.println("Tổng số scope: " + (voucherScopes == null ? 0 : voucherScopes.size()));

        if (voucherScopes == null || voucherScopes.isEmpty()) {
            dto.setUsedStatus("Không giới hạn");
            System.out.println("Scope rỗng -> UsedStatus: Tất cả sản phẩm");
        } else {
            for (VoucherScope scope : voucherScopes) {
                ScopeType type = scope.getScopeType();
                System.out.println("ScopeType: " + type);

                if (ScopeType.ALL_PRODUCTS.equals(type)) {
                    dto.setUsedStatus("Không giới hạn");
                    System.out.println("Scope là ALL_PRODUCTS -> UsedStatus: Dành cho taats cả sản phẩm");
                    break;
                } else if (ScopeType.SPECIFIC_USERS.equals(type)) {
                    dto.setUsedStatus("Voucher dành cho khách hàng đặc biệt");
                    System.out.println("Scope là SPECIFIC_USERS -> UsedStatus: Voucher dành cho khách hàng đặc biệt");
                    break;
                } else if (ScopeType.PRODUCT_CATEGORY.equals(type) || ScopeType.PRODUCT_CATEGORY.equals(type)) {
                    dto.setUsedStatus("Voucher dành cho sản phẩm hoặc nhóm sản phẩm riêng");
                    System.out.println("Scope là sản phẩm cụ thể hoặc nhóm sản phẩm -> UsedStatus: Voucher dành cho sản phẩm hoặc nhóm sản phẩm riêng");
                }
            }

            if (dto.getUsedStatus() == null) {
                dto.setUsedStatus("Không xác định");
                System.out.println("Không scope nào khớp -> UsedStatus: Không xác định");
            }
        }

        String statusMsg = determineStatusMessage(voucher, eligible);
        dto.setStatus(statusMsg);
        System.out.println("Trạng thái: " + statusMsg);

        System.out.println(">>> Kết thúc chuyển đổi Voucher ID " + voucher.getId());
        return dto;
    }

    /**
     * Lấy voucher theo trạng thái hoạt động
     *
     * @param isActive Trạng thái hoạt động (true: đang kích hoạt, false: đã hủy)
     * @return Danh sách voucher theo trạng thái
     */
    //done
    public List<VoucherSummaryAllDTO> getAllVouchersByStatus(boolean isActive) {
        List<Voucher> vouchers = voucherRepository.findAllByIsActive(isActive);

        return vouchers.stream()
                .map(this::buildVoucherSummaryAllDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy voucher theo trạng thái cụ thể
     *
     * @param status Trạng thái cụ thể ("Đang diễn ra", "Đã kết thúc", "Hết lượt sử dụng", "Chưa bắt đầu")
     * @return Danh sách voucher theo trạng thái
     */
    public List<VoucherSummaryAllDTO> getAllVouchersByStatusFilter(String status) {
        System.out.println("=== getAllVouchersByStatusFilter ===");
        System.out.println("Requested status: '" + status + "'");
        System.out.println("Status length: " + status.length());
        System.out.println("Status bytes: " + Arrays.toString(status.getBytes()));
        
        // Trim và normalize status để tránh lỗi khoảng trắng
        String normalizedStatus = status != null ? status.trim() : "";
        System.out.println("Normalized status: '" + normalizedStatus + "'");
        
        List<Voucher> allVouchers = voucherRepository.findAll();
        System.out.println("Total vouchers found: " + allVouchers.size());

        List<Voucher> filteredVouchers = allVouchers.stream()
                .filter(voucher -> {
                    String voucherStatus = determineStatusMessage(voucher, false);
                    String normalizedVoucherStatus = voucherStatus != null ? voucherStatus.trim() : "";
                    
                    System.out.println("Voucher " + voucher.getId() + " status: '" + voucherStatus + "'");
                    System.out.println("Normalized voucher status: '" + normalizedVoucherStatus + "'");
                    System.out.println("Comparing: '" + normalizedVoucherStatus + "' == '" + normalizedStatus + "'");
                    System.out.println("Equals result: " + normalizedVoucherStatus.equals(normalizedStatus));
                    
                    return normalizedVoucherStatus.equals(normalizedStatus);
                })
                .collect(Collectors.toList());

        System.out.println("Filtered vouchers count: " + filteredVouchers.size());
        System.out.println("=== End getAllVouchersByStatusFilter ===");

        return filteredVouchers.stream()
                .map(this::buildVoucherSummaryAllDTO)
                .collect(Collectors.toList());
    }


    /**
     * Lấy voucher trong khoảng thời gian
     *
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @return Danh sách voucher có thời gian hoạt động giao với khoảng thời gian được chọn
     */
    public List<VoucherSummaryAllDTO> getAllVouchersByPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        System.out.println("=== getAllVouchersByPeriod ===");
        System.out.println("Filter period: " + startDate + " to " + endDate);
        
        List<Voucher> allVouchers = voucherRepository.findAll();
        System.out.println("Total vouchers found: " + allVouchers.size());

        List<Voucher> filteredVouchers = allVouchers.stream()
                .filter(voucher -> {
                    LocalDateTime voucherStart = voucher.getStartDate();
                    LocalDateTime voucherEnd = voucher.getEndDate();
                    
                    // Kiểm tra xem voucher có thời gian hoạt động nằm hoàn toàn trong khoảng thời gian được chọn không
                    // Voucher nằm hoàn toàn trong khoảng thời gian khi:
                    // - voucherStart >= startDate AND voucherEnd <= endDate
                    boolean withinRange = !voucherStart.isBefore(startDate) && !voucherEnd.isAfter(endDate);
                    
                    System.out.println("Voucher " + voucher.getId() + ": " + voucherStart + " to " + voucherEnd + " - withinRange: " + withinRange);
                    System.out.println("  - voucherStart.isBefore(startDate): " + voucherStart.isBefore(startDate));
                    System.out.println("  - voucherEnd.isAfter(endDate): " + voucherEnd.isAfter(endDate));
                    System.out.println("  - !voucherStart.isBefore(startDate): " + !voucherStart.isBefore(startDate));
                    System.out.println("  - !voucherEnd.isAfter(endDate): " + !voucherEnd.isAfter(endDate));
                    
                    return withinRange;
                })
                .collect(Collectors.toList());

        System.out.println("Filtered vouchers count: " + filteredVouchers.size());
        System.out.println("=== End getAllVouchersByPeriod ===");

        return filteredVouchers.stream()
                .map(this::buildVoucherSummaryAllDTO)
                .collect(Collectors.toList());
    }

    private VoucherSummaryAllDTO buildVoucherSummaryAllDTO(Voucher voucher) {
        System.out.println("Building DTO for voucher ID: " + voucher.getId());
        
        VoucherSummaryAllDTO dto = new VoucherSummaryAllDTO();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        // Sử dụng name thực sự của voucher
        String voucherName = voucher.getName() != null ? voucher.getName() : voucher.getDescription();
        System.out.println("Voucher " + voucher.getId() + " - Name: '" + voucher.getName() + "', Description: '" + voucher.getDescription() + "', Final Name: '" + voucherName + "'");
        dto.setName(voucherName);
        dto.setStartDate(voucher.getStartDate());
        dto.setEndDate(voucher.getEndDate());
        dto.setDiscountValue(voucher.getDiscountValue());
        dto.setIsActive(voucher.getIsActive());
        
        // Thêm status vào DTO để frontend có thể hiển thị
        String status = determineStatusMessage(voucher, false);
        dto.setStatus(status);
        
        System.out.println("Built DTO: " + dto);
        
        return dto;
    }
}