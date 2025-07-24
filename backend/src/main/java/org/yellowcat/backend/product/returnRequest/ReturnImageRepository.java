package org.yellowcat.backend.product.returnRequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.returnRequest.dto.response.ReturnImageDTO;

import java.util.List;

@Repository
public interface ReturnImageRepository extends JpaRepository<ReturnImage, Integer> {
    @Query("""
                SELECT new org.yellowcat.backend.product.returnRequest.dto.response.ReturnImageDTO(
                    ri.returnImageId,
                    ri.imageUrl,
                    ri.description
                )
                FROM ReturnImage ri
                WHERE ri.returnItem.returnItemId = :returnItemId
            """)
    List<ReturnImageDTO> findImagesByReturnItemId(@Param("returnItemId") Integer returnItemId);
}
