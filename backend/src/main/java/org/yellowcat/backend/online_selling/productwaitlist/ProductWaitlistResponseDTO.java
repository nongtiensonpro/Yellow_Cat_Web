package org.yellowcat.backend.online_selling.productwaitlist;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductWaitlistResponseDTO {
    private String code;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String note;
    private String status;
    private LocalDateTime createdAt;

    public ProductWaitlistResponseDTO(ProductWaitlistRequest entity) {
        this.code = entity.getCode();
        this.fullName = entity.getFullName();
        this.phoneNumber = entity.getPhoneNumber();
        this.email = entity.getEmail();
        this.note = entity.getNote();
        this.status = entity.getStatus().toString();
        this.createdAt = entity.getCreatedAt();
    }
}
