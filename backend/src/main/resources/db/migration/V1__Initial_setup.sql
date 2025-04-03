create table DemoModel
(
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255),
    age  INT
);

-- Chèn 10 dữ liệu giả
INSERT INTO DemoModel (name, age)
VALUES ('Nguyễn Văn A', 25),
       ('Trần Thị B', 30),
       ('Lê Văn C', 35),
       ('Phạm Thị D', 28),
       ('Hoàng Văn E', 40),
       ('Đỗ Thị F', 22),
       ('Vũ Văn G', 33),
       ('Bùi Thị H', 27),
       ('Đặng Văn I', 38),
       ('Ngô Thị K', 29);

-- Định nghĩa ENUM
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'Completed', 'Cancelled');
CREATE TYPE payment_method AS ENUM ('Credit Card', 'PayPal', 'Cash on Delivery');
CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded');

CREATE TABLE Categories
(
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Brands
(
    brand_id    SERIAL PRIMARY KEY,
    brand_name  VARCHAR(255) NOT NULL,
    logo_public_id VARCHAR(255) NOT NULL,
    brand_info TEXT NOT NULL ,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Products
(
    product_id   SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id  INT REFERENCES Categories (category_id) ON DELETE SET NULL,
    brand_id     INT REFERENCES Brands (brand_id) ON DELETE SET NULL,
    description  TEXT,
    purchases    INT DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active    BOOLEAN DEFAULT TRUE
);

CREATE TABLE Attributes
(
    attribute_id   SERIAL PRIMARY KEY,
    attribute_name VARCHAR(255) NOT NULL,
    data_type      VARCHAR(50)  NOT NULL
);

CREATE TABLE Attribute_Values
(
    attribute_value_id SERIAL PRIMARY KEY,
    attribute_id       INT REFERENCES Attributes (attribute_id) ON DELETE CASCADE,
    value              VARCHAR(255) NOT NULL
);

CREATE TABLE Product_Attributes
(
    product_attribute_id SERIAL PRIMARY KEY,
    product_id           INT REFERENCES Products (product_id) ON DELETE CASCADE,
    attribute_value_id   INT REFERENCES Attribute_Values (attribute_value_id) ON DELETE CASCADE
);

CREATE TABLE Product_Variants
(
    variant_id  SERIAL PRIMARY KEY,
    product_id  INT REFERENCES Products (product_id) ON DELETE CASCADE,
    sku         VARCHAR(50) UNIQUE,
    price       DECIMAL(10, 2) NOT NULL,
    stock_level INT NOT NULL,
    image_url   VARCHAR(255),
    weight      DECIMAL(10, 2)
);

CREATE TABLE Variant_Attributes
(
    variant_attribute_id SERIAL PRIMARY KEY,
    variant_id           INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    attribute_value_id   INT REFERENCES Attribute_Values (attribute_value_id) ON DELETE CASCADE
);

CREATE TABLE Shippers
(
    shipper_id   SERIAL PRIMARY KEY,
    first_name   VARCHAR(255) NOT NULL,
    last_name    VARCHAR(255) NOT NULL,
    phone        VARCHAR(20) UNIQUE NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL
);

CREATE TABLE Orders
(
    order_id         SERIAL PRIMARY KEY,
    order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount     DECIMAL(10, 2) NOT NULL,
    status           VARCHAR(50) NOT NULL,
    shipper_id       INT REFERENCES Shippers (shipper_id) ON DELETE SET NULL,
    shipping_address TEXT,
    billing_address  TEXT,
    shipping_method  VARCHAR(50),
    tracking_number  VARCHAR(100)
);

CREATE TABLE Order_Items
(
    order_item_id SERIAL PRIMARY KEY,
    order_id      INT REFERENCES Orders (order_id) ON DELETE CASCADE,
    variant_id    INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    quantity      INT NOT NULL,
    price         DECIMAL(10, 2) NOT NULL,
    subtotal      DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Payments
(
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT REFERENCES Orders (order_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount         DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100)
);

CREATE TABLE Cart
(
    cart_id     SERIAL PRIMARY KEY,
    variant_id  INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    quantity    INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reviews
(
    review_id   SERIAL PRIMARY KEY,
    product_id  INT REFERENCES Products (product_id) ON DELETE CASCADE,
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Promotions
(
    promotion_id     SERIAL PRIMARY KEY,
    promotion_name   VARCHAR(255) NOT NULL,
    discount_percent DECIMAL(5, 2),
    start_date       TIMESTAMP,
    end_date         TIMESTAMP,
    is_active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE Product_Promotions
(
    product_promotion_id SERIAL PRIMARY KEY,
    product_id           INT REFERENCES Products (product_id) ON DELETE CASCADE,
    promotion_id         INT REFERENCES Promotions (promotion_id) ON DELETE CASCADE
);


-- Dữ liệu mẫu cho bảng Categories
-- Thêm danh mục "Áo thể thao nam"
INSERT INTO Categories (category_name) VALUES
    ('Áo thể thao nam');

-- Lấy category_id vừa được tạo (Giả sử là 1)
-- SELECT category_id FROM Categories WHERE category_name = 'Áo thể thao nam'; -- (Để tham khảo)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Brands
-- Thêm các thương hiệu thể thao phổ biến
INSERT INTO Brands (brand_name, logo_public_id, brand_info) VALUES
                                                                ('Nike', 'YellowCatWeb/lx6hupwnexokbxg83yqa', 'Nike là một tập đoàn đa quốc gia của Mỹ hoạt động trong lĩnh vực thiết kế, phát triển, sản xuất, quảng bá cũng như kinh doanh các mặt hàng giày dép, quần áo, phụ kiện, trang thiết bị và dịch vụ liên quan đến thể thao.'),
                                                                ('Adidas', 'YellowCatWeb/lx6hupwnexokbxg83yqa', 'Adidas AG là một tập đoàn đa quốc gia đến từ Đức, chuyên thiết kế và sản xuất giày dép, quần áo, phụ kiện thể thao. Adidas là nhà sản xuất đồ thể thao lớn nhất châu Âu và lớn thứ hai trên thế giới.'),
                                                                ('Under Armour', 'YellowCatWeb/lx6hupwnexokbxg83yqa', 'Under Armour, Inc. là một công ty sản xuất trang phục thể thao và phụ kiện của Mỹ. Công ty cung cấp các sản phẩm trang phục thể thao, giày dép và phụ kiện.'),
                                                                ('Puma', 'YellowCatWeb/lx6hupwnexokbxg83yqa', 'Puma SE là một công ty đa quốc gia của Đức chuyên thiết kế và sản xuất giày dép, trang phục và phụ kiện thể thao và thông thường.');

-- Lấy brand_id vừa được tạo (Giả sử là 1, 2, 3, 4 tương ứng)
-- SELECT brand_id, brand_name FROM Brands; -- (Để tham khảo)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Attributes
-- Thêm các thuộc tính cơ bản cho áo thể thao
INSERT INTO Attributes (attribute_name, data_type) VALUES
                                                       ('Màu sắc', 'VARCHAR'),  -- Thuộc tính màu sắc
                                                       ('Kích cỡ', 'VARCHAR'),   -- Thuộc tính kích cỡ
                                                       ('Chất liệu', 'VARCHAR'); -- Thuộc tính chất liệu

-- Lấy attribute_id vừa được tạo (Giả sử là 1, 2, 3 tương ứng)
-- SELECT attribute_id, attribute_name FROM Attributes; -- (Để tham khảo)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Attribute_Values
-- Thêm các giá trị cụ thể cho từng thuộc tính

-- Giá trị cho Màu sắc (attribute_id = 1)
INSERT INTO Attribute_Values (attribute_id, value) VALUES
                                                       (1, 'Đen'),
                                                       (1, 'Trắng'),
                                                       (1, 'Xám'),
                                                       (1, 'Xanh Navy'),
                                                       (1, 'Đỏ'),
                                                       (1, 'Xanh Dương');

-- Giá trị cho Kích cỡ (attribute_id = 2)
INSERT INTO Attribute_Values (attribute_id, value) VALUES
                                                       (2, 'S'),
                                                       (2, 'M'),
                                                       (2, 'L'),
                                                       (2, 'XL'),
                                                       (2, 'XXL');

-- Giá trị cho Chất liệu (attribute_id = 3)
INSERT INTO Attribute_Values (attribute_id, value) VALUES
                                                       (3, 'Polyester'),
                                                       (3, 'Cotton'),
                                                       (3, 'Spandex'),
                                                       (3, 'Nylon'),
                                                       (3, 'Cotton Blend'); -- (Pha trộn Cotton)

-- Lấy attribute_value_id vừa được tạo (Sẽ có nhiều ID)
-- SELECT attribute_value_id, value FROM Attribute_Values WHERE attribute_id = 1; -- (Để tham khảo, ví dụ cho Màu sắc)

-- Ghi chú: Bạn cần biết các ID cụ thể được tạo ra ở bước này để sử dụng trong các bảng Product_Attributes và Variant_Attributes.
-- Ví dụ giả sử:
-- Màu sắc: Đen (1), Trắng (2), Xám (3), Xanh Navy (4), Đỏ (5), Xanh Dương (6)
-- Kích cỡ: S (7), M (8), L (9), XL (10), XXL (11)
-- Chất liệu: Polyester (12), Cotton (13), Spandex (14), Nylon (15), Cotton Blend (16)
-- *** LƯU Ý: CÁC ID NÀY LÀ GIẢ ĐỊNH. BẠN CẦN DÙNG ID THỰC TẾ MÀ DATABASE TẠO RA. ***

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Products
-- Thêm các sản phẩm áo thể thao nam cụ thể
INSERT INTO Products (product_name, category_id, brand_id, description, purchases, is_active) VALUES
                                                                                                  ('Áo Thun Thể Thao Nike Dri-FIT Nam', 1, 1, 'Áo thun tập luyện nam Nike với công nghệ Dri-FIT giúp thấm hút mồ hôi, giữ cho cơ thể luôn khô ráo và thoải mái trong suốt quá trình vận động.', 150, TRUE),
                                                                                                  ('Áo Polo Thể Thao Adidas Nam', 1, 2, 'Áo polo thể thao nam Adidas thiết kế thanh lịch, chất liệu thoáng khí, phù hợp cho cả hoạt động thể thao và mặc hàng ngày.', 120, TRUE),
                                                                                                  ('Áo Ba Lỗ Tập Gym Under Armour Nam', 1, 3, 'Áo ba lỗ Under Armour chuyên dụng cho tập gym, thiết kế ôm vừa vặn, chất liệu co giãn tốt và nhanh khô.', 95, TRUE),
                                                                                                  ('Áo Thun Chạy Bộ Puma Nam', 1, 4, 'Áo thun chạy bộ Puma với công nghệ dryCELL giúp hút ẩm hiệu quả, trọng lượng nhẹ, mang lại cảm giác thoải mái tối đa khi chạy.', 80, FALSE), -- Ví dụ sản phẩm không còn kinh doanh
                                                                                                  ('Áo Khoác Gió Thể Thao Nike Nam', 1, 1, 'Áo khoác gió mỏng nhẹ Nike, chống thấm nước nhẹ, thích hợp cho các hoạt động ngoài trời hoặc khởi động.', 200, TRUE);

-- Lấy product_id vừa được tạo (Giả sử là 1, 2, 3, 4, 5 tương ứng)
-- SELECT product_id, product_name FROM Products; -- (Để tham khảo)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Product_Attributes
-- Liên kết sản phẩm với các thuộc tính chung (ví dụ: chất liệu chính)
-- Sử dụng ID giả định từ Attribute_Values
INSERT INTO Product_Attributes (product_id, attribute_value_id) VALUES
                                                                    (1, 12), -- Áo Nike Dri-FIT -> Polyester (12)
                                                                    (2, 16), -- Áo Polo Adidas -> Cotton Blend (16)
                                                                    (3, 12), -- Áo Ba Lỗ UA -> Polyester (12) (Có thể có Spandex nhưng Polyester là chính)
                                                                    (3, 14), -- Áo Ba Lỗ UA -> Có Spandex (14)
                                                                    (4, 12), -- Áo Chạy Bộ Puma -> Polyester (12)
                                                                    (5, 15); -- Áo Khoác Gió Nike -> Nylon (15)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Product_Variants
-- Thêm các biến thể cụ thể cho từng sản phẩm (theo màu sắc, kích cỡ)
-- Sử dụng ID sản phẩm giả định
INSERT INTO Product_Variants (product_id, sku, price, stock_level, image_url, weight) VALUES
-- Biến thể cho Áo Thun Nike Dri-FIT Nam (product_id = 1)
(1, 'NK-DRFT-BLK-M', 650000.00, 50, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.15), -- Đen, M
(1, 'NK-DRFT-BLK-L', 650000.00, 45, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.16), -- Đen, L
(1, 'NK-DRFT-WHT-M', 650000.00, 60, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.15), -- Trắng, M
(1, 'NK-DRFT-NVY-XL', 660000.00, 30, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.17), -- Xanh Navy, XL (Giá có thể khác)

-- Biến thể cho Áo Polo Adidas Nam (product_id = 2)
(2, 'AD-POLO-GRY-S', 750000.00, 40, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.20), -- Xám, S
(2, 'AD-POLO-GRY-M', 750000.00, 55, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.21), -- Xám, M
(2, 'AD-POLO-BLK-L', 750000.00, 50, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.22), -- Đen, L

-- Biến thể cho Áo Ba Lỗ UA Nam (product_id = 3)
(3, 'UA-TANK-BLK-M', 550000.00, 70, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.12), -- Đen, M
(3, 'UA-TANK-RED-L', 550000.00, 40, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.13), -- Đỏ, L

-- Biến thể cho Áo Khoác Gió Nike Nam (product_id = 5)
(5, 'NK-WJ-BLU-M', 1200000.00, 25, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.25), -- Xanh Dương, M
(5, 'NK-WJ-BLK-L', 1200000.00, 35, 'YellowCatWeb/lx6hupwnexokbxg83yqa', 0.26); -- Đen, L

-- Lấy variant_id vừa được tạo (Giả sử là 1 đến 11 tương ứng)
-- SELECT variant_id, sku FROM Product_Variants; -- (Để tham khảo)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Variant_Attributes
-- Liên kết mỗi biến thể với các giá trị thuộc tính cụ thể (Màu sắc, Kích cỡ)
-- Sử dụng ID biến thể và ID giá trị thuộc tính giả định

-- Biến thể 1: NK-DRFT-BLK-M (variant_id = 1)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (1, 1), -- Màu sắc: Đen (1)
                                                                    (1, 8); -- Kích cỡ: M (8)

-- Biến thể 2: NK-DRFT-BLK-L (variant_id = 2)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (2, 1), -- Màu sắc: Đen (1)
                                                                    (2, 9); -- Kích cỡ: L (9)

-- Biến thể 3: NK-DRFT-WHT-M (variant_id = 3)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (3, 2), -- Màu sắc: Trắng (2)
                                                                    (3, 8); -- Kích cỡ: M (8)

-- Biến thể 4: NK-DRFT-NVY-XL (variant_id = 4)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (4, 4), -- Màu sắc: Xanh Navy (4)
                                                                    (4, 10); -- Kích cỡ: XL (10)

-- Biến thể 5: AD-POLO-GRY-S (variant_id = 5)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (5, 3), -- Màu sắc: Xám (3)
                                                                    (5, 7); -- Kích cỡ: S (7)

-- Biến thể 6: AD-POLO-GRY-M (variant_id = 6)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (6, 3), -- Màu sắc: Xám (3)
                                                                    (6, 8); -- Kích cỡ: M (8)

-- Biến thể 7: AD-POLO-BLK-L (variant_id = 7)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (7, 1), -- Màu sắc: Đen (1)
                                                                    (7, 9); -- Kích cỡ: L (9)

-- Biến thể 8: UA-TANK-BLK-M (variant_id = 8)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (8, 1), -- Màu sắc: Đen (1)
                                                                    (8, 8); -- Kích cỡ: M (8)

-- Biến thể 9: UA-TANK-RED-L (variant_id = 9)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (9, 5), -- Màu sắc: Đỏ (5)
                                                                    (9, 9); -- Kích cỡ: L (9)

-- Biến thể 10: NK-WJ-BLU-M (variant_id = 10)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (10, 6), -- Màu sắc: Xanh Dương (6)
                                                                    (10, 8); -- Kích cỡ: M (8)

-- Biến thể 11: NK-WJ-BLK-L (variant_id = 11)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES
                                                                    (11, 1), -- Màu sắc: Đen (1)
                                                                    (11, 9); -- Kích cỡ: L (9)

----------------------------------------------------------------------
