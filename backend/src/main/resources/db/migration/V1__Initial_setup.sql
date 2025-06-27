-- Bảng lưu trữ thông tin người dùng của ứng dụng, liên kết với Keycloak
CREATE TABLE app_users
(
    app_user_id  SERIAL PRIMARY KEY,
    keycloak_id  uuid,
    username     VARCHAR(255),
    roles        TEXT[],
    enabled      BOOLEAN,
    email        VARCHAR(255) UNIQUE NOT NULL,
    full_name    VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE,
    avatar_url   VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Danh mục sản phẩm
CREATE TABLE categories
(
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Thương hiệu
CREATE TABLE brands
(
    brand_id       SERIAL PRIMARY KEY,
    brand_name     VARCHAR(255) UNIQUE NOT NULL,
    logo_public_id VARCHAR(255),
    brand_info     TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chất liệu
CREATE TABLE materials
(
    material_id   SERIAL PRIMARY KEY,
    material_name VARCHAR(255) UNIQUE NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đối tượng sử dụng
CREATE TABLE target_audiences
(
    target_audience_id SERIAL PRIMARY KEY,
    audience_name      VARCHAR(50) UNIQUE NOT NULL,
    description        TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng màu sắc
CREATE TABLE colors
(
    color_id    SERIAL PRIMARY KEY,
    color_name  VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng kích thước
CREATE TABLE sizes
(
    size_id     SERIAL PRIMARY KEY,
    size_name   VARCHAR(20) NOT NULL, -- Ví dụ: "S", "M", "L", "XL"
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Sản phẩm
CREATE TABLE products
(
    product_id         SERIAL PRIMARY KEY,
    product_name       VARCHAR(255) NOT NULL,
    description        TEXT,
    category_id        INT,
    brand_id           INT,
    material_id        INT,
    target_audience_id INT,
    is_featured        BOOLEAN   DEFAULT FALSE,
    purchases          INT       default 0,
    is_active          BOOLEAN   DEFAULT TRUE,
    thumbnail          VARCHAR(255) NOT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands (brand_id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materials (material_id) ON DELETE SET NULL,
    FOREIGN KEY (target_audience_id) REFERENCES target_audiences (target_audience_id) ON DELETE SET NULL
);

-- Bảng Biến thể sản phẩm
CREATE TABLE product_variants
(
    variant_id        SERIAL PRIMARY KEY,
    product_id        INT            NOT NULL,
    sku               VARCHAR(50)    NOT NULL,
    color_id          INT,
    size_id           INT,
    price             NUMERIC(12, 2) NOT NULL,
    sale_price        NUMERIC(12, 2),
    quantity_in_stock INT            NOT NULL DEFAULT 0,
    sold              INT            NOT NULL DEFAULT 0,
    image_url         VARCHAR(255)   NOT NULL,
    weight            FLOAT,
    created_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, color_id, size_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors (color_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES sizes (size_id) ON DELETE SET NULL
);

-- Bảng Địa chỉ
CREATE TABLE addresses
(
    address_id     SERIAL PRIMARY KEY,
    app_user_id    INT          NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone_number   VARCHAR(20)  NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    ward_commune   VARCHAR(100) NOT NULL,
    district       VARCHAR(100) NOT NULL,
    city_province  VARCHAR(100) NOT NULL,
    country        VARCHAR(100) DEFAULT 'Việt Nam',
    is_default     BOOLEAN      DEFAULT FALSE,
    address_type   VARCHAR(50),
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng Phương thức vận chuyển
CREATE TABLE shipping_methods
(
    shipping_method_id SERIAL PRIMARY KEY,
    method_name        VARCHAR(100)   NOT NULL,
    description        TEXT,
    base_cost          NUMERIC(10, 2) NOT NULL,
    is_active          BOOLEAN DEFAULT TRUE
);

-- Bảng Đơn hàng
CREATE TABLE orders
(
    order_id            SERIAL PRIMARY KEY,
    order_code          VARCHAR(20) UNIQUE,
    app_user_id         INT,
    shipping_address_id INT,
    order_date          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    phone_number        VARCHAR(15),
    customer_name       VARCHAR(255),
    sub_total_amount    NUMERIC(14, 2) NOT NULL,
    shipping_fee        NUMERIC(10, 2)          DEFAULT 0,
    discount_amount     NUMERIC(12, 2)          DEFAULT 0,
    final_amount        NUMERIC(14, 2) NOT NULL,
    order_status        VARCHAR(50)    NOT NULL DEFAULT 'Pending',
    shipping_method_id  INT,
    customer_notes      TEXT,
    is_synced_to_ghtk   BOOLEAN                 DEFAULT FALSE, -- Ghi nhận đơn đã gửi lên GHTK chưa
    updated_at          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses (address_id),
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods (shipping_method_id)
);

-- Bảng Chi tiết đơn hàng
CREATE TABLE order_items
(
    order_item_id     SERIAL PRIMARY KEY,
    order_id          INT            NOT NULL,
    variant_id        INT            NOT NULL,
    quantity          INT            NOT NULL,
    price_at_purchase NUMERIC(12, 2) NOT NULL,
    total_price       NUMERIC(14, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id)
);

-- Bảng Giao dịch thanh toán
CREATE TABLE payments
(
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT            NOT NULL,
    payment_method VARCHAR(50)    NOT NULL,
    transaction_id VARCHAR(255),
    amount         NUMERIC(14, 2) NOT NULL,
    payment_status VARCHAR(50)    NOT NULL,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
);

-- Bảng Vận chuyển đơn hàng
CREATE TABLE shipments
(
    shipment_id             SERIAL PRIMARY KEY,
    order_id                INT UNIQUE NOT NULL,
    shipping_method_id      INT,
    tracking_number         VARCHAR(100),
    shipping_status         VARCHAR(50) DEFAULT 'Preparing',
    estimated_delivery_date DATE,
    actual_delivery_date    DATE,
    shipped_date            TIMESTAMP,
    shipping_cost           NUMERIC(10, 2),
    notes                   TEXT,
    ghtk_order_code         VARCHAR(100), -- Mã đơn hàng GHTK trả về
    ghtk_label_url          VARCHAR(255), -- URL mã vận đơn (nếu có)
    ghtk_tracking_url       VARCHAR(255), -- URL theo dõi đơn
    created_at              TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods (shipping_method_id)
);

-- Bảng Đánh giá sản phẩm
CREATE TABLE reviews
(
    review_id   SERIAL PRIMARY KEY,
    product_id  INT      NOT NULL,
    app_user_id INT      NOT NULL,
    rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE,
    UNIQUE (product_id, app_user_id)
);

-- Bảng Khuyến mãi
CREATE TABLE promotions
(
    promotion_id   SERIAL PRIMARY KEY,
    app_user_id    INT            NOT NULL,
    promotion_code VARCHAR(50) UNIQUE,
    promotion_name VARCHAR(255)   NOT NULL,
    description    TEXT,
    discount_type  VARCHAR(20)    NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    start_date     TIMESTAMP      NOT NULL,
    end_date       TIMESTAMP      NOT NULL,
    is_active      BOOLEAN   DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng Áp dụng khuyến mãi cho sản phẩm
CREATE TABLE promotion_products
(
    promotion_product_id SERIAL PRIMARY KEY,
    promotion_id         INT NOT NULL,
    variant_id           INT NOT NULL,

    FOREIGN KEY (promotion_id) REFERENCES promotions (promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id) ON DELETE CASCADE
);

-- Bảng Áp dụng khuyến mãi cho đơn hàng
CREATE TABLE promotion_orders
(
    promotion_order_id   SERIAL PRIMARY KEY,
    promotion_id         INT            NOT NULL,
    order_id             INT            NOT NULL,
    minimum_order_value  NUMERIC(12, 2) NOT NULL,
    usage_limit_per_user INT DEFAULT 1,
    usage_limit_total    INT,
    FOREIGN KEY (promotion_id) REFERENCES promotions (promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
);

-- Bảng giỏ hàng
CREATE TABLE carts
(
    cart_id     SERIAL PRIMARY KEY,
    app_user_id INT UNIQUE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng giỏ hàng chi tiết
CREATE TABLE cart_items
(
    cart_item_id SERIAL PRIMARY KEY,
    cart_id      INT NOT NULL,
    variant_id   INT NOT NULL,
    quantity     INT NOT NULL CHECK (quantity > 0),
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts (cart_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants (variant_id) ON DELETE CASCADE,
    UNIQUE (cart_id, variant_id)
);

-- 1. Tạo bảng lịch sử cho products
CREATE TABLE products_history
(
    history_id         SERIAL PRIMARY KEY,
    product_id         INT       NOT NULL,
    product_name       VARCHAR(255),
    description        TEXT,
    category_id        INT,
    brand_id           INT,
    material_id        INT,
    target_audience_id INT,
    is_featured        BOOLEAN,
    purchases          INT,
    is_active          BOOLEAN,
    thumbnail          VARCHAR(255),
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP,
    operation          CHAR(1)   NOT NULL, -- 'U' = UPDATE, 'D' = DELETE
    changed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by         TEXT               DEFAULT SESSION_USER
);

-- 2. Tạo bảng lịch sử cho product_variants
CREATE TABLE product_variants_history
(
    history_id        SERIAL PRIMARY KEY,
    variant_id        INT       NOT NULL,
    product_id        INT,
    sku               VARCHAR(50),
    color_id          INT,
    size_id           INT,
    price             NUMERIC(12, 2),
    sale_price        NUMERIC(12, 2),
    quantity_in_stock INT,
    sold              INT,
    image_url         VARCHAR(255),
    weight            FLOAT,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    operation         CHAR(1)   NOT NULL, -- 'U' = UPDATE, 'D' = DELETE
    changed_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by        TEXT               DEFAULT SESSION_USER
);

-- Function audit cho products
CREATE OR REPLACE FUNCTION fn_audit_products() RETURNS TRIGGER AS
$$
DECLARE
    app_user TEXT := current_setting('app.current_user', true);
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO products_history (product_id, product_name, description, category_id, brand_id,
                                      material_id, target_audience_id, is_featured, purchases, is_active,
                                      thumbnail, created_at, updated_at,
                                      operation, changed_at, changed_by)
        VALUES (OLD.product_id, OLD.product_name, OLD.description, OLD.category_id, OLD.brand_id,
                OLD.material_id, OLD.target_audience_id, OLD.is_featured, OLD.purchases, OLD.is_active,
                OLD.thumbnail, OLD.created_at, OLD.updated_at,
                'U', CURRENT_TIMESTAMP, COALESCE(app_user, SESSION_USER));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO products_history (product_id, product_name, description, category_id, brand_id,
                                      material_id, target_audience_id, is_featured, purchases, is_active,
                                      thumbnail, created_at, updated_at,
                                      operation, changed_at, changed_by)
        VALUES (OLD.product_id, OLD.product_name, OLD.description, OLD.category_id, OLD.brand_id,
                OLD.material_id, OLD.target_audience_id, OLD.is_featured, OLD.purchases, OLD.is_active,
                OLD.thumbnail, OLD.created_at, OLD.updated_at,
                'D', CURRENT_TIMESTAMP, COALESCE(app_user, SESSION_USER));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Function audit chung cho bảng product_variants
CREATE OR REPLACE FUNCTION fn_audit_variants()
    RETURNS TRIGGER AS
$$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO product_variants_history (variant_id, product_id, sku, color_id, size_id, price, sale_price,
                                              quantity_in_stock, sold, image_url, weight, created_at, updated_at,
                                              operation, changed_by)
        SELECT OLD.variant_id,
               OLD.product_id,
               OLD.sku,
               OLD.color_id,
               OLD.size_id,
               OLD.price,
               OLD.sale_price,
               OLD.quantity_in_stock,
               OLD.sold,
               OLD.image_url,
               OLD.weight,
               OLD.created_at,
               OLD.updated_at,
               'U',
               SESSION_USER;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_variants_history (variant_id, product_id, sku, color_id, size_id, price, sale_price,
                                              quantity_in_stock, sold, image_url, weight, created_at, updated_at,
                                              operation, changed_by)
        SELECT OLD.variant_id,
               OLD.product_id,
               OLD.sku,
               OLD.color_id,
               OLD.size_id,
               OLD.price,
               OLD.sale_price,
               OLD.quantity_in_stock,
               OLD.sold,
               OLD.image_url,
               OLD.weight,
               OLD.created_at,
               OLD.updated_at,
               'D',
               SESSION_USER;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để gọi function trước UPDATE/DELETE
CREATE TRIGGER trg_products_audit
    BEFORE UPDATE OR DELETE
    ON products
    FOR EACH ROW
EXECUTE FUNCTION fn_audit_products();

CREATE TRIGGER trg_variants_audit
    BEFORE UPDATE OR DELETE
    ON product_variants
    FOR EACH ROW
EXECUTE FUNCTION fn_audit_variants();


-- Thêm Index
CREATE INDEX idx_orders_user_id ON orders (app_user_id);
CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_reviews_product_user ON reviews (product_id, app_user_id);


-- 1. Dữ liệu cho bảng Categories
INSERT INTO categories (category_name, description)
VALUES ('Giày thể thao nam', 'Bộ sưu tập giày thể thao dành cho nam giới'),
       ('Giày chạy bộ', 'Giày chuyên dụng cho việc chạy bộ và tập luyện'),
       ('Giày bóng rổ', 'Giày chuyên dụng cho môn bóng rổ'),
       ('Giày thời trang', 'Giày thể thao phong cách đường phố');

-- 2. Dữ liệu cho bảng Brands
INSERT INTO brands (brand_name, logo_public_id, brand_info)
VALUES ('Nike', 'YellowCatWeb/t0hqgdma141foprsckjf',
        'Nike là một tập đoàn đa quốc gia của Mỹ hoạt động trong lĩnh vực thiết kế, phát triển, sản xuất, quảng bá cũng như kinh doanh các mặt hàng giày dép, quần áo, phụ kiện, trang thiết bị và dịch vụ liên quan đến thể thao.'),
       ('Adidas', 'YellowCatWeb/ajstsr8nluev6ich5uwg',
        'Adidas AG là một tập đoàn đa quốc gia đến từ Đức, chuyên thiết kế và sản xuất giày dép, quần áo, phụ kiện thể thao. Adidas là nhà sản xuất đồ thể thao lớn nhất châu Âu và lớn thứ hai trên thế giới.'),
       ('Under Armour', 'YellowCatWeb/vcjjtizyqhvlfdggw7sd',
        'Under Armour, Inc. là một công ty sản xuất trang phục thể thao và phụ kiện của Mỹ. Công ty cung cấp các sản phẩm trang phục thể thao, giày dép và phụ kiện.'),
       ('Puma', 'YellowCatWeb/n54kyijbuhmmbtzlkh2h',
        'Puma SE là một công ty đa quốc gia của Đức chuyên thiết kế và sản xuất giày dép, trang phục và phụ kiện thể thao và thông thường.');

-- Dữ liệu cho bảng materials (Chất liệu)
INSERT INTO materials (material_name, description)
VALUES ('Vải lưới, Cao su', 'Kết hợp vải lưới thoáng khí và đế cao su bền bỉ'),
       ('Vải lưới, EVA', 'Kết hợp vải lưới và đế giữa EVA siêu nhẹ'),
       ('Vải kỹ thuật, UA Flow', 'Vải dệt kỹ thuật cao cấp và công nghệ đệm UA Flow'),
       ('Da lộn, Cao su', 'Chất liệu da lộn cổ điển và đế cao su'),
       ('Vải lưới, React Foam', 'Vải lưới kỹ thuật và công nghệ đệm React Foam');

-- Dữ liệu cho bảng target_audiences (Đối tượng sử dụng)
INSERT INTO target_audiences (audience_name, description)
VALUES ('Nam', 'Sản phẩm dành cho nam giới'),
       ('Nữ', 'Sản phẩm dành cho nữ giới'),
       ('Unisex', 'Sản phẩm phù hợp cho cả nam và nữ');

-- Dữ liệu cho bảng colors (Màu sắc)
INSERT INTO colors (color_name, description)
VALUES ('Đen', 'Màu đen cơ bản'),
       ('Trắng', 'Màu trắng tinh khiết'),
       ('Xanh Navy', 'Màu xanh navy đậm'),
       ('Xanh Dương', 'Màu xanh dương'),
       ('Xám', 'Màu xám trung tính'),
       ('Đỏ', 'Màu đỏ nổi bật');

-- Dữ liệu cho bảng sizes (Kích thước)
INSERT INTO sizes (size_name, description)
VALUES ('40', 'Cỡ giày 40'),
       ('41', 'Cỡ giày 41'),
       ('42', 'Cỡ giày 42'),
       ('43', 'Cỡ giày 43'),
       ('44', 'Cỡ giày 44');

-- 3. Dữ liệu cho bảng Products
INSERT INTO products (product_name, description, category_id, brand_id, material_id, target_audience_id, is_featured,
                      is_active, thumbnail)
VALUES ('Nike Revolution 6 Nam',
        'Giày chạy bộ Nike Revolution 6 mang lại sự thoải mái và đệm êm ái cho mỗi bước chạy, thiết kế với ít nhất 20% vật liệu tái chế theo trọng lượng.',
        1, 1, 1, 1, TRUE, TRUE, 'YellowCatWeb/hiitwcruaqxpuaxthlbs'),
       ('Adidas Duramo SL Nam',
        'Giày Adidas Duramo SL đa năng, phù hợp cho chạy bộ, tập gym hoặc mang hàng ngày, với lớp đệm Lightmotion siêu nhẹ.',
        1, 2, 1, 1, TRUE, TRUE, 'YellowCatWeb/o7sariwjck0tzocfsfsi'),
       ('Under Armour Curry Flow 9',
        'Giày bóng rổ Under Armour Curry Flow 9, công nghệ UA Flow cho độ bám sân tuyệt vời và cảm giác nhẹ như không.',
        3, 3, 3, 1, TRUE, TRUE, 'YellowCatWeb/ejzjv3cxkyyjtokkgh1t'),
       ('Puma Suede Classic XXI',
        'Đôi giày Puma Suede Classic XXI mang tính biểu tượng, phong cách đường phố cổ điển với chất liệu da lộn cao cấp và form dáng được cải tiến.',
        4, 4, 4, 1, FALSE, TRUE, 'YellowCatWeb/sx6bwsntnuwyfwx89tqt'),
       ('Nike Air Zoom Pegasus 40',
        'Nike Air Zoom Pegasus 40, tiếp nối di sản với cảm giác đàn hồi quen thuộc, hoàn hảo cho những quãng đường dài và mọi kiểu chạy.',
        2, 1, 5, 1, TRUE, TRUE, 'YellowCatWeb/byshsl4qboscrdnmuoix');

-- 4. Dữ liệu cho bảng ProductVariants
INSERT INTO product_variants (product_id, sku, color_id, size_id, price, sale_price, quantity_in_stock, sold, image_url,
                              weight)
VALUES
-- Nike Revolution 6
(1, 'NK-REV6-BLK-40', 3, 1, 1800000.00, 1620000.00, 50, 25, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.1),
(1, 'NK-REV6-BLK-41', 1, 1, 1800000.00, 1620000.00, 45, 30, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.2),
(1, 'NK-REV6-WHT-40', 2, 1, 1800000.00, NULL, 35, 15, 'YellowCatWeb/nike-rev6-white', 0.3),
(1, 'NK-REV6-WHT-42', 2, 3, 1800000.00, NULL, 40, 20, 'YellowCatWeb/nike-rev6-white', 0.4),

-- Adidas Duramo SL
(2, 'AD-DURSL-WHT-41', 2, 2, 1650000.00, 1485000.00, 55, 35, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.1),
(2, 'AD-DURSL-WHT-42', 2, 3, 1650000.00, 1485000.00, 65, 40, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.2),
(2, 'AD-DURSL-NVY-43', 3, 4, 1650000.00, NULL, 40, 25, 'YellowCatWeb/adidas-duramo-navy', 0.3),
(2, 'AD-DURSL-BLK-41', 1, 2, 1650000.00, NULL, 30, 18, 'YellowCatWeb/adidas-duramo-black', 0.4),

-- Under Armour Curry Flow 9
(3, 'UA-CUR9-BLU-42', 4, 3, 3500000.00, 3150000.00, 30, 12, 'YellowCatWeb/ejzjv3cxkyyjtokkgh1t', 0.2),
(3, 'UA-CUR9-GRY-44', 5, 5, 3500000.00, NULL, 22, 5, 'YellowCatWeb/ua-curry-grey', 0.3),
(3, 'UA-CUR9-RED-43', 6, 4, 3550000.00, NULL, 25, 8, 'YellowCatWeb/bqttubnjqa5qzb64kjnm', 0.4),
(3, 'UA-CUR9-BLK-41', 1, 2, 3500000.00, NULL, 20, 10, 'YellowCatWeb/ua-curry-black', 0.1),

-- Puma Suede Classic XXI
(4, 'PU-SUED-BLK-40', 1, 1, 2200000.00, 1980000.00, 35, 22, 'YellowCatWeb/sx6bwsntnuwyfwx89tqt', 0.2),
(4, 'PU-SUED-RED-41', 6, 2, 2200000.00, NULL, 30, 15, 'YellowCatWeb/lq1yqclrqebutga5pmrk', 0.3),
(4, 'PU-SUED-GRY-42', 5, 3, 2200000.00, NULL, 28, 12, 'YellowCatWeb/puma-suede-grey', 0.2),

-- Nike Air Zoom Pegasus 40
(5, 'NK-PEG40-BLK-41', 1, 2, 3200000.00, 2880000.00, 50, 30, 'YellowCatWeb/byshsl4qboscrdnmuoix', 0.3),
(5, 'NK-PEG40-WHT-42', 2, 3, 3200000.00, NULL, 55, 25, 'YellowCatWeb/acs7ki8v43lrjorsfnwb', 0.3),
(5, 'NK-PEG40-GRY-43', 5, 4, 3200000.00, NULL, 40, 18, 'YellowCatWeb/nike-pegasus-grey', 0.1);

-- 5. Dữ liệu cho bảng AppUsers
INSERT INTO app_users (keycloak_id, email, full_name, phone_number, avatar_url)
VALUES ('ab72419d-416b-4a75-8c49-f7ff012d01d9', 'nguyen.van.a@email.com', 'Nguyễn Văn A', '0901234567',
        'https://example.com/avatars/user1.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0532', 'tran.thi.b@email.com', 'Trần Thị B', '0902345678',
        'https://example.com/avatars/user2.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0533', 'le.van.c@email.com', 'Lê Văn C', '0903456789',
        'https://example.com/avatars/user3.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0534', 'pham.thi.d@email.com', 'Phạm Thị D', '0904567890',
        'https://example.com/avatars/user4.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0535', 'hoang.van.e@email.com', 'Hoàng Văn E', '0905678901',
        'https://example.com/avatars/user5.jpg');

-- 6. Dữ liệu cho bảng Addresses
INSERT INTO addresses (app_user_id, recipient_name, phone_number, street_address, ward_commune, district, city_province,
                       is_default, address_type)
VALUES (1, 'Nguyễn Văn A', '0901234567', '123 Đường Lê Lợi', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', TRUE,
        'home'),
       (1, 'Nguyễn Văn A', '0901234567', '456 Đường Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', FALSE,
        'office'),
       (2, 'Trần Thị B', '0902345678', '789 Đường Trần Hưng Đạo', 'Phường Cầu Kho', 'Quận 1', 'TP. Hồ Chí Minh', TRUE,
        'home'),
       (3, 'Lê Văn C', '0903456789', '321 Đường Điện Biên Phủ', 'Phường Đa Kao', 'Quận 1', 'TP. Hồ Chí Minh', TRUE,
        'home'),
       (4, 'Phạm Thị D', '0904567890', '654 Đường Võ Văn Tần', 'Phường 6', 'Quận 3', 'TP. Hồ Chí Minh', TRUE, 'home');

-- 7. Dữ liệu cho bảng ShippingMethods
INSERT INTO shipping_methods (method_name, description, base_cost, is_active)
VALUES ('Giao hàng tiêu chuẩn', 'Giao hàng trong 3-5 ngày làm việc', 30000.00, TRUE),
       ('Giao hàng nhanh', 'Giao hàng trong 1-2 ngày làm việc', 50000.00, TRUE),
       ('Giao hàng hỏa tốc', 'Giao hàng trong ngày', 100000.00, TRUE),
       ('Giao hàng miễn phí', 'Miễn phí giao hàng cho đơn hàng trên 1 triệu', 0.00, TRUE);

-- 8. Dữ liệu cho bảng Orders
INSERT INTO orders (order_code, app_user_id, shipping_address_id, sub_total_amount, shipping_fee, discount_amount,
                    final_amount, order_status, shipping_method_id, customer_notes)
VALUES ('ORD-2024-001', 1, 1, 3600000.00, 30000.00, 180000.00, 3450000.00, 'Delivered', 1, 'Giao hàng giờ hành chính'),
       ('ORD-2024-002', 2, 3, 1650000.00, 50000.00, 0.00, 1700000.00, 'Processing', 2, NULL),
       ('ORD-2024-003', 3, 4, 3500000.00, 0.00, 350000.00, 3150000.00, 'Shipped', 4, 'Liên hệ trước khi giao'),
       ('ORD-2024-004', 1, 2, 2200000.00, 30000.00, 0.00, 2230000.00, 'Pending', 1, NULL),
       ('ORD-2024-005', 4, 5, 5400000.00, 0.00, 540000.00, 4860000.00, 'Confirmed', 4, 'Giao hàng cuối tuần');

-- 9. Dữ liệu cho bảng OrderItems
INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, total_price)
VALUES
-- Order 1: 2 đôi Nike Revolution 6
(1, 1, 1, 1620000.00, 1620000.00),
(1, 2, 1, 1620000.00, 1620000.00),
(1, 3, 1, 1800000.00, 1800000.00),  -- Không sale

-- Order 2: 1 đôi Adidas Duramo SL
(2, 5, 1, 1485000.00, 1485000.00),
(2, 8, 1, 1650000.00, 1650000.00),  -- Không sale

-- Order 3: 1 đôi Under Armour Curry Flow 9
(3, 9, 1, 3150000.00, 3150000.00),
(3, 16, 1, 3200000.00, 3200000.00), -- Không sale

-- Order 4: 1 đôi Puma Suede
(4, 12, 1, 1980000.00, 1980000.00),
(4, 13, 1, 2200000.00, 2200000.00), -- Không sale

-- Order 5: 2 đôi Nike Pegasus 40
(5, 14, 1, 2880000.00, 2880000.00),
(5, 15, 1, 3200000.00, 3200000.00);
-- Không sale

-- 10. Dữ liệu cho bảng Payments
INSERT INTO payments (order_id, payment_method, transaction_id, amount, payment_status, payment_date)
VALUES (1, 'VNPay', 'VNP-20240101-001', 3450000.00, 'Completed', '2024-01-01 10:30:00'),
       (2, 'MoMo', 'MOMO-20240102-002', 1700000.00, 'Pending', '2024-01-02 14:15:00'),
       (3, 'ZaloPay', 'ZALO-20240103-003', 3150000.00, 'Completed', '2024-01-03 09:20:00'),
       (4, 'COD', NULL, 2230000.00, 'Pending', '2024-01-04 16:45:00'),
       (5, 'VNPay', 'VNP-20240105-005', 4860000.00, 'Completed', '2024-01-05 11:10:00');

-- 11. Dữ liệu cho bảng Shipments
INSERT INTO shipments (order_id, shipping_method_id, tracking_number, shipping_status, estimated_delivery_date,
                       actual_delivery_date, shipped_date, shipping_cost, notes)
VALUES (1, 1, 'GHN-001234567', 'Delivered', '2024-01-06', '2024-01-05', '2024-01-02 08:00:00', 30000.00,
        'Giao hàng thành công'),
       (2, 2, 'GHTK-002345678', 'In Transit', '2024-01-05', NULL, '2024-01-03 10:30:00', 50000.00, 'Đang vận chuyển'),
       (3, 4, 'BEST-003456789', 'Shipped', '2024-01-07', NULL, '2024-01-04 14:20:00', 0.00, 'Miễn phí vận chuyển'),
       (4, 1, NULL, 'Preparing', '2024-01-08', NULL, NULL, 30000.00, 'Đang chuẩn bị hàng'),
       (5, 4, 'SPX-005678901', 'Confirmed', '2024-01-09', NULL, NULL, 0.00, 'Chờ lấy hàng');

-- 12. Dữ liệu cho bảng Reviews
INSERT INTO reviews (product_id, app_user_id, rating, comment, review_date)
VALUES (1, 1, 5, 'Giày rất thoải mái, đi chạy bộ rất êm. Chất lượng tốt so với giá tiền.', '2024-01-06 20:30:00'),
       (1, 2, 4, 'Design đẹp, nhưng hơi rộng so với targetAudience thông thường.', '2024-01-07 15:45:00'),
       (2, 3, 5, 'Adidas luôn là lựa chọn tin cậy. Giày nhẹ, phù hợp tập gym.', '2024-01-08 09:15:00'),
       (3, 1, 4, 'Giày bóng rổ chất lượng cao, grip tốt trên sân.', '2024-01-09 18:20:00'),
       (4, 4, 3, 'Style đẹp nhưng chất liệu không bền như mong đợi.', '2024-01-10 12:10:00');

-- 1. Dữ liệu cho bảng promotions
INSERT INTO promotions
(app_user_id, promotion_code, promotion_name, description, discount_type, discount_value, start_date, end_date, is_active)
VALUES
    (1, 'NEWUSER10', 'Giảm giá 10% cho khách hàng mới', 'Chào mừng khách hàng mới với ưu đãi giảm 10%', 'percentage',
     10.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),

    (1, 'SALE50K', 'Giảm 50K cho đơn hàng trên 1 triệu', 'Giảm giá cố định 50K', 'fixed_amount',
     50000.00, '2025-01-01 00:00:00', '2025-06-30 23:59:59', TRUE),

    (1, 'SUMMER2025', 'Sale mùa hè 2025', 'Giảm 15% tất cả sản phẩm mùa hè', 'percentage',
     15.00, '2025-06-01 00:00:00', '2025-08-31 23:59:59', TRUE),

    (1, 'FREESHIP', 'Miễn phí vận chuyển', 'Miễn phí ship cho đơn hàng trên 500K', 'free_shipping',
     0.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', TRUE),

    (1, 'NIKE20', 'Giảm 20% sản phẩm Nike', 'Khuyến mãi đặc biệt cho thương hiệu Nike', 'percentage',
     20.00, '2025-02-01 00:00:00', '2025-02-28 23:59:59', TRUE);

-- 2. Dữ liệu cho bảng promotion_products
-- Giả sử các product_variant_id có sẵn lần lượt là 1,2,3,4
INSERT INTO promotion_products
    (promotion_id, variant_id)
VALUES
    -- NEWUSER10 áp dụng cho variant 1 và 2
    (1, 1),
    (1, 2),
    -- SUMMER2024 áp dụng cho variant 3 và 4
    (3, 3),
    (3, 4),
    -- NIKE20 áp dụng cho variant 5 (nếu có)
    (5, 5);

-- 3. Dữ liệu cho bảng promotion_orders
-- Giả sử các order_id tồn tại lần lượt là 1001,1002,1003,1004
INSERT INTO promotion_orders
(promotion_id, order_id, minimum_order_value, usage_limit_per_user, usage_limit_total)
VALUES
    -- NEWUSER10 cho đơn 1001 (tối thiểu 500K, 1 lần/người, tổng 1.000 lượt)
    (1, 1, 500000.00, 1, 1000),
    -- SALE50K cho đơn 1002 (tối thiểu 1.000K, 5 lần/người, không giới hạn tổng)
    (2, 2, 1000000.00, 5, NULL),
    -- FREESHIP cho đơn 1003 (tối thiểu 500K, không giới hạn lần/người và tổng)
    (4, 3, 500000.00, NULL, NULL),
    -- SUMMER2024 cho đơn 1004 (tối thiểu 800K, 3 lần/người, tổng 5.000 lượt)
    (3, 4, 800000.00, 3, 5000);
