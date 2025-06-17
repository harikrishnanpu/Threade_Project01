const express = require('express');
const { addToCart, getCartCount, renderCartPage, updateCart } = require('../controllers/userCartController');
const cartRouter = express.Router();


cartRouter.get('/', renderCartPage);

cartRouter.get('/api/count/:id', getCartCount);
cartRouter.post('/api/add/:id', addToCart);


module.exports = cartRouter;



