-- =====================================================
-- E-COMMERCE PLATFORM DATABASE - COMPLETE BUILD SCRIPT
-- For: Microsoft SQL Server 2016+ / Azure SQL Database
-- Generated: 2026-05-16
-- =====================================================

-- =====================================================
-- 0. DATABASE SETUP (Run this section first if needed)
-- =====================================================
-- Uncomment below lines to create a new database:
-- CREATE DATABASE ecommerce_db;
-- GO
-- ALTER DATABASE ecommerce_db SET RECOVERY SIMPLE;
-- GO
-- USE ecommerce_db;
-- GO

-- =====================================================
-- CLEANUP SECTION (Optional - uncomment to rebuild)
-- =====================================================
/*
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql += 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys;
EXEC sp_executesql @sql;

SET @sql = '';
SELECT @sql += 'DROP TABLE IF EXISTS [' + name + '];' + CHAR(13)
FROM sys.tables WHERE name IN (
    'reviews','shipments','payments','order_items','orders',
    'wishlists','cart_items','carts','coupons','discounts',
    'product_distributions','warehouses','product_variants',
    'product_images','products','categories','addresses',
    'premium_subscriptions','sellers','employees','customers','users'
);
EXEC sp_executesql @sql;

DROP INDEX IF EXISTS idx_users_email ON users;
DROP INDEX IF EXISTS idx_users_phone ON users;
DROP INDEX IF EXISTS idx_users_created ON users;
DROP INDEX IF EXISTS idx_customers_user ON customers;
DROP INDEX IF EXISTS idx_employee_dept ON employees;
DROP INDEX IF EXISTS idx_employee_manager ON employees;
DROP INDEX IF EXISTS idx_seller_rating ON sellers;
DROP INDEX IF EXISTS idx_seller_verified ON sellers;
DROP INDEX IF EXISTS idx_category_parent ON categories;
DROP INDEX IF EXISTS idx_product_category ON products;
DROP INDEX IF EXISTS idx_product_seller ON products;
DROP INDEX IF EXISTS idx_product_active ON products;
DROP INDEX IF EXISTS idx_product_search ON products;
DROP INDEX IF EXISTS idx_image_product ON product_images;
DROP INDEX IF EXISTS idx_image_primary ON product_images;
DROP INDEX IF EXISTS idx_dist_product ON product_distributions;
DROP INDEX IF EXISTS idx_dist_warehouse ON product_distributions;
DROP INDEX IF EXISTS idx_discount_product ON discounts;
DROP INDEX IF EXISTS idx_discount_dates ON discounts;
DROP INDEX IF EXISTS idx_reviews_product ON reviews;
DROP INDEX IF EXISTS idx_reviews_customer ON reviews;
DROP INDEX IF EXISTS idx_cart_customer ON carts;
DROP INDEX IF EXISTS idx_cartitem_cart ON cart_items;
DROP INDEX IF EXISTS idx_wishlist_customer ON wishlists;
DROP INDEX IF EXISTS idx_wishlist_unique ON wishlists;
DROP INDEX IF EXISTS idx_order_customer ON orders;
DROP INDEX IF EXISTS idx_order_status ON orders;
DROP INDEX IF EXISTS idx_oi_order ON order_items;
DROP INDEX IF EXISTS idx_oi_seller ON order_items;
DROP INDEX IF EXISTS idx_payment_order ON payments;
DROP INDEX IF EXISTS idx_payment_ref ON payments;
DROP INDEX IF EXISTS idx_shipment_tracking ON shipments;
DROP INDEX IF EXISTS idx_shipment_warehouse ON shipments;
GO
*/

-- =====================================================
-- 1. USERS TABLE (Base identity for all accounts)
-- =====================================================
CREATE TABLE users (
    user_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('customer', 'seller', 'admin')),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT UQ_users_phone UNIQUE (phone)
);
GO

-- =====================================================
-- 2. EMPLOYEES TABLE (Internal staff hierarchy)
-- =====================================================
CREATE TABLE employees (
    employee_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    department NVARCHAR(50) NOT NULL,
    job_title NVARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(12,2) NULL,
    reports_to UNIQUEIDENTIFIER NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_employees_email UNIQUE (email),
    CONSTRAINT FK_employees_reports_to FOREIGN KEY (reports_to) REFERENCES employees(employee_id)
);
GO

