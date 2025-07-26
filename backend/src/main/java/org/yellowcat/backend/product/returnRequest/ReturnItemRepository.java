package org.yellowcat.backend.product.returnRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnItemResponseDTO;

@Repository
public interface ReturnItemRepository extends JpaRepository<ReturnItem, Integer> {
    @Query("""
                SELECT new org.yellowcat.backend.product.returnRequest.dto.response.ReturnItemResponseDTO(
                    ri.returnItemId,
                    oi.orderItemId,
                    p.productName,
                    ri.quantityReturned,
                    ri.refundAmount,
                    ri.reason
                )
                FROM ReturnItem ri
                JOIN ri.orderItem oi
                JOIN oi.variant v
                JOIN v.product p
                WHERE ri.returnRequest.returnRequestId = :returnRequestId
            """)
    Page<ReturnItemResponseDTO> findByReturnRequestId(
            @Param("returnRequestId") Integer returnRequestId,
            Pageable pageable
    );

    boolean existsByOrderItem_OrderItemIdAndReturnRequest_StatusNot(Integer orderItemId, String status);
}
