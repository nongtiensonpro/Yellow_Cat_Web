package org.yellowcat.backend.product.voucher;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    boolean existsByVoucherNameIgnoreCase(String voucherName);
    boolean existsByVoucherNameIgnoreCaseAndVoucherIdNot(String voucherName, Integer voucherId);
    boolean existsByVoucherCodeIgnoreCase(String voucherCode);
    Page<Voucher> findByVoucherNameContainingIgnoreCaseOrVoucherCodeContainingIgnoreCase(String name, String code, Pageable pageable);
} 