package org.yellowcat.backend.product.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaffInfoResponse {
    private Integer appUserId;
    private UUID keycloakId;
    private String email;
    private List<String> roles;
    private Boolean enabled;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
} 