package org.yellowcat.backend.online_selling.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.common.config_api.exception.ResourceNotFoundException;
import org.yellowcat.backend.online_selling.chat.dto.*;
import org.yellowcat.backend.online_selling.chat.service.ChatService;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AppUserRepository appUserRepository;

    // ---------- REST API ----------

    @PostMapping("/send")
    public SendMessageResponse sendCustomerMessage(@RequestBody SendMessageRequest request) {
        SendMessageResponse response = chatService.processMessage(request);

        broadcastMessage(response.getSessionId(), response.getMessage());
        broadcastNewSession(response);

        return response;
    }

    @PostMapping("/staff/send")
    public SendMessageResponse sendStaffMessage(
            @RequestHeader("X-Staff-Keycloak-Id") UUID staffKeycloakId,
            @RequestBody StaffSendMessageRequest request) {

        validateStaffInSession(request.getSessionId(), staffKeycloakId);

        SendMessageRequest sendRequest = SendMessageRequest.builder()
                .sessionId(request.getSessionId())
                .content(request.getContent())
                .keycloakId(staffKeycloakId)
                .build();

        SendMessageResponse response = chatService.processMessage(sendRequest);
        broadcastMessage(request.getSessionId(), response.getMessage());
        return response;
    }

    // ---------- WebSocket Handlers ----------

    @MessageMapping("/customer/chat.send")
    public void handleCustomerMessage(@Payload SendMessageRequest request) {
        SendMessageResponse response = chatService.processMessage(request);

        broadcastMessage(response.getSessionId(), response.getMessage());
        broadcastNewSession(response);
    }

    @MessageMapping("/staff/chat.send")
    public void handleStaffMessage(
            @Payload StaffSendMessageRequest request,
            @Header("simpSessionAttributes") Map<String, Object> attributes) {

        UUID staffKeycloakId = (UUID) attributes.get("keycloakId");
        validateStaffInSession(request.getSessionId(), staffKeycloakId);

        SendMessageRequest sendRequest = SendMessageRequest.builder()
                .sessionId(request.getSessionId())
                .content(request.getContent())
                .keycloakId(staffKeycloakId)
                .build();

        SendMessageResponse response = chatService.processMessage(sendRequest);
        broadcastMessage(request.getSessionId(), response.getMessage());
    }

    // ---------- Helper Methods ----------

    private void broadcastNewSession(SendMessageResponse response) {
        if ("GUEST_SESSION".equals(response.getStatus()) || "USER_SESSION".equals(response.getStatus())) {
            messagingTemplate.convertAndSend("/topic/chat/new-sessions",
                    chatService.getSessionDetails(response.getSessionId()));
        }
    }

    private void broadcastMessage(Integer sessionId, ChatMessageDTO message) {
        if (message != null && sessionId != null) {
            messagingTemplate.convertAndSend("/topic/chat/sessions/" + sessionId + "/messages", message);
        }
    }

    private void validateStaffInSession(Integer sessionId, UUID staffKeycloakId) {
        ChatSessionDTO session = chatService.getSessionDetails(sessionId);

        if (session.getStaffId() == null) {
            throw new IllegalStateException("Session not assigned to any staff");
        }

        AppUser staff = appUserRepository.findByKeycloakId(staffKeycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (!session.getStaffId().equals(staff.getAppUserId())) {
            throw new SecurityException("Staff not assigned to this session");
        }
    }

    // ---------- Other Endpoints (Giữ nguyên) ----------

    @GetMapping("/sessions/waiting")
    public List<ChatSessionDTO> getWaitingSessions() {
        return chatService.getWaitingSessions();
    }

    @GetMapping("/sessions")
    public List<ChatSessionDTO> getAllSessions() {
        return chatService.getAllSessions();
    }

    @GetMapping("/sessions/{sessionId}")
    public ChatSessionDTO getSessionDetails(@PathVariable Integer sessionId) {
        return chatService.getSessionDetails(sessionId);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<ChatMessageDTO> getAllMessagesBySessionId(@PathVariable Integer sessionId) {
        return chatService.getAllMessagesBySessionId(sessionId);
    }

    @PostMapping("/sessions/{sessionId}/assign")
    public void assignStaffToSession(
            @RequestHeader("X-Staff-Keycloak-Id") UUID staffKeycloakId,
            @PathVariable Integer sessionId) {
        chatService.assignStaffToSessionByKeycloakId(sessionId, staffKeycloakId);

        // Broadcast cập nhật trạng thái session
        messagingTemplate.convertAndSend("/topic/chat/session-updates",
                chatService.getSessionDetails(sessionId));
    }
}