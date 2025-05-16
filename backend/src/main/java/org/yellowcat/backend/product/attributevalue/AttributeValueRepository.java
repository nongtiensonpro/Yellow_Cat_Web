package org.yellowcat.backend.product.attributevalue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttributeValueRepository extends JpaRepository<AttributeValue, Integer> {
    @Query("SELECT av FROM AttributeValue av WHERE av.attribute.id = :attributeId AND av.value = :value")
    Optional<AttributeValue> findByAttributeIdAndValue(@Param("attributeId") Integer attributeId, @Param("value") String value);
}
