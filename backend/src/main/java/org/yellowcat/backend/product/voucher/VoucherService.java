package org.yellowcat.backend.product.voucher;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.voucher.dto.VoucherRequest;
import org.yellowcat.backend.product.voucher.dto.VoucherResponse;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.util.UUID;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class VoucherService {

    final VoucherRepository voucherRepository;
    final AppUserRepository appUserRepository;

    private String normalize(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s{2,}", " ").toLowerCase();
    }

    @Transactional
    public void create(VoucherRequest dto, UUID userId) {
        String normalizedName = normalize(dto.getPromotionName());
        if (voucherRepository.existsByVoucherNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Tên voucher đã tồn tại");
        }
        if (voucherRepository.existsByVoucherCodeIgnoreCase(dto.getVoucherCode())) {
            throw new IllegalArgumentException("Mã voucher đã tồn tại");
        }

        AppUser user = appUserRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Voucher voucher = Voucher.builder()
                .voucherName(dto.getPromotionName())
                .voucherCode(dto.getVoucherCode())
                .description(dto.getDescription())
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .minimumOrderValue(dto.getMinimumOrderValue())
                .maximumDiscountValue(dto.getMaximumDiscountValue())
                .usageLimitPerUser(dto.getUsageLimitPerUser())
                .usageLimitTotal(dto.getUsageLimitTotal())
                .isStackable(Boolean.TRUE.equals(dto.getIsStackable()))
                .isActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive())
                .createdBy(user)
                .build();

        voucherRepository.save(voucher);
    }

    public VoucherResponse getById(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy voucher với ID: " + id));
        return convertToResponse(voucher);
    }

    private VoucherResponse convertToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .voucherId(voucher.getVoucherId())
                .voucherCode(voucher.getVoucherCode())
                .voucherName(voucher.getVoucherName())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .minimumOrderValue(voucher.getMinimumOrderValue())
                .maximumDiscountValue(voucher.getMaximumDiscountValue())
                .usageLimitPerUser(voucher.getUsageLimitPerUser())
                .usageLimitTotal(voucher.getUsageLimitTotal())
                .isStackable(voucher.getIsStackable())
                .isActive(voucher.getIsActive())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }

    @Transactional
    public void update(Integer id, VoucherRequest dto) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy voucher với ID: " + id));

        String normalizedName = normalize(dto.getPromotionName());
        if (voucherRepository.existsByVoucherNameIgnoreCaseAndVoucherIdNot(normalizedName, id)) {
            throw new IllegalArgumentException("Tên voucher đã tồn tại");
        }

        if (!voucher.getVoucherCode().equalsIgnoreCase(dto.getVoucherCode())) {
            if (voucherRepository.existsByVoucherCodeIgnoreCase(dto.getVoucherCode())) {
                throw new IllegalArgumentException("Mã voucher đã tồn tại");
            }
            voucher.setVoucherCode(dto.getVoucherCode());
        }

        voucher.setVoucherName(dto.getPromotionName());
        voucher.setDescription(dto.getDescription());
        voucher.setDiscountType(dto.getDiscountType());
        voucher.setDiscountValue(dto.getDiscountValue());
        voucher.setStartDate(dto.getStartDate());
        voucher.setEndDate(dto.getEndDate());
        voucher.setMinimumOrderValue(dto.getMinimumOrderValue());
        voucher.setMaximumDiscountValue(dto.getMaximumDiscountValue());
        voucher.setUsageLimitPerUser(dto.getUsageLimitPerUser());
        voucher.setUsageLimitTotal(dto.getUsageLimitTotal());
        voucher.setIsStackable(Boolean.TRUE.equals(dto.getIsStackable()));
        voucher.setIsActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());

        voucherRepository.save(voucher);
    }

    public org.springframework.data.domain.Page<VoucherResponse> findWithFilters(String keyword, String status, String discountType, java.math.BigDecimal discountValue, org.springframework.data.domain.Pageable pageable) {
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        org.springframework.data.domain.Page<Voucher> voucherPage;
        if (hasKeyword) {
            voucherPage = voucherRepository.findByVoucherNameContainingIgnoreCaseOrVoucherCodeContainingIgnoreCase(keyword, keyword, pageable);
        } else {
            voucherPage = voucherRepository.findAll(pageable);
        }
        return voucherPage.map(this::convertToResponse);
    }

    @Transactional
    public void delete(Integer id) {
        voucherRepository.deleteById(id);
    }
} 