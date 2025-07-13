const express = require('express');
const adminOrderRouter = express.Router();
const orderController = require('../../controllers/admin/adminOrderController');

adminOrderRouter.get('/', orderController.getAllOrders);
adminOrderRouter.get('/:orderId', orderController.renderOrderDetail);
adminOrderRouter.get('/:orderId/invoice', orderController.renderInvoice);

adminOrderRouter.get('/api/order/:orderId', orderController.getOneOrder);

adminOrderRouter.post('/update-status', orderController.updateOrderStatus);

adminOrderRouter.post('/:orderId/status', orderController.orderDetailsStatusUpdate);

adminOrderRouter.put('/:orderId/update', orderController.updateFullOrder);

adminOrderRouter.post('/:id/return-request-action', orderController.returnRequestAction);

adminOrderRouter.get('/:orderId/pdf', orderController.getOrderPdf)





module.exports = adminOrderRouter;
