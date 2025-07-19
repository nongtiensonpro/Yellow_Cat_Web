package org.yellowcat.backend.online_selling.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.yellowcat.backend.online_selling.chat.service.GeminiChatBotService;

import java.util.Map;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/api/bot")
@RequiredArgsConstructor
public class GeminiBotRestController {
    private final GeminiChatBotService botService;

    @PostMapping("/chat")
    public ResponseEntity<String> chatWithBot(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        return ResponseEntity.ok(botService.generateAnswer(question));
    }

    @GetMapping("/chat")
    public ResponseEntity<String> handleGetChat() {
        return ResponseEntity.badRequest().body("Vui lòng gửi yêu cầu bằng POST với JSON { \"question\": \"...\" }");
    }

}
