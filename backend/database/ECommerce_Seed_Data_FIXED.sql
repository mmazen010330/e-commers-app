-- =====================================================
-- E-COMMERCE SEED DATA SCRIPT (CLEAN FIXED VERSION)
-- Run this AFTER schema is created
-- Generated: 2026-05-16
-- =====================================================

SET NOCOUNT ON;
GO

-- =====================================================
-- 1. ADMIN USER + EMPLOYEE
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ecommerce.com')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('BC567DD5-7740-4D96-AE4B-FB144B30859F', 'admin@ecommerce.com', '$2b$10$AdminHashSecure1234567890123456789012345678901234567890', 'System Administrator', '+966500000001', 'admin', 1, '2024-01-01 08:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM employees WHERE email = 'admin@ecommerce.com')
INSERT INTO employees (employee_id, full_name, email, phone, department, job_title, hire_date, salary, reports_to, is_active)
VALUES ('5B7DEE8D-C411-4FBE-80BB-306CD3493ED0', 'System Administrator', 'admin@ecommerce.com', '+966500000001', 'IT', 'Platform Admin', '2024-01-01', 120000.00, NULL, 1);
GO

-- =====================================================
-- 2. CUSTOMER USERS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'john.doe@email.com')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('AB1B2AD3-C338-41A2-A942-EA395C6E1D53', 'john.doe@email.com', '$2b$10$CustomerHash123456789012345678901234567890123456789012', 'John Doe', '+966501111111', 'customer', 1, '2026-03-15 10:30:00');
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'jane.smith@email.com')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('CAB78A55-4EF9-4425-80A8-83F0E1361053', 'jane.smith@email.com', '$2b$10$CustomerHash234567890123456789012345678901234567890123', 'Jane Smith', '+966502222222', 'customer', 1, '2026-04-20 14:15:00');
GO

IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'AB1B2AD3-C338-41A2-A942-EA395C6E1D53')
INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES ('AB1B2AD3-C338-41A2-A942-EA395C6E1D53', 'Marketing Manager', 95000.00, 120);
GO

IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = 'CAB78A55-4EF9-4425-80A8-83F0E1361053')
INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES ('CAB78A55-4EF9-4425-80A8-83F0E1361053', 'Data Analyst', 78000.00, 85);
GO

