package org.yellowcat.backend.online_selling.chat.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SendMessageRequest {
    private Integer sessionId;
    private String content;
    private UUID keycloakId;
}
