-- =====================================================
-- E-COMMERCE: CLEAN + SCHEMA + SEED (ALL-IN-ONE)
-- Run this entire script in one go
-- =====================================================
use ecommerce_db;
SET NOCOUNT ON;
GO

-- =====================================================
-- STEP 0: WIPE EVERYTHING
-- =====================================================
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql += 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT IF EXISTS [' + name + '];' + CHAR(13)
FROM sys.foreign_keys;
EXEC sp_executesql @sql;

SET @sql = '';
SELECT @sql += 'DROP TABLE IF EXISTS [' + name + '];' + CHAR(13)
FROM sys.tables
WHERE name IN (
    'reviews','shipments','payments','order_items','orders',
    'wishlists','cart_items','carts','coupons','discounts',
    'product_distributions','warehouses','product_variants',
    'product_images','products','categories','addresses',
    'premium_subscriptions','sellers','employees','customers','users'
);
EXEC sp_executesql @sql;

PRINT 'Database cleaned.';
GO

-- =====================================================
-- STEP 1: TABLES
-- =====================================================

CREATE TABLE users (
    user_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    role NVARCHAR(20) NOT NULL CHECK (role IN ('customer','seller','admin')),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT UQ_users_phone UNIQUE (phone)
);
GO

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
    CONSTRAINT FK_emp_reports FOREIGN KEY (reports_to) REFERENCES employees(employee_id)
);
GO

