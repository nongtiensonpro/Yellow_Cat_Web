package org.yellowcat.backend.product.review;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yellowcat.backend.online_selling.oder_online.OderOnlineRepository;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.orderItem.OrderItemRepository;
import org.yellowcat.backend.product.review.dto.*;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final OderOnlineRepository orderRepository;
    private final AppUserRepository appUserRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public PaginatedReviewResponse findByProduct(Integer productId, int page, int limit) {
        var pageRequest = PageRequest.of(page, limit);
        var reviews = reviewRepository.findAllReviewByProductId(productId, pageRequest);
        long totalReviews = reviewRepository.countReviewsByProductId(productId);
        int totalPages = (int) Math.ceil((double) totalReviews / limit);
        return new PaginatedReviewResponse(reviews, totalPages, page, totalReviews, limit);
    }

    @Override
    public ReviewStatsDTO getReviewStatsByProductId(Integer productId) {
        List<Object[]> result = reviewRepository.getReviewStatsCountsByProductId(productId);

        if (result.isEmpty()) {
            return new ReviewStatsDTO(0.0, 0, Arrays.asList(
                    new ReviewStatsDTO.StarDistributionItem(5, 0),
                    new ReviewStatsDTO.StarDistributionItem(4, 0),
                    new ReviewStatsDTO.StarDistributionItem(3, 0),
                    new ReviewStatsDTO.StarDistributionItem(2, 0),
                    new ReviewStatsDTO.StarDistributionItem(1, 0)
            ));
        }

        Object[] row = result.get(0);
        double averageRating = ((Number) row[0]).doubleValue();
        int star5 = ((Number) row[1]).intValue();
        int star4 = ((Number) row[2]).intValue();
        int star3 = ((Number) row[3]).intValue();
        int star2 = ((Number) row[4]).intValue();
        int star1 = ((Number) row[5]).intValue();

        int totalReviews = star5 + star4 + star3 + star2 + star1;

        List<ReviewStatsDTO.StarDistributionItem> distribution = new ArrayList<>();
        distribution.add(new ReviewStatsDTO.StarDistributionItem(5, star5));
        distribution.add(new ReviewStatsDTO.StarDistributionItem(4, star4));
        distribution.add(new ReviewStatsDTO.StarDistributionItem(3, star3));
        distribution.add(new ReviewStatsDTO.StarDistributionItem(2, star2));
        distribution.add(new ReviewStatsDTO.StarDistributionItem(1, star1));

        return new ReviewStatsDTO(averageRating, totalReviews, distribution);
    }

    @Override
    @Transactional
    public Review createReview(CreateReviewDTO createReviewDTO, Integer appUserId) {
        // Kiểm tra người dùng có tồn tại không
        AppUser appUser = appUserRepository.findById(appUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra người dùng có quyền đánh giá sản phẩm này không
        if (!canUserReviewProduct(appUserId, createReviewDTO.getProductId())) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sản phẩm đã mua và thanh toán thành công");
        }

        // Cho phép đánh giá nhiều lần - không kiểm tra đã đánh giá chưa

        // Tạo đánh giá mới
        Review review = new Review();
        review.setProductId(createReviewDTO.getProductId());
        review.setAppUserId(appUserId);
        review.setRating(createReviewDTO.getRating());
        review.setComment(createReviewDTO.getComment());
        review.setReviewDate(Instant.now());

        return reviewRepository.save(review);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserReviewProduct(Integer appUserId, Integer productId) {
        // Lấy danh sách đơn hàng của người dùng với trạng thái đã thanh toán
        AppUser appUser = appUserRepository.findById(appUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra đơn hàng với trạng thái Paid, Completed, Delivered
        List<Order> paidOrders = orderRepository.findByUserAndOrderStatusWithItems(appUser, "Paid");
        paidOrders.addAll(orderRepository.findByUserAndOrderStatusWithItems(appUser, "Completed"));
        paidOrders.addAll(orderRepository.findByUserAndOrderStatusWithItems(appUser, "Delivered"));

        // Kiểm tra trong các đơn hàng đã thanh toán có sản phẩm này không
        for (Order order : paidOrders) {
            for (OrderItem item : order.getOrderItems()) {
                try {
                    if (item.getVariant() != null && 
                        item.getVariant().getProduct() != null && 
                        item.getVariant().getProduct().getProductId() != null &&
                        item.getVariant().getProduct().getProductId().equals(productId)) {
                        return true;
                    }
                } catch (Exception e) {
                    // Log lỗi nếu có vấn đề với việc truy cập dữ liệu
                    System.err.println("Lỗi khi kiểm tra sản phẩm trong đơn hàng: " + e.getMessage());
                }
            }
        }

        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReviewedProduct(Integer appUserId, Integer productId) {
        return reviewRepository.existsByProductIdAndAppUserId(productId, appUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Review getUserReview(Integer appUserId, Integer productId) {
        return reviewRepository.findByProductIdAndAppUserIdWithUser(productId, appUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Integer, Review> getUserReviewsForProducts(Integer appUserId, List<Integer> productIds) {
        List<Object[]> results = reviewRepository.findReviewsByUserIdAndProductIds(appUserId, productIds);
        Map<Integer, Review> reviewsMap = new HashMap<>();

        for (Object[] result : results) {
            Integer productId = (Integer) result[0];
            Review review = (Review) result[1];
            reviewsMap.put(productId, review);
        }

        return reviewsMap;
    }


    //================= ONLINE ----------------------

//    public List<Integer> checkrevieweByOrder(Integer orderId) {
//       List<Integer> listPOroductId = orderItemRepository.findProductIdsByOrderId(orderId);
//
//       List review = reviewRepository.findAllByOrderId(orderId);
//
//       List<Integer> produictCanReview = new ArrayList<>();
//       for (Integer productId : listPOroductId) {
//           if (!review.getProductId().equals(productId)) {
//               produictCanReview.add(productId);
//           }
//
//       }
//       return produictCanReview;
//    }




    public Review createReviewOnline(CreateReviewDTO createReviewDTO, Integer appUserId, Integer orderId) {
        // Kiểm tra người dùng có tồn tại không
        AppUser appUser = appUserRepository.findById(appUserId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Kiểm tra người dùng có quyền đánh giá sản phẩm này không
        if (!canUserReviewProductOnline(orderId)){
            throw new RuntimeException("Bạn không thể đánh giá cho đơn hàng này");
        }

        // Cho phép đánh giá nhiều lần - không kiểm tra đã đánh giá chưa

        // Tạo đánh giá mới
        Review review = new Review();
        review.setProductId(createReviewDTO.getProductId());
        review.setAppUserId(appUserId);
        review.setRating(createReviewDTO.getRating());
        review.setComment(createReviewDTO.getComment());
        review.setReviewDate(Instant.now());
        review.setOrderId(orderId);

        return reviewRepository.save(review);
    }

    public List<Map<String, Object>> getListReviewByOrder(Integer orderId){
        List<Review> listReview = reviewRepository.findAllByOrderId(orderId);
        
        // Convert to DTO to avoid LazyInitializationException
        List<Map<String, Object>> reviewDTOs = new ArrayList<>();
        for (Review review : listReview) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", review.getId());
            dto.put("productId", review.getProductId());
            dto.put("appUserId", review.getAppUserId());
            dto.put("rating", review.getRating());
            dto.put("comment", review.getComment());
            dto.put("reviewDate", review.getReviewDate());
            dto.put("orderId", review.getOrderId());
            reviewDTOs.add(dto);
        }
        
        return reviewDTOs;
    }

    public boolean canUserReviewProductOnline(Integer orderId) {
        // Lấy đơn hàng theo orderId
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        System.out.println("Trạng thái đơn hàng: " + order.getOrderStatus());
        // Kiểm tra trạng thái đơn hàng (Completed hoặc Delivered)
        String status = order.getOrderStatus();
        if (!(status.equals("Completed") || status.equals("Delivered"))) {
            return false;
        }

        return true;
    }


}