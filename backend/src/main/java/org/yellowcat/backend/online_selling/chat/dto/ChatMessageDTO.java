package org.yellowcat.backend.online_selling.chat.dto;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageDTO {

    private Integer id;

    private Integer sessionId;

    private Integer senderId;

    private String content;

    private String senderType;

    private LocalDateTime timestamp;
}
