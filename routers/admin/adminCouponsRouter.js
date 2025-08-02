const express = require('express');
const couponRouter = express.Router();
const couponController = require('../../controllers/admin/adminCopounController');


couponRouter.get('/', couponController.renderAllCoupons);
couponRouter.get('/api/coupon/:id', couponController.getCouponById);

couponRouter.get('/api/filtered/all', couponController.getAllCouponsList)

couponRouter.post('/create', couponController.createCoupon);
couponRouter.put('/update/:id', couponController.updateCoupon);
couponRouter.patch('/toggle-status/:id', couponController.toggleCouponStatus);


module.exports = couponRouter;
