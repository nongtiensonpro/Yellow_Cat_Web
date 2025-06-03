package org.yellowcat.backend.product.targetaudience;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.PageResponse;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceCreateDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceRequestDto;
import org.yellowcat.backend.product.targetaudience.dto.TargetAudienceResponse;

@RestController
@RequestMapping("/api/target-audiences")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TargetAudienceController {
    TargetAudienceService targetAudienceService;

    @GetMapping
    public ResponseEntity<?> getAllSize(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TargetAudienceResponse> categories = targetAudienceService.getAllTargetAudience(page, size);
        PageResponse<TargetAudienceResponse> pageResponse = new PageResponse<>(categories);
        return ResponseEntityBuilder.success(pageResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSizeById(@PathVariable Integer id) {
        return ResponseEntityBuilder.success(targetAudienceService.getTargetAudienceById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<?> addSize(@RequestBody TargetAudienceCreateDto request) {
        return ResponseEntityBuilder.success(targetAudienceService.addTargetAudience(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<TargetAudienceResponse> updateSize(@PathVariable Integer id, @RequestBody TargetAudienceRequestDto request) {
        return ResponseEntity.ok(targetAudienceService.updateTargetAudience(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('Admin_Web')")
    public ResponseEntity<Boolean> deleteSize(@PathVariable Integer id) {
        return ResponseEntity.ok(targetAudienceService.deleteTargetAudience(id));
    }
}
