package org.yellowcat.backend.online_selling.gmail_sending;

import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.yellowcat.backend.online_selling.productwaitlist.ProductWaitlistItem;
import org.yellowcat.backend.online_selling.productwaitlist.ProductWaitlistRequest;
import org.yellowcat.backend.product.order.Order;
import org.yellowcat.backend.product.orderItem.OrderItem;
import org.yellowcat.backend.product.payment.PaymentRepository;
import org.yellowcat.backend.product.productvariant.ProductVariant;

import lombok.RequiredArgsConstructor;
import org.yellowcat.backend.user.AppUserRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final PaymentRepository paymentRepository;
    private final AppUserRepository appUserRepository;

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

    public void sendOrderStatusUpdateEmail(Order order, String fromStatus, String toStatus, String note) {
        try {
            System.out.println("Gửi mail khi cập nhật trạng thái ơn hàng");
            String customerEmail = appUserRepository.findById(order.getUser().getAppUserId()).get().getEmail();
//            String customerEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName();
            String orderCode = order.getOrderCode();


            String subject = "📦 Cập nhật trạng thái đơn hàng #" + orderCode;

            StringBuilder emailContent = new StringBuilder();
            emailContent.append("Xin chào ").append(customerName).append(",\n\n");
            emailContent.append("Đơn hàng của bạn #").append(orderCode).append(" đã được cập nhật trạng thái:\n\n");
            emailContent.append("📋 Trạng thái cũ: ").append(fromStatus).append("\n");
            emailContent.append("✅ Trạng thái mới: ").append(toStatus).append("\n");
            emailContent.append("📅 Thời gian: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");

            if (note != null && !note.trim().isEmpty()) {
                emailContent.append("📝 Ghi chú: ").append(note).append("\n");
            }

            emailContent.append("\n---\n");
            emailContent.append("Thông tin đơn hàng:\n");
            emailContent.append("Mã đơn: #").append(orderCode).append("\n");
            emailContent.append("Ngày đặt: ").append(order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("\n");
            emailContent.append("Tổng tiền: ").append(order.getSubTotalAmount()).append(" VNĐ\n");

            emailContent.append("\nChi tiết sản phẩm:\n");
            for (OrderItem item : order.getOrderItems()) {
                emailContent.append("- ").append(item.getVariant().getProduct().getProductName())
                        .append(" x").append(item.getQuantity())
                        .append(" - ").append(item.getTotalPrice()).append(" VNĐ\n");
            }

            emailContent.append("\nCảm ơn bạn đã mua hàng tại YellowCat!\n");
            emailContent.append("Nếu có thắc mắc, vui lòng liên hệ hotline: 1900 1234\n");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(customerEmail);
            message.setSubject(subject);
            message.setText(emailContent.toString());

            mailSender.send(message);

            log.info("Đã gửi email thông báo cập nhật trạng thái cho đơn hàng {} đến {}", orderCode, customerEmail);

        } catch (Exception e) {
            log.error("Lỗi khi gửi email thông báo cho đơn hàng {}: {}", order.getOrderId(), e.getMessage(), e);
            // Không throw exception để không ảnh hưởng đến quá trình chính
        }
    }

    public void sendNewOrderConfirmationEmail(Order order) {
        try {
            String customerEmail = order.getUser().getEmail();
            String customerName = order.getUser().getFullName();
            String orderCode = order.getOrderCode();

            String subject = "✅ Xác nhận đơn hàng #" + orderCode;

            StringBuilder emailContent = new StringBuilder();
            emailContent.append("Xin chào ").append(customerName).append(",\n\n");
            emailContent.append("Cảm ơn bạn đã đặt hàng tại YellowCat!\n\n");
            emailContent.append("📦 Thông tin đơn hàng:\n");
            emailContent.append("Mã đơn: #").append(orderCode).append("\n");
            emailContent.append("Ngày đặt: ").append(order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
            emailContent.append("Trạng thái: ").append(order.getOrderStatus()).append("\n");
            emailContent.append("Phí ship: ").append(order.getShippingFee()).append("\n");
            emailContent.append("Tổng tiền: ").append(order.getFinalAmount()).append(" VNĐ\n");

            emailContent.append("\n📋 Chi tiết sản phẩm:\n");
            for (OrderItem item : order.getOrderItems()) {
                emailContent.append("- ").append(item.getVariant().getProduct().getProductName())
                        .append(" x").append(item.getQuantity())
                        .append(" - ").append(item.getTotalPrice()).append(" VNĐ\n");
            }

            emailContent.append("\n🏠 Địa chỉ giao hàng:\n");
            if (order.getShippingAddress() != null) {
                emailContent.append(order.getShippingAddress().getRecipientName()).append("\n");
                emailContent.append(order.getShippingAddress().getPhoneNumber()).append("\n");
                emailContent.append(order.getShippingAddress().getDistrict()).append(", ");
                emailContent.append(order.getShippingAddress().getStreetAddress()).append(", ");
                emailContent.append(order.getShippingAddress().getDistrict()).append(", ");
                emailContent.append(order.getShippingAddress().getCityProvince()).append("\n");
            }

            String paymenmethod = paymentRepository.findByOrder(order).getPaymentMethod();
            String paymenstatus = paymentRepository.findByOrder(order).getPaymentStatus();

            emailContent.append("\n💳 Phương thức thanh toán:\n");
            emailContent.append(paymenmethod);
            emailContent.append("\n💳 Trạng thái thanh toán:\n");
            emailContent.append(paymenstatus);

            emailContent.append("\n\n📞 Liên hệ hỗ trợ:\n");
            emailContent.append("Hotline: 1900 1234\n");
            emailContent.append("Email: support@yellowcat.com\n");
            emailContent.append("Thời gian làm việc: 8:00 - 22:00 hàng ngày\n");

            emailContent.append("\nCảm ơn bạn đã tin tưởng YellowCat!\n");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(customerEmail);
            message.setSubject(subject);
            message.setText(emailContent.toString());

            mailSender.send(message);

            log.info("Đã gửi email xác nhận đơn hàng mới {} đến {}", orderCode, customerEmail);

        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác nhận đơn hàng {}: {}", order.getOrderId(), e.getMessage(), e);
        }
    }

}
