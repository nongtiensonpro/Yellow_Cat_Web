// PaginatedReviewResponse.java
package org.yellowcat.backend.product.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaginatedReviewResponse {
    private List<ReviewDTO> reviews;
    private int totalPages;
    private int currentPage;
    private long totalReviews;
    private int pageSize;
}

