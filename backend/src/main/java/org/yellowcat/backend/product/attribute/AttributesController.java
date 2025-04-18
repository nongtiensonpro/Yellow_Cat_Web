package org.yellowcat.backend.product.attribute;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.yellowcat.backend.product.attribute.dto.AttributesDto;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;

@RestController
@RequestMapping("/api/attributes")
public class AttributesController {

    private final AttriburesService attributesService;

    public AttributesController(AttriburesService attributesService) {
        this.attributesService = attributesService;
    }

    @GetMapping
    @Operation(summary = "Get all product attributes",description = "Returns a list of all product attributes")
    public ResponseEntity<?> getAllAttributes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AttributesDto> attributess = attributesService.findAll(pageable);
        return ResponseEntityBuilder.success(attributess);

    }

}
