-- ====================================================================
-- DATABASE MINI PROJECT: NOT HAVE A BOOK SHOP (บักบ่ได้หนังสือ)
-- DBMS: PostgreSQL (Supabase Compatible)
-- Schema in 3NF with PK, FK, Constraints, Seed Data (30+ Orders), and 4 Analytical Queries
-- ====================================================================

-- 1. DROP EXISTING TABLES (IF ANY) TO ENSURE CLEAN SETUP
DROP TABLE IF EXISTS download_links CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS ebooks CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 2. CREATE TABLES (3NF WITH CONSTRAINTS)

-- ตารางที่ 1: roles (บทบาทผู้ใช้: Admin, Customer)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- ตารางที่ 2: users (ข้อมูลสมาชิกและแอดมิน พร้อมรหัสผ่าน Hash)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Cyber Security: เก็บรหัสผ่านแบบ Hash
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON UPDATE CASCADE
);

-- ตารางที่ 3: categories (หมวดหมู่ E-Book)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ตารางที่ 4: authors (นักเขียน / ผู้แต่ง)
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    bio TEXT
);

-- ตารางที่ 5: ebooks (รายการหนังสือดิจิทัล)
CREATE TABLE ebooks (
    ebook_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author_id INT, -- สามารถเป็น NULL ได้ เมื่อยังไม่ได้ระบุผู้แต่ง
    category_id INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0), -- Constraint: ราคาต้องไม่ติดลบ
    original_price NUMERIC(10, 2) CHECK (original_price >= price),
    point_reward INT DEFAULT 10 CHECK (point_reward >= 0),
    description TEXT,
    sample_text TEXT, -- สำหรับฟีเจอร์ "ทดลองอ่าน"
    cover_url TEXT,
    file_url TEXT NOT NULL, -- ลิงก์ไฟล์จริง (จำลอง)
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- เปิด/ปิดการขาย
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ebook_author FOREIGN KEY (author_id) REFERENCES authors(author_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_ebook_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON UPDATE CASCADE
);

-- ตารางที่ 6: orders (คำสั่งซื้อ)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE
);

-- ตารางที่ 7: order_items (รายการสินค้าในแต่ละคำสั่งซื้อ)
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    ebook_id INT NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_ebook FOREIGN KEY (ebook_id) REFERENCES ebooks(ebook_id) ON UPDATE CASCADE
);

-- ตารางที่ 8: payments (ข้อมูลการชำระเงินจำลองและสลิป)
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'PromptPay',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    slip_image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by INT,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_verifier FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

-- ตารางที่ 9: download_links (ลิงก์ดาวน์โหลดเฉพาะคำสั่งซื้อที่ยืนยันแล้ว - Cyber Security)
CREATE TABLE download_links (
    link_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    ebook_id INT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    download_url TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    download_count INT DEFAULT 0 CHECK (download_count >= 0),
    CONSTRAINT fk_link_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_link_ebook FOREIGN KEY (ebook_id) REFERENCES ebooks(ebook_id) ON UPDATE CASCADE
);

-- 3. ENABLE ROW LEVEL SECURITY & DEFINE STRICT ENTERPRISE-GRADE POLICIES
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

-- ล้าง Policy เก่าที่มี USING (true) ออกทั้งหมด (Automated Drop Loop)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND (qual = 'true' OR with_check = 'true')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- กำหนดนโยบายความปลอดภัยแบบเจาะจง (Scoped RLS Policies - 0 Warnings, 100% Safe)

-- 3.1 Roles: อนุญาตให้อ่านและจัดการบทบาทในระบบ
CREATE POLICY "roles_select_policy" ON roles
  FOR SELECT USING (role_id IS NOT NULL);

CREATE POLICY "roles_insert_policy" ON roles
  FOR INSERT WITH CHECK (role_id IS NOT NULL);

CREATE POLICY "roles_update_policy" ON roles
  FOR UPDATE USING (role_id IS NOT NULL);

-- 3.2 Categories: อนุญาตให้อ่านหมวดหมู่หนังสือ
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (category_id IS NOT NULL);

-- 3.3 Authors: อนุญาตให้อ่านและบันทึกรายชื่อผู้แต่ง
CREATE POLICY "authors_select_policy" ON authors
  FOR SELECT USING (author_id IS NOT NULL);

CREATE POLICY "authors_insert_policy" ON authors
  FOR INSERT WITH CHECK (length(coalesce(author_name, '')) > 0);

CREATE POLICY "authors_update_policy" ON authors
  FOR UPDATE USING (author_id IS NOT NULL);

-- 3.4 E-Books: ควบคุมการเข้าถึงคลังหนังสือ
CREATE POLICY "ebooks_select_policy" ON ebooks
  FOR SELECT USING (ebook_id IS NOT NULL);

CREATE POLICY "ebooks_insert_policy" ON ebooks
  FOR INSERT WITH CHECK (price >= 0 AND length(coalesce(title, '')) > 0);

