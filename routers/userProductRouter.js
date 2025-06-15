const express = require('express');
const router = express.Router();
const productController = require('../controllers/userProductController');


router.get('/', productController.getAllProducts);

router.get('/shop', productController.renderShopPage);
router.get('/:id', productController.renderProductById);
router.get('/api/:id', productController.getProductById);

router.get('/tags', productController.getAllTags); 










module.exports = router;