-- =====================================================
-- 3. SELLER USERS + SELLER PROFILES
-- IMPORTANT: seller_id MUST EQUAL user_id (FK constraint)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'store1@techhub.com')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('07EED7CB-5F19-4BE4-B61E-AB63631B236E', 'store1@techhub.com', '$2b$10$SellerHash12345678901234567890123456789012345678901234', 'TechHub Electronics', '+966503333333', 'seller', 1, '2025-06-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'store2@fashionworld.com')
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('70380862-DAEF-4FF4-A030-62C5FFAFDE18', 'store2@fashionworld.com', '$2b$10$SellerHash2345678901234567890123456789012345678901234', 'Fashion World', '+966504444444', 'seller', 1, '2025-08-15 11:00:00');
GO

-- Seller profile uses SAME ID as user_id
IF NOT EXISTS (SELECT 1 FROM sellers WHERE seller_id = '07EED7CB-5F19-4BE4-B61E-AB63631B236E')
INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES ('07EED7CB-5F19-4BE4-B61E-AB63631B236E', '5B7DEE8D-C411-4FBE-80BB-306CD3493ED0', 'TechHub Electronics', 'store1@techhub.com', '+966503333333', 'verified', 8.00, 4.8, '{"bank":"Al Rajhi","iban":"SA03...","account":"111111111"}', '2025-06-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM sellers WHERE seller_id = '70380862-DAEF-4FF4-A030-62C5FFAFDE18')
INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES ('70380862-DAEF-4FF4-A030-62C5FFAFDE18', '5B7DEE8D-C411-4FBE-80BB-306CD3493ED0', 'Fashion World', 'store2@fashionworld.com', '+966504444444', 'verified', 10.00, 4.6, '{"bank":"SNB","iban":"SA04...","account":"222222222"}', '2025-08-15 11:00:00');
GO

-- =====================================================
-- 4. CATEGORIES (check by slug to avoid duplicates)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'electronics')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('7B56B890-1D0B-4ED8-8367-986DA301C799', NULL, 'Electronics', 'electronics', 'All electronic devices and accessories', 'https://cdn.store.com/cat/electronics.jpg', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'clothing')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('AF3950D7-C917-4FF2-99BF-5F612B30ABD8', NULL, 'Clothing', 'clothing', 'Men and women fashion apparel', 'https://cdn.store.com/cat/clothing.jpg', 2, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-living')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('3D17B2C1-C1E4-433E-85C4-4A06AC872AA4', NULL, 'Home & Living', 'home-living', 'Furniture, decor, and kitchen essentials', 'https://cdn.store.com/cat/home.jpg', 3, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'smartphones')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('46FDE296-D2EF-44DA-9CE0-38856D4CBEA7', '7B56B890-1D0B-4ED8-8367-986DA301C799', 'Smartphones', 'smartphones', 'Mobile phones and accessories', 'https://cdn.store.com/cat/phones.jpg', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'laptops')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('485DC524-44A5-4099-AEA5-EF2E2CA34E58', '7B56B890-1D0B-4ED8-8367-986DA301C799', 'Laptops', 'laptops', 'Notebooks and ultrabooks', 'https://cdn.store.com/cat/laptops.jpg', 2, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'men')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('184EE6BB-C05C-4402-A28B-3C398E69B40E', 'AF3950D7-C917-4FF2-99BF-5F612B30ABD8', 'Men', 'men', 'Men clothing and accessories', 'https://cdn.store.com/cat/men.jpg', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'women')
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES ('24FAEEE4-C9C2-4403-8B31-05640960F94B', 'AF3950D7-C917-4FF2-99BF-5F612B30ABD8', 'Women', 'women', 'Women clothing and accessories', 'https://cdn.store.com/cat/women.jpg', 2, 1);
GO

-- =====================================================
-- 5. PRODUCTS (check by slug)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'iphone-16-pro-256gb')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('33B021C5-DEC2-40C1-BB64-1B9C28F51E53', '07EED7CB-5F19-4BE4-B61E-AB63631B236E', '46FDE296-D2EF-44DA-9CE0-38856D4CBEA7', 'IPH16-PRO-256', 'iPhone 16 Pro 256GB', 'iphone-16-pro-256gb', 'Latest Apple iPhone with A18 Pro chip, titanium design, and advanced camera system.', 4599.00, 150, 'Apple', 0.187, 1, 4.5, 12, '2026-01-15 08:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'macbook-pro-14-m4')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('988FA094-B369-434B-A946-8C6BA7B6E4C9', '07EED7CB-5F19-4BE4-B61E-AB63631B236E', '485DC524-44A5-4099-AEA5-EF2E2CA34E58', 'MBP-14-M4-512', 'MacBook Pro 14-inch M4', 'macbook-pro-14-m4', 'Apple MacBook Pro with M4 chip, 14-inch Liquid Retina XDR display, 512GB SSD.', 8999.00, 75, 'Apple', 1.55, 1, 4.8, 28, '2026-02-10 10:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'classic-white-tshirt')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('D9C035E5-3C94-459A-9730-E176F66E6E83', '70380862-DAEF-4FF4-A030-62C5FFAFDE18', '184EE6BB-C05C-4402-A28B-3C398E69B40E', 'TS-CLSC-WHT-M', 'Classic White T-Shirt', 'classic-white-tshirt', 'Premium cotton crew neck t-shirt, comfortable fit, machine washable.', 89.00, 500, 'Fashion World', 0.25, 1, 4.3, 45, '2025-12-01 09:00:00');
GO

IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'summer-floral-dress')
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES ('31FA7E5B-FE75-4693-A422-20DA91EE3537', '70380862-DAEF-4FF4-A030-62C5FFAFDE18', '24FAEEE4-C9C2-4403-8B31-05640960F94B', 'DR-SUM-FLR-S', 'Summer Floral Dress', 'summer-floral-dress', 'Lightweight floral print summer dress, breathable fabric, elegant design.', 249.00, 200, 'Fashion World', 0.35, 1, 4.6, 32, '2026-03-20 11:00:00');
GO

