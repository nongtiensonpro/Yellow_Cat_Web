package org.yellowcat.backend.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "appusers")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "app_user_id")
    private Integer appUserId;

    @NotNull
    @Size(max = 255)
    @Column(name = "keycloak_user_id", unique = true, nullable = false)
    private String keycloakUserId;

    @NotNull
    @Email
    @Size(max = 255)
    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Size(max = 255)
    @Column(name = "full_name")
    private String fullName;

    @Size(max = 20)
    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Size(max = 255)
    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // Constructor mặc định cần thiết cho JPA
    public AppUser() {}

    // Constructor tùy chọn
    public AppUser(String keycloakUserId, String email, String fullName) {
        this.keycloakUserId = keycloakUserId;
        this.email = email;
        this.fullName = fullName;
    }

    // Thiết lập thời gian tạo và cập nhật khi insert
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    // Thiết lập thời gian cập nhật khi update
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
