package org.yellowcat.backend.user;


import jakarta.persistence.*; // Hoặc import javax.persistence.* nếu bạn dùng Java EE/Jakarta EE cũ hơn
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime; // Để xử lý kiểu TIMESTAMP
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "app_users")
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

