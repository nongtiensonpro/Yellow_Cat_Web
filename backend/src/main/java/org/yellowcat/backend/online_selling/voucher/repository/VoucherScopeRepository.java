package org.yellowcat.backend.online_selling.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherScope;

@Repository
public interface VoucherScopeRepository extends JpaRepository<VoucherScope, Integer> {
    void deleteByVoucherId(Integer voucherId);
    VoucherScope findByVoucherId(Integer voucherId);
}
