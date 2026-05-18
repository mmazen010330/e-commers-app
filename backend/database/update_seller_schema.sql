-- =============================================
-- Step 1: Update Database Schema for Seller Features
-- =============================================

USE ecommerce_db;
GO

-- 1. Alter Sellers Table to add permissions
-- We use TRY/CATCH or IF EXISTS to ensure it doesn't fail if already added
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[sellers]') AND name = 'can_sell'
)
BEGIN
    ALTER TABLE sellers ADD can_sell BIT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[sellers]') AND name = 'can_offer'
)
BEGIN
    ALTER TABLE sellers ADD can_offer BIT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[sellers]') AND name = 'can_edit_products'
)
BEGIN
    ALTER TABLE sellers ADD can_edit_products BIT NOT NULL DEFAULT 1;
END
GO

-- 2. Create Offers Table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[offers]') AND type in (N'U'))
BEGIN
    CREATE TABLE offers (
        offer_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        seller_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES sellers(seller_id),
        product_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES products(product_id),
        title NVARCHAR(255) NOT NULL,
        discount_type NVARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
        discount_value DECIMAL(10,2) NOT NULL,
        offer_price DECIMAL(10,2), -- Calculated or overridden
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        admin_note NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 3. Add factory_product and is_offer flags to products table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND name = 'is_factory'
)
BEGIN
    ALTER TABLE products ADD is_factory BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND name = 'is_offer'
)
BEGIN
    ALTER TABLE products ADD is_offer BIT NOT NULL DEFAULT 0;
END
GO
