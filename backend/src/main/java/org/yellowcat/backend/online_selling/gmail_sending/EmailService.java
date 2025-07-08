package org.yellowcat.backend.online_selling.gmail_sending;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.productwaitlist.ProductWaitlistItem;
import org.yellowcat.backend.online_selling.productwaitlist.ProductWaitlistRequest;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import lombok.RequiredArgsConstructor;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendProductAvailableNotification(ProductWaitlistRequest request, List<ProductWaitlistItem> availableItems) {
        StringBuilder sb = new StringBuilder();
        sb.append("Xin chào ").append(request.getFullName()).append(",\n\n");
        sb.append("Một số sản phẩm trong yêu cầu chờ hàng của bạn đã có sẵn:\n");

        for (ProductWaitlistItem item : availableItems) {
            var variant = item.getProductVariant();
            sb.append("- ").append(variant.getProduct().getProductName())
                    .append(" (Còn lại: ").append(variant.getQuantityInStock())
                    .append(", Bạn cần: ").append(item.getDesiredQuantity())
                    .append(")\n");
        }

        sb.append("\nVui lòng truy cập để đặt hàng sớm trước khi hết hàng.\nCảm ơn bạn!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getEmail());
        message.setSubject("Sản phẩm trong danh sách chờ đã có hàng!");
        message.setText(sb.toString());

        mailSender.send(message);
    }


    public void sendStatusUpdateNotification(ProductWaitlistRequest request, String messageTitle, String messageBody) {
        String email = request.getEmail();
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(messageTitle);

        message.setText("Xin chào " + request.getFullName() + ",\n\n"
                + messageBody + "\n\n"
                + "Mã theo dõi yêu cầu của bạn là: " + request.getCode() + "\n\n"
                + "Trân trọng,\nYellowCat Team");

        mailSender.send(message);
    }

    public void sendCancellationNotification(ProductWaitlistRequest request) {
        sendStatusUpdateNotification(
                request,
                "❌ Phiếu chờ của bạn đã bị huỷ",
                "Rất tiếc, phiếu yêu cầu sản phẩm bạn đã gửi đã bị huỷ do không đủ hàng tồn kho hoặc quá hạn xử lý trong 3 ngày.\n"
                        + "Nếu bạn vẫn quan tâm đến sản phẩm, hãy đăng ký lại hoặc liên hệ với chúng tôi."
        );
    }

    public void sendManualUpdateNotification(ProductWaitlistRequest request, String newStatus) {
        sendStatusUpdateNotification(
                request,
                "🔄 Cập nhật trạng thái phiếu chờ",
                "Trạng thái của phiếu chờ của bạn đã được cập nhật sang: *" + newStatus + "*.\n"
                        + "Vui lòng kiểm tra lại chi tiết trên hệ thống để biết thêm thông tin."
        );
    }

}
