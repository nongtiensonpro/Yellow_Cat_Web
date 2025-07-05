[![Dependabot Updates](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/dependabot/dependabot-updates) [![Build Check (FE & BE)](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/build-check.yml/badge.svg)](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/build-check.yml)[![CodeQL Advanced](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/codeql.yml/badge.svg)](https://github.com/nongtiensonpro/Yellow_Cat_Web/actions/workflows/codeql.yml)


# Sneak_Peak

## Giới thiệu

Sneak_Peak là một **hệ thống thương mại điện tử (E-commerce)** hoặc **nền tảng quản lý bán hàng trực tuyến** toàn diện, được thiết kế để cung cấp một giải pháp đầy đủ cho việc quản lý sản phẩm, bán hàng, thanh toán, vận chuyển, và quản lý người dùng. Dự án này được xây dựng với kiến trúc phân tán rõ ràng, bao gồm các thành phần backend và frontend riêng biệt, đảm bảo khả năng mở rộng, hiệu suất cao và dễ dàng bảo trì. Sneak_Peak tập trung vào việc cung cấp trải nghiệm người dùng mượt mà và hiệu quả, đồng thời trang bị các công cụ quản lý mạnh mẽ cho quản trị viên, giúp tối ưu hóa quy trình kinh doanh trực tuyến.




## Tính năng chính

Dự án Sneak_Peak cung cấp một loạt các tính năng mạnh mẽ, bao gồm:

*   **Quản lý sản phẩm toàn diện**: Cho phép thêm, sửa, xóa sản phẩm, quản lý biến thể sản phẩm, danh mục, thuộc tính và thông tin chi tiết.
*   **Hệ thống giảm giá và khuyến mãi**: Hỗ trợ tạo và quản lý các chương trình giảm giá, khuyến mãi linh hoạt, bao gồm cả giảm giá theo sản phẩm cụ thể.
*   **Dashboard quản trị viên**: Cung cấp giao diện trực quan cho quản trị viên để theo dõi và quản lý các hoạt động của hệ thống, bao gồm các số liệu thống kê và báo cáo về doanh thu, đơn hàng, sản phẩm bán chạy.
*   **Tích hợp thanh toán đa dạng**: Hỗ trợ thanh toán trực tuyến an toàn và tiện lợi thông qua cổng **ZaloPay** và **VNPay**.
*   **Quản lý hóa đơn với Timeline**: Cung cấp tính năng timeline chi tiết cho mỗi hóa đơn, giúp dễ dàng theo dõi trạng thái và lịch sử giao dịch.
*   **Quản lý vận chuyển**: Tích hợp với dịch vụ giao hàng **Giao Hàng Tiết Kiệm (GHTK)** để quản lý và theo dõi quá trình vận chuyển đơn hàng.
*   **Quản lý người dùng và xác thực**: Đảm bảo quản lý người dùng hiệu quả và an toàn thông qua tích hợp với **Keycloak**, bao gồm cả việc đồng bộ thông tin người dùng khi đăng nhập, quản lý thông tin cá nhân, vai trò và quyền hạn.
*   **Giao tiếp thời gian thực**: Hỗ trợ **WebSockets** cho các tính năng như thông báo đơn hàng, chat hỗ trợ, hoặc cập nhật trạng thái tức thì.
*   **Quản lý địa chỉ**: Hỗ trợ quản lý địa chỉ của người dùng và có thể tích hợp với các API địa chỉ bên ngoài.
*   **Giao diện người dùng thân thiện**: Frontend được thiết kế để cung cấp trải nghiệm mua sắm và tương tác mượt mà, dễ sử dụng.
*   **CI/CD với Github Actions**: Tự động hóa quy trình kiểm tra và triển khai ứng dụng, đảm bảo chất lượng và tốc độ phát triển.




## Cấu trúc dự án

Dự án Sneak_Peak được tổ chức thành các thư mục chính sau:

*   `.github/workflows`: Chứa các cấu hình cho GitHub Actions, tự động hóa quy trình CI/CD.
*   `backend/`: Chứa toàn bộ mã nguồn và cấu hình cho phần backend của ứng dụng. Được xây dựng bằng Spring Boot.
    *   `src/main/java/org/yellowcat/backend/`: Mã nguồn Java chính của backend, được chia thành các module chức năng như `address`, `online_selling`, `product`, `user`, `statistics`, `vnpay`, `zalopay`, `GHTK`, `config`, `common`, `CallApiAddress`.
    *   `src/main/resources/`: Chứa các file cấu hình như `application.properties`, `application.yml` và các script cơ sở dữ liệu (Flyway).
*   `fontend/`: Chứa toàn bộ mã nguồn và cấu hình cho phần frontend của ứng dụng. Được xây dựng bằng Next.js và ReactJS.
    *   `app/`: Các trang chính của ứng dụng.
    *   `components/`: Các thành phần UI có thể tái sử dụng.
    *   `services/`: Các dịch vụ gọi API backend.
    *   `public/`: Các tài nguyên tĩnh.
*   `deployment/`: Chứa các script hoặc cấu hình liên quan đến việc triển khai ứng dụng.
*   `LICENSE`: File giấy phép của dự án (MIT License).
*   `key.txt`: Có thể chứa các khóa API hoặc thông tin cấu hình nhạy cảm khác.
*   `realm-export.json`: Có thể là file xuất cấu hình từ Keycloak hoặc dữ liệu liên quan đến quản lý người dùng.




## Cài đặt và Sử dụng

Để cài đặt và chạy dự án Sneak_Peak trên môi trường cục bộ, bạn cần thực hiện các bước sau:

### Yêu cầu hệ thống

*   **Node.js** (phiên bản khuyến nghị cho Frontend)
*   **Java Development Kit (JDK)** (phiên bản 17 hoặc cao hơn cho Backend)
*   **Gradle** (được sử dụng bởi Backend)
*   **PostgreSQL** (Hệ quản trị cơ sở dữ liệu)
*   **Keycloak** (Server xác thực và quản lý danh tính)

### Cài đặt Backend

1.  **Clone repository:**

    ```bash
    git clone https://github.com/nongtiensonpro/Yellow_Cat_Web.git
    cd Yellow_Cat_Web/backend
    ```

2.  **Cấu hình cơ sở dữ liệu và Keycloak:**

    *   Tạo một cơ sở dữ liệu PostgreSQL mới và cập nhật thông tin kết nối trong file `application.yml` hoặc `application.properties` trong thư mục `src/main/resources`.
    *   Thiết lập Keycloak server và tạo một realm `yellowcat` với client `backend-client`. Cập nhật các thông tin liên quan đến Keycloak trong cấu hình backend (xem `application.yml`).

3.  **Build và chạy ứng dụng Backend:**

    ```bash
    ./gradlew clean build
    java -jar build/libs/backend-0.0.1-SNAPSHOT.jar # Tên file .jar có thể khác tùy phiên bản
    ```

    Backend sẽ chạy trên cổng mặc định (thường là 8080).

### Cài đặt Frontend

1.  **Di chuyển đến thư mục frontend:**

    ```bash
    cd ../fontend
    ```

2.  **Cài đặt các dependencies:**

    ```bash
    npm install
    # Hoặc yarn install
    ```

3.  **Cấu hình môi trường:**

    *   Tạo file `.env.local` (nếu chưa có) trong thư mục `fontend` và cấu hình các biến môi trường cần thiết, ví dụ như URL của backend API và Keycloak.

4.  **Chạy ứng dụng Frontend:**

    ```bash
    npm run dev
    # Hoặc yarn dev
    ```

    Frontend sẽ chạy trên cổng mặc định (thường là 3000).

### Sử dụng ứng dụng

Sau khi cả backend và frontend đều đang chạy, bạn có thể truy cập ứng dụng thông qua trình duyệt tại địa chỉ `http://localhost:3000` (hoặc cổng mà frontend đang chạy).




## Công nghệ sử dụng

Dự án Sneak_Peak được xây dựng bằng cách sử dụng các công nghệ và framework sau:

### Backend (Spring Boot, Java 17)

*   **Spring Boot**: Nền tảng phát triển ứng dụng Java nhanh chóng và hiệu quả.
*   **Spring Data JPA**: Giúp quản lý dữ liệu với cơ sở dữ liệu quan hệ một cách dễ dàng.
*   **Spring Security & OAuth2**: Đảm bảo an toàn cho ứng dụng, hỗ trợ xác thực và ủy quyền dựa trên OAuth2.
*   **Keycloak**: Tích hợp chặt chẽ với Keycloak để quản lý người dùng, xác thực và phân quyền.
*   **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ và ổn định.
*   **ZaloPay API & VNPay API**: Tích hợp các cổng thanh toán trực tuyến phổ biến tại Việt Nam.
*   **Springdoc OpenAPI (Swagger)**: Tự động tạo tài liệu API tương tác, giúp dễ dàng kiểm thử và hiểu các API.
*   **WebSockets**: Hỗ trợ giao tiếp hai chiều giữa client và server, có thể dùng cho các tính năng thời gian thực như thông báo.
*   **Lombok**: Giảm thiểu boilerplate code trong Java.
*   **MapStruct**: Thư viện ánh xạ đối tượng giữa các lớp Java.
*   **Spring Retry & Resilience4j**: Cung cấp khả năng chịu lỗi và phục hồi cho ứng dụng.
*   **Logback & Logstash**: Hệ thống ghi log mạnh mẽ.
*   **FlywayDB**: Quản lý phiên bản cơ sở dữ liệu.
*   **HikariCP**: Connection pool hiệu suất cao.
*   **JSON**: Xử lý dữ liệu JSON.

### Frontend (Next.js, ReactJS)

*   **Next.js**: Framework React cho các ứng dụng web, hỗ trợ Server-Side Rendering (SSR) và Static Site Generation (SSG).
*   **ReactJS**: Thư viện JavaScript để xây dựng giao diện người dùng.
*   **Tailwind CSS**: Framework CSS tiện ích để xây dựng giao diện nhanh chóng.
*   **Heroicons, Tabler Icons, Lucide React, React Icons**: Các thư viện icon.
*   **Axios**: Thư viện HTTP client để thực hiện các yêu cầu API.
*   **Framer Motion**: Thư viện animation cho React.
*   **NextAuth.js**: Thư viện xác thực cho Next.js.
*   **Next-Cloudinary**: Tích hợp Cloudinary để quản lý hình ảnh.
*   **Zustand**: Thư viện quản lý trạng thái.
*   **Stomp.js & SockJS-Client**: Hỗ trợ WebSockets cho các tính năng thời gian thực.
*   **JWT-decode & jsonwebtoken**: Xử lý JSON Web Tokens.
*   **TypeScript**: Ngôn ngữ lập trình được sử dụng để phát triển frontend.

### Khác

*   **Git/GitHub**: Hệ thống kiểm soát phiên bản và nền tảng lưu trữ mã nguồn.
*   **GitHub Actions**: Để tự động hóa quy trình CI/CD.




## Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng để cải thiện dự án Yellow_Cat_Web. Nếu bạn muốn đóng góp, vui lòng làm theo các bước sau:

1.  Fork repository này.
2.  Tạo một branch mới cho tính năng hoặc sửa lỗi của bạn (`git checkout -b feature/your-feature-name` hoặc `bugfix/your-bug-name`).
3.  Thực hiện các thay đổi của bạn và commit chúng (`git commit -m 'feat: Add your new feature'` hoặc `fix: Fix your bug`).
4.  Push các thay đổi lên branch của bạn (`git push origin feature/your-feature-name`).
5.  Mở một Pull Request (PR) đến branch `main` của repository gốc.

Vui lòng đảm bảo rằng mã của bạn tuân thủ các quy ước mã hóa hiện có và đã được kiểm tra kỹ lưỡng.




## Bản quyền

Dự án này được cấp phép theo Giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## Liên hệ

Mọi thắc mắc hoặc góp ý, vui lòng liên hệ với chúng tôi qua:

*   **Email**: [nongtiensonpro@gmail.com](mailto:nongtiensonpro@gmail.com)
*   **Github Issues**: [https://github.com/nongtiensonpro/Yellow_Cat_Web/issues](https://github.com/nongtiensonpro/Yellow_Cat_Web/issues)



