package org.yellowcat.backend.user;

import jakarta.persistence.*; // Hoặc import javax.persistence.* nếu bạn dùng Java EE/Jakarta EE cũ hơn
import java.time.LocalDateTime; // Để xử lý kiểu TIMESTAMP

@Entity // Đánh dấu đây là một JPA Entity
@Table(name = "app_users") // Ánh xạ tới bảng "app_users" trong cơ sở dữ liệu
public class AppUser {

    @Id // Đánh dấu là khóa chính
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Tự động tăng (SERIAL trong PostgreSQL)
    @Column(name = "app_user_id") // Ánh xạ tới cột "app_user_id"
    private Integer appUserId;

    @Column(name = "keycloak_user_id", unique = true, nullable = false, length = 255)
    private String keycloakUserId;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "phone_number", unique = true, length = 20)
    private String phoneNumber;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    // --- Constructors ---
    public AppUser() {
        // Constructor mặc định cần thiết cho JPA
    }

    public AppUser(String keycloakUserId, String email, String fullName) {
        this.keycloakUserId = keycloakUserId;
        this.email = email;
        this.fullName = fullName;
    }

    // --- Getters and Setters ---
    // Cần thiết để truy cập và sửa đổi các thuộc tính của Entity

    public Integer getAppUserId() {
        return appUserId;
    }

    public void setAppUserId(Integer appUserId) {
        this.appUserId = appUserId;
    }

    public String getKeycloakUserId() {
        return keycloakUserId;
    }

    public void setKeycloakUserId(String keycloakUserId) {
        this.keycloakUserId = keycloakUserId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // --- Optional: toString(), equals(), hashCode() methods ---
    // Rất hữu ích cho việc debug và làm việc với các collection

    @Override
    public String toString() {
        return "AppUser{" +
                "appUserId=" + appUserId +
                ", keycloakUserId='" + keycloakUserId + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", avatarUrl='" + avatarUrl + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    // equals() and hashCode() based on natural identity (e.g., keycloakUserId or email for new entities, appUserId for persisted ones)
    // For simplicity, you might omit them or generate them based on primary key after entity is persisted.
}