CREATE TABLE customers (
    customer_id UNIQUEIDENTIFIER PRIMARY KEY,
    job_title NVARCHAR(100) NULL,
    income_range DECIMAL(12,2) NULL,
    loyalty_points INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_cust_user FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE sellers (
    seller_id UNIQUEIDENTIFIER PRIMARY KEY,
    employee_id UNIQUEIDENTIFIER NULL,
    business_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NULL,
    verification_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified')),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    rating_avg DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    bank_details NVARCHAR(MAX) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_sellers_email UNIQUE (email),
    CONSTRAINT FK_sell_user FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_sell_emp FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
GO

CREATE TABLE premium_subscriptions (
    subscription_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    plan_name NVARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    monthly_fee DECIMAL(10,2) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_prem_cust UNIQUE (customer_id),
    CONSTRAINT FK_prem_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

CREATE TABLE addresses (
    address_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    address_type NVARCHAR(20) NULL CHECK (address_type IN ('home','work')),
    label NVARCHAR(50) NULL,
    recipient_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NULL,
    street NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    country NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(20) NOT NULL,
    is_default BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_addr_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

CREATE TABLE categories (
    category_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    parent_category_id UNIQUEIDENTIFIER NULL,
    category_name NVARCHAR(100) NOT NULL,
    slug NVARCHAR(100) NULL,
    description NVARCHAR(MAX) NULL,
    image_url NVARCHAR(500) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_cat_slug UNIQUE (slug),
    CONSTRAINT FK_cat_parent FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);
GO

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
    CONSTRAINT UQ_prod_sku UNIQUE (sku),
    CONSTRAINT UQ_prod_slug UNIQUE (slug),
    CONSTRAINT FK_prod_sell FOREIGN KEY (seller_id) REFERENCES sellers(seller_id),
    CONSTRAINT FK_prod_cat FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
GO

CREATE TABLE product_images (
    image_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    image_url NVARCHAR(MAX) NOT NULL,
    alt_text NVARCHAR(255) NULL,
    is_primary BIT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_img_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

CREATE TABLE product_variants (
    variant_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    variant_name NVARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0,
    sku NVARCHAR(100) NULL,
    CONSTRAINT FK_var_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

CREATE TABLE warehouses (
    warehouse_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    manager_id UNIQUEIDENTIFIER NULL,
    warehouse_name NVARCHAR(100) NOT NULL,
    location NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_wh_mgr FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);
GO

CREATE TABLE product_distributions (
    distribution_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_dist_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT FK_dist_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);
GO

CREATE TABLE discounts (
    discount_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER NOT NULL,
    discount_type NVARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage','fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_order_amount DECIMAL(12,2) NULL,
    usage_limit INT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_disc_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
GO

CREATE TABLE coupons (
    coupon_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) NOT NULL,
    type NVARCHAR(20) NOT NULL CHECK (type IN ('percentage','fixed')),
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(12,2) NULL,
    max_discount DECIMAL(12,2) NULL,
    usage_limit INT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    starts_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_coup_code UNIQUE (code)
);
GO

CREATE TABLE carts (
    cart_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_cart_cust UNIQUE (customer_id),
    CONSTRAINT FK_cart_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);
GO

CREATE TABLE cart_items (
    cart_item_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    cart_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    variant_id UNIQUEIDENTIFIER NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_ci_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    CONSTRAINT FK_ci_prod FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT FK_ci_var FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);
GO

CREATE TABLE wishlists (
    wishlist_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    added_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_wl_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    CONSTRAINT FK_wl_prod FOREIGN KEY (product_id) REFERENCES products(product_id)
);
GO

CREATE TABLE orders (
    order_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    customer_id UNIQUEIDENTIFIER NOT NULL,
    address_id UNIQUEIDENTIFIER NOT NULL,
    order_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','shipped','delivered','cancelled','refunded')),
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
    CONSTRAINT FK_ord_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT FK_ord_addr FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);
GO

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
    fulfillment_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending','picked','shipped')),
    CONSTRAINT FK_oi_ord FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT FK_oi_prod FOREIGN KEY (product_id) REFERENCES products(product_id),
    CONSTRAINT FK_oi_var FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id),
    CONSTRAINT FK_oi_sell FOREIGN KEY (seller_id) REFERENCES sellers(seller_id)
);
GO

CREATE TABLE payments (
    payment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    payment_method NVARCHAR(50) NULL CHECK (payment_method IN ('card','wallet','cod','Credit Card','Vodafone Cash','Orange Cash','Etisalat Cash','InstaPay','COD')),
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
    amount DECIMAL(12,2) NOT NULL,
    transaction_ref NVARCHAR(255) NULL,
    gateway_response_json NVARCHAR(MAX) NULL,
    paid_at DATETIME NULL,
    refunded_at DATETIME NULL,
    CONSTRAINT UQ_pay_ref UNIQUE (transaction_ref),
    CONSTRAINT FK_pay_ord FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
GO

CREATE TABLE shipments (
    shipment_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_item_id UNIQUEIDENTIFIER NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NOT NULL,
    tracking_number NVARCHAR(100) NULL,
    carrier_name NVARCHAR(50) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','shipped','delivered')),
    shipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    CONSTRAINT UQ_ship_track UNIQUE (tracking_number),
    CONSTRAINT FK_ship_oi FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id),
    CONSTRAINT FK_ship_wh FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);
GO

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
    CONSTRAINT FK_rev_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT FK_rev_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT FK_rev_ord FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
GO

PRINT 'All 22 tables created.';
GO

-- =====================================================
-- STEP 2: INDEXES
-- =====================================================
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_customers_user ON customers(customer_id);
CREATE INDEX idx_employee_dept ON employees(department);
CREATE INDEX idx_employee_manager ON employees(reports_to);
CREATE INDEX idx_seller_rating ON sellers(rating_avg DESC);
CREATE INDEX idx_seller_verified ON sellers(verification_status);
CREATE INDEX idx_category_parent ON categories(parent_category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active, created_at);
CREATE INDEX idx_products_search ON products(name);
CREATE INDEX idx_image_product ON product_images(product_id);
CREATE INDEX idx_image_primary ON product_images(product_id, is_primary);
CREATE INDEX idx_dist_product ON product_distributions(product_id);
CREATE INDEX idx_dist_warehouse ON product_distributions(warehouse_id);
CREATE INDEX idx_discount_product ON discounts(product_id);
CREATE INDEX idx_discount_dates ON discounts(start_date, end_date);
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE UNIQUE INDEX idx_cart_customer ON carts(customer_id);
CREATE INDEX idx_cartitem_cart ON cart_items(cart_id);
CREATE INDEX idx_wishlist_customer ON wishlists(customer_id);
CREATE UNIQUE INDEX idx_wishlist_unique ON wishlists(customer_id, product_id);
CREATE INDEX idx_order_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_order_status ON orders(order_status, created_at);
CREATE INDEX idx_oi_order ON order_items(order_id);
CREATE INDEX idx_oi_seller ON order_items(seller_id);
CREATE INDEX idx_payment_order ON payments(order_id);
CREATE UNIQUE INDEX idx_payment_ref ON payments(transaction_ref);
CREATE UNIQUE INDEX idx_shipment_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipment_warehouse ON shipments(warehouse_id);
GO

PRINT 'All indexes created.';
GO

-- =====================================================
-- STEP 3: SEED DATA
-- =====================================================

-- Admin
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES ('89C22FC6-E2DD-40F0-B406-21EA1C45BBD6', 'admin@ecommerce.com', '$2b$10$AdminHashSecure1234567890123456789012345678901234567890', 'System Administrator', '+966500000001', 'admin', 1, '2024-01-01 08:00:00');
GO

INSERT INTO employees (employee_id, full_name, email, phone, department, job_title, hire_date, salary, reports_to, is_active)
VALUES ('D9AE2747-79D1-43AE-8CC8-0197CE9B4993', 'System Administrator', 'admin@ecommerce.com', '+966500000001', 'IT', 'Platform Admin', '2024-01-01', 120000.00, NULL, 1);
GO

-- Customers
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES 
('2A7B962E-0B81-49D3-9915-E065BE7A39A7', 'john.doe@email.com', '$2b$10$CustomerHash123456789012345678901234567890123456789012', 'John Doe', '+966501111111', 'customer', 1, '2026-03-15 10:30:00'),
('BF22F286-10BC-4EDC-BC30-9FDBEABE296F', 'jane.smith@email.com', '$2b$10$CustomerHash234567890123456789012345678901234567890123', 'Jane Smith', '+966502222222', 'customer', 1, '2026-04-20 14:15:00');
GO

INSERT INTO customers (customer_id, job_title, income_range, loyalty_points)
VALUES 
('2A7B962E-0B81-49D3-9915-E065BE7A39A7', 'Marketing Manager', 95000.00, 120),
('BF22F286-10BC-4EDC-BC30-9FDBEABE296F', 'Data Analyst', 78000.00, 85);
GO

-- Sellers (seller_id = user_id)
INSERT INTO users (user_id, email, password_hash, full_name, phone, role, is_active, created_at)
VALUES 
('76323C0D-636E-4C29-A443-5B5F799478A0', 'store1@techhub.com', '$2b$10$SellerHash12345678901234567890123456789012345678901234', 'TechHub Electronics', '+966503333333', 'seller', 1, '2025-06-01 09:00:00'),
('5291D205-F695-40DA-AE09-54F81BA2C8CA', 'store2@fashionworld.com', '$2b$10$SellerHash2345678901234567890123456789012345678901234', 'Fashion World', '+966504444444', 'seller', 1, '2025-08-15 11:00:00');
GO

INSERT INTO sellers (seller_id, employee_id, business_name, email, phone, verification_status, commission_rate, rating_avg, bank_details, created_at)
VALUES 
('76323C0D-636E-4C29-A443-5B5F799478A0', 'D9AE2747-79D1-43AE-8CC8-0197CE9B4993', 'TechHub Electronics', 'store1@techhub.com', '+966503333333', 'verified', 8.00, 4.8, '{"bank":"Al Rajhi","iban":"SA03...","account":"111111111"}', '2025-06-01 09:00:00'),
('5291D205-F695-40DA-AE09-54F81BA2C8CA', 'D9AE2747-79D1-43AE-8CC8-0197CE9B4993', 'Fashion World', 'store2@fashionworld.com', '+966504444444', 'verified', 10.00, 4.6, '{"bank":"SNB","iban":"SA04...","account":"222222222"}', '2025-08-15 11:00:00');
GO

-- Categories (parents first)
INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES 
('BC8B467E-A47B-47D5-AB47-BAC32E6AD25A', NULL, 'Electronics', 'electronics', 'All electronic devices and accessories', 'https://cdn.store.com/cat/electronics.jpg', 1, 1),
('12C17756-A808-46FE-A9DF-690DBCAFF822', NULL, 'Clothing', 'clothing', 'Men and women fashion apparel', 'https://cdn.store.com/cat/clothing.jpg', 2, 1),
('06643763-4054-49BC-9C26-9ACC914FFAC0', NULL, 'Home & Living', 'home-living', 'Furniture, decor, and kitchen essentials', 'https://cdn.store.com/cat/home.jpg', 3, 1);
GO

INSERT INTO categories (category_id, parent_category_id, category_name, slug, description, image_url, sort_order, is_active)
VALUES 
('2C77DD8E-99C0-4658-89C9-8F19FD355C98', 'BC8B467E-A47B-47D5-AB47-BAC32E6AD25A', 'Smartphones', 'smartphones', 'Mobile phones and accessories', 'https://cdn.store.com/cat/phones.jpg', 1, 1),
('F06106DC-89BC-4EA5-B3D2-55370D8B7FF6', 'BC8B467E-A47B-47D5-AB47-BAC32E6AD25A', 'Laptops', 'laptops', 'Notebooks and ultrabooks', 'https://cdn.store.com/cat/laptops.jpg', 2, 1),
('0161F5CB-6085-40CC-8F9D-B0AD157EDC5F', '12C17756-A808-46FE-A9DF-690DBCAFF822', 'Men', 'men', 'Men clothing and accessories', 'https://cdn.store.com/cat/men.jpg', 1, 1),
('4D8C06A6-7C4F-48AF-93B6-BB157A483C77', '12C17756-A808-46FE-A9DF-690DBCAFF822', 'Women', 'women', 'Women clothing and accessories', 'https://cdn.store.com/cat/women.jpg', 2, 1);
GO

-- Products
INSERT INTO products (product_id, seller_id, category_id, sku, name, slug, description, base_price, stock_quantity, brand, weight_kg, is_active, avg_rating, review_count, created_at)
VALUES 
('C1D419E5-E0D5-455B-859D-046F1BF940B6', '76323C0D-636E-4C29-A443-5B5F799478A0', '2C77DD8E-99C0-4658-89C9-8F19FD355C98', 'IPH16-PRO-256', 'iPhone 16 Pro 256GB', 'iphone-16-pro-256gb', 'Latest Apple iPhone with A18 Pro chip, titanium design, and advanced camera system.', 4599.00, 150, 'Apple', 0.187, 1, 4.5, 12, '2026-01-15 08:00:00'),
('9D89B4EA-B6D5-4148-8383-BDBB5C726DAE', '76323C0D-636E-4C29-A443-5B5F799478A0', 'F06106DC-89BC-4EA5-B3D2-55370D8B7FF6', 'MBP-14-M4-512', 'MacBook Pro 14-inch M4', 'macbook-pro-14-m4', 'Apple MacBook Pro with M4 chip, 14-inch Liquid Retina XDR display, 512GB SSD.', 8999.00, 75, 'Apple', 1.55, 1, 4.8, 28, '2026-02-10 10:00:00'),
('6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', '5291D205-F695-40DA-AE09-54F81BA2C8CA', '0161F5CB-6085-40CC-8F9D-B0AD157EDC5F', 'TS-CLSC-WHT-M', 'Classic White T-Shirt', 'classic-white-tshirt', 'Premium cotton crew neck t-shirt, comfortable fit, machine washable.', 89.00, 500, 'Fashion World', 0.25, 1, 4.3, 45, '2025-12-01 09:00:00'),
('F48009B5-6AC9-4797-A30E-6E22BBED2D70', '5291D205-F695-40DA-AE09-54F81BA2C8CA', '4D8C06A6-7C4F-48AF-93B6-BB157A483C77', 'DR-SUM-FLR-S', 'Summer Floral Dress', 'summer-floral-dress', 'Lightweight floral print summer dress, breathable fabric, elegant design.', 249.00, 200, 'Fashion World', 0.35, 1, 4.6, 32, '2026-03-20 11:00:00');
GO

-- Product Images
INSERT INTO product_images (image_id, product_id, image_url, alt_text, is_primary, sort_order)
VALUES 
('6546CAA3-2595-4D8B-9786-C6AA48718ADB', 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'https://cdn.store.com/img/iphone16-front.jpg', 'iPhone 16 Pro Front View', 1, 1),
('76E9D14C-438D-4579-B2BB-2C4E2E79B4D6', 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'https://cdn.store.com/img/iphone16-back.jpg', 'iPhone 16 Pro Back View', 0, 2),
('BE05EE2E-977C-4A4F-B299-18DEF5FC082A', '9D89B4EA-B6D5-4148-8383-BDBB5C726DAE', 'https://cdn.store.com/img/macbook-m4.jpg', 'MacBook Pro 14 M4 Space Black', 1, 1),
('F1E5B355-199C-4E57-BA28-913C4E24419D', '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'https://cdn.store.com/img/tshirt-white.jpg', 'Classic White T-Shirt Front', 1, 1),
('DDF03881-6ACA-43BC-94E4-870FF450C819', 'F48009B5-6AC9-4797-A30E-6E22BBED2D70', 'https://cdn.store.com/img/dress-floral.jpg', 'Summer Floral Dress Full View', 1, 1);
GO

-- Product Variants
INSERT INTO product_variants (variant_id, product_id, variant_name, price_adjustment, stock_quantity, sku)
VALUES 
(NEWID(), 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'Color: Titanium Black', 0, 50, 'IPH16-PRO-256-BLK'),
(NEWID(), 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'Color: Desert Titanium', 0, 45, 'IPH16-PRO-256-DST'),
(NEWID(), 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'Color: Natural Titanium', 100.00, 55, 'IPH16-PRO-256-NT'),
(NEWID(), '9D89B4EA-B6D5-4148-8383-BDBB5C726DAE', 'RAM: 16GB / SSD: 512GB', 0, 40, 'MBP-14-M4-16-512'),
(NEWID(), '9D89B4EA-B6D5-4148-8383-BDBB5C726DAE', 'RAM: 32GB / SSD: 1TB', 2500.00, 20, 'MBP-14-M4-32-1TB'),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'Size: S', 0, 100, 'TS-CLSC-WHT-S'),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'Size: M', 0, 200, 'TS-CLSC-WHT-M'),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'Size: L', 0, 150, 'TS-CLSC-WHT-L'),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'Size: XL', 10.00, 50, 'TS-CLSC-WHT-XL'),
(NEWID(), 'F48009B5-6AC9-4797-A30E-6E22BBED2D70', 'Size: S', 0, 50, 'DR-SUM-FLR-S'),
(NEWID(), 'F48009B5-6AC9-4797-A30E-6E22BBED2D70', 'Size: M', 0, 80, 'DR-SUM-FLR-M'),
(NEWID(), 'F48009B5-6AC9-4797-A30E-6E22BBED2D70', 'Size: L', 0, 70, 'DR-SUM-FLR-L');
GO

-- Warehouse
INSERT INTO warehouses (warehouse_id, manager_id, warehouse_name, location, is_active)
VALUES ('6FC11391-B82B-4117-91E7-73E79441930B', 'D9AE2747-79D1-43AE-8CC8-0197CE9B4993', 'Jeddah Distribution Center', 'Jeddah Industrial Area, Saudi Arabia', 1);
GO

-- Product Distributions
INSERT INTO product_distributions (distribution_id, product_id, warehouse_id, quantity_available, reserved_quantity)
VALUES 
(NEWID(), 'C1D419E5-E0D5-455B-859D-046F1BF940B6', '6FC11391-B82B-4117-91E7-73E79441930B', 80, 5),
(NEWID(), '9D89B4EA-B6D5-4148-8383-BDBB5C726DAE', '6FC11391-B82B-4117-91E7-73E79441930B', 40, 3),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', '6FC11391-B82B-4117-91E7-73E79441930B', 300, 20),
(NEWID(), 'F48009B5-6AC9-4797-A30E-6E22BBED2D70', '6FC11391-B82B-4117-91E7-73E79441930B', 120, 10);
GO

-- Discounts
INSERT INTO discounts (discount_id, product_id, discount_type, discount_value, start_date, end_date, min_order_amount, usage_limit, usage_count, is_active)
VALUES 
(NEWID(), 'C1D419E5-E0D5-455B-859D-046F1BF940B6', 'percentage', 15.00, '2026-05-15 00:00:00', '2026-05-25 23:59:59', NULL, 100, 12, 1),
(NEWID(), '6A2DDBC8-38B5-42BE-AB1E-1ACFC705D086', 'fixed', 20.00, '2026-05-01 00:00:00', '2026-05-31 23:59:59', 150.00, 500, 89, 1);
GO

-- Coupons
INSERT INTO coupons (coupon_id, code, type, value, min_order_amount, max_discount, usage_limit, usage_count, starts_at, expires_at, is_active)
VALUES 
(NEWID(), 'WELCOME2026', 'percentage', 15.00, 200.00, 300.00, 1000, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(NEWID(), 'FLASH50', 'fixed', 50.00, 500.00, 50.00, 200, 0, '2026-05-16 00:00:00', '2026-05-20 23:59:59', 1);
GO

-- Addresses
INSERT INTO addresses (address_id, customer_id, address_type, label, recipient_name, phone, street, city, state, country, postal_code, is_default)
VALUES 
('D436AC6E-980D-4D2B-A694-684B6B5DAE6D', '2A7B962E-0B81-49D3-9915-E065BE7A39A7', 'home', 'Home', 'John Doe', '+966501111111', '456 Al Olaya Street', 'Riyadh', 'Riyadh Region', 'Saudi Arabia', '12211', 1),
('943D765B-E117-4EEC-900A-334ED0415291', 'BF22F286-10BC-4EDC-BC30-9FDBEABE296F', 'work', 'Office', 'Jane Smith', '+966502222222', '789 King Abdulaziz Road', 'Jeddah', 'Makkah Region', 'Saudi Arabia', '23322', 1);
GO

PRINT 'Seed data inserted.';
GO

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================
SELECT '--- ROW COUNTS ---' AS info;
SELECT 'users' AS t, COUNT(*) AS c FROM users UNION ALL
SELECT 'employees', COUNT(*) FROM employees UNION ALL
SELECT 'customers', COUNT(*) FROM customers UNION ALL
SELECT 'sellers', COUNT(*) FROM sellers UNION ALL
SELECT 'categories', COUNT(*) FROM categories UNION ALL
SELECT 'products', COUNT(*) FROM products UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants UNION ALL
SELECT 'warehouses', COUNT(*) FROM warehouses UNION ALL
SELECT 'product_distributions', COUNT(*) FROM product_distributions UNION ALL
SELECT 'discounts', COUNT(*) FROM discounts UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses;
GO

SELECT '--- USERS ---' AS info;
SELECT email, full_name, role, is_active FROM users ORDER BY role;
GO

SELECT '--- PRODUCTS WITH IMAGES ---' AS info;
SELECT p.name, p.base_price, p.brand, s.business_name AS seller, COUNT(pi.image_id) AS image_count
FROM products p
JOIN sellers s ON p.seller_id = s.seller_id
LEFT JOIN product_images pi ON p.product_id = pi.product_id
GROUP BY p.name, p.base_price, p.brand, s.business_name;
GO

SELECT '--- CATEGORIES TREE ---' AS info;
SELECT c.category_name, ISNULL(p.category_name, 'ROOT') AS parent
FROM categories c
LEFT JOIN categories p ON c.parent_category_id = p.category_id
ORDER BY CASE WHEN p.category_id IS NULL THEN 0 ELSE 1 END, c.sort_order;
GO

PRINT '========== BUILD COMPLETE ==========';
GO

-- =====================================================
-- MIGRATIONS (Appended — ALTER only, no drops)
-- Run these after initial build to add new features.
-- =====================================================

-- 2026-05-17: Increase image_url length to accommodate long URLs
ALTER TABLE product_images ALTER COLUMN image_url NVARCHAR(MAX) NOT NULL;
GO

-- 2026-05-17: Add seller permission controls
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sellers') AND name = 'can_sell')
    ALTER TABLE sellers ADD can_sell BIT NOT NULL DEFAULT 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sellers') AND name = 'can_make_offers')
    ALTER TABLE sellers ADD can_make_offers BIT NOT NULL DEFAULT 1;
GO

-- 2026-05-17: Add product offer and factory flags
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'is_offer')
    ALTER TABLE products ADD is_offer BIT NOT NULL DEFAULT 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'is_factory')
    ALTER TABLE products ADD is_factory BIT NOT NULL DEFAULT 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'offer_price')
    ALTER TABLE products ADD offer_price DECIMAL(12,2) NULL;
