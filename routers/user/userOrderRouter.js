const express = require('express');
const orderRouter = express.Router();
const orderController = require('../../controllers/user/userOrderController');

orderRouter.get('/success/:id', orderController.renderOrderSuccessPage)

orderRouter.post('/placeorder', orderController.placeOrder); 

orderRouter.post('/:orderId/cancel',  orderController.cancelFullOrder)
orderRouter.post('/:orderId/cancel-item',  orderController.cancelSingleItem)

orderRouter.post('/:orderId/return', orderController.returnFullOrder)
orderRouter.post('/:orderId/return-item', orderController.returnSingleItem)

module.exports = orderRouter;
