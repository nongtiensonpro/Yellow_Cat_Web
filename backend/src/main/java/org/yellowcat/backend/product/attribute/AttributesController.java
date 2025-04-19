package org.yellowcat.backend.product.attribute;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.product.attribute.dto.AttributesCreateDto;
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

    @GetMapping("/{id}")
    @Operation(summary = "Get product attribute by id", description = "Returns a single product attribute by id")
    public ResponseEntity<?> getAttributeById(@PathVariable Integer id) {
        AttributesDto attributes = attributesService.findById(id);
        if (attributes == null) {
            return ResponseEntityBuilder.notFound("Product attribute not found", "Not Found");
        }
        return ResponseEntityBuilder.success(attributes);
    }

    @PostMapping
    @Operation(summary = "Create a new product attribute", description = "Creates a new product attribute")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> createAttribute(@RequestBody AttributesCreateDto attributesCreateDto) {
        AttributesDto attributes = attributesService.save(attributesCreateDto);
        return ResponseEntityBuilder.success(attributes);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product attribute by id", description = "Updates a product attribute by id")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> updateAttribute(@PathVariable Integer id, @RequestBody AttributesDto attributesDto) {
        if(attributesDto.getId()==null){
            attributesDto.setId(id);
        }
        AttributesDto attributes = attributesService.findById(id);
        if (attributes == null) {
            return ResponseEntityBuilder.notFound("Product attribute not found", "Not Found");
        }
        attributes = attributesService.update(attributesDto);
        return ResponseEntityBuilder.success(attributes);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product attribute by id", description = "Delete a product attribute by id")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> deleteAttribute(@PathVariable Integer id) {
        AttributesDto attributes = attributesService.findById(id);
        if (attributes == null) {
            return ResponseEntityBuilder.notFound("Product attribute not found", "Not Found");
        }
        attributesService.deleteById(id);
        return ResponseEntityBuilder.success("Product attribute deleted successfully");
    }

}
