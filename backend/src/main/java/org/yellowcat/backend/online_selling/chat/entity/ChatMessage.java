package org.yellowcat.backend.online_selling.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import org.yellowcat.backend.user.AppUser;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @Column(columnDefinition = "INT")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @ToString.Exclude
    private ChatSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private AppUser sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "sender_type", length = 50)
    private String senderType;

    private LocalDateTime timestamp;
}