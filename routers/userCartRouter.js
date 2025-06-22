const express = require('express');
const {  getCartCount, renderCartPage, updateCart, addToCart, renderCheckout, verifyAndRedirectCheckout, applyCoupon, createCheckoutSession, renderPaymentPage, getCheckoutSession} = require('../controllers/userCartController');
const { checkCartExists, checkIsCheckoutSessionExists } = require('../middlewares/userCartMiddleWares');
const cartRouter = express.Router();


cartRouter.get('/', renderCartPage);
cartRouter.get('/checkout',checkCartExists, renderCheckout);
cartRouter.get('/payment',checkIsCheckoutSessionExists, renderPaymentPage);

cartRouter.get('/api/count', getCartCount);
cartRouter.get('/api/checkout/session', getCheckoutSession)

cartRouter.post('/api/verify/checkout', verifyAndRedirectCheckout);
cartRouter.post('/api/add/:id', addToCart);
cartRouter.put('/api/update/:id', updateCart);
cartRouter.post('/coupons/apply', applyCoupon);
cartRouter.post('/draft/checkout', createCheckoutSession)


module.exports = cartRouter;



