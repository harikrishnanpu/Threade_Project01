const express = require('express');
const orderRouter = express.Router();
const orderController = require('../controllers/userOrderController');

orderRouter.post('/placeorder', orderController.placeOrder); 

orderRouter.post('/:orderId/cancel',  orderController.cancelFullOrder)
orderRouter.post('/:orderId/cancel-items', orderController.cancelMultipleItems)
orderRouter.post('/:orderId/cancel-item',  orderController.cancelSingleItem)

orderRouter.post('/:orderId/return', orderController.returnFullOrder)
orderRouter.post('/:orderId/return-items', orderController.returnMultipleItems)
orderRouter.post('/:orderId/return-item', orderController.returnSingleItem)

module.exports = orderRouter;