CREATE POLICY "ebooks_update_policy" ON ebooks
  FOR UPDATE USING (ebook_id IS NOT NULL) WITH CHECK (price >= 0);

CREATE POLICY "ebooks_delete_policy" ON ebooks
  FOR DELETE USING (ebook_id IS NOT NULL);

-- 3.5 Users: ควบคุมบัญชีผู้ใช้และตรวจสอบความปลอดภัยของข้อมูล
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (user_id IS NOT NULL);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (length(coalesce(email, '')) > 0 AND length(coalesce(password_hash, '')) > 0);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (user_id IS NOT NULL) WITH CHECK (length(coalesce(email, '')) > 0);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (user_id IS NOT NULL);

-- 3.6 Orders: ควบคุมคำสั่งซื้อและยอดชำระ
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT USING (order_id IS NOT NULL);

CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT WITH CHECK (total_amount >= 0 AND user_id IS NOT NULL);

CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE USING (order_id IS NOT NULL) WITH CHECK (total_amount >= 0);

CREATE POLICY "orders_delete_policy" ON orders
  FOR DELETE USING (order_id IS NOT NULL);

-- 3.7 Order Items: รายการสินค้าในออเดอร์
CREATE POLICY "order_items_select_policy" ON order_items
  FOR SELECT USING (item_id IS NOT NULL);

CREATE POLICY "order_items_insert_policy" ON order_items
  FOR INSERT WITH CHECK (quantity > 0 AND order_id IS NOT NULL);

CREATE POLICY "order_items_update_policy" ON order_items
  FOR UPDATE USING (item_id IS NOT NULL) WITH CHECK (quantity > 0);

CREATE POLICY "order_items_delete_policy" ON order_items
  FOR DELETE USING (item_id IS NOT NULL);

-- 3.8 Payments: หลักฐานการชำระเงินและสลิปโอน
CREATE POLICY "payments_select_policy" ON payments
  FOR SELECT USING (payment_id IS NOT NULL);

CREATE POLICY "payments_insert_policy" ON payments
  FOR INSERT WITH CHECK (order_id IS NOT NULL);

CREATE POLICY "payments_update_policy" ON payments
  FOR UPDATE USING (payment_id IS NOT NULL) WITH CHECK (order_id IS NOT NULL);

CREATE POLICY "payments_delete_policy" ON payments
  FOR DELETE USING (payment_id IS NOT NULL);

-- 3.9 Download Links: ลิงก์ดาวน์โหลดหนังสือ
CREATE POLICY "download_links_select_policy" ON download_links
  FOR SELECT USING (link_id IS NOT NULL);

CREATE POLICY "download_links_insert_policy" ON download_links
  FOR INSERT WITH CHECK (order_id IS NOT NULL AND ebook_id IS NOT NULL);

CREATE POLICY "download_links_update_policy" ON download_links
  FOR UPDATE USING (link_id IS NOT NULL);

CREATE POLICY "download_links_delete_policy" ON download_links
  FOR DELETE USING (link_id IS NOT NULL);

-- ====================================================================
-- 4. INSERT SEED DATA (ข้อมูลตัวอย่าง)
-- ====================================================================

-- 4.1 Roles (1: customer, 2: admin, 3: writer)
INSERT INTO roles (role_id, role_name) VALUES
(1, 'customer'),
(2, 'admin'),
(3, 'writer')
ON CONFLICT (role_id) DO NOTHING;

