package org.yellowcat.backend.online_selling.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SendMessageResponse {
    private Integer sessionId;
    private Integer messageId;
    private LocalDateTime timestamp;
    private String status;
    private ChatMessageDTO message;
}
