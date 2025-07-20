package org.yellowcat.backend.online_selling.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.yellowcat.backend.online_selling.chat.dto.ProductVariantGemini;
import org.yellowcat.backend.online_selling.chat.repository.ProductVariantOnlineRepository;
import org.yellowcat.backend.product.productvariant.dto.ProductVariantFilterDTO;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiChatBotService {
    private final ProductVariantOnlineRepository productVariantOnlineRepository;

    @Value("${gemini.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.builder().build();

    public String generateAnswer(String question) {
        List<ProductVariantGemini> products = productVariantOnlineRepository.findAllForGemini();

        // Debug log
        log.info("📦 Danh sách sản phẩm:");
        products.forEach(p -> log.info(p.toString()));

        String prompt = buildPrompt(question, products);
        log.info("📩 Prompt gửi đến Gemini:\n{}", prompt);

        try {
            return callGemini(prompt).get();
        } catch (Exception e) {
            log.error("❌ Lỗi khi gọi Gemini: {}", e.getMessage());
            return "Lỗi khi gọi Gemini";
        }
    }

    private String buildPrompt(String question, List<ProductVariantGemini> products) {
        StringBuilder builder = new StringBuilder();
        builder.append("""
        Bạn là một nhân viên bán hàng chuyên nghiệp. Trả lời ngắn gọn, chính xác theo danh sách sau.
        Không bịa thông tin nếu sản phẩm không có.

        Danh sách sản phẩm:
        """);

        for (ProductVariantGemini p : products) {
            builder.append(String.format("""
        {
            "Tên sản phẩm": "%s",
            "Hãng": "%s",
            "Loại": "%s",
            "Màu": "%s",
            "Size": "%s",
            "Giá": "%,.0f",
            "Khuyến mãi": "%,.0f",
            "Số lượng tồn": %d,
            "Chất liệu": "%s",
            "Đối tượng": "%s"
        }
        """,
                    p.getProductName(),
                    p.getBrand(),
                    p.getCategory(),
                    p.getColor(),
                    p.getSize(),
                    p.getPrice(),
                    p.getSalePrice() != null ? p.getSalePrice() : p.getPrice(),
                    p.getQuantityInStock(),
                    p.getMaterial(),
                    p.getTargetAudience()
            ));
        }

        builder.append("\nCâu hỏi của khách: ").append(question)
                .append("\nNếu không tìm thấy sản phẩm, hãy xin lỗi và đề xuất hỗ trợ.");

        return builder.toString();
    }

    private CompletableFuture<String> callGemini(String prompt) {
        return webClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent")
                .header("Content-Type", "application/json")
                .header("X-goog-api-key", apiKey)
                .bodyValue(Map.of("contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )))
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::extractText)
                .onErrorReturn("Xin lỗi, hệ thống đang gặp lỗi khi gọi Gemini.")
                .toFuture();
    }

    private String extractText(Map<?, ?> response) {
        try {
            var candidates = (List<?>) response.get("candidates");
            var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            var parts = (List<?>) content.get("parts");
            return (String) ((Map<?, ?>) parts.get(0)).get("text");
        } catch (Exception e) {
            return "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn.";
        }
    }
}
