package org.yellowcat.backend.online_selling.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.chat.entity.ChatSession;
import org.yellowcat.backend.user.AppUser;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Integer> {
    List<ChatSession> findByStatus(String status); // Thêm phương thức này
    List<ChatSession> findAllByOrderByCreatedAtDesc();
}
