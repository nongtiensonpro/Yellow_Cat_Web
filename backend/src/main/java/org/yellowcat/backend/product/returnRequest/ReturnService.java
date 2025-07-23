package org.yellowcat.backend.product.returnRequest;

import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.product.Product;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.order.OrderRepository;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;
import org.yellowcat.backend.product.productvariant.ProductVariantRepository;
import org.yellowcat.backend.product.returnRequest.dto.request.*;
import org.yellowcat.backend.product.returnRequest.dto.response.*;
import org.yellowcat.backend.product.returnRequest.mapper.ReturnImageMapper;
import org.yellowcat.backend.product.returnRequest.mapper.ReturnRequestMapper;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ReturnService {
    ReturnRequestRepository returnRequestRepo;
    ReturnItemRepository returnItemRepo;
    ReturnImageRepository returnImageRepo;
    OrderRepository orderRepo;
    AppUserRepository appUserRepo;
    OrderItemRepository orderItemRepo;
    ProductVariantRepository productVariantRepo;
    ReturnRequestMapper returnRequestMapper;
    ReturnImageMapper returnImageMapper;

    @Transactional
    public ReturnItemDetailDTO getReturnItemDetail(Integer returnItemId) {
        ReturnItem item = returnItemRepo.findById(returnItemId)
                .orElseThrow(() -> new EntityNotFoundException("Return item not found"));

        OrderItem orderItem = item.getOrderItem();
        ProductVariant variant = orderItem.getVariant();
        Product product = variant.getProduct();

        List<ReturnImageDTO> imageDTOs = returnImageRepo.findImagesByReturnItemId(returnItemId);

        ReturnItemDetailDTO dto = new ReturnItemDetailDTO();
        dto.setReturnItemId(item.getReturnItemId());
        dto.setOrderItemId(orderItem.getOrderItemId());
        dto.setProductName(product.getProductName());
        dto.setSku(variant.getSku());
        dto.setColor(variant.getColor() != null ? variant.getColor().getName() : null);
        dto.setSize(variant.getSize() != null ? variant.getSize().getName() : null);
        dto.setQuantityReturned(item.getQuantityReturned());
        dto.setRefundAmount(item.getRefundAmount());
        dto.setReason(item.getReason());
        dto.setImages(imageDTOs);

        return dto;
    }

    public Page<ReturnItemResponseDTO> getReturnItemsByRequestId(Integer returnRequestId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        return returnItemRepo.findByReturnRequestId(returnRequestId, pageable);
    }

    public Page<ReturnRequestResponse> findAllReturnRequests(int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        return returnRequestRepo.findAllReturnRequests(pageable);
    }

    @Transactional
    public ReturnRequestResponse createReturnRequest(CreateReturnRequestDTO dto) {
        Order order = orderRepo.findById(dto.getOrderId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đơn hàng với ID: " + dto.getOrderId()));
        AppUser user = appUserRepo.findById(dto.getAppUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với ID: " + dto.getAppUserId()));

        // ✅ 1. Kiểm tra nghiệp vụ về thời gian
        if (order.getDeliveryDate() == null) {
            throw new IllegalStateException("Không thể hoàn trả: đơn hàng chưa được giao thành công.");
        }
        if (order.getDeliveryDate().plusDays(5).isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Đã quá hạn 5 ngày để yêu cầu hoàn trả.");
        }

        // Bắt đầu tạo yêu cầu
        ReturnRequest request = new ReturnRequest();
        request.setOrder(order);
        request.setAppUser(user);
        request.setReturnReason(dto.getReturnReason());

        List<ReturnItem> returnItems = new ArrayList<>();
        for (ReturnItemDTO itemDTO : dto.getItems()) {
            OrderItem orderItem = orderItemRepo.findById(itemDTO.getOrderItemId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm trong đơn hàng: " + itemDTO.getOrderItemId()));

            // ✅ 2. Kiểm tra nghiệp vụ về sản phẩm và số lượng
            if (itemDTO.getQuantityReturned() <= 0) {
                throw new IllegalArgumentException("Số lượng trả phải lớn hơn 0.");
            }
            if (itemDTO.getQuantityReturned() > orderItem.getQuantity()) {
                throw new IllegalStateException("Số lượng trả vượt quá số lượng đã mua.");
            }
            if (returnItemRepo.existsByOrderItem_OrderItemIdAndReturnRequest_StatusNot(orderItem.getOrderItemId(), "REJECTED")) {
                throw new IllegalStateException("Sản phẩm " + orderItem.getOrderItemId() + " đã có trong một yêu cầu hoàn trả khác.");
            }

            ReturnItem item = new ReturnItem();
            item.setReturnRequest(request);
            item.setOrderItem(orderItem);
            item.setQuantityReturned(itemDTO.getQuantityReturned());
            item.setRefundAmount(orderItem.getPriceAtPurchase().multiply(BigDecimal.valueOf(itemDTO.getQuantityReturned())));
            item.setReason(itemDTO.getReason());
            returnItems.add(item);
        }

        request.setItems(returnItems);
        request.calculateTotalRefundAmount(); // Gọi helper method để tính tổng tiền

        // ✅ Chỉ cần lưu request cha, các item con sẽ tự động được lưu nhờ CascadeType.ALL
        returnRequestRepo.save(request);

        return returnRequestMapper.toResponse(request);
    }

    @Transactional
    public ReturnRequestResponse updateReturnStatus(Integer returnRequestId, UpdateReturnStatusDTO dto) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu hoàn trả: " + returnRequestId));

        // Chỉ cập nhật trạng thái và ghi chú.
        request.setStatus(dto.getStatus());
        request.setNote(dto.getNote());
        request.setProcessedDate(LocalDateTime.now());
        returnRequestRepo.save(request);

        return returnRequestMapper.toResponse(request);
    }

    /**
     * Admin xác nhận hoàn tất quy trình: cập nhật kho và chuẩn bị hoàn tiền.
     * Chỉ được gọi khi hàng đã được nhận và kiểm tra (status = RECEIVED).
     */
    @Transactional
    public ReturnRequestResponse completeReturn(Integer returnRequestId) {
        ReturnRequest request = returnRequestRepo.findById(returnRequestId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yêu cầu hoàn trả: " + returnRequestId));

        // Đảm bảo quy trình đúng: chỉ hoàn tất khi đã nhận hàng
        if (!request.getStatus().equalsIgnoreCase("RECEIVED")) {
            throw new IllegalStateException("Không thể hoàn tất yêu cầu khi chưa nhận và kiểm tra hàng.");
        }

        // Cập nhật trạng thái cuối cùng
        request.setStatus("COMPLETED");
        request.setProcessedDate(LocalDateTime.now());

        // Cập nhật tồn kho
        for (ReturnItem item : request.getItems()) {
            ProductVariant variant = item.getOrderItem().getVariant();
            variant.setQuantityInStock(variant.getQuantityInStock() + item.getQuantityReturned());
            productVariantRepo.save(variant);
        }
        returnRequestRepo.save(request);

        return returnRequestMapper.toResponse(request);
    }

    public ReturnImageResponse createReturnImage(CreateReturnImageDTO dto) {
        ReturnItem returnItem = returnItemRepo.findById(dto.getReturnItemId())
                .orElseThrow(() -> new EntityNotFoundException("Return item not found"));

        ReturnImage image = new ReturnImage();
        image.setReturnItem(returnItem);
        image.setImageUrl(dto.getImageUrl());
        image.setDescription(dto.getDescription());
        image.setUploadedAt(LocalDateTime.now());
        returnImageRepo.save(image);

        return returnImageMapper.toResponse(image);
    }
}
