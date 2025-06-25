package org.yellowcat.backend.product.promotion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PromotionScheduler {

    private final PromotionRepository promotionRepository;

    @Scheduled(cron = "0 0 0 * * *") // chạy mỗi ngày lúc 00:00
    public void updateExpiredPromotions() {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> expired = promotionRepository.findByEndDateBeforeAndIsActiveTrue(now);

        if (!expired.isEmpty()) {
            expired.forEach(p -> p.setIsActive(false));
            promotionRepository.saveAll(expired);
            log.info("Đã cập nhật {} promotion hết hạn thành inactive", expired.size());
        }
    }
}