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
    brand_id       SERIAL PRIMARY KEY,
    brand_name     VARCHAR(255) NOT NULL,
    logo_public_id VARCHAR(255) NOT NULL,
    brand_info     TEXT         NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Products
(
    product_id   SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id  INT          REFERENCES Categories (category_id) ON DELETE SET NULL,
    brand_id     INT          REFERENCES Brands (brand_id) ON DELETE SET NULL,
    description  TEXT,
    purchases    INT       DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active    BOOLEAN   DEFAULT TRUE
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
    stock_level INT            NOT NULL,
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
    first_name   VARCHAR(255)        NOT NULL,
    last_name    VARCHAR(255)        NOT NULL,
    phone        VARCHAR(20) UNIQUE  NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255)        NOT NULL
);

CREATE TABLE Orders
(
    order_id         SERIAL PRIMARY KEY,
    order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount     DECIMAL(10, 2) NOT NULL,
    status           VARCHAR(50)    NOT NULL,
    shipper_id       INT            REFERENCES Shippers (shipper_id) ON DELETE SET NULL,
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
    quantity      INT            NOT NULL,
    price         DECIMAL(10, 2) NOT NULL,
    subtotal      DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Payments
(
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT REFERENCES Orders (order_id) ON DELETE CASCADE,
    payment_method VARCHAR(50)    NOT NULL,
    payment_status VARCHAR(50)    NOT NULL,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount         DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100)
);

