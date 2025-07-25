package org.yellowcat.backend.online_selling.chat.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.common.config_api.exception.ResourceNotFoundException;
import org.yellowcat.backend.online_selling.chat.dto.*;
import org.yellowcat.backend.online_selling.chat.entity.ChatMessage;
import org.yellowcat.backend.online_selling.chat.entity.ChatSession;
import org.yellowcat.backend.online_selling.chat.repository.ChatMessageRepository;
import org.yellowcat.backend.online_selling.chat.repository.ChatSessionRepository;
import org.yellowcat.backend.user.AppUser;
import org.yellowcat.backend.user.AppUserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final AppUserRepository appUserRepository;

    @Transactional
    public SendMessageResponse processMessage(SendMessageRequest request) {
        System.out.println("(1) [START] Processing message request: " + request);

        validateRequest(request);
        System.out.println("(2) Request validated successfully");

        ChatSession session = resolveSession(request);
        System.out.println("(3) Session resolved: " + session.getId());

        ChatMessage message = createMessage(request, session);
        System.out.println("(4) Message created: " + message.getContent());

        // Xử lý phân loại người gửi (Updated logic)
        if (request.getKeycloakId() != null) {
            System.out.println("(5) Looking up user by Keycloak ID: " + request.getKeycloakId());
            Optional<AppUser> senderOptional = appUserRepository.findByKeycloakId(request.getKeycloakId());

            if (senderOptional.isPresent()) {
                AppUser sender = senderOptional.get();
                message.setSender(sender);
                message.setSenderType(determineSenderType(sender));
                System.out.println("(6) Sender identified: " + sender.getAppUserId() + " (Type: " + message.getSenderType() + ")");
                updateSessionWithSenderInfo(session, sender);
            } else {
                System.out.println("(6) User not found. Treating as guest.");
                message.setSenderType("GUEST");
            }
        } else {
            System.out.println("(5) Guest message detected (no KeycloakID)");
            message.setSenderType("GUEST");
        }

        messageRepository.save(message);
        System.out.println("(7) Message saved: ID " + message.getId());

        SendMessageResponse response = buildResponse(session, message);
        System.out.println("(9) [END] Returning response: " + response);
        return response;
    }

    /**
     * Phân loại người gửi theo quyền mới:
     * - STAFF: Có quyền Admin_Web hoặc Staff_Web
     * - CUSTOMER: Có quyền default-roles-yellowcat-company
     * - GUEST: Không đăng nhập hoặc không có quyền phù hợp
     */
    private String determineSenderType(AppUser user) {
        if (user == null) {
            return "GUEST";
        }

        if (user.getRoles().contains("Admin_Web") || user.getRoles().contains("Staff_Web")) {
            return "STAFF";
        }
        else if (user.getRoles().contains("default-roles-yellowcat-company")) {
            return "CUSTOMER";
        }

        return "GUEST";
    }

    private void updateSessionWithSenderInfo(ChatSession session, AppUser sender) {
        System.out.println("Updating session with sender info: " + sender.getAppUserId());
        String senderType = determineSenderType(sender);

        if ("STAFF".equals(senderType)) {
            if (session.getStaff() == null) {
                System.out.println("Assigning staff to session: " + sender.getAppUserId());
                session.setStaff(sender);
                session.setStatus("IN_PROGRESS");
                session.setAssignedAt(LocalDateTime.now());
            }
        } else if ("CUSTOMER".equals(senderType)) {
            if (session.getCustomer() == null) {
                System.out.println("Setting customer for session: " + sender.getAppUserId());
                session.setCustomer(sender);
            }
        }
        sessionRepository.save(session);
        System.out.println("Session updated: " + session.getId());
    }

    @Transactional
    public void assignStaffToSessionByKeycloakId(Integer sessionId, UUID staffKeycloakId) {
        System.out.println("[ASSIGN STAFF] Starting assignment by Keycloak ID. Session: " + sessionId + ", StaffKeycloak: " + staffKeycloakId);
        AppUser staff = appUserRepository.findByKeycloakId(staffKeycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        assignStaffToSession(sessionId, staff);
    }

    @Transactional
    public void assignStaffToSession(Integer sessionId, AppUser staff) {
        System.out.println("[ASSIGN STAFF] Assigning staff " + staff.getAppUserId() + " to session " + sessionId);

        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    System.err.println("Session not found: " + sessionId);
                    return new ResourceNotFoundException("Session not found");
                });

        if (session.getStaff() != null) {
            System.out.println("WARN: Session " + sessionId + " already assigned to staff " + session.getStaff().getAppUserId());
            throw new IllegalStateException("Session already assigned");
        }

        session.setStaff(staff);
        session.setStatus("IN_PROGRESS");
        session.setAssignedAt(LocalDateTime.now());
        sessionRepository.save(session);

        System.out.println("[ASSIGN STAFF] Successfully assigned staff " + staff.getAppUserId() + " to session " + sessionId);
    }

    // Các phương thức còn lại giữ nguyên không thay đổi
    private ChatSession resolveSession(SendMessageRequest request) {
        if (request.getSessionId() != null) {
            System.out.println("Resolving existing session: " + request.getSessionId());
            return sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        } else {
            System.out.println("Creating new session for request");
            return createNewSession(request);
        }
    }

    private ChatSession createNewSession(SendMessageRequest request) {
        System.out.println("Creating NEW chat session");
        ChatSession newSession = new ChatSession();
        newSession.setStatus("WAITING");
        newSession.setCreatedAt(LocalDateTime.now());

        if (request.getKeycloakId() != null) {
            System.out.println("Linking customer to new session: " + request.getKeycloakId());
            appUserRepository.findByKeycloakId(request.getKeycloakId())
                    .ifPresent(user -> {
                        newSession.setCustomer(user);
                        System.out.println("Customer linked: " + user.getAppUserId());
                    });
        }

        ChatSession savedSession = sessionRepository.save(newSession);
        System.out.println("New session created: ID " + savedSession.getId());
        return savedSession;
    }

    private ChatMessage createMessage(SendMessageRequest request, ChatSession session) {
        System.out.println("Creating message for session " + session.getId());
        ChatMessage message = new ChatMessage();
        message.setSession(session);
        message.setContent(request.getContent());
        message.setTimestamp(LocalDateTime.now());
        return message;
    }

    public ChatSessionDTO getSessionDetails(Integer sessionId) {
        System.out.println("Fetching session details: " + sessionId);
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        return buildSessionDTO(session);
    }

    public List<ChatSessionDTO> getWaitingSessions() {
        System.out.println("Fetching all WAITING sessions");
        return sessionRepository.findByStatus("WAITING").stream()
                .map(this::buildSessionDTO)
                .collect(Collectors.toList());
    }

    private ChatSessionDTO buildSessionDTO(ChatSession session) {
        System.out.println("Building session DTO for session: " + session.getId());
        ChatMessageDTO lastMessage = messageRepository.findFirstBySessionIdOrderByTimestampDesc(session.getId())
                .map(this::buildMessageDTO)
                .orElse(null);

        return ChatSessionDTO.builder()
                .id(session.getId())
                .customerId(session.getCustomer() != null ? session.getCustomer().getAppUserId() : null)
                .staffId(session.getStaff() != null ? session.getStaff().getAppUserId() : null)
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .assignedAt(session.getAssignedAt())
                .lastMessage(lastMessage)
                .build();
    }

    private ChatMessageDTO buildMessageDTO(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .senderId(message.getSender() != null ? message.getSender().getAppUserId() : null)
                .content(message.getContent())
                .senderType(message.getSenderType())
                .timestamp(message.getTimestamp())
                .build();
    }

    private SendMessageResponse buildResponse(ChatSession session, ChatMessage message) {
        String status = session.getCustomer() != null ? "USER_SESSION" : "GUEST_SESSION";
        System.out.println("Building response. Session status: " + status);

        return SendMessageResponse.builder()
                .sessionId(session.getId())
                .messageId(message.getId())
                .timestamp(message.getTimestamp())
                .status(status)
                .message(buildMessageDTO(message))
                .build();
    }

    private void validateRequest(SendMessageRequest request) {
        System.out.println("Validating send message request");
        if (request.getContent() == null || request.getContent().isBlank()) {
            System.err.println("Validation failed: Empty message content");
            throw new IllegalArgumentException("Message content cannot be empty");
        }
    }

    @Transactional
    public List<ChatSessionDTO> getAllSessions() {
        System.out.println("Fetching ALL sessions");
        return sessionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::buildSessionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ChatMessageDTO> getAllMessagesBySessionId(Integer sessionId) {
        System.out.println("Fetching messages for session: " + sessionId);
        if (!sessionRepository.existsById(sessionId)) {
            System.err.println("Session not found: " + sessionId);
            throw new ResourceNotFoundException("Session not found");
        }

        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId).stream()
                .map(this::buildMessageDTO)
                .collect(Collectors.toList());
    }
}