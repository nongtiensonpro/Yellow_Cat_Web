package org.yellowcat.backend.product.shippingMethod;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShippingMethodIdRepository extends JpaRepository<ShippingMethod, Integer> {
    ShippingMethod findByShippingMethodId(int shippingMethodId);
}
