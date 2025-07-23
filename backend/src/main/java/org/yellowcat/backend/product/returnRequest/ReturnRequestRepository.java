package org.yellowcat.backend.product.returnRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnRequestResponse;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Integer> {
    @Query("""
                SELECT new org.yellowcat.backend.product.returnRequest.dto.response.ReturnRequestResponse(
                    rr.returnRequestId,
                    o.orderCode,
                    u.username,
                    rr.requestDate,
                    rr.returnReason,
                    rr.status,
                    rr.refundAmount,
                    rr.processedDate,
                    rr.note
                )
                FROM ReturnRequest rr
                JOIN rr.order o
                JOIN rr.appUser u
            """)
    Page<ReturnRequestResponse> findAllReturnRequests(Pageable pageable);
}
