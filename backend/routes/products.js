const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// GET /api/products - List products with pagination, filters
router.get('/', productController.getProducts);

// POST /api/products - Create product (Admin & Seller role)
router.post('/', verifyToken, checkRole(['admin', 'seller']), productController.createProduct);

// GET /api/products/:slug - Get single product detail
router.get('/:slug', productController.getProductBySlug);

// GET /api/products/:id/related - Get related products
router.get('/:id/related', productController.getRelatedProducts);

// GET /api/categories - Get nested category tree
router.get('/categories', productController.getCategories);

// GET /api/categories/:slug/products - Products by category
router.get('/categories/:slug', productController.getProductsByCategory);

// GET /api/search?q=keyword - Search products with T-SQL LIKE
router.get('/search', productController.searchProducts);

// GET /api/search/suggest - Autocomplete suggestions
router.get('/search/suggest', productController.getSearchSuggestions);

module.exports = router;
