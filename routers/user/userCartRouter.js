const express = require('express');
const {  getCartCount, renderCartPage, updateCart, addToCart, renderCheckout, verifyAndRedirectCheckout, applyCoupon, createCheckoutSession, renderPaymentPage, getCheckoutSession, getAllCouponsAvailable} = require('../../controllers/user/userCartController');
const { checkCartExists, checkIsCheckoutSessionExists } = require('../../middlewares/userCartMiddleWares');
const cartRouter = express.Router();



cartRouter.use((req,res,next)=>{
    res.locals.isSubheaderHidden = true;
    next();
})

cartRouter.get('/', renderCartPage);
cartRouter.get('/checkout',checkCartExists, renderCheckout);
cartRouter.get('/payment',checkIsCheckoutSessionExists, renderPaymentPage);

cartRouter.get('/api/count', getCartCount);
cartRouter.get('/api/checkout/session', getCheckoutSession);
cartRouter.get('/api/coupons/', getAllCouponsAvailable);


cartRouter.post('/api/verify/checkout', verifyAndRedirectCheckout);
cartRouter.post('/api/add/:id', addToCart);
cartRouter.put('/api/update/:id', updateCart);

cartRouter.post('/coupons/apply', applyCoupon);
cartRouter.post('/draft/checkout', createCheckoutSession)


module.exports = cartRouter;



