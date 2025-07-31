package org.yellowcat.backend.online_selling.voucher.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.voucher.DiscountType;
import org.yellowcat.backend.online_selling.voucher.ScopeType;
import org.yellowcat.backend.online_selling.voucher.entity.Voucher;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherScope;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface VoucherRepository1 extends JpaRepository<Voucher, Integer> {
    boolean existsByCode(String code);

    Optional<Voucher> findByCode(String code);

    Optional<Voucher> findById(Integer id);

        @Query("""
        SELECT v FROM OnlineVoucher v
        WHERE v.code = :code
          AND v.isActive = true
          AND (v.startDate IS NULL OR v.startDate <= :now)
          AND (v.endDate IS NULL OR v.endDate >= :now)
    """)
        Optional<Voucher> findValidVoucher(@Param("code") String code,
                                           @Param("userId") Long userId,
                                           @Param("now") LocalDateTime now);
    @EntityGraph(attributePaths = {"scopes"})
    List<Voucher> findAllByIsActive(Boolean isActive);

    // Thêm phương thức mới
    List<Voucher> findByStartDateBetweenOrEndDateBetween(
            LocalDateTime startDate1, LocalDateTime endDate1,
            LocalDateTime startDate2, LocalDateTime endDate2);

    List<Voucher> findAll();

    // Kiểm tra trùng tên khi tạo
    boolean existsByName(String name);

    // Kiểm tra trùng tên khi cập nhật (loại trừ theo id)
    boolean existsByNameAndIdNot(String name, Integer id);

    boolean existsByCodeAndIdNot(String code, Integer id);


    List<Voucher> findAllByDiscountType(DiscountType discountType);

    @Query("SELECT DISTINCT v FROM OnlineVoucher v JOIN v.scopes s WHERE s.scopeType = :scopeType")
    List<Voucher> findAllByScopes(@Param("scopeType") ScopeType scopeType);

    List<Voucher> findAllByEndDateBeforeAndIsActiveTrue(LocalDateTime dateTime);


}




