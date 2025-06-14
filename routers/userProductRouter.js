const express = require('express');
const router = express.Router();
const productController = require('../controllers/userProductController');


router.get('/', productController.getAllProducts);

router.get('/shop', productController.renderShopPage);
router.get('/:id', productController.renderProductById);
router.get('/api/:id', productController.getProductById);

router.get('/tags', productController.getAllTags); 


router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);

router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/brand/:brandId', productController.getProductsByBrand);


router.get('/search/:keyword', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);

router.get('/new', productController.getNewProducts);



module.exports = router;