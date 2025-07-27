package org.yellowcat.backend.online_selling.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherRedemption;

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
}