GO

-- 2026-05-17: Add can_edit_products permission column to sellers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sellers') AND name = 'can_edit_products')
    ALTER TABLE sellers ADD can_edit_products BIT NOT NULL DEFAULT 1;
GO

-- 2026-05-17: Seller Offers table (seller-submitted offers, admin must approve)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'seller_offers')
BEGIN
    CREATE TABLE seller_offers (
        offer_id       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        product_id     UNIQUEIDENTIFIER NOT NULL,
        seller_id      UNIQUEIDENTIFIER NOT NULL,
        offer_title    NVARCHAR(255)    NOT NULL,
        discount_type  NVARCHAR(20)     NOT NULL CHECK (discount_type IN ('percentage','fixed')),
        discount_value DECIMAL(10,2)    NOT NULL,
        offer_price    DECIMAL(12,2)    NULL,
        start_date     DATETIME         NOT NULL,
        end_date       DATETIME         NOT NULL,
        status         NVARCHAR(20)     NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','rejected')),
        admin_note     NVARCHAR(500)    NULL,
        created_at     DATETIME         NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_soffer_prod FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        CONSTRAINT FK_soffer_sell FOREIGN KEY (seller_id)  REFERENCES sellers(seller_id)
    );
    PRINT 'seller_offers table created.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_soffer_seller')
    CREATE INDEX idx_soffer_seller  ON seller_offers(seller_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_soffer_product')
    CREATE INDEX idx_soffer_product ON seller_offers(product_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_soffer_status')
    CREATE INDEX idx_soffer_status  ON seller_offers(status, created_at);
GO

-- 2026-05-17: Admin audit log
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'admin_actions')
BEGIN
    CREATE TABLE admin_actions (
        action_id     UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        admin_user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(user_id),
        target_type   NVARCHAR(30)     NOT NULL,
        target_id     NVARCHAR(100)    NOT NULL,
        action        NVARCHAR(30)     NOT NULL,
        note          NVARCHAR(500)    NULL,
        created_at    DATETIME         NOT NULL DEFAULT GETDATE()
    );
    PRINT 'admin_actions table created.';
END
GO

PRINT 'Migrations applied successfully.';
GO
