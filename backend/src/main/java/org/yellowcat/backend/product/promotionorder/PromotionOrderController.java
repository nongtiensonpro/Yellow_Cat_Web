package org.yellowcat.backend.product.promotionorder;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.response.ResponseEntityBuilder;
import org.yellowcat.backend.product.promotionorder.dto.PromotionOrderRequest;
import org.yellowcat.backend.product.promotionorder.dto.PromotionProgramDTO;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;
import org.yellowcat.backend.user.AppUserService;

import java.util.Optional;

@RestController
@RequestMapping("/api/promotion-orders")
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class PromotionOrderController {
    PromotionOrderService promotionOrderService;
    AppUserService appUserService;
    AppUserRepository appUserRepository;

    @Operation(summary = "Find all promotion orders", description = "Returns a paginated list of all promotion orders")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @GetMapping
    ResponseEntity<?> findAllPromotionOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            Page<PromotionProgramDTO> productPage = promotionOrderService.findAllPromotionPrograms(page, size);
            return ResponseEntityBuilder.success(productPage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Error retrieving", "Error retrieving");
        }
    }

    @Operation(summary = "Find promotion order by ID", description = "Returns a promotion order by its ID")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @GetMapping("/{promotionOrderId}")
    ResponseEntity<?> findPromotionOrderById(
            @PathVariable(name = "promotionOrderId") Integer promotionOrderId
    ) {
        try {
            PromotionProgramDTO promotionProgram = promotionOrderService.findPromotionProgramById(promotionOrderId);
            return ResponseEntityBuilder.success(promotionProgram);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Promotion order not found", "Promotion order not found");
        }
    }

    @Operation(summary = "Create a promotion order", description = "Creates a new promotion order")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @PostMapping
    ResponseEntity<?> createPromotionOrder(
            @RequestBody PromotionOrderRequest request
//            @AuthenticationPrincipal Jwt jwt
    ) {
//        UUID userId = UUID.fromString(jwt.getSubject());

//        Optional<AppUser> appUser = appUserService.findByKeycloakId(userId);
        AppUser user;

        Optional<AppUser> appUser = appUserRepository.findById(1);

        if (appUser.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "User not found", "User not found");
        } else {
            user = appUser.get();
        }
        PromotionProgramDTO promotionProgramDTO = promotionOrderService.createPromotionProgram(request, user);

        return ResponseEntityBuilder.success(promotionProgramDTO);
    }

    @Operation(summary = "Update a promotion order", description = "Updates an existing promotion order")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @PutMapping("/{promotionOrderId}")
    ResponseEntity<?> updatePromotionOrder(
            @PathVariable(name = "promotionOrderId") Integer promotionOrderId,
            @RequestBody PromotionOrderRequest request
//            @AuthenticationPrincipal Jwt jwt
    ) {
//        UUID userId = UUID.fromString(jwt.getSubject());
//
//        Optional<AppUser> appUser = appUserService.findByKeycloakId(userId);
//        AppUser user;

        AppUser user;

        Optional<AppUser> appUser = appUserRepository.findById(2);
        if (appUser.isEmpty()) {
            return ResponseEntityBuilder.error(HttpStatus.BAD_REQUEST, "User not found", "User not found");
        } else {
            user = appUser.get();
        }

        PromotionProgramDTO promotionProgramDTO = promotionOrderService.updatePromotionProgram(promotionOrderId, request, user);

        return ResponseEntityBuilder.success(promotionProgramDTO);
    }

    @Operation(summary = "Delete a promotion order", description = "Deletes a promotion order by its ID")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @DeleteMapping("/{promotionOrderId}")
    ResponseEntity<?> deletePromotionOrder(
            @PathVariable(name = "promotionOrderId") Integer promotionOrderId
    ) {
        try {
            promotionOrderService.deletePromotionProgram(promotionOrderId);
            return ResponseEntityBuilder.success("Promotion order deleted successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Promotion order not found", "Promotion order not found");
        }
    }

    @Operation(summary = "Change status of a promotion order", description = "Toggles the active status of a promotion order")
    @PreAuthorize("hasAnyAuthority('Admin_Web', 'Staff_Web')")
    @PostMapping("/update-status/{promotionOrderId}")
    ResponseEntity<?> changePromotionOrderStatus(
            @PathVariable(name = "promotionOrderId") Integer promotionOrderId
    ) {
        try {
            promotionOrderService.changeStatus(promotionOrderId);
            return ResponseEntityBuilder.success("Promotion order status changed successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntityBuilder.error(HttpStatus.NOT_FOUND, "Promotion order not found", "Promotion order not found");
        }
    }
}
