package org.yellowcat.backend.product.shippingMethod;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.common.config_api.response.ApiResponse;

@RestController
@RequestMapping("/api/shipping-methods")
@RequiredArgsConstructor
public class ShippingMethodController {
    private final ShippingMethodService shippingMethodService;

    @GetMapping("/{id}")
    public ApiResponse<ShippingMethod> getShippingMethodById(@PathVariable Integer id) {
        ShippingMethod shippingMethod = shippingMethodService.getShippingMethodById(id);
        return ApiResponse.success(shippingMethod);
    }

}
