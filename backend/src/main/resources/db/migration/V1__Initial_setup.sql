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