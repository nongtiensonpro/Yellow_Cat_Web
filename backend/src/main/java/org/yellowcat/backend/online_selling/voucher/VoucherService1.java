package org.yellowcat.backend.online_selling.voucher;

import jakarta.persistence.EntityNotFoundException;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.online_selling.voucher.dto.*;
import org.yellowcat.backend.online_selling.voucher.entity.*;
import org.yellowcat.backend.online_selling.voucher.repository.*;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.ProductRepository;
import org.yellowcat.backend.product.category.Category;
import org.yellowcat.backend.product.category.CategoryRepository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
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
    @Autowired private OderOnlineRepository orderRepository;
    @Autowired private ProductVariantRepository productVariantRepository;

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

        return savedVoucher;
    }


    private void validateVoucher(Voucher voucher, boolean isUpdate) {
        if (voucher.getName() == null || voucher.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt giảm giá không được để trống");
        }

        if (voucher.getName().length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đợt giảm giá không được vượt quá 50 ký tự");
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
        VoucherDetailDTO dto = mapToDetalDTO(voucher);

        // Tính toán các chỉ số hiệu suất
        dto.setRedemptionCount(voucher.getUsageCount());
        dto.setTotalDiscount(calculateTotalDiscount(voucher));
        dto.setTotalSales(calculateTotalSales(voucher));

        // Tính toán số voucher còn lại
        if (voucher.getMaxUsage() != null) {
            dto.setRemainingUsage(voucher.getMaxUsage() - voucher.getUsageCount());
        } else {
            dto.setRemainingUsage(null); // Không giới hạn
        }

        // Tính tỉ lệ sử dụng: (số lần dùng / maxUsage) * 100
        if (voucher.getMaxUsage() != null && voucher.getMaxUsage() > 0) {
            double rate = (double) voucher.getUsageCount() / voucher.getMaxUsage() * 100;
            dto.setRedemptionRate(Math.round(rate * 100.0) / 100.0); // Làm tròn 2 chữ số
        } else {
            dto.setRedemptionRate(null); // Không có maxUsage
        }

        return dto;
    }


    private BigDecimal calculateTotalDiscount(Voucher voucher) {
        return voucherRedemptionRepository.sumDiscountAmountByVoucherId(voucher.getId())
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal calculateTotalSales(Voucher voucher) {
        return voucherRedemptionRepository.sumOrderValuesByVoucherId(voucher.getId())
                .orElse(BigDecimal.ZERO);
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
        Order order = orderRepository.findById(redemption.getOrderId()).orElse(null);
        if (order != null) {
            dto.setOrderCode(order.getOrderCode());
            // Tính giá trị đơn hàng trước giảm giá
            BigDecimal orderValue = order.getFinalAmount().add(redemption.getDiscountAmount());
            dto.setOrderValue(orderValue);

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

        // Cập nhật thông tin
        existingVoucher.setName(voucherUpdate.getName());
        existingVoucher.setCode(voucherUpdate.getCode());
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
            System.out.println("✅ Đã qua kiểm tra điều kiện");

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
        if (userId == null) {
            // Không có user → bỏ qua kiểm tra điều kiện user
            return;
        }

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
        // Nếu userId là null (khách chưa đăng nhập), gán mặc định là 0
        int effectiveUserId = (userId == null) ? 0 : userId;

        VoucherUser userUsage = voucherUserRepository.findByVoucherIdAndUserId(voucher.getId(), effectiveUserId);
        if (userUsage == null) {
            userUsage = new VoucherUser(null, effectiveUserId, voucher, 1);
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