package org.yellowcat.backend.product.shippingMethod;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShippingMethodService {

    private final ShippingMethodRepository shippingMethodRepository;

    public ShippingMethod getShippingMethodById(Integer id) {
        return shippingMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phương thức vận chuyển với ID: " + id));
    }
}
