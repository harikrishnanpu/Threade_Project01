const express = require('express');
const { addToCart, getCartCount, renderCartPage, updateCart } = require('../controllers/userCartController');
const cartRouter = express.Router();


cartRouter.get('/', renderCartPage);


cartRouter.get('/api/count', getCartCount);
cartRouter.put('/api/update/:id', updateCart)

cartRouter.post('/api/add/:id', addToCart);


module.exports = cartRouter;