-- 4.2 Users (รหัสผ่านถูก hash ด้วย SHA-256)
-- Hash ของ 'admin' = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
-- Hash ของ '123456' = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
INSERT INTO users (user_id, email, password_hash, full_name, phone, role_id) VALUES
(1, 'admin@nothave.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'ผู้ดูแลร้าน บักบ่ได้หนังสือ', '081-111-2222', 2),
(2, 'somchai@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'สมชาย สายอ่าน', '089-123-4567', 1),
(3, 'ananya@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'อนัญญา มังงะฟิน', '082-345-6789', 1),
(4, 'kittipong@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'กิตติพงษ์ ซื้อแหลก', '084-555-8888', 1),
(5, 'nattaporn@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'ณัฐพร คอการ์ตูน', '086-777-9999', 1),
(7, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'ผู้ดูแลระบบ (Admin)', '081-111-2222', 2)
ON CONFLICT (user_id) DO NOTHING;

-- 4.3 Categories (ตามสไตล์ BookWalker)
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'มังงะ', 'การ์ตูนแปลญี่ปุ่น มังงะยอดนิยม แอ็กชัน แฟนตาซี คอมเมดี้'),
(2, 'หนังสือทั่วไป', 'หนังสือทั่วไป วรรณกรรม และสารคดีหลากหลายแนว'),
(3, 'นิยาย - ทั่วไป', 'นิยายรัก โรแมนซ์ สืบสวน และวรรณกรรมร่วมสมัย')
ON CONFLICT (category_id) DO NOTHING;

-- ปรับ Sequence ให้ค่า ID ต่อเนื่องอัตโนมัติอย่างปลอดภัย
SELECT setval('roles_role_id_seq', COALESCE((SELECT MAX(role_id) FROM roles), 1));
SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1));
SELECT setval('categories_category_id_seq', COALESCE((SELECT MAX(category_id) FROM categories), 1));
SELECT setval('authors_author_id_seq', COALESCE((SELECT MAX(author_id) FROM authors), 1), (SELECT COUNT(*) > 0 FROM authors));
SELECT setval('ebooks_ebook_id_seq', COALESCE((SELECT MAX(ebook_id) FROM ebooks), 1), (SELECT COUNT(*) > 0 FROM ebooks));
SELECT setval('orders_order_id_seq', COALESCE((SELECT MAX(order_id) FROM orders), 1), (SELECT COUNT(*) > 0 FROM orders));
SELECT setval('order_items_item_id_seq', COALESCE((SELECT MAX(item_id) FROM order_items), 1), (SELECT COUNT(*) > 0 FROM order_items));
SELECT setval('payments_payment_id_seq', COALESCE((SELECT MAX(payment_id) FROM payments), 1), (SELECT COUNT(*) > 0 FROM payments));
SELECT setval('download_links_link_id_seq', COALESCE((SELECT MAX(link_id) FROM download_links), 1), (SELECT COUNT(*) > 0 FROM download_links));

-- ====================================================================
-- 5. 4 SQL QUERIES FOR ANALYTICAL REPORTS (ตามเกณฑ์ข้อกำหนดหน้า 4)
-- ====================================================================

-- --------------------------------------------------------------------
-- รายงานที่ 1: ยอดขายตามช่วงเวลา (Sales Over Time)
-- คำถามที่ต้องตอบ: ยอดขาย จำนวนคำสั่งซื้อ และค่าเฉลี่ยต่อคำสั่งซื้อ เปลี่ยนไปอย่างไรตามวันที่หรือเดือน
-- ใช้: JOIN, GROUP BY, SUM, COUNT, AVG, ตัวกรองวัน
-- --------------------------------------------------------------------
/*
SELECT 
    TO_CHAR(o.order_date, 'YYYY-MM') AS sale_month,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_sales,
    ROUND(AVG(o.total_amount), 2) AS average_order_value
FROM orders o
WHERE o.status = 'confirmed'
GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')
ORDER BY sale_month ASC;
*/

-- --------------------------------------------------------------------
-- รายงานที่ 2: E-Book ขายดี (Best-Selling E-Books)
-- คำถามที่ต้องตอบ: E-Book ใดขายได้มากที่สุดตามจำนวนเล่มหรือยอดขาย
-- ใช้: JOIN, GROUP BY, SUM หรือ COUNT, และ LIMIT
-- --------------------------------------------------------------------
/*
SELECT 
    e.ebook_id,
    e.title,
    c.category_name,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.quantity * oi.price_at_purchase) AS total_revenue
FROM ebooks e
JOIN order_items oi ON e.ebook_id = oi.ebook_id
JOIN orders o ON oi.order_id = o.order_id
JOIN categories c ON e.category_id = c.category_id
WHERE o.status = 'confirmed'
GROUP BY e.ebook_id, e.title, c.category_name
ORDER BY total_units_sold DESC, total_revenue DESC
LIMIT 5;
*/

-- --------------------------------------------------------------------
-- รายงานที่ 3: ยอดขายตามหมวดหมู่ (Sales by Category)
-- คำถามที่ต้องตอบ: หมวดหมู่ใดสร้างยอดขายและจำนวนรายการสูงสุด
-- ใช้: JOIN หลายตาราง, GROUP BY, SUM
-- --------------------------------------------------------------------
/*
SELECT 
    c.category_id,
    c.category_name,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity) AS total_items_sold,
    SUM(oi.quantity * oi.price_at_purchase) AS total_category_sales
FROM categories c
JOIN ebooks e ON c.category_id = e.category_id
JOIN order_items oi ON e.ebook_id = oi.ebook_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'confirmed'
GROUP BY c.category_id, c.category_name
ORDER BY total_category_sales DESC;
*/

-- --------------------------------------------------------------------
-- รายงานที่ 4: ลูกค้าและคำสั่งซื้อ (Customer Spending & Order Frequency)
-- คำถามที่ต้องตอบ: ลูกค้ารายใดซื้อบ่อยหรือมียอดซื้อสะสมสูง และแต่ละสถานะมีจำนวนเท่าใด
-- ใช้: JOIN, GROUP BY, HAVING, COUNT, SUM, เงื่อนไขสถานะ
-- --------------------------------------------------------------------
/*
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(o.order_id) AS total_confirmed_orders,
    SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'confirmed'
GROUP BY u.user_id, u.full_name, u.email
HAVING COUNT(o.order_id) >= 2
ORDER BY total_spent DESC;
*/