-- =====================================================
-- 3. CUSTOMERS TABLE (Extended customer profile)
-- =====================================================
CREATE TABLE customers (
    customer_id UNIQUEIDENTIFIER PRIMARY KEY,
    job_title NVARCHAR(100) NULL,
    income_range DECIMAL(12,2) NULL,
    loyalty_points INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_customers_user FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 4. SELLERS TABLE (Merchant profiles)
-- =====================================================
CREATE TABLE sellers (
    seller_id UNIQUEIDENTIFIER PRIMARY KEY,
    employee_id UNIQUEIDENTIFIER NULL,
    business_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    verification_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified')),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    rating_avg DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    bank_details NVARCHAR(MAX) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_sellers_email UNIQUE (email),
    CONSTRAINT FK_sellers_user FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_sellers_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
GO

-- =====================================================
-- 5. PREMIUM SUBSCRIPTIONS (VIP membership plans)
-- =====================================================
CREATE TABLE premium_subscriptions (
    subscription_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    plan_name NVARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    monthly_fee DECIMAL(10,2) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_premium_customer UNIQUE (customer_id),
    CONSTRAINT FK_premium_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 6. ADDRESSES (Customer shipping/billing locations)
-- =====================================================
CREATE TABLE addresses (
    address_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    address_type NVARCHAR(20) NULL CHECK (address_type IN ('home', 'work')),
    label NVARCHAR(50) NULL,
    recipient_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    street NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    country NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(20) NOT NULL,
    is_default BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 7. CATEGORIES (Hierarchical product classification)
-- =====================================================
CREATE TABLE categories (
    category_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    parent_category_id UNIQUEIDENTIFIER NULL,
    category_name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL,
    image_url NVARCHAR(500) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_categories_slug UNIQUE (slug),
    CONSTRAINT FK_categories_parent FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);
GO

-- =====================================================
-- 8. PRODUCTS
-- =====================================================
CREATE TABLE products (
    product_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    seller_id UNIQUEIDENTIFIER NOT NULL,
    category_id UNIQUEIDENTIFIER NOT NULL,
    sku NVARCHAR(100) NULL,
    name NVARCHAR(255) NOT NULL,
    slug NVARCHAR(255) NULL,
    description NVARCHAR(MAX) NULL,
    base_price DECIMAL(12,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    brand NVARCHAR(100) NULL,
    weight_kg DECIMAL(8,2) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    avg_rating DECIMAL(2,1) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_products_sku UNIQUE (sku),
    CONSTRAINT UQ_products_slug UNIQUE (slug),
    CONSTRAINT FK_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(seller_id),
    CONSTRAINT FK_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
GO

-- =====================================================
-- 9. PRODUCT IMAGES
-- =====================================================
CREATE TABLE product_images (
    image_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    alt_text NVARCHAR(255) NULL,
    is_primary BIT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_images_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 10. PRODUCT VARIANTS
-- =====================================================
CREATE TABLE product_variants (
    variant_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    variant_name NVARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    sku NVARCHAR(100) NULL,
    CONSTRAINT FK_variants_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 11. WAREHOUSES
-- =====================================================
CREATE TABLE warehouses (
    warehouse_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    manager_id UNIQUEIDENTIFIER NULL,
    warehouse_name NVARCHAR(100) NOT NULL,
    location NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_warehouses_manager FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);
GO

-- =====================================================
-- 12. PRODUCT DISTRIBUTIONS (Stock across warehouses)
-- =====================================================
CREATE TABLE product_distributions (
    distribution_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_dist_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT FK_dist_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);
GO

-- =====================================================
-- 13. DISCOUNTS (Product-level promotions)
-- =====================================================
CREATE TABLE discounts (
    discount_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    discount_type NVARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_order_amount DECIMAL(12,2) NULL,
    usage_limit INT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_discounts_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 14. COUPONS (Platform-wide promo codes)
-- =====================================================
CREATE TABLE coupons (
    coupon_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) NOT NULL,
    type NVARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(12,2) NULL,
    max_discount DECIMAL(12,2) NULL,
    usage_limit INT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    starts_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_coupons_code UNIQUE (code)
);
GO

-- =====================================================
-- 15. CARTS
-- =====================================================
CREATE TABLE carts (
    cart_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_carts_customer UNIQUE (customer_id),
    CONSTRAINT FK_carts_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 16. CART ITEMS
-- =====================================================
CREATE TABLE cart_items (
    cart_item_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    cart_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    variant_id UNIQUEIDENTIFIER NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_cartitems_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT FK_cartitems_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT FK_cartitems_variant FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);
GO

-- =====================================================
-- 17. WISHLISTS
-- =====================================================
CREATE TABLE wishlists (
    wishlist_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    added_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_wishlists_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT FK_wishlists_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);
GO

-- =====================================================
-- 18. ORDERS
-- =====================================================
CREATE TABLE orders (
    order_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    address_id UNIQUEIDENTIFIER NOT NULL,
    order_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL,
    currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    shipping_address_json NVARCHAR(MAX) NULL,
    tracking_number NVARCHAR(100) NULL,
    courier_name NVARCHAR(50) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT FK_orders_address FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);
GO

-- =====================================================
-- 19. ORDER ITEMS
-- =====================================================
CREATE TABLE order_items (
    order_item_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    variant_id UNIQUEIDENTIFIER NULL,
    seller_id UNIQUEIDENTIFIER NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_applied DECIMAL(12,2) NOT NULL DEFAULT 0,
    item_total DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    seller_payout_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    fulfillment_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'picked', 'shipped')),
    CONSTRAINT FK_oi_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT FK_oi_product FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT FK_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    CONSTRAINT FK_oi_seller FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
);
GO

-- =====================================================
-- 20. PAYMENTS
-- =====================================================
CREATE TABLE payments (
    payment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    payment_method NVARCHAR(20) NULL CHECK (payment_method IN ('card', 'wallet', 'cod')),
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    amount DECIMAL(12,2) NOT NULL,
    transaction_ref NVARCHAR(255) NULL,
    gateway_response_json NVARCHAR(MAX) NULL,
    paid_at DATETIME NULL,
    refunded_at DATETIME NULL,
    CONSTRAINT UQ_payments_ref UNIQUE (transaction_ref),
    CONSTRAINT FK_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
GO

-- =====================================================
-- 21. SHIPMENTS
-- =====================================================
CREATE TABLE shipments (
    shipment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_item_id UNIQUEIDENTIFIER NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    tracking_number NVARCHAR(100) NULL,
    carrier_name NVARCHAR(50) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'shipped', 'delivered')),
    shipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    CONSTRAINT UQ_shipments_tracking UNIQUE (tracking_number),
    CONSTRAINT FK_shipments_oi FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
    CONSTRAINT FK_shipments_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);
GO

-- =====================================================
-- 22. REVIEWS
-- =====================================================
CREATE TABLE reviews (
    review_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    order_id UNIQUEIDENTIFIER NOT NULL,
    rating_score INT NOT NULL CHECK (rating_score >= 1 AND rating_score <= 5),
    review_text NVARCHAR(MAX) NULL,
    images_json NVARCHAR(MAX) NULL,
    is_verified_purchase BIT NOT NULL DEFAULT 0,
    helpful_count INT NOT NULL DEFAULT 0,
    seller_response NVARCHAR(MAX) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT FK_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT FK_reviews_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
GO

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created ON users(created_at);
GO

-- Customers
CREATE INDEX idx_customers_user ON customers(customer_id);
GO

-- Employees
CREATE INDEX idx_employee_dept ON employees(department);
CREATE INDEX idx_employee_manager ON employees(reports_to);
GO

-- Sellers
CREATE INDEX idx_seller_rating ON sellers(rating_avg DESC);
CREATE INDEX idx_seller_verified ON sellers(verification_status);
GO

-- Categories
CREATE INDEX idx_category_parent ON categories(parent_category_id);
GO

-- Products
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active, created_at);
CREATE INDEX idx_products_search ON products(name);
GO

-- Product Images
CREATE INDEX idx_image_product ON product_images(product_id);
CREATE INDEX idx_image_primary ON product_images(product_id, is_primary);
GO

-- Product Distributions
CREATE INDEX idx_dist_product ON product_distributions(product_id);
CREATE INDEX idx_dist_warehouse ON product_distributions(warehouse_id);
GO

-- Discounts
CREATE INDEX idx_discount_product ON discounts(product_id);
CREATE INDEX idx_discount_dates ON discounts(start_date, end_date);
GO

-- Reviews
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
GO

-- Carts & Cart Items
CREATE UNIQUE INDEX idx_cart_customer ON carts(customer_id);
CREATE INDEX idx_cartitem_cart ON cart_items(cart_id);
GO

-- Wishlists
CREATE INDEX idx_wishlist_customer ON wishlists(customer_id);
CREATE UNIQUE INDEX idx_wishlist_unique ON wishlists(customer_id, product_id);
GO

-- Orders
CREATE INDEX idx_order_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_order_status ON orders(order_status, created_at);
GO

-- Order Items
CREATE INDEX idx_oi_order ON order_items(order_id);
CREATE INDEX idx_oi_seller ON order_items(seller_id);
GO

-- Payments
CREATE INDEX idx_payment_order ON payments(order_id);
CREATE UNIQUE INDEX idx_payment_ref ON payments(transaction_ref);
GO

-- Shipments
CREATE UNIQUE INDEX idx_shipment_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipment_warehouse ON shipments(warehouse_id);
GO

PRINT 'Schema and indexes created successfully.';
GO

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- 1. Users
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES
('A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'ahmed@email.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmed Al-Rashid', '+966501234567', 'customer', 1, '2026-05-16 10:00:00');
GO

-- 2. Employees
INSERT INTO employees (employee_id, full_name, email, phone, department, job_title, hire_date, salary, reports_to, is_active)
VALUES
('B2C3D4E5-F6A7-8901-2345-678901BCDEF0', 'Sarah Johnson', 'sarah.j@company.com', '+966501111222', 'Logistics', 'Warehouse Manager', '2024-03-15', 85000.00, NULL, 1);
GO

-- 3. Customers
INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES
('A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'Software Engineer', 150000.00, 250);
GO

-- 4. Sellers
INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES
('C3D4E5F6-A7B8-9012-3456-789012CDEF01', 'B2C3D4E5-F6A7-8901-2345-678901BCDEF0', 'TechWorld Store', 'contact@techworld.com', '+966502222333', 'verified', 8.50, 4.7, '{"bank":"Riyad Bank","iban":"SA03...","account":"123456789"}', '2025-01-10 09:00:00');
GO

-- 5. Premium Subscriptions
INSERT INTO premium_subscriptions (subscription_id, customer_id, plan_name, start_date, end_date, monthly_fee, is_active)
VALUES
('E7F8A9B0-C1D2-3456-7890-123456012345', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'Platinum', '2026-05-01', '2027-05-01', 49.99, 1);
GO

-- 6. Addresses
INSERT INTO addresses (address_id, customer_id, address_type, label, recipient_name, phone, street, city, state, country, postal_code, is_default)
VALUES
('B8C9D0E1-F2A3-4567-8901-234567123456', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'home', 'Home', 'Ahmed Al-Rashid', '+966501234567', '123 King Fahd Road', 'Riyadh', 'Riyadh Region', 'Saudi Arabia', '11564', 1);
GO

-- 7. Categories
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES
('D4E5F6A7-B8C9-0123-4567-890123DEF012', NULL, 'Electronics', 'electronics', 'Consumer electronic devices', 'https://cdn.store.com/cat/electronics.jpg', 1, 1),
('E5F6A7B8-C9D0-1234-5678-901234EF0123', 'D4E5F6A7-B8C9-0123-4567-890123DEF012', 'Smartphones', 'smartphones', 'Mobile phones and accessories', 'https://cdn.store.com/cat/smartphones.jpg', 1, 1);
GO

-- 8. Products
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES
('F6A7B8C9-D0E1-2345-6789-012345F01234', 'C3D4E5F6-A7B8-9012-3456-789012CDEF01', 'E5F6A7B8-C9D0-1234-5678-901234EF0123', 'IPH16-PRO-256', 'iPhone 16 Pro 256GB', 'iphone-16-pro-256gb', 'Latest Apple iPhone with A18 Pro chip, titanium design, and advanced camera system.', 4599.00, 150, 'Apple', 0.187, 1, 4.5, 12, '2026-01-15 08:00:00');
GO

-- 9. Product Images
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES
('D0E1F2A3-B4C5-6789-0123-456789345678', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'https://cdn.store.com/img/iphone16-1.jpg', 'iPhone 16 Pro Titanium Black', 1, 1);
GO

-- 10. Product Variants
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES
('E1F2A3B4-C5D6-7890-1234-567890456789', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'Color: Titanium Black', 0, 50, 'IPH16-PRO-256-BLK');
GO

-- 11. Warehouses
INSERT INTO warehouses (warehouse_id, manager_id, warehouse_name, location, is_active)
VALUES
('A7B8C9D0-E1F2-3456-7890-123456012345', 'B2C3D4E5-F6A7-8901-2345-678901BCDEF0', 'Riyadh Central Fulfillment', 'Riyadh Industrial City, Saudi Arabia', 1);
GO

-- 12. Product Distributions
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES
('C1D2E3F4-A5B6-7890-1234-567890456789', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'A7B8C9D0-E1F2-3456-7890-123456012345', 80, 12);
GO

-- 13. Discounts
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES
('B0C1D2E3-F4A5-6789-0123-456789345678', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'percentage', 15.00, '2026-05-15 00:00:00', '2026-05-20 23:59:59', NULL, 100, 0, 1);
GO

-- 14. Coupons
INSERT INTO coupons (coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, starts_at, expires_at, is_active)
VALUES
(NEWID(), 'SUMMER2026', 'percentage', 10.00, 100.00, 500.00, 500, 0, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 1);
GO

-- 15. Carts
INSERT INTO carts (cart_id, customer_id, total_amount, updated_at)
VALUES
('C9D0E1F2-A3B4-5678-9012-345678234567', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 4599.00, '2026-05-16 14:30:00');
GO

-- 16. Cart Items
INSERT INTO cart_items (cart_item_id, cart_id, product_id, variant_id, quantity, unit_price)
VALUES
('A9B0C1D2-E3F4-5678-9012-345678234567', 'C9D0E1F2-A3B4-5678-9012-345678234567', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'E1F2A3B4-C5D6-7890-1234-567890456789', 1, 4599.00);
GO

-- 17. Wishlists
INSERT INTO wishlists (wishlist_id, customer_id, product_id, added_at)
VALUES
('F8A9B0C1-D2E3-4567-8901-234567123456', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'F6A7B8C9-D0E1-2345-6789-012345F01234', '2026-05-10 11:00:00');
GO

-- 18. Orders
INSERT INTO orders (order_id, customer_id, address_id, order_status, total_amount, discount_total, shipping_amount, tax_amount, final_amount, currency, shipping_address_json, tracking_number, courier_name, notes, created_at)
VALUES
('F2A3B4C5-D6E7-8901-2345-678901567890', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'B8C9D0E1-F2A3-4567-8901-234567123456', 'confirmed', 4599.00, 689.85, 0, 0, 3909.15, 'SAR', '{"street":"123 King Fahd Road","city":"Riyadh","country":"Saudi Arabia"}', 'TRK-001', 'Aramex', 'Please gift wrap', '2026-05-16 15:00:00');
GO

-- 19. Order Items
INSERT INTO order_items (order_item_id, order_id, product_id, variant_id, seller_id, quantity, unit_price, discount_applied, item_total, commission_amount, seller_payout_status, fulfillment_status)
VALUES
('A3B4C5D6-E7F8-9012-3456-789012678901', 'F2A3B4C5-D6E7-8901-2345-678901567890', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'E1F2A3B4-C5D6-7890-1234-567890456789', 'C3D4E5F6-A7B8-9012-3456-789012CDEF01', 1, 4599.00, 689.85, 3909.15, 332.28, 'pending', 'pending');
GO

-- 20. Payments
INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount, transaction_ref, gateway_response_json, paid_at, refunded_at)
VALUES
('B4C5D6E7-F8A9-0123-4567-890123789012', 'F2A3B4C5-D6E7-8901-2345-678901567890', 'card', 'paid', 3909.15, 'TRX-20260516-884422', '{"gateway":"Stripe","auth_code":"AUTH8822"}', '2026-05-16 15:02:00', NULL);
GO

-- 21. Shipments
INSERT INTO shipments (shipment_id, order_item_id, warehouse_id, tracking_number, carrier_name, status, shipped_at, delivered_at)
VALUES
('C5D6E7F8-A9B0-1234-5678-901234890123', 'A3B4C5D6-E7F8-9012-3456-789012678901', 'A7B8C9D0-E1F2-3456-7890-123456012345', 'TRK-SA-9988776655', 'Aramex', 'processing', NULL, NULL);
GO

-- 22. Reviews
INSERT INTO reviews (review_id, product_id, customer_id, order_id, rating_score, review_text, images_json, is_verified_purchase, helpful_count, seller_response, created_at)
VALUES
('D6E7F8A9-B0C1-2345-6789-012345901234', 'F6A7B8C9-D0E1-2345-6789-012345F01234', 'A1B2C3D4-E5F6-7890-1234-567890ABCDEF', 'F2A3B4C5-D6E7-8901-2345-678901567890', 5, 'Excellent camera and battery life! Highly recommended.', '["https://cdn.store.com/rev/img1.jpg"]', 1, 3, 'Thank you Ahmed! Enjoy your new iPhone.', '2026-05-14 09:30:00');
GO

PRINT 'Sample data inserted successfully.';
GO

-- =====================================================
-- VERIFICATION QUERIES (Run these to confirm build)
-- =====================================================
/*
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users UNION ALL
SELECT 'customers', COUNT(*) FROM customers UNION ALL
SELECT 'employees', COUNT(*) FROM employees UNION ALL
SELECT 'sellers', COUNT(*) FROM sellers UNION ALL
SELECT 'products', COUNT(*) FROM products UNION ALL
SELECT 'orders', COUNT(*) FROM orders UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items UNION ALL
SELECT 'payments', COUNT(*) FROM payments UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
*/
