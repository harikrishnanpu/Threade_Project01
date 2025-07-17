const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/adminCopounController');


router.get('/', couponController.renderAllCoupons);
router.get('/api/coupon/:id', couponController.getCouponById);

router.get('/api/filtered/all', couponController.getAllCouponsList)

router.post('/create', couponController.createCoupon);
router.put('/update/:id', couponController.updateCoupon);

module.exports = router;
