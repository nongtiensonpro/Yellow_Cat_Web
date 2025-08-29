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
    status        BOOLEAN   DEFAULT TRUE,
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
    status         BOOLEAN   DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chất liệu
CREATE TABLE materials
(
    material_id   SERIAL PRIMARY KEY,
    material_name VARCHAR(255) UNIQUE NOT NULL,
    description   TEXT,
    status        BOOLEAN   DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đối tượng sử dụng
CREATE TABLE target_audiences
(
    target_audience_id SERIAL PRIMARY KEY,
    audience_name      VARCHAR(50) UNIQUE NOT NULL,
    description        TEXT,
    status             BOOLEAN   DEFAULT TRUE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng màu sắc
CREATE TABLE colors
(
    color_id    SERIAL PRIMARY KEY,
    color_name  VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status      BOOLEAN   DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng kích thước
CREATE TABLE sizes
(
    size_id     SERIAL PRIMARY KEY,
    size_name   VARCHAR(20) NOT NULL, -- Ví dụ: "S", "M", "L", "XL"
    description TEXT,
    status      BOOLEAN   DEFAULT TRUE,
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
    created_by         INT,
    FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands (brand_id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materials (material_id) ON DELETE SET NULL,
    FOREIGN KEY (target_audience_id) REFERENCES target_audiences (target_audience_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
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
    cost_price        NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity_in_stock INT            NOT NULL DEFAULT 0,
    sold              INT            NOT NULL DEFAULT 0,
    image_url         VARCHAR(255)   NOT NULL,
    weight            FLOAT,
    created_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    created_by        INT,
    UNIQUE (product_id, color_id, size_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES colors (color_id) ON DELETE SET NULL,
    FOREIGN KEY (size_id) REFERENCES sizes (size_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng Địa chỉ
CREATE TABLE addresses
(
    address_id     SERIAL PRIMARY KEY,
    app_user_id    INT,
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
    delivery_date       TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    phone_number        VARCHAR(15),
    customer_name       VARCHAR(255),
    sub_total_amount    NUMERIC(14, 2) NOT NULL,
    shipping_fee        NUMERIC(10, 2)          DEFAULT 0,
    discount_amount     NUMERIC(12, 2)          DEFAULT 0,
    final_amount        NUMERIC(14, 2) NOT NULL,
    order_status        VARCHAR(50)    NOT NULL DEFAULT 'Pending',
    payment_status      VARCHAR(50)    NOT NULL DEFAULT 'UNPAID',
    shipping_method_id  INT,
    customer_notes      TEXT,
    is_synced_to_ghtk   BOOLEAN                 DEFAULT FALSE, -- Ghi nhận đơn đã gửi lên GHTK chưa
    updated_at          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
    created_at          TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE order_timelines
(
    id          SERIAL PRIMARY KEY,
    order_id    INT         NOT NULL,
    from_status VARCHAR(50),
    to_status   VARCHAR(50) NOT NULL,
    note        TEXT,
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by  int,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
);

-- Bảng Giao dịch thanh toán
CREATE TABLE payments
(
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT            NOT NULL,
    payment_method VARCHAR(50)    NOT NULL,
    transaction_id VARCHAR(255),
    zp_trans_id    VARCHAR(50),
    m_refund_id    VARCHAR(50),
    refund_amount  NUMERIC(12, 2),
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

CREATE TABLE order_timeline_images
(
    id          SERIAL PRIMARY KEY,
    image_url   TEXT,
    timeline_id INT,
    FOREIGN KEY (timeline_id) REFERENCES order_timelines (id)
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

-- Bảng Khuyến mãin cho san phẩm
CREATE TABLE promotions
(
    promotion_id   SERIAL PRIMARY KEY,
    app_user_id    INT            NOT NULL,
    promotion_code VARCHAR(50) unique,
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
CREATE TABLE promotion_programs
(
    promotion_program_id SERIAL PRIMARY KEY,
    created_by           INT            NOT NULL,
    updated_by           INT            NOT NULL,
    promotion_code       VARCHAR(50) unique,
    promotion_name       VARCHAR(255)   NOT NULL,
    description          TEXT,
    discount_type        VARCHAR(20)    NOT NULL, -- % and VNĐ
    discount_value       NUMERIC(10, 2) NOT NULL,
    start_date           TIMESTAMP      NOT NULL,
    end_date             TIMESTAMP      NOT NULL,
    is_active            BOOLEAN   DEFAULT TRUE,
    minimum_order_value  NUMERIC(12, 2) NOT NULL,
    usage_limit_per_user INT       DEFAULT 1,
    usage_limit_total    INT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng khuến mãi đã sử dụng
CREATE TABLE used_promotions
(
    used_promotion_id    SERIAL PRIMARY KEY,
    promotion_program_id INT NOT NULL,
    order_id             INT NOT NULL,
    quantity_used        INT NOT NULL DEFAULT 0,

    used_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (promotion_program_id) REFERENCES promotion_programs (promotion_program_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
);

-- Bảng Vouchers
CREATE TABLE vouchers
(
    voucher_id             SERIAL PRIMARY KEY,
    created_by             INT            NOT NULL,      -- Người tạo voucher
    voucher_code           VARCHAR(50) unique,
    voucher_name           VARCHAR(255)   NOT NULL,
    description            TEXT,
    discount_type          VARCHAR(20)    NOT NULL,      -- %, VNĐ, free_shipping
    discount_value         NUMERIC(10, 2) NOT NULL,
    start_date             TIMESTAMP      NOT NULL,
    end_date               TIMESTAMP      NOT NULL,
    is_active              BOOLEAN        DEFAULT TRUE,
    minimum_order_value    NUMERIC(12, 2) NOT NULL,
    maximum_discount_value NUMERIC(12, 2) DEFAULT NULL,  -- Giới hạn giá trị giảm giá tối đa
    usage_limit_per_user   INT            DEFAULT 1,
    usage_limit_total      INT,
    is_stackable           BOOLEAN        DEFAULT FALSE, -- Cho phép stack với các chương trình khuyến mãi khác
    total_used             INT            DEFAULT 0,     -- Tổng số lần đã sử dụng
    total_remaining        INT,                          -- Tổng số lần còn lại
    created_at             TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng Voucher đã sử dụng
CREATE TABLE used_vouchers
(
    used_voucher_id SERIAL PRIMARY KEY,
    voucher_id      INT NOT NULL,
    app_user_id     INT NOT NULL,
    order_id        INT NOT NULL,
    quantity_used   INT NOT NULL DEFAULT 0,
    used_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (voucher_id) REFERENCES vouchers (voucher_id) ON DELETE CASCADE,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE,
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

-- Cho PostgreSQL để sinh UUID
CREATE
    EXTENSION IF NOT EXISTS "pgcrypto";

-- Bảng lịch sử product
CREATE TABLE products_history
(
    history_id         SERIAL PRIMARY KEY,
    history_group_id   UUID      NOT NULL DEFAULT gen_random_uuid(),
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
    changed_by         INT,
    FOREIGN KEY (changed_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

-- Bảng lịch sử variant, tham chiếu history_group_id
CREATE TABLE product_variants_history
(
    history_id        SERIAL PRIMARY KEY,
    history_group_id  UUID      NOT NULL,
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
    changed_by        INT,
    FOREIGN KEY (changed_by) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

CREATE TABLE return_requests
(
    return_request_id SERIAL PRIMARY KEY,
    order_id          INT NOT NULL,
    app_user_id       INT NOT NULL,
    request_date      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    return_reason     TEXT,
    status            VARCHAR(50)    DEFAULT 'Pending', -- Pending, Approved, Rejected, Completed
    refund_amount     NUMERIC(12, 2) DEFAULT 0,
    processed_date    TIMESTAMP,
    note              TEXT,
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (app_user_id) REFERENCES app_users (app_user_id) ON DELETE CASCADE
);

CREATE TABLE return_items
(
    return_item_id    SERIAL PRIMARY KEY,
    return_request_id INT            NOT NULL,
    order_item_id     INT            NOT NULL,
    quantity_returned INT            NOT NULL,
    refund_amount     NUMERIC(12, 2) NOT NULL,
    reason            TEXT,

    FOREIGN KEY (return_request_id) REFERENCES return_requests (return_request_id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items (order_item_id) ON DELETE CASCADE
);

CREATE TABLE return_images
(
    return_image_id SERIAL PRIMARY KEY,
    return_item_id  INT  NOT NULL,
    image_url       TEXT NOT NULL,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description     TEXT,

    FOREIGN KEY (return_item_id) REFERENCES return_items (return_item_id) ON DELETE CASCADE
);


-- Thêm Index
CREATE INDEX idx_orders_user_id ON orders (app_user_id);
CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_reviews_product_user ON reviews (product_id, app_user_id);

-- 1. Trigger function: xử lý sau khi INSERT
CREATE
    OR REPLACE FUNCTION trg_after_insert_order_item()
    RETURNS TRIGGER AS
$$
BEGIN
    -- 1.1 Cộng số lượng bán vào trường sold của variant
    UPDATE product_variants
    SET sold = sold + NEW.quantity
    WHERE variant_id = NEW.variant_id;

-- 1.2 Cộng số lượng bán vào trường purchases của product
    UPDATE products
    SET purchases = purchases + NEW.quantity
    FROM product_variants pv
    WHERE products.product_id = pv.product_id
      AND pv.variant_id = NEW.variant_id;

    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;

-- 2. Tạo trigger AFTER INSERT trên order_items
CREATE TRIGGER after_insert_order_item
    AFTER INSERT
    ON order_items
    FOR EACH ROW
EXECUTE FUNCTION trg_after_insert_order_item();


-- 3. Trigger function: xử lý sau khi UPDATE (thay đổi quantity)
CREATE
    OR REPLACE FUNCTION trg_after_update_order_item()
    RETURNS TRIGGER AS
$$
DECLARE
    delta INT;
BEGIN
    -- Tính độ chênh giữa giá trị mới và cũ
    delta
        := NEW.quantity - OLD.quantity;

    IF
        delta <> 0 THEN
        -- 3.1 Cập nhật sold của variant
        UPDATE product_variants
        SET sold = sold + delta
        WHERE variant_id = NEW.variant_id;

-- 3.2 Cập nhật purchases của product
        UPDATE products
        SET purchases = purchases + delta
        FROM product_variants pv
        WHERE products.product_id = pv.product_id
          AND pv.variant_id = NEW.variant_id;
    END IF;

    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;

-- 4. Tạo trigger AFTER UPDATE trên order_items
CREATE TRIGGER after_update_order_item
    AFTER UPDATE OF quantity, variant_id
    ON order_items
    FOR EACH ROW
EXECUTE FUNCTION trg_after_update_order_item();


-- 5. Trigger function: xử lý sau khi DELETE
CREATE
    OR REPLACE FUNCTION trg_after_delete_order_item()
    RETURNS TRIGGER AS
$$
BEGIN
    -- 5.1 Trừ số lượng đã xóa khỏi sold
    UPDATE product_variants
    SET sold = sold - OLD.quantity
    WHERE variant_id = OLD.variant_id;

-- 5.2 Trừ khỏi purchases của product
    UPDATE products
    SET purchases = purchases - OLD.quantity
    FROM product_variants pv
    WHERE products.product_id = pv.product_id
      AND pv.variant_id = OLD.variant_id;

    RETURN OLD;
END;
$$
    LANGUAGE plpgsql;

-- 6. Tạo trigger AFTER DELETE trên order_items
CREATE TRIGGER after_delete_order_item
    AFTER DELETE
    ON order_items
    FOR EACH ROW
EXECUTE FUNCTION trg_after_delete_order_item();

CREATE TABLE product_waitlist_request
(
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(255),
    phone_number VARCHAR(20),
    email        VARCHAR(255),
    note         TEXT,
    status       VARCHAR(50),
    created_at   TIMESTAMP,
    activated_at TIMESTAMP,
    code         VARCHAR(50),
    app_user_id  INT REFERENCES app_users (app_user_id)
);

CREATE TABLE product_waitlist_items
(
    id                  SERIAL PRIMARY KEY,
    waitlist_request_id INT REFERENCES product_waitlist_request (id) ON DELETE CASCADE,
    product_variant_id  INT REFERENCES product_variants (variant_id),
    desired_quantity    INT
);

CREATE TABLE chat_session
(
    id          SERIAL PRIMARY KEY,
    customer_id INT REFERENCES app_users (app_user_id),
    staff_id    INT REFERENCES app_users (app_user_id),
    status      VARCHAR(50),
    created_at  TIMESTAMP,
    assigned_at TIMESTAMP
);

CREATE TABLE chat_message
(
    id          SERIAL PRIMARY KEY,
    session_id  BIGINT REFERENCES chat_session (id) ON DELETE CASCADE,
    sender_id   INT REFERENCES app_users (app_user_id),
    content     TEXT,
    sender_type VARCHAR(50),
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE
    OR REPLACE FUNCTION check_promotion_product_overlap()
    RETURNS TRIGGER AS
$$
DECLARE
    cnt INT;
    new_start
        TIMESTAMP;
    new_end
        TIMESTAMP;
BEGIN
    -- Lấy khoảng thời gian của promotion mới
    SELECT start_date, end_date
    INTO new_start, new_end
    FROM promotions
    WHERE promotion_id = NEW.promotion_id;

-- Đếm số khuyến mãi trùng lặp
    SELECT COUNT(*)
    INTO cnt
    FROM promotion_products pp
             JOIN promotions p ON p.promotion_id = pp.promotion_id
    WHERE pp.variant_id = NEW.variant_id
      AND pp.promotion_id <> NEW.promotion_id
      AND p.start_date <= new_end
      AND p.end_date >= new_start;

    IF
        cnt > 0 THEN
        RAISE EXCEPTION 'Đã tồn tại khuyến mãi khác cho sản phẩm này trong khoảng thời gian trùng lặp.';
    END IF;
    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;

CREATE TRIGGER trg_check_promotion_overlap
    BEFORE INSERT OR
        UPDATE
    ON promotion_products
    FOR EACH ROW
EXECUTE FUNCTION check_promotion_product_overlap();

-- Bảng chính lưu trữ thông tin voucher
CREATE TABLE voucher1
(
    id                  SERIAL PRIMARY KEY,                       -- ID tự tăng
    code                VARCHAR(50) UNIQUE,                       -- Mã voucher (duy nhất)
    name                VARCHAR(100),
    description         TEXT,                                     -- Mô tả voucher
    discount_type       VARCHAR(20),
    discount_value      DECIMAL(10, 2),                           -- Giá trị giảm (10% hoặc 100.000đ)
    start_date          TIMESTAMP,                                -- Ngày bắt đầu hiệu lực
    end_date            TIMESTAMP,                                -- Ngày hết hiệu lực
    max_usage           INT,                                      -- Số lần sử dụng tối đa
    usage_count         INT            DEFAULT 0,                 -- Đếm số lần đã sử dụng
    min_order_value     DECIMAL(10, 2) DEFAULT 0,                 -- Giá trị đơn hàng tối thiểu
    max_discount_amount DECIMAL(10, 2),                           -- Giảm tối đa (cho loại PERCENT)
    is_active           BOOLEAN        DEFAULT TRUE,              -- Trạng thái kích hoạt
    created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP, -- Thời điểm tạo
    update_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP  -- Thời điểm tạo
);

-- Bảng xác định phạm vi áp dụng voucher
CREATE TABLE voucher_scope
(
    id         SERIAL PRIMARY KEY,
    voucher_id INT REFERENCES voucher1 (id) ON DELETE CASCADE, -- Liên kết voucher
    scope_type VARCHAR(20),
    target_id  INT                                             -- ID sản phẩm/danh mục
);

-- Bảng quản lý số lần sử dụng của user
CREATE TABLE voucher_user
(
    id          SERIAL PRIMARY KEY,
    voucher_id  INT REFERENCES voucher1 (id) ON DELETE CASCADE,
    user_id     INT,
    usage_count INT DEFAULT 0,   -- Đếm số lần user đã dùng
    UNIQUE (voucher_id, user_id) -- Mỗi user chỉ có 1 bản ghi per voucher
);

-- Bảng lưu lịch sử sử dụng voucher
CREATE TABLE voucher_redemption
(
    id              SERIAL PRIMARY KEY,
    voucher_id      INT REFERENCES voucher1 (id) ON DELETE CASCADE,
    order_id        INT REFERENCES orders (order_id) ON DELETE CASCADE, -- Đơn hàng áp dụng
    user_id         INT,
    applied_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Thời điểm sử dụng
    discount_amount DECIMAL(10, 2)                                      -- Số tiền đã giảm
);


CREATE TABLE applied_promotions
(
    applied_promotion_id SERIAL PRIMARY KEY,
    order_item_id        INT            NOT NULL,
    promo_type           VARCHAR(20)    NOT NULL, -- PRODUCT / ORDER / VOUCHER
    promotion_code       VARCHAR(50)    NOT NULL,
    promotion_name       VARCHAR(255),
    discount_type        VARCHAR(20),
    discount_value       NUMERIC(10, 2),
    discount_amount      NUMERIC(12, 2) NOT NULL,
    applied_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Tham chiếu mềm (nullable) tới bảng gốc (giúp truy vết khi cần)
    promotion_id         INT,
    promotion_program_id INT,
    voucher_id           INT,

    CONSTRAINT fk_applied_order_item FOREIGN KEY (order_item_id)
        REFERENCES order_items (order_item_id) ON DELETE CASCADE
);

CREATE INDEX idx_applied_promotions_item ON applied_promotions (order_item_id);


-- 1. Categories
INSERT INTO categories (category_name, description)
VALUES ('Giày thể thao nam', 'Bộ sưu tập giày thể thao dành cho nam giới'),
       ('Giày chạy bộ', 'Giày chuyên dụng cho việc chạy bộ và tập luyện'),
       ('Giày bóng rổ', 'Giày chuyên dụng cho môn bóng rổ'),
       ('Giày thời trang', 'Giày thể thao phong cách đường phố');

-- 2. Brands
INSERT INTO brands (brand_name, logo_public_id, brand_info)
VALUES ('Nike', 'YellowCatWeb/t0hqgdma141foprsckjf',
        'Nike là một tập đoàn đa quốc gia của Mỹ...'),
       ('Adidas', 'YellowCatWeb/ajstsr8nluev6ich5uwg',
        'Adidas AG là một tập đoàn đa quốc gia đến từ Đức...'),
       ('Under Armour', 'YellowCatWeb/vcjjtizyqhvlfdggw7sd',
        'Under Armour, Inc. là một công ty sản xuất trang phục thể thao...'),
       ('Puma', 'YellowCatWeb/n54kyijbuhmmbtzlkh2h',
        'Puma SE là một công ty đa quốc gia của Đức...');

-- 3. Materials
INSERT INTO materials (material_name, description)
VALUES ('Vải lưới, Cao su', 'Kết hợp vải lưới thoáng khí và đế cao su bền bỉ'),
       ('Vải lưới, EVA', 'Kết hợp vải lưới và đế giữa EVA siêu nhẹ'),
       ('Vải kỹ thuật, UA Flow', 'Vải dệt kỹ thuật cao cấp và công nghệ đệm UA Flow'),
       ('Da lộn, Cao su', 'Chất liệu da lộn cổ điển và đế cao su'),
       ('Vải lưới, React Foam', 'Vải lưới kỹ thuật và công nghệ đệm React Foam');

-- 4. Target audiences
INSERT INTO target_audiences (audience_name, description)
VALUES ('Người lơn', 'Sản phẩm dành cho người lớn'),
       ('Trẻ nhỏ', 'Sản phẩm dành cho trẻ nhỏ');

-- 5. Colors
INSERT INTO colors (color_name, description)
VALUES ('Đen', 'Màu đen cơ bản'),
       ('Trắng', 'Màu trắng tinh khiết'),
       ('Xanh Navy', 'Màu xanh navy đậm'),
       ('Xanh Dương', 'Màu xanh dương'),
       ('Xám', 'Màu xám trung tính'),
       ('Đỏ', 'Màu đỏ nổi bật');

-- 6. Sizes
INSERT INTO sizes (size_name, description)
VALUES ('40', 'Cỡ giày 40'),
       ('41', 'Cỡ giày 41'),
       ('42', 'Cỡ giày 42'),
       ('43', 'Cỡ giày 43'),
       ('44', 'Cỡ giày 44');

-- 1. Bảng products (với 'purchases' đã được tính toán lại)
-- purchases = TỔNG(số lượng bán ra của tất cả các biến thể thuộc sản phẩm này)
INSERT INTO products (product_name, description, category_id, brand_id, material_id, target_audience_id,
                      purchases,
                      is_featured, is_active, thumbnail)
VALUES ('Nike Revolution 6 Nam', 'Giày chạy bộ Nike Revolution 6...', 1, 1, 1, 1, 6, TRUE, TRUE,
        'YellowCatWeb/hiitwcruaqxpuaxthlbs'),
       ('Adidas Duramo SL Nam', 'Giày Adidas Duramo SL đa năng...', 1, 2, 1, 1, 4, TRUE, TRUE,
        'YellowCatWeb/o7sariwjck0tzocfsfsi'),
       ('Under Armour Curry Flow 9', 'Giày bóng rổ Under Armour Curry...', 3, 3, 3, 1, 5, TRUE, TRUE,
        'YellowCatWeb/ejzjv3cxkyyjtokkgh1t'),
       ('Puma Suede Classic XXI', 'Đôi giày Puma Suede Classic XXI...', 4, 4, 4, 1, 5, FALSE, TRUE,
        'YellowCatWeb/sx6bwsntnuwyfwx89tqt'),
       ('Nike Air Zoom Pegasus 40', 'Nike Air Zoom Pegasus 40...', 2, 1, 5, 1, 4, TRUE, TRUE,
        'YellowCatWeb/byshsl4qboscrdnmuoix');

-- 2. Bảng product_variants (với 'sold' và 'quantity_in_stock' đã được tính toán lại)
-- sold = TỔNG(số lượng bán ra của biến thể này trong tất cả các đơn hàng)
-- quantity_in_stock = 100 - sold
INSERT INTO product_variants (product_id, sku, color_id, size_id, price, sale_price, cost_price,
                              quantity_in_stock,
                              sold, image_url, weight)
VALUES (1, 'NK-REV6-BLK-40', 3, 1, 1800000, 1800000, 1500000, 98, 2, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.1),
       (1, 'NK-REV6-BLK-41', 1, 2, 1800000, 1800000, 1500000, 98, 2, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 0.2),
       (1, 'NK-REV6-WHT-40', 2, 1, 1800000, 1800000, 1500000, 99, 1, 'YellowCatWeb/nike-rev6-white', 0.3),
       (1, 'NK-REV6-WHT-42', 2, 3, 1800000, 1800000, 1500000, 99, 1, 'YellowCatWeb/nike-rev6-white', 0.4),

       (2, 'AD-DURSL-WHT-41', 2, 2, 1650000, 1650000, 1400000, 99, 1, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.1),
       (2, 'AD-DURSL-WHT-42', 2, 3, 1650000, 1650000, 1400000, 98, 2, 'YellowCatWeb/o7sariwjck0tzocfsfsi', 0.2),
       (2, 'AD-DURSL-NVY-43', 3, 4, 1650000, 1650000, 1400000, 100, 0, 'YellowCatWeb/adidas-duramo-navy', 0.3),
       (2, 'AD-DURSL-BLK-41', 1, 2, 1650000, 1650000, 1400000, 99, 1, 'YellowCatWeb/adidas-duramo-black', 0.4),

       (3, 'UA-CUR9-BLU-42', 4, 3, 3500000, 3500000, 3000000, 98, 2, 'YellowCatWeb/ejzjv3cxkyyjtokkgh1t', 0.2),
       (3, 'UA-CUR9-GRY-44', 5, 5, 3500000, 3500000, 3000000, 19, 1, 'YellowCatWeb/ua-curry-grey', 0.3),
       (3, 'UA-CUR9-RED-43', 6, 4, 3550000, 3500000, 3000000, 98, 2, 'YellowCatWeb/bqttubnjqa5qzb64kjnm', 0.4),
       (3, 'UA-CUR9-BLK-41', 1, 2, 3500000, 3500000, 3000000, 100, 0, 'YellowCatWeb/ua-curry-black', 0.1),

       (4, 'PU-SUED-BLK-40', 1, 1, 2200000, 2200000, 1800000, 98, 2, 'YellowCatWeb/sx6bwsntnuwyfwx89tqt', 0.2),
       (4, 'PU-SUED-RED-41', 6, 2, 2200000, 2200000, 1800000, 99, 1, 'YellowCatWeb/lq1yqclrqebutga5pmrk', 0.3),
       (4, 'PU-SUED-GRY-42', 5, 3, 2200000, 2200000, 1800000, 98, 2, 'YellowCatWeb/puma-suede-grey', 0.2),

       (5, 'NK-PEG40-BLK-41', 1, 2, 3200000, 3200000, 2700000, 18, 2, 'YellowCatWeb/byshsl4qboscrdnmuoix', 0.3),
       (5, 'NK-PEG40-WHT-42', 2, 3, 3200000, 3200000, 2700000, 5, 1, 'YellowCatWeb/acs7ki8v43lrjorsfnwb', 0.3),
       (5, 'NK-PEG40-GRY-43', 5, 4, 3200000, 3200000, 2700000, 9, 1, 'YellowCatWeb/nike-pegasus-grey', 0.1);

-- 9. App Users
INSERT INTO app_users (keycloak_id, email, full_name, phone_number, avatar_url)
VALUES ('ab72419d-416b-4a75-8c49-f7ff012d0424', 'nguyen.van.a@email.com', 'Nguyễn Văn A', '0901234567',
        'https://example.com/avatars/user1.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0532', 'tran.thi.b@email.com', 'Trần Thị B', '0902345678',
        'https://example.com/avatars/user2.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0533', 'le.van.c@email.com', 'Lê Văn C', '0903456789',
        'https://example.com/avatars/user3.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0534', 'pham.thi.d@email.com', 'Phạm Thị D', '0904567890',
        'https://example.com/avatars/user4.jpg'),
       ('c56a4180-65aa-42ec-a945-5fd21dec0535', 'hoang.van.e@email.com', 'Hoàng Văn E', '0905678901',
        'https://example.com/avatars/user5.jpg');

-- 10. Addresses
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

-- 11. Shipping Methods
INSERT INTO shipping_methods (method_name, description, base_cost, is_active)
VALUES ('Giao hàng tiêu chuẩn', 'Giao hàng trong 3-5 ngày làm việc', 30000, TRUE),
       ('Giao hàng nhanh', 'Giao hàng trong 1-2 ngày làm việc', 50000, TRUE),
       ('Giao hàng hỏa tốc', 'Giao hàng trong ngày', 100000, TRUE),
       ('Giao hàng miễn phí', 'Miễn phí giao hàng cho đơn hàng trên 1 triệu', 0, TRUE);

-- Bảng orders với dữ liệu ngày tháng được cập nhật từ T6 - T8 năm 2025
INSERT INTO orders (order_code, app_user_id, shipping_address_id, sub_total_amount, shipping_fee, discount_amount,
                    final_amount, order_status, shipping_method_id, customer_notes, order_date, created_at, updated_at,
                    phone_number, customer_name)
VALUES
    -- Tháng 6/2025
    ('ORD-2024-001', 1, 1, 5040000, 30000, 180000,
     4890000, 'Delivered', 1, 'Giao hàng giờ hành chính', '2025-06-05',
     '2025-06-05 10:30:15', '2025-06-08 14:00:00', '0901234567', 'Nguyễn Văn A'),
    ('ORD-2024-002', 2, 3, 3135000, 50000, 0,
     3185000, 'Processing', 2, NULL, '2025-06-12', '2025-06-12 11:15:45',
     '2025-06-13 09:00:00', '0902345678', 'Trần Thị B'),
    ('ORD-2024-003', 3, 4, 3500000, 0, 350000,
     3150000, 'Shipping', 4, 'Liên hệ trước khi giao', '2025-06-18',
     '2025-06-18 09:20:00', '2025-06-20 16:30:00', '0903456789', 'Lê Văn C'),
    ('ORD-2024-004', 1, 2, 4400000, 30000, 0,
     4430000, 'Pending', 1, NULL, '2025-06-25', '2025-06-25 16:45:10',
     '2025-06-25 16:45:10', '0901234567', 'Nguyễn Văn A'),
    ('ORD-2024-005', 4, 5, 6400000, 0, 540000,
     5860000, 'Confirmed', 4, 'Giao hàng cuối tuần', '2025-06-30',
     '2025-06-30 11:10:05', '2025-06-30 11:10:05', '0904567890', 'Phạm Thị D'),

    -- Tháng 7/2025
    ('ORD-2024-006', 5, NULL, 5000000, 0, 0,
     5000000, 'Paid', 1, 'Giao nhanh giúp mình', '2025-07-02',
     '2025-07-02 11:00:20', '2025-07-05 15:30:00', '0987654321', 'Huy'),
    ('ORD-2024-007', 2, 3, 3200000, 50000, 0,
     3250000, 'Processing', 2, NULL, '2025-07-08', '2025-07-08 12:30:00',
     '2025-07-09 10:00:00', '0902345678', 'Trần Thị B'),
    ('ORD-2024-008', 3, 4, 5450000, 0, 500000,
     4950000, 'Shipping', 4, 'Để hàng ở quầy lễ tân', '2025-07-15',
     '2025-07-15 13:00:50', '2025-07-16 17:00:00', '0903456789', 'Lê Văn C'),
    ('ORD-2024-009', 1, 1, 1800000, 30000, 0,
     1830000, 'Pending', 1, NULL, '2025-07-22', '2025-07-22 14:45:00',
     '2025-07-22 14:45:00', '0901234567', 'Nguyễn Văn A'),
    ('ORD-2024-010', 4, 5, 3850000, 100000, 150000,
     3800000, 'Delivered', 3, 'Giao hỏa tốc', '2025-07-28',
     '2025-07-28 15:00:30', '2025-07-28 20:00:00', '0904567890', 'Phạm Thị D'),

    -- Tháng 8/2025
    ('ORD-2024-011', 5, NULL, 2200000, 30000, 100000,
     2130000, 'Cancelled', 1, 'Khách bom hàng', '2025-08-01',
     '2025-08-01 16:00:00', '2025-08-02 10:00:00', '0987654321', 'Huy'),
    ('ORD-2024-012', 2, 3, 1650000, 50000, 0,
     1700000, 'Confirmed', 2, NULL, '2025-08-07', '2025-08-07 10:10:10',
     '2025-08-07 10:10:10', '0902345678', 'Trần Thị B'),
    ('ORD-2024-013', 3, 4, 3500000, 0, 0,
     3500000, 'Delivered', 4, 'Hàng dễ vỡ, xin nhẹ tay', '2025-08-14',
     '2025-08-14 09:00:00', '2025-08-16 11:30:00', '0903456789', 'Lê Văn C'),
    ('ORD-2024-014', 1, 2, 4950000, 30000, 200000,
     4780000, 'Processing', 1, NULL, '2025-08-20', '2025-08-20 18:00:00',
     '2025-08-21 11:00:00', '0901234567', 'Nguyễn Văn A'),
    ('ORD-2024-015', 4, 5, 3200000, 0, 160000,
     3040000, 'Shipping', 4, 'Shop gói quà giúp mình nhé', '2025-08-26',
     '2025-08-26 19:30:00', '2025-08-27 14:00:00', '0904567890', 'Phạm Thị D');

-- 4. Bảng order_items (Thêm 10 đơn hàng mới)
-- total_price = quantity * price_at_purchase
INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, total_price)
VALUES
    -- Đơn hàng gốc
    (1, 1, 1, 1620000, 1620000),
    (1, 2, 1, 1620000, 1620000),
    (1, 3, 1, 1800000, 1800000),
    (2, 5, 1, 1485000, 1485000),
    (2, 8, 1, 1650000, 1650000),
    (3, 9, 1, 3500000, 3500000),
    (4, 13, 1, 2200000, 2200000),
    (4, 15, 1, 2200000, 2200000),
    (5, 16, 1, 3200000, 3200000),
    (5, 17, 1, 3200000, 3200000),
    -- 10 Đơn hàng mới
    (6, 11, 1, 3500000, 3500000),
    (6, 15, 1, 1500000, 1500000),  -- Giảm giá
    (7, 18, 1, 3200000, 3200000),
    (8, 2, 1, 1800000, 1800000),
    (8, 10, 1, 3650000, 3650000),  -- Giá cao hơn
    (9, 4, 1, 1800000, 1800000),
    (10, 1, 1, 1800000, 1800000),
    (10, 6, 1, 2050000, 2050000),
    (11, 13, 1, 2200000, 2200000),
    (12, 6, 1, 1650000, 1650000),
    (13, 11, 1, 3500000, 3500000),
    (14, 9, 1, 3500000, 3500000),
    (14, 14, 1, 1450000, 1450000), -- Giảm giá
    (15, 16, 1, 3200000, 3200000);

-- 5. Bảng payments (Thêm 10 thanh toán mới)
-- amount = final_amount của đơn hàng tương ứng
INSERT INTO payments (order_id, payment_method, transaction_id, amount, payment_status, payment_date)
VALUES
    -- Thanh toán gốc
    (1, 'VNPay', 'VNP-20240101-001', 4890000, 'Completed', '2024-01-01 10:30:00'),
    (2, 'MoMo', 'MOMO-20240102-002', 3185000, 'Pending', '2024-01-02 14:15:00'),
    (3, 'ZaloPay', 'ZALO-20240103-003', 3150000, 'Completed', '2024-01-03 09:20:00'),
    (4, 'COD', NULL, 4430000, 'Pending', '2024-01-04 16:45:00'),
    (5, 'VNPay', 'VNP-20240105-005', 5860000, 'Completed', '2024-01-05 11:10:00'),
    -- 10 Thanh toán mới
    (6, 'MoMo', 'MOMO-20240201-006', 5000000, 'Completed', '2024-02-01 11:00:00'),
    (7, 'COD', NULL, 3250000, 'Pending', '2024-02-02 12:30:00'),
    (8, 'VNPay', 'VNP-20240203-008', 4950000, 'Completed', '2024-02-03 13:00:00'),
    (9, 'ZaloPay', 'ZALO-20240204-009', 1830000, 'Pending', '2024-02-04 14:45:00'),
    (10, 'VNPay', 'VNP-20240205-010', 3800000, 'Completed', '2024-02-05 15:00:00'),
    (11, 'COD', NULL, 2130000, 'Failed', '2024-02-06 16:00:00'),
    (12, 'MoMo', 'MOMO-20240207-012', 1700000, 'Completed', '2024-02-07 10:10:00'),
    (13, 'ZaloPay', 'ZALO-20240208-013', 3500000, 'Completed', '2024-02-08 09:00:00'),
    (14, 'COD', NULL, 4780000, 'Pending', '2024-02-09 18:00:00'),
    (15, 'VNPay', 'VNP-20240210-015', 3040000, 'Completed', '2024-02-10 19:30:00');

-- 15. Shipments
INSERT INTO shipments (order_id, shipping_method_id, tracking_number, shipping_status, estimated_delivery_date,
                       actual_delivery_date, shipped_date, shipping_cost, notes)
VALUES (1, 1, 'GHN-001234567', 'Delivered', '2024-01-06', '2024-01-05', '2024-01-02 08:00:00', 30000,
        'Giao hàng thành công'),
       (2, 2, 'GHTK-002345678', 'In Transit', '2024-01-05', NULL, '2024-01-03 10:30:00', 50000, 'Đang vận chuyển'),
       (3, 4, 'BEST-003456789', 'Shipped', '2024-01-07', NULL, '2024-01-04 14:20:00', 0, 'Miễn phí vận chuyển'),
       (4, 1, NULL, 'Preparing', '2024-01-08', NULL, NULL, 30000, 'Đang chuẩn bị hàng'),
       (5, 4, 'SPX-005678901', 'Confirmed', '2024-01-09', NULL, NULL, 0, 'Chờ lấy hàng');

-- 16. Reviews
INSERT INTO reviews (product_id, app_user_id, rating, comment, review_date)
VALUES (1, 1, 5, 'Giày rất thoải mái, đi chạy bộ rất êm...', '2024-01-06 20:30:00'),
       (1, 2, 4, 'Design đẹp, nhưng hơi rộng...', '2024-01-07 15:45:00'),
       (2, 3, 5, 'Adidas luôn là lựa chọn tin cậy...', '2024-01-08 09:15:00'),
       (3, 1, 4, 'Giày bóng rổ chất lượng cao, grip tốt...', '2024-01-09 18:20:00'),
       (4, 4, 3, 'Style đẹp nhưng chất liệu không bền...', '2024-01-10 12:10:00');

-- 17. Return Requests
INSERT INTO return_requests (order_id, app_user_id, request_date, return_reason, status, refund_amount, note)
VALUES (1, 1, NOW(), 'Sản phẩm bị lỗi kỹ thuật', 'Pending', 0, 'Đang chờ kiểm tra');

-- 18. Return Items
INSERT INTO return_items (return_request_id, order_item_id, quantity_returned, refund_amount, reason)
VALUES (1, 1, 1, 1500000, 'Giày bị bung keo sau khi mang 2 ngày');

-- 19. Return Images
INSERT INTO return_images (return_item_id, image_url, description)
VALUES (1, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 'Ảnh mặt bên bị bung keo'),
       (1, 'YellowCatWeb/hiitwcruaqxpuaxthlbs', 'Ảnh mặt đế bị nứt');
