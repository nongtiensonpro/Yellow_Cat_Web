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

-- Bảng Categories
CREATE TABLE Categories
(
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO Categories (category_name)
VALUES ('Smartphones');
-- Bảng Brands
CREATE TABLE Brands
(
    brand_id    SERIAL PRIMARY KEY,
    brand_name  VARCHAR(255) NOT NULL,
    logo_public_id VARCHAR(255) NOT NULL,
    brand_info TEXT NOT NULL ,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Brands (brand_name, logo_public_id,brand_info)
VALUES ('Samsung', 'YellowCatWeb/mm0ibkgcunne0oa8odx1','Samsung Group (Korean: 삼성; Hanja: 三星; RR: samseong [samsʌŋ]; stylised as SΛMSUNG) is a South Korean multinational manufacturing conglomerate headquartered in the Samsung Town office complex in Seoul. The group consists of numerous affiliated businesses, most of which operate under the Samsung brand, and is the largest chaebol (business conglomerate) in South Korea. As of 2024, Samsung has the worlds fifth-highest brand value.');
-- Bảng Products
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
INSERT INTO Products (product_name, category_id, brand_id, description, purchases, is_active)
VALUES ('Samsung Galaxy S23', 1, 1, 'The Samsung Galaxy S23 is a flagship smartphone featuring a 6.1-inch Dynamic AMOLED display, Snapdragon 8 Gen 2 processor, and a triple-camera system.', 150, TRUE);
-- Bảng Attributes
CREATE TABLE Attributes
(
    attribute_id   SERIAL PRIMARY KEY,
    attribute_name VARCHAR(255) NOT NULL,
    data_type      VARCHAR(50)  NOT NULL
);
INSERT INTO Attributes (attribute_name, data_type)
VALUES
    ('Color', 'VARCHAR'),
    ('Storage', 'VARCHAR');
-- Bảng Attribute_Values
CREATE TABLE Attribute_Values
(
    attribute_value_id SERIAL PRIMARY KEY,
    attribute_id       INT REFERENCES Attributes (attribute_id) ON DELETE CASCADE,
    value              VARCHAR(255) NOT NULL
);
INSERT INTO Attribute_Values (attribute_id, value)
VALUES
    (1, 'Phantom Black'),  -- Color
    (1, 'Green'),         -- Color
    (2, '128GB'),         -- Storage
    (2, '256GB');         -- Storage
-- Bảng Product_Attributes
CREATE TABLE Product_Attributes
(
    product_attribute_id SERIAL PRIMARY KEY,
    product_id           INT REFERENCES Products (product_id) ON DELETE CASCADE,
    attribute_value_id   INT REFERENCES Attribute_Values (attribute_value_id) ON DELETE CASCADE
);
INSERT INTO Product_Attributes (product_id, attribute_value_id)
VALUES
    (1, 1),  -- Samsung Galaxy S23 có màu Phantom Black
    (1, 2),  -- Samsung Galaxy S23 có màu Green
    (1, 3),  -- Samsung Galaxy S23 có dung lượng 128GB
    (1, 4);  -- Samsung Galaxy S23 có dung lượng 256GB
-- Bảng Product_Variants
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
INSERT INTO Product_Variants (product_id, sku, price, stock_level, image_url, weight)
VALUES
    (1, 'S23-PB-128', 799.99, 50, 'YellowCatWeb/s23-phantom-black-128gb.jpg', 168.0),  -- Phantom Black, 128GB
    (1, 'S23-G-128', 799.99, 30, 'YellowCatWeb/s23-green-128gb.jpg', 168.0),       -- Green, 128GB
    (1, 'S23-PB-256', 849.99, 20, 'YellowCatWeb/s23-phantom-black-256gb.jpg', 168.0); -- Phantom Black, 256GB
-- Bảng Variant_Attributes
CREATE TABLE Variant_Attributes
(
    variant_attribute_id SERIAL PRIMARY KEY,
    variant_id           INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    attribute_value_id   INT REFERENCES Attribute_Values (attribute_value_id) ON DELETE CASCADE
);
INSERT INTO Variant_Attributes (variant_id, attribute_value_id)
VALUES
    (1, 1),  -- Variant 1 (Phantom Black, 128GB) - Color: Phantom Black
    (1, 3),  -- Variant 1 (Phantom Black, 128GB) - Storage: 128GB
    (2, 2),  -- Variant 2 (Green, 128GB) - Color: Green
    (2, 3),  -- Variant 2 (Green, 128GB) - Storage: 128GB
    (3, 1),  -- Variant 3 (Phantom Black, 256GB) - Color: Phantom Black
    (3, 4);  -- Variant 3 (Phantom Black, 256GB) - Storage: 256GB
-- Bảng Roles
CREATE TABLE Roles
(
    role_id     SERIAL PRIMARY KEY,
    role_name   VARCHAR(255) NOT NULL,
    description TEXT
);

-- Bảng Users
CREATE TABLE Users
(
    user_id    SERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    phone      VARCHAR(20) UNIQUE  NOT NULL,
    username   VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255)        NOT NULL,
    role_id    INT                 REFERENCES Roles (role_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Customers
CREATE TABLE Customers
(
    customer_id SERIAL PRIMARY KEY,
    user_id     INT REFERENCES Users (user_id) ON DELETE CASCADE,
    first_name  VARCHAR(255) NOT NULL,
    last_name   VARCHAR(255) NOT NULL,
    address     TEXT
);

-- Bảng Shippers
CREATE TABLE Shippers
(
    shipper_id   SERIAL PRIMARY KEY,
    first_name   VARCHAR(255)        NOT NULL,
    last_name    VARCHAR(255)        NOT NULL,
    phone        VARCHAR(20) UNIQUE  NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255)        NOT NULL
);

-- Bảng Employees
CREATE TABLE Employees
(
    employee_id SERIAL PRIMARY KEY,
    user_id     INT REFERENCES Users (user_id) ON DELETE CASCADE,
    first_name  VARCHAR(255) NOT NULL,
    last_name   VARCHAR(255) NOT NULL,
    hire_date   DATE         NOT NULL
);

-- Bảng Orders
CREATE TABLE Orders
(
    order_id         SERIAL PRIMARY KEY,
    customer_id      INT REFERENCES Customers (customer_id) ON DELETE CASCADE,
    order_date       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount     DECIMAL(10, 2) NOT NULL,
    status           order_status   NOT NULL,
    shipper_id       INT            REFERENCES Shippers (shipper_id) ON DELETE SET NULL,
    employee_id      INT            REFERENCES Employees (employee_id) ON DELETE SET NULL,
    shipping_address TEXT,
    billing_address  TEXT,
    shipping_method  VARCHAR(50),
    tracking_number  VARCHAR(100)
);

-- Bảng Order_Items
CREATE TABLE Order_Items
(
    order_item_id SERIAL PRIMARY KEY,
    order_id      INT REFERENCES Orders (order_id) ON DELETE CASCADE,
    variant_id    INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    quantity      INT            NOT NULL,
    price         DECIMAL(10, 2) NOT NULL,
    subtotal      DECIMAL(10, 2) NOT NULL
);

-- Bảng Payments
CREATE TABLE Payments
(
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT REFERENCES Orders (order_id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    payment_status payment_status NOT NULL,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount         DECIMAL(10, 2) NOT NULL,
    transaction_id VARCHAR(100)
);

-- Bảng Cart
CREATE TABLE Cart
(
    cart_id     SERIAL PRIMARY KEY,
    customer_id INT REFERENCES Customers (customer_id) ON DELETE CASCADE,
    variant_id  INT REFERENCES Product_Variants (variant_id) ON DELETE CASCADE,
    quantity    INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Reviews
CREATE TABLE Reviews
(
    review_id   SERIAL PRIMARY KEY,
    product_id  INT REFERENCES Products (product_id) ON DELETE CASCADE,
    customer_id INT REFERENCES Customers (customer_id) ON DELETE CASCADE,
    rating      INT CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Promotions
CREATE TABLE Promotions
(
    promotion_id     SERIAL PRIMARY KEY,
    promotion_name   VARCHAR(255) NOT NULL,
    discount_percent DECIMAL(5, 2),
    start_date       TIMESTAMP,
    end_date         TIMESTAMP,
    is_active        BOOLEAN DEFAULT TRUE
);

-- Bảng Product_Promotions
CREATE TABLE Product_Promotions
(
    product_promotion_id SERIAL PRIMARY KEY,
    product_id           INT REFERENCES Products (product_id) ON DELETE CASCADE,
    promotion_id         INT REFERENCES Promotions (promotion_id) ON DELETE CASCADE
);