CREATE TABLE Cart
(
    cart_id    SERIAL PRIMARY KEY,
    variant_id INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    quantity   INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reviews
(
    review_id  SERIAL PRIMARY KEY,
    product_id INT REFERENCES Products (product_id) ON DELETE CASCADE,
    rating     INT CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
-- Thêm danh mục "Giày thể thao nam"
INSERT INTO Categories (category_name)
VALUES ('Giày thể thao nam'); -- category_id sẽ là 1 nếu bảng trống

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Brands
-- Thêm các thương hiệu thể thao phổ biến (Giữ nguyên như cũ)
INSERT INTO Brands (brand_name, logo_public_id, brand_info)
VALUES ('Nike', 'YellowCatWeb/t0hqgdma141foprsckjf',
        'Nike là một tập đoàn đa quốc gia của Mỹ hoạt động trong lĩnh vực thiết kế, phát triển, sản xuất, quảng bá cũng như kinh doanh các mặt hàng giày dép, quần áo, phụ kiện, trang thiết bị và dịch vụ liên quan đến thể thao.'),
       ('Adidas', 'YellowCatWeb/ajstsr8nluev6ich5uwg',
        'Adidas AG là một tập đoàn đa quốc gia đến từ Đức, chuyên thiết kế và sản xuất giày dép, quần áo, phụ kiện thể thao. Adidas là nhà sản xuất đồ thể thao lớn nhất châu Âu và lớn thứ hai trên thế giới.'),
       ('Under Armour', 'YellowCatWeb/vcjjtizyqhvlfdggw7sd',
        'Under Armour, Inc. là một công ty sản xuất trang phục thể thao và phụ kiện của Mỹ. Công ty cung cấp các sản phẩm trang phục thể thao, giày dép và phụ kiện.'),
       ('Puma', 'YellowCatWeb/n54kyijbuhmmbtzlkh2h',
        'Puma SE là một công ty đa quốc gia của Đức chuyên thiết kế và sản xuất giày dép, trang phục và phụ kiện thể thao và thông thường.');
-- brand_ids sẽ là 1, 2, 3, 4 nếu bảng trống

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Attributes
-- Thêm các thuộc tính cơ bản cho giày thể thao
INSERT INTO Attributes (attribute_name, data_type)
VALUES ('Màu sắc', 'VARCHAR'),   -- attribute_id = 1
       ('Kích cỡ', 'VARCHAR'),   -- attribute_id = 2 (Kích cỡ giày dạng số)
       ('Chất liệu', 'VARCHAR'), -- attribute_id = 3 (Chất liệu giày)
       ('Kiểu dáng', 'VARCHAR'), -- attribute_id = 4 (Ví dụ: Chạy bộ, Tập luyện, Thời trang)
       ('image', 'VARCHAR');    -- attribute_id = 5 (Hình ảnh)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Attribute_Values
-- Thêm các giá trị cụ thể cho từng thuộc tính

-- Giá trị cho Màu sắc (attribute_id = 1)
INSERT INTO Attribute_Values (attribute_id, value)
VALUES (1, 'Đen'),        -- Giả định attribute_value_id = 1
       (1, 'Trắng'),      -- Giả định attribute_value_id = 2
       (1, 'Xám'),        -- Giả định attribute_value_id = 3
       (1, 'Xanh Navy'),  -- Giả định attribute_value_id = 4
       (1, 'Đỏ'),         -- Giả định attribute_value_id = 5
       (1, 'Xanh Dương'); -- Giả định attribute_value_id = 6

-- Giá trị cho Kích cỡ (attribute_id = 2)
INSERT INTO Attribute_Values (attribute_id, value)
VALUES (2, '39'),         -- Giả định attribute_value_id = 7
       (2, '40'),         -- Giả định attribute_value_id = 8
       (2, '41'),         -- Giả định attribute_value_id = 9
       (2, '42'),         -- Giả định attribute_value_id = 10
       (2, '43'),         -- Giả định attribute_value_id = 11
       (2, '44');         -- Giả định attribute_value_id = 12

-- Giá trị cho Chất liệu (attribute_id = 3)
INSERT INTO Attribute_Values (attribute_id, value)
VALUES (3, 'Vải lưới (Mesh)'),       -- Giả định attribute_value_id = 13
       (3, 'Da tổng hợp'),          -- Giả định attribute_value_id = 14
       (3, 'Cao su (Rubber)'),      -- Giả định attribute_value_id = 15
       (3, 'Boost Foam'),           -- Giả định attribute_value_id = 16
       (3, 'React Foam'),           -- Giả định attribute_value_id = 17
       (3, 'Da thật');              -- Giả định attribute_value_id = 18

-- Giá trị cho Kiểu dáng (attribute_id = 4)
INSERT INTO Attribute_Values (attribute_id, value)
VALUES (4, 'Chạy bộ'),              -- Giả định attribute_value_id = 19
       (4, 'Tập luyện'),            -- Giả định attribute_value_id = 20
       (4, 'Thời trang'),           -- Giả định attribute_value_id = 21
       (4, 'Bóng rổ');              -- Giả định attribute_value_id = 22

-- Giá trị cho image (attribute_id = 5)
INSERT INTO Attribute_Values (attribute_id, value)
VALUES (5, 'YellowCatWeb/shoe_image_placeholder_1'), -- Giả định attribute_value_id = 23
       (5, 'YellowCatWeb/shoe_image_placeholder_2'), -- Giả định attribute_value_id = 24
       (5, 'YellowCatWeb/shoe_image_placeholder_3'), -- Giả định attribute_value_id = 25
       (5, 'YellowCatWeb/shoe_image_placeholder_4'), -- Giả định attribute_value_id = 26
       (5, 'YellowCatWeb/shoe_image_placeholder_5'); -- Giả định attribute_value_id = 27

-- *** LƯU Ý: CÁC ID TRÊN (attribute_value_id) LÀ GIẢ ĐỊNH DỰA TRÊN THỨ TỰ INSERT VÀO BẢNG TRỐNG. ***
-- Màu sắc IDs: Đen (1), Trắng (2), Xám (3), Xanh Navy (4), Đỏ (5), Xanh Dương (6)
-- Kích cỡ IDs: 39 (7), 40 (8), 41 (9), 42 (10), 43 (11), 44 (12)
-- Chất liệu IDs: Vải lưới (13), Da tổng hợp (14), Cao su (15), Boost Foam (16), React Foam (17), Da thật (18)
-- Kiểu dáng IDs: Chạy bộ (19), Tập luyện (20), Thời trang (21), Bóng rổ (22)
-- Image IDs: placeholder_1 (23) ... placeholder_5 (27)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Products
-- category_id = 1 (Giày thể thao nam)
-- brand_id: Nike=1, Adidas=2, Under Armour=3, Puma=4
INSERT INTO Products (product_name, category_id, brand_id, description, purchases, is_active)
VALUES ('Giày Chạy Bộ Nike Revolution 6 Nam', 1, 1, 'Giày chạy bộ Nike Revolution 6 mang lại sự thoải mái và đệm êm ái cho mỗi bước chạy, thiết kế với ít nhất 20% vật liệu tái chế theo trọng lượng.', 180, TRUE), -- product_id = 1 (giả định)
       ('Giày Tập Luyện Adidas Duramo SL Nam', 1, 2, 'Giày Adidas Duramo SL đa năng, phù hợp cho chạy bộ, tập gym hoặc mang hàng ngày, với lớp đệm Lightmotion siêu nhẹ.', 220, TRUE), -- product_id = 2 (giả định)
       ('Giày Bóng Rổ Under Armour Curry Flow 9 Nam', 1, 3, 'Giày bóng rổ Under Armour Curry Flow 9, công nghệ UA Flow cho độ bám sân tuyệt vời và cảm giác nhẹ như không.', 150, TRUE), -- product_id = 3 (giả định)
       ('Giày Thời Trang Puma Suede Classic XXI Nam', 1, 4, 'Đôi giày Puma Suede Classic XXI mang tính biểu tượng, phong cách đường phố cổ điển với chất liệu da lộn cao cấp và form dáng được cải tiến.', 100, TRUE), -- product_id = 4 (giả định)
       ('Giày Chạy Bộ Nike Air Zoom Pegasus 40 Nam', 1, 1, 'Nike Air Zoom Pegasus 40, tiếp nối di sản với cảm giác đàn hồi quen thuộc, hoàn hảo cho những quãng đường dài và mọi kiểu chạy.', 250, FALSE); -- product_id = 5 (giả định), ví dụ không còn kinh doanh

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Product_Attributes
-- Liên kết sản phẩm với các thuộc tính chung (chất liệu chính, kiểu dáng)
-- Sử dụng product_id và attribute_value_id giả định ở trên
INSERT INTO Product_Attributes (product_id, attribute_value_id)
VALUES
-- Nike Revolution 6 (product_id=1): Vải lưới (13), Chạy bộ (19)
(1, 13), (1, 19),
-- Adidas Duramo SL (product_id=2): Vải lưới (13), Tập luyện (20)
(2, 13), (2, 20),
-- UA Curry Flow 9 (product_id=3): Vải lưới (13), Da tổng hợp (14), Bóng rổ (22)
(3, 13), (3, 14), (3, 22),
-- Puma Suede Classic XXI (product_id=4): Da thật (18), Thời trang (21)
(4, 18), (4, 21),
-- Nike Pegasus 40 (product_id=5): Vải lưới (13), React Foam (17), Chạy bộ (19)
(5, 13), (5, 17), (5, 19);

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Product_Variants
-- Thêm các biến thể cụ thể cho từng sản phẩm giày
-- Sử dụng product_id giả định
INSERT INTO Product_Variants (product_id, sku, price, stock_level, image_url, weight)
VALUES
-- Biến thể cho Nike Revolution 6 Nam (product_id = 1)
(1, 'NK-REV6-BLK-40', 1800000.00, 50, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.28),  -- Đen, 40 (variant_id = 1 giả định)
(1, 'NK-REV6-BLK-41', 1800000.00, 45, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.29),  -- Đen, 41 (variant_id = 2 giả định)
(1, 'NK-REV6-GRY-42', 1850000.00, 60, 'YellowCatWeb/tvgilikvrp7jltim1esa', 0.30),  -- Xám, 42 (variant_id = 3 giả định)

-- Biến thể cho Adidas Duramo SL Nam (product_id = 2)
(2, 'AD-DURSL-WHT-41', 1650000.00, 55, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.27), -- Trắng, 41 (variant_id = 4 giả định)
(2, 'AD-DURSL-WHT-42', 1650000.00, 65, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.28), -- Trắng, 42 (variant_id = 5 giả định)
(2, 'AD-DURSL-NVY-43', 1650000.00, 40, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.29), -- Xanh Navy, 43 (variant_id = 6 giả định)

-- Biến thể cho UA Curry Flow 9 Nam (product_id = 3)
(3, 'UA-CUR9-BLU-42', 3500000.00, 30, 'YellowCatWeb/ejzjv3cxkyyjtokkgh1t', 0.32),   -- Xanh Dương, 42 (variant_id = 7 giả định)
(3, 'UA-CUR9-RED-43', 3550000.00, 25, 'YellowCatWeb/bqttubnjqa5qzb64kjnm', 0.33),   -- Đỏ, 43 (variant_id = 8 giả định)

-- Biến thể cho Puma Suede Classic XXI Nam (product_id = 4)
(4, 'PU-SUED-BLK-40', 2200000.00, 35, 'YellowCatWeb/sx6bwsntnuwyfwx89tqt', 0.35), -- Đen, 40 (variant_id = 9 giả định)
(4, 'PU-SUED-RED-41', 2200000.00, 30, 'YellowCatWeb/lq1yqclrqebutga5pmrk', 0.36), -- Đỏ, 41 (variant_id = 10 giả định)

-- Biến thể cho Nike Air Zoom Pegasus 40 Nam (product_id = 5)
(5, 'NK-PEG40-BLK-41', 3200000.00, 50, 'YellowCatWeb/byshsl4qboscrdnmuoix', 0.26),  -- Đen, 41 (variant_id = 11 giả định)
(5, 'NK-PEG40-WHT-42', 3200000.00, 55, 'YellowCatWeb/acs7ki8v43lrjorsfnwb', 0.27);  -- Trắng, 42 (variant_id = 12 giả định)

----------------------------------------------------------------------

-- Dữ liệu mẫu cho bảng Variant_Attributes
-- Liên kết mỗi biến thể với các giá trị thuộc tính cụ thể (Màu sắc, Kích cỡ)
-- Sử dụng variant_id và attribute_value_id giả định:
-- Màu sắc IDs: Đen (1), Trắng (2), Xám (3), Xanh Navy (4), Đỏ (5), Xanh Dương (6)
-- Kích cỡ IDs: 39 (7), 40 (8), 41 (9), 42 (10), 43 (11), 44 (12)
-- Image attribute_value_ids (ví dụ: 23-27) có thể được thêm vào đây nếu mỗi variant có hình ảnh riêng biệt và được map trong Attribute_Values.
-- Hiện tại, image_url được đặt ở Product_Variants.

-- Variant 1: NK-REV6-BLK-40 (variant_id=1) -> Màu Đen (1), Kích cỡ 40 (8)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (1, 1), (1, 8);
-- Variant 2: NK-REV6-BLK-41 (variant_id=2) -> Màu Đen (1), Kích cỡ 41 (9)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (2, 1), (2, 9);
-- Variant 3: NK-REV6-GRY-42 (variant_id=3) -> Màu Xám (3), Kích cỡ 42 (10)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (3, 3), (3, 10);

-- Variant 4: AD-DURSL-WHT-41 (variant_id=4) -> Màu Trắng (2), Kích cỡ 41 (9)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (4, 2), (4, 9);
-- Variant 5: AD-DURSL-WHT-42 (variant_id=5) -> Màu Trắng (2), Kích cỡ 42 (10)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (5, 2), (5, 10);
-- Variant 6: AD-DURSL-NVY-43 (variant_id=6) -> Màu Xanh Navy (4), Kích cỡ 43 (11)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (6, 4), (6, 11);

-- Variant 7: UA-CUR9-BLU-42 (variant_id=7) -> Màu Xanh Dương (6), Kích cỡ 42 (10)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (7, 6), (7, 10);
-- Variant 8: UA-CUR9-RED-43 (variant_id=8) -> Màu Đỏ (5), Kích cỡ 43 (11)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (8, 5), (8, 11);

-- Variant 9: PU-SUED-BLK-40 (variant_id=9) -> Màu Đen (1), Kích cỡ 40 (8)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (9, 1), (9, 8);
-- Variant 10: PU-SUED-RED-41 (variant_id=10) -> Màu Đỏ (5), Kích cỡ 41 (9)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (10, 5), (10, 9);

-- Variant 11: NK-PEG40-BLK-41 (variant_id=11) -> Màu Đen (1), Kích cỡ 41 (9)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (11, 1), (11, 9);
-- Variant 12: NK-PEG40-WHT-42 (variant_id=12) -> Màu Trắng (2), Kích cỡ 42 (10)
INSERT INTO Variant_Attributes (variant_id, attribute_value_id) VALUES (12, 2), (12, 10);

----------------------------------------------------------------------