-- =====================================================
-- 6. PRODUCT IMAGES
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = 'ED7E84DF-1050-4A52-8D75-2E8A4F86B07B')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES 
('ED7E84DF-1050-4A52-8D75-2E8A4F86B07B', '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'https://cdn.store.com/img/iphone16-front.jpg', 'iPhone 16 Pro Front View', 1, 1),
('79DE1731-3D93-4714-9C9D-73F117F5FF78', '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'https://cdn.store.com/img/iphone16-back.jpg', 'iPhone 16 Pro Back View', 0, 2);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '3FE8A408-AABA-4374-BE99-E35E2893D75D')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('3FE8A408-AABA-4374-BE99-E35E2893D75D', '988FA094-B369-434B-A946-8C6BA7B6E4C9', 'https://cdn.store.com/img/macbook-m4.jpg', 'MacBook Pro 14 M4 Space Black', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '823EF46A-7D57-4974-9E00-3CC5CE40EE88')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('823EF46A-7D57-4974-9E00-3CC5CE40EE88', 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'https://cdn.store.com/img/tshirt-white.jpg', 'Classic White T-Shirt Front', 1, 1);
GO

IF NOT EXISTS (SELECT 1 FROM product_images WHERE image_id = '44921185-BA39-46D1-A2F7-F3AEBAB154C8')
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES ('44921185-BA39-46D1-A2F7-F3AEBAB154C8', '31FA7E5B-FE75-4693-A422-20DA91EE3537', 'https://cdn.store.com/img/dress-floral.jpg', 'Summer Floral Dress Full View', 1, 1);
GO

-- =====================================================
-- 7. PRODUCT VARIANTS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '33B021C5-DEC2-40C1-BB64-1B9C28F51E53' AND variant_name = 'Color: Titanium Black')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'Color: Titanium Black', 0, 50, 'IPH16-PRO-256-BLK'),
(NEWID(), '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'Color: Desert Titanium', 0, 45, 'IPH16-PRO-256-DST'),
(NEWID(), '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'Color: Natural Titanium', 100.00, 55, 'IPH16-PRO-256-NT');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '988FA094-B369-434B-A946-8C6BA7B6E4C9' AND variant_name = 'RAM: 16GB / SSD: 512GB')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '988FA094-B369-434B-A946-8C6BA7B6E4C9', 'RAM: 16GB / SSD: 512GB', 0, 40, 'MBP-14-M4-16-512'),
(NEWID(), '988FA094-B369-434B-A946-8C6BA7B6E4C9', 'RAM: 32GB / SSD: 1TB', 2500.00, 20, 'MBP-14-M4-32-1TB');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = 'D9C035E5-3C94-459A-9730-E176F66E6E83' AND variant_name = 'Size: S')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'Size: S', 0, 100, 'TS-CLSC-WHT-S'),
(NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'Size: M', 0, 200, 'TS-CLSC-WHT-M'),
(NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'Size: L', 0, 150, 'TS-CLSC-WHT-L'),
(NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'Size: XL', 10.00, 50, 'TS-CLSC-WHT-XL');
GO

IF NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = '31FA7E5B-FE75-4693-A422-20DA91EE3537' AND variant_name = 'Size: S')
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), '31FA7E5B-FE75-4693-A422-20DA91EE3537', 'Size: S', 0, 50, 'DR-SUM-FLR-S'),
(NEWID(), '31FA7E5B-FE75-4693-A422-20DA91EE3537', 'Size: M', 0, 80, 'DR-SUM-FLR-M'),
(NEWID(), '31FA7E5B-FE75-4693-A422-20DA91EE3537', 'Size: L', 0, 70, 'DR-SUM-FLR-L');
GO

-- =====================================================
-- 8. WAREHOUSE
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM warehouses WHERE warehouse_name = 'Jeddah Distribution Center')
INSERT INTO warehouses (warehouse_id, manager_id, warehouse_name, location, is_active)
VALUES ('6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435', '5B7DEE8D-C411-4FBE-80BB-306CD3493ED0', 'Jeddah Distribution Center', 'Jeddah Industrial Area, Saudi Arabia', 1);
GO

