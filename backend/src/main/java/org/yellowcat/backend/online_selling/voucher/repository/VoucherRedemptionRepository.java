package org.yellowcat.backend.online_selling.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherRedemption;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRedemptionRepository extends JpaRepository<VoucherRedemption, Integer> {
    @Query(value = """
        SELECT vr.*
        FROM voucher_redemption vr
        JOIN orders o ON o.order_id = vr.order_id
        WHERE vr.voucher_id = :voucherId AND o.phone_number = :phoneNumber
        """, nativeQuery = true)
    VoucherRedemption findByVoucherIdAndPhoneNumber(@Param("voucherId") Integer voucherId,
                                                    @Param("phoneNumber") String phoneNumber);

    @Query("SELECT SUM(vr.discountAmount) FROM VoucherRedemption vr WHERE vr.voucher.id = :voucherId")
    Optional<BigDecimal> sumDiscountAmountByVoucherId(@Param("voucherId") Integer voucherId);

    @Query("SELECT SUM(o.finalAmount) FROM VoucherRedemption vr " +
            "JOIN Order o ON vr.orderId = o.orderId " +
            "WHERE vr.voucher.id = :voucherId")
    Optional<BigDecimal> sumOrderValuesByVoucherId(@Param("voucherId") Integer voucherId);

    List<VoucherRedemption> findByVoucherId(Integer voucherId);

    List<VoucherRedemption> findAllByVoucher_Id(Integer voucherId);

    @Query("SELECT vr FROM VoucherRedemption vr " +
            "LEFT JOIN FETCH vr.orderId o " +
            "LEFT JOIN FETCH vr.userId u " +
            "WHERE vr.voucher.id = :voucherId")
    List<VoucherRedemption> findWithDetailsByVoucherId(@Param("voucherId") Integer voucherId);


    @Query("SELECT FUNCTION('DATE', COALESCE(v.appliedAt, CURRENT_DATE)) as usageDate, " + // Xử lý null
            "COUNT(v) as usageCount, " +
            "SUM(COALESCE(o.finalAmount, 0) + COALESCE(v.discountAmount, 0)) as sales " + // Xử lý null
            "FROM VoucherRedemption v " +
            "LEFT JOIN Order o ON o.orderId = v.orderId " + // Sử dụng LEFT JOIN
            "WHERE v.voucher.id = :voucherId " +
            "GROUP BY FUNCTION('DATE', COALESCE(v.appliedAt, CURRENT_DATE)) " + // Nhóm theo ngày đã xử lý
            "ORDER BY FUNCTION('DATE', COALESCE(v.appliedAt, CURRENT_DATE))")
    List<Object[]> findDailyUsageWithSalesByVoucherId(@Param("voucherId") Integer voucherId);

    // Tìm voucher redemption theo orderId
    VoucherRedemption findByOrderId(Integer orderId);
}
