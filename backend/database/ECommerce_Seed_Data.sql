-- =====================================================
-- E-COMMERCE SEED DATA SCRIPT
-- Run this AFTER schema is created
-- Generated: 2026-05-16
-- =====================================================

SET NOCOUNT ON;
GO

-- =====================================================
-- 1. ADMIN USER + EMPLOYEE
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = 'F1E2D3C4-B5A6-9780-1234-567890ABCDEF')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('F1E2D3C4-B5A6-9780-1234-567890ABCDEF', 'admin@ecommerce.com', '$2b$10$AdminHashSecure1234567890123456789012345678901234567890', 'System Administrator', '+966500000001', 'admin', 1, '2024-01-01 08:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'E2D1C0B9-A8F7-8679-0123-456789BCDEF0')
INSERT INTO employees (employee_id, full_name, email, phone, department, job_title, hire_date, salary, reports_to, is_active)
VALUES ('E2D1C0B9-A8F7-8679-0123-456789BCDEF0', 'System Administrator', 'admin@ecommerce.com', '+966500000001', 'IT', 'Platform Admin', '2024-01-01', 120000.00, NULL, 1);
GO

-- =====================================================
-- 2. CUSTOMER USERS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = 'D3C2B1A0-9786-7568-9012-345678CDEF01')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('D3C2B1A0-9786-7568-9012-345678CDEF01', 'john.doe@email.com', '$2b$10$CustomerHash123456789012345678901234567890123456789012', 'John Doe', '+966501111111', 'customer', 1, '2026-03-15 10:30:00');
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = 'C4B3A291-8675-6457-8901-234567DEF012')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('C4B3A291-8675-6457-8901-234567DEF012', 'jane.smith@email.com', '$2b$10$CustomerHash234567890123456789012345678901234567890123', 'Jane Smith', '+966502222222', 'customer', 1, '2026-04-20 14:15:00');
GO

IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'D3C2B1A0-9786-7568-9012-345678CDEF01')
INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES ('D3C2B1A0-9786-7568-9012-345678CDEF01', 'Marketing Manager', 95000.00, 120);
GO

IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'C4B3A291-8675-6457-8901-234567DEF012')
INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES ('C4B3A291-8675-6457-8901-234567DEF012', 'Data Analyst', 78000.00, 85);
GO

-- =====================================================
-- 3. SELLER USERS + SELLER PROFILES
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = 'B5A49280-7564-5346-7890-123456EF0123')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('B5A49280-7564-5346-7890-123456EF0123', 'store1@techhub.com', '$2b$10$SellerHash12345678901234567890123456789012345678901234', 'TechHub Electronics', '+966503333333', 'seller', 1, '2025-06-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = 'A6958371-6453-4235-6789-012345F01234')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('A6958371-6453-4235-6789-012345F01234', 'store2@fashionworld.com', '$2b$10$SellerHash2345678901234567890123456789012345678901234', 'Fashion World', '+966504444444', 'seller', 1, '2025-08-15 11:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM sellers WHERE seller_id = '96857462-5342-3124-5678-901234012345')
INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES ('96857462-5342-3124-5678-901234012345', 'E2D1C0B9-A8F7-8679-0123-456789BCDEF0', 'TechHub Electronics', 'store1@techhub.com', '+966503333333', 'verified', 8.00, 4.8, '{"bank":"Al Rajhi","iban":"SA03...","account":"111111111"}', '2025-06-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM sellers WHERE seller_id = '85746351-4231-2013-4567-890123123456')
INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES ('85746351-4231-2013-4567-890123123456', 'E2D1C0B9-A8F7-8679-0123-456789BCDEF0', 'Fashion World', 'store2@fashionworld.com', '+966504444444', 'verified', 10.00, 4.6, '{"bank":"SNB","iban":"SA04...","account":"222222222"}', '2025-08-15 11:00:00');
GO

-- =====================================================
-- 4. CATEGORIES (Electronics, Clothing, Home + Subcategories)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM categories WHERE category_id = '74635240-3120-1902-3456-789012234567')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES 
('74635240-3120-1902-3456-789012234567', NULL, 'Electronics', 'electronics', 'All electronic devices and accessories', 'https://cdn.store.com/cat/electronics.jpg', 1, 1),
('63524130-2019-0891-2345-678901345678', NULL, 'Clothing', 'clothing', 'Men and women fashion apparel', 'https://cdn.store.com/cat/clothing.jpg', 2, 1),
('52413020-1908-9780-1234-567890456789', NULL, 'Home & Living', 'home-living', 'Furniture, decor, and kitchen essentials', 'https://cdn.store.com/cat/home.jpg', 3, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE category_id = '41302010-0807-8679-0123-456789567890')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES 
('41302010-0807-8679-0123-456789567890', '74635240-3120-1902-3456-789012234567', 'Smartphones', 'smartphones', 'Mobile phones and accessories', 'https://cdn.store.com/cat/phones.jpg', 1, 1),
('30201909-0706-7568-9012-345678678901', '74635240-3120-1902-3456-789012234567', 'Laptops', 'laptops', 'Notebooks and ultrabooks', 'https://cdn.store.com/cat/laptops.jpg', 2, 1),
('20190808-0605-6457-8901-234567789012', '63524130-2019-0891-2345-678901345678', 'Men', 'men', 'Men clothing and accessories', 'https://cdn.store.com/cat/men.jpg', 1, 1),
('19080707-0504-5346-7890-123456890123', '63524130-2019-0891-2345-678901345678', 'Women', 'women', 'Women clothing and accessories', 'https://cdn.store.com/cat/women.jpg', 2, 1);
GO

