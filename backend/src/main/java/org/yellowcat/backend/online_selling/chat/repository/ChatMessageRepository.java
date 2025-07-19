package org.yellowcat.backend.online_selling.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.online_selling.chat.entity.ChatMessage;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    Optional<ChatMessage> findFirstBySessionIdOrderByTimestampDesc(Integer sessionId);
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(Integer sessionId);
}