-- =====================================================
-- 9. PRODUCT DISTRIBUTIONS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '33B021C5-DEC2-40C1-BB64-1B9C28F51E53' AND warehouse_id = '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435', 80, 5);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '988FA094-B369-434B-A946-8C6BA7B6E4C9' AND warehouse_id = '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '988FA094-B369-434B-A946-8C6BA7B6E4C9', '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435', 40, 3);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = 'D9C035E5-3C94-459A-9730-E176F66E6E83' AND warehouse_id = '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435', 300, 20);
GO

IF NOT EXISTS (SELECT 1 FROM product_distributions WHERE product_id = '31FA7E5B-FE75-4693-A422-20DA91EE3537' AND warehouse_id = '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435')
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES (NEWID(), '31FA7E5B-FE75-4693-A422-20DA91EE3537', '6F75FC8C-C1EE-4CFD-A5E3-3E7356F8F435', 120, 10);
GO

-- =====================================================
-- 10. DISCOUNTS
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM discounts WHERE product_id = '33B021C5-DEC2-40C1-BB64-1B9C28F51E53' AND discount_type = 'percentage' AND discount_value = 15.00)
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES (NEWID(), '33B021C5-DEC2-40C1-BB64-1B9C28F51E53', 'percentage', 15.00, '2026-05-15 00:00:00', '2026-05-25 23:59:59', NULL, 100, 12, 1);
GO

IF NOT EXISTS (SELECT 1 FROM discounts WHERE product_id = 'D9C035E5-3C94-459A-9730-E176F66E6E83' AND discount_type = 'fixed' AND discount_value = 20.00)
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES (NEWID(), 'D9C035E5-3C94-459A-9730-E176F66E6E83', 'fixed', 20.00, '2026-05-01 00:00:00', '2026-05-31 23:59:59', 150.00, 500, 89, 1);
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
IF NOT EXISTS (SELECT 1 FROM addresses WHERE street = '456 Al Olaya Street')
INSERT INTO addresses (address_id, customer_id, address_type, label, recipient_name, phone, street, city, state, country, postal_code, is_default)
VALUES ('83240EE2-BB2A-4ECA-AD8E-421A5F902E7E', 'AB1B2AD3-C338-41A2-A942-EA395C6E1D53', 'home', 'Home', 'John Doe', '+966501111111', '456 Al Olaya Street', 'Riyadh', 'Riyadh Region', 'Saudi Arabia', '12211', 1);
GO

IF NOT EXISTS (SELECT 1 FROM addresses WHERE street = '789 King Abdulaziz Road')
INSERT INTO addresses (address_id, customer_id, address_type, label, recipient_name, phone, street, city, state, country, postal_code, is_default)
VALUES ('C66EFE4F-01F3-4599-A620-9DD308C01132', 'CAB78A55-4EF9-4425-80A8-83F0E1361053', 'work', 'Office', 'Jane Smith', '+966502222222', '789 King Abdulaziz Road', 'Jeddah', 'Makkah Region', 'Saudi Arabia', '23322', 1);
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
SELECT c.category_id, p.category_name AS parent, c.category_name, c.slug, c.is_active 
FROM categories c 
LEFT JOIN categories p ON c.parent_category_id = p.category_id
ORDER BY CASE WHEN c.parent_category_id IS NULL THEN 0 ELSE 1 END, c.sort_order;
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
USE ecommerce_db;
GO

-- Delete all data in reverse dependency order
DELETE FROM reviews;
DELETE FROM shipments;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM wishlists;
DELETE FROM addresses;
DELETE FROM premium_subscriptions;
DELETE FROM product_distributions;
DELETE FROM discounts;
DELETE FROM coupons;
DELETE FROM product_variants;
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM sellers;
DELETE FROM customers;
DELETE FROM employees;
DELETE FROM users;
GO

PRINT 'All data cleared. Now run the seed script.';
GO