//package org.yellowcat.backend.product.promotion;
//
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.jpa.domain.Specification;
//import org.springframework.stereotype.Service;
//import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
//import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
//import org.yellowcat.backend.product.promotion.mapper.PromotionMapper;
//import org.yellowcat.backend.user.AppUser;
//import org.yellowcat.backend.user.AppUserRepository;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.Random;
//import java.util.UUID;
//import java.util.function.Predicate;
//import jakarta.persistence.criteria.CriteriaBuilder;
//import jakarta.persistence.criteria.CriteriaQuery;
//import jakarta.persistence.criteria.Root;
//
//@Service
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//@RequiredArgsConstructor
//public class PromotionService {
//    PromotionRepository promotionRepository;
//    PromotionMapper promotionMapper;
//    AppUserRepository appUserRepository;
//
//    public Page<PromotionResponse> getAll(Pageable pageable) {
//        Page<Promotion> promotions = promotionRepository.findAll(pageable);
//
//        return promotions.map(promotionMapper::toPromotionResponse);
//    }
//
//
//
//    public PromotionResponse getById(Integer id) {
//        Promotion promotion = promotionRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Promotion not found"));
//
//        return promotionMapper.toPromotionResponse(promotion);
//    }
//
//    public PromotionResponse create(PromotionRequest request, UUID idAppuer) {
//        AppUser appUser = appUserRepository.findByKeycloakId(idAppuer)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//        Promotion promotion = promotionMapper.toPromotion(request);
//        promotion.setPromotionCode(generatePromotionCode());
//        promotion.setAppUser(appUser);
//        promotionRepository.save(promotion);
//
//        return promotionMapper.toPromotionResponse(promotion);
//    }
//
//    public PromotionResponse update(Integer id, PromotionRequest request) {
//        Promotion promotion = promotionRepository.findById(id)
//                .orElseThrow(() -> new RuntimeException("Promotion not found"));
//
//        promotionMapper.updatePromotionFromRequest(promotion, request);
//        promotionRepository.save(promotion);
//
//        return promotionMapper.toPromotionResponse(promotion);
//    }
//
//    public Boolean delete(Integer id) {
//        if (!promotionRepository.existsById(id)) {
//            throw new RuntimeException("Promotion not found");
//        }
//
//        promotionRepository.deleteById(id);
//        return true;
//    }
//
//    private String generatePromotionCode() {
//        Random random = new Random();
//        int randomNum = 10000 + random.nextInt(90000); // Sinh số ngẫu nhiên 5 chữ số
//        return String.format("KM%d", randomNum);
//    }
//
//
//}


package org.yellowcat.backend.product.promotion;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.promotion.dto.CreatePromotionDTO;
import org.yellowcat.backend.product.promotion.dto.PromotionRequest;
import org.yellowcat.backend.product.promotion.dto.PromotionResponse;
import org.yellowcat.backend.product.promotion.mapper.PromotionMapper;
import org.yellowcat.backend.product.promotionproduct.PromotionProduct;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;


import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionService {

    PromotionRepository promotionRepository;
    PromotionMapper promotionMapper;
    AppUserRepository appUserRepository;

//    public Page<Promotion> findWithBasicFilters(
//            String keyword,
//            String status,
//            String discountType,
//            Pageable pageable
//    ) {
//        Specification<Promotion> spec = (Root<Promotion> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
//            List<Predicate> predicates = new ArrayList<>();
//
//            if (keyword != null && !keyword.isBlank()) {
//                String kw = "%" + keyword.toLowerCase() + "%";
//                Predicate byCode = cb.like(cb.lower(root.get("promotionCode")), kw);
//                Predicate byName = cb.like(cb.lower(root.get("promotionName")), kw);
//                predicates.add(cb.or(byCode, byName));
//            }
//
//            if (status != null && !status.isBlank()) {
//                boolean isActive = status.equalsIgnoreCase("active");
//                predicates.add(cb.equal(root.get("isActive"), isActive));
//            }
//
//            if (discountType != null && !discountType.isBlank()) {
//                predicates.add(cb.equal(root.get("discountType"), discountType));
//            }
//
//            return cb.and(predicates.toArray(new Predicate[0]));
//        };
//
//        return promotionRepository.findAll(spec, pageable);
//    }

    public Page<Promotion> findWithBasicFilters(
            String keyword,
            String status,
            String discountType,
            Pageable pageable
    ) {
        Specification<Promotion> spec = (Root<Promotion> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.toLowerCase() + "%";
                Predicate byCode = cb.like(cb.lower(root.get("promotionCode")), kw);
                Predicate byName = cb.like(cb.lower(root.get("promotionName")), kw);
                predicates.add(cb.or(byCode, byName));
            }

            // ✅ Lọc trạng thái theo endDate (thời gian thực)
            if (status != null && !status.isBlank()) {
                LocalDateTime now = LocalDateTime.now();

                if (status.equalsIgnoreCase("active")) {
                    predicates.add(cb.greaterThan(root.get("endDate"), now));
                } else if (status.equalsIgnoreCase("inactive")) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("endDate"), now));
                }
            }

            if (discountType != null && !discountType.isBlank()) {
                predicates.add(cb.equal(root.get("discountType"), discountType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return promotionRepository.findAll(spec, pageable);
    }


    public PromotionResponse getById(Integer id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));
        return promotionMapper.toPromotionResponse(promotion);
    }

    public PromotionResponse create(PromotionRequest request, UUID userId) {
        AppUser appUser = appUserRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Promotion promotion = promotionMapper.toPromotion(request);
        promotion.setPromotionCode(generatePromotionCode());
        promotion.setAppUser(appUser);
        promotionRepository.save(promotion);
        return promotionMapper.toPromotionResponse(promotion);
    }

    public PromotionResponse update(Integer id, PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Promotion not found"));
        promotionMapper.updatePromotionFromRequest(promotion, request);
        promotionRepository.save(promotion);
        return promotionMapper.toPromotionResponse(promotion);
    }

    public Boolean delete(Integer id) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Promotion not found");
        }
        promotionRepository.deleteById(id);
        return true;
    }

    private String generatePromotionCode() {
        int randomNum = 10000 + new Random().nextInt(90000);
        return "KM" + randomNum;
    }


}