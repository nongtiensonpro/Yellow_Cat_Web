create table DemoModel
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    age  INT
);

-- Chèn 10 dữ liệu giả
INSERT INTO DemoModel (name, age) VALUES
('Nguyễn Văn A', 25),
('Trần Thị B', 30),
('Lê Văn C', 35),
('Phạm Thị D', 28),
('Hoàng Văn E', 40),
('Đỗ Thị F', 22),
('Vũ Văn G', 33),
('Bùi Thị H', 27),
('Đặng Văn I', 38),
('Ngô Thị K', 29);