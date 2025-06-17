const express = require('express');
const { addToCart, getCartCount, renderCartPage } = require('../controllers/userCartController');
const cartRouter = express.Router();


cartRouter.get('/:id', renderCartPage);


cartRouter.get('/api/count/:id', getCartCount);
cartRouter.put('/api/update/:id', )

cartRouter.post('/api/add/:id', addToCart);


module.exports = cartRouter;



