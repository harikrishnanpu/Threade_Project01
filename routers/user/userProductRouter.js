const express = require('express');
const productRouter = express.Router();
const productController = require('../../controllers/user/userProductController');




productRouter.get('/', productController.getAllProducts);
productRouter.get('/shop', productController.renderShopPage);
productRouter.get('/:id', productController.renderProductById);


productRouter.post('/review/add', productController.addReview);
productRouter.delete('/review/delete', productController.deleteReview);

productRouter.get('/api/:id', productController.getProductById);
productRouter.get('/tags', productController.getAllTags); 

module.exports = productRouter;