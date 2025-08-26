package org.yellowcat.backend.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "app_users")
@Getter
@Setter
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "app_user_id", nullable = false)
    private Integer appUserId;


    @Column(name = "keycloak_id", nullable = true)
    private UUID keycloakId;

    @Column(name = "username")
    private String username;

    @Column(name = "email", nullable = false, unique = true)
    private String email;


    @Column(name = "roles")
    private List<String> roles;

    @Column(name = "enabled")
    private Boolean enabled;

    @Size(max = 255)
    @Column(name = "full_name")
    private String fullName;

    @Size(max = 20)
    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Size(max = 255)
    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}