-- =====================================================
-- 5. PRODUCTS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = '08070606-0403-4235-6789-012345901234')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('08070606-0403-4235-6789-012345901234', '96857462-5342-3124-5678-901234012345', '41302010-0807-8679-0123-456789567890', 'IPH16-PRO-256', 'iPhone 16 Pro 256GB', 'iphone-16-pro-256gb', 'Latest Apple iPhone with A18 Pro chip, titanium design, and advanced camera system.', 4599.00, 150, 'Apple', 0.187, 1, 4.5, 12, '2026-01-15 08:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = '07060505-0302-3124-5678-901234012345')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('07060505-0302-3124-5678-901234012345', '96857462-5342-3124-5678-901234012345', '30201909-0706-7568-9012-345678678901', 'MBP-14-M4-512', 'MacBook Pro 14-inch M4', 'macbook-pro-14-m4', 'Apple MacBook Pro with M4 chip, 14-inch Liquid Retina XDR display, 512GB SSD.', 8999.00, 75, 'Apple', 1.55, 1, 4.8, 28, '2026-02-10 10:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = '06050404-0201-2013-4567-890123123456')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('06050404-0201-2013-4567-890123123456', '85746351-4231-2013-4567-890123123456', '20190808-0605-6457-8901-234567789012', 'TS-CLSC-WHT-M', 'Classic White T-Shirt', 'classic-white-tshirt', 'Premium cotton crew neck t-shirt, comfortable fit, machine washable.', 89.00, 500, 'Fashion World', 0.25, 1, 4.3, 45, '2025-12-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = '05040303-0100-1902-3456-789012234567')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('05040303-0100-1902-3456-789012234567', '85746351-4231-2013-4567-890123123456', '19080707-0504-5346-7890-123456890123', 'DR-SUM-FLR-S', 'Summer Floral Dress', 'summer-floral-dress', 'Lightweight floral print summer dress, breathable fabric, elegant design.', 249.00, 200, 'Fashion World', 0.35, 1, 4.6, 32, '2026-03-20 11:00:00');
GO

-- =====================================================
-- 6. PRODUCT IMAGES
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '04030202-0099-0891-2345-678901345678')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES 
('04030202-0099-0891-2345-678901345678', '08070606-0403-4235-6789-012345901234', 'https://cdn.store.com/img/iphone16-front.jpg', 'iPhone 16 Pro Front View', 1, 1),
('03020101-0098-9780-1234-567890456789', '08070606-0403-4235-6789-012345901234', 'https://cdn.store.com/img/iphone16-back.jpg', 'iPhone 16 Pro Back View', 0, 2);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '02010100-0097-8679-0123-456789567890')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('02010100-0097-8679-0123-456789567890', '07060505-0302-3124-5678-901234012345', 'https://cdn.store.com/img/macbook-m4.jpg', 'MacBook Pro 14 M4 Space Black', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '01010099-0096-7568-9012-345678678901')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('01010099-0096-7568-9012-345678678901', '06050404-0201-2013-4567-890123123456', 'https://cdn.store.com/img/tshirt-white.jpg', 'Classic White T-Shirt Front', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '00999898-0095-6457-8901-234567789012')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('00999898-0095-6457-8901-234567789012', '05040303-0100-1902-3456-789012234567', 'https://cdn.store.com/img/dress-floral.jpg', 'Summer Floral Dress Full View', 1, 1);
GO

