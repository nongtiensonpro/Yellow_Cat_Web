package org.yellowcat.backend.online_selling.productwaitlist;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.gmail_sending.EmailService;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.user.AppUserRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductWaitlistService {
    private final ProductWaitlistRequestRepository repository;
    private final ProductVariantRepository variantRepository;
    private final EmailService emailService;
    private final AppUserRepository appUserRepository;

    // Người dùng gửi yêu cầu đợi sản phẩm
    @Transactional
    public String submitRequest(WaitlistRequestDTO dto) {
        var request = ProductWaitlistRequest.builder()
                .fullName(dto.getFullName())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .note(dto.getNote())
                .status(WaitlistStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .code(generateWaitlistCode())
                .build();

        if (dto.getKeyloackID() != null) {
            appUserRepository.findByKeycloakId(dto.getKeyloackID()).ifPresent(request::setAppUser);
        }

        List<ProductWaitlistItem> itemList = dto.getItems().stream().map(itemDTO -> {
            ProductVariant variant = variantRepository.findById(itemDTO.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm: " + itemDTO.getVariantId()));

            return ProductWaitlistItem.builder()
                    .request(request)
                    .productVariant(variant)
                    .desiredQuantity(itemDTO.getDesiredQuantity())
                    .build();
        }).toList();

        request.setItems(itemList);
        repository.save(request);
        return request.getCode();
    }

    private String generateWaitlistCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "REQ-" + timestamp + "-" + randomPart;
    }

    @Transactional
    public void notifyCustomer(Integer requestId) {
        ProductWaitlistRequest request = repository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu chờ hàng"));

        processNotify(request);
    }

    @Transactional
    public ProductWaitlistRequest findByCode(String code) {
        return repository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu với mã: " + code));
    }

    // Người dùng hoặc admin cập nhật trạng thái và số lượng mong muốn trong phiếu chờ
    @Transactional
    public void updateStatusByCode(String code, WaitlistUpdateRequestDTO dto) {
        ProductWaitlistRequest request = findByCode(code);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expireTime = request.getActivatedAt() != null
                ? request.getActivatedAt().plusDays(3)
                : request.getCreatedAt().plusDays(365);

        if (expireTime.isBefore(now) && request.getStatus() == WaitlistStatus.PENDING) {
            request.setStatus(WaitlistStatus.CANCELLED);
            repository.save(request);
            emailService.sendCancellationNotification(request);
            throw new RuntimeException("Phiếu đã hết hạn, không thể chỉnh sửa hoặc cập nhật.");
        }

        if (request.getStatus() == WaitlistStatus.PENDING && dto.getItems() != null) {
            Map<Integer, WaitlistItemUpdateDTO> updatedItemMap = dto.getItems().stream()
                    .collect(Collectors.toMap(WaitlistItemUpdateDTO::getVariantId, i -> i));

            request.getItems().removeIf(oldItem -> {
                int variantId = oldItem.getProductVariant().getVariantId();
                if (updatedItemMap.containsKey(variantId)) {
                    oldItem.setDesiredQuantity(updatedItemMap.get(variantId).getDesiredQuantity());
                    updatedItemMap.remove(variantId);
                    return false;
                }
                return true;
            });

            for (WaitlistItemUpdateDTO newItem : updatedItemMap.values()) {
                ProductVariant variant = variantRepository.findById(newItem.getVariantId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm: " + newItem.getVariantId()));

                ProductWaitlistItem item = ProductWaitlistItem.builder()
                        .request(request)
                        .productVariant(variant)
                        .desiredQuantity(newItem.getDesiredQuantity())
                        .build();
                request.getItems().add(item);
            }
        }

        if (dto.getNewStatus() != null) {
            request.setStatus(dto.getNewStatus());
        }

        repository.save(request);

        try {
            if (dto.getNewStatus() == WaitlistStatus.CANCELLED || dto.getNewStatus() == WaitlistStatus.CUSTOMER_CANCELLED) {
                emailService.sendCancellationNotification(request);
            } else if (dto.getNewStatus() != null) {
                emailService.sendManualUpdateNotification(request, dto.getNewStatus().name());
            }
        } catch (Exception e) {
            System.err.println("Gửi email cập nhật thất bại: " + e.getMessage());
        }
    }

    @Transactional
    public void cancelRequestByCode(String code) {
        ProductWaitlistRequest request = findByCode(code);
        request.setStatus(WaitlistStatus.CANCELLED);
        repository.save(request);
    }

    // Cron tự động chạy vào lúc 12:00 trưa mỗi ngày để kiểm tra các yêu cầu ACTIVATED:
    // - Gửi email nếu đủ điều kiện
    // - Tự động huỷ nếu đã quá 3 ngày kể từ activatedAt
    @Scheduled(cron = "0 0 12 * * *")
    @Transactional
    public void autoNotify() {
        System.out.println("\u23F0 Đang kiểm tra waitlist lúc " + LocalDateTime.now());

        // Gửi thông báo cho tất cả yêu cầu ACTIVATED nếu sản phẩm đáp ứng hoặc huỷ nếu hết hạn
        List<ProductWaitlistRequest> requests = repository.findAllByStatus(WaitlistStatus.ACTIVATED);
        for (ProductWaitlistRequest request : requests) {
            processNotify(request);
        }
    }

    // Gọi khi biến thể sản phẩm được cập nhật, kiểm tra các phiếu đợi có liên quan và gửi thông báo ngay nếu đủ hàng
    @Transactional
    public void onProductVariantUpdated(Integer variantId) {
        List<ProductWaitlistRequest> waitlists = repository.findAllByStatus(WaitlistStatus.PENDING);

        for (ProductWaitlistRequest request : waitlists) {
            boolean match = request.getItems().stream()
                    .anyMatch(item -> item.getProductVariant().getVariantId().equals(variantId)
                            && item.getProductVariant().getQuantityInStock() >= item.getDesiredQuantity());

            if (match) {
                request.setStatus(WaitlistStatus.ACTIVATED);
                request.setActivatedAt(LocalDateTime.now());
                repository.save(request);
                processNotifyFiltered(request, List.of(variantId));
            }
        }
    }

    // Xử lý gửi thông báo nếu yêu cầu ACTIVATED và có sản phẩm sẵn sàng hoặc huỷ nếu hết hạn
    private void processNotify(ProductWaitlistRequest request) {
        LocalDateTime now = LocalDateTime.now();

        if (request.getStatus() != WaitlistStatus.ACTIVATED) return;

        long daysSinceActivated = ChronoUnit.DAYS.between(request.getActivatedAt().toLocalDate(), now.toLocalDate());
        if (daysSinceActivated > 3) {
            request.setStatus(WaitlistStatus.CANCELLED);
            repository.save(request);
            return;
        }

        List<ProductWaitlistItem> availableItems = request.getItems().stream()
                .filter(item -> {
                    ProductVariant variant = item.getProductVariant();
                    return variant.getQuantityInStock() >= item.getDesiredQuantity() && variant.getQuantityInStock() >= 10;
                })
                .collect(Collectors.toList());

        if (availableItems.isEmpty()) return;

        try {
            emailService.sendProductAvailableNotification(request, availableItems);
            request.setActivatedAt(LocalDateTime.now());
            request.setStatus(WaitlistStatus.PENDING);
            repository.save(request);
        } catch (Exception e) {
            System.err.println("Gửi email thất bại cho yêu cầu #" + request.getId() + ": " + e.getMessage());
        }
    }

    // Gọi thủ công hoặc xử lý hàng loạt theo danh sách biến thể vừa cập nhật
    @Transactional
    public void activateWaitlistsByVariantIds(List<Integer> variantIds) {
        if (variantIds == null || variantIds.isEmpty()) return;

        List<ProductWaitlistRequest> waitlists = repository.findAllByStatus(WaitlistStatus.PENDING);

        for (ProductWaitlistRequest request : waitlists) {
            boolean containsMatch = request.getItems().stream()
                    .anyMatch(item -> variantIds.contains(item.getProductVariant().getVariantId()));

            if (containsMatch) {
                request.setStatus(WaitlistStatus.ACTIVATED);
                request.setActivatedAt(LocalDateTime.now());
                repository.save(request);
                processNotifyFiltered(request, variantIds);
            }
        }
    }

    // Gửi thông báo chỉ cho các sản phẩm liên quan đến biến thể vừa được cập nhật
    private void processNotifyFiltered(ProductWaitlistRequest request, List<Integer> updatedVariantIds) {
        LocalDateTime now = LocalDateTime.now();

        if (request.getStatus() != WaitlistStatus.ACTIVATED) return;

        long daysSinceActivated = ChronoUnit.DAYS.between(request.getActivatedAt().toLocalDate(), now.toLocalDate());
        if (daysSinceActivated > 3) {
            request.setStatus(WaitlistStatus.CANCELLED);
            repository.save(request);
            return;
        }

        List<ProductWaitlistItem> availableItems = request.getItems().stream()
                .filter(item -> updatedVariantIds.contains(item.getProductVariant().getVariantId()))
                .filter(item -> item.getProductVariant().getQuantityInStock() >= item.getDesiredQuantity())
                .collect(Collectors.toList());

        if (availableItems.isEmpty()) return;

        try {
            emailService.sendProductAvailableNotification(request, availableItems);
            request.setActivatedAt(LocalDateTime.now());
            request.setStatus(WaitlistStatus.PENDING);
            repository.save(request);
        } catch (Exception e) {
            System.err.println("Gửi email thất bại cho yêu cầu #" + request.getId() + ": " + e.getMessage());
        }
    }

    @Transactional
    public List<ProductWaitlistRequest> getRequests(UUID keyword) {
        return repository.findAllByAppUserKeycloakId(keyword);
    }
}