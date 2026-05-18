-- Use the E-Commerce database
USE ecommerce_db;
GO

-- 1. Selecting all data from the users table
-- This table stores all users (customers, sellers, admins) and their basic info.
SELECT * FROM users;
GO

-- 2. Selecting all data from the employees table
-- This table stores information about the internal employees.
SELECT * FROM employees;
GO

-- 3. Selecting all data from the customers table
-- This table stores specific information for users with the 'customer' role.
SELECT * FROM customers;
GO

-- 4. Selecting all data from the sellers table
-- This table stores specific details for sellers (vendors) and their business info.
SELECT * FROM sellers;
GO

-- 5. Selecting all data from the premium_subscriptions table
-- This table stores active premium subscriptions for customers.
SELECT * FROM premium_subscriptions;
GO

-- 6. Selecting all data from the addresses table
-- This table stores all user addresses for shipping and billing.
SELECT * FROM addresses;
GO

-- 7. Selecting all data from the categories table
-- This table stores product categories, including parent/child relationships.
SELECT * FROM categories;
GO

-- 8. Selecting all data from the products table
-- This table is the main inventory table storing all products.
SELECT * FROM products;
GO

-- 9. Selecting all data from the product_images table
-- This table stores URLs and metadata for images attached to products.
SELECT * FROM product_images;
GO

-- 10. Selecting all data from the product_variants table
-- This table stores variations of a product (e.g., size, color) and price adjustments.
SELECT * FROM product_variants;
GO

-- 11. Selecting all data from the warehouses table
-- This table stores locations where products are kept.
SELECT * FROM warehouses;
GO

-- 12. Selecting all data from the product_distributions table
-- This table tracks inventory quantity in specific warehouses.
SELECT * FROM product_distributions;
GO

-- 13. Selecting all data from the discounts table
-- This table stores discount rules applied to specific products.
SELECT * FROM discounts;
GO

-- 14. Selecting all data from the coupons table
-- This table stores promo codes that users can apply at checkout.
SELECT * FROM coupons;
GO

-- 15. Selecting all data from the carts table
-- This table stores the active shopping carts of customers.
SELECT * FROM carts;
GO

-- 16. Selecting all data from the cart_items table
-- This table stores the individual items inside a customer's cart.
SELECT * FROM cart_items;
GO

-- 17. Selecting all data from the wishlists table
-- This table stores items that customers have favorited.
SELECT * FROM wishlists;
GO

-- 18. Selecting all data from the orders table
-- This table stores all customer orders and their totals.
SELECT * FROM orders;
GO

-- 19. Selecting all data from the order_items table
-- This table stores individual products purchased within an order.
SELECT * FROM order_items;
GO

-- 20. Selecting all data from the payments table
-- This table tracks payment transactions for orders.
SELECT * FROM payments;
GO

-- 21. Selecting all data from the shipments table
-- This table tracks the fulfillment and shipping status of order items.
SELECT * FROM shipments;
GO

-- 22. Selecting all data from the reviews table
-- This table stores customer feedback and ratings on products.
SELECT * FROM reviews;
GO

-- 23. Selecting all data from the seller_offers table
-- This table stores special offers submitted by sellers that require admin approval.
SELECT * FROM seller_offers;
GO

-- 24. Selecting all data from the admin_actions table
-- This table logs audit actions taken by administrators.
SELECT * FROM admin_actions;
GO
ALTER TABLE product_images ALTER COLUMN image_url NVARCHAR(MAX) NOT NULL;
