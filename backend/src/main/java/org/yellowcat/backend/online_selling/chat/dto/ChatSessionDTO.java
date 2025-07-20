package org.yellowcat.backend.online_selling.chat.dto;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatSessionDTO {

    private Integer id;


    private Integer customerId;


    private Integer staffId;


    private String status;


    private LocalDateTime createdAt;


    private LocalDateTime assignedAt;


    private ChatMessageDTO lastMessage;
}
