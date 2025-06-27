package org.yellowcat.backend.product.order.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface OrderWithStaffProjection {
    Integer getOrderId();
    String getOrderCode();
    String getPhoneNumber();
    String getCustomerName();
    BigDecimal getSubTotalAmount();
    BigDecimal getDiscountAmount();
    BigDecimal getFinalAmount();
    String getOrderStatus();
    Integer getAppUserId();
    
    // Staff information
    UUID getStaffKeycloakId();
    String getStaffEmail();
    String getStaffRoles(); // This will be a JSON string that needs parsing
    Boolean getStaffEnabled();
    String getStaffFullName();
    String getStaffPhoneNumber();
    String getStaffAvatarUrl();
} 