-- =====================================================
-- 7. PRODUCT VARIANTS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '08070606-0403-4235-6789-012345901234')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '08070606-0403-4235-6789-012345901234', 'Color: Titanium Black', 0, 50, 'IPH16-PRO-256-BLK'),
(NEWID(), '08070606-0403-4235-6789-012345901234', 'Color: Desert Titanium', 0, 45, 'IPH16-PRO-256-DST'),
(NEWID(), '08070606-0403-4235-6789-012345901234', 'Color: Natural Titanium', 100.00, 55, 'IPH16-PRO-256-NT');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '07060505-0302-3124-5678-901234012345')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '07060505-0302-3124-5678-901234012345', 'RAM: 16GB / SSD: 512GB', 0, 40, 'MBP-14-M4-16-512'),
(NEWID(), '07060505-0302-3124-5678-901234012345', 'RAM: 32GB / SSD: 1TB', 2500.00, 20, 'MBP-14-M4-32-1TB');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '06050404-0201-2013-4567-890123123456')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '06050404-0201-2013-4567-890123123456', 'Size: S', 0, 100, 'TS-CLSC-WHT-S'),
(NEWID(), '06050404-0201-2013-4567-890123123456', 'Size: M', 0, 200, 'TS-CLSC-WHT-M'),
(NEWID(), '06050404-0201-2013-4567-890123123456', 'Size: L', 0, 150, 'TS-CLSC-WHT-L'),
(NEWID(), '06050404-0201-2013-4567-890123123456', 'Size: XL', 10.00, 50, 'TS-CLSC-WHT-XL');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '05040303-0100-1902-3456-789012234567')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '05040303-0100-1902-3456-789012234567', 'Size: S', 0, 50, 'DR-SUM-FLR-S'),
(NEWID(), '05040303-0100-1902-3456-789012234567', 'Size: M', 0, 80, 'DR-SUM-FLR-M'),
(NEWID(), '05040303-0100-1902-3456-789012234567', 'Size: L', 0, 70, 'DR-SUM-FLR-L');
GO

-- =====================================================
-- 8. WAREHOUSE
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM warehouses WHERE warehouse_id = '98979797-0094-5346-7890-123456890123')
INSERT INTO warehouses (warehouse_id, manager_id, warehouse_name, location, is_active)
VALUES ('98979797-0094-5346-7890-123456890123', 'E2D1C0B9-A8F7-8679-0123-456789BCDEF0', 'Jeddah Distribution Center', 'Jeddah Industrial Area, Saudi Arabia', 1);
GO

-- =====================================================
-- 9. PRODUCT DISTRIBUTIONS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '08070606-0403-4235-6789-012345901234')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '08070606-0403-4235-6789-012345901234', '98979797-0094-5346-7890-123456890123', 80, 5);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '07060505-0302-3124-5678-901234012345')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '07060505-0302-3124-5678-901234012345', '98979797-0094-5346-7890-123456890123', 40, 3);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '06050404-0201-2013-4567-890123123456')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '06050404-0201-2013-4567-890123123456', '98979797-0094-5346-7890-123456890123', 300, 20);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '05040303-0100-1902-3456-789012234567')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '05040303-0100-1902-3456-789012234567', '98979797-0094-5346-7890-123456890123', 120, 10);
GO

-- =====================================================
-- 10. DISCOUNTS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM discounts WHERE product_id = '08070606-0403-4235-6789-012345901234')
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES (NEWID(), '08070606-0403-4235-6789-012345901234', 'percentage', 15.00, '2026-05-15 00:00:00', '2026-05-25 23:59:59', NULL, 100, 12, 1);
GO

IF NOT EXISTS (SELECT 1 FROM discounts WHERE product_id = '06050404-0201-2013-4567-890123123456')
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES (NEWID(), '06050404-0201-2013-4567-890123123456', 'fixed', 20.00, '2026-05-01 00:00:00', '2026-05-31 23:59:59', 150.00, 500, 89, 1);
GO

-- =====================================================
-- 11. COUPONS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME2026')
INSERT INTO coupons (coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, starts_at, expires_at, is_active)
VALUES (NEWID(), 'WELCOME2026', 'percentage', 15.00, 200.00, 300.00, 1000, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);
GO

