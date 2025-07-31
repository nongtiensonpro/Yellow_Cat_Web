package org.yellowcat.backend.online_selling.voucher.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.voucher.entity.VoucherUser;

import java.util.Optional;

@Repository
public interface VoucherUserRepository extends JpaRepository<VoucherUser, Integer> {
    VoucherUser findByVoucherIdAndUserId(Integer voucherId, Integer userId);

    int countByVoucherId(Integer voucherId);
}
