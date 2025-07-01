package org.yellowcat.backend.statistics.promotionstatistics;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/promotion-statistics")
public class PromotionStatisticsController {
    private final PromotionStatisticsService service;

    public PromotionStatisticsController(PromotionStatisticsService service) {
        this.service = service;
    }

    /**
     * API lấy thống kê tổng quan về promotions
     * GET /api/promotion-statistics/overview
     */
    @GetMapping("/overview")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<PromotionStatistics> getPromotionStatistics() {
        try {
            PromotionStatistics statistics = service.getPromotionStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * API lấy tất cả promotions với trạng thái
     * GET /api/promotion-statistics/all
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<List<PromotionDetail>> getAllPromotionsWithStatus() {
        try {
            List<PromotionDetail> promotions = service.getAllPromotionsWithStatus();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * API lấy promotions theo trạng thái
     * GET /api/promotion-statistics/by-status?status=ACTIVE|EXPIRED|UPCOMING
     */
    @GetMapping("/by-status")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<List<PromotionDetail>> getPromotionsByStatus(
            @RequestParam(required = true) String status) {
        try {
            List<PromotionDetail> promotions = switch (status.toUpperCase()) {
                case "ACTIVE" -> service.getActivePromotions();
                case "EXPIRED" -> service.getExpiredPromotions();
                case "UPCOMING" -> service.getUpcomingPromotions();
                default -> throw new IllegalArgumentException("Invalid status: " + status + 
                    ". Allowed values: ACTIVE, EXPIRED, UPCOMING");
            };
            
            return ResponseEntity.ok(promotions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * API lấy promotions đang hoạt động
     * GET /api/promotion-statistics/active
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<List<PromotionDetail>> getActivePromotions() {
        try {
            List<PromotionDetail> promotions = service.getActivePromotions();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * API lấy promotions đã hết hạn
     * GET /api/promotion-statistics/expired
     */
    @GetMapping("/expired")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<List<PromotionDetail>> getExpiredPromotions() {
        try {
            List<PromotionDetail> promotions = service.getExpiredPromotions();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * API lấy promotions sắp diễn ra
     * GET /api/promotion-statistics/upcoming
     */
    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Employee_Web')")
    public ResponseEntity<List<PromotionDetail>> getUpcomingPromotions() {
        try {
            List<PromotionDetail> promotions = service.getUpcomingPromotions();
            return ResponseEntity.ok(promotions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 