IF NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FLASH50')
INSERT INTO coupons (coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, starts_at, expires_at, is_active)
VALUES (NEWID(), 'FLASH50', 'fixed', 50.00, 500.00, 50.00, 200, 0, '2026-05-16 00:00:00', '2026-05-20 23:59:59', 1);
GO

-- =====================================================
-- 12. ADDRESSES FOR CUSTOMERS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM addresses WHERE address_id = '87868686-0093-4235-6789-012345901234')
INSERT INTO addresses (address_id, customer_id, address_type, label, recipient_name, phone, street, city, state, country, postal_code, is_default)
VALUES ('87868686-0093-4235-6789-012345901234', 'D3C2B1A0-9786-7568-9012-345678CDEF01', 'home', 'Home', 'John Doe', '+966501111111', '456 Al Olaya Street', 'Riyadh', 'Riyadh Region', 'Saudi Arabia', '12211', 1);
GO

IF NOT EXISTS (SELECT 1 FROM addresses WHERE address_id = '76757575-0092-3124-5678-901234012345')
INSERT INTO addresses (address_id, customer_id, address_type, 'work', 'Office', 'Jane Smith', '+966502222222', '789 King Abdulaziz Road', 'Jeddah', 'Makkah Region', 'Saudi Arabia', '23322', 1);
GO

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
PRINT '========== SEED DATA VERIFICATION ==========';
GO

SELECT '--- USERS ---' AS section;
SELECT user_id, email, full_name, role, is_active FROM users ORDER BY role, created_at;
GO

SELECT '--- EMPLOYEES ---' AS section;
SELECT employee_id, full_name, department, job_title, is_active FROM employees;
GO

SELECT '--- CUSTOMERS ---' AS section;
SELECT c.customer_id, u.full_name, c.job_title, c.loyalty_points 
FROM customers c JOIN users u ON c.customer_id = u.user_id;
GO

SELECT '--- SELLERS ---' AS section;
SELECT s.seller_id, s.business_name, s.email, s.verification_status, s.rating_avg, s.commission_rate
FROM sellers s;
GO

SELECT '--- CATEGORIES ---' AS section;
SELECT category_id, parent_category_id, category_name, slug, is_active 
FROM categories ORDER BY parent_category_id NULLS FIRST, sort_order;
GO

SELECT '--- PRODUCTS ---' AS section;
SELECT p.product_id, p.name, p.sku, p.base_price, p.stock_quantity, p.brand, p.avg_rating, s.business_name AS seller
FROM products p JOIN sellers s ON p.seller_id = s.seller_id;
GO

SELECT '--- PRODUCT IMAGES ---' AS section;
SELECT pi.image_id, p.name AS product_name, pi.image_url, pi.is_primary, pi.sort_order
FROM product_images pi JOIN products p ON pi.product_id = p.product_id;
GO

SELECT '--- PRODUCT VARIANTS ---' AS section;
SELECT pv.variant_id, p.name AS product_name, pv.variant_name, pv.price_adjustment, pv.stock_quantity, pv.sku
FROM product_variants pv JOIN products p ON pv.product_id = p.product_id;
GO

SELECT '--- WAREHOUSES ---' AS section;
SELECT warehouse_id, warehouse_name, location, is_active FROM warehouses;
GO

SELECT '--- PRODUCT DISTRIBUTIONS ---' AS section;
SELECT pd.distribution_id, p.name AS product, w.warehouse_name, pd.quantity_available, pd.reserved_quantity
FROM product_distributions pd
JOIN products p ON pd.product_id = p.product_id
JOIN warehouses w ON pd.warehouse_id = w.warehouse_id;
GO

SELECT '--- DISCOUNTS ---' AS section;
SELECT d.discount_id, p.name AS product, d.discount_type, d.discount_value, d.start_date, d.end_date, d.is_active
FROM discounts d JOIN products p ON d.product_id = p.product_id;
GO

SELECT '--- COUPONS ---' AS section;
SELECT coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, is_active FROM coupons;
GO

SELECT '--- ADDRESSES ---' AS section;
SELECT a.address_id, u.full_name AS customer, a.label, a.city, a.country, a.is_default
FROM addresses a JOIN users u ON a.customer_id = u.user_id;
GO

PRINT '========== SEED COMPLETE ==========';
GO
