const express = require('express');
const orderRouter = express.Router();
const orderController = require('../../controllers/user/userOrderController');


orderRouter.use((req,res,next)=>{
      res.locals.noHeader = true;
      res.locals.noFooter = false;
      res.locals.isSubheaderHidden = true;
      next()
})


orderRouter.get('/success/:id', orderController.renderOrderSuccessPage);
orderRouter.get('/payment/failed/:id', orderController.renderOrderFailurePage);
orderRouter.get('/payment/success/:id', orderController.renderOrderPyamentSuccessPage);



orderRouter.post('/placeorder', orderController.placeOrder);
orderRouter.post('/payment/retry/:orderId', orderController.retryOrderPayment);
orderRouter.post('/payment/verify', orderController.verifyRazorpayPayment);


orderRouter.post('/:orderId/cancel',  orderController.cancelFullOrder);
orderRouter.post('/:orderId/cancel-item',  orderController.cancelSingleItem);

orderRouter.post('/:orderId/return', orderController.returnFullOrder);
orderRouter.post('/:orderId/return-item', orderController.returnSingleItem);

orderRouter.get('/:orderId/pdf', orderController.getOrderPdf)

module.exports = orderRouter;
